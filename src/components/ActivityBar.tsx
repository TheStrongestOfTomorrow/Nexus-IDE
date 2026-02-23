import React from 'react';
import { Files, Search, GitBranch, Play, MessageSquare, Settings, User, Terminal as TerminalIcon, Puzzle } from 'lucide-react';
import { cn } from '../lib/utils';

export type ActivityType = 'explorer' | 'search' | 'git' | 'debug' | 'extensions' | 'ai' | 'settings';

interface ActivityBarProps {
  activeActivity: ActivityType;
  onActivityChange: (activity: ActivityType) => void;
  onToggleTerminal: () => void;
}

export default function ActivityBar({ activeActivity, onActivityChange, onToggleTerminal }: ActivityBarProps) {
  const activities: { id: ActivityType; icon: React.ElementType; label: string }[] = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'debug', icon: Play, label: 'Run and Debug' },
    { id: 'extensions', icon: Puzzle, label: 'Extensions' },
    { id: 'ai', icon: MessageSquare, label: 'AI Assistant' },
  ];

  return (
    <div className="w-12 bg-[#333333] flex flex-col items-center py-4 gap-4 flex-shrink-0 border-r border-[#252526]">
      {activities.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onActivityChange(id)}
          className={cn(
            "p-2 transition-colors relative group",
            activeActivity === id 
              ? "text-white border-l-2 border-white" 
              : "text-gray-500 hover:text-gray-300"
          )}
          title={label}
        >
          <Icon size={24} strokeWidth={1.5} />
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#252526] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap border border-[#454545] shadow-xl">
            {label}
          </div>
        </button>
      ))}

      <button
        onClick={onToggleTerminal}
        className="p-2 text-gray-500 hover:text-gray-300 transition-colors relative group"
        title="Terminal"
      >
        <TerminalIcon size={24} strokeWidth={1.5} />
        <div className="absolute left-full ml-2 px-2 py-1 bg-[#252526] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap border border-[#454545] shadow-xl">
          Terminal
        </div>
      </button>
      
      <div className="mt-auto flex flex-col gap-4">
        <button 
          className="text-gray-500 hover:text-gray-300 p-2"
          title="Accounts"
        >
          <User size={24} strokeWidth={1.5} />
        </button>
        <button 
          onClick={() => onActivityChange('settings')}
          className={cn(
            "p-2 transition-colors relative group",
            activeActivity === 'settings' 
              ? "text-white border-l-2 border-white" 
              : "text-gray-500 hover:text-gray-300"
          )}
          title="Settings"
        >
          <Settings size={24} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
