import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { v86Service, V86Status } from '../services/v86Service';
import type { SyncStats } from '../services/fileBridgeService';
import { fileBridgeService } from '../services/fileBridgeService';
import {
  Play,
  Square,
  Pause,
  SkipForward,
  Save,
  Maximize2,
  Minimize2,
  Loader2,
  Monitor,
  X,
  RotateCw,
  Upload,
  Download,
  Package,
  FolderTree,
  ChevronRight,
  RefreshCw,
  HardDrive,
  ToggleLeft,
  Terminal as TerminalIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface LinuxTerminalProps {
  onClose?: () => void;
  onFullscreen?: () => void;
  files?: Array<{ name: string; content: string }>;
  onPullFiles?: (files: Array<{ name: string; content: string }>) => void;
  showFileBrowser?: boolean;
  showPackageManager?: boolean;
}

type TerminalMode = 'serial' | 'screen';

type BootPhase = 'idle' | 'loading-image' | 'configuring' | 'booting' | 'running' | 'error';

interface AlpineFileEntry {
  name: string;
  type: 'file' | 'dir';
  size: number;
}

interface PackageManagerInfo {
  installed: string[];
  installing: string | null;
  removing: string | null;
  refreshing: boolean;
  error: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const COMMON_PACKAGES = [
  { name: 'git', description: 'Version control' },
  { name: 'python3', description: 'Python interpreter' },
  { name: 'nodejs', description: 'Node.js runtime' },
  { name: 'vim', description: 'Vi improved editor' },
  { name: 'htop', description: 'Process monitor' },
  { name: 'curl', description: 'HTTP client' },
  { name: 'nano', description: 'Nano editor' },
  { name: 'openssh', description: 'SSH client/server' },
  { name: 'build-base', description: 'C/C++ toolchain' },
  { name: 'alpine-sdk', description: 'Alpine SDK' },
];

const VM_MEMORY_MB = 128;
const AUTO_SAVE_INTERVAL_MS = 60_000;

// ─── xterm.js Theme ────────────────────────────────────────────────────────────

const XTERM_THEME = {
  background: '#0a0a0f',
  foreground: '#d4d4d8',
  cursor: '#00ff41',
  cursorAccent: '#0a0a0f',
  selectionBackground: 'rgba(0, 255, 65, 0.2)',
  selectionForeground: '#ffffff',
  black: '#0a0a0f',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  blue: '#3b82f6',
  magenta: '#a855f7',
  cyan: '#06b6d4',
  white: '#d4d4d8',
  brightBlack: '#52525b',
  brightRed: '#f87171',
  brightGreen: '#4ade80',
  brightYellow: '#facc15',
  brightBlue: '#60a5fa',
  brightMagenta: '#c084fc',
  brightCyan: '#22d3ee',
  brightWhite: '#fafafa',
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function LinuxTerminal({
  onClose,
  onFullscreen,
  files = [],
  onPullFiles,
  showFileBrowser = true,
  showPackageManager = true,
}: LinuxTerminalProps) {
  // ── Refs ─────────────────────────────────────────────────────────────────────
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const screenContainerRef = useRef<HTMLDivElement>(null);
  const unsubOutputRef = useRef<(() => void) | null>(null);
  const unsubScreenRef = useRef<(() => void) | null>(null);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const currentInputRef = useRef<string>('');
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Core State ────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<V86Status>(v86Service.status);
  const [mode, setMode] = useState<TerminalMode>('serial');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Boot Sequence State ───────────────────────────────────────────────────────
  const [bootPhase, setBootPhase] = useState<BootPhase>('idle');
  const [bootProgress, setBootProgress] = useState(0);

  // ── Panel State ───────────────────────────────────────────────────────────────
  const [fileBrowserOpen, setFileBrowserOpen] = useState(showFileBrowser);
  const [packageManagerOpen, setPackageManagerOpen] = useState(showPackageManager);
  const [activeSidePanel, setActiveSidePanel] = useState<'files' | 'packages' | null>(null);

  // ── File Browser State ────────────────────────────────────────────────────────
  const [fileBrowserPath, setFileBrowserPath] = useState('/');
  const [fileEntries, setFileEntries] = useState<AlpineFileEntry[]>([]);
  const [fileBrowserLoading, setFileBrowserLoading] = useState(false);
  const [pathHistory, setPathHistory] = useState<string[]>(['/']);

  // ── Package Manager State ─────────────────────────────────────────────────────
  const [pkgInfo, setPkgInfo] = useState<PackageManagerInfo>({
    installed: [],
    installing: null,
    removing: null,
    refreshing: false,
    error: null,
  });
  const [pkgSearchInput, setPkgSearchInput] = useState('');

  // ── Auto-Save State ───────────────────────────────────────────────────────────
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // ── Sync State ────────────────────────────────────────────────────────────────
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // ── Disk Usage ────────────────────────────────────────────────────────────────
  const [diskUsage, setDiskUsage] = useState<{ used: string; total: string; percent: number } | null>(null);

  // ── Subscribe to v86 status changes ───────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const newStatus = v86Service.status;
      if (newStatus !== status) {
        setStatus(newStatus);
        // Auto-update boot phase based on status
        if (newStatus === 'running') {
          setBootPhase('running');
          setBootProgress(100);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [status]);

  // ── Subscribe to fileBridge sync events ───────────────────────────────────────
  useEffect(() => {
    const unsub = fileBridgeService.onSyncComplete((stats: SyncStats) => {
      setSyncing(false);
      if (stats.pushed > 0 && stats.pulled === 0) {
        setSyncStatus(`Pushed ${stats.pushed} file(s) to Alpine`);
      } else if (stats.pulled > 0 && stats.pushed === 0) {
        setSyncStatus(`Pulled ${stats.pulled} file(s) from Alpine`);
      } else {
        setSyncStatus(`Synced: ${stats.pushed} pushed, ${stats.pulled} pulled`);
      }
      setTimeout(() => setSyncStatus(null), 4000);
    });
    return () => unsub();
  }, []);

  // ── Initialize xterm.js terminal ──────────────────────────────────────────────
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 13,
      lineHeight: 1.2,
      fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, "Courier New", monospace',
      fontWeight: '400',
      fontWeightBold: '700',
      theme: XTERM_THEME,
      allowTransparency: false,
      scrollback: 10000,
      convertEol: true,
      allowProposedApi: true,
      macOptionIsMeta: true,
      drawBoldTextInBrightColors: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);

    // Delay fit to ensure DOM is ready
    const fitTimer = setTimeout(() => fitAddon.fit(), 50);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome banner
    term.writeln('');
    term.writeln('\x1b[1;32m  _   _                       ____  _____  \x1b[0m');
    term.writeln('\x1b[1;32m | | | |_ __  _   _ _ __ ___   |___ \\|_   _| \x1b[0m');
    term.writeln('\x1b[1;32m | | | | \'_ \\| | | | \'_ ` _ \\   __) | | |   \x1b[0m');
    term.writeln('\x1b[1;32m | |_| | | | | |_| | | | | | | / __/  | |   \x1b[0m');
    term.writeln('\x1b[1;32m  \\___/|_| |_|\\__,_|_| |_| |_| |_____| |_|   \x1b[0m');
    term.writeln('');
    term.writeln('\x1b[90m Nexus Linux Terminal v5.4.0 — v86 x86 Emulator\x1b[0m');
    term.writeln('\x1b[90m Powered by Buildroot Linux\x1b[0m');
    term.writeln('\x1b[90m RAM: ' + VM_MEMORY_MB + ' MB | Scrollback: 10,000 lines\x1b[0m');
    term.writeln('');
    term.writeln('Click \x1b[1;32m[▶ Boot Linux]\x1b[0m to start the emulator.');
    term.writeln('Use \x1b[33m↑/↓\x1b[0m to navigate command history.');
    term.writeln('');

    return () => {
      clearTimeout(fitTimer);
      term.dispose();
      if (unsubOutputRef.current) {
        unsubOutputRef.current();
        unsubOutputRef.current = null;
      }
      if (unsubScreenRef.current) {
        unsubScreenRef.current();
        unsubScreenRef.current = null;
      }
    };
  }, []);

  // ── Connect to v86 serial output ──────────────────────────────────────────────
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    if (unsubOutputRef.current) {
      unsubOutputRef.current();
      unsubOutputRef.current = null;
    }

    if (v86Service.isRunning && mode === 'serial') {
      const unsub = v86Service.onOutput((text: string) => {
        term.write(text);
      });
      unsubOutputRef.current = unsub;
    }

    return () => {
      if (unsubOutputRef.current) {
        unsubOutputRef.current();
        unsubOutputRef.current = null;
      }
    };
  }, [status, mode]);

  // ── Connect xterm input to v86 with command history ───────────────────────────
  useEffect(() => {
    const term = xtermRef.current;
    if (!term || status !== 'running' || mode !== 'serial') return;

    const disposable = term.onData((data: string) => {
      // Handle special keys for command history
      if (data === '\x1b[A') {
        // Up arrow
        if (commandHistoryRef.current.length > 0) {
          if (historyIndexRef.current < 0) {
            historyIndexRef.current = commandHistoryRef.current.length;
          }
          if (historyIndexRef.current > 0) {
            historyIndexRef.current--;
            const entry = commandHistoryRef.current[historyIndexRef.current];
            term.write('\r\x1b[K');
            term.write('\x1b[32mnexus\x1b[0m:\x1b[34m~\x1b[0m$ ' + entry);
            currentInputRef.current = entry;
          }
        }
        return;
      }

      if (data === '\x1b[B') {
        // Down arrow
        if (historyIndexRef.current >= 0) {
          historyIndexRef.current++;
          if (historyIndexRef.current >= commandHistoryRef.current.length) {
            historyIndexRef.current = -1;
            term.write('\r\x1b[K');
            term.write('\x1b[32mnexus\x1b[0m:\x1b[34m~\x1b[0m$ ');
            currentInputRef.current = '';
          } else {
            const entry = commandHistoryRef.current[historyIndexRef.current];
            term.write('\r\x1b[K');
            term.write('\x1b[32mnexus\x1b[0m:\x1b[34m~\x1b[0m$ ' + entry);
            currentInputRef.current = entry;
          }
        }
        return;
      }

      // Enter key — save to history
      if (data === '\r') {
        const cmd = currentInputRef.current.trim();
        if (cmd.length > 0) {
          // Don't add duplicates consecutively
          const lastCmd = commandHistoryRef.current[commandHistoryRef.current.length - 1];
          if (lastCmd !== cmd) {
            commandHistoryRef.current.push(cmd);
            // Keep history manageable
            if (commandHistoryRef.current.length > 500) {
              commandHistoryRef.current = commandHistoryRef.current.slice(-500);
            }
          }
        }
        currentInputRef.current = '';
        historyIndexRef.current = -1;
      } else if (data === '\x7f') {
        // Backspace
        currentInputRef.current = currentInputRef.current.slice(0, -1);
      } else if (data.length === 1 && data.charCodeAt(0) >= 32) {
        // Regular printable character
        currentInputRef.current += data;
      }

      v86Service.sendInput(data);
    });

    return () => disposable.dispose();
  }, [status, mode]);

  // ── Handle resize ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    const observer = new ResizeObserver(() => {
      handleResize();
    });

    if (terminalRef.current?.parentElement) {
      observer.observe(terminalRef.current.parentElement);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [activeSidePanel]); // Re-fit when side panel toggles

  // ── Auto-Save management ──────────────────────────────────────────────────────
  useEffect(() => {
    if (autoSaveEnabled && status === 'running') {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setInterval(async () => {
        try {
          await v86Service.saveState();
          setLastAutoSave(new Date());
        } catch {
          // Silent fail for auto-save
        }
      }, AUTO_SAVE_INTERVAL_MS);
    } else {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [autoSaveEnabled, status]);

  // ── Boot handler with phases ──────────────────────────────────────────────────
  const handleBoot = useCallback(async () => {
    setError(null);
    setBootPhase('loading-image');
    setBootProgress(0);

    // Simulate download progress (the real progress comes from v86Service events)
    const progressTimer = setInterval(() => {
      setBootProgress(prev => {
        if (prev < 30) return prev + Math.random() * 5 + 2;
        return prev;
      });
    }, 200);

    try {
      // Set up boot phase tracking via output events
      const unsubEvents = v86Service.onOutput((text: string) => {
        if (text.includes('loading-image') || text.includes('Downloading')) {
          setBootPhase('loading-image');
        }
      });

      setBootPhase('configuring');
      setBootProgress(35);

      await v86Service.boot();

      clearInterval(progressTimer);
      setBootProgress(60);
      setBootPhase('booting');

      // Wait for emulator to become ready
      const readyCheck = setInterval(() => {
        if (v86Service.status === 'running') {
          clearInterval(readyCheck);
          setBootProgress(100);
          setBootPhase('running');
          setStatus('running');
          unsubEvents();

          // Load file browser and disk usage
          refreshFileBrowser();
          refreshDiskUsage();
        }
      }, 300);

      // Timeout after 60s
      setTimeout(() => {
        clearInterval(readyCheck);
      }, 60000);
    } catch (err: any) {
      clearInterval(progressTimer);
      const errMsg = err.message || 'Failed to boot Linux';
      setError(errMsg);
      setBootPhase('error');
      setStatus('error');
    }
  }, []);

  // ── Stop handler ──────────────────────────────────────────────────────────────
  const handleStop = useCallback(async () => {
    // Stop auto-save
    setAutoSaveEnabled(false);
    await v86Service.stop();
    setStatus('stopped');
    setBootPhase('idle');
    setFileEntries([]);
    setDiskUsage(null);
    if (xtermRef.current) {
      xtermRef.current.writeln('\r\n\x1b[90m[Emulator stopped — state cleared]\x1b[0m\r\n');
    }
  }, []);

  // ── Pause/Resume handler ──────────────────────────────────────────────────────
  const handlePauseResume = useCallback(() => {
    if (status === 'running') {
      v86Service.pause();
      setStatus('paused');
    } else if (status === 'paused') {
      v86Service.resume();
      setStatus('running');
    }
  }, [status]);

  // ── Save state handler ────────────────────────────────────────────────────────
  const handleSaveState = useCallback(async () => {
    try {
      await v86Service.saveState();
      setLastAutoSave(new Date());
      if (xtermRef.current) {
        xtermRef.current.writeln('\r\n\x1b[32m✓ VM state saved to IndexedDB\x1b[0m\r\n');
      }
    } catch {
      if (xtermRef.current) {
        xtermRef.current.writeln('\r\n\x1b[31m✗ Failed to save VM state\x1b[0m\r\n');
      }
    }
  }, []);

  // ── Retry handler ─────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setError(null);
    setBootPhase('idle');
    handleBoot();
  }, [handleBoot]);

  // ── Fullscreen toggle ─────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    if (onFullscreen) onFullscreen();
    setTimeout(() => {
      if (fitAddonRef.current) fitAddonRef.current.fit();
    }, 100);
  }, [onFullscreen]);

  // ── File Bridge: Push files ───────────────────────────────────────────────────
  const handlePushFiles = useCallback(async () => {
    if (files.length === 0) {
      setSyncStatus('No workspace files to push');
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }
    setSyncing(true);
    setSyncStatus('Pushing files to Alpine...');
    try {
      await fileBridgeService.pushWorkspace(files);
    } catch {
      setSyncStatus('Failed to push files');
      setSyncing(false);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  }, [files]);

  // ── File Bridge: Pull files ───────────────────────────────────────────────────
  const handlePullFiles = useCallback(async () => {
    setSyncing(true);
    setSyncStatus('Pulling files from Alpine...');
    try {
      const pulledFiles = await fileBridgeService.pullWorkspace();
      if (onPullFiles) {
        onPullFiles(pulledFiles);
      }
    } catch {
      setSyncStatus('Failed to pull files');
      setSyncing(false);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  }, [onPullFiles]);

  // ── File Browser: Refresh ─────────────────────────────────────────────────────
  const refreshFileBrowser = useCallback(async () => {
    if (status !== 'running') return;
    setFileBrowserLoading(true);
    try {
      const entries = await fileBridgeService.listFiles(fileBrowserPath);
      setFileEntries(
        entries
          .sort((a: AlpineFileEntry, b: AlpineFileEntry) => {
            // Directories first
            if (a.type === 'dir' && b.type !== 'dir') return -1;
            if (a.type !== 'dir' && b.type === 'dir') return 1;
            return a.name.localeCompare(b.name);
          })
      );
    } catch {
      setFileEntries([]);
    } finally {
      setFileBrowserLoading(false);
    }
  }, [status, fileBrowserPath]);

  // ── File Browser: Navigate ────────────────────────────────────────────────────
  const navigateToPath = useCallback((path: string) => {
    setFileBrowserPath(path);
    setPathHistory(prev => {
      if (prev[prev.length - 1] !== path) {
        return [...prev, path];
      }
      return prev;
    });
  }, []);

  const navigateBack = useCallback(() => {
    if (pathHistory.length > 1) {
      const newHistory = pathHistory.slice(0, -1);
      setPathHistory(newHistory);
      setFileBrowserPath(newHistory[newHistory.length - 1]);
    }
  }, [pathHistory]);

  // Navigate into a directory
  const navigateIntoDirectory = useCallback((entry: AlpineFileEntry) => {
    if (entry.type !== 'dir') return;
    const newPath = fileBrowserPath === '/' ? `/${entry.name}` : `${fileBrowserPath}/${entry.name}`;
    navigateToPath(newPath);
  }, [fileBrowserPath, navigateToPath]);

  // Refresh file browser when path changes
  useEffect(() => {
    refreshFileBrowser();
  }, [fileBrowserPath, refreshFileBrowser]);

  // ── Disk Usage ────────────────────────────────────────────────────────────────
  const refreshDiskUsage = useCallback(async () => {
    if (status !== 'running') return;
    try {
      const usage = await fileBridgeService.getDiskUsage();
      const totalGB = (usage.total / (1024 * 1024 * 1024)).toFixed(1);
      const usedGB = (usage.used / (1024 * 1024 * 1024)).toFixed(1);
      const percent = usage.total > 0 ? Math.round((usage.used / usage.total) * 100) : 0;
      setDiskUsage({ used: usedGB, total: totalGB, percent });
    } catch {
      setDiskUsage(null);
    }
  }, [status]);

  // ── Package Manager: Refresh installed packages ───────────────────────────────
  const refreshInstalledPackages = useCallback(async () => {
    if (status !== 'running') return;
    setPkgInfo(prev => ({ ...prev, refreshing: true, error: null }));
    try {
      // Use apk info to get installed packages
      const output = await new Promise<string>((resolve, reject) => {
        let result = '';
        const unsub = v86Service.onOutput((text: string) => {
          result += text;
        });
        // Send command to Alpine
        v86Service.sendInput('apk info 2>/dev/null\n');
        // Wait for output
        setTimeout(() => {
          unsub();
          resolve(result);
        }, 2000);
      });

      // Parse package names from output (one per line)
      const packages = output
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && /^[a-zA-Z0-9][a-zA-Z0-9._-]*/.test(line));

      setPkgInfo(prev => ({
        ...prev,
        installed: packages,
        refreshing: false,
      }));
    } catch {
      setPkgInfo(prev => ({
        ...prev,
        refreshing: false,
        error: 'Failed to list packages',
      }));
    }
  }, [status]);

  // ── Package Manager: Install package ──────────────────────────────────────────
  const installPackage = useCallback(async (pkgName: string) => {
    if (!pkgName.trim() || status !== 'running') return;

    const name = pkgName.trim();
    setPkgInfo(prev => ({ ...prev, installing: name, error: null }));

    // Send install command
    v86Service.sendInput(`apk add ${name}\n`);

    // Wait for installation to complete
    setTimeout(() => {
      setPkgInfo(prev => ({ ...prev, installing: null }));
      refreshInstalledPackages();
    }, 5000);
  }, [status, refreshInstalledPackages]);

  // ── Package Manager: Remove package ───────────────────────────────────────────
  const removePackage = useCallback(async (pkgName: string) => {
    if (!pkgName.trim() || status !== 'running') return;

    const name = pkgName.trim();
    setPkgInfo(prev => ({ ...prev, removing: name, error: null }));

    v86Service.sendInput(`apk del ${name}\n`);

    setTimeout(() => {
      setPkgInfo(prev => ({ ...prev, removing: null }));
      refreshInstalledPackages();
    }, 5000);
  }, [status, refreshInstalledPackages]);

  // ── Package Manager: Submit from input ────────────────────────────────────────
  const handlePkgSubmit = useCallback(() => {
    if (!pkgSearchInput.trim()) return;
    installPackage(pkgSearchInput.trim());
    setPkgSearchInput('');
  }, [pkgSearchInput, installPackage]);

  // ── Toggle auto-save (managed in-component) ────────────────────────────────────
  const toggleAutoSave = useCallback(() => {
    setAutoSaveEnabled(prev => !prev);
  }, []);

  // ── Toggle side panel ─────────────────────────────────────────────────────────
  const toggleSidePanel = useCallback((panel: 'files' | 'packages') => {
    setActiveSidePanel(prev => prev === panel ? null : panel);
  }, []);

  // ── Format file size ──────────────────────────────────────────────────────────
  const formatFileSize = useCallback((bytes?: number) => {
    if (bytes === undefined || bytes === null) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  // ── Breadcrumb segments ───────────────────────────────────────────────────────
  const breadcrumbSegments = useMemo(() => {
    if (fileBrowserPath === '/') return [{ name: '/', path: '/' }];
    const parts = fileBrowserPath.split('/').filter(Boolean);
    return [
      { name: '/', path: '/' },
      ...parts.map((part, i) => ({
        name: part,
        path: '/' + parts.slice(0, i + 1).join('/'),
      })),
    ];
  }, [fileBrowserPath]);

  // ── Auto-save time ago ───────────────────────────────────────────────────────
  const autoSaveTimeAgo = useMemo(() => {
    if (!lastAutoSave) return null;
    const seconds = Math.floor((Date.now() - lastAutoSave.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }, [lastAutoSave]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className={cn(
      "flex bg-nexus-bg border-t border-nexus-border overflow-hidden",
      isFullscreen ? "fixed inset-0 z-[300]" : "h-[28rem]"
    )}>
      {/* ═══ Main Column ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ─── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 py-1 bg-[#1a1a2e] border-b border-nexus-border flex-shrink-0 gap-2">
          {/* Left side: Icon, Label, Mode toggle, Status */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Linux icon + label */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Monitor size={14} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest hidden sm:inline">
                Linux
              </span>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center bg-nexus-bg rounded p-0.5 flex-shrink-0">
              <button
                onClick={() => setMode('serial')}
                className={cn(
                  'px-2.5 py-0.5 rounded text-[10px] font-bold transition-all',
                  mode === 'serial'
                    ? 'bg-[#1a1a2e] text-white'
                    : 'text-nexus-text-muted hover:text-white'
                )}
              >
                Serial
              </button>
              <button
                onClick={() => setMode('screen')}
                disabled={status !== 'running'}
                className={cn(
                  'px-2.5 py-0.5 rounded text-[10px] font-bold transition-all',
                  mode === 'screen'
                    ? 'bg-[#1a1a2e] text-white'
                    : 'text-nexus-text-muted hover:text-white',
                  status !== 'running' && 'opacity-40 cursor-not-allowed'
                )}
              >
                Screen
              </button>
            </div>

            {/* Status badge */}
            <StatusBadge status={status} bootPhase={bootPhase} />
          </div>

          {/* Center: Memory indicator */}
          <div className="hidden md:flex items-center gap-1 text-[10px] text-nexus-text-muted flex-shrink-0">
            <HardDrive size={10} />
            <span>{VM_MEMORY_MB} MB</span>
            {diskUsage && (
              <>
                <span className="mx-1 text-nexus-border">|</span>
                <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      diskUsage.percent > 80 ? 'bg-red-500' : diskUsage.percent > 50 ? 'bg-yellow-500' : 'bg-emerald-500'
                    )}
                    style={{ width: `${Math.min(diskUsage.percent, 100)}%` }}
                  />
                </div>
                <span>{diskUsage.percent}%</span>
              </>
            )}
          </div>

          {/* Right side: Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Push Files */}
            {status === 'running' && (
              <button
                onClick={handlePushFiles}
                disabled={syncing || files.length === 0}
                className="flex items-center gap-1 px-2 py-1 bg-cyan-700/60 hover:bg-cyan-700 text-white rounded text-[10px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Push workspace files to Alpine"
              >
                <Upload size={9} />
                <span className="hidden sm:inline">Push</span>
              </button>
            )}

            {/* Pull Files */}
            {status === 'running' && (
              <button
                onClick={handlePullFiles}
                disabled={syncing || !onPullFiles}
                className="flex items-center gap-1 px-2 py-1 bg-purple-700/60 hover:bg-purple-700 text-white rounded text-[10px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Pull files from Alpine to workspace"
              >
                <Download size={9} />
                <span className="hidden sm:inline">Pull</span>
              </button>
            )}

            {/* Boot / Stop */}
            {status === 'stopped' || status === 'error' ? (
              <button
                onClick={handleBoot}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
              >
                <Play size={10} />
                Boot Linux
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
              >
                <Square size={10} />
                Stop
              </button>
            )}

            {/* Pause / Resume */}
            {(status === 'running' || status === 'paused') && (
              <button
                onClick={handlePauseResume}
                className="flex items-center gap-1.5 px-3 py-1 bg-nexus-border hover:bg-nexus-border/80 text-white rounded text-[10px] font-bold transition-colors"
              >
                {status === 'running' ? (
                  <><Pause size={10} /> Pause</>
                ) : (
                  <><SkipForward size={10} /> Resume</>
                )}
              </button>
            )}

            {/* Save State */}
            {status === 'running' && (
              <button
                onClick={handleSaveState}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
                title="Save VM state to IndexedDB"
              >
                <Save size={10} />
                Save State
              </button>
            )}

            {/* Auto-Save Toggle */}
            {status === 'running' && (
              <button
                onClick={toggleAutoSave}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold transition-colors',
                  autoSaveEnabled
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
                    : 'bg-nexus-border/50 text-nexus-text-muted hover:text-white border border-transparent'
                )}
                title={autoSaveEnabled ? `Auto-save ON (${AUTO_SAVE_INTERVAL_MS / 1000}s)` : 'Auto-save OFF'}
              >
                <ToggleLeft size={10} />
                <span className="hidden sm:inline">
                  {autoSaveEnabled ? (autoSaveTimeAgo || 'Auto') : 'Auto'}
                </span>
              </button>
            )}

            {/* File Browser toggle */}
            <button
              onClick={() => toggleSidePanel('files')}
              className={cn(
                'p-1.5 rounded transition-colors',
                activeSidePanel === 'files'
                  ? 'bg-nexus-border text-white'
                  : 'text-nexus-text-muted hover:text-white hover:bg-nexus-border/50'
              )}
              title="File Browser"
            >
              <FolderTree size={14} />
            </button>

            {/* Package Manager toggle */}
            <button
              onClick={() => toggleSidePanel('packages')}
              className={cn(
                'p-1.5 rounded transition-colors',
                activeSidePanel === 'packages'
                  ? 'bg-nexus-border text-white'
                  : 'text-nexus-text-muted hover:text-white hover:bg-nexus-border/50'
              )}
              title="Package Manager"
            >
              <Package size={14} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-nexus-border rounded text-nexus-text-muted hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Close */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-nexus-border rounded text-nexus-text-muted hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ─── Sync Status Bar ─────────────────────────────────────────────── */}
        {syncStatus && (
          <div className="flex items-center gap-2 px-4 py-1 bg-blue-900/20 border-b border-blue-500/20">
            <Loader2 size={10} className={cn(syncing ? 'animate-spin' : 'text-blue-400')} />
            <span className="text-[10px] text-blue-400">{syncStatus}</span>
          </div>
        )}

        {/* ─── Error Banner ───────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border-b border-red-500/20">
            <RotateCw size={12} className="text-red-400" />
            <span className="text-[10px] text-red-400">{error}</span>
            <button
              onClick={handleRetry}
              className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-red-600/40 hover:bg-red-600/60 text-red-300 rounded text-[10px] font-bold transition-colors"
            >
              <RotateCw size={9} />
              Retry
            </button>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X size={10} />
            </button>
          </div>
        )}

        {/* ─── Terminal / Screen Content ───────────────────────────────────── */}
        <div className="flex-1 overflow-hidden relative">
          {/* Serial terminal (xterm.js) */}
          <div
            ref={terminalRef}
            className={cn(
              'absolute inset-0 p-2',
              mode === 'serial' ? 'block' : 'hidden'
            )}
          />

          {/* Screen output (v86 canvas) */}
          <div
            ref={screenContainerRef}
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-black',
              mode === 'screen' ? 'block' : 'hidden'
            )}
          >
            {status === 'running' ? (
              <div
                id="v86-screen-container"
                className="w-full h-full"
                ref={(el) => {
                  if (el && el.children.length === 0) {
                    const screenEl = v86Service.getScreenElement();
                    if (screenEl) {
                      screenEl.style.display = 'block';
                      screenEl.style.width = '100%';
                      screenEl.style.height = '100%';
                      el.appendChild(screenEl);
                    }
                  }
                }}
              />
            ) : (
              <div className="text-center">
                <Monitor size={48} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-600 text-xs">Screen output will appear when the emulator is running</p>
              </div>
            )}
          </div>

          {/* ─── Boot Progress Overlay ─────────────────────────────────── */}
          {(bootPhase !== 'idle' && bootPhase !== 'running') && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
              <div className="text-center space-y-4 max-w-xs">
                {/* Spinner */}
                <Loader2
                  size={36}
                  className={cn(
                    'mx-auto',
                    bootPhase === 'error' ? 'text-red-400' : 'text-emerald-400 animate-spin'
                  )}
                />

                {/* Phase title */}
                <div>
                  <p className="text-white text-sm font-bold">
                    {bootPhase === 'loading-image' && 'Downloading Disk Image...'}
                    {bootPhase === 'configuring' && 'Configuring Emulator...'}
                    {bootPhase === 'booting' && 'Booting Alpine Linux...'}
                    {bootPhase === 'error' && 'Boot Failed'}
                  </p>
                  <p className="text-gray-500 text-[10px] mt-1">
                    {bootPhase === 'loading-image' && `Fetching Alpine Linux image from CDN — ${Math.round(bootProgress)}%`}
                    {bootPhase === 'configuring' && 'Setting up v86 virtual machine parameters'}
                    {bootPhase === 'booting' && 'Initializing Alpine Linux kernel and services'}
                    {bootPhase === 'error' && 'An error occurred during the boot process'}
                  </p>
                </div>

                {/* Progress bar */}
                {bootPhase !== 'error' && (
                  <div className="w-56 h-1.5 bg-gray-800 rounded-full mx-auto overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${bootProgress}%`,
                        animation: bootPhase === 'booting' ? 'pulse 1.5s ease-in-out infinite' : undefined,
                      }}
                    />
                  </div>
                )}

                {/* Boot step indicators */}
                {bootPhase !== 'error' && (
                  <div className="space-y-1.5 mt-2">
                    <BootStep label="Download disk image" active={bootPhase === 'loading-image'} done={bootPhase === 'configuring' || bootPhase === 'booting'} />
                    <BootStep label="Configure emulator" active={bootPhase === 'configuring'} done={bootPhase === 'booting'} />
                    <BootStep label="Boot Alpine Linux" active={bootPhase === 'booting'} done={false} />
                    <BootStep label="Running" active={false} done={false} />
                  </div>
                )}

                {/* Retry button on error */}
                {bootPhase === 'error' && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors mx-auto"
                  >
                    <RotateCw size={12} />
                    Retry Boot
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Running indicator (small, bottom-left) */}
          {status === 'running' && bootPhase === 'running' && (
            <div className="absolute bottom-2 left-2 z-5 flex items-center gap-1.5 px-2 py-1 bg-black/60 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] text-emerald-400 font-bold">Running</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Side Panel ═══════════════════════════════════════════════════════ */}
      {activeSidePanel && (
        <div className="w-64 border-l border-nexus-border bg-[#12121e] flex flex-col flex-shrink-0 overflow-hidden">
          {/* ─── File Browser Panel ───────────────────────────────────────── */}
          {activeSidePanel === 'files' && (
            <>
              {/* Panel header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-nexus-border">
                <div className="flex items-center gap-2">
                  <FolderTree size={12} className="text-amber-400" />
                  <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-wider">Files</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={navigateBack}
                    disabled={pathHistory.length <= 1}
                    className="p-0.5 hover:bg-nexus-border rounded text-nexus-text-muted hover:text-white transition-colors disabled:opacity-30"
                    title="Go back"
                  >
                    <ChevronRight size={12} className="rotate-180" />
                  </button>
                  <button
                    onClick={() => refreshFileBrowser()}
                    disabled={fileBrowserLoading}
                    className="p-0.5 hover:bg-nexus-border rounded text-nexus-text-muted hover:text-white transition-colors disabled:opacity-30"
                    title="Refresh"
                  >
                    <RefreshCw size={12} className={fileBrowserLoading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={refreshDiskUsage}
                    className="p-0.5 hover:bg-nexus-border rounded text-nexus-text-muted hover:text-white transition-colors"
                    title="Disk usage"
                  >
                    <HardDrive size={12} />
                  </button>
                  <button
                    onClick={() => setActiveSidePanel(null)}
                    className="p-0.5 hover:bg-nexus-border rounded text-nexus-text-muted hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Disk usage bar */}
              {diskUsage && (
                <div className="px-3 py-1.5 border-b border-nexus-border">
                  <div className="flex items-center justify-between text-[9px] text-nexus-text-muted mb-1">
                    <span>Disk: {diskUsage.used} / {diskUsage.total}</span>
                    <span>{diskUsage.percent}%</span>
                  </div>
                  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        diskUsage.percent > 80 ? 'bg-red-500' : diskUsage.percent > 50 ? 'bg-yellow-500' : 'bg-emerald-500'
                      )}
                      style={{ width: `${Math.min(diskUsage.percent, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Path breadcrumb */}
              <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-nexus-border overflow-x-auto text-[10px]">
                {breadcrumbSegments.map((segment, i) => (
                  <React.Fragment key={segment.path}>
                    {i > 0 && <ChevronRight size={8} className="text-nexus-text-muted flex-shrink-0" />}
                    <button
                      onClick={() => navigateToPath(segment.path)}
                      className={cn(
                        'hover:text-white transition-colors flex-shrink-0',
                        i === breadcrumbSegments.length - 1 ? 'text-white font-bold' : 'text-nexus-text-muted'
                      )}
                    >
                      {segment.name === '/' ? '~' : segment.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* File list */}
              <div className="flex-1 overflow-y-auto py-1">
                {status !== 'running' ? (
                  <div className="px-3 py-8 text-center">
                    <TerminalIcon size={20} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-[10px] text-gray-600">Boot Linux to browse files</p>
                  </div>
                ) : fileBrowserLoading && fileEntries.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={16} className="text-nexus-text-muted animate-spin" />
                  </div>
                ) : fileEntries.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <p className="text-[10px] text-gray-600">Empty directory</p>
                  </div>
                ) : (
                  fileEntries.map((entry) => (
                    <button
                      key={entry.name}
                      onClick={() => navigateIntoDirectory(entry)}
                      className="w-full flex items-center gap-2 px-3 py-1 hover:bg-nexus-border/30 transition-colors group"
                    >
                      {entry.type === 'dir' ? (
                        <FolderTree size={12} className="text-amber-400 flex-shrink-0" />
                      ) : (
                        <FileIcon name={entry.name} />
                      )}
                      <span className="text-[11px] text-gray-300 truncate flex-1 text-left">
                        {entry.name}
                      </span>
                      {entry.type === 'file' && (
                        <span className="text-[9px] text-gray-600 flex-shrink-0">
                          {formatFileSize(entry.size)}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {/* ─── Package Manager Panel ────────────────────────────────────── */}
          {activeSidePanel === 'packages' && (
            <>
              {/* Panel header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-nexus-border">
                <div className="flex items-center gap-2">
                  <Package size={12} className="text-cyan-400" />
                  <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-wider">Packages</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={refreshInstalledPackages}
                    disabled={pkgInfo.refreshing}
                    className="p-0.5 hover:bg-nexus-border rounded text-nexus-text-muted hover:text-white transition-colors disabled:opacity-30"
                    title="Refresh package list"
                  >
                    <RefreshCw size={12} className={pkgInfo.refreshing ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={() => setActiveSidePanel(null)}
                    className="p-0.5 hover:bg-nexus-border rounded text-nexus-text-muted hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Quick install */}
              <div className="border-b border-nexus-border">
                <div className="px-3 py-1.5">
                  <p className="text-[9px] font-bold text-nexus-text-muted uppercase tracking-wider mb-1.5">Quick Install</p>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_PACKAGES.map((pkg) => {
                      const isInstalled = pkgInfo.installed.some(p => p === pkg.name || p.startsWith(pkg.name + '-'));
                      const isInstalling = pkgInfo.installing === pkg.name;
                      return (
                        <button
                          key={pkg.name}
                          onClick={() => isInstalled ? removePackage(pkg.name) : installPackage(pkg.name)}
                          disabled={isInstalling || (pkgInfo.installing !== null && pkgInfo.installing !== pkg.name)}
                          className={cn(
                            'px-2 py-0.5 rounded text-[9px] font-bold transition-all border',
                            isInstalled
                              ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30 hover:bg-red-900/30 hover:text-red-400 hover:border-red-500/30'
                              : isInstalling
                                ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/30 animate-pulse'
                                : 'bg-nexus-bg text-nexus-text-muted border-nexus-border hover:bg-cyan-900/20 hover:text-cyan-400 hover:border-cyan-500/30',
                            (pkgInfo.installing !== null && pkgInfo.installing !== pkg.name) && 'opacity-40'
                          )}
                          title={isInstalled ? `Installed — click to remove` : `Install ${pkg.name}: ${pkg.description}`}
                        >
                          {isInstalling ? (
                            <span className="flex items-center gap-1">
                              <Loader2 size={8} className="animate-spin" />
                              {pkg.name}
                            </span>
                          ) : (
                            <span>{isInstalled ? `✓ ${pkg.name}` : pkg.name}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Custom package input */}
              <div className="px-3 py-2 border-b border-nexus-border">
                <p className="text-[9px] font-bold text-nexus-text-muted uppercase tracking-wider mb-1.5">Install / Remove</p>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={pkgSearchInput}
                    onChange={(e) => setPkgSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePkgSubmit()}
                    placeholder="Package name..."
                    className="flex-1 bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    onClick={handlePkgSubmit}
                    disabled={!pkgSearchInput.trim()}
                    className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[10px] font-bold transition-colors disabled:opacity-40"
                  >
                    <Upload size={10} />
                  </button>
                </div>
              </div>

              {/* Installed packages list */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-1.5">
                  <p className="text-[9px] font-bold text-nexus-text-muted uppercase tracking-wider">
                    Installed ({pkgInfo.installed.length})
                  </p>
                </div>
                {status !== 'running' ? (
                  <div className="px-3 py-8 text-center">
                    <Package size={20} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-[10px] text-gray-600">Boot Linux to manage packages</p>
                  </div>
                ) : pkgInfo.refreshing ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={16} className="text-nexus-text-muted animate-spin" />
                  </div>
                ) : pkgInfo.installed.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <p className="text-[10px] text-gray-600">No packages listed</p>
                    <p className="text-[9px] text-gray-700 mt-1">Click refresh to load</p>
                  </div>
                ) : (
                  <div className="space-y-0.5 px-1">
                    {pkgInfo.installed.map((pkg) => (
                      <div
                        key={pkg}
                        className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-nexus-border/30 transition-colors group"
                      >
                        <div className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="text-[11px] text-gray-400 truncate flex-1">{pkg}</span>
                        <button
                          onClick={() => removePackage(pkg)}
                          disabled={pkgInfo.removing === pkg}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-900/30 rounded text-gray-500 hover:text-red-400 transition-all"
                          title={`Remove ${pkg}`}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═════════════════════════════════════════════════════════════════════════════════

/** Status badge shown in the toolbar */
function StatusBadge({ status, bootPhase }: { status: V86Status; bootPhase: BootPhase }) {
  if (bootPhase === 'error' || status === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-red-400">
        <X size={10} />
        <span>Error</span>
      </div>
    );
  }

  switch (status) {
    case 'booting':
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
          <Loader2 size={10} className="animate-spin" />
          <span>
            {bootPhase === 'loading-image' && 'Downloading...'}
            {bootPhase === 'configuring' && 'Configuring...'}
            {bootPhase === 'booting' && 'Booting...'}
            {!['loading-image', 'configuring', 'booting'].includes(bootPhase) && 'Booting...'}
          </span>
        </div>
      );
    case 'running':
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Running</span>
        </div>
      );
    case 'paused':
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-yellow-400">
          <Pause size={10} />
          <span>Paused</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <Monitor size={10} />
          <span>Stopped</span>
        </div>
      );
  }
}

/** Individual boot step indicator */
function BootStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : active ? (
        <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      ) : (
        <div className="w-3 h-3 rounded-full bg-gray-800 border border-gray-700" />
      )}
      <span className={cn(
        'text-[10px]',
        done ? 'text-emerald-400' : active ? 'text-white font-medium' : 'text-gray-600'
      )}>
        {label}
      </span>
    </div>
  );
}

/** File type icon based on extension */
function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();

  const colorMap: Record<string, string> = {
    js: 'text-yellow-400',
    ts: 'text-blue-400',
    jsx: 'text-yellow-400',
    tsx: 'text-blue-400',
    py: 'text-green-400',
    json: 'text-amber-400',
    md: 'text-gray-400',
    txt: 'text-gray-400',
    sh: 'text-emerald-400',
    css: 'text-purple-400',
    html: 'text-orange-400',
    rs: 'text-red-400',
    go: 'text-cyan-400',
    rb: 'text-red-400',
    java: 'text-red-400',
    c: 'text-blue-300',
    h: 'text-blue-200',
    cpp: 'text-blue-300',
    yml: 'text-pink-400',
    yaml: 'text-pink-400',
    toml: 'text-pink-400',
    xml: 'text-orange-300',
    conf: 'text-gray-400',
    lock: 'text-gray-500',
    log: 'text-gray-500',
  };

  const color = colorMap[ext || ''] || 'text-gray-500';

  return (
    <svg className={cn('w-3 h-3 flex-shrink-0', color)} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z" />
    </svg>
  );
}
