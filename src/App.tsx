import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import AIAssistant from './components/AIAssistant';
import { useFileSystem } from './hooks/useFileSystem';
import { Settings, Code2, LayoutPanelLeft, MessageSquare, Download, Database, Globe, ChevronRight } from 'lucide-react';
import { cn } from './lib/utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { AI_PROVIDERS } from './constants/models';

export default function App() {
  const { files, addFile, updateFile, deleteFile, renameFile } = useFileSystem();
  const [activeFileId, setActiveFileId] = useState<string | null>(files[0]?.id || null);
  
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  
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
    localStorage.setItem('nexus_backend_key', backendApiKey);
  }, [backendApiKey]);

  const activeFile = files.find(f => f.id === activeFileId) || null;

  const exportAsZip = async () => {
    const zip = new JSZip();
    files.forEach(file => {
      zip.file(file.name, file.content);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'nexus-project.zip');
  };

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden">
      {/* Top Bar */}
      <div className="h-10 bg-[#333333] border-b border-[#252526] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="text-blue-500" size={20} />
          <span className="font-semibold tracking-wide text-sm text-gray-200">Nexus IDE</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportAsZip}
            className="p-1.5 rounded hover:bg-[#444] transition-colors flex items-center gap-1 text-xs"
            title="Export as ZIP"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <div className="w-px h-4 bg-gray-600 mx-1" />
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className={cn("p-1.5 rounded hover:bg-[#444] transition-colors", showSidebar && "bg-[#444]")}
            title="Toggle Explorer"
          >
            <LayoutPanelLeft size={16} />
          </button>
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className={cn("p-1.5 rounded hover:bg-[#444] transition-colors", showPreview && "bg-[#444]")}
            title="Toggle Preview"
          >
            <Code2 size={16} />
          </button>
          <button 
            onClick={() => setShowAI(!showAI)}
            className={cn("p-1.5 rounded hover:bg-[#444] transition-colors", showAI && "bg-[#444]")}
            title="Toggle AI Assistant"
          >
            <MessageSquare size={16} />
          </button>
          <div className="w-px h-4 bg-gray-600 mx-2" />
          <button 
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded hover:bg-[#444] transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <Sidebar
            files={files}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onAddFile={addFile}
            onDeleteFile={deleteFile}
            onRenameFile={renameFile}
          />
        )}

        <div className="flex-1 flex overflow-hidden">
          <div className={cn("flex flex-col h-full transition-all duration-300", showPreview ? "w-1/2 border-r border-[#333]" : "w-full")}>
            <Editor
              activeFile={activeFile}
              onChange={updateFile}
            />
          </div>
          
          {showPreview && (
            <div className="w-1/2 h-full">
              <Preview files={files} activeFileId={activeFileId} />
            </div>
          )}
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
