import React from 'react';
import { X, Settings, Shield, Cpu, Palette, Globe, Zap, Trash2, Download, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: Record<string, string>;
  onApiKeyChange: (provider: string, key: string) => void;
  isTouchMode: boolean;
  onToggleTouchMode: () => void;
  onClearWorkspace: () => void;
  onExport: () => void;
  selectedAIProvider: string;
  onAIProviderChange: (provider: string) => void;
  selectedModels: Record<string, string>;
  onModelChange: (provider: string, model: string) => void;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  apiKeys,
  onApiKeyChange,
  isTouchMode,
  onToggleTouchMode,
  onClearWorkspace,
  onExport,
  selectedAIProvider,
  onAIProviderChange,
  selectedModels,
  onModelChange
}: SettingsPanelProps) {
  if (!isOpen) return null;

  const providers = [
    { id: 'gemini', name: 'Google Gemini', icon: Zap },
    { id: 'openai', name: 'OpenAI', icon: Cpu },
    { id: 'anthropic', name: 'Anthropic', icon: Shield }
  ];

  const models = {
    gemini: [
      'gemini-2.5-flash', 
      'gemini-3.1-pro-preview', 
      'gemini-3-flash-preview',
      'gemini-2.5-flash-lite-latest',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro-vision'
    ],
    openai: [
      'gpt-4o', 
      'gpt-4o-mini', 
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'o1-preview',
      'o1-mini'
    ],
    anthropic: [
      'claude-3-5-sonnet-20240620', 
      'claude-3-opus-20240229', 
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-instant-1.2'
    ]
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-nexus-sidebar border border-nexus-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border bg-nexus-sidebar">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-nexus-accent" />
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Nexus 4.1 Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-nexus-bg rounded-xl text-nexus-text-muted hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {/* AI Configuration */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-nexus-accent">
              <Cpu size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider">AI Configuration</h3>
            </div>
            
            <div className="space-y-6">
              {providers.map(provider => {
                const isCustomModel = !models[provider.id as keyof typeof models].includes(selectedModels[provider.id]);
                
                return (
                  <div key={provider.id} className="p-4 bg-nexus-bg rounded-xl border border-nexus-border space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <provider.icon size={18} className="text-nexus-text-muted" />
                        <span className="text-xs font-bold text-white">{provider.name}</span>
                      </div>
                      <button
                        onClick={() => onAIProviderChange(provider.id)}
                        className={cn(
                          "text-[10px] font-bold px-3 py-1 rounded-full border transition-all",
                          selectedAIProvider === provider.id 
                            ? "bg-nexus-accent border-nexus-accent text-white" 
                            : "border-nexus-border text-nexus-text-muted hover:text-white"
                        )}
                      >
                        {selectedAIProvider === provider.id ? 'ACTIVE' : 'SELECT'}
                      </button>
                    </div>

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">API Key</label>
                        <div className="relative">
                          <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-text-muted" />
                          <input
                            type="password"
                            placeholder={`Enter ${provider.name} API Key`}
                            value={apiKeys[provider.id] || ''}
                            onChange={(e) => onApiKeyChange(provider.id, e.target.value)}
                            className="w-full bg-nexus-sidebar border border-nexus-border rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-nexus-accent text-white shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Model Selection</label>
                        <div className="flex gap-2">
                          <select
                            value={isCustomModel ? 'custom' : selectedModels[provider.id]}
                            onChange={(e) => {
                              if (e.target.value !== 'custom') {
                                onModelChange(provider.id, e.target.value);
                              }
                            }}
                            className="flex-1 bg-nexus-sidebar border border-nexus-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-nexus-accent text-white"
                          >
                            {models[provider.id as keyof typeof models].map(model => (
                              <option key={model} value={model}>{model}</option>
                            ))}
                            <option value="custom">Custom Model...</option>
                          </select>
                          
                          {(isCustomModel || selectedModels[provider.id] === 'custom') && (
                            <input
                              type="text"
                              placeholder="Enter model codename"
                              value={selectedModels[provider.id] === 'custom' ? '' : selectedModels[provider.id]}
                              onChange={(e) => onModelChange(provider.id, e.target.value)}
                              className="flex-1 bg-nexus-sidebar border border-nexus-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-nexus-accent text-white animate-in slide-in-from-right-2 duration-200"
                              autoFocus
                            />
                          )}
                        </div>
                        <p className="text-[9px] text-nexus-text-muted italic">
                          {isCustomModel ? 'Using custom model codename.' : 'Select a preset or enter a custom codename.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Interface */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-nexus-accent">
              <Palette size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Interface</h3>
            </div>
            <div className="flex items-center justify-between p-4 bg-nexus-bg rounded-xl border border-nexus-border">
              <div className="flex items-center gap-3">
                <Smartphone size={18} className="text-nexus-text-muted" />
                <div>
                  <p className="text-xs font-bold text-white">Touch Optimized Mode</p>
                  <p className="text-[10px] text-nexus-text-muted">Larger targets and simplified UI for mobile/tablets.</p>
                </div>
              </div>
              <button
                onClick={onToggleTouchMode}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  isTouchMode ? "bg-nexus-accent" : "bg-nexus-sidebar border border-nexus-border"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full transition-all",
                  isTouchMode ? "right-1 bg-white" : "left-1 bg-nexus-text-muted"
                )} />
              </button>
            </div>
          </section>

          {/* Workspace Management */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-nexus-accent">
              <Zap size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Workspace</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={onExport}
                className="flex items-center justify-center gap-2 p-4 bg-nexus-bg hover:bg-nexus-bg/80 rounded-xl border border-nexus-border transition-all group"
              >
                <Download size={18} className="text-nexus-accent group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">EXPORT ZIP</span>
              </button>
              <button
                onClick={onClearWorkspace}
                className="flex items-center justify-center gap-2 p-4 bg-red-900/10 hover:bg-red-900/20 rounded-xl border border-red-500/20 transition-all group"
              >
                <Trash2 size={18} className="text-red-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-red-400">WIPE ALL</span>
              </button>
            </div>
          </section>
        </div>

        <div className="p-6 bg-nexus-bg border-t border-nexus-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-nexus-accent animate-pulse" />
            <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Nexus IDE v4.1.0 Stable</span>
          </div>
          <button
            onClick={onClose}
            className="bg-nexus-accent hover:bg-nexus-accent/80 text-white px-8 py-2 rounded-xl text-xs font-bold shadow-lg shadow-nexus-accent/20 transition-all uppercase tracking-widest"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
