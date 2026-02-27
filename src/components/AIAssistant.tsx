import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Send, Bot, MessageSquare, Sparkles, Settings, Trash2, Terminal, Wand2, Zap } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';
import { cn } from '../lib/utils';

interface AIAssistantProps {
  files: FileNode[];
  activeFileId: string | null;
  onAddFile: (name: string, content: string) => void;
  onUpdateFile: (id: string, content: string) => void;
  onDeleteFile: (id: string) => void;
  apiKeys: Record<string, string>;
  selectedProvider: string;
  selectedModel: string;
  ollamaUrl?: string;
}

type AIMode = 'chat' | 'agent' | 'vibe';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant({
  files,
  activeFileId,
  onAddFile,
  onUpdateFile,
  onDeleteFile,
  apiKeys,
  selectedProvider,
  selectedModel,
  ollamaUrl = 'http://localhost:11434'
}: AIAssistantProps) {
  const [mode, setMode] = useState<AIMode>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any[] | null>(null);
  const [alwaysAllow, setAlwaysAllow] = useState(() => localStorage.getItem('nexus_ai_always_allow') === 'true');
  const [battlegroundMode, setBattlegroundMode] = useState(false);
  const [battleResponses, setBattleResponses] = useState<{ provider: string, text: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find(f => f.id === activeFileId);
  const apiKey = apiKeys[selectedProvider];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('nexus_ai_always_allow', alwaysAllow.toString());
  }, [alwaysAllow]);

  const applyChanges = (parsedFiles: any[]) => {
    let changes = '';
    for (const pf of parsedFiles) {
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
    setMessages(prev => [...prev, { role: 'assistant', content: `I have applied the following changes:\n${changes || 'No valid files found.'}` }]);
    setPendingChanges(null);
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
      const prompt = `Current Files:\n${contextFiles}\n\nActive File: ${activeFile?.name || 'None'}\n\nUser Request: ${userMessage}`;
      
      let systemInstruction = '';
      if (mode === 'chat') {
        systemInstruction = 'You are a helpful coding assistant in an IDE. You can see the user\'s files.';
      } else if (mode === 'vibe') {
        systemInstruction = 'You are a Vibe Coder. The user gives you a vibe or high-level idea, and you generate the complete code for a project. Return ONLY a JSON array of files to create/update. Format: [{"name": "index.html", "content": "..."}]';
      } else if (mode === 'agent') {
        systemInstruction = 'You are an autonomous coding agent. You can write code, fix bugs, and create files. Return ONLY a JSON array of files to create/update. Format: [{"name": "script.js", "content": "..."}]';
      }

      const fetchAIResponse = async (provider: string, model: string, key: string) => {
        if (provider === 'gemini') {
          const ai = new GoogleGenAI({ apiKey: key });
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { systemInstruction, temperature: 0.2 }
          });
          return response.text || '';
        } else if (provider === 'openai') {
          const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
          const response = await openai.chat.completions.create({
            model,
            messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: prompt }],
            temperature: 0.2,
          });
          return response.choices[0]?.message?.content || '';
        } else if (provider === 'anthropic') {
          const anthropic = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
          const response = await anthropic.messages.create({
            model,
            max_tokens: 4096,
            system: systemInstruction,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
          });
          return response.content.map(block => 'text' in block ? block.text : '').join('');
        } else if (provider === 'ollama') {
          // Full Ollama support via local fetch
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
            return data.response || '';
          } catch (err: any) {
            return `Ollama connection failed (${ollamaUrl}). Ensure Ollama is running locally with OLLAMA_ORIGINS="*" environment variable.\nError: ${err.message}`;
          }
        }
        return '';
      };

      if (battlegroundMode) {
        const providers = ['gemini', 'openai'].filter(p => apiKeys[p]);
        const responses = await Promise.all(providers.map(async (p) => {
          const text = await fetchAIResponse(p, p === 'gemini' ? 'gemini-3-flash-preview' : 'gpt-4o', apiKeys[p]);
          return { provider: p, text };
        }));
        setBattleResponses(responses);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Battleground results generated below.' }]);
      } else {
        const responseText = await fetchAIResponse(selectedProvider, selectedModel, apiKey);
        
        if (mode === 'chat') {
          setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
        } else {
          // Parse JSON for agent/vibe
          try {
            const cleanJson = (str: string) => {
              // Remove markdown code blocks
              let cleaned = str.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1');
              // Find the first [ and last ]
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
                setPendingChanges(parsedFiles);
                setMessages(prev => [...prev, { role: 'assistant', content: 'I have generated some changes. Please review and approve them.' }]);
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
    <div className="w-80 flex-shrink-0 bg-white dark:bg-[#252526] border-l border-gray-200 dark:border-[#333] flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#252526]">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-blue-500" />
          <span className="text-xs font-bold text-gray-700 dark:text-[#cccccc] uppercase tracking-wider">Nexus AI</span>
          <div className="flex items-center gap-1 ml-2">
            <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold">
              {selectedProvider}
            </span>
            <span className="text-[10px] bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-1.5 py-0.5 rounded font-mono">
              {selectedModel}
            </span>
          </div>
        </div>
        <button 
          onClick={() => setBattlegroundMode(!battlegroundMode)}
          className={cn(
            "p-1 rounded transition-colors mr-1",
            battlegroundMode ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-200 dark:hover:bg-[#333]"
          )}
          title="Multi-Model Battleground"
        >
          <Zap size={14} />
        </button>
        <button 
          onClick={() => setMessages([])}
          className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded text-gray-500 transition-colors"
          title="Clear Chat"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center px-2 py-1 bg-[#252526] border-b border-[#333] gap-1">
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
                ? "bg-[#37373d] text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-300 hover:bg-[#2a2d2e]"
            )}
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-[#1e1e1e]">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-10">
            <Bot size={32} className="mx-auto mb-2 opacity-50" />
            <p>I'm your Nexus AI Assistant.</p>
            <p className="mt-2 text-xs opacity-75">
              {mode === 'chat' && "Ask me questions about your code."}
              {mode === 'agent' && "Tell me what to build or fix, and I'll edit the files."}
              {mode === 'vibe' && "Describe a vibe or project idea, and I'll generate it."}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex w-full flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
              <div className={cn(
                "max-w-[90%] p-2.5 rounded-lg text-sm shadow-sm border",
                msg.role === 'user' 
                  ? "bg-blue-600 text-white border-blue-500 rounded-tr-none" 
                  : "bg-[#2d2d2d] text-[#cccccc] border-[#3c3c3c] rounded-tl-none font-mono"
              )}>
                <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase font-bold tracking-wider">
                  {msg.role === 'user' ? 'You' : 'Nexus AI'}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                
                {msg.role === 'assistant' && i === messages.length - 1 && battleResponses.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {battleResponses.map((res, idx) => (
                      <div key={idx} className="p-3 bg-black/20 rounded border border-white/5">
                        <div className="text-[10px] font-bold uppercase text-blue-400 mb-2">{res.provider}</div>
                        <div className="text-xs whitespace-pre-wrap opacity-80">{res.text}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {msg.role === 'assistant' && pendingChanges && i === messages.length - 1 && (
                  <div className="mt-3 pt-3 border-t border-[#3c3c3c] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Proposed Changes</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={alwaysAllow} 
                          onChange={e => setAlwaysAllow(e.target.checked)}
                          className="rounded border-[#444] bg-[#1e1e1e]"
                        />
                        <span className="text-[10px] text-gray-500">Always Allow</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPendingChanges(null)}
                        className="flex-1 py-1 text-[10px] bg-[#3c3c3c] hover:bg-[#444] text-white rounded font-bold transition-colors"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => applyChanges(pendingChanges)}
                        className="flex-1 py-1 text-[10px] bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-[#2d2d2d] text-gray-800 dark:text-[#cccccc] rounded-2xl rounded-tl-none px-4 py-2.5 text-sm flex items-center gap-1.5 border border-gray-200 dark:border-[#3c3c3c]">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white dark:bg-[#252526] border-t border-gray-200 dark:border-[#333]">
        {!apiKey && selectedProvider !== 'ollama' && (
          <div className="mb-2 text-xs text-red-500 flex items-center gap-1">
            <Settings size={12} /> Please set your {selectedProvider} API Key in settings.
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading || !apiKey}
            placeholder={mode === 'chat' ? "Ask a question..." : "Describe what to build..."}
            className="flex-1 bg-gray-100 dark:bg-[#3c3c3c] border border-transparent focus:border-blue-500 rounded px-3 py-2 text-sm outline-none text-gray-900 dark:text-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !apiKey}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded p-2 disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
