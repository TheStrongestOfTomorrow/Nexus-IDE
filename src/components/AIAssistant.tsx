import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Send, Bot, MessageSquare, Sparkles, Settings, Trash2, Terminal, Wand as Wand2, Zap, Maximize2, Minimize2, X, Play, Terminal as TerminalIcon, Globe, Paperclip, Image as ImageIcon, FileText, GitCommitHorizontal, ToggleLeft, ToggleRight, XCircle, CheckCircle, Square, Radio, Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';
import { cn } from '../lib/utils';
import { terminalService } from '../services/terminalService';
import { socketService } from '../services/socketService';
import { notificationService } from '../services/notificationService';
import { AI_TOOLS, AIToolCall, AIToolResult, toOpenAITools, toAnthropicTools, toGeminiTools, toOllamaTools, generateToolCallId, AI_TOOL_CATEGORIES } from '../services/aiToolService';

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
  toolCalls?: AIToolCall[];
  toolResults?: AIToolResult[];
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
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreamEnabled, setIsStreamEnabled] = useState(() => localStorage.getItem('nexus_ai_streaming') !== 'false');
  // Tool calling state
  const [isToolEnabled, setIsToolEnabled] = useState(() => localStorage.getItem('nexus_ai_tools') !== 'false');
  const [toolResults, setToolResults] = useState<AIToolResult[]>([]);
  const [expandedToolResults, setExpandedToolResults] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef('');
  const shouldStopRef = useRef(false);

  useImperativeHandle(ref, () => ({
    applyChanges: (actions: any[]) => applyChanges(actions)
  }));

  const activeFile = files.find(f => f.id === activeFileId);
  const apiKey = apiKeys[selectedProvider];
  
  const selectedModel = selectedModels[selectedProvider] || 'gemini-2.0-flash';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, attachments]);

  // Scroll during streaming
  useEffect(() => {
    if (isStreaming && streamingContent) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isStreaming, streamingContent]);

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

  useEffect(() => {
    localStorage.setItem('nexus_ai_streaming', isStreamEnabled.toString());
  }, [isStreamEnabled]);

  useEffect(() => {
    localStorage.setItem('nexus_ai_tools', isToolEnabled.toString());
  }, [isToolEnabled]);

  // Cleanup on unmount — abort any in-progress streaming
  useEffect(() => {
    return () => {
      shouldStopRef.current = true;
      abortControllerRef.current?.abort();
    };
  }, []);

  const clearChat = () => {
    setMessages([]);
    setAttachments([]);
    setToolResults([]);
    localStorage.removeItem('nexus_ai_messages');
  };

  const toggleToolResultExpanded = (id: string) => {
    setExpandedToolResults(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const stopStreaming = useCallback(() => {
    shouldStopRef.current = true;
    abortControllerRef.current?.abort();
  }, []);

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

  // === TOOL EXECUTION HANDLER ===
  const executeToolCall = useCallback(async (toolCall: AIToolCall): Promise<AIToolResult> => {
    const { name, arguments: args, id } = toolCall;

    try {
      switch (name) {
        // ── File Tools ──────────────────────────────────────────────────────
        case 'read_file': {
          const file = files.find(f => f.name === args.path);
          if (!file) return { toolCallId: id, name, result: `Error: File not found: ${args.path}`, isError: true };
          return { toolCallId: id, name, result: file.content };
        }
        case 'write_file': {
          const existing = files.find(f => f.name === args.path);
          if (existing) {
            onUpdateFile(existing.id, args.content);
            return { toolCallId: id, name, result: `Updated file: ${args.path} (${args.content.length} chars)` };
          } else {
            onAddFile(args.path, args.content);
            return { toolCallId: id, name, result: `Created file: ${args.path} (${args.content.length} chars)` };
          }
        }
        case 'delete_file': {
          const file = files.find(f => f.name === args.path);
          if (!file) return { toolCallId: id, name, result: `Error: File not found: ${args.path}`, isError: true };
          onDeleteFile(file.id);
          return { toolCallId: id, name, result: `Deleted file: ${args.path}` };
        }
        case 'list_files': {
          const prefix = args.path || '';
          const filtered = prefix
            ? files.filter(f => f.name.startsWith(prefix))
            : files;
          const entries = filtered.map(f => {
            const rel = prefix ? f.name.slice(prefix.length) : f.name;
            return `${rel} (${f.language || 'unknown'})`;
          });
          return { toolCallId: id, name, result: entries.length > 0 ? entries.join('\n') : '(no files found)' };
        }
        case 'search_files': {
          const query = args.query || '';
          const searchPath = args.path || '';
          const isRegex = args.regex || false;
          const results: string[] = [];
          for (const f of files) {
            if (searchPath && !f.name.startsWith(searchPath)) continue;
            let matches = false;
            if (isRegex) {
              try {
                matches = new RegExp(query, 'gi').test(f.content);
              } catch { /* skip bad regex */ }
            } else {
              matches = f.content.toLowerCase().includes(query.toLowerCase());
            }
            if (matches) {
              const lines = f.content.split('\n');
              lines.forEach((line, idx) => {
                let lineMatch = false;
                if (isRegex) {
                  try { lineMatch = new RegExp(query, 'gi').test(line); } catch {}
                } else {
                  lineMatch = line.toLowerCase().includes(query.toLowerCase());
                }
                if (lineMatch) {
                  results.push(`${f.name}:${idx + 1}: ${line.trim().substring(0, 120)}`);
                }
              });
            }
          }
          return { toolCallId: id, name, result: results.length > 0 ? results.slice(0, 50).join('\n') : 'No matches found.' };
        }
        case 'get_file_info': {
          const file = files.find(f => f.name === args.path);
          if (!file) return { toolCallId: id, name, result: `Error: File not found: ${args.path}`, isError: true };
          const info = [
            `Name: ${file.name}`,
            `Language: ${file.language || 'unknown'}`,
            `Size: ${file.content.length} chars, ${file.content.split('\n').length} lines`,
            `ID: ${file.id}`,
          ];
          return { toolCallId: id, name, result: info.join('\n') };
        }
        case 'create_directory': {
          // In the in-browser workspace, directories are implicit — creating a placeholder file marks the folder
          return { toolCallId: id, name, result: `Directory noted: ${args.path}. Files created under this path will implicitly create it.` };
        }
        case 'rename_file': {
          const file = files.find(f => f.name === args.old_path);
          if (!file) return { toolCallId: id, name, result: `Error: File not found: ${args.old_path}`, isError: true };
          onAddFile(args.new_path, file.content);
          onDeleteFile(file.id);
          return { toolCallId: id, name, result: `Renamed: ${args.old_path} → ${args.new_path}` };
        }

        // ── Git Tools ───────────────────────────────────────────────────────
        case 'git_status': {
          const unstaged = files.filter(f => f.originalContent && f.content !== f.originalContent).map(f => ` modified: ${f.name}`);
          const untracked = files.filter(f => !f.originalContent && f.content).map(f => ` untracked: ${f.name}`);
          return { toolCallId: id, name, result: `On branch main\n${unstaged.length + untracked.length > 0 ? [...unstaged, ...untracked].join('\n') : 'nothing to commit, working tree clean'}` };
        }
        case 'git_diff': {
          const target = args.file;
          const file = target ? files.find(f => f.name === target) : null;
          if (file && file.originalContent) {
            const oldLines = file.originalContent.split('\n');
            const newLines = file.content.split('\n');
            const diff: string[] = [`diff --git a/${file.name} b/${file.name}`];
            for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
              if (oldLines[i] !== newLines[i]) {
                if (oldLines[i] !== undefined) diff.push(`- ${oldLines[i]}`);
                if (newLines[i] !== undefined) diff.push(`+ ${newLines[i]}`);
              }
            }
            return { toolCallId: id, name, result: diff.join('\n').substring(0, 4000) };
          }
          if (!file && !target) {
            const allDiffs: string[] = [];
            files.forEach(f => {
              if (f.originalContent && f.content !== f.originalContent) {
                allDiffs.push(`\n--- ${f.name} ---\n${f.content}`);
              }
            });
            return { toolCallId: id, name, result: allDiffs.length > 0 ? allDiffs.join('\n').substring(0, 4000) : 'No changes detected.' };
          }
          return { toolCallId: id, name, result: target ? `No changes for ${target}` : 'No changes detected.' };
        }
        case 'git_log': {
          return { toolCallId: id, name, result: 'Git log is available via GitHub API. Use github_list_issues or the GitHub panel for commit history.' };
        }
        case 'git_add': case 'git_commit': case 'git_branch': case 'git_checkout':
        case 'git_pull': case 'git_push': case 'git_stash': {
          return { toolCallId: id, name, result: `${name}: Git operations are managed through the GitHub integration. ${githubToken ? 'GitHub token is configured.' : 'No GitHub token set — configure in Settings.'}` };
        }

        // ── GitHub Tools ───────────────────────────────────────────────────
        case 'github_create_issue': {
          if (!githubToken || !githubRepo) return { toolCallId: id, name, result: 'Error: No GitHub token or repo configured.', isError: true };
          const [owner, repo] = githubRepo.split('/');
          const res = await fetch(`/api/github/repos/${owner}/${repo}/issues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `token ${githubToken}` },
            body: JSON.stringify({ title: args.title, body: args.body || '' }),
          });
          if (!res.ok) return { toolCallId: id, name, result: `Error: ${res.status}`, isError: true };
          const data = await res.json();
          return { toolCallId: id, name, result: `Created issue #${data.number}: ${data.html_url}` };
        }
        case 'github_list_issues': {
          if (!githubToken || !githubRepo) return { toolCallId: id, name, result: 'Error: No GitHub token or repo configured.', isError: true };
          const [owner, repo] = githubRepo.split('/');
          const state = args.state || 'open';
          const res = await fetch(`/api/github/repos/${owner}/${repo}/issues?state=${state}`, {
            headers: { Authorization: `token ${githubToken}` },
          });
          if (!res.ok) return { toolCallId: id, name, result: `Error: ${res.status}`, isError: true };
          const data = await res.json();
          const list = data.slice(0, args.count || 10).map((i: any) => `#${i.number} [${i.state}] ${i.title}`);
          return { toolCallId: id, name, result: list.join('\n') || 'No issues found.' };
        }
        case 'github_create_pr': {
          if (!githubToken || !githubRepo) return { toolCallId: id, name, result: 'Error: No GitHub token or repo configured.', isError: true };
          const [owner, repo] = githubRepo.split('/');
          const res = await fetch(`/api/github/repos/${owner}/${repo}/pulls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `token ${githubToken}` },
            body: JSON.stringify({ title: args.title, body: args.body || '', head: args.head, base: args.base }),
          });
          if (!res.ok) return { toolCallId: id, name, result: `Error: ${res.status}`, isError: true };
          const data = await res.json();
          return { toolCallId: id, name, result: `Created PR #${data.number}: ${data.html_url}` };
        }
        case 'github_list_prs': {
          if (!githubToken || !githubRepo) return { toolCallId: id, name, result: 'Error: No GitHub token or repo configured.', isError: true };
          const [owner, repo] = githubRepo.split('/');
          const res = await fetch(`/api/github/repos/${owner}/${repo}/pulls?state=${args.state || 'open'}`, {
            headers: { Authorization: `token ${githubToken}` },
          });
          if (!res.ok) return { toolCallId: id, name, result: `Error: ${res.status}`, isError: true };
          const data = await res.json();
          const list = data.slice(0, 10).map((pr: any) => `#${pr.number} [${pr.state}] ${pr.title}`);
          return { toolCallId: id, name, result: list.join('\n') || 'No PRs found.' };
        }
        case 'github_search_repos': {
          const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(args.query)}&per_page=5`, {
            headers: githubToken ? { Authorization: `token ${githubToken}` } : {},
          });
          const data = await res.json();
          const list = (data.items || []).map((r: any) => `${r.full_name} ⭐ ${r.stargazers_count} — ${r.description || '(no description)'}`);
          return { toolCallId: id, name, result: list.join('\n') || 'No repos found.' };
        }
        case 'github_read_file': {
          const [owner, repo] = (args.repo || githubRepo).split('/');
          const res = await fetch(`/api/github/repos/${owner}/${repo}/contents/${args.path}`, {
            headers: { Authorization: `token ${githubToken}` },
          });
          if (!res.ok) return { toolCallId: id, name, result: `Error: ${res.status}`, isError: true };
          const data = await res.json();
          if (data.content) {
            const content = decodeURIComponent(escape(atob(data.content)));
            return { toolCallId: id, name, result: content.substring(0, 5000) + (content.length > 5000 ? '\n... (truncated)' : '') };
          }
          return { toolCallId: id, name, result: JSON.stringify(data, null, 2).substring(0, 3000) };
        }
        case 'github_create_file': {
          if (!githubToken) return { toolCallId: id, name, result: 'Error: No GitHub token configured.', isError: true };
          const [owner, repo] = (args.repo || githubRepo).split('/');
          const res = await fetch(`/api/github/repos/${owner}/${repo}/contents/${args.path}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `token ${githubToken}` },
            body: JSON.stringify({ message: args.message, content: btoa(unescape(encodeURIComponent(args.content))) }),
          });
          if (!res.ok) return { toolCallId: id, name, result: `Error: ${res.status}`, isError: true };
          const data = await res.json();
          return { toolCallId: id, name, result: `File created: ${data.content?.path} (commit: ${data.commit?.sha?.slice(0, 7)})` };
        }
        case 'github_list_branches': {
          if (!githubToken) return { toolCallId: id, name, result: 'Error: No GitHub token configured.', isError: true };
          const [owner, repo] = (args.repo || githubRepo).split('/');
          const res = await fetch(`/api/github/repos/${owner}/${repo}/branches`, {
            headers: { Authorization: `token ${githubToken}` },
          });
          if (!res.ok) return { toolCallId: id, name, result: `Error: ${res.status}`, isError: true };
          const data = await res.json();
          return { toolCallId: id, name, result: data.map((b: any) => b.name).join('\n') || 'No branches found.' };
        }

        // ── Terminal Tools ──────────────────────────────────────────────────
        case 'run_terminal_command': {
          terminalService.append('bash', `$ ${args.command}\n`);
          // Commands are dispatched to the terminal; actual execution depends on v86/WebContainer
          return { toolCallId: id, name, result: `Command sent to terminal: ${args.command}` };
        }
        case 'get_terminal_output': {
          return { toolCallId: id, name, result: terminalService.getOutput('bash').slice(-3000) || '(no output)' };
        }
        case 'clear_terminal': {
          return { toolCallId: id, name, result: 'Terminal clear requested. Note: terminal buffer is managed by the terminal component.' };
        }

        // ── Code Analysis Tools ─────────────────────────────────────────────
        case 'analyze_code': {
          const file = files.find(f => f.name === args.path);
          if (!file) return { toolCallId: id, name, result: `Error: File not found: ${args.path}`, isError: true };
          const lines = file.content.split('\n');
          const codeLines = lines.filter(l => l.trim().length > 0 && !l.trim().startsWith('//') && !l.trim().startsWith('*') && !l.trim().startsWith('/*') && !l.trim().startsWith('#'));
          const functions = (file.content.match(/\b(function|const\s+\w+\s*=|(async\s+)?\w+\s*\()/g) || []).length;
          const analysis = [
            `File: ${file.name}`,
            `Language: ${file.language || 'unknown'}`,
            `Total lines: ${lines.length}`,
            `Code lines (non-blank, non-comment): ${codeLines.length}`,
            `Estimated functions/declarations: ${functions}`,
            `File size: ${file.content.length} chars`,
          ];
          return { toolCallId: id, name, result: analysis.join('\n') };
        }
        case 'find_references': {
          const symbol = args.symbol || '';
          const refPath = args.path || '';
          const results: string[] = [];
          for (const f of files) {
            if (refPath && f.name !== refPath) continue;
            const matches = f.content.split('\n').reduce((acc, line, idx) => {
              if (line.includes(symbol)) acc.push(`${f.name}:${idx + 1}: ${line.trim().substring(0, 120)}`);
              return acc;
            }, [] as string[]);
            results.push(...matches);
          }
          return { toolCallId: id, name, result: results.length > 0 ? results.slice(0, 50).join('\n') : `No references found for "${symbol}".` };
        }
        case 'count_lines_of_code': {
          const target = args.path || '';
          let totalLines = 0;
          let totalChars = 0;
          const filtered = target ? files.filter(f => f.name.startsWith(target)) : files;
          filtered.forEach(f => {
            const lines = f.content.split('\n').filter(l => l.trim().length > 0);
            totalLines += lines.length;
            totalChars += f.content.length;
          });
          return { toolCallId: id, name, result: `Files: ${filtered.length}\nLines of code: ${totalLines}\nTotal chars: ${totalChars}` };
        }
        case 'get_language_stats': {
          const langMap: Record<string, { files: number; lines: number }> = {};
          files.forEach(f => {
            const lang = f.language || 'other';
            if (!langMap[lang]) langMap[lang] = { files: 0, lines: 0 };
            langMap[lang].files++;
            langMap[lang].lines += f.content.split('\n').filter(l => l.trim().length > 0).length;
          });
          const stats = Object.entries(langMap)
            .sort((a, b) => b[1].lines - a[1].lines)
            .map(([lang, data]) => `${lang}: ${data.files} files, ${data.lines} lines`);
          return { toolCallId: id, name, result: stats.join('\n') || 'No files in workspace.' };
        }

        // ── UI Tools ────────────────────────────────────────────────────────
        case 'show_notification': {
          const nType = (args.type as any) || 'info';
          notificationService.notify(nType, 'AI Tool', String(args.message));
          return { toolCallId: id, name, result: `Notification shown: [${args.type || 'info'}] ${args.message}` };
        }
        case 'open_file': {
          const file = files.find(f => f.name === args.path);
          if (!file) return { toolCallId: id, name, result: `Error: File not found: ${args.path}`, isError: true };
          // The parent component handles active file selection — we emit a notification
          notificationService.info('Open File', `Opening ${args.path}`);
          return { toolCallId: id, name, result: `Requested to open: ${args.path} (file ID: ${file.id})` };
        }
        case 'set_editor_setting': {
          localStorage.setItem(args.key, String(args.value));
          return { toolCallId: id, name, result: `Setting ${args.key} = ${args.value}` };
        }

        default:
          return { toolCallId: id, name, result: `Unknown tool: ${name}`, isError: true };
      }
    } catch (error: any) {
      return { toolCallId: id, name, result: `Error: ${error.message}`, isError: true };
    }
  }, [files, githubToken, githubRepo, onAddFile, onUpdateFile, onDeleteFile]);

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
          message: `🤖 Nexus AI: ${changeSummary}\n\nApplied via Nexus IDE AI Assistant (v5.5.0)`,
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
    shouldStopRef.current = false;

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
          if (isToolEnabled) tools.push(...toGeminiTools(AI_TOOLS));

          const result = await aiModel.generateContent({ contents, tools: tools.length > 0 ? tools : undefined });
          
          // Check for Gemini function calls in the response
          const candidate = result.response.candidates?.[0];
          const functionCall = candidate?.content?.parts?.find((p: any) => p.functionCall);
          if (functionCall && functionCall.functionCall) {
            const fc = functionCall.functionCall;
            const toolCall: AIToolCall = {
              id: generateToolCallId(),
              name: fc.name,
              arguments: fc.args || {},
            };
            const toolResult = await executeToolCall(toolCall);
            setToolResults(prev => [...prev, toolResult]);
            
            // Send tool result back to the model for follow-up
            const followUpContents = [...contents, {
              role: 'model' as const,
              parts: [{ functionCall: { name: fc.name, args: fc.args } }],
            }, {
              role: 'user' as const,
              parts: [{ functionResponse: { name: fc.name, response: { result: toolResult.result } } }],
            }];
            const followUpResult = await aiModel.generateContent({ contents: followUpContents, tools: tools.length > 0 ? tools : undefined });
            return {
              text: followUpResult.response.text() || '',
              groundingMetadata: followUpResult.response.candidates?.[0]?.groundingMetadata,
              _toolCalls: [toolCall],
              _toolResults: [toolResult],
            };
          }

          return {
            text: result.response.text() || '',
            groundingMetadata: candidate?.groundingMetadata
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
            ...(isToolEnabled ? { tools: toOpenAITools(AI_TOOLS) } : {}),
          });

          // Check for OpenAI tool calls in the response
          const oaiToolCalls = response.choices[0]?.message?.tool_calls;
          if (oaiToolCalls && oaiToolCalls.length > 0) {
            const toolCallResults: AIToolResult[] = [];
            const toolCallsParsed: AIToolCall[] = [];
            
            for (const tc of oaiToolCalls) {
              const toolCall: AIToolCall = {
                id: tc.id,
                name: tc.function.name,
                arguments: JSON.parse(tc.function.arguments || '{}'),
              };
              toolCallsParsed.push(toolCall);
              const toolResult = await executeToolCall(toolCall);
              toolCallResults.push(toolResult);
            }
            
            setToolResults(prev => [...prev, ...toolCallResults]);
            
            // Send tool results back for follow-up
            const followUpMsgs = [...oaiMessages, response.choices[0].message, 
              ...toolCallResults.map(tr => ({
                role: 'tool' as const,
                tool_call_id: tr.toolCallId,
                content: tr.result,
              }))
            ];
            
            const followUpResponse = await client.chat.completions.create({
              model,
              messages: followUpMsgs as any,
              temperature: 0.2,
              max_tokens: 8192,
              ...(isToolEnabled ? { tools: toOpenAITools(AI_TOOLS) } : {}),
            });
            
            return {
              text: followUpResponse.choices[0]?.message?.content || '',
              _toolCalls: toolCallsParsed,
              _toolResults: toolCallResults,
            };
          }

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
            ...(isToolEnabled ? { tools: toAnthropicTools(AI_TOOLS) } : {}),
          });

          // Check for Anthropic tool_use blocks
          const toolUseBlocks = response.content.filter((block: any) => block.type === 'tool_use');
          if (toolUseBlocks.length > 0) {
            const toolCallResults: AIToolResult[] = [];
            const toolCallsParsed: AIToolCall[] = [];
            
            for (const block of toolUseBlocks) {
              const toolCall: AIToolCall = {
                id: block.id,
                name: block.name,
                arguments: block.input || {},
              };
              toolCallsParsed.push(toolCall);
              const toolResult = await executeToolCall(toolCall);
              toolCallResults.push(toolResult);
            }
            
            setToolResults(prev => [...prev, ...toolCallResults]);
            
            // Build tool result content for follow-up
            const toolResultContent = [
              ...response.content,
              ...toolCallResults.map(tr => ({
                type: 'tool_result' as const,
                tool_use_id: tr.toolCallId,
                content: tr.result,
                is_error: tr.isError,
              })),
            ];
            
            const followUpResponse = await anthropic.messages.create({
              model,
              max_tokens: 8192,
              system: systemInstruction,
              messages: [...anthropicMessages, { role: 'user', content: toolResultContent } as any],
              temperature: 0.2,
              ...(isToolEnabled ? { tools: toAnthropicTools(AI_TOOLS) } : {}),
            });
            
            return {
              text: followUpResponse.content.map((block: any) => 'text' in block ? block.text : '').join(''),
              _toolCalls: toolCallsParsed,
              _toolResults: toolCallResults,
            };
          }

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
              stream: false,
              ...(isToolEnabled ? { tools: toOllamaTools(AI_TOOLS) } : {}),
            })
          });
          const data = await response.json();
          return { text: data.message?.content || '' };
        }
        return { text: '' };
      };

      // === STREAMING RESPONSE FUNCTION ===
      const fetchAIResponseStreaming = async (
        provider: string, model: string, key: string, history: Message[],
        onToken: (token: string, full: string) => void
      ): Promise<{ text: string, groundingMetadata?: any }> => {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        if (provider === 'gemini') {
          const genAI = new GoogleGenerativeAI(key);
          const aiModel = genAI.getGenerativeModel({ model, systemInstruction });

          const parts: any[] = [];
          parts.push({ text: fullUserMessage });
          if (messageAttachments) {
            for (const att of messageAttachments) {
              if (att.type === 'image') {
                const base64Data = att.data.replace(/^data:[^;]+;base64,/, '');
                parts.push({ inlineData: { mimeType: att.mimeType, data: base64Data } });
              }
            }
          }

          const contents = history.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          }));
          contents[contents.length - 1] = { role: 'user' as const, parts };

          const tools: any[] = [];
          if (isSearchEnabled) tools.push({ googleSearch: {} });

          const result = await aiModel.generateContentStream({ contents, tools });
          let fullText = '';
          for await (const chunk of result.stream) {
            if (shouldStopRef.current) break;
            const text = chunk.text();
            if (text) {
              fullText += text;
              onToken(text, fullText);
            }
          }
          const finalResponse = await result.response;
          const groundingMetadata = finalResponse.candidates?.[0]?.groundingMetadata;
          return { text: fullText, groundingMetadata };
        } else if (provider === 'openai' || provider === 'groq' || provider === 'deepseek' || provider === 'mistral' || provider === 'meta') {
          const baseURL = provider === 'groq' ? 'https://api.groq.com/openai/v1' :
                          provider === 'deepseek' ? 'https://api.deepseek.com' :
                          provider === 'mistral' ? 'https://api.mistral.ai/v1' : undefined;

          const oaiMessages: any[] = [{ role: 'system', content: systemInstruction }];
          for (let i = 0; i < history.length - 1; i++) {
            oaiMessages.push({ role: history[i].role, content: history[i].content });
          }

          const lastMsgParts: any[] = [{ type: 'text', text: fullUserMessage }];
          if (messageAttachments) {
            for (const att of messageAttachments) {
              if (att.type === 'image') {
                lastMsgParts.push({ type: 'image_url', image_url: { url: att.data } });
              }
            }
          }
          oaiMessages.push({ role: 'user', content: lastMsgParts.length === 1 ? lastMsgParts[0].text : lastMsgParts });

          const endpoint = (baseURL || 'https://api.openai.com/v1') + '/chat/completions';
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({ model, messages: oaiMessages, temperature: 0.2, max_tokens: 8192, stream: true }),
            signal: abortController.signal
          });

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API error ${response.status}: ${errorBody}`);
          }

          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let fullText = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') break;
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullText += content;
                    onToken(content, fullText);
                  }
                } catch {}
              }
            }
          }
          return { text: fullText };
        } else if (provider === 'anthropic') {
          const anthropic = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });

          const anthropicMessages: any[] = [];
          for (let i = 0; i < history.length - 1; i++) {
            anthropicMessages.push({ role: history[i].role, content: history[i].content });
          }

          const lastContent: any[] = [{ type: 'text', text: fullUserMessage }];
          if (messageAttachments) {
            for (const att of messageAttachments) {
              if (att.type === 'image') {
                const base64Data = att.data.replace(/^data:[^;]+;base64,/, '');
                lastContent.push({ type: 'image', source: { type: 'base64', media_type: att.mimeType, data: base64Data } });
              }
            }
          }
          anthropicMessages.push({ role: 'user', content: lastContent });

          const stream = anthropic.messages.stream({
            model,
            max_tokens: 8192,
            system: systemInstruction,
            messages: anthropicMessages as any,
            temperature: 0.2,
          });

          let fullText = '';
          for await (const event of stream) {
            if (shouldStopRef.current) break;
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              fullText += event.delta.text;
              onToken(event.delta.text, fullText);
            }
          }
          return { text: fullText };
        } else if (provider === 'ollama') {
          const response = await fetch(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            body: JSON.stringify({
              model: model || 'llama3',
              messages: [
                { role: 'system', content: systemInstruction },
                ...history.map(m => ({ role: m.role, content: m.content }))
              ],
              stream: true
            }),
            signal: abortController.signal
          });

          if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
          }

          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let fullText = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const parsed = JSON.parse(line);
                  const content = parsed.message?.content;
                  if (content) {
                    fullText += content;
                    onToken(content, fullText);
                  }
                } catch {}
              }
            }
          }
          return { text: fullText };
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
        let responseData: { text: string, groundingMetadata?: any, _toolCalls?: AIToolCall[], _toolResults?: AIToolResult[] };

        if (isStreamEnabled) {
          // === STREAMING PATH ===
          setIsStreaming(true);
          setStreamingContent('');
          streamingContentRef.current = '';

          responseData = await fetchAIResponseStreaming(
            selectedProvider, selectedModel, apiKey, newMessages,
            (_token, full) => {
              setStreamingContent(full);
              streamingContentRef.current = full;
            }
          );

          setIsStreaming(false);
          setStreamingContent('');
          streamingContentRef.current = '';
        } else {
          // === NON-STREAMING PATH (fallback) ===
          responseData = await fetchAIResponse(selectedProvider, selectedModel, apiKey, newMessages);
        }

        const responseText = responseData.text;
        const responseToolCalls = (responseData as any)._toolCalls;
        const responseToolResults = (responseData as any)._toolResults;

        // If tools were called, show them in the message
        if (responseToolCalls && responseToolCalls.length > 0 && responseToolResults) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: responseText || '(Tool calls executed — see results below)',
            groundingMetadata: responseData.groundingMetadata,
            toolCalls: responseToolCalls,
            toolResults: responseToolResults,
          }]);
        } else {
          // Check for file system actions
          const folderRegex = /\[CREATE_FOLDER:\s*"([^"]+)"\]/g;
          const fileRegex = /\[WRITE_FILE:\s*"([^"]+)",\s*"([\s\S]*?)"\]/g;
          const actions: any[] = [];
          let m;
          while ((m = folderRegex.exec(responseText))) actions.push({ type: 'folder', name: m[1] });
          while ((m = fileRegex.exec(responseText))) actions.push({ type: 'file', name: m[1], content: m[2] });

          if (actions.length > 0) {
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
      }
    } catch (error: any) {
      // Handle user-initiated abort (stop button)
      if (shouldStopRef.current && streamingContentRef.current) {
        const partialContent = streamingContentRef.current;
        setMessages(prev => [...prev, { role: 'assistant', content: partialContent + '\n\n⏹️ (stopped)' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
      streamingContentRef.current = '';
      abortControllerRef.current = null;
      shouldStopRef.current = false;
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
          <span className="text-xs font-bold text-white uppercase tracking-wider truncate">Nexus AI 5.5</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsStreamEnabled(!isStreamEnabled)} className={cn("p-1 rounded transition-colors", isStreamEnabled ? "bg-emerald-500 text-white" : "text-nexus-text-muted hover:bg-nexus-bg")} title={isStreamEnabled ? "Streaming ON — responses stream in real-time" : "Streaming OFF — wait for full response"}><Radio size={14} /></button>
          <button onClick={() => setIsToolEnabled(!isToolEnabled)} className={cn("p-1 rounded transition-colors", isToolEnabled ? "bg-purple-500 text-white" : "text-nexus-text-muted hover:bg-nexus-bg")} title={isToolEnabled ? "AI Tools ON — assistant can use tools" : "AI Tools OFF"}><Wrench size={14} /></button>
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
            <p className="font-bold text-white mb-1">Nexus AI 5.5</p>
            <p className="text-xs opacity-75">Ready to assist.</p>
            <p className="text-[10px] opacity-50 mt-2">📎 Attach files or images below</p>
            {isStreamEnabled && (
              <p className="text-[10px] opacity-50 mt-1">🟢 Streaming enabled — responses stream in real-time</p>
            )}
            {isToolEnabled && (
              <p className="text-[10px] opacity-50 mt-1">🔧 AI Tools enabled — assistant can use {AI_TOOLS.length} tools</p>
            )}
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
                {/* Show tool calls and results */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Wrench size={10} className="text-purple-400" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-purple-300">
                        {msg.toolCalls.length} Tool Call{msg.toolCalls.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {(msg.toolResults || []).map((tr, tri) => {
                      const isExpanded = expandedToolResults.has(tr.toolCallId);
                      return (
                        <div key={tr.toolCallId} className="bg-black/30 rounded-md mb-1 overflow-hidden border border-white/5">
                          <button
                            onClick={() => toggleToolResultExpanded(tr.toolCallId)}
                            className="flex items-center gap-1.5 w-full px-2 py-1 text-left hover:bg-white/5 transition-colors"
                          >
                            {isExpanded ? <ChevronDown size={9} className="text-nexus-text-muted" /> : <ChevronRight size={9} className="text-nexus-text-muted" />}
                            <span className="text-[9px] font-mono font-bold text-purple-300">{tr.name}</span>
                            <span className="text-[8px] text-nexus-text-muted ml-auto">
                              {tr.isError ? '⚠️ error' : '✓ ok'}
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="px-2 pb-2">
                              <div className="text-[8px] text-nexus-text-muted mb-1 font-mono">
                                {msg.toolCalls?.find(tc => tc.id === tr.toolCallId) && (
                                  <span className="opacity-60">
                                    args: {JSON.stringify(msg.toolCalls.find(tc => tc.id === tr.toolCallId)?.arguments || {}).substring(0, 200)}
                                  </span>
                                )}
                              </div>
                              <pre className="text-[9px] bg-black/40 rounded p-1.5 overflow-x-auto max-h-32 overflow-y-auto text-green-300/80 font-mono whitespace-pre-wrap custom-scrollbar">
                                {typeof tr.result === 'string' ? tr.result.substring(0, 1000) + (tr.result.length > 1000 ? '...' : '') : JSON.stringify(tr.result, null, 2).substring(0, 1000)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Streaming indicator — replaces loading spinner when streaming */}
        {isStreaming && (
          <div className="flex w-full flex-col min-w-0 items-start">
            <div className="bg-nexus-sidebar text-nexus-text border-nexus-border rounded-xl rounded-tl-none max-w-[95%] min-w-0 w-full p-3 shadow-sm border overflow-hidden">
              <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase font-bold tracking-wider">
                AI
              </div>
              <div className="whitespace-pre-wrap leading-relaxed overflow-x-auto max-w-full break-words selection:bg-nexus-accent/30 custom-scrollbar pb-1">
                {streamingContent ? (
                  <span className="nexus-streaming-cursor">{streamingContent}</span>
                ) : (
                  <div className="flex gap-1.5"><div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce delay-100" /><div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce delay-200" /></div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Non-streaming loading indicator */}
        {isLoading && !isStreaming && (
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
            disabled={isStreaming}
          >
            <Paperclip size={16} />
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="p-2 text-nexus-text-muted hover:text-purple-400 hover:bg-nexus-bg rounded-lg transition-colors"
            title="Attach image"
            disabled={isStreaming}
          >
            <ImageIcon size={16} />
          </button>
          <input value={input} onChange={e => setInput(e.target.value)} disabled={isLoading || isStreaming} placeholder={isStreaming ? "Streaming..." : "Message AI..."} className="flex-1 bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-nexus-accent" />
          {isStreaming ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="bg-red-500 hover:bg-red-600 text-white rounded-lg p-2 transition-colors flex items-center justify-center"
              title="Stop streaming"
            >
              <Square size={16} />
            </button>
          ) : (
            <button type="submit" disabled={isLoading || !input.trim()} className="bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg p-2 transition-colors flex items-center justify-center"><Send size={16} /></button>
          )}
        </form>
      </div>
    </div>
  );
});

export default AIAssistant;
