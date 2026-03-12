import React from 'react';
import { X, Settings, Shield, Cpu, Palette, Globe, Zap, Trash2, Download, Smartphone, Layout, Monitor, Github, Cpu as GroqIcon, Brain, Sparkles, ExternalLink } from 'lucide-react';
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
  githubToken?: string;
  onGithubTokenChange?: (token: string) => void;
  githubClientId?: string;
  onGithubClientIdChange?: (id: string) => void;
  githubClientSecret?: string;
  onGithubClientSecretChange?: (secret: string) => void;
  ollamaUrl?: string;
  onOllamaUrlChange?: (url: string) => void;
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
  onModelChange,
  githubToken = '',
  onGithubTokenChange,
  githubClientId = '',
  onGithubClientIdChange,
  githubClientSecret = '',
  onGithubClientSecretChange,
  ollamaUrl = 'http://localhost:11434',
  onOllamaUrlChange
}: SettingsPanelProps) {
  if (!isOpen) return null;

  const providers = [
    { id: 'gemini', name: 'Google Gemini', icon: Zap },
    { id: 'openai', name: 'OpenAI', icon: Cpu },
    { id: 'anthropic', name: 'Anthropic', icon: Shield },
    { id: 'groq', name: 'Groq', icon: GroqIcon },
    { id: 'deepseek', name: 'Deepseek', icon: Brain },
    { id: 'ollama', name: 'Ollama (Local)', icon: Monitor }
  ];

  const models = {
    gemini: ['gemini-2.5-flash', 'gemini-3.1-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini'],
    anthropic: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    groq: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    deepseek: ['deepseek-chat', 'deepseek-coder'],
    ollama: ['llama3', 'mistral', 'codellama', 'phi3']
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-nexus-sidebar border border-nexus-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border bg-nexus-sidebar">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-nexus-accent" />
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Nexus 4.3.5 Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-nexus-bg rounded-xl text-nexus-text-muted hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {/* AI Configuration */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
              <Sparkles size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider">AI Provider Hub</h3>
            </div>
            
            <div className="grid gap-4">
              {providers.map(provider => {
                const isSelected = selectedAIProvider === provider.id;
                const providerModels = models[provider.id as keyof typeof models] || [];
                const isCustomModel = !providerModels.includes(selectedModels[provider.id]);
                
                return (
                  <div key={provider.id} className={cn(
                    "p-4 rounded-xl border transition-all duration-300 group",
                    isSelected ? "bg-nexus-accent/5 border-nexus-accent" : "bg-nexus-bg border-nexus-border hover:border-nexus-accent/30"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          isSelected ? "bg-nexus-accent text-white" : "bg-white/5 text-nexus-text-muted"
                        )}>
                          <provider.icon size={18} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white">{provider.name}</span>
                          {isSelected && <span className="ml-2 text-[10px] bg-nexus-accent/20 text-nexus-accent px-1.5 py-0.5 rounded font-bold uppercase">Active</span>}
                        </div>
                      </div>
                      {!isSelected && (
                        <button
                          onClick={() => onAIProviderChange(provider.id)}
                          className="text-[10px] font-bold px-4 py-1.5 rounded-lg border border-nexus-border text-nexus-text-muted hover:text-white hover:border-nexus-accent transition-all uppercase tracking-widest"
                        >
                          Select
                        </button>
                      )}
                    </div>

                    <div className={cn("grid gap-4 overflow-hidden transition-all duration-300", isSelected ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0")}>
                      {provider.id !== 'ollama' ? (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Secret API Key</label>
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
                      ) : (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Ollama Endpoint</label>
                          <div className="relative">
                            <Monitor size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-text-muted" />
                            <input
                              type="text"
                              placeholder="http://localhost:11434"
                              value={ollamaUrl}
                              onChange={(e) => onOllamaUrlChange?.(e.target.value)}
                              className="w-full bg-nexus-sidebar border border-nexus-border rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-nexus-accent text-white shadow-inner"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Model Intelligence</label>
                        <div className="flex gap-2">
                          <select
                            value={isCustomModel ? 'custom' : (selectedModels[provider.id] || providerModels[0])}
                            onChange={(e) => {
                              if (e.target.value !== 'custom') {
                                onModelChange(provider.id, e.target.value);
                              }
                            }}
                            className="flex-1 bg-nexus-sidebar border border-nexus-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-nexus-accent text-white"
                          >
                            {providerModels.map(model => (
                              <option key={model} value={model}>{model}</option>
                            ))}
                            <option value="custom">Custom Codename...</option>
                          </select>
                          
                          {(isCustomModel || selectedModels[provider.id] === 'custom') && (
                            <input
                              type="text"
                              placeholder="Enter codename"
                              value={selectedModels[provider.id] === 'custom' ? '' : selectedModels[provider.id]}
                              onChange={(e) => onModelChange(provider.id, e.target.value)}
                              className="flex-1 bg-nexus-sidebar border border-nexus-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-nexus-accent text-white"
                              onBlur={(e) => {
                                if (!e.target.value) onModelChange(provider.id, providerModels[0]);
                              }}
                              autoFocus
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* GitHub Integration */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
              <Github size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider">GitHub Integration</h3>
            </div>
            
            <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center justify-between">
                  <span>Personal Access Token (PAT)</span>
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-nexus-accent hover:underline lowercase font-normal tracking-normal flex items-center gap-1">
                    Generate <ExternalLink size={8} />
                  </a>
                </label>
                <div className="relative">
                  <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-text-muted" />
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => onGithubTokenChange?.(e.target.value)}
                    className="w-full bg-nexus-sidebar border border-nexus-border rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-nexus-accent text-white shadow-inner font-mono"
                  />
                </div>
                <p className="text-[9px] text-nexus-text-muted italic leading-relaxed">
                  Recommended for AI to read/write repositories. Use a token with <b>repo</b> and <b>gist</b> scopes.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-nexus-border/50">
                <div className="flex items-center gap-2 text-white/70">
                  <Globe size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">OAuth App Configuration</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Client ID</label>
                    <input
                      type="text"
                      placeholder="Ov23li..."
                      value={githubClientId}
                      onChange={(e) => onGithubClientIdChange?.(e.target.value)}
                      className="w-full bg-nexus-sidebar border border-nexus-border rounded-xl px-4 py-2 text-[10px] outline-none focus:border-nexus-accent text-white font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Client Secret</label>
                    <input
                      type="password"
                      placeholder="6f7439..."
                      value={githubClientSecret}
                      onChange={(e) => onGithubClientSecretChange?.(e.target.value)}
                      className="w-full bg-nexus-sidebar border border-nexus-border rounded-xl px-4 py-2 text-[10px] outline-none focus:border-nexus-accent text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => window.location.href = '/api/auth/github/url'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#24292e] hover:bg-[#2f363d] text-white rounded-xl text-xs font-bold transition-all shadow-md group"
                >
                  <Github size={16} className="group-hover:scale-110 transition-transform" />
                  Connect with GitHub OAuth
                </button>
                <p className="text-[9px] text-center text-nexus-text-muted mt-2">
                  Connect your GitHub account in seconds for easy repo management.
                </p>
              </div>
            </div>
          </section>

          {/* Interface & Touch */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
              <Smartphone size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Device & Interface</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Touch Mode</span>
                  <button
                    onClick={onToggleTouchMode}
                    className={cn(
                      "w-10 h-5 rounded-full transition-all relative",
                      isTouchMode ? "bg-nexus-accent" : "bg-nexus-sidebar border border-nexus-border"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-3 h-3 rounded-full transition-all",
                      isTouchMode ? "right-0.5 bg-white" : "left-0.5 bg-nexus-text-muted"
                    )} />
                  </button>
                </div>
                <p className="text-[10px] text-nexus-text-muted leading-relaxed">
                  Enables a mobile-optimized UI with navigation drawer and larger interactive elements.
                </p>
              </div>

              <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Responsive UI</span>
                  <Layout size={14} className="text-nexus-accent" />
                </div>
                <p className="text-[10px] text-nexus-text-muted leading-relaxed">
                  Automatically adapts layout for Portrait and Landscape orientations.
                </p>
              </div>
            </div>
          </section>

          {/* Workspace Management */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
              <Layout size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Workspace Control</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={onExport}
                className="flex items-center justify-center gap-2 p-4 bg-nexus-bg hover:bg-nexus-bg/80 rounded-xl border border-nexus-border transition-all group shadow-sm hover:shadow-md"
              >
                <Download size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Backup ZIP</span>
              </button>
              <button
                onClick={onClearWorkspace}
                className="flex items-center justify-center gap-2 p-4 bg-red-900/10 hover:bg-red-900/20 rounded-xl border border-red-500/20 transition-all group shadow-sm hover:shadow-md"
              >
                <Trash2 size={18} className="text-red-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Nuke Files</span>
              </button>
            </div>
          </section>
        </div>

        <div className="p-6 bg-nexus-bg border-t border-nexus-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-nexus-accent animate-pulse" />
            <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Nexus IDE v4.3.5 Stable</span>
          </div>
          <button
            onClick={onClose}
            className="bg-nexus-accent hover:bg-nexus-accent/80 text-white px-8 py-2.5 rounded-xl text-[10px] font-bold shadow-lg shadow-nexus-accent/20 transition-all uppercase tracking-widest active:scale-95"
          >
            Save & Exit
          </button>
        </div>
      </div>
    </div>
  );
}
