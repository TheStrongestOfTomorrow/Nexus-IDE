import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import AIAssistant from './components/AIAssistant';
import ActivityBar, { ActivityType } from './components/ActivityBar';
import StatusBar from './components/StatusBar';
import GithubView from './components/GithubView';
import ExtensionsView from './components/ExtensionsView';
import CollaborationView from './components/CollaborationView';
import DiffEditor from './components/DiffEditor';
import CommandPalette from './components/CommandPalette';
import MermaidViewer from './components/MermaidViewer';
import Terminal from './components/Terminal';
import { socketService } from './services/socketService';
import { workspaceService } from './services/workspaceService';
import { useFileSystem } from './hooks/useFileSystem';
import { Settings, Code2, LayoutPanelLeft, MessageSquare, Download, Database, Globe, ChevronRight, X, Command, Zap, FilePlus, FolderOpen, Play, Search, Trash2, Layout, Users, GitCompare, Brain } from 'lucide-react';
import { cn } from './lib/utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { GoogleGenAI } from '@google/genai';
import { AI_PROVIDERS } from './constants/models';

export default function App() {
  const { files, addFile, updateFile, deleteFile, renameFile } = useFileSystem();
  const [activeFileId, setActiveFileId] = useState<string | null>(files[0]?.id || null);
  const [openFileIds, setOpenFileIds] = useState<string[]>(files[0] ? [files[0].id] : []);
  
  const [activeActivity, setActiveActivity] = useState<ActivityType>('explorer');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [githubUser, setGithubUser] = useState<any | null>(null);
  const [extensions, setExtensions] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexus_extensions');
    return saved ? JSON.parse(saved) : [];
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const [diffData, setDiffData] = useState<{ original: string, modified: string, fileId: string } | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [mermaidChart, setMermaidChart] = useState<string | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [isTouchMode, setIsTouchMode] = useState(() => {
    return localStorage.getItem('nexus_touch_mode') === 'true';
  });
  
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('nexus_api_keys');
    return saved ? JSON.parse(saved) : {
      gemini: '',
      openai: '',
      anthropic: ''
    };
  });

  const [selectedAIProvider, setSelectedAIProvider] = useState(() => {
    return localStorage.getItem('nexus_selected_ai') || 'gemini';
  });

  const [selectedModels, setSelectedModels] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('nexus_selected_models');
    return saved ? JSON.parse(saved) : {
      gemini: 'gemini-2.5-flash',
      openai: 'gpt-4o',
      anthropic: 'claude-sonnet-4-6',
      ollama: 'llama3',
      groq: 'llama-3.3-70b-versatile',
      deepseek: 'deepseek-chat'
    };
  });

  const [ollamaUrl, setOllamaUrl] = useState(() => {
    return localStorage.getItem('nexus_ollama_url') || 'http://localhost:11434';
  });

  const [backendBase, setBackendBase] = useState(() => {
    return localStorage.getItem('nexus_backend_base') || 'none';
  });

  const [backendApiKey, setBackendApiKey] = useState(() => {
    return localStorage.getItem('nexus_backend_key') || '';
  });

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('nexus_touch_mode', isTouchMode.toString());
  }, [isTouchMode]);

  useEffect(() => {
    localStorage.setItem('nexus_ollama_url', ollamaUrl);
  }, [ollamaUrl]);

  const handleClearWorkspace = () => {
    if (confirm('Are you sure you want to clear the entire workspace? This cannot be undone.')) {
      files.forEach(f => deleteFile(f.id));
      setOpenFileIds([]);
      setActiveFileId(null);
      workspaceService.deleteWorkspace('default');
    }
  };

  const exportAsZip = async () => {
    const zip = new JSZip();
    files.forEach(file => {
      zip.file(file.name, file.content);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    // @ts-ignore
    saveAs(content, 'nexus-project.zip');
  };

  const handleOpenFolder = async () => {
    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      const loadedFiles: { name: string, content: string }[] = [];
      
      async function readDir(handle: any, path = '') {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            const content = await file.text();
            loadedFiles.push({ name: path + entry.name, content });
          } else if (entry.kind === 'directory') {
            await readDir(entry, path + entry.name + '/');
          }
        }
      }
      
      await readDir(dirHandle);
      if (loadedFiles.length > 0) {
        handleClearWorkspace();
        loadedFiles.forEach(f => addFile(f.name, f.content));
        alert(`Loaded ${loadedFiles.length} files from local folder.`);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('File System Access Error:', err);
        alert('Failed to access local file system.');
      }
    }
  };

  const handleAnalyzeArchitecture = async () => {
    const apiKey = apiKeys['gemini'];
    if (!apiKey) {
      alert('Please set your Gemini API key for architecture analysis.');
      return;
    }

    const genAI = new GoogleGenAI({ apiKey });
    const model = genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following project files and generate a Mermaid.js flowchart (graph TD) representing the architecture and component relationships. Return ONLY the mermaid code block.\n\nFiles:\n${files.map(f => `File: ${f.name}\nContent:\n${f.content.substring(0, 1000)}`).join('\n\n')}`,
    });

    try {
      const response = await model;
      const text = response.text || '';
      const match = text.match(/```mermaid\s*([\s\S]*?)\s*```/) || text.match(/graph TD[\s\S]*/);
      if (match) {
        setMermaidChart(match[1] || match[0]);
      } else {
        alert('Could not generate architecture diagram.');
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('Failed to analyze architecture.');
    }
  };

  const handleScanProject = async () => {
    const apiKey = apiKeys['gemini'];
    if (!apiKey) {
      alert('Please set your Gemini API key to scan the project.');
      return;
    }

    const genAI = new GoogleGenAI({ apiKey });
    const model = genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize each of the following files in one short sentence each. Return a JSON object where keys are filenames and values are summaries.\n\nFiles:\n${files.map(f => `${f.name}: ${f.content.substring(0, 500)}`).join('\n\n')}`,
      config: { responseMimeType: 'application/json' }
    });

    try {
      const response = await model;
      const summaries = JSON.parse(response.text || '{}');
      await workspaceService.saveMemory('default', summaries);
      alert('Project scanned and memory updated!');
    } catch (err) {
      console.error('Scan failed:', err);
      alert('Failed to scan project.');
    }
  };

  const commands = [
    { id: 'new-file', label: 'New File', icon: FilePlus, category: 'File', action: () => setActiveActivity('explorer') },
    { id: 'open-folder', label: 'Open Local Folder', icon: FolderOpen, category: 'File', action: handleOpenFolder },
    { id: 'toggle-ai', label: 'Toggle AI Assistant', icon: MessageSquare, category: 'View', action: () => setShowAI(!showAI) },
    { id: 'toggle-terminal', label: 'Toggle Terminal', icon: Play, category: 'View', action: () => setShowTerminal(!showTerminal) },
    { id: 'settings', label: 'Open Settings', icon: Settings, category: 'App', action: () => setShowSettings(true) },
    { id: 'clear-workspace', label: 'Clear Workspace', icon: Trash2, category: 'Workspace', action: handleClearWorkspace },
    { id: 'export-zip', label: 'Export as ZIP', icon: Download, category: 'File', action: exportAsZip },
    { id: 'analyze-arch', label: 'Analyze Architecture', icon: Layout, category: 'AI', action: handleAnalyzeArchitecture },
    { id: 'scan-project', label: 'Scan Project (AI Memory)', icon: Brain, category: 'AI', action: () => handleScanProject() },
  ];

  useEffect(() => {
    localStorage.setItem('nexus_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    localStorage.setItem('nexus_selected_ai', selectedAIProvider);
  }, [selectedAIProvider]);

  useEffect(() => {
    localStorage.setItem('nexus_selected_models', JSON.stringify(selectedModels));
  }, [selectedModels]);

  useEffect(() => {
    localStorage.setItem('nexus_backend_base', backendBase);
  }, [backendBase]);

  useEffect(() => {
    const loadWorkspace = async () => {
      const savedId = localStorage.getItem('nexus_active_workspace_id') || 'default';
      const workspace = await workspaceService.getWorkspace(savedId);
      if (workspace) {
        // Clear current files and add saved ones
        // This is a bit tricky with useFileSystem, might need to add a reset method
        // For now, let's just assume we can use addFile
        workspace.files.forEach(f => {
          const existing = files.find(ex => ex.name === f.name);
          if (!existing) addFile(f.name, f.content);
        });
      }
      setIsWorkspaceLoading(false);
    };
    loadWorkspace();
  }, []);

  useEffect(() => {
    if (!isWorkspaceLoading) {
      const activeId = localStorage.getItem('nexus_active_workspace_id') || 'default';
      workspaceService.saveWorkspace({
        id: activeId,
        name: 'My Workspace',
        files,
        lastModified: Date.now()
      });
    }
  }, [files, isWorkspaceLoading]);

  useEffect(() => {
    localStorage.setItem('nexus_extensions', JSON.stringify(extensions));
    
    // Load enabled extensions
    extensions.forEach(ext => {
      if (ext.enabled) {
        const scriptId = `ext-${ext.id}`;
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = ext.url;
          script.async = true;
          document.body.appendChild(script);
        }
      } else {
        const script = document.getElementById(`ext-${ext.id}`);
        if (script) script.remove();
      }
    });
  }, [extensions]);

  const handleAddExtension = (url: string, metadata?: any) => {
    const id = metadata?.id || Math.random().toString(36).substr(2, 9);
    const name = metadata?.name || url.split('/').pop() || 'New Extension';
    setExtensions(prev => [...prev, { 
      id, 
      name, 
      url, 
      enabled: true, 
      description: metadata?.description || 'External script extension',
      isVsix: metadata?.isVsix || false,
      packageJson: metadata?.packageJson
    }]);
  };

  const handleRemoveExtension = (id: string) => {
    setExtensions(prev => prev.filter(ext => ext.id !== id));
    const script = document.getElementById(`ext-${id}`);
    if (script) script.remove();
  };

  const handleToggleExtension = (id: string) => {
    setExtensions(prev => prev.map(ext => ext.id === id ? { ...ext, enabled: !ext.enabled } : ext));
  };

  useEffect(() => {
    socketService.connect();
    
    const unsubscribe = socketService.subscribe((msg) => {
      if (msg.type === 'collab') {
        const { fileId, content } = msg;
        updateFile(fileId, content);
      } else if (msg.type === 'session:created' || msg.type === 'session:joined') {
        setSessionId(msg.sessionId);
        setIsJoining(false);
      } else if (msg.type === 'session:timeout') {
        alert('Session timed out due to inactivity. Workspace will be wiped.');
        handleClearWorkspace();
        setSessionId(null);
      } else if (msg.type === 'session:error') {
        alert(msg.message);
        setIsJoining(false);
      } else if (msg.type === 'workspace:hosted') {
        setHostedUrl(msg.url);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'preview:open') {
        setActiveFileId(e.data.id);
        if (!openFileIds.includes(e.data.id)) {
          setOpenFileIds(prev => [...prev, e.data.id]);
        }
      } else if (e.data.type === 'preview:up') {
        const activeFile = files.find(f => f.id === activeFileId);
        if (activeFile) {
          const parts = activeFile.name.split('/');
          parts.pop(); // current file
          if (parts.length > 0) {
            parts.pop(); // parent dir
            const parentDir = parts.join('/');
            const firstInParent = files.find(f => f.name.startsWith(parentDir ? parentDir + '/' : ''));
            if (firstInParent) setActiveFileId(firstInParent.id);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('message', handleMessage);
    };
  }, [files, activeFileId, openFileIds]);

  const handleHostProject = () => {
    if (!sessionId) {
      alert('You must start a collaboration session first to host your project.');
      return;
    }
    socketService.hostWorkspace(sessionId, files.map(f => ({ name: f.name, content: f.content })));
  };

  const handleCreateSession = () => {
    const id = socketService.createSession();
    setSessionId(id);
  };

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim()) {
      socketService.joinSession(joinId.trim());
      setIsJoining(true);
    }
  };

  const handleUpdateFile = (id: string, content: string, fromRemote = false) => {
    updateFile(id, content);
    if (!fromRemote) {
      socketService.send({ type: 'collab', fileId: id, content });
    }
  };

  const activeFile = files.find(f => f.id === activeFileId) || null;

  const handleSelectFile = (id: string) => {
    setActiveFileId(id);
    setActiveFolder(null);
    if (!openFileIds.includes(id)) {
      setOpenFileIds(prev => [...prev, id]);
    }
  };

  const handleSelectFolder = (folderPath: string) => {
    setActiveFolder(folderPath);
    setActiveFileId(null);
    setShowPreview(true);
  };

  const closeFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newOpenFiles = openFileIds.filter(fid => fid !== id);
    setOpenFileIds(newOpenFiles);
    if (activeFileId === id) {
      setActiveFileId(newOpenFiles[newOpenFiles.length - 1] || null);
    }
  };

  const handleActivityChange = (activity: ActivityType) => {
    if (activity === 'settings') {
      setShowSettings(true);
      return;
    }
    if (activity === 'ai') {
      setShowAI(!showAI);
      return;
    }
    if (activeActivity === activity && showSidebar) {
      setShowSidebar(false);
    } else {
      setActiveActivity(activity);
      setShowSidebar(true);
    }
  };

  const handleImportGithubFiles = (githubFiles: { name: string, content: string }[]) => {
    githubFiles.forEach(gf => {
      const existing = files.find(f => f.name === gf.name);
      if (existing) {
        updateFile(existing.id, gf.content);
      } else {
        addFile(gf.name, gf.content);
      }
    });
    setShowPreview(true);
  };

  const handleApplyTemplate = (template: any) => {
    if (confirm(`Apply ${template.name} template? This will add new files to your project.`)) {
      template.files.forEach((file: any) => {
        const existing = files.find(f => f.name === file.name);
        if (existing) {
          updateFile(existing.id, file.content);
        } else {
          addFile(file.name, file.content);
        }
      });
      setShowPreview(true);
    }
  };

  const handleApplyDiff = () => {
    if (diffData) {
      updateFile(diffData.fileId, diffData.modified, true); // Update original content too on apply
      setDiffData(null);
    }
  };

  const handleShowDiff = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      setDiffData({
        original: file.originalContent || file.content,
        modified: file.content,
        fileId: id
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden select-none">
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        commands={commands} 
      />
      {diffData && (
        <DiffEditor
          original={diffData.original}
          modified={diffData.modified}
          language={files.find(f => f.id === diffData.fileId)?.language}
          onClose={() => setDiffData(null)}
          onApply={handleApplyDiff}
        />
      )}
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          <ActivityBar 
            activeActivity={activeActivity} 
            onActivityChange={handleActivityChange} 
            onToggleTerminal={() => setShowTerminal(!showTerminal)}
          />

          {showSidebar && (
          <div className="w-64 flex-shrink-0 flex flex-col border-r border-[#252526] bg-[#252526]">
            {activeActivity === 'explorer' && (
              <Sidebar
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onAddFile={addFile}
                onDeleteFile={deleteFile}
                onRenameFile={renameFile}
                onExport={exportAsZip}
                onApplyTemplate={handleApplyTemplate}
                onShowDiff={handleShowDiff}
                onOpenFolder={handleOpenFolder}
                onSelectFolder={handleSelectFolder}
                activeFolder={activeFolder}
              />
            )}
            {activeActivity === 'search' && (
              <div className="p-4">
                <h2 className="text-xs font-bold uppercase mb-4 opacity-50">Search</h2>
                <input 
                  type="text" 
                  placeholder="Search" 
                  className="w-full bg-[#3c3c3c] border border-[#3c3c3c] rounded px-2 py-1 text-sm outline-none focus:border-[#007acc]"
                />
              </div>
            )}
            {activeActivity === 'git' && (
              <GithubView 
                files={files} 
                onImportFiles={handleImportGithubFiles} 
                onClearWorkspace={handleClearWorkspace}
                onUserUpdate={setGithubUser}
              />
            )}
            {activeActivity === 'extensions' && (
              <ExtensionsView
                extensions={extensions}
                onAddExtension={handleAddExtension}
                onRemoveExtension={handleRemoveExtension}
                onToggleExtension={handleToggleExtension}
              />
            )}
            {activeActivity === 'collab' && (
              <CollaborationView
                sessionId={sessionId}
                isJoining={isJoining}
                joinId={joinId}
                setJoinId={setJoinId}
                onCreateSession={handleCreateSession}
                onJoinSession={handleJoinSession}
                onHostProject={handleHostProject}
                hostedUrl={hostedUrl}
              />
            )}
          </div>
        )}

          <div className={cn("flex-1 flex flex-col overflow-hidden", isTouchMode && "touch-mode")}>
            {/* Tabs Bar */}
            <div className={cn("h-9 bg-[#252526] flex items-center overflow-x-auto no-scrollbar border-b border-[#1e1e1e]", isTouchMode && "h-12")}>
              {openFileIds.map(id => {
                const file = files.find(f => f.id === id);
                if (!file) return null;
                return (
                  <div
                    key={id}
                    onClick={() => setActiveFileId(id)}
                    className={cn(
                      "h-full flex items-center px-3 gap-2 border-r border-[#1e1e1e] cursor-pointer text-xs min-w-[120px] max-w-[200px] transition-colors group",
                      activeFileId === id ? "bg-[#1e1e1e] text-white" : "bg-[#2d2d2d] text-gray-500 hover:bg-[#2a2d2e]",
                      isTouchMode && "text-sm px-4 min-w-[150px]"
                    )}
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    <button 
                      onClick={(e) => closeFile(e, id)}
                      className={cn("p-0.5 rounded hover:bg-[#454545] opacity-0 group-hover:opacity-100 transition-opacity", isTouchMode && "opacity-100 p-1")}
                    >
                      <X size={isTouchMode ? 16 : 12} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className={cn("flex flex-col h-full transition-all duration-300", showPreview ? "w-1/2 border-r border-[#333]" : "w-full")}>
                {mermaidChart ? (
                  <div className="flex-1 p-4 bg-[#1e1e1e]">
                    <MermaidViewer chart={mermaidChart} onClose={() => setMermaidChart(null)} />
                  </div>
                ) : (
                  <Editor
                    activeFile={activeFile}
                    onChange={(id, content) => handleUpdateFile(id, content)}
                    extensions={extensions}
                    apiKeys={apiKeys}
                    onToggleTerminal={() => setShowTerminal(true)}
                  />
                )}
              </div>
              
              {showPreview && !mermaidChart && (
                <div className="w-1/2 h-full">
                  <Preview 
                  files={files} 
                  activeFileId={activeFileId} 
                  activeFolder={activeFolder}
                />
                </div>
              )}
            </div>

            {showTerminal && (
              <Terminal 
                files={files} 
                onClose={() => setShowTerminal(false)} 
                onPreview={() => setShowPreview(true)}
              />
            )}
          </div>
      </div>

      {showAI && (
          <AIAssistant
            files={files}
            activeFileId={activeFileId}
            onAddFile={addFile}
            onUpdateFile={updateFile}
            onDeleteFile={deleteFile}
            apiKeys={apiKeys}
            selectedProvider={selectedAIProvider}
            selectedModel={selectedModels[selectedAIProvider]}
            ollamaUrl={ollamaUrl}
          />
        )}
      </div>

      <StatusBar 
        activeFile={activeFile} 
        githubUser={githubUser} 
        onScanProject={handleScanProject}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#252526] border border-[#333] rounded-lg p-6 w-[32rem] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Settings size={20} /> Settings
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                <Settings size={20} className="rotate-45" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Interface Settings */}
              <section>
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Zap size={16} /> Interface Mode
                </h3>
                <div className="flex items-center justify-between p-4 bg-[#1e1e1e] rounded border border-[#333]">
                  <div>
                    <div className="text-sm font-bold text-white">Touch Friendly Mode</div>
                    <div className="text-[10px] text-gray-500 uppercase">Optimized for mobile and tablet devices</div>
                  </div>
                  <button 
                    onClick={() => setIsTouchMode(!isTouchMode)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      isTouchMode ? "bg-blue-600" : "bg-gray-600"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                      isTouchMode ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </section>

              {/* AI Provider Settings */}
              <section>
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MessageSquare size={16} /> AI Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Active Provider</label>
                    <select
                      value={selectedAIProvider}
                      onChange={e => setSelectedAIProvider(e.target.value)}
                      className="w-full bg-[#3c3c3c] border border-[#444] rounded px-3 py-2 text-sm outline-none text-white focus:border-blue-500"
                    >
                      {AI_PROVIDERS.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-6">
                    {AI_PROVIDERS.map(provider => (
                      <div key={provider.id} className="p-3 bg-[#1e1e1e] rounded border border-[#333]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-gray-300 uppercase">{provider.name}</span>
                          {selectedAIProvider === provider.id && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">Active</span>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">API Key</label>
                            <input
                              type="password"
                              value={apiKeys[provider.id]}
                              onChange={e => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                              placeholder={`Enter ${provider.name} API Key`}
                              className="w-full bg-[#2d2d2d] border border-[#444] rounded px-2 py-1.5 text-xs outline-none text-white focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Model</label>
                            <select
                              value={selectedModels[provider.id]}
                              onChange={e => setSelectedModels(prev => ({ ...prev, [provider.id]: e.target.value }))}
                              className="w-full bg-[#2d2d2d] border border-[#444] rounded px-2 py-1.5 text-xs outline-none text-white focus:border-blue-500"
                            >
                              {provider.models.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                            <p className="text-[10px] text-gray-500 mt-1 italic">
                              {provider.models.find(m => m.id === selectedModels[provider.id])?.description}
                            </p>
                          </div>
                          {provider.id === 'ollama' && (
                            <div className="mt-3 pt-3 border-t border-[#333]">
                              <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Ollama URL</label>
                              <input
                                type="text"
                                value={ollamaUrl}
                                onChange={e => setOllamaUrl(e.target.value)}
                                placeholder="http://localhost:11434"
                                className="w-full bg-[#2d2d2d] border border-[#444] rounded px-2 py-1.5 text-xs outline-none text-white focus:border-blue-500"
                              />
                              <p className="text-[10px] text-gray-500 mt-1 italic">
                                Ensure Ollama is running with OLLAMA_ORIGINS="*"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Backend Base Settings */}
              <section>
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Database size={16} /> Backend Connection
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Backend Base</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['none', 'firebase', 'supabase'].map(base => (
                        <button
                          key={base}
                          onClick={() => setBackendBase(base)}
                          className={cn(
                            "py-2 px-3 rounded text-xs font-medium border transition-all",
                            backendBase === base 
                              ? "bg-emerald-900/30 border-emerald-500 text-emerald-400" 
                              : "bg-[#3c3c3c] border-transparent text-gray-400 hover:bg-[#444]"
                          )}
                        >
                          {base.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {backendBase !== 'none' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">{backendBase.toUpperCase()} API Key / URL</label>
                      <input
                        type="text"
                        value={backendApiKey}
                        onChange={e => setBackendApiKey(e.target.value)}
                        placeholder={`Enter ${backendBase} credentials`}
                        className="w-full bg-[#3c3c3c] border border-[#444] rounded px-3 py-2 text-sm outline-none text-white focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-[#333] flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-bold transition-colors shadow-lg"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
