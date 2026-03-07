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
    content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Nexus 4.0 Project</title>\n  <script src="https://cdn.tailwindcss.com"></script>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body class="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center p-8">\n  <div id="app" class="max-w-2xl w-full bg-slate-800/50 backdrop-blur-xl p-12 rounded-3xl border border-white/10 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-700">\n    <div class="w-24 h-24 bg-indigo-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-12 hover:rotate-0 transition-transform duration-500">\n      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>\n    </div>\n    <h1 class="text-5xl font-black tracking-tighter bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">NEXUS 4.0</h1>\n    <p class="text-slate-400 text-lg font-medium leading-relaxed">Welcome to your new high-performance workspace. Edit files to see changes instantly with real-time preview.</p>\n    <div class="pt-6 flex gap-4 justify-center">\n      <button class="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest text-xs">Get Started</button>\n      <button class="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-bold transition-all border border-white/10 uppercase tracking-widest text-xs">Documentation</button>\n    </div>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>',
    language: 'html',
  },
  {
    id: '2',
    name: 'style.css',
    content: '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap");\n\n:root {\n  --nexus-accent: #6366f1;\n}\n\nbody {\n  font-family: "Inter", system-ui, sans-serif;\n  margin: 0;\n  overflow-x: hidden;\n}\n\n#app {\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n\n#app:hover {\n  transform: translateY(-4px);\n}',
    language: 'css',
  },
  {
    id: '3',
    name: 'script.js',
    content: '// Nexus 4.0 Runtime\nconsole.log("%c NEXUS 4.0 %c Ready ", "background: #6366f1; color: white; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 6px;", "background: #1e293b; color: #94a3b8; border-radius: 0 4px 4px 0; padding: 2px 6px;");\n\n// Interactive elements\ndocument.querySelectorAll("button").forEach(btn => {\n  btn.addEventListener("click", () => {\n    console.log(`%c Action %c ${btn.innerText} clicked`, "color: #6366f1; font-weight: bold;", "color: inherit;");\n    btn.style.transform = "scale(0.95)";\n    setTimeout(() => btn.style.transform = "", 100);\n  });\n});',
    language: 'javascript',
  },
  {
    id: '4',
    name: 'nexus.config.json',
    content: '{\n  "version": "4.0.0",\n  "theme": "dark",\n  "features": {\n    "ai_assistant": true,\n    "pwa_sync": true,\n    "collaboration": true\n  }\n}',
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
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFiles(parsed);
              // Migrate to IDB
              for (const f of parsed) {
                await db.put('files', f);
              }
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
