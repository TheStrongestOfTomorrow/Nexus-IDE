import React, { useState } from 'react';
import { Files, Search, GitBranch, Play, MessageSquare, Settings, User, Terminal as TerminalIcon, Puzzle, Users, MoreHorizontal, Gamepad2, Share2, ScrollText, Palette, Package, CheckSquare, Scissors, BarChart, Box } from 'lucide-react';
import { cn } from '../lib/utils';

export type ActivityType = 'explorer' | 'search' | 'git' | 'debug' | 'extensions' | 'collab' | 'ai' | 'settings' | 'minecraft' | 'themes' | 'deps' | 'todos' | 'snippets' | 'insights' | 'webcontainer';

interface ActivityBarProps {
  activeActivity: ActivityType;
  onActivityChange: (activity: ActivityType) => void;
  onToggleTerminal: () => void;
  onToggleVibeGraph?: () => void;
  onToggleMinecraftScripts?: () => void;
}

export default function ActivityBar({ activeActivity, onActivityChange, onToggleTerminal, onToggleVibeGraph, onToggleMinecraftScripts }: ActivityBarProps) {
  const [showMore, setShowMore] = useState(false);

  const primaryActivities: { id: ActivityType; icon: React.ElementType; label: string }[] = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'ai', icon: MessageSquare, label: 'AI Assistant' },
  ];

  const secondaryActivities: { id: ActivityType; icon: React.ElementType; label: string }[] = [
    { id: 'webcontainer', icon: Box, label: 'WebContainer' },
    { id: 'debug', icon: Play, label: 'Run and Debug' },
    { id: 'extensions', icon: Puzzle, label: 'Extensions' },
    { id: 'collab', icon: Users, label: 'Collaboration' },
    { id: 'deps', icon: Package, label: 'Dependencies' },
    { id: 'todos', icon: CheckSquare, label: 'Todo Scanner' },
    { id: 'snippets', icon: Scissors, label: 'Snippets' },
    { id: 'insights', icon: BarChart, label: 'Project Insights' },
    { id: 'themes', icon: Palette, label: 'Theme Studio' },
    { id: 'minecraft', icon: Gamepad2, label: 'Minecraft Bridge' },
  ];

  return (
    <div className="w-12 bg-nexus-sidebar flex flex-col items-center py-4 gap-4 flex-shrink-0 border-r border-nexus-border relative">
      {primaryActivities.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onActivityChange(id)}
          className={cn(
            "p-2 transition-colors relative group",
            activeActivity === id 
              ? "text-white border-l-2 border-nexus-accent" 
              : "text-nexus-text-muted hover:text-white"
          )}
          title={label}
        >
          <Icon size={24} strokeWidth={1.5} />
        </button>
      ))}

      <div className="h-px w-6 bg-nexus-border my-1" />

      <button
        onClick={() => setShowMore(!showMore)}
        className={cn(
          "p-2 transition-colors relative group",
          showMore ? "text-white" : "text-nexus-text-muted hover:text-white"
        )}
        title="More Tools"
      >
        <MoreHorizontal size={24} strokeWidth={1.5} />
      </button>

      {showMore && (
        <div className="absolute left-14 top-24 bg-nexus-sidebar border border-nexus-border rounded shadow-2xl z-[100] p-1 flex flex-col gap-1 min-w-[160px]">
          {secondaryActivities.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                onActivityChange(id);
                setShowMore(false);
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors",
                activeActivity === id ? "bg-nexus-accent text-white" : "text-nexus-text-muted hover:bg-nexus-bg hover:text-white"
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
        className="p-2 text-nexus-text-muted hover:text-white transition-colors relative group"
        title="Terminal"
      >
        <TerminalIcon size={24} strokeWidth={1.5} />
      </button>

      {onToggleVibeGraph && (
        <button
          onClick={onToggleVibeGraph}
          className="p-2 text-gray-500 hover:text-gray-300 transition-colors relative group"
          title="Vibe Graph"
        >
          <Share2 size={24} strokeWidth={1.5} />
        </button>
      )}

      {onToggleMinecraftScripts && (
        <button
          onClick={onToggleMinecraftScripts}
          className="p-2 text-gray-500 hover:text-gray-300 transition-colors relative group"
          title="Minecraft Scripts"
        >
          <ScrollText size={24} strokeWidth={1.5} />
        </button>
      )}
      
      <div className="mt-auto flex flex-col gap-4">
        <button 
          className="text-nexus-text-muted hover:text-white p-2"
          title="Accounts"
        >
          <User size={24} strokeWidth={1.5} />
        </button>
        <button 
          onClick={() => onActivityChange('settings')}
          className={cn(
            "p-2 transition-colors relative group",
            activeActivity === 'settings' 
              ? "text-white border-l-2 border-nexus-accent" 
              : "text-nexus-text-muted hover:text-white"
          )}
          title="Settings"
        >
          <Settings size={24} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
