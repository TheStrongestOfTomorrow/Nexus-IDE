import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { openDB } from 'idb';

export interface FileNode {
  id: string;
  name: string;
  content: string;
  originalContent?: string;
  language: string;
  handle?: FileSystemFileHandle;
}

const DEFAULT_FILES: FileNode[] = [
  {
    id: '1',
    name: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus v5.5.6 | The AI-First IDE</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --nexus-accent: #6366f1;
      --nexus-bg: #0f172a;
    }
    @keyframes pulse-slow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    .animate-pulse-slow { animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
  </style>
</head>
<body class="bg-[#020617] text-white min-h-screen flex flex-col items-center justify-center p-6 font-sans">
  <!-- Decorative background -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px]"></div>
    <div class="absolute -bottom-[20%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>
  </div>

  <div id="app" class="max-w-3xl w-full glass p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center space-y-8 relative z-10 animate-in fade-in zoom-in duration-1000">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest animate-pulse-slow">
      <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
      Version 5.5.6 Freedom Update
    </div>

    <div class="relative">
      <div class="w-24 h-24 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-600/40 rotate-12 hover:rotate-0 transition-all duration-500 group">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white group-hover:scale-110 transition-transform"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
      </div>
    </div>

    <div class="space-y-4">
      <h1 class="text-5xl md:text-6xl font-black tracking-tighter text-white">
        NEXUS <span class="text-indigo-500">IDE</span>
      </h1>
      <p class="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-xl mx-auto">
        Your new high-performance, AI-first workspace.
        Experience real Linux, AI streaming, and secure collaboration.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
      <div class="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
        <div class="text-indigo-400 font-bold text-xs uppercase tracking-tight">AI Streaming</div>
        <p class="text-[11px] text-slate-400">Token-by-token responses from 12+ providers including Gemini 2.0 & GPT-4o.</p>
      </div>
      <div class="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
        <div class="text-emerald-400 font-bold text-xs uppercase tracking-tight">v86 Linux</div>
        <p class="text-[11px] text-slate-400">A real Alpine Linux environment running entirely in your browser with no server.</p>
      </div>
      <div class="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
        <div class="text-purple-400 font-bold text-xs uppercase tracking-tight">AI Tools</div>
        <p class="text-[11px] text-slate-400">51 powerful tools allowing AI to read/write files, manage git, and run terminal commands.</p>
      </div>
    </div>

    <div class="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
      <button class="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-xs active:scale-95">Get Started</button>
      <button class="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all border border-white/10 uppercase tracking-widest text-xs active:scale-95">Documentation</button>
    </div>

    <div class="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
      <span>WORKSPACE_ID: NEXUS-AUTO-GEN</span>
      <span class="flex items-center gap-1">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        SYSTEM_READY
      </span>
    </div>
  </div>

  <footer class="mt-12 text-slate-600 text-[10px] uppercase tracking-[0.2em] font-bold">
    Built for the future of development
  </footer>

  <script src="script.js"></script>
</body>
</html>`,
    language: 'html',
  },
  {
    id: '2',
    name: 'style.css',
    content: `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap");

:root {
  --nexus-accent: #6366f1;
}

body {
  font-family: "Inter", system-ui, sans-serif;
  margin: 0;
  overflow-x: hidden;
}

#app {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.glass:hover {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.1);
}`,
    language: 'css',
  },
  {
    id: '3',
    name: 'script.js',
    content: `// Nexus v5.5.6 Freedom Runtime
console.log("%c NEXUS IDE %c v5.5.6 ", "background: #6366f1; color: white; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 6px;", "background: #1e293b; color: #94a3b8; border-radius: 0 4px 4px 0; padding: 2px 6px;");

// Interactive element animations
document.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    console.log(\`%c Action %c \${btn.innerText} clicked\`, "color: #6366f1; font-weight: bold;", "color: inherit;");

    // Feedback animation
    btn.style.transform = "scale(0.95)";
    setTimeout(() => {
      btn.style.transform = "";
    }, 100);
  });
});

// Auto-init telemetry
window.addEventListener('load', () => {
  const app = document.getElementById('app');
  if (app) {
    app.classList.remove('opacity-0');
    console.log("Nexus Environment: ONLINE");
  }
});`,
    language: 'javascript',
  },
  {
    id: '4',
    name: 'nexus.config.json',
    content: '{\n  "version": "5.5.6",\n  "theme": "dark",\n  "features": {\n    "ai_streaming": true,\n    "v86_linux": true,\n    "ai_tools": 51,\n    "secure_collab": true\n  }\n}',
    language: 'json',
  }
];

export function useFileSystem() {
  const [files, setFiles] = useState<FileNode[]>(DEFAULT_FILES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize DB and load files
  useEffect(() => {
    async function initDB() {
      try {
        const db = await openDB('nexus-workspace', 1, {
          upgrade(db) {
            db.createObjectStore('files', { keyPath: 'id' });
          },
        });

        const savedFiles = await db.getAll('files');
        if (savedFiles && savedFiles.length > 0) {
          setFiles(savedFiles);
        } else {
          // Fallback to localStorage for migration
          const legacy = localStorage.getItem('nexus_files');
          if (legacy) {
            try {
              const parsed = JSON.parse(legacy);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setFiles(parsed);
                // Migrate to IDB
                for (const f of parsed) {
                  await db.put('files', f);
                }
              }
            } catch (parseErr) {
              console.error('Failed to parse legacy files:', parseErr);
            }
          }
        }
      } catch (err) {
        console.error('Failed to init IndexedDB:', err);
        // Fallback to localStorage
        const legacy = localStorage.getItem('nexus_files');
        if (legacy) {
          try {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed) && parsed.length > 0) setFiles(parsed);
          } catch (e) {}
        }
      } finally {
        setIsLoaded(true);
      }
    }
    initDB();
  }, []);

  // Sync to DB on change
  useEffect(() => {
    if (!isLoaded) return;
    
    async function syncDB() {
      try {
        const db = await openDB('nexus-workspace', 1);
        const tx = db.transaction('files', 'readwrite');
        await tx.store.clear();
        for (const f of files) {
          // Don't store handles in IDB as they are not serializable across sessions easily without permission re-grant
          const { handle, ...rest } = f;
          await tx.store.put(rest);
        }
        await tx.done;
        
        // Also sync to localStorage as secondary backup
        localStorage.setItem('nexus_files', JSON.stringify(files.map(({ handle, ...rest }) => rest)));
      } catch (err) {
        console.error('Failed to sync to IndexedDB:', err);
      }
    }
    syncDB();
  }, [files, isLoaded]);

  useEffect(() => {
    // File System Observer API (experimental)
    if ('FileSystemObserver' in window) {
      try {
        // @ts-ignore
        const observer = new FileSystemObserver((records) => {
          for (const record of records) {
            console.log('External change detected:', record.handle.name);
            // In a real app with FileSystemHandle, we would re-read the file here.
            // For this demo, we'll just log it to show the "hardened" infrastructure.
          }
        });
        // observer.observe(someDirectoryHandle);
      } catch (err) {
        console.warn('FileSystemObserver not supported or failed to init');
      }
    }
  }, []);

  const addFile = (name: string, content: string = '') => {
    const ext = name.split('.').pop()?.toLowerCase();
    let language = 'plaintext';
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'py': 'python',
      'json': 'json',
      'md': 'markdown',
      'sql': 'sql',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'php': 'php',
      'cpp': 'cpp',
      'c': 'c',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
    };
    language = langMap[ext || ''] || 'plaintext';

    const newFile: FileNode = {
      id: uuidv4(),
      name,
      content,
      originalContent: content,
      language,
    };
    setFiles(prev => [...prev, newFile]);
    return newFile;
  };

  const updateFile = async (id: string, content: string, updateOriginal = false) => {
    const file = files.find(f => f.id === id);
    if (file?.handle) {
      try {
        // @ts-ignore
        const writable = await file.handle.createWritable();
        await writable.write(content);
        await writable.close();
        console.log('File synced to local system:', file.name);
      } catch (err) {
        console.error('Failed to sync file to local system:', err);
      }
    }

    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        return { 
          ...f, 
          content, 
          originalContent: updateOriginal ? content : (f.originalContent ?? f.content) 
        };
      }
      return f;
    }));
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const renameFile = (id: string, newName: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        const ext = newName.split('.').pop()?.toLowerCase();
        const langMap: Record<string, string> = {
          'js': 'javascript', 'ts': 'typescript', 'jsx': 'javascript', 'tsx': 'typescript',
          'html': 'html', 'htm': 'html', 'css': 'css', 'py': 'python', 'json': 'json',
          'md': 'markdown', 'sql': 'sql', 'yaml': 'yaml', 'yml': 'yaml',
        };
        const language = langMap[ext || ''] || f.language;
        return { ...f, name: newName, language };
      }
      return f;
    }));
  };

  const openDirectory = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('File System Access API is not supported in this browser.');
      return;
    }

    try {
      // @ts-ignore
      const directoryHandle = await window.showDirectoryPicker();
      const newFiles: FileNode[] = [];

      async function readDir(handle: FileSystemDirectoryHandle, path = '') {
        // @ts-ignore
        for await (const entry of handle.values()) {
          const entryPath = path ? `${path}/${entry.name}` : entry.name;
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            const content = await file.text();
            const ext = entry.name.split('.').pop()?.toLowerCase();
            const langMap: Record<string, string> = {
              'js': 'javascript', 'ts': 'typescript', 'jsx': 'javascript', 'tsx': 'typescript',
              'html': 'html', 'htm': 'html', 'css': 'css', 'py': 'python', 'json': 'json',
              'md': 'markdown', 'sql': 'sql', 'yaml': 'yaml', 'yml': 'yaml',
            };
            newFiles.push({
              id: uuidv4(),
              name: entryPath,
              content,
              originalContent: content,
              language: langMap[ext || ''] || 'plaintext',
              handle: entry as FileSystemFileHandle,
            });
          } else if (entry.kind === 'directory') {
            await readDir(entry, entryPath);
          }
        }
      }

      await readDir(directoryHandle);
      if (newFiles.length > 0) {
        setFiles(newFiles);
      }
    } catch (err) {
      console.error('Failed to open directory:', err);
    }
  };

  return { files, addFile, updateFile, deleteFile, renameFile, openDirectory, isLoaded };
}
