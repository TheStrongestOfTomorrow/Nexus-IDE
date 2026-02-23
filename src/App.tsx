import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import AIAssistant from './components/AIAssistant';
import ActivityBar, { ActivityType } from './components/ActivityBar';
import StatusBar from './components/StatusBar';
import GithubView from './components/GithubView';
import ExtensionsView from './components/ExtensionsView';
import Terminal from './components/Terminal';
import { socketService } from './services/socketService';
import { useFileSystem } from './hooks/useFileSystem';
import { Settings, Code2, LayoutPanelLeft, MessageSquare, Download, Database, Globe, ChevronRight, X } from 'lucide-react';
import { cn } from './lib/utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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
      anthropic: 'claude-sonnet-4-6'
    };
  });

  const [backendBase, setBackendBase] = useState(() => {
    return localStorage.getItem('nexus_backend_base') || 'none';
  });

  const [backendApiKey, setBackendApiKey] = useState(() => {
    return localStorage.getItem('nexus_backend_key') || '';
  });

  const [showSettings, setShowSettings] = useState(false);

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

  const handleAddExtension = (url: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const name = url.split('/').pop() || 'New Extension';
    setExtensions(prev => [...prev, { id, name, url, enabled: true, description: 'External script extension' }]);
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
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateFile = (id: string, content: string, fromRemote = false) => {
    updateFile(id, content);
    if (!fromRemote) {
      socketService.send({ type: 'collab', fileId: id, content });
    }
  };

  const activeFile = files.find(f => f.id === activeFileId) || null;

  const handleSelectFile = (id: string) => {
    setActiveFileId(id);
    if (!openFileIds.includes(id)) {
      setOpenFileIds(prev => [...prev, id]);
    }
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

  const exportAsZip = async () => {
    const zip = new JSZip();
    files.forEach(file => {
      zip.file(file.name, file.content);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'nexus-project.zip');
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

  const handleClearWorkspace = () => {
    if (confirm('Are you sure you want to delete all files in the current workspace?')) {
      files.forEach(f => deleteFile(f.id));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden select-none">
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
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs Bar */}
          <div className="h-9 bg-[#252526] flex items-center overflow-x-auto no-scrollbar border-b border-[#1e1e1e]">
            {openFileIds.map(id => {
              const file = files.find(f => f.id === id);
              if (!file) return null;
              return (
                <div
                  key={id}
                  onClick={() => setActiveFileId(id)}
                  className={cn(
                    "h-full flex items-center px-3 gap-2 border-r border-[#1e1e1e] cursor-pointer text-xs min-w-[120px] max-w-[200px] transition-colors group",
                    activeFileId === id ? "bg-[#1e1e1e] text-white" : "bg-[#2d2d2d] text-gray-500 hover:bg-[#2a2d2e]"
                  )}
                >
                  <span className="truncate flex-1">{file.name}</span>
                  <button 
                    onClick={(e) => closeFile(e, id)}
                    className="p-0.5 rounded hover:bg-[#454545] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className={cn("flex flex-col h-full transition-all duration-300", showPreview ? "w-1/2 border-r border-[#333]" : "w-full")}>
              <Editor
                activeFile={activeFile}
                onChange={(id, content) => handleUpdateFile(id, content)}
              />
            </div>
            
            {showPreview && (
              <div className="w-1/2 h-full">
                <Preview files={files} activeFileId={activeFileId} />
              </div>
            )}
          </div>

          {showTerminal && (
            <Terminal onClose={() => setShowTerminal(false)} />
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
          />
        )}
      </div>

      <StatusBar activeFile={activeFile} githubUser={githubUser} />

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
