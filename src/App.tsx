import React, { useEffect, useRef, useState } from 'react';
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

import { useFileSystem } from './hooks/useFileSystem';
import { useIDEState } from './hooks/useIDEState';
import { usePWA } from './hooks/usePWA';
import { nexusChannel } from './hooks/useWindow';
import { socketService } from './services/socketService';
import { workspaceService } from './services/workspaceService';
import ErrorHandlingService from './services/errorHandlingService';
import VoiceCommand from './components/VoiceCommand';
import { cn } from './lib/utils';
import { Zap, FilePlus, FolderOpen, MessageSquare, Play, Settings, Trash2, Download, Layout, Brain, AlertCircle, X } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  const isPopout = window.location.pathname === '/preview-popout';
  const { files, addFile, updateFile, deleteFile, renameFile, openDirectory, isLoaded: isFsLoaded } = useFileSystem();
  const ide = useIDEState(files);
  const pwa = usePWA();
  
  const aiAssistantRef = useRef<any>(null);
  const [pendingAiActions, setPendingAiActions] = useState<any[] | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
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
      // Trigger run via socket
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
    } else if (command.includes("clear workspace")) {
      handleClearWorkspace();
    } else if (command.includes("analyze")) {
      handleAnalyzeArchitecture();
    }
  };

  useEffect(() => {
    if (isFsLoaded && !ide.activeFileId && files.length > 0) {
      ide.setActiveFileId(files[0].id);
      ide.setOpenFileIds([files[0].id]);
    }
  }, [isFsLoaded, files, ide.activeFileId]);

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

  const exportAsZip = async () => {
    const zip = new JSZip();
    files.forEach(file => zip.file(file.name, file.content));
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'nexus-project-4.1.zip');
  };

  const handleClearWorkspace = () => {
    if (confirm('Clear entire workspace?')) {
      files.forEach(f => deleteFile(f.id));
      ide.setOpenFileIds([]);
      ide.setActiveFileId(null);
    }
  };

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
      if (match) ide.setMermaidChart(match[1]);
    } catch (e) { console.error(e); }
  };

  const commands = [
    { id: 'new-file', label: 'New File', icon: FilePlus, category: 'File', action: () => ide.setActiveActivity('explorer') },
    { id: 'open-folder', label: 'Open Local Folder', icon: FolderOpen, category: 'File', action: openDirectory },
    { id: 'toggle-ai', label: 'Toggle AI Assistant', icon: MessageSquare, category: 'View', action: () => ide.setShowAI(!ide.showAI) },
    { id: 'toggle-terminal', label: 'Toggle Terminal', icon: Play, category: 'View', action: () => ide.setShowTerminal(!ide.showTerminal) },
    { id: 'settings', label: 'Open Settings', icon: Settings, category: 'App', action: () => ide.setShowSettings(true) },
    { id: 'clear-workspace', label: 'Clear Workspace', icon: Trash2, category: 'Workspace', action: handleClearWorkspace },
    { id: 'export-zip', label: 'Export as ZIP', icon: Download, category: 'File', action: exportAsZip },
    { id: 'analyze-arch', label: 'Analyze Architecture', icon: Layout, category: 'AI', action: handleAnalyzeArchitecture },
  ];

  const activeFile = files.find(f => f.id === ide.activeFileId) || null;

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-nexus-bg text-nexus-text overflow-hidden select-none">
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
      />
      
      {pwa.showUpdatePrompt && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-nexus-accent text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-yellow-300 fill-yellow-300" />
            <div>
              <p className="text-sm font-bold">Nexus 4.3 Update Available</p>
              <p className="text-[10px] opacity-90">A new version is ready to install.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => pwa.setShowUpdatePrompt(false)} className="px-3 py-1 text-xs hover:bg-white/10 rounded">Later</button>
            <button onClick={pwa.handleUpdateApp} className="px-3 py-1 text-xs bg-white text-nexus-accent font-bold rounded shadow-sm hover:bg-blue-50">Update Now</button>
          </div>
        </div>
      )}

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
            } else {
              ide.setActiveActivity(activity);
            }
          }} 
          onToggleTerminal={() => ide.setShowTerminal(!ide.showTerminal)}
          onToggleVibeGraph={() => ide.setShowVibeGraph(!ide.showVibeGraph)}
          onToggleMinecraftScripts={() => ide.setShowMinecraftScripts(!ide.showMinecraftScripts)}
        />

        {ide.showSidebar && (
          <div className="w-64 flex-shrink-0 flex flex-col border-r border-nexus-border bg-nexus-sidebar">
            {ide.activeActivity === 'explorer' && (
              <Sidebar
                files={files}
                activeFileId={ide.activeFileId}
                onSelectFile={ide.handleSelectFile}
                onAddFile={addFile}
                onDeleteFile={deleteFile}
                onRenameFile={renameFile}
                onExport={exportAsZip}
                onApplyTemplate={() => {}}
                onShowDiff={(id) => {
                  const f = files.find(x => x.id === id);
                  if (f) ide.setDiffData({ original: f.originalContent || f.content, modified: f.content, fileId: id });
                }}
                onOpenFolder={openDirectory}
                onSelectFolder={ide.setActiveFolder}
                activeFolder={ide.activeFolder}
                pendingAiActions={pendingAiActions}
                onAcceptAiActions={() => {
                  if (aiAssistantRef.current && pendingAiActions) {
                    aiAssistantRef.current.applyChanges(pendingAiActions);
                    setPendingAiActions(null);
                  }
                }}
                onRejectAiActions={() => setPendingAiActions(null)}
              />
            )}
            {ide.activeActivity === 'search' && (
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
                <GithubView files={files} onImportFiles={() => {}} onClearWorkspace={handleClearWorkspace} onUserUpdate={() => {}} />
              </div>
            )}
            {ide.activeActivity === 'extensions' && (
              <div className="flex-1 flex flex-col min-w-0 bg-nexus-sidebar overflow-hidden">
                <ExtensionsView extensions={[]} onAddExtension={() => {}} onRemoveExtension={() => {}} onToggleExtension={() => {}} />
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
          </div>
        )}

        <div className={cn("flex-1 flex flex-col overflow-hidden", ide.isTouchMode && "touch-mode")}>
          {/* Error List Dashboard Overlay */}
          {errors.length > 0 && (
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

          <div className="h-9 bg-nexus-sidebar flex items-center overflow-x-auto no-scrollbar border-b border-nexus-border">
            {ide.openFileIds.map(id => {
              const file = files.find(f => f.id === id);
              if (!file) return null;
              return (
                <div
                  key={id}
                  onClick={() => ide.setActiveFileId(id)}
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
          </div>

          <div className="flex-1 flex overflow-hidden">
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
                    <Zap size={64} className="opacity-10" />
                    <p className="text-sm">Select a file to start coding in Nexus 4.3</p>
                    <div className="flex gap-2">
                      <kbd className="px-2 py-1 bg-nexus-sidebar border border-nexus-border rounded text-[10px]">Ctrl+Shift+P</kbd>
                      <span className="text-[10px]">Command Palette</span>
                    </div>
                  </div>
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
          </div>
        </div>

        {/* AI Assistant Side Panel (Optional/Legacy) */}
        {ide.showAI && ide.activeActivity !== 'ai' && (
          <div className={cn("border-l border-nexus-border bg-nexus-sidebar transition-all duration-300", ide.isAiMaximized ? "w-1/2" : "w-80")}>
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
      />

      <SettingsPanel
        isOpen={ide.showSettings}
        onClose={() => ide.setShowSettings(false)}
        apiKeys={ide.apiKeys}
        onApiKeyChange={ide.setApiKey}
        isTouchMode={ide.isTouchMode}
        onToggleTouchMode={ide.toggleTouchMode}
        onClearWorkspace={handleClearWorkspace}
        onExport={handleExportZip}
        selectedAIProvider={ide.selectedAIProvider}
        onAIProviderChange={ide.setSelectedAIProvider}
        selectedModels={ide.selectedModels}
        onModelChange={(provider, model) => {
          ide.setSelectedModels(prev => ({ ...prev, [provider]: model }));
        }}
        githubToken={ide.githubToken}
        onGithubTokenChange={ide.setGithubToken}
        ollamaUrl={ollamaUrl}
        onOllamaUrlChange={setOllamaUrl}
      />

    </div>
    </ErrorBoundary>
  );
}
