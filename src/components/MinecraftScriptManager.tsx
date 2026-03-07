import React, { useState, useEffect } from 'react';
import { Play, Pause, Trash2, Plus, Code, Zap, Settings, Save, X, Terminal as TerminalIcon, Database } from 'lucide-react';
import { socketService } from '../services/socketService';
import { terminalService } from '../services/terminalService';
import { cn } from '../lib/utils';

interface MinecraftScript {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  lastRun?: number;
}

interface MinecraftScriptManagerProps {
  sessionId: string | null;
  onClose: () => void;
  binaryMode: boolean;
  onToggleBinary: (enabled: boolean) => void;
}

export default function MinecraftScriptManager({ sessionId, onClose, binaryMode, onToggleBinary }: MinecraftScriptManagerProps) {
  const [scripts, setScripts] = useState<MinecraftScript[]>(() => {
    const saved = localStorage.getItem('nexus_mc_scripts');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        name: 'Auto-Bridge',
        enabled: false,
        code: `// Listen for block break and replace with glass
socketService.subscribeMinecraftEvents(sessionId, 'BlockBroken');
socketService.subscribe((msg) => {
  if (msg.type === 'minecraft:event' && msg.eventName === 'BlockBroken') {
    const { x, y, z } = msg.data.position;
    socketService.sendMinecraftCommand(sessionId, \`/setblock \${x} \${y} \${z} glass\`);
  }
});`
      }
    ];
  });

  const [editingScript, setEditingScript] = useState<MinecraftScript | null>(null);

  useEffect(() => {
    localStorage.setItem('nexus_mc_scripts', JSON.stringify(scripts));
  }, [scripts]);

  const handleToggleScript = (id: string) => {
    setScripts(prev => prev.map(s => {
      if (s.id === id) {
        const newState = !s.enabled;
        if (newState && sessionId) {
          // Execute script logic (simplified for demo)
          try {
            const scriptConsole = {
              log: (...args: any[]) => {
                const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
                terminalService.append('scripts', `[${s.name}] ${msg}`);
              },
              error: (...args: any[]) => {
                const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
                terminalService.append('scripts', `\x1b[1;31m[${s.name}] ERROR: ${msg}\x1b[0m`);
              }
            };
            const scriptFunc = new Function('socketService', 'sessionId', 'console', s.code);
            scriptFunc(socketService, sessionId, scriptConsole);
            terminalService.append('scripts', `\x1b[1;32m[${s.name}] Script started\x1b[0m`);
          } catch (err: any) {
            terminalService.append('scripts', `\x1b[1;31m[${s.name}] FAILED TO START: ${err.message}\x1b[0m`);
          }
        } else if (!newState) {
          terminalService.append('scripts', `\x1b[1;33m[${s.name}] Script stopped\x1b[0m`);
        }
        return { ...s, enabled: newState, lastRun: newState ? Date.now() : s.lastRun };
      }
      return s;
    }));
  };

  const handleAddScript = () => {
    const newScript: MinecraftScript = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Script',
      code: '// Write your Minecraft automation here\n',
      enabled: false
    };
    setScripts(prev => [...prev, newScript]);
    setEditingScript(newScript);
  };

  const handleDeleteScript = (id: string) => {
    setScripts(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveEdit = () => {
    if (editingScript) {
      setScripts(prev => prev.map(s => s.id === editingScript.id ? editingScript : s));
      setEditingScript(null);
    }
  };

  return (
    <div className="w-80 h-full bg-nexus-sidebar border-l border-nexus-border flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-nexus-sidebar border-b border-nexus-border">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-500" />
          <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Script Manager</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onToggleBinary(!binaryMode)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all border",
              binaryMode ? "bg-nexus-accent border-nexus-accent text-white shadow-lg shadow-nexus-accent/20" : "bg-nexus-bg border-nexus-border text-nexus-text-muted hover:text-white"
            )}
            title="Toggle Binary/Protobuf Encoding"
          >
            <Database size={10} />
            {binaryMode ? 'Binary' : 'JSON'}
          </button>
          <button onClick={handleAddScript} className="p-1.5 hover:bg-nexus-bg rounded-lg text-nexus-text-muted hover:text-white transition-colors">
            <Plus size={14} />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-nexus-bg rounded-lg text-nexus-text-muted hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-nexus-sidebar no-scrollbar">
        {scripts.map(script => (
          <div key={script.id} className={cn(
            "p-3 rounded-xl border transition-all shadow-sm",
            script.enabled ? "bg-amber-500/10 border-amber-500/30" : "bg-nexus-bg border-nexus-border"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Code size={14} className={script.enabled ? "text-amber-500" : "text-nexus-text-muted"} />
                <span className="text-xs font-bold text-white">{script.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setEditingScript(script)}
                  className="p-1.5 hover:bg-nexus-sidebar rounded-md text-nexus-text-muted hover:text-white transition-colors"
                >
                  <Settings size={12} />
                </button>
                <button 
                  onClick={() => handleDeleteScript(script.id)}
                  className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-md text-nexus-text-muted transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <button 
              onClick={() => handleToggleScript(script.id)}
              className={cn(
                "w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                script.enabled 
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20" 
                  : "bg-nexus-sidebar text-nexus-text-muted hover:bg-nexus-bg border border-nexus-border"
              )}
            >
              {script.enabled ? <Pause size={10} /> : <Play size={10} />}
              {script.enabled ? 'Running' : 'Start Script'}
            </button>
          </div>
        ))}
      </div>

      {editingScript && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-nexus-sidebar rounded-2xl border border-nexus-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-nexus-sidebar border-b border-nexus-border">
              <div className="flex items-center gap-3">
                <Settings size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Edit Script</h3>
              </div>
              <button onClick={() => setEditingScript(null)} className="text-nexus-text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 bg-nexus-sidebar">
              <div>
                <label className="block text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest mb-2">Script Name</label>
                <input 
                  type="text" 
                  value={editingScript.name}
                  onChange={e => setEditingScript({ ...editingScript, name: e.target.value })}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest mb-2">Automation Code (TS/JS)</label>
                <textarea 
                  value={editingScript.code}
                  onChange={e => setEditingScript({ ...editingScript, code: e.target.value })}
                  className="w-full h-64 bg-nexus-bg border border-nexus-border rounded-xl px-4 py-3 text-xs text-gray-300 font-mono focus:outline-none focus:border-amber-500 resize-none shadow-inner no-scrollbar"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-nexus-bg border-t border-nexus-border flex justify-end gap-3">
              <button onClick={() => setEditingScript(null)} className="px-4 py-2 text-xs font-bold text-nexus-text-muted hover:text-white uppercase tracking-widest">Cancel</button>
              <button onClick={handleSaveEdit} className="px-8 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-900/20 transition-all uppercase tracking-widest">
                <Save size={14} />
                Save Script
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
