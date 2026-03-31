import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users, Key, LogIn, Plus, Copy, Check, ShieldAlert, Globe, ExternalLink,
  Lock, Unlock, Save, FolderOpen, Clock, AlertCircle, HardDrive,
  UserMinus, Crown, Timer, UserPlus, UserX, ArrowRightLeft, Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { socketService } from '../services/socketService';

// ─── Simple IndexedDB key-value helper ───────────────────────────────────────
function openCollabDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('nexus_collab_backups', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('backups');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveBackup(key: string, data: any): Promise<void> {
  const db = await openCollabDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('backups', 'readwrite');
    tx.objectStore('backups').put(data, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadBackup(key: string): Promise<any | null> {
  const db = await openCollabDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('backups', 'readonly');
    const req = tx.objectStore('backups').get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function loadAllBackupKeys(): Promise<string[]> {
  const db = await openCollabDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('backups', 'readonly');
    const req = tx.objectStore('backups').getAllKeys();
    req.onsuccess = () => resolve(req.result as string[]);
    req.onerror = () => reject(req.error);
  });
}

/** Delete a single backup by key. */
async function deleteBackup(key: string): Promise<void> {
  const db = await openCollabDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('backups', 'readwrite');
    tx.objectStore('backups').delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface CollabFileEntry {
  name: string;
  content: string;
  lastModified: number;
}

interface CollabBackup {
  sessionId: string;
  files: CollabFileEntry[];
  timestamp: number;
  participants: string[];
  hostId: string;
  label?: string;
}

interface Participant {
  id: string;
  displayName?: string;
  isHost?: boolean;
  joinedAt?: number;
}

interface CollaborationViewProps {
  sessionId: string | null;
  isJoining: boolean;
  joinId: string;
  setJoinId: (id: string) => void;
  onCreateSession: (passwordHash?: string) => void;
  onJoinSession: (e: React.FormEvent) => void;
  onHostProject: () => void;
  hostedUrl: string | null;
  /** Current workspace files – needed for backup. */
  files?: { name: string; content: string }[];
  /** Restore files from a backup snapshot. */
  onRestoreFiles?: (files: { name: string; content: string }[]) => void;
}

// Generate a simple random user ID that persists in this session.
function generateLocalUserId(): string {
  let id = sessionStorage.getItem('nexus_collab_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem('nexus_collab_user_id', id);
  }
  return id;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CollaborationView({
  sessionId,
  isJoining,
  joinId,
  setJoinId,
  onCreateSession,
  onJoinSession,
  onHostProject,
  hostedUrl,
  files = [],
  onRestoreFiles,
}: CollaborationViewProps) {
  // ── Local identity ──────────────────────────────────────────────────────
  const localUserId = useRef(generateLocalUserId());

  // ── Clipboard copy ────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Password protection state ─────────────────────────────────────────────
  const [isLocked, setIsLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // ── Create-session password state ────────────────────────────────────────
  const [createPassword, setCreatePassword] = useState('');
  const [createPasswordError, setCreatePasswordError] = useState('');

  // ── Join-password state (visitor side) ────────────────────────────────────
  const [joinPasswordPrompt, setJoinPasswordPrompt] = useState(false);
  const [joinPasswordInput, setJoinPasswordInput] = useState('');
  const [joinPasswordError, setJoinPasswordError] = useState('');
  const [internalJoinId, setInternalJoinId] = useState('');
  const [isInternalJoining, setIsInternalJoining] = useState(false);

  // ── Participant management state ──────────────────────────────────────────
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isHost, setIsHost] = useState(true); // default true — we created the session
  const [hostId, setHostId] = useState<string>(localUserId.current);

  // ── Session timeout state ─────────────────────────────────────────────────
  const [sessionTimeout, setSessionTimeout] = useState<number>(30); // minutes

  // ── Backup state ──────────────────────────────────────────────────────────
  const [lastBackupTime, setLastBackupTime] = useState<number | null>(null);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [showBackupList, setShowBackupList] = useState(false);
  const [availableBackups, setAvailableBackups] = useState<{ key: string; label: string; timestamp: number; participantCount: number }[]>([]);
  const autoBackupRef = useRef<NodeJS.Timeout | null>(null);

  // ── Read localStorage settings on mount ───────────────────────────────────
  useEffect(() => {
    const timeout = localStorage.getItem('nexus_collab_timeout');
    if (timeout) setSessionTimeout(parseInt(timeout, 10) || 30);
  }, []);

  // ── Socket message listener for auth + participant + kick + transfer ─────
  useEffect(() => {
    const unsubscribe = socketService.subscribe((msg) => {
      if (msg.type === 'auth-failed') {
        setJoinPasswordError('Incorrect password. Access denied.');
        setIsInternalJoining(false);
      } else if (msg.type === 'session:joined') {
        setIsInternalJoining(false);
        setJoinPasswordPrompt(false);
        setJoinPasswordInput('');
        setJoinPasswordError('');
        // If server sends participant list on join, populate it
        if (msg.participants) {
          setParticipants(msg.participants);
        }
        if (msg.hostId) {
          setHostId(msg.hostId);
          setIsHost(msg.hostId === localUserId.current);
        }
      } else if (msg.type === 'session:password_required') {
        // Server told us password is needed — show the prompt dialog
        setJoinPasswordPrompt(true);
        setJoinPasswordError('This session requires a password to join.');
        setIsInternalJoining(false);
      } else if (msg.type === 'session:participant_joined') {
        const p = msg.participant as Participant | undefined;
        if (p && !participants.find(ep => ep.id === p.id)) {
          setParticipants(prev => [...prev, p]);
        }
      } else if (msg.type === 'session:participant_left') {
        setParticipants(prev => prev.filter(p => p.id !== msg.participantId));
      } else if (msg.type === 'session:kicked') {
        // We were kicked
        setParticipants(prev => prev.filter(p => p.id !== msg.participantId));
      } else if (msg.type === 'session:host_transferred') {
        setHostId(msg.newHostId);
        setIsHost(msg.newHostId === localUserId.current);
        setParticipants(prev => prev.map(p =>
          p.id === msg.newHostId ? { ...p, isHost: true } : { ...p, isHost: false }
        ));
      } else if (msg.type === 'session:info') {
        if (msg.participants) setParticipants(msg.participants);
        if (msg.hostId) {
          setHostId(msg.hostId);
          setIsHost(msg.hostId === localUserId.current);
        }
        if (msg.timeoutMinutes) setSessionTimeout(msg.timeoutMinutes);
        if (msg.locked !== undefined) setIsLocked(msg.locked);
      } else if (msg.type === 'session:timeout') {
        if (msg.timeoutMinutes) setSessionTimeout(msg.timeoutMinutes);
      } else if (msg.type === 'session:password-valid') {
        // Server confirmed password is valid — can be used by the validation flow
      } else if (msg.type === 'session:password-invalid') {
        // Server rejected password — can be used by the validation flow
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants]);

  // ── Load last backup timestamp on mount / session change ──────────────────
  useEffect(() => {
    if (!sessionId) return;
    const key = `nexus_collab_backup_${sessionId}`;
    loadBackup(key).then((backup: CollabBackup | null) => {
      if (backup?.timestamp) setLastBackupTime(backup.timestamp);
    }).catch(() => {});
  }, [sessionId]);

  // ── Auto-backup every 60 seconds during active session ────────────────────
  useEffect(() => {
    if (!sessionId || files.length === 0) {
      if (autoBackupRef.current) {
        clearInterval(autoBackupRef.current);
        autoBackupRef.current = null;
      }
      return;
    }

    autoBackupRef.current = setInterval(() => {
      performBackup(true);
    }, 60000);

    return () => {
      if (autoBackupRef.current) clearInterval(autoBackupRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, files]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const performBackup = useCallback(async (silent = false) => {
    if (!sessionId || files.length === 0) return;
    const now = Date.now();
    const backup: CollabBackup = {
      sessionId,
      files: files.map(f => ({
        name: f.name,
        content: f.content,
        lastModified: now,
      })),
      timestamp: now,
      participants: participants.map(p => p.id),
      hostId,
    };
    await saveBackup(`nexus_collab_backup_${sessionId}`, backup);
    setLastBackupTime(backup.timestamp);
    if (!silent) {
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 2000);
    }
  }, [sessionId, files, participants, hostId]);

  const handleRestore = useCallback(async (backup: CollabBackup) => {
    if (onRestoreFiles && backup.files.length > 0) {
      // Restore files — use lastModified for conflict resolution ordering
      const sortedFiles = [...backup.files].sort((a, b) => b.lastModified - a.lastModified);
      onRestoreFiles(sortedFiles.map(f => ({ name: f.name, content: f.content })));
      setRestoreSuccess(true);
      setTimeout(() => setRestoreSuccess(false), 2000);
    }
  }, [onRestoreFiles]);

  const handleShowBackupList = useCallback(async () => {
    const allKeys = await loadAllBackupKeys();
    const entries: { key: string; label: string; timestamp: number; participantCount: number }[] = [];
    for (const key of allKeys) {
      const backup = await loadBackup(key);
      if (backup) {
        entries.push({
          key,
          label: `${backup.sessionId || key}`,
          timestamp: backup.timestamp,
          participantCount: backup.participants?.length || 0,
        });
      }
    }
    entries.sort((a, b) => b.timestamp - a.timestamp);
    setAvailableBackups(entries);
    setShowBackupList(true);
  }, []);

  const handleDeleteBackup = useCallback(async (key: string) => {
    await deleteBackup(key);
    setAvailableBackups(prev => prev.filter(b => b.key !== key));
  }, []);

  // ── Create session with optional password ─────────────────────────────────
  const handleCreateWithPassword = async () => {
    const passwordEnabled = localStorage.getItem('nexus_collab_password_enabled') === 'true';
    const minChars = 4;

    if (passwordEnabled && createPassword.length < minChars) {
      setCreatePasswordError('Password must be at least 4 characters.');
      return;
    }

    let hash: string | undefined;
    if (createPassword.length >= minChars) {
      hash = await socketService.hashPassword(createPassword);
      await socketService.setSessionPassword(createPassword);
      setIsLocked(true);
    }

    // Pass the password hash to the parent's createSession handler so the
    // session:create message includes the hash from the very start.
    onCreateSession(hash);

    setCreatePassword('');
    setCreatePasswordError('');
  };

  // ── Password: Lock / Unlock session ───────────────────────────────────────
  const handleToggleLock = async () => {
    if (isLocked) {
      socketService.clearSessionPassword();
      setIsLocked(false);
      setPasswordInput('');
      setPasswordError('');
      socketService.send({ type: 'session:unlock', sessionId });
    } else {
      setIsSettingPassword(true);
      setPasswordError('');
    }
  };

  const handleConfirmPassword = async () => {
    if (passwordInput.length < 4) {
      setPasswordError('Password must be at least 4 characters.');
      return;
    }
    const hash = await socketService.setSessionPassword(passwordInput);
    setIsLocked(true);
    setIsSettingPassword(false);
    setPasswordInput('');
    setPasswordError('');
    socketService.send({ type: 'session:lock', sessionId, password_hash: hash });
  };

  // ── Participant management ────────────────────────────────────────────────
  const handleKickParticipant = (participantId: string) => {
    if (!sessionId || !isHost) return;
    socketService.kickParticipant(sessionId, participantId);
    // Optimistic update
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  };

  const handleTransferHost = (newHostId: string) => {
    if (!sessionId || !isHost || newHostId === hostId) return;
    socketService.transferHost(sessionId, newHostId);
    // Optimistic update
    setHostId(newHostId);
    setIsHost(false);
    setParticipants(prev => prev.map(p =>
      p.id === newHostId ? { ...p, isHost: true } : { ...p, isHost: false }
    ));
  };

  // ── Server-side password validation ────────────────────────────────────────
  const validateSessionPassword = useCallback(async (passwordHash: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const currentSessionId = sessionId || internalJoinId;
      if (!currentSessionId) {
        resolve(false);
        return;
      }

      // Send the validation request via WebSocket
      socketService.validatePassword(currentSessionId, passwordHash);

      // Set up a one-time listener for the response
      const unsubscribe = socketService.subscribe((msg) => {
        if (msg.type === 'session:password-valid' && msg.sessionId === currentSessionId) {
          unsubscribe();
          resolve(true);
        } else if (msg.type === 'session:password-invalid' && msg.sessionId === currentSessionId) {
          unsubscribe();
          resolve(false);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, 10000);
    });
  }, [sessionId, internalJoinId]);

  // ── Join with password ────────────────────────────────────────────────────
  const handleInternalJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalJoinId.trim()) return;
    setJoinPasswordPrompt(true);
    setJoinPasswordInput('');
    setJoinPasswordError('');
  };

  const handleJoinWithPassword = async () => {
    if (joinPasswordInput.length < 1) {
      setJoinPasswordError('Please enter the session password.');
      return;
    }
    setIsInternalJoining(true);
    setJoinPasswordError('');
    const hash = await socketService.hashPassword(joinPasswordInput);
    socketService.requestJoin(internalJoinId.toUpperCase(), hash);
  };

  // ── Send session timeout update ───────────────────────────────────────────
  const handleUpdateTimeout = () => {
    if (!sessionId) return;
    localStorage.setItem('nexus_collab_timeout', String(sessionTimeout));
    socketService.sendSessionTimeout(sessionId, sessionTimeout);
  };

  // ── Format timestamp ──────────────────────────────────────────────────────
  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Collaboration</h2>

        {sessionId ? (
          /* ═══════════ ACTIVE SESSION ═══════════ */
          <div className="space-y-4">
            {/* Session ID Card */}
            <div className="p-3 bg-emerald-900/10 border border-emerald-500/20 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Users size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Active Session</span>
                </div>
                {isLocked && (
                  <div className="flex items-center gap-1 text-amber-400">
                    <Lock size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Locked</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between bg-nexus-bg p-2 rounded-lg border border-nexus-border shadow-inner">
                <code className="text-sm font-mono text-white font-bold">{sessionId}</code>
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-nexus-sidebar rounded-md text-nexus-text-muted transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-nexus-text-muted mt-2 leading-relaxed">
                Share this code with a friend to start coding together in real-time.
              </p>
            </div>

            {/* ── Participants Panel ── */}
            <div className="p-3 bg-nexus-bg border border-nexus-border rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-nexus-text-muted">
                  <Users size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Participants ({participants.length})
                  </span>
                </div>
                {isHost && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Crown size={9} />
                    Host
                  </span>
                )}
              </div>

              {/* Self participant (always first) */}
              <div className="flex items-center justify-between p-2 bg-emerald-900/10 border border-emerald-500/10 rounded-lg mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-nexus-accent/20 border border-nexus-accent/40 flex items-center justify-center text-[9px] font-bold text-nexus-accent shrink-0">
                    Y
                  </div>
                  <span className="text-[11px] text-white truncate font-medium">You</span>
                  {isHost && <Crown size={10} className="text-amber-400 shrink-0" />}
                </div>
                <span className="text-[9px] text-emerald-400 shrink-0">Online</span>
              </div>

              {/* Other participants */}
              {participants.length > 0 && participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-nexus-bg border border-nexus-border rounded-lg mb-1.5 hover:border-nexus-accent/30 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-nexus-border flex items-center justify-center text-[9px] font-bold text-nexus-text-muted shrink-0">
                      {(p.displayName || p.id).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[11px] text-white truncate">
                      {p.displayName || p.id}
                    </span>
                    {p.isHost && <Crown size={10} className="text-amber-400 shrink-0" />}
                  </div>
                  {isHost && (
                    <div className="flex items-center gap-1 shrink-0">
                      {!p.isHost && (
                        <>
                          <button
                            onClick={() => handleTransferHost(p.id)}
                            title="Transfer host role"
                            className="p-1 hover:bg-amber-900/30 rounded text-amber-400 transition-colors"
                          >
                            <Crown size={11} />
                          </button>
                          <button
                            onClick={() => handleKickParticipant(p.id)}
                            title="Kick participant"
                            className="p-1 hover:bg-red-900/30 rounded text-red-400 transition-colors"
                          >
                            <UserMinus size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {participants.length === 0 && (
                <p className="text-[10px] text-nexus-text-muted text-center py-2">
                  Waiting for others to join...
                </p>
              )}
            </div>

            {/* ── Password Protection Controls ── */}
            <div className={cn(
              "p-3 rounded-xl shadow-sm border",
              isLocked
                ? "bg-amber-900/10 border-amber-500/20"
                : "bg-nexus-bg border-nexus-border"
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
                  isLocked ? "text-amber-400" : "text-nexus-text-muted"
                )}>
                  {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  {isLocked ? '🔒 Session Locked' : '🔓 Session Open'}
                </div>
                <button
                  onClick={handleToggleLock}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5",
                    isLocked
                      ? "bg-nexus-bg hover:bg-nexus-border text-amber-400 border border-nexus-border"
                      : "bg-nexus-accent hover:bg-nexus-accent/80 text-white"
                  )}
                >
                  {isLocked ? <Unlock size={12} /> : <Lock size={12} />}
                  {isLocked ? 'Unlock' : '🔒 Lock Session'}
                </button>
              </div>

              {isLocked && !isSettingPassword && (
                <p className="text-[10px] text-amber-500/70 leading-relaxed">
                  This session is password-protected. Visitors must enter the password to join.
                </p>
              )}

              {/* Set password form (when toggling lock ON) */}
              {isSettingPassword && (
                <div className="mt-2 space-y-2">
                  <input
                    type="password"
                    placeholder="Set session password (min 4 chars)"
                    value={passwordInput}
                    onChange={e => { setPasswordInput(e.target.value); setPasswordError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleConfirmPassword()}
                    className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-xs outline-none focus:border-nexus-accent text-white shadow-inner"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle size={10} />
                      {passwordError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmPassword}
                      className="flex-1 bg-nexus-accent hover:bg-nexus-accent/80 text-white py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => { setIsSettingPassword(false); setPasswordInput(''); setPasswordError(''); }}
                      className="flex-1 bg-nexus-bg hover:bg-nexus-border text-white py-2 rounded-lg text-[10px] font-bold transition-all border border-nexus-border uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Session Timeout Card ── */}
            <div className="p-3 bg-nexus-bg border border-nexus-border rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-nexus-text-muted mb-2">
                <Timer size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Session Timeout</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={sessionTimeout}
                  onChange={e => setSessionTimeout(parseInt(e.target.value, 10) || 30)}
                  className="w-20 bg-nexus-bg border border-nexus-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-nexus-accent text-white text-center shadow-inner"
                />
                <span className="text-[10px] text-nexus-text-muted">minutes</span>
                <button
                  onClick={handleUpdateTimeout}
                  className="ml-auto px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-nexus-accent hover:bg-nexus-accent/80 text-white transition-all"
                >
                  Save
                </button>
              </div>
              <p className="text-[10px] text-nexus-text-muted mt-1.5 leading-relaxed flex items-center gap-1">
                <Info size={9} />
                Session auto-wipes after inactivity.
              </p>
            </div>

            {/* ── Self-Hosting Card ── */}
            <div className="p-3 bg-nexus-accent/10 border border-nexus-accent/20 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-nexus-accent mb-2">
                <Globe size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Self-Hosting</span>
              </div>
              {hostedUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-nexus-bg p-2 rounded-lg border border-nexus-border shadow-inner">
                    <span className="text-[10px] font-mono text-nexus-accent truncate max-w-[140px] font-bold">{hostedUrl}</span>
                    <a
                      href={hostedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-nexus-sidebar rounded-md text-nexus-text-muted transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <button
                    onClick={onHostProject}
                    className="w-full bg-nexus-bg hover:bg-nexus-bg/80 text-white py-1.5 rounded-lg text-[10px] font-bold transition-all border border-nexus-border uppercase tracking-widest"
                  >
                    Update Hosted Site
                  </button>
                </div>
              ) : (
                <button
                  onClick={onHostProject}
                  className="w-full bg-nexus-accent hover:bg-nexus-accent/80 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-nexus-accent/20 uppercase tracking-widest"
                >
                  <Globe size={14} />
                  Host Project Online
                </button>
              )}
              <p className="text-[10px] text-nexus-text-muted mt-2 leading-tight">
                Make your project accessible via a public URL.
              </p>
            </div>

            {/* ── Workspace Backup ── */}
            <div className="p-3 bg-nexus-bg border border-nexus-border rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-nexus-text-muted mb-2">
                <HardDrive size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Workspace Backup</span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => performBackup(false)}
                  disabled={files.length === 0}
                  className={cn(
                    "w-full py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-widest",
                    backupSuccess
                      ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/20"
                      : "bg-nexus-bg hover:bg-nexus-border text-white border border-nexus-border",
                    files.length === 0 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {backupSuccess ? <Check size={12} /> : <Save size={12} />}
                  {backupSuccess ? 'Saved!' : '💾 Save Collab Workspace'}
                </button>

                <button
                  onClick={handleShowBackupList}
                  className="w-full bg-nexus-bg hover:bg-nexus-border text-white py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 border border-nexus-border uppercase tracking-widest"
                >
                  <FolderOpen size={12} />
                  📂 Load Collab Workspace
                </button>

                {lastBackupTime && (
                  <div className="flex items-center gap-1 text-[10px] text-nexus-text-muted">
                    <Clock size={10} />
                    <span>Last backup: {formatTime(lastBackupTime)} (auto-saves every 60s)</span>
                  </div>
                )}

                {restoreSuccess && (
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Check size={10} />
                    Workspace restored successfully.
                  </p>
                )}
              </div>
            </div>

            {/* Auto-wipe notice */}
            <div className="p-3 bg-amber-900/10 border border-amber-500/20 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <ShieldAlert size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Wipe Active</span>
              </div>
              <p className="text-[10px] text-amber-500/70 leading-relaxed">
                Workspace will be wiped after {sessionTimeout} minutes of total inactivity for security.
              </p>
            </div>
          </div>
        ) : (
          /* ═══════════ NO ACTIVE SESSION ═══════════ */
          <div className="space-y-6">
            {/* Create session */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Start a Session</h3>

              {/* Optional password field */}
              {localStorage.getItem('nexus_collab_password_enabled') === 'true' && (
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-text-muted" />
                  <input
                    type="password"
                    placeholder="Session password (optional)"
                    value={createPassword}
                    onChange={e => { setCreatePassword(e.target.value); setCreatePasswordError(''); }}
                    className="w-full bg-nexus-bg border border-nexus-border rounded-lg pl-10 pr-3 py-2.5 text-xs outline-none focus:border-nexus-accent text-white shadow-inner"
                  />
                </div>
              )}

              {createPasswordError && (
                <p className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertCircle size={10} />
                  {createPasswordError}
                </p>
              )}

              <button
                onClick={handleCreateWithPassword}
                className="w-full bg-nexus-accent hover:bg-nexus-accent/80 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-nexus-accent/20 uppercase tracking-widest"
              >
                <Plus size={16} />
                Generate Session Key
              </button>
            </div>

            {/* Join session (using internal state since parent stubs are no-ops) */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Join a Session</h3>
              <form onSubmit={handleInternalJoin} className="space-y-2">
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-text-muted" />
                  <input
                    type="text"
                    placeholder="Enter Session Key"
                    value={internalJoinId}
                    onChange={e => setInternalJoinId(e.target.value.toUpperCase())}
                    className="w-full bg-nexus-bg border border-nexus-border rounded-lg pl-10 pr-3 py-2.5 text-xs outline-none focus:border-nexus-accent text-white font-mono uppercase font-bold shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!internalJoinId.trim()}
                  className="w-full bg-nexus-bg hover:bg-nexus-bg/80 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-nexus-border disabled:opacity-50 uppercase tracking-widest"
                >
                  <LogIn size={16} />
                  Join Session
                </button>
              </form>
            </div>

            {/* Restore backup on reconnect */}
            {internalJoinId.trim() && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Quick Actions</h3>
                <button
                  onClick={async () => {
                    const key = `nexus_collab_backup_${internalJoinId.toUpperCase()}`;
                    const backup = await loadBackup(key);
                    if (backup) {
                      handleRestore(backup);
                    }
                  }}
                  className="w-full bg-nexus-bg hover:bg-nexus-border text-white py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 border border-nexus-border uppercase tracking-widest"
                >
                  <FolderOpen size={12} />
                  Restore Backup for {internalJoinId || '...'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Password Prompt Dialog ── */}
      {joinPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-nexus-sidebar border border-nexus-border rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Lock size={20} className="text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Password Required</h3>
            </div>
            <p className="text-[11px] text-nexus-text-muted leading-relaxed">
              This session is locked. Enter the password provided by the host to join.
            </p>
            <input
              type="password"
              placeholder="Enter session password"
              value={joinPasswordInput}
              onChange={e => { setJoinPasswordInput(e.target.value); setJoinPasswordError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleJoinWithPassword()}
              className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2.5 text-xs outline-none focus:border-nexus-accent text-white shadow-inner"
              autoFocus
            />
            {joinPasswordError && (
              <p className="text-[10px] text-red-400 flex items-center gap-1">
                <AlertCircle size={10} />
                {joinPasswordError}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleJoinWithPassword}
                disabled={isInternalJoining}
                className="flex-1 bg-nexus-accent hover:bg-nexus-accent/80 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest"
              >
                {isInternalJoining ? (
                  <span className="animate-pulse">Authenticating…</span>
                ) : (
                  <>
                    <Key size={12} />
                    Authenticate
                  </>
                )}
              </button>
              <button
                onClick={() => { setJoinPasswordPrompt(false); setJoinPasswordInput(''); setJoinPasswordError(''); setIsInternalJoining(false); }}
                disabled={isInternalJoining}
                className="flex-1 bg-nexus-bg hover:bg-nexus-border text-white py-2.5 rounded-lg text-xs font-bold transition-all border border-nexus-border uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Backup List Modal ── */}
      {showBackupList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-nexus-sidebar border border-nexus-border rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <FolderOpen size={18} className="text-nexus-accent" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Collab Backups</h3>
              </div>
              <button
                onClick={() => setShowBackupList(false)}
                className="p-1.5 hover:bg-nexus-border rounded-md text-nexus-text-muted transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-96">
              {availableBackups.length === 0 ? (
                <p className="text-[11px] text-nexus-text-muted text-center py-8">
                  No collab backups found.
                </p>
              ) : (
                availableBackups.map(backup => (
                  <div
                    key={backup.key}
                    className="flex items-center gap-2 p-3 bg-nexus-bg border border-nexus-border rounded-lg hover:border-nexus-accent/30 transition-all"
                  >
                    <button
                      onClick={async () => {
                        const data = await loadBackup(backup.key);
                        if (data) {
                          handleRestore(data);
                          setShowBackupList(false);
                        }
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-xs font-mono text-white font-bold">{backup.label}</code>
                        <span className="text-[10px] text-nexus-text-muted">
                          {new Date(backup.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-nexus-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={9} />
                          {formatTime(backup.timestamp)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={9} />
                          {backup.participantCount} participant{backup.participantCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={async (e) => { e.stopPropagation(); await handleDeleteBackup(backup.key); }}
                      title="Delete backup"
                      className="p-1.5 hover:bg-red-900/30 rounded-md text-red-400 transition-colors shrink-0"
                    >
                      <UserX size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── How it works ── */}
      <div className="flex-1 p-4 overflow-y-auto bg-nexus-sidebar">
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">How it works</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-nexus-bg border border-nexus-border flex items-center justify-center text-[10px] font-bold shrink-0 text-nexus-accent shadow-sm">1</div>
              <p className="text-[11px] text-nexus-text-muted leading-relaxed">Generate a one-time key or enter a friend's key to connect.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-nexus-bg border border-nexus-border flex items-center justify-center text-[10px] font-bold shrink-0 text-nexus-accent shadow-sm">2</div>
              <p className="text-[11px] text-nexus-text-muted leading-relaxed">Collaborate in real-time on any file in the workspace with low latency.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-nexus-bg border border-nexus-border flex items-center justify-center text-[10px] font-bold shrink-0 text-nexus-accent shadow-sm">3</div>
              <p className="text-[11px] text-nexus-text-muted leading-relaxed">Progress is synced automatically across all participants via Nexus Cloud.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-nexus-bg border border-nexus-border flex items-center justify-center text-[10px] font-bold shrink-0 text-nexus-accent shadow-sm">4</div>
              <p className="text-[11px] text-nexus-text-muted leading-relaxed">Lock your session with a password for extra security. Auto-backup every 60s. Host can kick or transfer role.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-nexus-bg border border-nexus-border flex items-center justify-center text-[10px] font-bold shrink-0 text-nexus-accent shadow-sm">5</div>
              <p className="text-[11px] text-nexus-text-muted leading-relaxed">Backups include files, participants, and per-file conflict timestamps for safe restore.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="p-4 border-t border-nexus-border bg-nexus-bg">
        <p className="text-[10px] text-nexus-text-muted leading-relaxed italic text-center font-bold tracking-wider">
          NEXUS 5.5 COLLABORATION ENGINE
        </p>
      </div>
    </div>
  );
}
