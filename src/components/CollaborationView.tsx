import React from 'react';
import { Users, Key, LogIn, Plus, Copy, Check, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

interface CollaborationViewProps {
  sessionId: string | null;
  isJoining: boolean;
  joinId: string;
  setJoinId: (id: string) => void;
  onCreateSession: () => void;
  onJoinSession: (e: React.FormEvent) => void;
}

export default function CollaborationView({
  sessionId,
  isJoining,
  joinId,
  setJoinId,
  onCreateSession,
  onJoinSession
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
    <div className="flex flex-col h-full bg-[#252526]">
      <div className="p-4 border-b border-[#333]">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Collaboration</h2>
        
        {sessionId ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Users size={16} />
                <span className="text-xs font-bold uppercase">Active Session</span>
              </div>
              <div className="flex items-center justify-between bg-[#1e1e1e] p-2 rounded border border-[#333]">
                <code className="text-sm font-mono text-white">{sessionId}</code>
                <button 
                  onClick={handleCopy}
                  className="p-1 hover:bg-[#333] rounded text-gray-400 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                Share this code with a friend to start coding together.
              </p>
            </div>
            
            <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <ShieldAlert size={14} />
                <span className="text-[10px] font-bold uppercase">Auto-Wipe Active</span>
              </div>
              <p className="text-[10px] text-amber-500/70">
                Workspace will be wiped after 30 minutes of total inactivity.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Start a Session</h3>
              <button
                onClick={onCreateSession}
                className="w-full bg-[#007acc] hover:bg-[#0062a3] text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Generate Session Key
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Join a Session</h3>
              <form onSubmit={onJoinSession} className="space-y-2">
                <div className="relative">
                  <Key size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Enter Session Key"
                    value={joinId}
                    onChange={e => setJoinId(e.target.value.toUpperCase())}
                    className="w-full bg-[#3c3c3c] border border-[#3c3c3c] rounded pl-8 pr-2 py-2 text-xs outline-none focus:border-[#007acc] text-white font-mono uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isJoining || !joinId}
                  className="w-full bg-[#3c3c3c] hover:bg-[#444] text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-[#444] disabled:opacity-50"
                >
                  {isJoining ? <LogIn size={16} className="animate-pulse" /> : <LogIn size={16} />}
                  Join Session
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">How it works</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-[#333] flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
              <p className="text-[11px] text-gray-400">Generate a one-time key or enter a friend's key.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-[#333] flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
              <p className="text-[11px] text-gray-400">Collaborate in real-time on any file in the workspace.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-[#333] flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
              <p className="text-[11px] text-gray-400">Progress is synced automatically across all participants.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[#333] bg-[#1e1e1e]">
        <p className="text-[10px] text-gray-500 leading-relaxed italic">
          Nexus v2.5 Alpha: Real-time session-based collaboration.
        </p>
      </div>
    </div>
  );
}
