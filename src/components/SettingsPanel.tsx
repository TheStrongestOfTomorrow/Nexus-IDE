import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, Cpu, Palette, Globe, Zap, Trash2, Download, Smartphone, Layout, Monitor, Github, Brain, Sparkles, ExternalLink, HardDrive, Undo2, RotateCcw, Plane, WifiOff, Save, RotateCw, Database, Lock, Code2, Terminal, Wifi, Users } from 'lucide-react';
import { cn } from '../lib/utils';

type UIMode = 'legacy' | 'beginner' | 'vscode';

type SettingsSection = 'general' | 'editor' | 'theme' | 'ai' | 'terminal' | 'network' | 'collab' | 'mobile' | 'storage';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: Record<string, string>;
  onApiKeyChange: (provider: string, key: string) => void;
  isTouchMode: boolean;
  onToggleTouchMode: () => void;
  uiMode: UIMode;
  onUiModeChange: (mode: UIMode) => void;
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
  isOffline?: boolean;
  isFullLock?: boolean;
  airplaneModeEnabled?: boolean;
  onToggleAirplaneMode?: () => void;
  onToggleFullLock?: () => void;
  lastOnlineCheck?: string;
  sessionSavedAt?: string;
  // Editor settings (v5.2.0)
  editorSettings?: {
    showMinimap: boolean;
    wordWrap: boolean;
    fontSize: number;
    fontFamily: string;
    tabSize: number;
  };
  onEditorSettingsChange?: (settings: {
    showMinimap: boolean;
    wordWrap: boolean;
    fontSize: number;
    fontFamily: string;
    tabSize: number;
  }) => void;
}

const settingsCategories: { id: SettingsSection; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'editor', label: 'Editor', icon: Code2 },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'network', label: 'Network', icon: Wifi },
  { id: 'collab', label: 'Collab', icon: Users },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
  { id: 'storage', label: 'Storage', icon: HardDrive },
];

function ToggleButton({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-10 h-5 rounded-full transition-all relative flex-shrink-0",
        enabled ? "bg-nexus-accent" : "bg-nexus-sidebar border border-nexus-border"
      )}
    >
      <div className={cn(
        "absolute top-0.5 w-4 h-4 rounded-full transition-all",
        enabled ? "right-0.5 bg-white" : "left-0.5 bg-nexus-text-muted"
      )} />
    </button>
  );
}

export default function SettingsPanel({
  isOpen,
  onClose,
  apiKeys,
  onApiKeyChange,
  isTouchMode,
  onToggleTouchMode,
  uiMode,
  onUiModeChange,
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
  onOllamaUrlChange,
  isOffline = false,
  isFullLock = false,
  airplaneModeEnabled = false,
  onToggleAirplaneMode,
  onToggleFullLock,
  lastOnlineCheck,
  sessionSavedAt,
  editorSettings: externalEditorSettings,
  onEditorSettingsChange,
}: SettingsPanelProps) {
  // Active sidebar section
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  // Local editor settings state with localStorage persistence
  const EDITOR_SETTINGS_KEY = 'nexus_editor_settings_v2';
  const [editorSettings, setEditorSettings] = useState(() => {
    if (externalEditorSettings) return externalEditorSettings;
    try {
      const saved = localStorage.getItem(EDITOR_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      showMinimap: true,
      wordWrap: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', monospace",
      tabSize: 2,
    };
  });

  // Terminal VM settings (localStorage-backed)
  const [vmRam, setVmRam] = useState(() => localStorage.getItem('nexus_vm_ram') || '128');
  const [vmDisk, setVmDisk] = useState(() => localStorage.getItem('nexus_vm_disk') || '64');
  const [vmNetworkRelay, setVmNetworkRelay] = useState(() => localStorage.getItem('nexus_vm_network_relay') || '');
  const [vmBootOnStart, setVmBootOnStart] = useState(() => localStorage.getItem('nexus_vm_boot_on_start') === 'true');

  // Collab settings (localStorage-backed)
  const [collabPasswordEnabled, setCollabPasswordEnabled] = useState(() => localStorage.getItem('nexus_collab_password_enabled') === 'true');
  const [collabTimeout, setCollabTimeout] = useState(() => localStorage.getItem('nexus_collab_timeout') || '30');
  const [collabMaxParticipants, setCollabMaxParticipants] = useState(() => localStorage.getItem('nexus_collab_max_participants') || '4');

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(editorSettings));
    onEditorSettingsChange?.(editorSettings);
  }, [editorSettings, onEditorSettingsChange]);

  useEffect(() => { localStorage.setItem('nexus_vm_ram', vmRam); }, [vmRam]);
  useEffect(() => { localStorage.setItem('nexus_vm_disk', vmDisk); }, [vmDisk]);
  useEffect(() => { localStorage.setItem('nexus_vm_network_relay', vmNetworkRelay); }, [vmNetworkRelay]);
  useEffect(() => { localStorage.setItem('nexus_vm_boot_on_start', String(vmBootOnStart)); }, [vmBootOnStart]);
  useEffect(() => { localStorage.setItem('nexus_collab_password_enabled', String(collabPasswordEnabled)); }, [collabPasswordEnabled]);
  useEffect(() => { localStorage.setItem('nexus_collab_timeout', collabTimeout); }, [collabTimeout]);
  useEffect(() => { localStorage.setItem('nexus_collab_max_participants', collabMaxParticipants); }, [collabMaxParticipants]);

  if (!isOpen) return null;

  const providers = [
    { id: 'gemini', name: 'Google Gemini', icon: Zap },
    { id: 'openai', name: 'OpenAI', icon: Cpu },
    { id: 'anthropic', name: 'Anthropic Claude', icon: Shield },
    { id: 'xai', name: 'xAI (Grok)', icon: Sparkles },
    { id: 'mistral', name: 'Mistral AI', icon: Brain },
    { id: 'deepseek', name: 'DeepSeek', icon: Brain },
    { id: 'alibaba', name: 'Alibaba Qwen', icon: Cpu },
    { id: 'groq', name: 'Groq (Fast)', icon: Zap },
    { id: 'cohere', name: 'Cohere', icon: Shield },
    { id: 'perplexity', name: 'Perplexity AI', icon: Globe },
    { id: 'together', name: 'Together AI', icon: Cpu },
    { id: 'ollama', name: 'Ollama (Local)', icon: Monitor },
  ];

  const models: Record<string, string[]> = {
    gemini: ['gemini-2.5-pro-preview-06-05', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini', 'o3-mini'],
    anthropic: ['claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    xai: ['grok-3', 'grok-3-fast', 'grok-3-mini', 'grok-2-1212', 'grok-2-vision-1212', 'grok-beta'],
    mistral: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'codestral-latest', 'pixtral-large-latest', 'ministral-8b-latest'],
    deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner', 'deepseek-r1'],
    alibaba: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long', 'qwen-coder-plus', 'qwen-coder-turbo', 'qwen-vl-max'],
    groq: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it', 'deepseek-r1-distill-llama-70b'],
    cohere: ['command-r-plus-08-2024', 'command-r-08-2024', 'command', 'command-light', 'command-nightly'],
    perplexity: ['sonar-pro', 'sonar', 'sonar-reasoning-pro', 'sonar-reasoning', 'r1-1776'],
    together: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo', 'mistralai/Mistral-Small-24B-Instruct-2501', 'Qwen/Qwen2.5-72B-Instruct-Turbo', 'deepseek-ai/DEEPSEEK-R1'],
    ollama: ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'codellama', 'deepseek-coder-v2', 'qwen2.5-coder', 'phi4', 'gemma3'],
  };

  const uiModeOptions: { mode: UIMode; icon: typeof RotateCcw; title: string; description: string; activeBorderColor: string; activeIconBg: string }[] = [
    {
      mode: 'legacy',
      icon: RotateCcw,
      title: 'Legacy UI',
      description: 'The original Nexus IDE interface with the dark activity bar, compact sidebar panels, and power-user shortcuts. All beta features including VibeGraph, Minecraft Bridge, WebContainer, AI Assistant, and more are fully accessible.',
      activeBorderColor: 'border-l-nexus-accent',
      activeIconBg: 'bg-nexus-accent text-white',
    },
    {
      mode: 'beginner',
      icon: Sparkles,
      title: 'Beginner Friendly UI',
      description: 'A clean, tabbed interface with labeled navigation, contextual hints, and guided workflows. Features are organized into tabs: Files, Code, AI, Run, Tools, and Workspace. Switch to Legacy anytime from settings.',
      activeBorderColor: 'border-l-nexus-accent',
      activeIconBg: 'bg-nexus-accent text-white',
    },
    {
      mode: 'vscode',
      icon: Monitor,
      title: 'VS Code Style UI',
      description: 'A full VS Code-inspired layout with the blue activity bar, file tab strip, integrated terminal panel, blue status bar, and VS Code keyboard shortcuts. Every Nexus feature is available in a familiar VS Code environment.',
      activeBorderColor: 'border-l-blue-500',
      activeIconBg: 'bg-blue-500 text-white',
    },
  ];

  // ─── Section: General ──────────────────────────────────────
  const renderGeneral = () => (
    <section className="space-y-6">
      {/* UI Mode Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
          <Layout size={18} />
          <h3 className="text-xs font-bold uppercase tracking-wider">Interface Mode</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {uiModeOptions.map(({ mode, icon: Icon, title, description, activeBorderColor, activeIconBg }) => {
            const isActive = uiMode === mode;
            return (
              <div
                key={mode}
                className={cn(
                  "p-4 rounded-xl border border-l-4 transition-all cursor-pointer",
                  isActive
                    ? cn("bg-nexus-accent/5 border-nexus-accent shadow-lg shadow-nexus-accent/5", activeBorderColor)
                    : "bg-nexus-bg border-nexus-border hover:border-nexus-accent/30 border-l-nexus-border"
                )}
                onClick={() => onUiModeChange(mode)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      isActive ? activeIconBg : "bg-white/5 text-nexus-text-muted"
                    )}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white">{title}</span>
                      {isActive && <span className="ml-2 text-[9px] bg-nexus-accent/20 text-nexus-accent px-1.5 py-0.5 rounded-full font-bold uppercase">Active</span>}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-nexus-text-muted leading-relaxed">
                  {description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* GitHub Integration */}
      <div className="space-y-4">
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
      </div>
    </section>
  );

  // ─── Section: Editor ──────────────────────────────────────
  const renderEditor = () => (
    <section className="space-y-6">
      <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
        <Code2 size={18} />
        <h3 className="text-xs font-bold uppercase tracking-wider">Editor Settings</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Minimap Toggle */}
        <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Minimap</span>
            <ToggleButton enabled={editorSettings.showMinimap} onToggle={() => setEditorSettings(prev => ({ ...prev, showMinimap: !prev.showMinimap }))} />
          </div>
          <p className="text-[10px] text-nexus-text-muted leading-relaxed">
            Show a minimap on the right side of the editor for quick file navigation.
          </p>
        </div>

        {/* Word Wrap Toggle */}
        <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Word Wrap</span>
            <ToggleButton enabled={editorSettings.wordWrap} onToggle={() => setEditorSettings(prev => ({ ...prev, wordWrap: !prev.wordWrap }))} />
          </div>
          <p className="text-[10px] text-nexus-text-muted leading-relaxed">
            Wrap long lines so they stay within the editor viewport.
          </p>
        </div>
      </div>

      {/* Font Size Slider */}
      <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white">Font Size</span>
            <span className="ml-2 text-[10px] text-nexus-text-muted">
              {editorSettings.fontSize}px
            </span>
          </div>
        </div>
        <input
          type="range"
          min={10}
          max={32}
          step={1}
          value={editorSettings.fontSize}
          onChange={(e) => setEditorSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
          className="w-full h-1.5 bg-nexus-sidebar rounded-full appearance-none cursor-pointer accent-nexus-accent"
        />
        <div className="flex justify-between text-[9px] text-nexus-text-muted">
          <span>10px</span>
          <span>32px</span>
        </div>
      </div>

      {/* Font Family Input */}
      <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border space-y-2">
        <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">
          Font Family
        </label>
        <input
          type="text"
          value={editorSettings.fontFamily}
          onChange={(e) => setEditorSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
          className="w-full bg-nexus-sidebar border border-nexus-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-nexus-accent text-white font-mono"
        />
        <p className="text-[9px] text-nexus-text-muted italic">
          Default: &apos;JetBrains Mono&apos;, monospace
        </p>
      </div>

      {/* Tab Size */}
      <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border space-y-2">
        <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">
          Tab Size
        </label>
        <div className="flex gap-2">
          {[2, 4].map(size => (
            <button
              key={size}
              onClick={() => setEditorSettings(prev => ({ ...prev, tabSize: size }))}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-bold transition-all border",
                editorSettings.tabSize === size
                  ? "bg-nexus-accent border-nexus-accent text-white"
                  : "bg-nexus-sidebar border-nexus-border text-nexus-text-muted hover:text-white hover:border-nexus-accent/30"
              )}
            >
              {size} spaces
            </button>
          ))}
        </div>
      </div>

      {/* Auto Save Info */}
      <div className="p-3 bg-nexus-bg rounded-xl border border-nexus-border">
        <div className="flex items-center gap-2 mb-1">
          <Save size={12} className="text-emerald-400" />
          <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Auto Save</span>
        </div>
        <p className="text-[9px] text-nexus-text-muted leading-relaxed">
          Workspace auto-saves every <b className="text-white">30 seconds</b> to IndexedDB. Editor settings are saved immediately on change.
        </p>
      </div>
    </section>
  );

  // ─── Section: Theme ───────────────────────────────────────
  const renderTheme = () => (
    <section className="space-y-6">
      <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
        <Palette size={18} />
        <h3 className="text-xs font-bold uppercase tracking-wider">Theme & Appearance</h3>
      </div>

      <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-nexus-accent/10 border border-nexus-accent/20 flex items-center justify-center flex-shrink-0">
            <Palette size={20} className="text-nexus-accent" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Dark Theme (Default)</p>
            <p className="text-[10px] text-nexus-text-muted leading-relaxed mt-1">
              Nexus IDE ships with a carefully crafted dark theme optimized for long coding sessions. The color palette 
              uses deep blacks and subtle accents to reduce eye strain while maintaining excellent code readability.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-nexus-border space-y-2">
            <div className="w-full h-6 rounded bg-nexus-bg" />
            <span className="text-[9px] text-nexus-text-muted block text-center">Background</span>
          </div>
          <div className="p-3 rounded-lg border border-nexus-border space-y-2">
            <div className="w-full h-6 rounded bg-nexus-sidebar" />
            <span className="text-[9px] text-nexus-text-muted block text-center">Sidebar</span>
          </div>
          <div className="p-3 rounded-lg border border-nexus-border space-y-2">
            <div className="w-full h-6 rounded bg-nexus-accent" />
            <span className="text-[9px] text-nexus-text-muted block text-center">Accent</span>
          </div>
        </div>

        <div className="p-2 bg-nexus-sidebar rounded-lg border border-nexus-border">
          <p className="text-[9px] text-nexus-text-muted leading-relaxed flex items-center gap-2">
            <Sparkles size={10} className="text-nexus-accent" />
            Custom theme support with light mode and user-defined color schemes is planned for a future release.
          </p>
        </div>
      </div>
    </section>
  );

  // ─── Section: AI ──────────────────────────────────────────
  const renderAI = () => (
    <section className="space-y-6">
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
                      <option value="custom">Custom Model ID...</option>
                    </select>

                    {(isCustomModel || selectedModels[provider.id] === 'custom') && (
                      <input
                        type="text"
                        placeholder="Enter model id"
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
  );

  // ─── Section: Terminal ────────────────────────────────────
  const renderTerminal = () => (
    <section className="space-y-6">
      <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
        <Terminal size={18} />
        <h3 className="text-xs font-bold uppercase tracking-wider">Terminal & VM Settings</h3>
      </div>

      {/* VM Configuration */}
      <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Monitor size={14} className="text-emerald-400" />
          <span className="text-xs font-bold text-white">v86 Virtual Machine</span>
          <span className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">New in v5.5.0</span>
        </div>

        <div className="flex items-start gap-3">
          <Monitor size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-white">Alpine Linux in Your Browser</p>
            <p className="text-[10px] text-nexus-text-muted leading-relaxed mt-1">
              Nexus IDE runs a real Alpine Linux distro entirely inside your browser using the v86 x86 emulator.
              No server, no VM, no downloads — just pure WebAssembly-powered x86 emulation. Your Linux filesystem
              persists in IndexedDB and survives page refreshes and browser restarts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-nexus-border/50">
          {/* RAM Allocation */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-1">
              <Cpu size={12} className="text-blue-400" />
              RAM Allocation
            </label>
            <select
              value={vmRam}
              onChange={(e) => setVmRam(e.target.value)}
              className="w-full bg-nexus-sidebar border border-nexus-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-nexus-accent text-white"
            >
              <option value="64">64 MB</option>
              <option value="128">128 MB</option>
              <option value="256">256 MB</option>
              <option value="512">512 MB</option>
            </select>
            <p className="text-[9px] text-nexus-text-muted">Memory allocated to the v86 virtual machine.</p>
          </div>

          {/* Disk Size */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-1">
              <Database size={12} className="text-emerald-400" />
              Disk Size
            </label>
            <select
              value={vmDisk}
              onChange={(e) => setVmDisk(e.target.value)}
              className="w-full bg-nexus-sidebar border border-nexus-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-nexus-accent text-white"
            >
              <option value="64">64 MB</option>
              <option value="128">128 MB</option>
              <option value="256">256 MB</option>
            </select>
            <p className="text-[9px] text-nexus-text-muted">Virtual disk size for the Linux filesystem.</p>
          </div>
        </div>

        {/* Network Relay URL */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-1">
            <Globe size={12} className="text-cyan-400" />
            Network Relay URL
          </label>
          <input
            type="text"
            placeholder="wss://relay.example.com (optional)"
            value={vmNetworkRelay}
            onChange={(e) => setVmNetworkRelay(e.target.value)}
            className="w-full bg-nexus-sidebar border border-nexus-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-nexus-accent text-white"
          />
          <p className="text-[9px] text-nexus-text-muted">WebSocket relay for VM network access. Leave empty for offline-only mode.</p>
        </div>

        {/* Boot on Start + Linux User Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-nexus-sidebar rounded-lg border border-nexus-border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white">Boot on Start</span>
              <p className="text-[9px] text-nexus-text-muted mt-0.5">Auto-start the Linux VM when IDE loads.</p>
            </div>
            <ToggleButton enabled={vmBootOnStart} onToggle={() => setVmBootOnStart(prev => !prev)} />
          </div>

          <div className="p-3 bg-nexus-sidebar rounded-lg border border-nexus-border">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={12} className="text-amber-400" />
              <span className="text-xs font-bold text-white">Linux User Mode</span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[
                { label: 'Root', desc: 'Full access' },
                { label: 'User+Sudo', desc: 'Elevated' },
                { label: 'User-only', desc: 'Restricted' },
              ].map(mode => (
                <div
                  key={mode.label}
                  className="flex-1 p-2 rounded-lg bg-nexus-bg border border-nexus-border text-center"
                >
                  <span className="text-[9px] font-bold text-white block">{mode.label}</span>
                  <span className="text-[8px] text-nexus-text-muted">{mode.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-nexus-text-muted mt-2">The VM currently runs as <b className="text-white">Root</b>. User mode restrictions are planned.</p>
          </div>
        </div>
      </div>

      {/* How to Use */}
      <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border space-y-4">
        <div className="p-3 bg-nexus-sidebar rounded-lg border border-nexus-border">
          <div className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest mb-2">How to Use</div>
          <ol className="text-[9px] text-nexus-text-muted space-y-1 list-decimal ml-3">
            <li>Click the <b className="text-white">Monitor</b> icon in the activity bar (or say &quot;linux&quot; via voice)</li>
            <li>Click <b className="text-emerald-400">[Boot Linux]</b> — the Alpine disk image will download from CDN on first boot</li>
            <li>Use the terminal to run <b className="text-white">bash, apk, git, python3, node</b> and more</li>
            <li>Click <b className="text-cyan-400">[Push Files]</b> to send workspace files to Alpine</li>
            <li>Click <b className="text-purple-400">[Pull Files]</b> to import files from Alpine to your workspace</li>
          </ol>
        </div>

        <div className="p-2 bg-amber-900/10 rounded-lg border border-amber-500/10 flex items-start gap-2">
          <Zap size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[9px] text-amber-400/80 leading-relaxed">
            Optional: Install <b>noVNC</b> inside Alpine for a full GUI desktop, or <b>Wine</b> to run Windows .exe binaries.
            These are user-installed packages, not bundled by Nexus IDE.
          </p>
        </div>
      </div>
    </section>
  );

  // ─── Section: Network ─────────────────────────────────────
  const renderNetwork = () => (
    <section className="space-y-6">
      <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
        <Wifi size={18} />
        <h3 className="text-xs font-bold uppercase tracking-wider">Network & Connectivity</h3>
      </div>

      <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border space-y-4">
        <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
          <Plane size={18} />
          <h3 className="text-xs font-bold uppercase tracking-wider">Airplane Mode</h3>
          <span className={cn(
            "ml-auto text-[9px] px-2 py-0.5 rounded-full font-bold uppercase",
            isOffline ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
          )}>
            {isOffline ? 'Offline' : 'Online'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <WifiOff size={14} className="text-blue-400" />
              Airplane Mode
            </div>
            <p className="text-[10px] text-nexus-text-muted mt-1 leading-relaxed">
              Disables all internet-reliant features. Editor, terminal, and local files still work offline.
            </p>
          </div>
          <ToggleButton
            enabled={airplaneModeEnabled}
            onToggle={onToggleAirplaneMode || (() => {})}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Lock size={14} className="text-amber-400" />
              Full Lock
            </div>
            <p className="text-[10px] text-nexus-text-muted mt-1 leading-relaxed">
              When offline: internet features are locked and cannot be opened until connection is restored.
            </p>
          </div>
          <ToggleButton enabled={isFullLock} onToggle={onToggleFullLock || (() => {})} />
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Feature Status</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Code Editor', online: true },
              { name: 'File Manager', online: true },
              { name: 'Terminal', online: true },
              { name: 'AI (Local)', online: true },
              { name: 'Collaboration', online: false },
              { name: 'Minecraft Bridge', online: false },
              { name: 'Cloud AI', online: false },
              { name: 'GitHub Push', online: false },
            ].map(({ name, online }) => (
              <div key={name} className="flex items-center gap-2 text-[10px]">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isOffline && !online ? "bg-red-400" : "bg-emerald-400"
                )} />
                <span className={isOffline && !online ? "text-red-400/70" : "text-nexus-text-muted"}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {lastOnlineCheck && (
          <div className="text-[9px] text-nexus-text-muted flex items-center gap-1">
            <RotateCw size={9} />
            Last checked: {lastOnlineCheck}
          </div>
        )}
      </div>
    </section>
  );

  // ─── Section: Collab ──────────────────────────────────────
  const renderCollab = () => (
    <section className="space-y-6">
      <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
        <Users size={18} />
        <h3 className="text-xs font-bold uppercase tracking-wider">Collaboration</h3>
        <span className="ml-auto text-[9px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-bold uppercase">New in v5.5.0</span>
      </div>

      <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border space-y-4">
        <div className="flex items-start gap-3">
          <Users size={16} className="text-violet-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-white">Real-time Collaboration</p>
            <p className="text-[10px] text-nexus-text-muted leading-relaxed mt-1">
              Configure collaboration sessions for pair programming, code review, and team development. 
              Participants can edit files, use the terminal, and chat in real-time.
            </p>
          </div>
        </div>

        {/* Password-Protected Sessions */}
        <div className="p-3 bg-nexus-sidebar rounded-lg border border-nexus-border flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Lock size={14} className="text-violet-400" />
              Password-Protected Sessions
            </span>
            <p className="text-[9px] text-nexus-text-muted mt-0.5">Require a password for participants to join sessions.</p>
          </div>
          <ToggleButton enabled={collabPasswordEnabled} onToggle={() => setCollabPasswordEnabled(prev => !prev)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Session Timeout */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-1">
              <RotateCw size={12} className="text-blue-400" />
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={480}
              value={collabTimeout}
              onChange={(e) => setCollabTimeout(e.target.value)}
              className="w-full bg-nexus-sidebar border border-nexus-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-nexus-accent text-white"
            />
            <p className="text-[9px] text-nexus-text-muted">Inactive sessions will auto-close after this duration.</p>
          </div>

          {/* Max Participants */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-1">
              <Users size={12} className="text-emerald-400" />
              Max Participants
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={collabMaxParticipants}
              onChange={(e) => setCollabMaxParticipants(e.target.value)}
              className="w-full bg-nexus-sidebar border border-nexus-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-nexus-accent text-white"
            />
            <p className="text-[9px] text-nexus-text-muted">Maximum number of participants per collaboration session.</p>
          </div>
        </div>
      </div>
    </section>
  );

  // ─── Section: Mobile ──────────────────────────────────────
  const renderMobile = () => (
    <section className="space-y-6">
      <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
        <Smartphone size={18} />
        <h3 className="text-xs font-bold uppercase tracking-wider">Device & Interface</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Touch Mode (Mobile)</span>
            <ToggleButton enabled={isTouchMode} onToggle={onToggleTouchMode} />
          </div>
          <p className="text-[10px] text-nexus-text-muted leading-relaxed">
            Enables a mobile-optimized UI with bottom navigation, slide-out explorer, and touch-friendly controls. Auto-activates on mobile devices regardless of your chosen interface mode.
          </p>
        </div>

        <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span>Responsive UI</span>
            <Layout size={14} className="text-nexus-accent" />
          </div>
          <p className="text-[10px] text-nexus-text-muted leading-relaxed">
            Automatically adapts layout for portrait and landscape orientations on all devices.
          </p>
        </div>
      </div>
    </section>
  );

  // ─── Section: Storage ─────────────────────────────────────
  const renderStorage = () => (
    <section className="space-y-6">
      <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
        <HardDrive size={18} />
        <h3 className="text-xs font-bold uppercase tracking-wider">Storage & Data</h3>
      </div>

      {/* Session Persistence */}
      <div className="p-4 bg-nexus-bg rounded-xl border border-nexus-border space-y-3">
        <div className="flex items-center gap-2 text-nexus-text-muted border-b border-nexus-border/50 pb-2">
          <Database size={16} className="text-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Session Persistence</span>
        </div>
        <div className="flex items-start gap-3">
          <Save size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-white">Auto-Save Enabled</p>
            <p className="text-[10px] text-nexus-text-muted leading-relaxed mt-1">
              Your entire IDE session is automatically saved to IndexedDB every 30 seconds. This includes:
            </p>
            <ul className="text-[10px] text-nexus-text-muted mt-1 ml-3 space-y-0.5 list-disc">
              <li>Open files, tabs, and active editor state</li>
              <li>Panel layout (terminal, AI, sidebar, preview)</li>
              <li>UI mode and settings</li>
              <li>AI provider and model selections</li>
              <li>Terminal command history</li>
            </ul>
          </div>
        </div>

        {sessionSavedAt && (
          <div className="p-2 bg-nexus-sidebar rounded-lg flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-nexus-text-muted">
              Last session saved: {sessionSavedAt}
            </span>
          </div>
        )}

        <div className="p-2 bg-amber-900/10 rounded-lg border border-amber-500/10 flex items-start gap-2">
          <WifiOff size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[9px] text-amber-400/80 leading-relaxed">
            Session data is stored in your browser&apos;s IndexedDB. Clearing browser data will delete your saved session.
          </p>
        </div>
      </div>

      {/* Workspace & Data */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-nexus-accent border-b border-nexus-accent/20 pb-2">
          <HardDrive size={18} />
          <h3 className="text-xs font-bold uppercase tracking-wider">Workspace & Data</h3>
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
        <div className="p-3 bg-nexus-bg rounded-xl border border-nexus-border">
          <div className="flex items-center gap-2 mb-1">
            <Undo2 size={12} className="text-nexus-text-muted" />
            <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Auto-Save</span>
          </div>
          <p className="text-[9px] text-nexus-text-muted leading-relaxed">
            Your workspace is automatically saved to IndexedDB every 30 seconds. Your full IDE session (tabs, panels, settings) is also persisted automatically. Access saved workspaces from the Workspaces tab in the sidebar or via the Beginner UI.
          </p>
        </div>
      </div>
    </section>
  );

  // Section renderer map
  const sectionRenderers: Record<SettingsSection, () => React.ReactNode> = {
    general: renderGeneral,
    editor: renderEditor,
    theme: renderTheme,
    ai: renderAI,
    terminal: renderTerminal,
    network: renderNetwork,
    collab: renderCollab,
    mobile: renderMobile,
    storage: renderStorage,
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-nexus-sidebar border border-nexus-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border bg-nexus-sidebar">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-nexus-accent" />
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Nexus 5.5.0 Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-nexus-bg rounded-xl text-nexus-text-muted hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Body: Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="nexus-settings-sidebar no-scrollbar">
            {settingsCategories.map(cat => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className={cn(
                    "nexus-settings-sidebar-item",
                    activeSection === cat.id && "active"
                  )}
                  onClick={() => setActiveSection(cat.id)}
                  title={cat.label}
                >
                  <Icon size={16} />
                  <span>{cat.label}</span>
                </div>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {sectionRenderers[activeSection]()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-nexus-bg border-t border-nexus-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-nexus-accent animate-pulse" />
            <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Nexus IDE v5.5.0</span>
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
