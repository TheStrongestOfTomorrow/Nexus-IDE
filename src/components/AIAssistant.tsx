import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Send, Bot, MessageSquare, Sparkles, Settings, Trash2, Terminal, Wand as Wand2, Zap, Maximize2, Minimize2, X, Play, Terminal as TerminalIcon, Globe, Paperclip, Image as ImageIcon, FileText, GitCommitHorizontal, ToggleLeft, ToggleRight, XCircle, CheckCircle } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';
import { cn } from '../lib/utils';
import { terminalService } from '../services/terminalService';
import { socketService } from '../services/socketService';

interface AIAssistantProps {
  files: FileNode[];
  activeFileId: string | null;
  onAddFile: (name: string, content: string) => void;
  onUpdateFile: (id: string, content: string) => void;
  onDeleteFile: (id: string) => void;
  apiKeys: Record<string, string>;
  selectedProvider: string;
  selectedModels: Record<string, string>;
  githubToken?: string;
  ollamaUrl?: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onClose?: () => void;
  sessionId?: string | null;
  onVibeProgress?: (progress: { active: boolean, percent: number, message: string }) => void;
  onPendingActions?: (actions: any[] | null) => void;
  githubRepo?: string;
}

type AIMode = 'chat' | 'agent' | 'prototyper';

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  data: string; // base64 for images, text content for files
  mimeType: string;
  size: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  groundingMetadata?: any;
  attachments?: Attachment[];
}

const AIAssistant = forwardRef<any, AIAssistantProps>(({
  files,
  activeFileId,
  onAddFile,
  onUpdateFile,
  onDeleteFile,
  apiKeys,
  selectedProvider,
  selectedModels,
  githubToken = '',
  ollamaUrl = 'http://localhost:11434',
  isMaximized = false,
  onToggleMaximize,
  onClose,
  sessionId,
  onVibeProgress,
  onPendingActions,
  githubRepo = 'TheStrongestOfTomorrow/Nexus-IDE'
}, ref) => {
  const [mode, setMode] = useState<AIMode>(() => (localStorage.getItem('nexus_ai_mode') as AIMode) || 'chat');
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('nexus_ai_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alwaysAllow, setAlwaysAllow] = useState(() => localStorage.getItem('nexus_ai_always_allow') === 'true');
  const [githubCommit, setGithubCommit] = useState(() => localStorage.getItem('nexus_ai_github_commit') === 'true');
  const [commitStatus, setCommitStatus] = useState<string | null>(null);
  const [battlegroundMode, setBattlegroundMode] = useState(false);
  const [battleResponses, setBattleResponses] = useState<{ provider: string, text: string }[]>([]);
  const [suggestedPatch, setSuggestedPatch] = useState<{ fileId: string, content: string } | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    applyChanges: (actions: any[]) => applyChanges(actions)
  }));

  const activeFile = files.find(f => f.id === activeFileId);
  const apiKey = apiKeys[selectedProvider];
  
  const selectedModel = selectedModels[selectedProvider] || 'gemini-2.0-flash';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, attachments]);

  useEffect(() => {
    // Only persist text messages, not attachments (too large for localStorage)
    const textOnlyMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
      groundingMetadata: m.groundingMetadata,
      attachments: m.attachments ? m.attachments.map(a => ({ id: a.id, name: a.name, type: a.type, size: a.size })) : undefined
    }));
    localStorage.setItem('nexus_ai_messages', JSON.stringify(textOnlyMessages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('nexus_ai_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('nexus_ai_always_allow', alwaysAllow.toString());
  }, [alwaysAllow]);

  useEffect(() => {
    localStorage.setItem('nexus_ai_github_commit', githubCommit.toString());
  }, [githubCommit]);

  const clearChat = () => {
    setMessages([]);
    setAttachments([]);
    localStorage.removeItem('nexus_ai_messages');
  };

  // === FILE / IMAGE UPLOAD HANDLING ===
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList) return;

    Array.from(filesList).forEach(file => {
      const reader = new FileReader();
      
      if (file.type.startsWith('image/')) {
        // Image file - read as base64
        reader.onload = () => {
          const base64 = reader.result as string;
          const attachment: Attachment = {
            id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            type: 'image',
            data: base64,
            mimeType: file.type,
            size: file.size
          };
          setAttachments(prev => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        // Text file - read as text
        reader.onload = () => {
          const text = reader.result as string;
          const attachment: Attachment = {
            id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            type: 'file',
            data: text,
            mimeType: file.type || 'text/plain',
            size: file.size
          };
          setAttachments(prev => [...prev, attachment]);
        };
        reader.readAsText(file);
      }
    });

    // Reset file input so the same file can be re-selected
    if (e.target) e.target.value = '';
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // === GITHUB COMMIT ===
  const commitToGitHub = async (changeSummary: string) => {
    if (!githubToken || !githubRepo) {
      setCommitStatus('error: No GitHub token or repo configured');
      setTimeout(() => setCommitStatus(null), 3000);
      return;
    }

    try {
      setCommitStatus('committing...');

      // Get current files as a tree blob
      const fileBlobs: { path: string, content: string }[] = [];
      files.forEach(f => {
        fileBlobs.push({ path: f.name, content: f.content });
      });

      // Get the latest commit on main branch
      const mainRef = await fetch(`https://api.github.com/repos/${githubRepo}/git/refs/heads/main`, {
        headers: { 'Authorization': `Bearer ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!mainRef.ok) throw new Error(`Failed to get main ref: ${mainRef.status}`);
      const mainRefData = await mainRef.json();
      const latestCommitSha = mainRefData.object.sha;

      // Create blobs for each file
      const createdBlobs = await Promise.all(
        fileBlobs.slice(0, 25).map(async (f) => {
          const res = await fetch(`https://api.github.com/repos/${githubRepo}/git/blobs`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${githubToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: f.content, encoding: 'utf-8' })
          });
          if (!res.ok) throw new Error(`Failed to create blob for ${f.path}`);
          const blob = await res.json();
          return { path: f.path, sha: blob.sha, mode: '100644' as const, type: 'blob' as const };
        })
      );

      // Create tree
      const treeRes = await fetch(`https://api.github.com/repos/${githubRepo}/git/trees`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${githubToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_tree: latestCommitSha, tree: createdBlobs })
      });
      if (!treeRes.ok) throw new Error(`Failed to create tree: ${treeRes.status}`);
      const treeData = await treeRes.json();

      // Create commit
      const commitRes = await fetch(`https://api.github.com/repos/${githubRepo}/git/commits`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${githubToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🤖 Nexus AI: ${changeSummary}\n\nApplied via Nexus IDE AI Assistant (v5.1.0)`,
          tree: treeData.sha,
          parents: [latestCommitSha]
        })
      });
      if (!commitRes.ok) throw new Error(`Failed to create commit: ${commitRes.status}`);
      const commitData = await commitRes.json();

      // Update main ref to point to the new commit
      const updateRefRes = await fetch(`https://api.github.com/repos/${githubRepo}/git/refs/heads/main`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${githubToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ sha: commitData.sha })
      });
      if (!updateRefRes.ok) throw new Error(`Failed to update ref: ${updateRefRes.status}`);

      setCommitStatus(`committed: ${commitData.sha.substring(0, 7)}`);
      setMessages(prev => [...prev, { role: 'assistant', content: `✅ Committed ${fileBlobs.length} files to GitHub (${commitData.sha.substring(0, 7)})` }]);
      setTimeout(() => setCommitStatus(null), 5000);
    } catch (error: any) {
      setCommitStatus(`error: ${error.message}`);
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ GitHub commit failed: ${error.message}` }]);
      setTimeout(() => setCommitStatus(null), 5000);
    }
  };

  const applyChanges = async (parsedFiles: any[]) => {
    let changes = '';
    const total = parsedFiles.length;
    
    for (let i = 0; i < total; i++) {
      const pf = parsedFiles[i];
      const percent = Math.round(((i + 1) / total) * 100);
      
      if (onVibeProgress) {
        onVibeProgress({ 
          active: true, 
          percent, 
          message: `Writing: ${pf.name || 'Folder'}...` 
        });
      }

      await new Promise(resolve => setTimeout(resolve, 150));

      if (pf.type === 'folder' || (!pf.content && pf.name)) {
        changes += `Created folder ${pf.name}\n`;
      } else {
        if (!pf.name || typeof pf.content !== 'string') continue;
        const existingFile = files.find(f => f.name === pf.name);
        if (existingFile) {
          onUpdateFile(existingFile.id, pf.content);
          changes += `Updated ${pf.name}\n`;
        } else {
          onAddFile(pf.name, pf.content);
          changes += `Created ${pf.name}\n`;
        }
      }
    }

    if (onVibeProgress) {
      onVibeProgress({ active: false, percent: 100, message: 'Changes Applied!' });
    }

    const summary = changes.trim().split('\n').map(l => l.replace(/^(Created|Updated) /, '')).join(', ');
    setMessages(prev => [...prev, { role: 'assistant', content: `I have applied the following changes:\n${changes || 'No valid files found.'}` }]);
    if (onPendingActions) onPendingActions(null);

    // Auto-commit to GitHub if toggle is on
    if (githubCommit && githubToken && summary) {
      await commitToGitHub(summary);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    if (!input.trim() && attachments.length > 0) return; // need at least some text
    if (!apiKey && selectedProvider !== 'ollama') return;

    let userMessage = input.trim();
    setInput('');

    if (userMessage.toLowerCase() === '/yes') {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content.includes('file system actions')) {
            try {
              const jsonStr = lastMessage.content.substring(lastMessage.content.indexOf('['), lastMessage.content.lastIndexOf(']') + 1);
              const actions = JSON.parse(jsonStr);
              applyChanges(actions);
              return;
            } catch (parseErr) {
              setMessages(prev => [...prev, { role: 'assistant', content: 'Error parsing file system actions. Please try again.' }]);
              return;
            }
        }
    }

    // Build attachment context
    let attachmentContext = '';
    if (attachments.length > 0) {
      attachmentContext = '\n\n📎 Attached Files:\n';
      for (const att of attachments) {
        if (att.type === 'file') {
          attachmentContext += `\nFile: ${att.name} (${formatFileSize(att.size)})\n\`\`\`\n${att.data.substring(0, 5000)}${att.data.length > 5000 ? '\n... (truncated)' : ''}\n\`\`\`\n`;
        } else {
          attachmentContext += `\nImage: ${att.name} (${formatFileSize(att.size)}, ${att.mimeType})\n[Base64 image data attached]\n`;
        }
      }
    }

    // Save attachments with the message
    const messageAttachments = attachments.length > 0 ? [...attachments] : undefined;
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage + attachmentContext, attachments: messageAttachments }];
    setMessages(newMessages);
    setAttachments([]);
    setIsLoading(true);
    setBattleResponses([]);

    try {
      const contextFiles = files.map(f => `File: ${f.name}\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join('\n\n');
      const terminalOutput = terminalService.getOutput();
      
      const githubInfo = githubToken ? `\n\nGitHub Integration Active: Use token ${githubToken.substring(0, 8)}... if needed. Repo: ${githubRepo}` : '';
      
      let systemInstruction = '';
      if (mode === 'chat') {
        systemInstruction = 'You are a helpful coding assistant. You can see the user\'s files, terminal output, and any attached files/images. If the user attached an image, describe or analyze it. If they attached a code file, review or explain it.' + githubInfo;
      } else if (mode === 'prototyper') {
        systemInstruction = 'You are a Prototyper. Generate complete project code based on a prompt. Use [CREATE_FOLDER: "path"] and [WRITE_FILE: "path", "content"]. You can also return a JSON array of files: [{"name": "index.html", "content": "..."}]' + githubInfo;
      } else if (mode === 'agent') {
        systemInstruction = 'You are an autonomous coding agent for review-based developments. Analyze the user\'s code and provide suggestions. Implement changes by returning file actions. Use [CREATE_FOLDER: "path"] and [WRITE_FILE: "path", "content"].' + githubInfo;
      }

      // Build the final user prompt with attachments context
      const fullUserMessage = `Context Files:\n${contextFiles}\n\nTerminal:\n${terminalOutput}\n\nActive File: ${activeFile?.name}\n\nUser Request: ${userMessage}${attachmentContext}`;

      const fetchAIResponse = async (provider: string, model: string, key: string, history: Message[]): Promise<{ text: string, groundingMetadata?: any }> => {
        if (provider === 'gemini') {
          const genAI = new GoogleGenerativeAI(key);
          const aiModel = genAI.getGenerativeModel({ model, systemInstruction });

          // For Gemini, include images as inline data parts
          const parts: any[] = [];
          parts.push({ text: fullUserMessage });

          // Add image attachments as inline data
          if (messageAttachments) {
            for (const att of messageAttachments) {
              if (att.type === 'image') {
                const base64Data = att.data.replace(/^data:[^;]+;base64,/, '');
                parts.push({
                  inlineData: {
                    mimeType: att.mimeType,
                    data: base64Data
                  }
                });
              }
            }
          }

          const contents = history.map((m, idx) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          }));

          // Replace last message content with full context + image parts
          contents[contents.length - 1] = {
            role: 'user' as const,
            parts
          };

          const tools: any[] = [];
          if (isSearchEnabled) tools.push({ googleSearch: {} });

          const result = await aiModel.generateContent({ contents, tools });
          return {
            text: result.response.text() || '',
            groundingMetadata: result.response.candidates?.[0]?.groundingMetadata
          };
        } else if (provider === 'openai' || provider === 'groq' || provider === 'deepseek' || provider === 'mistral' || provider === 'meta') {
          const baseURL = provider === 'groq' ? 'https://api.groq.com/openai/v1' : 
                          provider === 'deepseek' ? 'https://api.deepseek.com' : 
                          provider === 'mistral' ? 'https://api.mistral.ai/v1' : undefined;
          
          const client = new OpenAI({ apiKey: key, baseURL, dangerouslyAllowBrowser: true });

          // Build OpenAI-compatible messages with image support
          const oaiMessages: any[] = [
            { role: 'system', content: systemInstruction },
          ];

          for (let i = 0; i < history.length - 1; i++) {
            oaiMessages.push({ role: history[i].role, content: history[i].content });
          }

          // Last message: include images as content parts (multimodal)
          const lastMsgParts: any[] = [{ type: 'text', text: fullUserMessage }];
          if (messageAttachments) {
            for (const att of messageAttachments) {
              if (att.type === 'image') {
                const base64Data = att.data.replace(/^data:[^;]+;base64,/, '');
                lastMsgParts.push({
                  type: 'image_url',
                  image_url: { url: att.data }
                });
              }
            }
          }
          oaiMessages.push({ role: 'user', content: lastMsgParts.length === 1 ? lastMsgParts[0].text : lastMsgParts });

          const response = await client.chat.completions.create({
            model,
            messages: oaiMessages,
            temperature: 0.2,
            max_tokens: 8192,
          });
          return { text: response.choices[0]?.message?.content || '' };
        } else if (provider === 'anthropic') {
          const anthropic = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });

          // Anthropic supports images as content blocks
          const anthropicMessages: any[] = [];
          for (let i = 0; i < history.length - 1; i++) {
            anthropicMessages.push({ role: history[i].role, content: history[i].content });
          }

          // Build last message content with image blocks
          const lastContent: any[] = [{ type: 'text', text: fullUserMessage }];
          if (messageAttachments) {
            for (const att of messageAttachments) {
              if (att.type === 'image') {
                const base64Data = att.data.replace(/^data:[^;]+;base64,/, '');
                lastContent.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: att.mimeType,
                    data: base64Data
                  }
                });
              }
            }
          }
          anthropicMessages.push({ role: 'user', content: lastContent });

          const response = await anthropic.messages.create({
            model,
            max_tokens: 8192,
            system: systemInstruction,
            messages: anthropicMessages as any,
            temperature: 0.2,
          });
          return { text: response.content.map(block => 'text' in block ? block.text : '').join('') };
        } else if (provider === 'ollama') {
          const response = await fetch(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            body: JSON.stringify({
              model: model || 'llama3',
              messages: [
                { role: 'system', content: systemInstruction },
                ...history.map(m => ({ role: m.role, content: m.content }))
              ],
              stream: false
            })
          });
          const data = await response.json();
          return { text: data.message?.content || '' };
        }
        return { text: '' };
      };

      if (battlegroundMode) {
        const providers = ['gemini', 'openai'].filter(p => apiKeys[p]);
        const responses = await Promise.allSettled(providers.map(async (p) => {
          const res = await fetchAIResponse(p, p === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o', apiKeys[p], newMessages);
          return { provider: p, text: res.text };
        }));
        const successfulResponses = responses
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<any>).value);
        setBattleResponses(successfulResponses);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Battleground results ready.' }]);
      } else {
        const responseData = await fetchAIResponse(selectedProvider, selectedModel, apiKey, newMessages);
        const responseText = responseData.text;
        
        const folderRegex = /\[CREATE_FOLDER:\s*"([^"]+)"\]/g;
        const fileRegex = /\[WRITE_FILE:\s*"([^"]+)",\s*"([\s\S]*?)"\]/g;
        const actions: any[] = [];
        let m;
        while ((m = folderRegex.exec(responseText))) actions.push({ type: 'folder', name: m[1] });
        while ((m = fileRegex.exec(responseText))) actions.push({ type: 'file', name: m[1], content: m[2] });

        if (actions.length > 0) {
          // ALWAYS MODE: auto-apply without asking
          if (alwaysAllow) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Auto-applying ${actions.length} file system actions (always mode ON)...` }]);
            setIsLoading(false);
            applyChanges(actions);
            return;
          }
          
          if (onPendingActions) onPendingActions(actions);
          setMessages(prev => [...prev, { role: 'assistant', content: `I've prepared the following file system actions. Review them in the explorer and type /yes to apply them. \n${JSON.stringify(actions)}` }]);
          setIsLoading(false);
          return;
        }

        setMessages(prev => [...prev, { role: 'assistant', content: responseText, groundingMetadata: responseData.groundingMetadata }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex-shrink-0 bg-nexus-sidebar border-l border-nexus-border flex flex-col h-full transition-all duration-300 overflow-hidden",
      isMaximized ? "w-full" : "w-80"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-nexus-border bg-nexus-sidebar flex-shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <Sparkles size={14} className="text-nexus-accent flex-shrink-0" />
          <span className="text-xs font-bold text-white uppercase tracking-wider truncate">Nexus AI 5.1</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsSearchEnabled(!isSearchEnabled)} className={cn("p-1 rounded transition-colors", isSearchEnabled ? "bg-blue-500 text-white" : "text-nexus-text-muted hover:bg-nexus-bg")} title="Search Grounding"><Globe size={14} /></button>
          <button onClick={() => setBattlegroundMode(!battlegroundMode)} className={cn("p-1 rounded transition-colors", battlegroundMode ? "bg-nexus-accent text-white" : "text-nexus-text-muted hover:bg-nexus-bg")} title="Battleground"><Zap size={14} /></button>
          <button onClick={clearChat} className="p-1 hover:bg-nexus-bg rounded text-nexus-text-muted transition-colors" title="Clear Chat"><Trash2 size={14} /></button>
          <div className="w-px h-4 bg-nexus-border mx-1" />
          {onToggleMaximize && <button onClick={onToggleMaximize} className="p-1 hover:bg-nexus-bg rounded text-nexus-text-muted transition-colors">{isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button>}
          {onClose && <button onClick={onClose} className="p-1 hover:bg-red-500/20 hover:text-red-500 rounded text-nexus-text-muted transition-colors"><X size={14} /></button>}
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center px-2 py-1 bg-nexus-sidebar border-b border-nexus-border gap-1 flex-shrink-0">
        {['chat', 'agent', 'prototyper'].map(id => (
          <button key={id} onClick={() => setMode(id as AIMode)} className={cn("flex-1 py-1 rounded text-[10px] font-bold uppercase transition-all", mode === id ? "bg-nexus-bg text-white shadow-sm" : "text-nexus-text-muted hover:text-white")}>
            {id}
          </button>
        ))}
      </div>

      {/* Toggle Controls Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-nexus-sidebar/50 border-b border-nexus-border flex-shrink-0">
        {/* Always Mode Toggle */}
        <button
          onClick={() => setAlwaysAllow(!alwaysAllow)}
          className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border", 
            alwaysAllow 
              ? "bg-green-500/20 border-green-500/50 text-green-400" 
              : "bg-nexus-bg border-nexus-border text-nexus-text-muted hover:text-white"
          )}
          title={alwaysAllow ? "Always mode ON — file actions apply automatically" : "Always mode OFF — type /yes to apply actions"}
        >
          {alwaysAllow ? <ToggleRight size={12} className="text-green-400" /> : <ToggleLeft size={12} />}
          Always
        </button>

        {/* GitHub Commit Toggle */}
        <button
          onClick={() => setGithubCommit(!githubCommit)}
          className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border",
            githubCommit
              ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
              : "bg-nexus-bg border-nexus-border text-nexus-text-muted hover:text-white"
          )}
          title={githubCommit ? "Auto-commit ON — changes push to GitHub after apply" : "Auto-commit OFF"}
        >
          {githubCommit ? <GitCommitHorizontal size={12} className="text-purple-400" /> : <GitCommitHorizontal size={12} />}
          Commit
        </button>

        {/* Commit Status */}
        {commitStatus && (
          <div className={cn(
            "text-[9px] font-mono truncate max-w-[120px]",
            commitStatus.startsWith('error') ? "text-red-400" : "text-green-400"
          )}>
            {commitStatus.startsWith('committed') ? '✅ ' : '⚠️ '}
            {commitStatus.replace(/^(committed: |error: )/, '')}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-nexus-bg scroll-smooth no-scrollbar overflow-x-hidden">
        {messages.length === 0 && (
          <div className="text-center text-nexus-text-muted text-sm mt-10">
            <Bot size={32} className="mx-auto mb-2 opacity-50" />
            <p className="font-bold text-white mb-1">Nexus AI 5.1</p>
            <p className="text-xs opacity-75">Ready to assist.</p>
            <p className="text-[10px] opacity-50 mt-2">📎 Attach files or images below</p>
          </div>
        )}
        <div className="flex flex-col gap-4 w-full">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex w-full flex-col min-w-0", msg.role === 'user' ? "items-end" : "items-start")}>
              <div className={cn(
                "max-w-[95%] p-3 rounded-xl text-sm shadow-sm border overflow-hidden min-w-0 transition-all",
                msg.role === 'user' 
                  ? "bg-nexus-accent text-white border-nexus-accent rounded-tr-none" 
                  : "bg-nexus-sidebar text-nexus-text border-nexus-border rounded-tl-none font-mono"
              )}>
                <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase font-bold tracking-wider">
                  {msg.role === 'user' ? 'You' : 'AI'}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed overflow-x-auto max-w-full break-words selection:bg-nexus-accent/30 custom-scrollbar pb-1">
                  {msg.content}
                </div>
                {/* Show attachments in messages */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/10">
                    {msg.attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-1.5 bg-white/10 rounded-md px-2 py-1 text-[10px]">
                        {att.type === 'image' ? <ImageIcon size={10} /> : <FileText size={10} />}
                        <span className="truncate max-w-[100px]">{att.name}</span>
                        <span className="opacity-50">{formatFileSize(att.size)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-nexus-sidebar text-nexus-text rounded-xl px-4 py-2 border border-nexus-border">
              <div className="flex gap-1.5"><div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce delay-100" /><div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce delay-200" /></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 bg-nexus-bg/50 border-t border-nexus-border flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {attachments.map(att => (
              <div key={att.id} className={cn(
                "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] border group relative",
                att.type === 'image'
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-300"
              )}>
                {att.type === 'image' ? (
                  <>
                    {/* Image thumbnail */}
                    <img src={att.data} alt={att.name} className="w-6 h-6 rounded object-cover" />
                    <span className="truncate max-w-[80px]">{att.name}</span>
                  </>
                ) : (
                  <>
                    <FileText size={10} />
                    <span className="truncate max-w-[80px]">{att.name}</span>
                  </>
                )}
                <span className="opacity-40">{formatFileSize(att.size)}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="opacity-0 group-hover:opacity-100 ml-0.5 hover:text-red-400 transition-all"
                >
                  <XCircle size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-nexus-sidebar border-t border-nexus-border flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          {/* File upload button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".txt,.js,.ts,.tsx,.jsx,.json,.html,.css,.py,.md,.yaml,.yml,.xml,.sql,.sh,.env,.toml,.cfg,.conf,.ini,.log,.csv,.rb,.go,.rs,.java,.c,.cpp,.h,.hpp,.cs,.php,.swift,.kt,.dart,.lua,.r,.pl,.ex,.exs,.vue,.svelte,.astro,.graphql,.proto,.dockerfile,.makefile,.gitignore,.editorconfig,.eslintrc,.prettierrc,.babelrc,.tsconfig"
            onChange={handleFileUpload}
          />
          {/* Image upload button */}
          <input
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-nexus-text-muted hover:text-blue-400 hover:bg-nexus-bg rounded-lg transition-colors"
            title="Attach file"
          >
            <Paperclip size={16} />
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="p-2 text-nexus-text-muted hover:text-purple-400 hover:bg-nexus-bg rounded-lg transition-colors"
            title="Attach image"
          >
            <ImageIcon size={16} />
          </button>
          <input value={input} onChange={e => setInput(e.target.value)} disabled={isLoading} placeholder="Message AI..." className="flex-1 bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-nexus-accent" />
          <button type="submit" disabled={isLoading || !input.trim()} className="bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg p-2 transition-colors flex items-center justify-center"><Send size={16} /></button>
        </form>
      </div>
    </div>
  );
});

export default AIAssistant;
