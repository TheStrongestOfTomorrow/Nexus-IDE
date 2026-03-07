import React from 'react';
import { Users, Key, LogIn, Plus, Copy, Check, ShieldAlert, Globe, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

interface CollaborationViewProps {
  sessionId: string | null;
  isJoining: boolean;
  joinId: string;
  setJoinId: (id: string) => void;
  onCreateSession: () => void;
  onJoinSession: (e: React.FormEvent) => void;
  onHostProject: () => void;
  hostedUrl: string | null;
}

export default function CollaborationView({
  sessionId,
  isJoining,
  joinId,
  setJoinId,
  onCreateSession,
  onJoinSession,
  onHostProject,
  hostedUrl
}: CollaborationViewProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Collaboration</h2>
        
        {sessionId ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-900/10 border border-emerald-500/20 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Users size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Active Session</span>
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
            
            <div className="p-3 bg-amber-900/10 border border-amber-500/20 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <ShieldAlert size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Wipe Active</span>
              </div>
              <p className="text-[10px] text-amber-500/70 leading-relaxed">
                Workspace will be wiped after 30 minutes of total inactivity for security.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Start a Session</h3>
              <button
                onClick={onCreateSession}
                className="w-full bg-nexus-accent hover:bg-nexus-accent/80 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-nexus-accent/20 uppercase tracking-widest"
              >
                <Plus size={16} />
                Generate Session Key
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Join a Session</h3>
              <form onSubmit={onJoinSession} className="space-y-2">
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-text-muted" />
                  <input
                    type="text"
                    placeholder="Enter Session Key"
                    value={joinId}
                    onChange={e => setJoinId(e.target.value.toUpperCase())}
                    className="w-full bg-nexus-bg border border-nexus-border rounded-lg pl-10 pr-3 py-2.5 text-xs outline-none focus:border-nexus-accent text-white font-mono uppercase font-bold shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isJoining || !joinId}
                  className="w-full bg-nexus-bg hover:bg-nexus-bg/80 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-nexus-border disabled:opacity-50 uppercase tracking-widest"
                >
                  {isJoining ? <LogIn size={16} className="animate-pulse" /> : <LogIn size={16} />}
                  Join Session
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

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
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-nexus-border bg-nexus-bg">
        <p className="text-[10px] text-nexus-text-muted leading-relaxed italic text-center font-bold tracking-wider">
          NEXUS 4.0 COLLABORATION ENGINE
        </p>
      </div>
    </div>
  );
}
