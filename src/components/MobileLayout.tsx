'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Zap, FilePlus, FolderOpen, MessageSquare, Play, Settings,
  Search, GitBranch, Terminal as TerminalIcon, ChevronLeft,
  X, PanelLeft, Wifi, WifiOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import Sidebar from './Sidebar';
import Editor from './Editor';
import AIAssistant from './AIAssistant';
import Terminal from './Terminal';
import SearchView from './SearchView';
import GithubView from './GithubView';
import SettingsPanel from './SettingsPanel';

// ─── Shared Types ───────────────────────────────────────────

interface MobileLayoutProps {
  files: any[];
  activeFileId: string | null;
  openFileIds: string[];
  activeActivity: string;
  showSettings: boolean;
  showTerminal: boolean;
  showAI: boolean;
  showSidebar: boolean;
  showPreview: boolean;
  apiKeys: Record<string, string>;
  selectedAIProvider: string;
  selectedModels: Record<string, string>;
  githubToken: string;
  isOffline: boolean;
  isFullLock: boolean;
  airplaneModeEnabled: boolean;
  ollamaUrl: string;
  sessionSavedAt: string | null;
  gitBranch?: string;
  gitRepoName?: string;
  // Callbacks
  onHandleSelectFile: (id: string) => void;
  onCloseFile: (id: string) => void;
  onAddFile: (name: string, content?: string) => any;
  onUpdateFile: (id: string, content: string, silent?: boolean) => Promise<void> | void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onOpenFolder: () => void;
  onExport: () => void;
  onClearWorkspace: () => void;
  onSaveWorkspace: () => void;
  onShowSettings: () => void;
  onCloseSettings: () => void;
  setShowSidebar: (v: boolean) => void;
  setShowTerminal: (v: boolean) => void;
  setShowAI: (v: boolean) => void;
  setShowPreview: (v: boolean) => void;
  setActiveActivity: (a: string) => void;
  setApiKey: (provider: string, key: string) => void;
  setSelectedAIProvider: (p: string) => void;
  setSelectedModels: (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setGithubToken: (t: string) => void;
  setGithubClientId: (t: string) => void;
  setGithubClientSecret: (t: string) => void;
  setOllamaUrl: (u: string) => void;
  onToggleAirplaneMode: () => void;
  onToggleFullLock: () => void;
  setGitBranch: (b: string | undefined) => void;
  setGitRepoName: (r: string | undefined) => void;
  setUiMode: (m: any) => void;
  toggleTouchMode: () => void;
  aiAssistantRef: React.RefObject<any>;
  onPendingActions: (actions: any[] | null) => void;
  pendingAiActions: any[] | null;
  onAcceptAiActions: (actions: any[]) => Promise<void>;
  onRejectAiActions: () => void;
  onSetDiffData: (data: { original: string; modified: string; fileId: string } | null) => void;
  activeFolder: string | null;
  setActiveFolder: (f: string | null) => void;
  githubClientId: string;
  githubClientSecret: string;
}

// ─── Portrait Tab Definition ────────────────────────────────

type PortraitTab = 'files' | 'search' | 'ai' | 'terminal' | 'git';

const PORTRAIT_TABS: { id: PortraitTab; label: string; icon: React.ElementType }[] = [
  { id: 'files', label: 'Files', icon: FolderOpen },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'ai', label: 'AI Chat', icon: MessageSquare },
  { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
  { id: 'git', label: 'Git', icon: GitBranch },
];

// ─── Hook: useSwipe ─────────────────────────────────────────

function useSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only trigger swipe if horizontal movement dominates
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchEnd };
}

// ─── Mobile Portrait Layout ─────────────────────────────────

export function MobilePortraitLayout(props: MobileLayoutProps) {
  const {
    files, activeFileId, onHandleSelectFile, onAddFile, onDeleteFile,
    onRenameFile, onOpenFolder, onExport, onClearWorkspace, onSaveWorkspace,
    onSetDiffData, activeFolder, setActiveFolder, pendingAiActions,
    onAcceptAiActions, onRejectAiActions, aiAssistantRef, onPendingActions,
  } = props;

  const [activeTab, setActiveTab] = useState<PortraitTab>('files');
  const [fileOverlayOpen, setFileOverlayOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const activeFile = files.find(f => f.id === activeFileId) || null;

  // Swipe between tabs
  const handleSwipeLeft = useCallback(() => {
    setActiveTab(prev => {
      const idx = PORTRAIT_TABS.findIndex(t => t.id === prev);
      return idx < PORTRAIT_TABS.length - 1 ? PORTRAIT_TABS[idx + 1].id : prev;
    });
  }, []);

  const handleSwipeRight = useCallback(() => {
    setActiveTab(prev => {
      const idx = PORTRAIT_TABS.findIndex(t => t.id === prev);
      return idx > 0 ? PORTRAIT_TABS[idx - 1].id : prev;
    });
  }, []);

  const { onTouchStart, onTouchEnd } = useSwipe(handleSwipeLeft, handleSwipeRight);

  // Open file editor overlay when selecting a file
  const handleFileSelect = useCallback((id: string) => {
    onHandleSelectFile(id);
    setFileOverlayOpen(true);
  }, [onHandleSelectFile]);

  // Close file overlay and return to files tab
  const handleCloseFileOverlay = useCallback(() => {
    setFileOverlayOpen(false);
    setActiveTab('files');
  }, []);

  // ── Render: File overlay (full-screen editor) ──
  const renderFileOverlay = () => {
    if (!fileOverlayOpen || !activeFile) return null;
    return (
      <div className="fixed inset-0 z-[80] bg-nexus-bg flex flex-col">
        {/* Thin header with back button */}
        <div className="flex items-center gap-2 px-2 py-1.5 bg-nexus-sidebar border-b border-nexus-border min-h-[36px]">
          <button
            onClick={handleCloseFileOverlay}
            className="p-1.5 rounded-md hover:bg-white/10 text-nexus-text-muted active:scale-95 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-white truncate block">
              {activeFile.name.split('/').pop()}
            </span>
          </div>
          <button
            onClick={() => props.setShowTerminal(true)}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              props.showTerminal ? "text-nexus-accent" : "text-nexus-text-muted hover:bg-white/10"
            )}
          >
            <TerminalIcon size={16} />
          </button>
        </div>

        {/* Editor fills the rest */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <Editor
              file={activeFile}
              onChange={(content) => props.onUpdateFile(activeFile.id, content)}
              apiKeys={props.apiKeys}
              onToggleTerminal={() => props.setShowTerminal(!props.showTerminal)}
            />
          </div>
          {props.showTerminal && (
            <div className="h-48 border-t border-nexus-border bg-nexus-bg flex-shrink-0">
              <Terminal
                files={files}
                onClose={() => props.setShowTerminal(false)}
                onPreview={() => props.setShowPreview(true)}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Render: Tab content ──
  const renderTabContent = () => {
    switch (activeTab) {
      case 'files':
        return (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Open file tabs */}
            {props.openFileIds.length > 0 && (
              <div className="flex items-center overflow-x-auto no-scrollbar border-b border-nexus-border bg-nexus-sidebar min-h-[36px]">
                {props.openFileIds.map(id => {
                  const file = files.find(f => f.id === id);
                  if (!file) return null;
                  return (
                    <div
                      key={id}
                      onClick={() => handleFileSelect(id)}
                      className={cn(
                        "flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap flex-shrink-0 cursor-pointer",
                        props.activeFileId === id
                          ? "text-white border-b-2 border-nexus-accent bg-nexus-bg/50"
                          : "text-nexus-text-muted hover:text-white"
                      )}
                    >
                      <span className="truncate max-w-[100px]">{file.name.split('/').pop()}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); props.onCloseFile(id); }}
                        className="p-0.5 hover:bg-white/10 rounded text-nexus-text-muted"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleFileSelect}
                onAddFile={onAddFile}
                onDeleteFile={onDeleteFile}
                onRenameFile={onRenameFile}
                onExport={onExport}
                onClearWorkspace={onClearWorkspace}
                onSaveWorkspace={onSaveWorkspace}
                onShowWorkspace={() => {}}
                onApplyTemplate={() => {}}
                onShowDiff={(id) => {
                  const f = files.find(x => x.id === id);
                  if (f) onSetDiffData({ original: f.originalContent || f.content, modified: f.content, fileId: id });
                }}
                onOpenFolder={onOpenFolder}
                onSelectFolder={setActiveFolder}
                activeFolder={activeFolder}
                pendingAiActions={pendingAiActions}
                onAcceptAiActions={onAcceptAiActions}
                onRejectAiActions={onRejectAiActions}
              />
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="flex-1 overflow-hidden">
            <SearchView files={files} onSelectFile={handleFileSelect} />
          </div>
        );

      case 'ai':
        return (
          <div className="flex-1 overflow-hidden">
            <AIAssistant
              ref={aiAssistantRef}
              files={files}
              activeFileId={activeFileId}
              onAddFile={onAddFile}
              onUpdateFile={props.onUpdateFile}
              onDeleteFile={onDeleteFile}
              apiKeys={props.apiKeys}
              selectedProvider={props.selectedAIProvider}
              selectedModels={props.selectedModels}
              githubToken={props.githubToken}
              onPendingActions={onPendingActions}
              isMaximized={true}
              onToggleMaximize={() => {}}
            />
          </div>
        );

      case 'terminal':
        return (
          <div className="flex-1 overflow-hidden">
            <Terminal
              files={files}
              onClose={() => setActiveTab('files')}
              onPreview={() => props.setShowPreview(true)}
            />
          </div>
        );

      case 'git':
        return (
          <div className="flex-1 overflow-hidden">
            <GithubView
              files={files}
              onImportFiles={(importedFiles) => {
                importedFiles.forEach(f => {
                  if (!files.find(ef => ef.name === f.name)) onAddFile(f.name, f.content);
                });
              }}
              onClearWorkspace={onClearWorkspace}
              onUserUpdate={() => {}}
              onBranchChange={props.setGitBranch}
              onRepoChange={props.setGitRepoName}
              onUpdateFile={props.onUpdateFile as any}
              activeFileId={activeFileId}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="nexus-mobile-portrait flex flex-col h-screen w-screen bg-nexus-bg text-nexus-text overflow-hidden select-none">
      {/* ── Thin Title Bar ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-nexus-sidebar border-b border-nexus-border min-h-[36px] flex-shrink-0">
        {/* Hamburger menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 rounded-md hover:bg-white/10 text-nexus-text-muted active:scale-95 transition-all"
        >
          <PanelLeft size={18} />
        </button>
        <Zap size={14} className="text-nexus-accent flex-shrink-0" />
        <span className="text-xs font-semibold text-white flex-shrink-0">Nexus IDE</span>
        {activeFile && (
          <span className="text-[10px] text-nexus-text-muted truncate ml-2 flex-1">
            {activeFile.name.split('/').pop()}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {props.isOffline && <WifiOff size={12} className="text-red-400" />}
          <button
            onClick={props.onShowSettings}
            className="p-1.5 rounded-md hover:bg-white/10 text-nexus-text-muted active:scale-95 transition-all"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* ── Menu dropdown ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[70]" onClick={() => setMenuOpen(false)}>
          <div className="absolute top-[36px] left-0 right-0 bg-nexus-sidebar border-b border-nexus-border shadow-2xl z-10">
            <div className="py-1">
              <button
                onClick={(e) => { e.stopPropagation(); onExport(); setMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 text-xs text-nexus-text-muted hover:bg-white/5 hover:text-white w-full text-left"
              >
                <FolderOpen size={14} /> Export as ZIP
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onSaveWorkspace(); setMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 text-xs text-nexus-text-muted hover:bg-white/5 hover:text-white w-full text-left"
              >
                <Zap size={14} /> Save Workspace
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenFolder(); setMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 text-xs text-nexus-text-muted hover:bg-white/5 hover:text-white w-full text-left"
              >
                <FolderOpen size={14} /> Open Folder
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); props.toggleTouchMode(); setMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 text-xs text-nexus-text-muted hover:bg-white/5 hover:text-white w-full text-left"
              >
                <PanelLeft size={14} /> Exit Touch Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div
        className="flex-1 overflow-hidden relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {renderTabContent()}
      </div>

      {/* ── Bottom Tab Bar ── */}
      <div className="flex items-center justify-around bg-nexus-sidebar border-t border-nexus-border min-h-[52px] px-1 flex-shrink-0 safe-area-bottom">
        {PORTRAIT_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors active:scale-95",
                isActive ? "text-nexus-accent" : "text-nexus-text-muted"
              )}
            >
              <Icon size={18} />
              <span className="text-[9px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── File Editor Overlay ── */}
      {renderFileOverlay()}

      {/* ── Settings Panel ── */}
      <SettingsPanel
        isOpen={props.showSettings}
        onClose={props.onCloseSettings}
        apiKeys={props.apiKeys}
        onApiKeyChange={props.setApiKey}
        isTouchMode={true}
        onToggleTouchMode={props.toggleTouchMode}
        uiMode={'legacy' as any}
        onUiModeChange={props.setUiMode}
        onClearWorkspace={onClearWorkspace}
        onExport={onExport}
        selectedAIProvider={props.selectedAIProvider}
        onAIProviderChange={props.setSelectedAIProvider}
        selectedModels={props.selectedModels}
        onModelChange={(provider, model) => {
          props.setSelectedModels(prev => ({ ...prev, [provider]: model }));
        }}
        githubToken={props.githubToken}
        onGithubTokenChange={props.setGithubToken}
        githubClientId={props.githubClientId}
        onGithubClientIdChange={props.setGithubClientId}
        githubClientSecret={props.githubClientSecret}
        onGithubClientSecretChange={props.setGithubClientSecret}
        ollamaUrl={props.ollamaUrl}
        onOllamaUrlChange={props.setOllamaUrl}
        isOffline={props.isOffline}
        isFullLock={props.isFullLock}
        airplaneModeEnabled={props.airplaneModeEnabled}
        onToggleAirplaneMode={props.onToggleAirplaneMode}
        onToggleFullLock={props.onToggleFullLock}
        sessionSavedAt={props.sessionSavedAt}
      />
    </div>
  );
}

// ─── Mobile Landscape Layout ────────────────────────────────

type LandscapeTab = 'files' | 'ai' | 'terminal' | 'git';

const LANDSCAPE_TABS: { id: LandscapeTab; label: string; icon: React.ElementType }[] = [
  { id: 'files', label: 'Files', icon: FolderOpen },
  { id: 'ai', label: 'AI Chat', icon: MessageSquare },
  { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
  { id: 'git', label: 'Git', icon: GitBranch },
];

export function MobileLandscapeLayout(props: MobileLayoutProps) {
  const {
    files, activeFileId, onHandleSelectFile, onAddFile, onDeleteFile,
    onRenameFile, onOpenFolder, onExport, onClearWorkspace, onSaveWorkspace,
    onSetDiffData, activeFolder, setActiveFolder, pendingAiActions,
    onAcceptAiActions, onRejectAiActions, aiAssistantRef, onPendingActions,
  } = props;

  const [activeSidebarTab, setActiveSidebarTab] = useState<LandscapeTab>('files');
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeFile = files.find(f => f.id === activeFileId) || null;

  // When tapping a sidebar tab that isn't the current one, open the sidebar
  const handleSidebarTabClick = useCallback((tab: LandscapeTab) => {
    if (activeSidebarTab === tab && sidebarOpen) {
      setSidebarOpen(false);
    } else {
      setActiveSidebarTab(tab);
      setSidebarOpen(true);
    }
  }, [activeSidebarTab, sidebarOpen]);

  // ── Sidebar content based on active tab ──
  const renderSidebarContent = () => {
    switch (activeSidebarTab) {
      case 'files':
        return (
          <Sidebar
            files={files}
            activeFileId={activeFileId}
            onSelectFile={onHandleSelectFile}
            onAddFile={onAddFile}
            onDeleteFile={onDeleteFile}
            onRenameFile={onRenameFile}
            onExport={onExport}
            onClearWorkspace={onClearWorkspace}
            onSaveWorkspace={onSaveWorkspace}
            onShowWorkspace={() => {}}
            onApplyTemplate={() => {}}
            onShowDiff={(id) => {
              const f = files.find(x => x.id === id);
              if (f) onSetDiffData({ original: f.originalContent || f.content, modified: f.content, fileId: id });
            }}
            onOpenFolder={onOpenFolder}
            onSelectFolder={setActiveFolder}
            activeFolder={activeFolder}
            pendingAiActions={pendingAiActions}
            onAcceptAiActions={onAcceptAiActions}
            onRejectAiActions={onRejectAiActions}
          />
        );

      case 'ai':
        return (
          <AIAssistant
            ref={aiAssistantRef}
            files={files}
            activeFileId={activeFileId}
            onAddFile={onAddFile}
            onUpdateFile={props.onUpdateFile}
            onDeleteFile={onDeleteFile}
            apiKeys={props.apiKeys}
            selectedProvider={props.selectedAIProvider}
            selectedModels={props.selectedModels}
            githubToken={props.githubToken}
            onPendingActions={onPendingActions}
            isMaximized={true}
            onToggleMaximize={() => {}}
          />
        );

      case 'terminal':
        return (
          <Terminal
            files={files}
            onClose={() => setShowBottomPanel(false)}
            onPreview={() => props.setShowPreview(true)}
          />
        );

      case 'git':
        return (
          <GithubView
            files={files}
            onImportFiles={(importedFiles) => {
              importedFiles.forEach(f => {
                if (!files.find(ef => ef.name === f.name)) onAddFile(f.name, f.content);
              });
            }}
            onClearWorkspace={onClearWorkspace}
            onUserUpdate={() => {}}
            onBranchChange={props.setGitBranch}
            onRepoChange={props.setGitRepoName}
            onUpdateFile={props.onUpdateFile as any}
            activeFileId={activeFileId}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="nexus-mobile-landscape flex h-screen w-screen bg-nexus-bg text-nexus-text overflow-hidden select-none">
      {/* ── Narrow Icon Sidebar (48px) ── */}
      <div className="w-12 flex-shrink-0 bg-nexus-sidebar border-r border-nexus-border flex flex-col items-center py-1 gap-0.5">
        <div className="w-8 h-8 flex items-center justify-center mb-1">
          <Zap size={16} className="text-nexus-accent" />
        </div>
        {LANDSCAPE_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSidebarTab === tab.id && sidebarOpen;
          return (
            <button
              key={tab.id}
              onClick={() => handleSidebarTabClick(tab.id)}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-lg transition-all active:scale-95 relative",
                isActive
                  ? "text-nexus-accent bg-nexus-accent/10"
                  : "text-nexus-text-muted hover:text-white hover:bg-white/5"
              )}
              title={tab.label}
            >
              <Icon size={18} />
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-nexus-accent rounded-r" />
              )}
            </button>
          );
        })}
        {/* Spacer */}
        <div className="flex-1" />
        {/* Bottom icon: Terminal toggle */}
        <button
          onClick={() => setShowBottomPanel(!showBottomPanel)}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-lg transition-all active:scale-95",
            showBottomPanel
              ? "text-nexus-accent bg-nexus-accent/10"
              : "text-nexus-text-muted hover:text-white hover:bg-white/5"
          )}
          title="Toggle Bottom Panel"
        >
          <TerminalIcon size={18} />
        </button>
        {/* Settings gear at bottom */}
        <button
          onClick={props.onShowSettings}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-nexus-text-muted hover:text-white hover:bg-white/5 transition-all active:scale-95"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* ── Main Area (sidebar + editor) ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Collapsible Sidebar Panel ── */}
        {sidebarOpen && (
          <div className="w-56 flex-shrink-0 flex flex-col border-r border-nexus-border bg-nexus-sidebar overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-nexus-border">
              <span className="text-[10px] font-semibold text-nexus-text-muted uppercase tracking-widest">
                {LANDSCAPE_TABS.find(t => t.id === activeSidebarTab)?.label}
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-0.5 hover:bg-white/10 rounded text-nexus-text-muted"
              >
                <X size={12} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {renderSidebarContent()}
            </div>
          </div>
        )}

        {/* ── Editor Area ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Thin tab bar */}
          {props.openFileIds.length > 0 && (
            <div className="flex items-center overflow-x-auto no-scrollbar border-b border-nexus-border bg-nexus-sidebar min-h-[32px]">
              {props.openFileIds.map(id => {
                const file = files.find(f => f.id === id);
                if (!file) return null;
                return (
                  <div
                    key={id}
                    onClick={() => onHandleSelectFile(id)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 text-xs whitespace-nowrap flex-shrink-0 cursor-pointer",
                      props.activeFileId === id
                        ? "text-white border-b-2 border-nexus-accent bg-nexus-bg/50"
                        : "text-nexus-text-muted hover:text-white"
                    )}
                  >
                    <span className="truncate max-w-[120px]">{file.name.split('/').pop()}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); props.onCloseFile(id); }}
                      className="p-0.5 hover:bg-white/10 rounded text-nexus-text-muted"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Editor + bottom panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className={cn("flex-1 overflow-hidden", showBottomPanel && "min-h-0")}>
              {activeFile ? (
                <Editor
                  file={activeFile}
                  onChange={(content) => props.onUpdateFile(activeFile.id, content)}
                  apiKeys={props.apiKeys}
                  onToggleTerminal={() => setShowBottomPanel(!showBottomPanel)}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-nexus-text-muted gap-3">
                  <Zap size={40} className="opacity-10" />
                  <p className="text-xs">Select a file to start coding</p>
                </div>
              )}
            </div>

            {/* Resizable bottom panel */}
            {showBottomPanel && (
              <div className="h-40 border-t border-nexus-border bg-nexus-bg flex-shrink-0">
                <Terminal
                  files={files}
                  onClose={() => setShowBottomPanel(false)}
                  onPreview={() => props.setShowPreview(true)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Settings Panel ── */}
      <SettingsPanel
        isOpen={props.showSettings}
        onClose={props.onCloseSettings}
        apiKeys={props.apiKeys}
        onApiKeyChange={props.setApiKey}
        isTouchMode={true}
        onToggleTouchMode={props.toggleTouchMode}
        uiMode={'legacy' as any}
        onUiModeChange={props.setUiMode}
        onClearWorkspace={onClearWorkspace}
        onExport={onExport}
        selectedAIProvider={props.selectedAIProvider}
        onAIProviderChange={props.setSelectedAIProvider}
        selectedModels={props.selectedModels}
        onModelChange={(provider, model) => {
          props.setSelectedModels(prev => ({ ...prev, [provider]: model }));
        }}
        githubToken={props.githubToken}
        onGithubTokenChange={props.setGithubToken}
        githubClientId={props.githubClientId}
        onGithubClientIdChange={props.setGithubClientId}
        githubClientSecret={props.githubClientSecret}
        onGithubClientSecretChange={props.setGithubClientSecret}
        ollamaUrl={props.ollamaUrl}
        onOllamaUrlChange={props.setOllamaUrl}
        isOffline={props.isOffline}
        isFullLock={props.isFullLock}
        airplaneModeEnabled={props.airplaneModeEnabled}
        onToggleAirplaneMode={props.onToggleAirplaneMode}
        onToggleFullLock={props.onToggleFullLock}
        sessionSavedAt={props.sessionSavedAt}
      />
    </div>
  );
}
