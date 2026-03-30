import React, { useEffect, useRef, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import AIAssistant from './components/AIAssistant';
import ActivityBar from './components/ActivityBar';
import StatusBar from './components/StatusBar';
import GithubView from './components/GithubView';
import ExtensionsView from './components/ExtensionsView';
import CollaborationView from './components/CollaborationView';
import MinecraftView from './components/MinecraftView';
import DiffEditor from './components/DiffEditor';
import CommandPalette from './components/CommandPalette';
import Terminal from './components/Terminal';
import TitleBar from './components/TitleBar';
import PreviewPopout from './components/PreviewPopout';
import SettingsPanel from './components/SettingsPanel';
import SearchView from './components/SearchView';
import DebugView from './components/DebugView';
import ThemeStudio from './components/ThemeStudio';
import DependencyGraph from './components/DependencyGraph';
import TodoScanner from './components/TodoScanner';
import SnippetManager from './components/SnippetManager';
import ProjectInsights from './components/ProjectInsights';
import WebContainerTerminal from './components/WebContainerTerminal';
import WorkspacePanel from './components/WorkspacePanel';
import BeginnerUILayout, { BeginnerFilePanel, BeginnerToolsPanel } from './components/BeginnerUILayout';
import VSCodeLayout from './components/VSCodeLayout';
import AirplaneModeBanner from './components/AirplaneModeBanner';
import { UpdateChecker } from './components/UpdateChecker';
import SplitEditor from './components/SplitEditor';
import NotificationToasts from './components/NotificationToasts';
import WelcomeTab from './components/WelcomeTab';
import KeyboardShortcutsPanel from './components/KeyboardShortcutsPanel';
import LinuxTerminal from './components/LinuxTerminal';
import { notificationService } from './services/notificationService';
import './styles/beginner-ui.css';

import { useFileSystem } from './hooks/useFileSystem';
import { useIDEState } from './hooks/useIDEState';
import { usePWA } from './hooks/usePWA';
import { nexusChannel } from './hooks/useWindow';
import { socketService } from './services/socketService';
import { workspaceService } from './services/workspaceService';
import { airplaneModeService } from './services/airplaneModeService';
import sessionPersistenceService from './services/sessionPersistenceService';
import ErrorHandlingService from './services/errorHandlingService';
import VoiceCommand from './components/VoiceCommand';
import { cn } from './lib/utils';
import { Zap, FilePlus, FolderOpen, MessageSquare, Play, Settings, Trash2, Download, LayoutGrid as Layout, Brain, CircleAlert as AlertCircle, X, Save, HardDrive, Columns2, ChevronRight, Terminal as TerminalIcon } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { GoogleGenerativeAI } from '@google/generative-ai';
import workspaceSaveService from './services/workspaceSaveService';

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Nexus App Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
          <Zap size={48} className="text-red-500 mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold mb-2">Nexus IDE has encountered an error</h1>
          <p className="text-slate-400 max-w-md mb-6">{this.state.error?.message || "Something went wrong during rendering."}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-nexus-accent rounded-lg font-bold hover:opacity-90 transition-all"
          >
            Reload IDE
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const isPopout = window.location.pathname.endsWith('/preview-popout');
  const { files, addFile, updateFile, deleteFile, renameFile, openDirectory, isLoaded: isFsLoaded } = useFileSystem();
  const ide = useIDEState(files);
  const pwa = usePWA();

  // Airplane Mode state
  const [isOffline, setIsOffline] = useState(airplaneModeService.isOffline);
  const [isFullLock, setIsFullLock] = useState(() => localStorage.getItem('nexus_full_lock') === 'true');
  const [airplaneModeEnabled, setAirplaneModeEnabled] = useState(false);
  const [sessionSavedAt, setSessionSavedAt] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const aiAssistantRef = useRef<any>(null);
  const [pendingAiActions, setPendingAiActions] = useState<any[] | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [vibeProgress, setVibeProgress] = useState<{ active: boolean, percent: number, message: string } | null>(null);

  // Workspace state
  const [showWorkspacePanel, setShowWorkspacePanel] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<number>(0);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    () => localStorage.getItem('nexus_current_workspace_id')
  );
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Split Editor state (B16)
  const [splitEditor, setSplitEditor] = useState(false);
  const [splitFileId, setSplitFileId] = useState<string | null>(null);

  // Keyboard shortcuts panel state
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Beginner UI state
  const [beginnerActivity, setBeginnerActivity] = useState<string>('files');
  const [beginnerTool, setBeginnerTool] = useState<string>('search');

  const exportAsZip = async () => {
    const zip = new JSZip();
    files.forEach(file => zip.file(file.name, file.content));
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'nexus-project-5.4.zip');
  };

  const handleClearWorkspace = () => {
    if (confirm('Clear entire workspace?')) {
      files.forEach(f => deleteFile(f.id));
      ide.setOpenFileIds([]);
      ide.setActiveFileId(null);
      setCurrentWorkspaceId(null);
      localStorage.removeItem('nexus_current_workspace_id');
    }
  };

  // === Workspace Save/Load/Auto-Save ===
  const handleSaveWorkspace = useCallback(async (name?: string) => {
    if (files.length === 0) return;
    
    try {
      const snapshot = workspaceSaveService.createSnapshot(
        files.map(f => ({ name: f.name, content: f.content, language: f.language })),
        { 
          projectName: name || `Project ${new Date().toLocaleDateString()}`,
          createdAt: currentWorkspaceId ? undefined : Date.now()
        }
      );

      if (currentWorkspaceId) {
        const existing = await workspaceSaveService.loadWorkspaceFromIDB(currentWorkspaceId);
        if (existing) {
          existing.files = snapshot.files;
          existing.metadata.fileCount = snapshot.files.length;
          existing.timestamp = Date.now();
          existing.metadata.updatedAt = Date.now();
          await workspaceSaveService.saveWorkspaceToIDB(existing);
          return;
        }
      }

      const id = await workspaceSaveService.saveWorkspaceToIDB(snapshot);
      setCurrentWorkspaceId(id);
      localStorage.setItem('nexus_current_workspace_id', id);
      notificationService.success('Workspace saved', 'Your workspace has been saved to IndexedDB');
    } catch (err) {
      console.error('Workspace save failed:', err);
      notificationService.error('Save failed', 'Failed to save workspace');
    }
  }, [files, currentWorkspaceId]);

  const handleLoadWorkspace = useCallback(async (workspaceFiles: Array<{ name: string; content: string }>, name: string) => {
    // Clear current files
    files.forEach(f => deleteFile(f.id));
    ide.setOpenFileIds([]);
    ide.setActiveFileId(null);

    // Load new files
    for (const file of workspaceFiles) {
      const newFile = addFile(file.name, file.content);
      if (workspaceFiles.indexOf(file) === 0) {
        ide.setActiveFileId(newFile.id);
        ide.setOpenFileIds([newFile.id]);
      }
    }
  }, [files, addFile, deleteFile, ide]);

  // Auto-save every 30 seconds — workspace + full session state
  useEffect(() => {
    autoSaveIntervalRef.current = setInterval(() => {
      if (files.length > 0) {
        handleSaveWorkspace();
        setLastAutoSave(Date.now());
        // Save full session state
        sessionPersistenceService.saveSession({
          activeFileId: ide.activeFileId,
          openFileIds: ide.openFileIds,
          activeActivity: ide.activeActivity as string,
          showSidebar: ide.showSidebar,
          showAI: ide.showAI,
          showTerminal: ide.showTerminal,
          showPreview: ide.showPreview,
          showSettings: ide.showSettings,
          showVibeGraph: ide.showVibeGraph,
          showMinecraftScripts: ide.showMinecraftScripts,
          isZenMode: ide.isZenMode,
          uiMode: ide.uiMode,
          selectedAIProvider: ide.selectedAIProvider,
          selectedModels: ide.selectedModels,
          timestamp: Date.now(),
          version: '5.4.0',
          sessionId: ide.sessionId,
        }).then(() => {
          const savedAt = sessionPersistenceService.formatTimestamp(Date.now());
          setSessionSavedAt(savedAt);
          notificationService.success('Session saved', 'Auto-saved at ' + new Date().toLocaleTimeString());
        }).catch(() => {});
      }
    }, 30000);

    return () => {
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    };
  }, [files, handleSaveWorkspace, ide]);

  // Airplane Mode — listen for online/offline changes
  useEffect(() => {
    const unsub = airplaneModeService.subscribe((status) => {
      setIsOffline(status === 'offline');
      setBannerDismissed(false); // Show banner again on status change
    });
    return unsub;
  }, []);

  // Full Lock persistence
  useEffect(() => {
    localStorage.setItem('nexus_full_lock', isFullLock.toString());
  }, [isFullLock]);

  const handleToggleSplit = useCallback(() => {
    if (splitEditor) {
      // Close split
      setSplitEditor(false);
      setSplitFileId(null);
    } else {
      // Open split with next file that isn't active
      if (files.length > 1) {
        const nextFile = files.find(f => f.id !== ide.activeFileId);
        if (nextFile) {
          setSplitEditor(true);
          setSplitFileId(nextFile.id);
          notificationService.info('Split Editor', `Opened ${nextFile.name.split('/').pop()} in split view`);
        }
      } else {
        notificationService.warning('Split Editor', 'You need at least 2 files to split the editor');
      }
    }
  }, [splitEditor, files, ide.activeFileId]);

  const handleToggleAirplaneMode = useCallback(() => {
    const newMode = !airplaneModeEnabled;
    setAirplaneModeEnabled(newMode);
    if (newMode) {
      airplaneModeService.setManualOverride(true);
    } else {
      airplaneModeService.setManualOverride(false);
    }
  }, [airplaneModeEnabled]);

  const handleToggleFullLock = useCallback(() => {
    setIsFullLock(prev => !prev);
  }, []);

  // Airplane mode manual toggle persistence
  useEffect(() => {
    localStorage.setItem('nexus_airplane_mode', airplaneModeEnabled.toString());
  }, [airplaneModeEnabled]);

  // Restore session on boot
  useEffect(() => {
    if (!isFsLoaded) return;
    sessionPersistenceService.restoreSession().then((session) => {
      if (!session) return;
      // Restore session state
      if (session.openFileIds && session.openFileIds.length > 0) {
        const validIds = session.openFileIds.filter(id => files.some(f => f.id === id));
        if (validIds.length > 0) {
          ide.setOpenFileIds(validIds);
          if (session.activeFileId && validIds.includes(session.activeFileId)) {
            ide.setActiveFileId(session.activeFileId);
          } else {
            ide.setActiveFileId(validIds[validIds.length - 1]);
          }
        }
      }
      if (session.activeActivity) ide.setActiveActivity(session.activeActivity as any);
      if (session.showSidebar !== undefined) ide.setShowSidebar(session.showSidebar);
      if (session.showTerminal !== undefined) ide.setShowTerminal(session.showTerminal);
      if (session.showPreview !== undefined) ide.setShowPreview(session.showPreview);
      if (session.showAI !== undefined) ide.setShowAI(session.showAI);
      if (session.isZenMode !== undefined && session.isZenMode !== ide.isZenMode) ide.toggleZenMode();
      // Set last save time
      if (session.timestamp) {
        setSessionSavedAt(sessionPersistenceService.formatTimestamp(session.timestamp));
      }
    }).catch(() => {});
  }, [isFsLoaded, files.length]);

  const [ollamaUrl, setOllamaUrl] = useState(() => localStorage.getItem('nexus_ollama_url') || 'http://localhost:11434');

  useEffect(() => {
    localStorage.setItem('nexus_ollama_url', ollamaUrl);
  }, [ollamaUrl]);

  useEffect(() => {
    const unsubscribe = ErrorHandlingService.subscribe(setErrors);
    return () => unsubscribe();
  }, []);

  const handleVoiceCommand = (command: string) => {
    console.log("Voice Command:", command);
    
    if (command.includes("run code") || command.includes("run application")) {
      const activeFile = files.find(f => f.id === ide.activeFileId);
      if (activeFile) {
        socketService.send({
          type: 'run-file',
          filename: activeFile.name,
          content: activeFile.content,
          language: activeFile.language
        });
        ide.setShowTerminal(true);
      }
    } else if (command.includes("open settings")) {
      ide.setShowSettings(true);
    } else if (command.includes("close settings")) {
      ide.setShowSettings(false);
    } else if (command.includes("toggle terminal")) {
      ide.setShowTerminal(!ide.showTerminal);
    } else if (command.includes("toggle sidebar")) {
      ide.setShowSidebar(!ide.showSidebar);
    } else if (command.includes("split") || command.includes("split editor")) {
      handleToggleSplit();
    } else if (command.includes("clear workspace")) {
      handleClearWorkspace();
    } else if (command.includes("save workspace")) {
      handleSaveWorkspace();
    } else if (command.includes("analyze")) {
      handleAnalyzeArchitecture();
    } else if (command.includes("airplane")) {
      handleToggleAirplaneMode();
    } else if (command.includes("linux") || command.includes("alpine")) {
      ide.setActiveActivity('linux');
      ide.setShowTerminal(true);
    }
  };

  useEffect(() => {
    if (isFsLoaded && !ide.activeFileId && files.length > 0) {
      ide.setActiveFileId(files[0].id);
      ide.setOpenFileIds([files[0].id]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFsLoaded, files.length, ide.activeFileId]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K S — Keyboard shortcuts panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && e.shiftKey) {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // PWA: Launch Handler API
  useEffect(() => {
    if ('launchQueue' in window) {
      // @ts-ignore
      window.launchQueue.setConsumer(async (launchParams) => {
        if (launchParams.files && launchParams.files.length > 0) {
          for (const handle of launchParams.files) {
            const file = await handle.getFile();
            const content = await file.text();
            const newFile = addFile(file.name, content);
            ide.handleSelectFile(newFile.id);
          }
        }
      });
    }
  }, [addFile, ide]);

  useEffect(() => {
    socketService.connect();
    const unsubscribe = socketService.subscribe((msg) => {
      if (msg.type === 'collab') {
        updateFile(msg.fileId, msg.content);
      } else if (msg.type === 'session:created' || msg.type === 'session:joined') {
        ide.setSessionId(msg.sessionId);
      } else if (msg.type === 'workspace:hosted') {
        ide.setHostedUrl(msg.url);
      }
    });
    return () => unsubscribe();
  }, [updateFile, ide]);

  if (isPopout) {
    return <PreviewPopout />;
  }

  const handleAnalyzeArchitecture = async () => {
    const apiKey = ide.apiKeys['gemini'];
    if (!apiKey) return alert('Set Gemini API key in settings.');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    try {
      const result = await model.generateContent(`Analyze the following project structure and generate a Mermaid class diagram or flowchart (TD) representing the architecture. Return only the mermaid code block.\n\nFiles: ${files.map(f => f.name).join(', ')}`);
      const response = result.response;
      const text = response.text();
      const match = text.match(/```mermaid\s*([\s\S]*?)\s*```/);
      if (match) {
        ide.setMermaidChart(match[1]);
      } else {
        alert('Analysis complete but no diagram generated. Response did not contain valid Mermaid code.');
      }
    } catch (error: any) {
      console.error('Architecture analysis failed:', error);
      alert(`Failed to analyze architecture: ${error.message}`);
    }
  };

  const commands = [
    { id: 'new-file', label: 'New File', icon: FilePlus, category: 'File', action: () => ide.setActiveActivity('explorer') },
    { id: 'open-folder', label: 'Open Local Folder', icon: FolderOpen, category: 'File', action: openDirectory },
    { id: 'save-workspace', label: 'Save Workspace', icon: Save, category: 'Workspace', action: () => handleSaveWorkspace() },
    { id: 'toggle-ai', label: 'Toggle AI Assistant', icon: MessageSquare, category: 'View', action: () => ide.setShowAI(!ide.showAI) },
    { id: 'toggle-terminal', label: 'Toggle Terminal', icon: Play, category: 'View', action: () => ide.setShowTerminal(!ide.showTerminal) },
    { id: 'toggle-split', label: 'Toggle Split Editor', icon: Columns2, category: 'View', action: handleToggleSplit },
    { id: 'settings', label: 'Open Settings', icon: Settings, category: 'App', action: () => ide.setShowSettings(true) },
    { id: 'clear-workspace', label: 'Clear Workspace', icon: Trash2, category: 'Workspace', action: handleClearWorkspace },
    { id: 'export-zip', label: 'Export as ZIP', icon: Download, category: 'File', action: exportAsZip },
    { id: 'analyze-arch', label: 'Analyze Architecture', icon: Layout, category: 'AI', action: handleAnalyzeArchitecture },
    { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', icon: Settings, category: 'App', action: () => setShowKeyboardShortcuts(true) },
  ];

  const activeFile = files.find(f => f.id === ide.activeFileId) || null;

  // === VS CODE UI RENDER ===
  if (ide.uiMode === 'vscode' && !ide.isTouchMode) {
    // Build sidebar content for VSCode layout based on current activity
    const vscodeSidebarContent = (
      <div className="flex flex-col h-full w-full overflow-hidden bg-[#252526]">
        <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-[#bbbbbb] uppercase tracking-wider">
          <span>{ide.activeActivity === 'explorer' ? 'Open Editors' : ide.activeActivity === 'search' ? 'Search' : ide.activeActivity === 'git' ? 'Source Control' : ide.activeActivity === 'ai' ? 'AI Assistant' : ide.activeActivity === 'linux' ? 'Linux Terminal' : ide.activeActivity}</span>
        </div>
        <div className="flex-1 overflow-y-auto text-[12px] text-[#cccccc]">
          {ide.activeActivity === 'explorer' && (
            <Sidebar
              files={files}
              activeFileId={ide.activeFileId}
              onSelectFile={ide.handleSelectFile}
              onAddFile={addFile}
              onDeleteFile={deleteFile}
              onRenameFile={renameFile}
              onExport={exportAsZip}
              onClearWorkspace={handleClearWorkspace}
              onSaveWorkspace={() => handleSaveWorkspace()}
              onShowWorkspace={() => {}}
              onApplyTemplate={() => {}}
              onShowDiff={(id) => {
                const f = files.find(x => x.id === id);
                if (f) ide.setDiffData({ original: f.originalContent || f.content, modified: f.content, fileId: id });
              }}
              onOpenFolder={openDirectory}
              onSelectFolder={ide.setActiveFolder}
              activeFolder={ide.activeFolder}
              pendingAiActions={pendingAiActions}
              onAcceptAiActions={async (actions) => {
                if (aiAssistantRef.current) {
                  await aiAssistantRef.current.applyChanges(actions);
                  setPendingAiActions(null);
                }
              }}
              onRejectAiActions={() => setPendingAiActions(null)}
            />
          )}
          {ide.activeActivity === 'search' && <SearchView files={files} onSelectFile={ide.handleSelectFile} />}
          {ide.activeActivity === 'git' && <GithubView files={files} onImportFiles={(importedFiles) => { importedFiles.forEach(f => { if (!files.find(ef => ef.name === f.name)) addFile(f.name, f.content); }); }} onClearWorkspace={handleClearWorkspace} onUserUpdate={() => {}} onBranchChange={(b) => ide.setGitBranch(b)} onRepoChange={(r) => ide.setGitRepoName(r)} onUpdateFile={updateFile} activeFileId={ide.activeFileId} />}
          {ide.activeActivity === 'debug' && <DebugView activeFile={activeFile} onToggleTerminal={() => ide.setShowTerminal(!ide.showTerminal)} />}
          {ide.activeActivity === 'extensions' && <ExtensionsView />}
          {ide.activeActivity === 'linux' && (
            <div className="flex flex-col items-center justify-center h-full text-[#858585]">
              <p className="text-[12px]">Linux Terminal is open in the main editor area</p>
              <p className="text-[10px] text-[#5a5a5a] mt-1">Use the activity bar to switch back</p>
            </div>
          )}
          {ide.activeActivity === 'ai' && (
            <AIAssistant
              ref={aiAssistantRef}
              files={files}
              activeFileId={ide.activeFileId}
              onAddFile={addFile}
              onUpdateFile={updateFile}
              onDeleteFile={deleteFile}
              apiKeys={ide.apiKeys}
              selectedProvider={ide.selectedAIProvider}
              selectedModels={ide.selectedModels}
              githubToken={ide.githubToken}
              onPendingActions={setPendingAiActions}
              isMaximized={true}
              onToggleMaximize={() => ide.setIsAiMaximized(!ide.isAiMaximized)}
            />
          )}
        </div>
      </div>
    );

    const vscodeEditorContent = ide.activeActivity === 'linux' ? (
      <LinuxTerminal
        files={files.map(f => ({ name: f.name, content: f.content }))}
        onPullFiles={(pulledFiles) => {
          pulledFiles.forEach(pf => {
            const existing = files.find(ef => ef.name === pf.name);
            if (existing) {
              updateFile(existing.id, pf.content);
            } else {
              addFile(pf.name, pf.content);
            }
          });
          notificationService.success('Files Pulled', `${pulledFiles.length} file(s) imported from Alpine Linux`);
        }}
      />
    ) : splitEditor && activeFile ? (
      <SplitEditor
        files={files}
        leftFileId={ide.activeFileId}
        rightFileId={splitFileId}
        onSelectFile={(id) => {
          ide.handleSelectFile(id);
          if (!splitEditor) return;
          if (id !== ide.activeFileId) setSplitFileId(id);
        }}
        onUpdateFile={(id, content) => updateFile(id, content)}
        onCloseSplit={handleToggleSplit}
        apiKeys={ide.apiKeys}
        onToggleTerminal={() => ide.setShowTerminal(!ide.showTerminal)}
      />
    ) : activeFile ? (
      <Editor
        file={activeFile}
        onChange={(content) => updateFile(activeFile.id, content)}
        apiKeys={ide.apiKeys}
        onToggleTerminal={() => ide.setShowTerminal(!ide.showTerminal)}
      />
    ) : null;

    const vscodeBottomContent = (
      <Terminal files={files} onClose={() => ide.setShowTerminal(false)} onPreview={() => ide.setShowPreview(true)} />
    );

    const vscodePreviewContent = (
      <Preview files={files} activeFileId={ide.activeFileId} />
    );

    // Handle VS Code activity bar clicks → sync with IDE state
    const handleVSCodeActivityChange = useCallback((activity: string) => {
      if (activity === 'settings') {
        ide.setShowSettings(true);
      } else {
        ide.setActiveActivity(activity as any);
      }
    }, [ide]);

    return (
      <ErrorBoundary>
        <AirplaneModeBanner
          isOffline={isOffline}
          isFullLock={isFullLock}
          onDismiss={() => setBannerDismissed(true)}
        />
        <VSCodeLayout
          files={files}
          activeFileId={ide.activeFileId}
          openFileIds={ide.openFileIds}
          onHandleSelectFile={ide.handleSelectFile}
          onCloseFile={ide.closeFile}
          onAddFile={addFile}
          onUpdateFile={updateFile}
          onDeleteFile={deleteFile}
          onRenameFile={renameFile}
          onOpenFolder={openDirectory}
          onExport={exportAsZip}
          onClearWorkspace={handleClearWorkspace}
          onSaveWorkspace={() => handleSaveWorkspace()}
          apiKeys={ide.apiKeys}
          selectedAIProvider={ide.selectedAIProvider}
          selectedModels={ide.selectedModels}
          githubToken={ide.githubToken}
          aiAssistantRef={aiAssistantRef}
          onPendingActions={setPendingAiActions}
          showTerminal={ide.showTerminal}
          onToggleTerminal={() => ide.setShowTerminal(!ide.showTerminal)}
          showPreview={ide.showPreview}
          onTogglePreview={() => ide.setShowPreview(!ide.showPreview)}
          showAI={ide.showAI}
          onToggleAI={() => ide.setShowAI(!ide.showAI)}
          onShowSettings={() => ide.setShowSettings(true)}
          diffData={ide.diffData}
          onSetDiffData={ide.setDiffData}
          sessionId={ide.sessionId}
          isCommandPaletteOpen={ide.isCommandPaletteOpen}
          onSetIsCommandPaletteOpen={ide.setIsCommandPaletteOpen}
          sidebarContent={vscodeSidebarContent}
          editorContent={vscodeEditorContent}
          bottomPanelContent={vscodeBottomContent}
          previewContent={vscodePreviewContent}
          activeActivity={ide.activeActivity}
          onActivityChange={handleVSCodeActivityChange}
          extraComponents={
            <>
              <VoiceCommand isListening={isVoiceListening} onToggle={() => setIsVoiceListening(!isVoiceListening)} onCommand={handleVoiceCommand} />
              <CommandPalette isOpen={ide.isCommandPaletteOpen} onClose={() => ide.setIsCommandPaletteOpen(false)} commands={commands} />
              {ide.diffData && (
                <DiffEditor
                  original={ide.diffData.original}
                  modified={ide.diffData.modified}
                  language={files.find(f => f.id === ide.diffData?.fileId)?.language}
                  onClose={() => ide.setDiffData(null)}
                  onApply={() => {
                    if (ide.diffData) {
                      updateFile(ide.diffData.fileId, ide.diffData.modified, true);
                      ide.setDiffData(null);
                    }
                  }}
                />
              )}
              <SettingsPanel
                isOpen={ide.showSettings}
                onClose={() => ide.setShowSettings(false)}
                apiKeys={ide.apiKeys}
                onApiKeyChange={ide.setApiKey}
                isTouchMode={ide.isTouchMode}
                onToggleTouchMode={ide.toggleTouchMode}
                uiMode={ide.uiMode}
                onUiModeChange={ide.setUiMode}
                onClearWorkspace={handleClearWorkspace}
                onExport={exportAsZip}
                selectedAIProvider={ide.selectedAIProvider}
                onAIProviderChange={ide.setSelectedAIProvider}
                selectedModels={ide.selectedModels}
                onModelChange={(provider, model) => {
                  ide.setSelectedModels(prev => ({ ...prev, [provider]: model }));
                }}
                githubToken={ide.githubToken}
                onGithubTokenChange={ide.setGithubToken}
                githubClientId={ide.githubClientId}
                onGithubClientIdChange={ide.setGithubClientId}
                githubClientSecret={ide.githubClientSecret}
                onGithubClientSecretChange={ide.setGithubClientSecret}
                ollamaUrl={ollamaUrl}
                onOllamaUrlChange={setOllamaUrl}
                isOffline={isOffline}
                isFullLock={isFullLock}
                airplaneModeEnabled={airplaneModeEnabled}
                onToggleAirplaneMode={handleToggleAirplaneMode}
                onToggleFullLock={handleToggleFullLock}
                sessionSavedAt={sessionSavedAt}
              />
              {pwa.showUpdatePrompt && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-nexus-accent text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-yellow-300 fill-yellow-300" />
                    <div>
                      <p className="text-sm font-bold">Nexus Update Available</p>
                      <p className="text-[10px] opacity-90">A new version is ready to install.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => pwa.setShowUpdatePrompt(false)} className="px-3 py-1 text-xs hover:bg-white/10 rounded">Later</button>
                    <button onClick={pwa.handleUpdateApp} className="px-3 py-1 text-xs bg-white text-nexus-accent font-bold rounded shadow-sm hover:bg-blue-50">Update Now</button>
                  </div>
                </div>
              )}
              <UpdateChecker isOffline={isOffline} />
              <NotificationToasts />
            </>
          }
        />
      </ErrorBoundary>
    );
  }

  // === BEGINNER UI RENDER ===
  if (ide.useBeginnerUI && !ide.isTouchMode) {
    return (
      <ErrorBoundary>
        <AirplaneModeBanner
          isOffline={isOffline}
          isFullLock={isFullLock}
          onDismiss={() => setBannerDismissed(true)}
        />
        <div className="beginner-mode-transition flex flex-col h-screen bg-nexus-bg text-nexus-text overflow-hidden select-none beginner-ui">
          <VoiceCommand 
            isListening={isVoiceListening} 
            onToggle={() => setIsVoiceListening(!isVoiceListening)} 
            onCommand={handleVoiceCommand}
          />

          <BeginnerUILayout
            activeActivity={beginnerActivity as any}
            onActivityChange={setBeginnerActivity}
            fileCount={files.length}
            activeFileName={activeFile?.name}
            onSaveWorkspace={() => handleSaveWorkspace()}
            onOpenSettings={() => ide.setShowSettings(true)}
          >
            {/* Files Panel */}
            {beginnerActivity === 'files' && (
              <div className="flex-1 flex overflow-hidden">
                <div className="w-72 border-r border-nexus-border flex-shrink-0 overflow-hidden">
                  <BeginnerFilePanel
                    files={files}
                    activeFileId={ide.activeFileId}
                    onSelectFile={ide.handleSelectFile}
                    onAddFile={addFile}
                    onDeleteFile={deleteFile}
                    onRenameFile={renameFile}
                    onOpenFolder={openDirectory}
                  />
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  {activeFile ? (
                    <Editor
                      file={activeFile}
                      onChange={(content) => updateFile(activeFile.id, content)}
                      apiKeys={ide.apiKeys}
                      onToggleTerminal={() => ide.setShowTerminal(!ide.showTerminal)}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-nexus-text-muted gap-4">
                      <div className="beginner-welcome-icon">
                        <Zap size={32} className="text-nexus-accent" />
                      </div>
                      <h2 className="text-lg font-bold text-white">Welcome to Nexus IDE</h2>
                      <p className="text-xs text-nexus-text-muted max-w-sm">
                        Create a new file or open an existing folder to start coding. Your work is auto-saved every 60 seconds.
                      </p>
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => addFile('index.html', '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Project</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>')}
                          className="flex items-center gap-2 px-4 py-2 bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          <FilePlus size={14} />
                          New HTML File
                        </button>
                        <button
                          onClick={openDirectory}
                          className="flex items-center gap-2 px-4 py-2 bg-nexus-bg hover:bg-nexus-border text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <FolderOpen size={14} />
                          Open Folder
                        </button>
                      </div>
                    </div>
                  )}
                  {ide.showTerminal && (
                    <div className="h-64 border-t border-nexus-border bg-nexus-bg">
                      <Terminal files={files} onClose={() => ide.setShowTerminal(false)} onPreview={() => ide.setShowPreview(true)} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Code Panel (same editor but full-width, sidebar optional) */}
            {beginnerActivity === 'code' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {activeFile ? (
                  <>
                    <Editor
                      file={activeFile}
                      onChange={(content) => updateFile(activeFile.id, content)}
                      apiKeys={ide.apiKeys}
                      onToggleTerminal={() => ide.setShowTerminal(!ide.showTerminal)}
                    />
                    {ide.showTerminal && (
                      <div className="h-64 border-t border-nexus-border bg-nexus-bg">
                        <Terminal files={files} onClose={() => ide.setShowTerminal(false)} onPreview={() => ide.setShowPreview(true)} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-nexus-text-muted gap-3">
                    <CodeIcon />
                    <p className="text-sm">Open a file from the Files tab to start editing</p>
                  </div>
                )}
              </div>
            )}

            {/* AI Panel */}
            {beginnerActivity === 'ai' && (
              <div className="flex-1 overflow-hidden">
                <AIAssistant
                  ref={aiAssistantRef}
                  files={files}
                  activeFileId={ide.activeFileId}
                  onAddFile={addFile}
                  onUpdateFile={updateFile}
                  onDeleteFile={deleteFile}
                  apiKeys={ide.apiKeys}
                  selectedProvider={ide.selectedAIProvider}
                  selectedModels={ide.selectedModels}
                  githubToken={ide.githubToken}
                  onPendingActions={setPendingAiActions}
                  onToggleMaximize={() => ide.setIsAiMaximized(!ide.isAiMaximized)}
                  isMaximized={true}
                  onClose={() => setBeginnerActivity('files')}
                />
              </div>
            )}

            {/* Run & Preview Panel */}
            {beginnerActivity === 'run' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-nexus-sidebar border-b border-nexus-border">
                  <button
                    onClick={() => ide.setShowTerminal(!ide.showTerminal)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      ide.showTerminal ? "bg-nexus-accent text-white" : "bg-nexus-bg text-nexus-text-muted hover:text-white"
                    )}
                  >
                    <Play size={12} />
                    Terminal
                  </button>
                  <button
                    onClick={() => ide.setShowPreview(!ide.showPreview)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      ide.showPreview ? "bg-nexus-accent text-white" : "bg-nexus-bg text-nexus-text-muted hover:text-white"
                    )}
                  >
                    <Zap size={12} />
                    Preview
                  </button>
                </div>
                <div className="flex-1 flex overflow-hidden">
                  {ide.showTerminal && (
                    <div className="flex-1 border-r border-nexus-border bg-nexus-bg">
                      <Terminal files={files} onClose={() => ide.setShowTerminal(false)} onPreview={() => ide.setShowPreview(true)} />
                    </div>
                  )}
                  {ide.showPreview && (
                    <div className="flex-1 bg-white">
                      <Preview files={files} activeFileId={ide.activeFileId} />
                    </div>
                  )}
                  {!ide.showTerminal && !ide.showPreview && (
                    <div className="flex-1 flex flex-col items-center justify-center text-nexus-text-muted gap-3">
                      <Play size={32} className="opacity-20" />
                      <p className="text-sm">Click Terminal or Preview above to get started</p>
                      <p className="text-[10px] text-nexus-text-muted/60">Run your code and see live results</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tools Panel */}
            {beginnerActivity === 'tools' && (
              <BeginnerToolsPanel activeTool={beginnerTool} onToolChange={setBeginnerTool}>
                {beginnerTool === 'search' && (
                  <SearchView files={files} onSelectFile={(id) => { ide.handleSelectFile(id); setBeginnerActivity('code'); }} />
                )}
                {beginnerTool === 'git' && (
                  <GithubView files={files} onImportFiles={(importedFiles) => { importedFiles.forEach(f => { if (!files.find(ef => ef.name === f.name)) addFile(f.name, f.content); }); }} onClearWorkspace={handleClearWorkspace} onUserUpdate={() => {}} onBranchChange={(b) => ide.setGitBranch(b)} onRepoChange={(r) => ide.setGitRepoName(r)} onUpdateFile={updateFile} activeFileId={ide.activeFileId} />
                )}
                {beginnerTool === 'extensions' && <ExtensionsView />}
                {beginnerTool === 'collab' && (
                  <CollaborationView
                    sessionId={ide.sessionId} isJoining={false} joinId="" setJoinId={() => {}}
                    onCreateSession={() => ide.setSessionId(socketService.createSession())}
                    onJoinSession={() => {}} onHostProject={() => {}} hostedUrl={ide.hostedUrl}
                  />
                )}
                {beginnerTool === 'themes' && <ThemeStudio />}
                {beginnerTool === 'minecraft' && <MinecraftView sessionId={ide.sessionId} />}
                {beginnerTool === 'webcontainer' && (
                  <WebContainerTerminal
                    files={files}
                    onFileUpdate={(path, content) => {
                      const file = files.find(f => f.name === path);
                      if (file) updateFile(file.id, content);
                    }}
                  />
                )}
                {beginnerTool === 'terminal' && (
                  <Terminal files={files} onClose={() => setBeginnerTool('search')} onPreview={() => ide.setShowPreview(true)} />
                )}
              </BeginnerToolsPanel>
            )}

            {/* Workspace Panel */}
            {beginnerActivity === 'workspace' && (
              <WorkspacePanel
                files={files.map(f => ({ name: f.name, content: f.content, language: f.language }))}
                onLoadWorkspace={handleLoadWorkspace}
              />
            )}
          </BeginnerUILayout>

          {/* PWA Update Prompt */}
          {pwa.showUpdatePrompt && (
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-nexus-accent text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-yellow-300 fill-yellow-300" />
                <div>
                  <p className="text-sm font-bold">Nexus Update Available</p>
                  <p className="text-[10px] opacity-90">A new version is ready to install.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => pwa.setShowUpdatePrompt(false)} className="px-3 py-1 text-xs hover:bg-white/10 rounded">Later</button>
                <button onClick={pwa.handleUpdateApp} className="px-3 py-1 text-xs bg-white text-nexus-accent font-bold rounded shadow-sm hover:bg-blue-50">Update Now</button>
              </div>
            </div>
          )}
          <UpdateChecker isOffline={isOffline} />

          {/* Settings (modal overlay) */}
          <SettingsPanel
            isOpen={ide.showSettings}
            onClose={() => ide.setShowSettings(false)}
            apiKeys={ide.apiKeys}
            onApiKeyChange={ide.setApiKey}
            isTouchMode={ide.isTouchMode}
            onToggleTouchMode={ide.toggleTouchMode}
            uiMode={ide.uiMode}
            onUiModeChange={ide.setUiMode}
            onClearWorkspace={handleClearWorkspace}
            onExport={exportAsZip}
            selectedAIProvider={ide.selectedAIProvider}
            onAIProviderChange={ide.setSelectedAIProvider}
            selectedModels={ide.selectedModels}
            onModelChange={(provider, model) => {
              ide.setSelectedModels(prev => ({ ...prev, [provider]: model }));
            }}
            githubToken={ide.githubToken}
            onGithubTokenChange={ide.setGithubToken}
            githubClientId={ide.githubClientId}
            onGithubClientIdChange={ide.setGithubClientId}
            githubClientSecret={ide.githubClientSecret}
            onGithubClientSecretChange={ide.setGithubClientSecret}
            ollamaUrl={ollamaUrl}
            onOllamaUrlChange={setOllamaUrl}
            isOffline={isOffline}
            isFullLock={isFullLock}
            airplaneModeEnabled={airplaneModeEnabled}
            onToggleAirplaneMode={handleToggleAirplaneMode}
            onToggleFullLock={handleToggleFullLock}
            sessionSavedAt={sessionSavedAt}
          />

          {/* Command Palette */}
          <CommandPalette
            isOpen={ide.isCommandPaletteOpen}
            onClose={() => ide.setIsCommandPaletteOpen(false)}
            commands={commands}
          />
          <NotificationToasts />
        </div>
      </ErrorBoundary>
    );
  }

  // === LEGACY / MOBILE UI RENDER ===
  return (
    <ErrorBoundary>
      <AirplaneModeBanner
        isOffline={isOffline}
        isFullLock={isFullLock}
        onDismiss={() => setBannerDismissed(true)}
      />
      <div className={cn("flex flex-col h-screen bg-nexus-bg text-nexus-text overflow-hidden select-none", ide.useBeginnerUI && "beginner-ui")}>
        <VoiceCommand 
          isListening={isVoiceListening} 
          onToggle={() => setIsVoiceListening(!isVoiceListening)} 
          onCommand={handleVoiceCommand}
        />

      <TitleBar 
        activeFile={activeFile} 
        onSearch={() => ide.setIsCommandPaletteOpen(true)} 
        onSettings={() => ide.setShowSettings(true)}
        onToggleVoice={() => setIsVoiceListening(!isVoiceListening)}
        onToggleZenMode={ide.toggleZenMode}
        isZenMode={ide.isZenMode}
        isOffline={isOffline}
        onToggleAirplaneMode={handleToggleAirplaneMode}
      />
      
      {pwa.showUpdatePrompt && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-nexus-accent text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-yellow-300 fill-yellow-300" />
            <div>
              <p className="text-sm font-bold">Nexus Update Available</p>
              <p className="text-[10px] opacity-90">A new version is ready to install.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => pwa.setShowUpdatePrompt(false)} className="px-3 py-1 text-xs hover:bg-white/10 rounded">Later</button>
            <button onClick={pwa.handleUpdateApp} className="px-3 py-1 text-xs bg-white text-nexus-accent font-bold rounded shadow-sm hover:bg-blue-50">Update Now</button>
          </div>
        </div>
      )}
      <UpdateChecker isOffline={isOffline} />

      <div className="flex flex-1 overflow-hidden">
        <CommandPalette 
          isOpen={ide.isCommandPaletteOpen} 
          onClose={() => ide.setIsCommandPaletteOpen(false)} 
          commands={commands} 
        />
        
        {ide.diffData && (
          <DiffEditor
            original={ide.diffData.original}
            modified={ide.diffData.modified}
            language={files.find(f => f.id === ide.diffData?.fileId)?.language}
            onClose={() => ide.setDiffData(null)}
            onApply={() => {
              if (ide.diffData) {
                updateFile(ide.diffData.fileId, ide.diffData.modified, true);
                ide.setDiffData(null);
              }
            }}
          />
        )}

        <ActivityBar 
          activeActivity={ide.activeActivity} 
          onActivityChange={(activity) => {
            if (activity === 'settings') {
              ide.setShowSettings(true);
            } else if (activity === 'workspace') {
              setShowWorkspacePanel(!showWorkspacePanel);
            } else {
              setShowWorkspacePanel(false);
              ide.setActiveActivity(activity);
            }
          }} 
          onToggleTerminal={() => ide.setShowTerminal(!ide.showTerminal)}
          onToggleVibeGraph={() => ide.setShowVibeGraph(!ide.showVibeGraph)}
          onToggleMinecraftScripts={() => ide.setShowMinecraftScripts(!ide.showMinecraftScripts)}
        />

        {/* Desktop sidebar panel — hidden on mobile (mobile uses bottom sheet) */}
        {ide.showSidebar && !ide.isTouchMode && (
          <div className="w-64 flex-shrink-0 flex flex-col border-r border-nexus-border bg-nexus-sidebar">
            {showWorkspacePanel ? (
              <WorkspacePanel
                files={files.map(f => ({ name: f.name, content: f.content, language: f.language }))}
                onLoadWorkspace={handleLoadWorkspace}
              />
            ) : ide.activeActivity === 'explorer' && (
              <Sidebar
                files={files}
                activeFileId={ide.activeFileId}
                onSelectFile={ide.handleSelectFile}
                onAddFile={addFile}
                onDeleteFile={deleteFile}
                onRenameFile={renameFile}
                onExport={exportAsZip}
                onClearWorkspace={handleClearWorkspace}
                onSaveWorkspace={() => handleSaveWorkspace()}
                onShowWorkspace={() => setShowWorkspacePanel(true)}
                onApplyTemplate={() => {}}
                onShowDiff={(id) => {
                  const f = files.find(x => x.id === id);
                  if (f) ide.setDiffData({ original: f.originalContent || f.content, modified: f.content, fileId: id });
                }}
                onOpenFolder={openDirectory}
                onSelectFolder={ide.setActiveFolder}
                activeFolder={ide.activeFolder}
                pendingAiActions={pendingAiActions}
                onAcceptAiActions={async (actions) => {
                  if (aiAssistantRef.current) {
                    await aiAssistantRef.current.applyChanges(actions);
                    setPendingAiActions(null);
                  }
                }}
                onRejectAiActions={() => setPendingAiActions(null)}
              />
            )}
            {ide.activeActivity === 'search' && !showWorkspacePanel && (
              <SearchView files={files} onSelectFile={ide.handleSelectFile} />
            )}
            {ide.activeActivity === 'debug' && (
              <DebugView activeFile={activeFile} onToggleTerminal={() => ide.setShowTerminal(!ide.showTerminal)} />
            )}
            {ide.activeActivity === 'ai' && (
              <div className="flex-1 flex flex-col min-w-0 bg-nexus-sidebar">
                <AIAssistant
                  ref={aiAssistantRef}
                  files={files}
                  activeFileId={ide.activeFileId}
                  onAddFile={addFile}
                  onUpdateFile={updateFile}
                  onDeleteFile={deleteFile}
                  apiKeys={ide.apiKeys}
                  selectedProvider={ide.selectedAIProvider}
                  selectedModels={ide.selectedModels}
                  githubToken={ide.githubToken}
                  onPendingActions={setPendingAiActions}
                  onToggleMaximize={() => ide.setIsAiMaximized(!ide.isAiMaximized)}
                  isMaximized={false}
                  onClose={() => ide.setActiveActivity('explorer')}
                />
              </div>
            )}
            {ide.activeActivity === 'git' && (
              <div className="flex-1 flex flex-col min-w-0 bg-nexus-sidebar overflow-hidden">
                <GithubView files={files} onImportFiles={(importedFiles) => { importedFiles.forEach(f => { if (!files.find(ef => ef.name === f.name)) addFile(f.name, f.content); }); }} onClearWorkspace={handleClearWorkspace} onUserUpdate={() => {}} onBranchChange={(b) => ide.setGitBranch(b)} onRepoChange={(r) => ide.setGitRepoName(r)} onUpdateFile={updateFile} activeFileId={ide.activeFileId} />
              </div>
            )}
            {ide.activeActivity === 'extensions' && (
              <div className="flex-1 flex flex-col min-w-0 bg-nexus-sidebar overflow-hidden">
                <ExtensionsView />
              </div>
            )}
            {ide.activeActivity === 'collab' && (
              <div className="flex-1 flex flex-col min-w-0 bg-nexus-sidebar overflow-hidden">
                <CollaborationView
                  sessionId={ide.sessionId}
                  isJoining={false}
                  joinId=""
                  setJoinId={() => {}}
                  onCreateSession={() => ide.setSessionId(socketService.createSession())}
                  onJoinSession={() => {}}
                  onHostProject={() => {}}
                  hostedUrl={ide.hostedUrl}
                />
              </div>
            )}
            {ide.activeActivity === 'minecraft' && (
              <div className="flex-1 flex flex-col min-w-0 bg-nexus-sidebar overflow-hidden">
                <MinecraftView sessionId={ide.sessionId} />
              </div>
            )}
            {ide.activeActivity === 'themes' && (
              <div className="flex-1 flex flex-col min-w-0 bg-nexus-sidebar overflow-hidden">
                <ThemeStudio />
              </div>
            )}
            {ide.activeActivity === 'deps' && (
              <div className="flex-1 flex flex-col min-w-0 bg-nexus-sidebar overflow-hidden">
                <DependencyGraph files={files} />
              </div>
            )}
            {ide.activeActivity === 'todos' && (
              <div className="flex-1 flex flex-col min-w-0 bg-nexus-sidebar overflow-hidden">
                <TodoScanner files={files} onSelectFile={ide.handleSelectFile} />
              </div>
            )}
            {ide.activeActivity === 'snippets' && (
              <div className="flex-1 flex flex-col min-w-0 bg-nexus-sidebar overflow-hidden">
                <SnippetManager />
              </div>
            )}
            {ide.activeActivity === 'insights' && (
              <div className="flex-1 flex flex-col min-w-0 bg-nexus-sidebar overflow-hidden">
                <ProjectInsights files={files} />
              </div>
            )}
            {ide.activeActivity === 'webcontainer' && (
              <div className="flex-1 flex flex-col min-w-0 bg-nexus-sidebar overflow-hidden">
                <WebContainerTerminal 
                  files={files} 
                  onFileUpdate={(path, content) => {
                    const file = files.find(f => f.name === path);
                    if (file) updateFile(file.id, content);
                  }}
                />
              </div>
            )}
            {ide.activeActivity === 'linux' && (
              <div className="flex-1 flex flex-col min-w-0 bg-nexus-sidebar overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-nexus-border">
                  <TerminalIcon size={16} className="text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Linux Terminal</p>
                    <p className="text-[10px] text-nexus-text-muted">Buildroot Linux via v86 x86 emulation</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                  <p className="text-[10px] text-nexus-text-muted">Full terminal panel →</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={cn("flex-1 flex flex-col overflow-hidden", ide.isTouchMode && "mobile-layout")}>
          {/* Error List Dashboard Overlay — hidden on mobile */}
          {!ide.isTouchMode && errors.length > 0 && (
            <div className="absolute top-12 right-4 z-50 max-w-sm space-y-2 pointer-events-none">
              {errors.slice(-3).map(err => (
                <div key={err.id} className="p-3 bg-red-900/95 border border-red-500 rounded text-white shadow-2xl pointer-events-auto flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-right-4">
                  <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs font-bold uppercase tracking-wider">{err.title}</div>
                    <div className="text-[11px] opacity-90 line-clamp-2">{err.message}</div>
                    {err.suggestion && (
                      <div className="text-[10px] mt-1 text-red-200 italic font-medium">{err.suggestion}</div>
                    )}
                  </div>
                  <button onClick={() => ErrorHandlingService.clearError(err.id)} className="opacity-60 hover:opacity-100">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {errors.length > 3 && (
                <div className="text-[10px] text-right text-gray-400 font-mono pr-2">+ {errors.length - 3} more errors</div>
              )}
            </div>
          )}

          {/* ===== MOBILE LAYOUT ===== */}
          {ide.isTouchMode ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Mobile Tab Bar */}
              <div className="mobile-tab-bar flex items-center overflow-x-auto no-scrollbar border-b border-nexus-border bg-nexus-sidebar px-2 min-h-[40px]">
                {ide.openFileIds.map(id => {
                  const file = files.find(f => f.id === id);
                  if (!file) return null;
                  return (
                    <div
                      key={id}
                      onClick={() => ide.setActiveFileId(id)}
                      className={cn(
                        "mobile-tab flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap flex-shrink-0",
                        ide.activeFileId === id
                          ? "text-white border-b-2 border-nexus-accent bg-nexus-bg/50"
                          : "text-nexus-text-muted"
                      )}
                    >
                      <span className="truncate max-w-[100px]">{file.name.split('/').pop()}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); ide.closeFile(id); }}
                        className="p-0.5 hover:bg-white/10 rounded text-nexus-text-muted"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Editor Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 relative">
                  {activeFile ? (
                    <Editor
                      file={activeFile}
                      onChange={(content) => updateFile(activeFile.id, content)}
                      apiKeys={ide.apiKeys}
                      onToggleTerminal={() => ide.setShowTerminal(!ide.showTerminal)}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-nexus-text-muted gap-4">
                      <Zap size={48} className="opacity-10" />
                      <p className="text-sm">Select a file to start coding</p>
                    </div>
                  )}
                </div>

                {ide.showTerminal && (
                  <div className="h-48 border-t border-nexus-border bg-nexus-bg">
                    <Terminal
                      files={files}
                      onClose={() => ide.setShowTerminal(false)}
                      onPreview={() => ide.setShowPreview(true)}
                    />
                  </div>
                )}

                {ide.showPreview && (
                  <div className="h-1/2 border-t border-nexus-border bg-white">
                    <Preview files={files} activeFileId={ide.activeFileId} />
                  </div>
                )}
              </div>

              {/* Mobile Bottom Navigation */}
              <div className="mobile-bottom-nav flex items-center justify-around bg-nexus-sidebar border-t border-nexus-border min-h-[52px] px-1 safe-area-bottom">
                <button
                  onClick={() => {
                    if (ide.activeActivity === 'explorer') {
                      ide.setShowSidebar(!ide.showSidebar);
                    } else {
                      ide.setActiveActivity('explorer');
                      ide.setShowSidebar(true);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                    ide.showSidebar ? "text-nexus-accent" : "text-nexus-text-muted"
                  )}
                >
                  <FilePlus size={18} />
                  <span className="text-[9px] font-medium">Files</span>
                </button>
                <button
                  onClick={() => ide.setShowAI(!ide.showAI)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                    ide.showAI ? "text-nexus-accent" : "text-nexus-text-muted"
                  )}
                >
                  <MessageSquare size={18} />
                  <span className="text-[9px] font-medium">AI</span>
                </button>
                <button
                  onClick={() => ide.setShowTerminal(!ide.showTerminal)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                    ide.showTerminal ? "text-nexus-accent" : "text-nexus-text-muted"
                  )}
                >
                  <Play size={18} />
                  <span className="text-[9px] font-medium">Terminal</span>
                </button>
                <button
                  onClick={() => ide.setShowPreview(!ide.showPreview)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                    ide.showPreview ? "text-nexus-accent" : "text-nexus-text-muted"
                  )}
                >
                  <Zap size={18} />
                  <span className="text-[9px] font-medium">Preview</span>
                </button>
                <button
                  onClick={() => ide.setShowSettings(true)}
                  className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg text-nexus-text-muted transition-colors"
                >
                  <Settings size={18} />
                  <span className="text-[9px] font-medium">Settings</span>
                </button>
              </div>
            </div>
          ) : (
          /* ===== DESKTOP LAYOUT ===== */
          <React.Fragment>
            <div className="h-9 bg-nexus-sidebar flex items-center overflow-x-auto no-scrollbar border-b border-nexus-border">
              {ide.openFileIds.map(id => {
                const file = files.find(f => f.id === id);
                if (!file) return null;
                return (
                  <div
                    key={id}
                    onClick={() => {
                      ide.setActiveFileId(id);
                      if (splitEditor && id !== ide.activeFileId) setSplitFileId(id);
                    }}
                    className={cn(
                      "nexus-tab",
                      ide.activeFileId === id ? "nexus-tab-active" : "nexus-tab-inactive"
                    )}
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); ide.closeFile(id); }}
                      className="p-0.5 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Zap size={12} />
                    </button>
                  </div>
                );
              })}
              {/* Split Editor Toggle Button */}
              <button
                onClick={handleToggleSplit}
                className={cn(
                  "flex items-center gap-1 px-2.5 h-full border-l border-nexus-border text-xs transition-colors flex-shrink-0",
                  splitEditor ? "text-nexus-accent bg-nexus-accent/10 hover:bg-nexus-accent/20" : "text-nexus-text-muted hover:text-white hover:bg-nexus-bg/50"
                )}
                title={splitEditor ? "Close Split Editor" : "Split Editor"}
              >
                <Columns2 size={14} />
              </button>
            </div>

            {/* Breadcrumb Navigation (Legacy) */}
            {activeFile && (
              <div className="h-6 px-3 flex items-center text-[11px] text-nexus-text-muted bg-nexus-sidebar border-b border-nexus-border overflow-hidden">
                {activeFile.name.split('/').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {i > 0 && <ChevronRight size={12} className="mx-1 opacity-40" />}
                    <span className={i === arr.length - 1 ? 'text-nexus-text' : ''}>{part}</span>
                  </React.Fragment>
                ))}
              </div>
            )}

            <div className="flex-1 flex overflow-hidden">
              {/* ── Linux Terminal: full-width panel ──────────────────── */}
              {ide.activeActivity === 'linux' ? (
                <LinuxTerminal
                  files={files.map(f => ({ name: f.name, content: f.content }))}
                  onPullFiles={(pulledFiles) => {
                    pulledFiles.forEach(pf => {
                      const existing = files.find(ef => ef.name === pf.name);
                      if (existing) {
                        updateFile(existing.id, pf.content);
                      } else {
                        addFile(pf.name, pf.content);
                      }
                    });
                    notificationService.success('Files Pulled', `${pulledFiles.length} file(s) imported from Linux`);
                  }}
                />
              ) : (
              <React.Fragment>
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 relative">
                  {splitEditor && activeFile ? (
                    <SplitEditor
                      files={files}
                      leftFileId={ide.activeFileId}
                      rightFileId={splitFileId}
                      onSelectFile={(id) => {
                        ide.handleSelectFile(id);
                        if (splitEditor && id !== ide.activeFileId) setSplitFileId(id);
                      }}
                      onUpdateFile={(id, content) => updateFile(id, content)}
                      onCloseSplit={handleToggleSplit}
                      apiKeys={ide.apiKeys}
                      onToggleTerminal={() => ide.setShowTerminal(!ide.showTerminal)}
                    />
                  ) : activeFile ? (
                    <Editor
                      file={activeFile}
                      onChange={(content) => updateFile(activeFile.id, content)}
                      apiKeys={ide.apiKeys}
                      onToggleTerminal={() => ide.setShowTerminal(!ide.showTerminal)}
                    />
                  ) : (
                    <WelcomeTab
                      onNewFile={() => addFile('index.html', '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Project</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>')}
                      onOpenFolder={openDirectory}
                    />
                  )}
                </div>

                {ide.showTerminal && (
                  <div className="h-64 border-t border-nexus-border bg-nexus-bg">
                    <Terminal
                      files={files}
                      onClose={() => ide.setShowTerminal(false)}
                      onPreview={() => ide.setShowPreview(true)}
                    />
                  </div>
                )}
              </div>

              {ide.showPreview && (
                <div className="w-1/3 border-l border-nexus-border bg-white">
                  <Preview files={files} activeFileId={ide.activeFileId} />
                </div>
              )}
              </React.Fragment>
              )}
            </div>
          </React.Fragment>
          )}
        </div>

        {/* Mobile: Sidebar as bottom sheet overlay */}
        {ide.isTouchMode && ide.showSidebar && (
          <div className="mobile-sidebar-overlay" onClick={() => ide.setShowSidebar(false)}>
            <div
              className="mobile-sidebar-sheet bg-nexus-sidebar border-r border-nexus-border flex flex-col h-full w-[280px] max-w-[85vw] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-nexus-border">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Explorer</span>
                <button onClick={() => ide.setShowSidebar(false)} className="p-1 hover:bg-nexus-bg rounded text-nexus-text-muted">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  files={files}
                  activeFileId={ide.activeFileId}
                  onSelectFile={(id) => {
                    ide.handleSelectFile(id);
                    ide.setShowSidebar(false);
                  }}
                  onAddFile={addFile}
                  onDeleteFile={deleteFile}
                  onRenameFile={renameFile}
                  onExport={exportAsZip}
                  onClearWorkspace={handleClearWorkspace}
                  onSaveWorkspace={() => handleSaveWorkspace()}
                  onShowWorkspace={() => { setShowWorkspacePanel(true); ide.setShowSidebar(false); }}
                  onApplyTemplate={() => {}}
                  onShowDiff={(id) => {
                    const f = files.find(x => x.id === id);
                    if (f) ide.setDiffData({ original: f.originalContent || f.content, modified: f.content, fileId: id });
                  }}
                  onOpenFolder={openDirectory}
                  onSelectFolder={ide.setActiveFolder}
                  activeFolder={ide.activeFolder}
                  pendingAiActions={pendingAiActions}
                  onAcceptAiActions={async (actions) => {
                    if (aiAssistantRef.current) {
                      await aiAssistantRef.current.applyChanges(actions);
                      setPendingAiActions(null);
                    }
                  }}
                  onRejectAiActions={() => setPendingAiActions(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile: AI as full-screen overlay */}
        {ide.isTouchMode && ide.showAI && (
          <div className="fixed inset-0 z-[90] bg-nexus-bg">
            <AIAssistant
              ref={aiAssistantRef}
              files={files}
              activeFileId={ide.activeFileId}
              onAddFile={addFile}
              onUpdateFile={updateFile}
              onDeleteFile={deleteFile}
              apiKeys={ide.apiKeys}
              selectedProvider={ide.selectedAIProvider}
              selectedModels={ide.selectedModels}
              githubToken={ide.githubToken}
              onPendingActions={setPendingAiActions}
              onToggleMaximize={() => ide.setIsAiMaximized(!ide.isAiMaximized)}
              isMaximized={true}
              onClose={() => ide.setShowAI(false)}
            />
          </div>
        )}

        {/* AI Assistant Side Panel (Desktop only — mobile uses full-screen overlay above) */}
        {ide.showAI && !ide.isTouchMode && ide.activeActivity !== 'ai' && (
          <div className={cn(
            "border-l border-nexus-border bg-nexus-sidebar transition-all duration-300 overflow-hidden flex flex-col min-w-0 flex-shrink-0", 
            ide.isAiMaximized ? "w-1/2" : "w-80"
          )}>
            <AIAssistant
              ref={aiAssistantRef}
              files={files}
              activeFileId={ide.activeFileId}
              onAddFile={addFile}
              onUpdateFile={updateFile}
              onDeleteFile={deleteFile}
              apiKeys={ide.apiKeys}
              selectedProvider={ide.selectedAIProvider}
              selectedModels={ide.selectedModels}
              githubToken={ide.githubToken}
              onPendingActions={setPendingAiActions}
              onToggleMaximize={() => ide.setIsAiMaximized(!ide.isAiMaximized)}
              isMaximized={ide.isAiMaximized}
              onClose={() => ide.setShowAI(false)}
            />
          </div>
        )}
      </div>

      <StatusBar 
        activeFile={activeFile} 
        files={files}
        isOffline={isOffline}
        vibeProgress={vibeProgress || undefined}
        gitBranch={ide.gitBranch}
        gitRepoName={ide.gitRepoName}
      />

      <SettingsPanel
        isOpen={ide.showSettings}
        onClose={() => ide.setShowSettings(false)}
        apiKeys={ide.apiKeys}
        onApiKeyChange={ide.setApiKey}
        isTouchMode={ide.isTouchMode}
        onToggleTouchMode={ide.toggleTouchMode}
        uiMode={ide.uiMode}
        onUiModeChange={ide.setUiMode}
        onClearWorkspace={handleClearWorkspace}
        onExport={exportAsZip}
        selectedAIProvider={ide.selectedAIProvider}
        onAIProviderChange={ide.setSelectedAIProvider}
        selectedModels={ide.selectedModels}
        onModelChange={(provider, model) => {
          ide.setSelectedModels(prev => ({ ...prev, [provider]: model }));
        }}
        githubToken={ide.githubToken}
        onGithubTokenChange={ide.setGithubToken}
        githubClientId={ide.githubClientId}
        onGithubClientIdChange={ide.setGithubClientId}
        githubClientSecret={ide.githubClientSecret}
        onGithubClientSecretChange={ide.setGithubClientSecret}
        ollamaUrl={ollamaUrl}
        onOllamaUrlChange={setOllamaUrl}
        isOffline={isOffline}
        isFullLock={isFullLock}
        airplaneModeEnabled={airplaneModeEnabled}
        onToggleAirplaneMode={handleToggleAirplaneMode}
        onToggleFullLock={handleToggleFullLock}
        sessionSavedAt={sessionSavedAt}
      />

      <NotificationToasts />
      <KeyboardShortcutsPanel isOpen={showKeyboardShortcuts} onClose={() => setShowKeyboardShortcuts(false)} />
    </div>
    </ErrorBoundary>
  );
}

function CodeIcon() {
  return (
    <div className="w-12 h-12 rounded-xl bg-nexus-bg border border-nexus-border flex items-center justify-center">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-nexus-text-muted">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    </div>
  );
}
