import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Send, Bot, MessageSquare, Sparkles, Settings, Trash2, Terminal, Wand as Wand2, Zap, Maximize2, Minimize2, X, Play, Terminal as TerminalIcon, Globe } from 'lucide-react';
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
}

type AIMode = 'chat' | 'agent' | 'prototyper';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  groundingMetadata?: any;
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
  onPendingActions
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
  const [battlegroundMode, setBattlegroundMode] = useState(false);
  const [battleResponses, setBattleResponses] = useState<{ provider: string, text: string }[]>([]);
  const [suggestedPatch, setSuggestedPatch] = useState<{ fileId: string, content: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    applyChanges: (actions: any[]) => applyChanges(actions)
  }));

  const activeFile = files.find(f => f.id === activeFileId);
  const apiKey = apiKeys[selectedProvider];
  
  const selectedModel = selectedModels[selectedProvider] || 'gemini-2.0-flash';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('nexus_ai_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('nexus_ai_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('nexus_ai_always_allow', alwaysAllow.toString());
  }, [alwaysAllow]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('nexus_ai_messages');
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

    setMessages(prev => [...prev, { role: 'assistant', content: `I have applied the following changes:\n${changes || 'No valid files found.'}` }]);
    if (onPendingActions) onPendingActions(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || (!apiKey && selectedProvider !== 'ollama')) return;

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

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    setBattleResponses([]);

    try {
      const contextFiles = files.map(f => `File: ${f.name}\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join('\n\n');
      const terminalOutput = terminalService.getOutput();
      
      const githubInfo = githubToken ? `\n\nGitHub Integration Active: Use token ${githubToken.substring(0, 8)}... if needed.` : '';
      
      let systemInstruction = '';
      if (mode === 'chat') {
        systemInstruction = 'You are a helpful coding assistant. You can see the user\'s files and terminal output.' + githubInfo;
      } else if (mode === 'prototyper') {
        systemInstruction = 'You are a Prototyper. Generate complete project code based on a prompt. Use [CREATE_FOLDER: "path"] and [WRITE_FILE: "path", "content"]. You can also return a JSON array of files: [{"name": "index.html", "content": "..."}]' + githubInfo;
      } else if (mode === 'agent') {
        systemInstruction = 'You are an autonomous coding agent for review-based developments. Analyze the user\'s code and provide suggestions. If the user agrees by typing /yes, implement the changes. Use [CREATE_FOLDER: "path"] and [WRITE_FILE: "path", "content"].' + githubInfo;
      }

      const fetchAIResponse = async (provider: string, model: string, key: string, history: Message[]): Promise<{ text: string, groundingMetadata?: any }> => {
        if (provider === 'gemini') {
          const genAI = new GoogleGenerativeAI(key);
          const aiModel = genAI.getGenerativeModel({ model, systemInstruction });

          const contents = history.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          }));

          contents[contents.length - 1].parts[0].text = `Context Files:\n${contextFiles}\n\nTerminal:\n${terminalOutput}\n\nActive File: ${activeFile?.name}\n\nUser Request: ${userMessage}`;

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
          const messages = [
            { role: 'system', content: systemInstruction },
            ...history.map(m => ({ role: m.role, content: m.content }))
          ];
          
          messages[messages.length - 1].content = `Context Files:\n${contextFiles}\n\nTerminal:\n${terminalOutput}\n\nUser: ${userMessage}`;

          const response = await client.chat.completions.create({
            model,
            messages: messages as any,
            temperature: 0.2,
          });
          return { text: response.choices[0]?.message?.content || '' };
        } else if (provider === 'anthropic') {
          const anthropic = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
          const response = await anthropic.messages.create({
            model,
            max_tokens: 4096,
            system: systemInstruction,
            messages: history.map(m => ({ role: m.role, content: m.content })) as any,
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
      <div className="flex items-center justify-between px-4 py-2 border-b border-nexus-border bg-nexus-sidebar flex-shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <Sparkles size={14} className="text-nexus-accent flex-shrink-0" />
          <span className="text-xs font-bold text-white uppercase tracking-wider truncate">Nexus AI 5.0</span>
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

      <div className="flex items-center px-2 py-1 bg-nexus-sidebar border-b border-nexus-border gap-1 flex-shrink-0">
        {['chat', 'agent', 'prototyper'].map(id => (
          <button key={id} onClick={() => setMode(id as AIMode)} className={cn("flex-1 py-1 rounded text-[10px] font-bold uppercase transition-all", mode === id ? "bg-nexus-bg text-white shadow-sm" : "text-nexus-text-muted hover:text-white")}>
            {id}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-nexus-bg scroll-smooth no-scrollbar overflow-x-hidden">
        {messages.length === 0 && (
          <div className="text-center text-nexus-text-muted text-sm mt-10">
            <Bot size={32} className="mx-auto mb-2 opacity-50" />
            <p className="font-bold text-white mb-1">Nexus AI 5.0</p>
            <p className="text-xs opacity-75">Ready to assist.</p>
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

      <div className="p-3 bg-nexus-sidebar border-t border-nexus-border flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} disabled={isLoading} placeholder="Message AI..." className="flex-1 bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-nexus-accent" />
          <button type="submit" disabled={isLoading || !input.trim()} className="bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg p-2 transition-colors flex items-center justify-center"><Send size={16} /></button>
        </form>
      </div>
    </div>
  );
});

export default AIAssistant;
