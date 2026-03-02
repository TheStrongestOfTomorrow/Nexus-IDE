import React, { useState } from 'react';
import { Files, Search, GitBranch, Play, MessageSquare, Settings, User, Terminal as TerminalIcon, Puzzle, Users, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';

export type ActivityType = 'explorer' | 'search' | 'git' | 'debug' | 'extensions' | 'collab' | 'ai' | 'settings';

interface ActivityBarProps {
  activeActivity: ActivityType;
  onActivityChange: (activity: ActivityType) => void;
  onToggleTerminal: () => void;
}

export default function ActivityBar({ activeActivity, onActivityChange, onToggleTerminal }: ActivityBarProps) {
  const [showMore, setShowMore] = useState(false);

  const primaryActivities: { id: ActivityType; icon: React.ElementType; label: string }[] = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'ai', icon: MessageSquare, label: 'AI Assistant' },
  ];

  const secondaryActivities: { id: ActivityType; icon: React.ElementType; label: string }[] = [
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'debug', icon: Play, label: 'Run and Debug' },
    { id: 'extensions', icon: Puzzle, label: 'Extensions' },
    { id: 'collab', icon: Users, label: 'Collaboration' },
  ];

  return (
    <div className="w-12 bg-[#333333] flex flex-col items-center py-4 gap-4 flex-shrink-0 border-r border-[#252526] relative">
      {primaryActivities.map(({ id, icon: Icon, label }) => (
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
        </button>
      ))}

      <div className="h-px w-6 bg-[#444] my-1" />

      <button
        onClick={() => setShowMore(!showMore)}
        className={cn(
          "p-2 transition-colors relative group",
          showMore ? "text-white" : "text-gray-500 hover:text-gray-300"
        )}
        title="More Tools"
      >
        <MoreHorizontal size={24} strokeWidth={1.5} />
      </button>

      {showMore && (
        <div className="absolute left-14 top-24 bg-[#252526] border border-[#454545] rounded shadow-2xl z-[100] p-1 flex flex-col gap-1 min-w-[160px]">
          {secondaryActivities.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                onActivityChange(id);
                setShowMore(false);
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors",
                activeActivity === id ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-[#333] hover:text-white"
              )}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onToggleTerminal}
        className="p-2 text-gray-500 hover:text-gray-300 transition-colors relative group"
        title="Terminal"
      >
        <TerminalIcon size={24} strokeWidth={1.5} />
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
