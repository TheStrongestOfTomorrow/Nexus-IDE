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
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#252526] border border-[#333] shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center px-4 py-3 border-b border-[#333] gap-3">
          <Search size={18} className="text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
          />
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#333] rounded text-[10px] text-gray-400 font-mono">
            ESC
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No commands found for "{search}"
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
                  "flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors",
                  index === selectedIndex ? "bg-[#094771] text-white" : "text-gray-400 hover:bg-[#2a2d2e]"
                )}
              >
                <div className="flex items-center gap-3">
                  <cmd.icon size={16} className={cn(index === selectedIndex ? "text-white" : "text-gray-500")} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{cmd.label}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-60">{cmd.category}</span>
                  </div>
                </div>
                {cmd.shortcut && (
                  <div className="text-[10px] font-mono opacity-60 bg-black/20 px-1.5 py-0.5 rounded">
                    {cmd.shortcut}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-[#1e1e1e] border-t border-[#333] flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><span className="font-mono bg-[#333] px-1 rounded text-white">↑↓</span> Navigate</span>
            <span className="flex items-center gap-1"><span className="font-mono bg-[#333] px-1 rounded text-white">ENTER</span> Select</span>
          </div>
          <span>Nexus Command Palette</span>
        </div>
      </div>
    </div>
  );
}
