import { useState, useEffect, useCallback } from 'react';
import { ActivityType } from '../components/ActivityBar';

export function useIDEState(files: any[]) {
  const [activeFileId, setActiveFileId] = useState<string | null>(files[0]?.id || null);
  const [openFileIds, setOpenFileIds] = useState<string[]>(files[0] ? [files[0].id] : []);
  const [activeActivity, setActiveActivity] = useState<ActivityType>('explorer');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [isAiMaximized, setIsAiMaximized] = useState(false);
  const [showVibeGraph, setShowVibeGraph] = useState(false);
  const [showMinecraftScripts, setShowMinecraftScripts] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [isTouchMode, setIsTouchMode] = useState(() => localStorage.getItem('nexus_touch_mode') === 'true');
  const [useBeginnerUI, setUseBeginnerUI] = useState(() => localStorage.getItem('nexus_beginner_ui') === 'true');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [diffData, setDiffData] = useState<{ original: string, modified: string, fileId: string } | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [mermaidChart, setMermaidChart] = useState<string | null>(null);
  const [isZenMode, setIsZenMode] = useState(false);

  const toggleZenMode = useCallback(() => {
    if (!isZenMode) {
      setShowSidebar(false);
      setShowTerminal(false);
      setShowAI(false);
      setShowPreview(false);
    } else {
      setShowSidebar(true);
      setShowPreview(true);
    }
    setIsZenMode(!isZenMode);
  }, [isZenMode]);

  const toggleTouchMode = useCallback(() => {
    setIsTouchMode(prev => !prev);
  }, []);

  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('nexus_api_keys');
    return saved ? JSON.parse(saved) : { gemini: '', openai: '', anthropic: '' };
  });

  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('nexus_github_token') || '');
  const [githubClientId, setGithubClientId] = useState(() => localStorage.getItem('nexus_github_client_id') || '');
  const [githubClientSecret, setGithubClientSecret] = useState(() => localStorage.getItem('nexus_github_client_secret') || '');

  const [selectedAIProvider, setSelectedAIProvider] = useState(() => localStorage.getItem('nexus_selected_ai') || 'gemini');
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('nexus_selected_models');
    return saved ? JSON.parse(saved) : {
      gemini: 'gemini-2.5-pro-preview-06-05',
      openai: 'gpt-4o',
      anthropic: 'claude-sonnet-4-20250514',
      xai: 'grok-3',
      mistral: 'mistral-large-latest',
      deepseek: 'deepseek-chat',
      alibaba: 'qwen-max',
      groq: 'llama-3.3-70b-versatile',
      cohere: 'command-r-plus-08-2024',
      perplexity: 'sonar-pro',
      together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      ollama: 'llama3.2',
    };
  });

  useEffect(() => {
    localStorage.setItem('nexus_touch_mode', isTouchMode.toString());
  }, [isTouchMode]);

  useEffect(() => {
    localStorage.setItem('nexus_beginner_ui', useBeginnerUI.toString());
  }, [useBeginnerUI]);

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
    localStorage.setItem('nexus_github_token', githubToken);
  }, [githubToken]);

  useEffect(() => {
    localStorage.setItem('nexus_github_client_id', githubClientId);
  }, [githubClientId]);

  useEffect(() => {
    localStorage.setItem('nexus_github_client_secret', githubClientSecret);
  }, [githubClientSecret]);

  const handleSelectFile = useCallback((id: string) => {
    setActiveFileId(id);
    setActiveFolder(null);
    if (!openFileIds.includes(id)) {
      setOpenFileIds(prev => [...prev, id]);
    }
  }, [openFileIds]);

  const closeFile = useCallback((id: string) => {
    setOpenFileIds(prev => {
      const newOpenFiles = prev.filter(fid => fid !== id);
      setActiveFileId(currentActiveId => {
        if (currentActiveId === id) {
          return newOpenFiles[newOpenFiles.length - 1] || null;
        }
        return currentActiveId;
      });
      return newOpenFiles;
    });
  }, []);

  const setApiKey = useCallback((provider: string, key: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: key }));
  }, []);

  return {
    activeFileId, setActiveFileId,
    openFileIds, setOpenFileIds,
    activeActivity, setActiveActivity,
    showSidebar, setShowSidebar,
    showAI, setShowAI,
    isAiMaximized, setIsAiMaximized,
    showVibeGraph, setShowVibeGraph,
    showMinecraftScripts, setShowMinecraftScripts,
    showPreview, setShowPreview,
    showTerminal, setShowTerminal,
    showSettings, setShowSettings,
    activeFolder, setActiveFolder,
    isTouchMode, setIsTouchMode,
    toggleTouchMode,
    useBeginnerUI, setUseBeginnerUI,
    sessionId, setSessionId,
    hostedUrl, setHostedUrl,
    diffData, setDiffData,
    isCommandPaletteOpen, setIsCommandPaletteOpen,
    mermaidChart, setMermaidChart,
    isZenMode, toggleZenMode,
    apiKeys, setApiKeys,
    setApiKey,
    githubToken, setGithubToken,
    githubClientId, setGithubClientId,
    githubClientSecret, setGithubClientSecret,
    selectedAIProvider, setSelectedAIProvider,
    selectedModels, setSelectedModels,
    handleSelectFile,
    closeFile
  };
}
