import React from 'react';
import {
  Zap,
  FilePlus,
  FolderOpen,
  File,
  Terminal,
  Command,
  Settings,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface WelcomeTabProps {
  onNewFile?: () => void;
  onOpenFolder?: () => void;
  onOpenFile?: () => void;
  recentFiles?: Array<{
    id: string;
    name: string;
    language?: string;
    lastOpened?: number;
  }>;
  onSelectFile?: (id: string) => void;
}

interface ShortcutItem {
  label: string;
  keys: string;
  icon: React.ElementType;
}

const shortcuts: ShortcutItem[] = [
  { label: 'Quick Open', keys: 'Ctrl+P', icon: File },
  { label: 'Command Palette', keys: 'Ctrl+Shift+P', icon: Command },
  { label: 'Toggle Terminal', keys: 'Ctrl+`', icon: Terminal },
  { label: 'Toggle Sidebar', keys: 'Ctrl+B', icon: Settings },
  { label: 'Save Workspace', keys: 'Ctrl+S', icon: FolderOpen },
  { label: 'Settings', keys: 'Ctrl+,', icon: Settings },
];

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 30)}mo ago`;
}

export default function WelcomeTab({
  onNewFile,
  onOpenFolder,
  onOpenFile,
  recentFiles,
  onSelectFile,
}: WelcomeTabProps) {
  return (
    <div className="flex-1 bg-nexus-bg overflow-y-auto">
      <div className="max-w-[600px] mx-auto px-8 py-16">
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-nexus-accent/10 border border-nexus-accent/20 flex items-center justify-center mb-4">
            <Zap size={32} className="text-nexus-accent" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold text-nexus-text tracking-tight">
            Nexus IDE
          </h1>
          <p className="text-xs text-nexus-text-muted mt-1 font-mono">v5.3.0</p>
        </div>

        {/* Start Section */}
        <div className="mb-10">
          <h2 className="text-[11px] uppercase tracking-wider text-nexus-text-muted font-semibold mb-3">
            Start
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onNewFile}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-nexus-border bg-nexus-sidebar/50 hover:bg-nexus-sidebar hover:border-nexus-accent/30 transition-all group cursor-pointer"
            >
              <FilePlus
                size={24}
                className="text-nexus-text-muted group-hover:text-nexus-accent transition-colors"
                strokeWidth={1.5}
              />
              <span className="text-xs text-nexus-text group-hover:text-white transition-colors">
                New File
              </span>
            </button>
            <button
              onClick={onOpenFolder}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-nexus-border bg-nexus-sidebar/50 hover:bg-nexus-sidebar hover:border-nexus-accent/30 transition-all group cursor-pointer"
            >
              <FolderOpen
                size={24}
                className="text-nexus-text-muted group-hover:text-nexus-accent transition-colors"
                strokeWidth={1.5}
              />
              <span className="text-xs text-nexus-text group-hover:text-white transition-colors">
                Open Folder
              </span>
            </button>
            <button
              onClick={onOpenFile}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-nexus-border bg-nexus-sidebar/50 hover:bg-nexus-sidebar hover:border-nexus-accent/30 transition-all group cursor-pointer"
            >
              <File
                size={24}
                className="text-nexus-text-muted group-hover:text-nexus-accent transition-colors"
                strokeWidth={1.5}
              />
              <span className="text-xs text-nexus-text group-hover:text-white transition-colors">
                Open File
              </span>
            </button>
          </div>
        </div>

        {/* Recent Files Section */}
        {recentFiles && recentFiles.length > 0 && (
          <div className="mb-10">
            <h2 className="text-[11px] uppercase tracking-wider text-nexus-text-muted font-semibold mb-3">
              Recent
            </h2>
            <div className="border border-nexus-border rounded-lg overflow-hidden divide-y divide-nexus-border">
              {recentFiles.slice(0, 5).map((file) => (
                <button
                  key={file.id}
                  onClick={() => onSelectFile?.(file.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-transparent hover:bg-nexus-sidebar/50 transition-colors group cursor-pointer text-left"
                >
                  <File
                    size={14}
                    className="text-nexus-text-muted group-hover:text-nexus-accent transition-colors flex-shrink-0"
                    strokeWidth={1.5}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-nexus-text group-hover:text-white transition-colors truncate block">
                      {file.name}
                    </span>
                  </div>
                  {file.language && (
                    <span className="text-[10px] text-nexus-text-muted font-mono px-1.5 py-0.5 rounded bg-nexus-border/50 uppercase">
                      {file.language}
                    </span>
                  )}
                  {file.lastOpened && (
                    <span className="text-[10px] text-nexus-text-muted flex items-center gap-1 flex-shrink-0">
                      <Clock size={10} />
                      {formatRelativeTime(file.lastOpened)}
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    className="text-nexus-text-muted/0 group-hover:text-nexus-text-muted transition-colors flex-shrink-0"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Help / Keyboard Shortcuts Section */}
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-nexus-text-muted font-semibold mb-3">
            Help
          </h2>
          <div className="border border-nexus-border rounded-lg overflow-hidden divide-y divide-nexus-border">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <div
                  key={shortcut.label}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-nexus-sidebar/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={14}
                      className="text-nexus-text-muted group-hover:text-nexus-accent transition-colors"
                      strokeWidth={1.5}
                    />
                    <span className="text-sm text-nexus-text group-hover:text-white transition-colors">
                      {shortcut.label}
                    </span>
                  </div>
                  <kbd className="text-[11px] font-mono text-nexus-text-muted bg-nexus-border/60 px-2 py-0.5 rounded border border-nexus-border">
                    {shortcut.keys}
                  </kbd>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
