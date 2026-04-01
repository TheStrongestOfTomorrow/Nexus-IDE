import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Files,
  Search,
  GitBranch,
  Play,
  Puzzle,
  MessageSquare,
  Settings,
  Terminal as TerminalIcon,
  X,
  ChevronRight,
  Bell,
  CheckCircle,
  AlertCircle,
  Sparkles,
  User,
  ChevronDown,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeft,
  MoreHorizontal,
  Circle,
  Monitor,
} from 'lucide-react';
import { cn } from '../lib/utils';

// ─── Activity Sidebar Item Types ─────────────────────────────────────────────
export type VSCodeActivityItem =
  | 'explorer'
  | 'search'
  | 'git'
  | 'debug'
  | 'extensions'
  | 'ai'
  | 'linux';

export type BottomPanelTab = 'terminal' | 'problems' | 'output' | 'debug-console';

// ─── Props Interface ─────────────────────────────────────────────────────────
export interface VSCodeLayoutProps {
  // Files
  files: any[];
  activeFileId: string | null;
  openFileIds: string[];
  onHandleSelectFile: (id: string) => void;
  onCloseFile: (id: string) => void;

  // File operations
  onAddFile: (name: string, content: string) => void;
  onUpdateFile: (id: string, content: string) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onOpenFolder: () => void;
  onExport: () => void;
  onClearWorkspace: () => void;
  onSaveWorkspace: () => void;

  // AI
  apiKeys: Record<string, string>;
  selectedAIProvider: string;
  selectedModels: Record<string, string>;
  githubToken: string;
  aiAssistantRef: any;
  onPendingActions: (actions: any[] | null) => void;

  // UI controls
  showTerminal: boolean;
  onToggleTerminal: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  showAI: boolean;
  onToggleAI: () => void;
  onShowSettings: () => void;

  // Misc
  diffData: any;
  onSetDiffData: (data: any) => void;
  sessionId: string | null;
  isCommandPaletteOpen: boolean;
  onSetIsCommandPaletteOpen: (open: boolean) => void;

  // Children / extra content slots
  sidebarContent?: React.ReactNode;
  editorContent?: React.ReactNode;
  bottomPanelContent?: React.ReactNode;
  extraComponents?: React.ReactNode;

  // Active file details for status bar
  activeFileLanguage?: string;
  activeFileEncoding?: string;
  activeFileCursorLine?: number;
  activeFileCursorCol?: number;

  // Activity sync — parent can listen to activity bar clicks
  activeActivity?: string;
  onActivityChange?: (activity: string) => void;

  // Preview content
  previewContent?: React.ReactNode;
}

// ─── File icon helper ────────────────────────────────────────────────────────
function getFileIconColor(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return 'text-orange-400';
    case 'css':
    case 'scss':
    case 'less':
      return 'text-blue-400';
    case 'js':
    case 'jsx':
      return 'text-yellow-400';
    case 'ts':
    case 'tsx':
      return 'text-blue-500';
    case 'py':
      return 'text-green-400';
    case 'json':
      return 'text-yellow-600';
    case 'md':
      return 'text-gray-400';
    case 'sql':
      return 'text-pink-400';
    case 'svg':
    case 'png':
    case 'jpg':
    case 'gif':
      return 'text-purple-400';
    default:
      return 'text-gray-400';
  }
}

function getFileLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    js: 'JavaScript',
    jsx: 'JavaScript React',
    ts: 'TypeScript',
    tsx: 'TypeScript React',
    html: 'HTML',
    htm: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    less: 'LESS',
    py: 'Python',
    json: 'JSON',
    md: 'Markdown',
    sql: 'SQL',
    yaml: 'YAML',
    yml: 'YAML',
    xml: 'XML',
    java: 'Java',
    go: 'Go',
    rs: 'Rust',
    cpp: 'C++',
    c: 'C',
    rb: 'Ruby',
    php: 'PHP',
    sh: 'Shell',
    bash: 'Shell',
    svg: 'SVG',
    txt: 'Plain Text',
  };
  return langMap[ext || ''] || 'Plain Text';
}

// ─── Menu Bar Component ──────────────────────────────────────────────────────
function VSCodeMenuBar({ onQuickOpen }: { onQuickOpen?: () => void }) {
  const menuItems = ['File', 'Edit', 'Selection', 'View', 'Run', 'Terminal', 'Help'];

  return (
    <div className="h-8 bg-[#323233] flex items-center px-3 select-none border-b border-[#252526] flex-shrink-0">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-5 h-5 rounded bg-[#007acc] flex items-center justify-center">
          <Sparkles size={11} className="text-white" />
        </div>
        <span className="text-[12px] font-semibold text-white tracking-tight">
          Nexus IDE 5.5.0
        </span>
      </div>

      <div className="flex items-center h-full">
        {menuItems.map((item) => (
          <button
            key={item}
            className="px-2.5 h-full text-[12px] text-[#cccccc] hover:bg-[#505050] transition-colors"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Quick Open Search Bar */}
      <div className="ml-4 flex-1 max-w-md">
        <button
          onClick={() => onQuickOpen?.()}
          className="w-full flex items-center gap-2 px-3 py-1 bg-[#3c3c3c] rounded text-[12px] text-[#858585] hover:bg-[#4c4c4c] transition-colors"
        >
          <Search size={12} />
          <span>Search files (Ctrl+P)</span>
        </button>
      </div>
    </div>
  );
}

// ─── Activity Bar (Left Icon Strip) ──────────────────────────────────────────
const ACTIVITY_ITEMS: {
  id: VSCodeActivityItem;
  icon: React.ElementType;
  label: string;
}[] = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'git', icon: GitBranch, label: 'Source Control' },
  { id: 'debug', icon: Play, label: 'Run and Debug' },
  { id: 'extensions', icon: Puzzle, label: 'Extensions' },
  { id: 'ai', icon: Sparkles, label: 'AI Assistant' },
  { id: 'linux', icon: Monitor, label: 'Linux Terminal' },
];

function VSCodeActivityBar({
  activeItem,
  onItemClick,
  onToggleTerminal,
  onShowSettings,
  showTerminal,
}: {
  activeItem: VSCodeActivityItem | null;
  onItemClick: (item: VSCodeActivityItem) => void;
  onToggleTerminal: () => void;
  onShowSettings: () => void;
  showTerminal: boolean;
}) {
  return (
    <div className="w-12 bg-[#333333] flex flex-col items-center py-1 flex-shrink-0 border-r border-[#252526]">
      {/* Top items */}
      <div className="flex flex-col items-center gap-0.5 flex-1">
        {ACTIVITY_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onItemClick(activeItem === id ? 'explorer' : id)}
            className={cn(
              'w-12 h-12 flex items-center justify-center relative transition-colors group',
              activeItem === id
                ? 'text-white'
                : 'text-[#858585] hover:text-white'
            )}
            title={label}
          >
            {/* Active indicator (left border) */}
            {activeItem === id && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
            )}
            <Icon size={24} strokeWidth={1.5} />
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#252526] text-white text-[11px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {label}
            </div>
          </button>
        ))}
      </div>

      {/* Bottom items */}
      <div className="flex flex-col items-center gap-0.5 pb-1">
        <button
          onClick={onToggleTerminal}
          className={cn(
            'w-12 h-12 flex items-center justify-center relative transition-colors group',
            showTerminal
              ? 'text-white'
              : 'text-[#858585] hover:text-white'
          )}
          title="Terminal"
        >
          {showTerminal && (
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
          )}
          <TerminalIcon size={24} strokeWidth={1.5} />
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#252526] text-white text-[11px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Panel
          </div>
        </button>

        <button
          className="w-12 h-12 flex items-center justify-center relative transition-colors group text-[#858585] hover:text-white"
          title="Accounts"
        >
          <User size={24} strokeWidth={1.5} />
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#252526] text-white text-[11px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Accounts
          </div>
        </button>

        <button
          onClick={onShowSettings}
          className="w-12 h-12 flex items-center justify-center relative transition-colors group text-[#858585] hover:text-white"
          title="Settings"
        >
          <Settings size={24} strokeWidth={1.5} />
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#252526] text-white text-[11px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Settings
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── File Tabs ───────────────────────────────────────────────────────────────
function VSCodeFileTabs({
  files,
  openFileIds,
  activeFileId,
  onSelectFile,
  onCloseFile,
}: {
  files: any[];
  openFileIds: string[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCloseFile: (id: string) => void;
}) {
  if (openFileIds.length === 0) return null;

  return (
    <div className="flex items-center bg-[#2d2d2d] h-9 overflow-x-auto flex-shrink-0 border-b border-[#252526] relative" style={{ scrollbarWidth: 'none' }}>
      {openFileIds.map((id) => {
        const file = files.find((f) => f.id === id);
        if (!file) return null;
        const isActive = id === activeFileId;
        const fileName = file.name.split('/').pop() || file.name;
        const isModified = file.content !== file.originalContent;

        return (
          <div
            key={id}
            onClick={() => onSelectFile(id)}
            className={cn(
              'group flex items-center gap-1.5 px-3 h-full text-[12px] cursor-pointer min-w-0 flex-shrink-0 border-r border-[#252526] transition-colors relative',
              isActive
                ? 'bg-[#1e1e1e] text-white'
                : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#2a2a2a]'
            )}
          >
            {/* Active top border */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#007acc]" />
            )}
            <span className="truncate max-w-[120px]">{fileName}</span>
            {isModified && (
              <Circle size={7} className="fill-current text-white flex-shrink-0" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseFile(id);
              }}
              className={cn(
                'ml-1 rounded p-0.5 flex-shrink-0 transition-colors',
                isActive
                  ? 'hover:bg-[#505050] text-[#cccccc]'
                  : 'hover:bg-[#505050] text-[#858585] opacity-0 group-hover:opacity-100'
              )}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
      {/* Fade indicator when tabs overflow */}
      {openFileIds.length > 4 && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#2d2d2d] to-transparent pointer-events-none z-10" />
      )}
    </div>
  );
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────
function VSCodeBreadcrumbs({
  files,
  activeFileId,
}: {
  files: any[];
  activeFileId: string | null;
}) {
  const activeFile = files.find((f) => f.id === activeFileId);
  if (!activeFile) return null;

  const parts = activeFile.name.split('/');

  return (
    <div className="flex items-center h-6 px-3 bg-[#1e1e1e] text-[12px] text-[#a0a0a0] flex-shrink-0 border-b border-[#252526] overflow-hidden">
      {parts.map((part: string, i: number) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <ChevronRight size={14} className="mx-1 text-[#707070] flex-shrink-0" />
          )}
          <span
            className={cn(
              'hover:text-[#e0e0e0] cursor-pointer transition-colors truncate',
              i === parts.length - 1 && 'text-[#e0e0e0]'
            )}
          >
            {part}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Bottom Panel ────────────────────────────────────────────────────────────
const BOTTOM_TABS: { id: BottomPanelTab; label: string }[] = [
  { id: 'terminal', label: 'Terminal' },
  { id: 'problems', label: 'Problems' },
  { id: 'output', label: 'Output' },
  { id: 'debug-console', label: 'Debug Console' },
];

function VSCodeBottomPanel({
  showTerminal,
  activeTab,
  onActiveTabChange,
  onToggleTerminal,
  onClose,
  content,
  onResize,
  panelHeight,
}: {
  showTerminal: boolean;
  activeTab: BottomPanelTab;
  onActiveTabChange: (tab: BottomPanelTab) => void;
  onToggleTerminal: () => void;
  onClose: () => void;
  content?: React.ReactNode;
  onResize: (delta: number) => void;
  panelHeight: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const rafId = useRef<number>(0);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = 0;
    }
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging.current) return;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const delta = startY.current - clientY;
      onResize(delta);
    });
  }, [onResize]);

  const handleDragStart = useCallback(
    (clientY: number) => {
      isDragging.current = true;
      startY.current = clientY;
      startHeight.current = panelRef.current?.offsetHeight || 200;

      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove, { passive: true });
      document.addEventListener('touchend', handleDragEnd);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    },
    [handleDragMove, handleDragEnd]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleDragStart(e.clientY);
    },
    [handleDragStart]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientY);
    },
    [handleDragStart]
  );

  if (!showTerminal) return null;

  return (
    <div className="flex flex-col bg-[#1e1e1e] border-t border-[#252526]" style={{ height: `${panelHeight}px` }} ref={panelRef}>
      {/* Resize handle */}
      <div
        className="h-1 cursor-ns-resize hover:bg-[#007acc]/50 transition-colors flex-shrink-0"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      />

      {/* Panel Header */}
      <div className="flex items-center justify-between h-9 bg-[#007acc] flex-shrink-0 px-2">
        <div className="flex items-center h-full">
          {BOTTOM_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onActiveTabChange(id)}
              className={cn(
                'px-3 h-full text-[12px] font-medium transition-colors relative',
                activeTab === id
                  ? 'text-white'
                  : 'text-[#ffffff99] hover:text-white'
              )}
            >
              {label}
              {activeTab === id && (
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleTerminal}
            className="p-1 text-[#ffffff99] hover:text-white transition-colors"
            title="Minimize"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-[#ffffff99] hover:text-white transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">{content}</div>
    </div>
  );
}

// ─── Status Bar ──────────────────────────────────────────────────────────────
function VSCodeStatusBar({
  files,
  activeFileId,
  activeFileLanguage,
  activeFileEncoding,
  activeFileCursorLine,
  activeFileCursorCol,
  isRemote,
  branchName,
}: {
  files: any[];
  activeFileId: string | null;
  activeFileLanguage?: string;
  activeFileEncoding?: string;
  activeFileCursorLine?: number;
  activeFileCursorCol?: number;
  isRemote?: boolean;
  branchName?: string;
}) {
  const activeFile = files.find((f) => f.id === activeFileId);
  const language = activeFileLanguage || (activeFile ? getFileLanguage(activeFile.name) : '');
  const encoding = activeFileEncoding || 'UTF-8';
  const line = activeFileCursorLine ?? 1;
  const col = activeFileCursorCol ?? 1;

  const totalLines = files.reduce((acc: number, f: any) => acc + f.content.split('\n').length, 0);
  const hasProblems = false; // placeholder
  const hasWarnings = false; // placeholder

  return (
    <div className="h-[22px] bg-[#007acc] flex items-center justify-between px-2 select-none flex-shrink-0">
      {/* Left side */}
      <div className="flex items-center h-full">
        {/* Remote indicator */}
        <div className="flex items-center gap-1 px-2 h-full hover:bg-[#1f8ad2] cursor-pointer transition-colors">
          <div className={cn('w-2 h-2 rounded-full', isRemote ? 'bg-yellow-400' : 'bg-green-400')} />
          <span className="text-[11px] text-white">{isRemote ? 'Remote' : 'Local'}</span>
        </div>

        {/* Git branch */}
        <div className="flex items-center gap-1 px-2 h-full hover:bg-[#1f8ad2] cursor-pointer transition-colors">
          <GitBranch size={12} className="text-white" />
          <span className="text-[11px] text-white">{branchName || 'main'}</span>
        </div>

        {/* Problems indicator */}
        <div className="flex items-center gap-1.5 px-2 h-full hover:bg-[#1f8ad2] cursor-pointer transition-colors">
          {hasProblems && (
            <div className="flex items-center gap-0.5">
              <AlertCircle size={12} className="text-white" />
              <span className="text-[11px] text-white">0</span>
            </div>
          )}
          {hasWarnings && (
            <div className="flex items-center gap-0.5">
              <AlertCircle size={12} className="text-yellow-300" />
              <span className="text-[11px] text-white">0</span>
            </div>
          )}
          <div className="flex items-center gap-0.5">
            <CheckCircle size={12} className="text-white" />
            <span className="text-[11px] text-white">0</span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center h-full">
        <div className="px-2 h-full flex items-center hover:bg-[#1f8ad2] cursor-pointer transition-colors">
          <span className="text-[11px] text-white">
            Ln {line}, Col {col}
          </span>
        </div>
        <div className="px-2 h-full flex items-center hover:bg-[#1f8ad2] cursor-pointer transition-colors">
          <span className="text-[11px] text-white">Spaces: 2</span>
        </div>
        <div className="px-2 h-full flex items-center hover:bg-[#1f8ad2] cursor-pointer transition-colors">
          <span className="text-[11px] text-white">{encoding}</span>
        </div>
        <div className="px-2 h-full flex items-center hover:bg-[#1f8ad2] cursor-pointer transition-colors">
          <span className="text-[11px] text-white">{language}</span>
        </div>
        <div className="px-2 h-full flex items-center hover:bg-[#1f8ad2] cursor-pointer transition-colors">
          <span className="text-[11px] text-white">{totalLines.toLocaleString()} LOC</span>
        </div>
        <div className="flex items-center gap-1 px-2 h-full hover:bg-[#1f8ad2] cursor-pointer transition-colors">
          <Bell size={12} className="text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Empty State / Welcome Tab ───────────────────────────────────────────────
function VSCodeWelcomeTab() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-[#cccccc]">
      <div className="text-center max-w-lg px-8 space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-[#007acc]/20 flex items-center justify-center">
          <Sparkles size={36} className="text-[#007acc]" />
        </div>
        <h1 className="text-3xl font-light tracking-tight text-white">Nexus IDE 5.5.0</h1>
        <p className="text-sm text-[#858585] leading-relaxed">
          AI-powered code editor with real Alpine Linux, split view, and enhanced editor features.
        </p>
        <div className="flex items-center justify-center gap-6 text-[12px] text-[#858585]">
          <span>Ctrl+P — Quick Open</span>
          <span>Ctrl+` — Terminal</span>
          <span>Ctrl+Shift+P — Commands</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN VSCodeLayout Component ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function VSCodeLayout({
  files,
  activeFileId,
  openFileIds,
  onHandleSelectFile,
  onCloseFile,
  onAddFile,
  onUpdateFile,
  onDeleteFile,
  onRenameFile,
  onOpenFolder,
  onExport,
  onClearWorkspace,
  onSaveWorkspace,
  apiKeys,
  selectedAIProvider,
  selectedModels,
  githubToken,
  aiAssistantRef,
  onPendingActions,
  showTerminal,
  onToggleTerminal,
  showPreview,
  onTogglePreview,
  showAI,
  onToggleAI,
  onShowSettings,
  diffData,
  onSetDiffData,
  sessionId,
  isCommandPaletteOpen,
  onSetIsCommandPaletteOpen,
  sidebarContent,
  editorContent,
  bottomPanelContent,
  extraComponents,
  activeFileLanguage,
  activeFileEncoding,
  activeFileCursorLine,
  activeFileCursorCol,
  activeActivity: externalActivity,
  onActivityChange,
  previewContent,
}: VSCodeLayoutProps) {
  // Local state
  const [activeActivity, setActiveActivity] = useState<VSCodeActivityItem>((externalActivity || 'explorer') as VSCodeActivityItem);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [bottomPanelActiveTab, setBottomPanelActiveTab] = useState<BottomPanelTab>('terminal');
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [aiPanelVisible, setAiPanelVisible] = useState(showAI);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const sidebarResizeRef = useRef<{ isDragging: boolean; startX: number; startWidth: number }>({ isDragging: false, startX: 0, startWidth: 240 });

  // Sync AI panel visibility
  useEffect(() => {
    setAiPanelVisible(showAI);
  }, [showAI]);

  // Sync external activity changes (e.g. from parent)
  useEffect(() => {
    if (externalActivity && externalActivity !== activeActivity) {
      setActiveActivity(externalActivity as VSCodeActivityItem);
    }
  }, [externalActivity]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sidebar resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { isDragging, startX, startWidth } = sidebarResizeRef.current;
      if (!isDragging) return;
      const delta = e.clientX - startX;
      setSidebarWidth(Math.max(160, Math.min(500, startWidth + delta)));
    };
    const handleMouseUp = () => {
      sidebarResizeRef.current.isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    sidebarResizeRef.current = { isDragging: true, startX: e.clientX, startWidth: sidebarWidth };
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  // Handle activity bar click — toggle sidebar panel like real VS Code
  const handleActivityClick = useCallback(
    (item: VSCodeActivityItem) => {
      if (activeActivity === item && sidebarVisible) {
        setSidebarVisible(false);
      } else {
        setActiveActivity(item);
        setSidebarVisible(true);
        // Notify parent of activity change so sidebar content updates
        onActivityChange?.(item);
      }
    },
    [activeActivity, sidebarVisible, onActivityChange]
  );

  // Bottom panel resize
  const handleBottomPanelResize = useCallback((delta: number) => {
    setBottomPanelHeight((prev) => {
      const viewportHeight = window.innerHeight;
      const maxH = Math.floor(viewportHeight * 0.6);
      return Math.max(100, Math.min(maxH, prev + delta));
    });
  }, []);

  // Get the active file
  const activeFile = files.find((f) => f.id === activeFileId) || null;

  // Render sidebar content based on active activity
  const renderSidebarContent = () => {
    if (sidebarContent) return sidebarContent;

    // If the parent provides custom sidebar content via the slot, use it
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#252526]">
        <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-[#bbbbbb] uppercase tracking-wider">
          <span>
            {activeActivity === 'explorer'
              ? 'Explorer'
              : activeActivity === 'search'
                ? 'Search'
                : activeActivity === 'git'
                  ? 'Source Control'
                  : activeActivity === 'debug'
                    ? 'Run and Debug'
                    : activeActivity === 'extensions'
                      ? 'Extensions'
                      : 'AI Assistant'}
          </span>
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-[#37373d] rounded text-[#858585] hover:text-white transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-[11px] text-[#858585] text-center">
            {activeActivity === 'explorer'
              ? 'Files will appear here'
              : activeActivity === 'search'
                ? 'Search across files'
                : activeActivity === 'git'
                  ? 'No source control providers'
                  : activeActivity === 'debug'
                    ? 'No debug configurations'
                    : activeActivity === 'extensions'
                      ? 'Browse extensions'
                      : 'AI-powered assistant'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="nexus-vscode-root flex flex-col h-screen w-screen overflow-hidden bg-[#1e1e1e] text-[#cccccc]" style={{ gridTemplateRows: 'auto 1fr auto', display: 'grid' }}>
      {/* ─── Menu Bar ──────────────────────────────────────────── */}
      <VSCodeMenuBar onQuickOpen={isCommandPaletteOpen ? undefined : () => onSetIsCommandPaletteOpen(true)} />

      {/* ─── Main Body ─────────────────────────────────────────── */}
      <div className="flex overflow-hidden min-h-0">
        {/* ─── Activity Bar (Left Icons) ───────────────────────── */}
        <VSCodeActivityBar
          activeItem={sidebarVisible ? activeActivity : null}
          onItemClick={handleActivityClick}
          onToggleTerminal={onToggleTerminal}
          onShowSettings={onShowSettings}
          showTerminal={showTerminal}
        />

        {/* ─── Sidebar Panel ───────────────────────────────────── */}
        {sidebarVisible && (
          <div
            className="flex flex-col border-r border-[#1e1e1e] overflow-hidden flex-shrink-0 transition-all duration-150 relative"
            style={{ width: sidebarWidth }}
          >
            {/* Sidebar resize handle */}
            <div
              className="absolute top-0 right-0 bottom-0 w-[3px] cursor-ew-resize hover:bg-[#007acc]/50 z-10"
              onMouseDown={handleSidebarResizeStart}
            />

            <div className="flex flex-col h-full w-full">
              {renderSidebarContent()}
            </div>
          </div>
        )}

        {/* ─── Main Editor Area ────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* File Tabs */}
          <VSCodeFileTabs
            files={files}
            openFileIds={openFileIds}
            activeFileId={activeFileId}
            onSelectFile={onHandleSelectFile}
            onCloseFile={onCloseFile}
          />

          {/* Breadcrumbs */}
          <VSCodeBreadcrumbs files={files} activeFileId={activeFileId} />

          {/* Editor + AI Split */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Editor / Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
              {editorContent ? (
                <div className="flex-1 overflow-hidden">{editorContent}</div>
              ) : activeFile ? (
                <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-[#007acc]/10 flex items-center justify-center">
                      <Files size={24} className="text-[#007acc]" />
                    </div>
                    <p className="text-[13px] text-[#cccccc]">{activeFile.name}</p>
                    <p className="text-[11px] text-[#858585]">
                      Editor content loaded via props
                    </p>
                  </div>
                </div>
              ) : (
                <VSCodeWelcomeTab />
              )}
            </div>

            {/* Preview Panel (right side) */}
            {showPreview && (
              <div className="w-[300px] flex-shrink-0 border-l border-[#252526] flex flex-col bg-white overflow-hidden">
                <div className="flex items-center justify-between h-9 px-3 bg-[#252526] border-b border-[#1e1e1e] flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[#cccccc]">
                      Preview
                    </span>
                  </div>
                  <button
                    onClick={onTogglePreview}
                    className="p-1 hover:bg-[#37373d] rounded text-[#858585] hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {previewContent || (
                    <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-[#858585]">
                      <span className="text-[11px]">Preview content via props</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Panel (right side) */}
            {aiPanelVisible && (
              <div className="w-[320px] flex-shrink-0 border-l border-[#252526] flex flex-col bg-[#252526] overflow-hidden">
                <div className="flex items-center justify-between h-9 px-3 bg-[#252526] border-b border-[#1e1e1e] flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#007acc]" />
                    <span className="text-[12px] font-medium text-white">
                      AI Assistant
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-[#37373d] rounded text-[#858585] hover:text-white transition-colors">
                      <Maximize2 size={12} />
                    </button>
                    <button
                      onClick={onToggleAI}
                      className="p-1 hover:bg-[#37373d] rounded text-[#858585] hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden bg-[#1e1e1e] flex items-center justify-center">
                  <div className="text-center px-4 space-y-3">
                    <Sparkles size={28} className="text-[#007acc]/50 mx-auto" />
                    <p className="text-[11px] text-[#858585]">
                      AI Assistant panel
                    </p>
                    <p className="text-[10px] text-[#5a5a5a]">
                      Pass AIAssistant component via props to activate
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Bottom Panel ───────────────────────────────────── */}
          <VSCodeBottomPanel
            showTerminal={showTerminal}
            activeTab={bottomPanelActiveTab}
            onActiveTabChange={setBottomPanelActiveTab}
            onToggleTerminal={onToggleTerminal}
            onClose={onToggleTerminal}
            onResize={handleBottomPanelResize}
            panelHeight={bottomPanelHeight}
            content={
              bottomPanelContent || (
                <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-[#858585]">
                  <div className="flex flex-col items-center gap-2">
                    <TerminalIcon size={24} className="text-[#858585]/50" />
                    <span className="text-[11px]">
                      Terminal content via props
                    </span>
                  </div>
                </div>
              )
            }
          />
        </div>
      </div>

      {/* ─── Status Bar ────────────────────────────────────────── */}
      <VSCodeStatusBar
        files={files}
        activeFileId={activeFileId}
        activeFileLanguage={activeFileLanguage}
        activeFileEncoding={activeFileEncoding}
        activeFileCursorLine={activeFileCursorLine}
        activeFileCursorCol={activeFileCursorCol}
        isRemote={false}
        branchName="main"
      />

      {/* ─── Extra Components ──────────────────────────────────── */}
      {extraComponents}
    </div>
  );
}
