import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Send, Bot, MessageSquare, Sparkles, Settings, Trash2, Terminal, Wand2, Zap, Maximize2, Minimize2, X, Play, Terminal as TerminalIcon, Globe } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';
import { cn } from '../lib/utils';
import { terminalService } from '../services/terminalService';
import { socketService } from '../services/socketService';
import { Type } from '@google/genai';

interface AIAssistantProps {
  files: FileNode[];
  activeFileId: string | null;
  onAddFile: (name: string, content: string) => void;
  onUpdateFile: (id: string, content: string) => void;
  onDeleteFile: (id: string) => void;
  apiKeys: Record<string, string>;
  selectedProvider: string;
  selectedModels: Record<string, string>;
  ollamaUrl?: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onClose?: () => void;
  sessionId?: string | null;
  onVibeProgress?: (progress: { active: boolean, percent: number, message: string }) => void;
  onPendingActions?: (actions: any[] | null) => void;
}

type AIMode = 'chat' | 'agent' | 'vibe';

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
  ollamaUrl = 'http://localhost:11434',
  isMaximized = false,
  onToggleMaximize,
  onClose,
  sessionId,
  onVibeProgress,
  onPendingActions
}, ref) => {
  const [mode, setMode] = useState<AIMode>('chat');
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
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
  const selectedModel = selectedModels[selectedProvider] || 'gemini-2.5-flash';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('nexus_ai_always_allow', alwaysAllow.toString());
  }, [alwaysAllow]);

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
          message: `Vibing: [${'|'.repeat(Math.floor(percent/10))}${' '.repeat(10 - Math.floor(percent/10))}] ${percent}% (Writing ${pf.name || 'Folder'}...)` 
        });
      }

      // Small delay to make it feel like work is happening
      await new Promise(resolve => setTimeout(resolve, 300));

      if (pf.type === 'folder' || (!pf.content && pf.name)) {
        // Handle folder creation
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
      onVibeProgress({ active: false, percent: 100, message: 'Vibe Complete!' });
    }

    setMessages(prev => [...prev, { role: 'assistant', content: `I have applied the following changes:\n${changes || 'No valid files found.'}` }]);
    if (onPendingActions) onPendingActions(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || (!apiKey && selectedProvider !== 'ollama')) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setBattleResponses([]);

    try {
      const contextFiles = files.map(f => `File: ${f.name}\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join('\n\n');
      const terminalOutput = terminalService.getOutput();
      const prompt = `Current Files:\n${contextFiles}\n\nRecent Terminal Output:\n${terminalOutput}\n\nActive File: ${activeFile?.name || 'None'}\n\nUser Request: ${userMessage}`;
      
      let systemInstruction = '';
      if (mode === 'chat') {
        systemInstruction = 'You are a helpful coding assistant in an IDE. You can see the user\'s files and terminal output. If the terminal shows an error, suggest a fix. If the fix involves editing the active file, return a JSON block with the patch: {"patch": {"fileId": "...", "content": "..."}}. If the user asks for a Minecraft build, use the mc_exec tool. You also have "Hands": you can create folders using [CREATE_FOLDER: "path"] and write files using [WRITE_FILE: "path", "content"]. You can perform multi-file actions at once.';
      } else if (mode === 'vibe') {
        systemInstruction = 'You are a Vibe Coder. The user gives you a vibe or high-level idea, and you generate the complete code for a project. You can use [CREATE_FOLDER: "path"] and [WRITE_FILE: "path", "content"] to build the project structure. You can also return a JSON array of files: [{"name": "index.html", "content": "..."}]';
      } else if (mode === 'agent') {
        systemInstruction = 'You are an autonomous coding agent. You can write code, fix bugs, and create files. You have "Hands": use [CREATE_FOLDER: "path"] and [WRITE_FILE: "path", "content"] for multi-file operations. You can also return a JSON array of files: [{"name": "script.js", "content": "..."}]';
      }

      const fetchAIResponse = async (provider: string, model: string, key: string): Promise<{ text: string, groundingMetadata?: any }> => {
        if (provider === 'gemini') {
          const ai = new GoogleGenAI({ apiKey: key });
          const config: any = { 
            systemInstruction, 
            temperature: 0.2,
            tools: [{
              functionDeclarations: [{
                name: 'mc_exec',
                description: 'Execute a command in Minecraft Bedrock Edition via the WebSocket bridge.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    command: {
                      type: Type.STRING,
                      description: 'The Minecraft command to execute (e.g., "/fill 0 0 0 10 10 10 glass").'
                    }
                  },
                  required: ['command']
                }
              }]
            }]
          };

          if (isSearchEnabled) {
            config.tools.push({ googleSearch: {} });
          }

          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config
          });

          if (response.functionCalls) {
            for (const call of response.functionCalls) {
              if (call.name === 'mc_exec' && sessionId) {
                const cmd = (call.args as any).command;
                socketService.sendMinecraftCommand(sessionId, cmd);
                setMessages(prev => [...prev, { role: 'assistant', content: `Executing Minecraft command: ${cmd}` }]);
              }
            }
            return { text: 'Command sent to Minecraft.' };
          }

          return {
            text: response.text || '',
            groundingMetadata: response.candidates?.[0]?.groundingMetadata
          };
        } else if (provider === 'openai') {
          const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
          const response = await openai.chat.completions.create({
            model,
            messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: prompt }],
            temperature: 0.2,
          });
          return { text: response.choices[0]?.message?.content || '' };
        } else if (provider === 'anthropic') {
          const anthropic = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
          const response = await anthropic.messages.create({
            model,
            max_tokens: 4096,
            system: systemInstruction,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
          });
          return { text: response.content.map(block => 'text' in block ? block.text : '').join('') };
        } else if (provider === 'groq') {
          const groq = new OpenAI({ 
            apiKey: key, 
            baseURL: 'https://api.groq.com/openai/v1',
            dangerouslyAllowBrowser: true 
          });
          const response = await groq.chat.completions.create({
            model,
            messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: prompt }],
            temperature: 0.2,
          });
          return { text: response.choices[0]?.message?.content || '' };
        } else if (provider === 'deepseek') {
          const deepseek = new OpenAI({ 
            apiKey: key, 
            baseURL: 'https://api.deepseek.com',
            dangerouslyAllowBrowser: true 
          });
          const response = await deepseek.chat.completions.create({
            model,
            messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: prompt }],
            temperature: 0.2,
          });
          return { text: response.choices[0]?.message?.content || '' };
        } else if (provider === 'ollama') {
          try {
            const response = await fetch(`${ollamaUrl}/api/generate`, {
              method: 'POST',
              body: JSON.stringify({
                model: model || 'llama3',
                prompt: `${systemInstruction}\n\n${prompt}`,
                stream: false
              })
            });
            if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
            const data = await response.json();
            return { text: data.response || '' };
          } catch (err: any) {
            return { text: `Ollama connection failed (${ollamaUrl}). Ensure Ollama is running locally with OLLAMA_ORIGINS="*" environment variable.\nError: ${err.message}` };
          }
        }
        return { text: '' };
      };

      if (battlegroundMode) {
        const providers = ['gemini', 'openai'].filter(p => apiKeys[p]);
        const responses = await Promise.all(providers.map(async (p) => {
          const res = await fetchAIResponse(p, p === 'gemini' ? 'gemini-3-flash-preview' : 'gpt-4o', apiKeys[p]);
          return { provider: p, text: res.text };
        }));
        setBattleResponses(responses);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Battleground results generated below.' }]);
      } else {
        const responseData = await fetchAIResponse(selectedProvider, selectedModel, apiKey);
        const responseText = responseData.text;
        const groundingMetadata = responseData.groundingMetadata;
        
        // Feature 1: File Action Bridge - Detect [CREATE_FOLDER] and [WRITE_FILE]
        const folderRegex = /\[CREATE_FOLDER:\s*"([^"]+)"\]/g;
        const fileRegex = /\[WRITE_FILE:\s*"([^"]+)",\s*"([\s\S]*?)"\]/g;
        
        const actions: any[] = [];
        let match;
        
        while ((match = folderRegex.exec(responseText)) !== null) {
          actions.push({ type: 'folder', name: match[1] });
        }
        
        while ((match = fileRegex.exec(responseText)) !== null) {
          actions.push({ type: 'file', name: match[1], content: match[2] });
        }

        if (actions.length > 0) {
          if (onPendingActions) onPendingActions(actions);
          setMessages(prev => [...prev, { role: 'assistant', content: `I've prepared ${actions.length} file system actions. Please review them in the explorer.` }]);
          
          if (onVibeProgress) {
            onVibeProgress({ active: true, percent: 0, message: 'Vibe Check Pending...' });
          }
          setIsLoading(false);
          return;
        }

        if (mode === 'chat') {
          try {
            const patchMatch = responseText.match(/\{"patch":\s*\{[\s\S]*?\}\}/);
            if (patchMatch) {
              const patchData = JSON.parse(patchMatch[0]);
              setSuggestedPatch(patchData.patch);
              const cleanText = responseText.replace(patchMatch[0], '').trim();
              setMessages(prev => [...prev, { role: 'assistant', content: cleanText || 'I found a fix for the error.', groundingMetadata }]);
            } else {
              setMessages(prev => [...prev, { role: 'assistant', content: responseText, groundingMetadata }]);
            }
          } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
          }
        } else {
          try {
            const cleanJson = (str: string) => {
              let cleaned = str.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1');
              const start = cleaned.indexOf('[');
              const end = cleaned.lastIndexOf(']');
              if (start !== -1 && end !== -1) {
                cleaned = cleaned.substring(start, end + 1);
              }
              return cleaned;
            };

            const jsonStr = cleanJson(responseText);
            const parsedFiles = JSON.parse(jsonStr);
            if (Array.isArray(parsedFiles)) {
              if (alwaysAllow) {
                applyChanges(parsedFiles);
              } else {
                if (onPendingActions) onPendingActions(parsedFiles);
                setMessages(prev => [...prev, { role: 'assistant', content: 'I have generated some changes. Please review and approve them in the explorer.' }]);
              }
            } else {
              setMessages(prev => [...prev, { role: 'assistant', content: 'Could not parse the generated files. Response was not an array:\n' + responseText }]);
            }
          } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error parsing changes: ' + err + '\n\nResponse:\n' + responseText }]);
          }
        }
      }

    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex-shrink-0 bg-nexus-sidebar border-l border-nexus-border flex flex-col h-full transition-all duration-300",
      isMaximized ? "w-full" : "w-80"
    )}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-nexus-border bg-nexus-sidebar">
        <div className="flex items-center gap-2 overflow-hidden">
          <Sparkles size={14} className="text-nexus-accent flex-shrink-0" />
          <span className="text-xs font-bold text-white uppercase tracking-wider truncate">Nexus AI 4.0</span>
          <div className="flex items-center gap-1 ml-2 overflow-hidden">
            <span className="text-[10px] bg-nexus-accent/20 text-nexus-accent px-1.5 py-0.5 rounded uppercase font-bold truncate">
              {selectedProvider}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsSearchEnabled(!isSearchEnabled)}
            className={cn(
              "p-1 rounded transition-colors",
              isSearchEnabled ? "bg-blue-500 text-white" : "text-nexus-text-muted hover:bg-nexus-bg"
            )}
            title="Google Search Grounding"
          >
            <Globe size={14} />
          </button>
          <button 
            onClick={() => setBattlegroundMode(!battlegroundMode)}
            className={cn(
              "p-1 rounded transition-colors",
              battlegroundMode ? "bg-nexus-accent text-white" : "text-nexus-text-muted hover:bg-nexus-bg"
            )}
            title="Multi-Model Battleground"
          >
            <Zap size={14} />
          </button>
          <button 
            onClick={() => setMessages([])}
            className="p-1 hover:bg-nexus-bg rounded text-nexus-text-muted transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={14} />
          </button>
          <div className="w-px h-4 bg-nexus-border mx-1" />
          {onToggleMaximize && (
            <button 
              onClick={onToggleMaximize}
              className="p-1 hover:bg-nexus-bg rounded text-nexus-text-muted transition-colors"
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 hover:bg-red-500/20 hover:text-red-500 rounded text-nexus-text-muted transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center px-2 py-1 bg-nexus-sidebar border-b border-nexus-border gap-1">
        {[
          { id: 'chat', icon: MessageSquare, label: 'Chat' },
          { id: 'agent', icon: Zap, label: 'Composer' },
          { id: 'vibe', icon: Wand2, label: 'Vibe' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setMode(t.id as AIMode)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-[11px] font-medium transition-all",
              mode === t.id 
                ? "bg-nexus-bg text-white shadow-sm" 
                : "text-nexus-text-muted hover:text-white hover:bg-nexus-bg/50"
            )}
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-nexus-bg">
        {messages.length === 0 && (
          <div className="text-center text-nexus-text-muted text-sm mt-10">
            <Bot size={32} className="mx-auto mb-2 opacity-50" />
            <p className="font-bold text-white mb-1">Nexus AI 4.0</p>
            <p className="text-xs opacity-75">
              {mode === 'chat' && "Ask me anything about your project."}
              {mode === 'agent' && "Describe a feature, and I'll build it."}
              {mode === 'vibe' && "Share a vibe, and I'll manifest the code."}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex w-full flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
              <div className={cn(
                "max-w-[90%] p-3 rounded-xl text-sm shadow-sm border",
                msg.role === 'user' 
                  ? "bg-nexus-accent text-white border-nexus-accent rounded-tr-none" 
                  : "bg-nexus-sidebar text-nexus-text border-nexus-border rounded-tl-none font-mono"
              )}>
                <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase font-bold tracking-wider">
                  {msg.role === 'user' ? 'You' : 'Nexus AI'}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                
                {msg.groundingMetadata?.groundingChunks && (
                  <div className="mt-3 pt-3 border-t border-nexus-border/30 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-nexus-accent uppercase tracking-widest">
                      <Globe size={10} />
                      Sources
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingMetadata.groundingChunks.map((chunk: any, idx: number) => {
                        const url = chunk.web?.uri || chunk.maps?.uri;
                        const title = chunk.web?.title || chunk.maps?.title || 'Source';
                        if (!url) return null;
                        return (
                          <a 
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] bg-nexus-bg hover:bg-nexus-accent/10 border border-nexus-border hover:border-nexus-accent/30 px-2 py-1 rounded transition-all flex items-center gap-1.5 max-w-[200px]"
                          >
                            <Globe size={8} className="flex-shrink-0" />
                            <span className="truncate">{title}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {msg.role === 'assistant' && i === messages.length - 1 && suggestedPatch && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={14} className="text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Suggested Fix</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (suggestedPatch) {
                          onUpdateFile(suggestedPatch.fileId, suggestedPatch.content);
                          setSuggestedPatch(null);
                          setMessages(prev => [...prev, { role: 'assistant', content: 'Patch applied successfully!' }]);
                        }
                      }}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-all shadow-lg"
                    >
                      <Play size={12} />
                      Apply Patch
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-nexus-sidebar text-nexus-text rounded-xl rounded-tl-none px-4 py-2.5 text-sm flex items-center gap-1.5 border border-nexus-border">
              <div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-nexus-sidebar border-t border-nexus-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading || (!apiKey && selectedProvider !== 'ollama')}
            placeholder={mode === 'chat' ? "Ask anything..." : "What should I build?"}
            className="flex-1 bg-nexus-bg border border-nexus-border focus:border-nexus-accent rounded-lg px-3 py-2 text-sm outline-none text-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || (!apiKey && selectedProvider !== 'ollama')}
            className="bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg p-2 disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
});

export default AIAssistant;
