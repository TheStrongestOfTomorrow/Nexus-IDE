import React, { useState } from 'react';
import { Play, Bug, Trash2, Terminal, Cpu, Zap, Info, PlayCircle, StopCircle, RefreshCw } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';
import { cn } from '../lib/utils';
import { socketService } from '../services/socketService';

interface DebugViewProps {
  activeFile: FileNode | null;
  onToggleTerminal?: () => void;
}

export default function DebugView({ activeFile, onToggleTerminal }: DebugViewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [variables, setVariables] = useState<Record<string, any>>({
    'process.env': { NODE_ENV: 'development', PORT: 3000 },
    'window.location': { origin: window.location.origin, pathname: window.location.pathname }
  });

  const handleRun = () => {
    if (activeFile) {
      setIsRunning(true);
      socketService.send({
        type: 'run-file',
        filename: activeFile.name,
        content: activeFile.content,
        language: activeFile.language
      });
      if (onToggleTerminal) onToggleTerminal();
      setTimeout(() => setIsRunning(false), 2000);
    }
  };

  const handleStop = () => setIsRunning(false);

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Run and Debug</h2>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={handleRun}
            disabled={isRunning || !activeFile}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-emerald-900/20 uppercase tracking-widest disabled:opacity-50"
          >
            <PlayCircle size={14} />
            Run
          </button>
          <button 
            onClick={handleStop}
            disabled={!isRunning}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-red-900/20 uppercase tracking-widest disabled:opacity-50"
          >
            <StopCircle size={14} />
            Stop
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Active File Info */}
        <div className="p-3 bg-nexus-bg rounded-xl border border-nexus-border space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">
            <Info size={14} className="text-nexus-accent" />
            Active File
          </div>
          <div className="text-[11px] text-white font-mono truncate">
            {activeFile ? activeFile.name : 'No file selected'}
          </div>
          <div className="text-[10px] text-nexus-text-muted uppercase font-bold">
            {activeFile ? activeFile.language : '---'}
          </div>
        </div>

        {/* Variables */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">
              <Cpu size={14} className="text-nexus-accent" />
              Variables
            </div>
            <button className="text-nexus-text-muted hover:text-white transition-colors">
              <RefreshCw size={12} />
            </button>
          </div>
          <div className="bg-nexus-bg rounded-xl border border-nexus-border overflow-hidden shadow-sm">
            {Object.entries(variables).map(([key, val], i) => (
              <div key={i} className="p-2 border-b border-nexus-border last:border-none hover:bg-nexus-sidebar transition-colors">
                <div className="text-[10px] font-bold text-nexus-accent mb-1">{key}</div>
                <div className="text-[10px] text-nexus-text-muted font-mono break-all opacity-70">
                  {JSON.stringify(val)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakpoints */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">
              <Bug size={14} className="text-nexus-accent" />
              Breakpoints
            </div>
            <button 
              onClick={() => setBreakpoints([])}
              className="text-nexus-text-muted hover:text-white transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="bg-nexus-bg rounded-xl border border-nexus-border p-4 text-center shadow-sm">
            <div className="text-[10px] text-nexus-text-muted italic opacity-50">
              No breakpoints set
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-nexus-sidebar border-t border-nexus-border">
        <button 
          onClick={onToggleTerminal}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-nexus-bg hover:bg-nexus-bg/80 text-nexus-text rounded-lg text-[10px] font-bold transition-all border border-nexus-border uppercase tracking-widest"
        >
          <Terminal size={14} />
          Open Terminal
        </button>
      </div>
    </div>
  );
}
