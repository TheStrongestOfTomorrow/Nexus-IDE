import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, X, Zap, FilePlus, FolderOpen, Settings, MessageSquare, Trash2, Layout, Play } from 'lucide-react';
import { cn } from '../lib/utils';

interface CommandItem {
  id: string;
  label: string;
  icon: any;
  shortcut?: string;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export default function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-xl bg-nexus-sidebar border border-nexus-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-5 py-4 border-b border-nexus-border gap-4">
          <Search size={20} className="text-nexus-accent" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands, files, or tools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-nexus-text-muted font-medium"
          />
          <div className="flex items-center gap-1 px-2 py-1 bg-nexus-bg rounded-lg text-[10px] text-nexus-text-muted font-bold border border-nexus-border">
            ESC
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto py-2 no-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-12 text-center text-nexus-text-muted text-sm flex flex-col items-center gap-3">
              <Zap size={32} className="opacity-10" />
              No results found for "{search}"
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "flex items-center justify-between px-5 py-3 cursor-pointer transition-all mx-2 rounded-xl",
                  index === selectedIndex ? "bg-nexus-accent text-white shadow-lg shadow-nexus-accent/20" : "text-nexus-text-muted hover:bg-nexus-bg hover:text-white"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    index === selectedIndex ? "bg-white/20" : "bg-nexus-bg border border-nexus-border"
                  )}>
                    <cmd.icon size={16} className={cn(index === selectedIndex ? "text-white" : "text-nexus-accent")} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold uppercase tracking-wide">{cmd.label}</span>
                    <span className={cn(
                      "text-[9px] uppercase tracking-widest font-bold",
                      index === selectedIndex ? "text-white/70" : "text-nexus-text-muted"
                    )}>{cmd.category}</span>
                  </div>
                </div>
                {cmd.shortcut && (
                  <div className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors",
                    index === selectedIndex ? "bg-white/20 border-white/30 text-white" : "bg-nexus-bg border-nexus-border text-nexus-text-muted"
                  )}>
                    {cmd.shortcut}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-3 bg-nexus-bg border-t border-nexus-border flex items-center justify-between text-[10px] text-nexus-text-muted font-bold uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><span className="bg-nexus-sidebar border border-nexus-border px-1.5 py-0.5 rounded text-white">↑↓</span> NAVIGATE</span>
            <span className="flex items-center gap-2"><span className="bg-nexus-sidebar border border-nexus-border px-1.5 py-0.5 rounded text-white">ENTER</span> SELECT</span>
          </div>
          <span className="text-nexus-accent">NEXUS 4.0 COMMANDS</span>
        </div>
      </div>
    </div>
  );
}
