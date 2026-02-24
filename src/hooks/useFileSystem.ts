import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface FileNode {
  id: string;
  name: string;
  content: string;
  originalContent?: string;
  language: string;
}

const DEFAULT_FILES: FileNode[] = [
  {
    id: '1',
    name: 'index.html',
    content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Nexus IDE</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div id="app">\n    <h1>Hello Nexus!</h1>\n    <p>Edit files to see changes instantly.</p>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>',
    language: 'html',
  },
  {
    id: '2',
    name: 'style.css',
    content: 'body {\n  font-family: system-ui, sans-serif;\n  background-color: #1e1e1e;\n  color: #d4d4d4;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n}\n\nh1 {\n  color: #569cd6;\n}',
    language: 'css',
  },
  {
    id: '3',
    name: 'script.js',
    content: 'console.log("Welcome to Nexus IDE");\n\n// You can interact with the DOM\nsetTimeout(() => {\n  const app = document.getElementById("app");\n  if (app) {\n    app.innerHTML += "<p>JavaScript is running!</p>";\n  }\n}, 1000);',
    language: 'javascript',
  },
  {
    id: '4',
    name: 'main.py',
    content: 'print("Hello from Python in Nexus IDE!")\n\n# This will be executed by Pyodide in the preview\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))',
    language: 'python',
  }
];

export function useFileSystem() {
  const [files, setFiles] = useState<FileNode[]>(() => {
    const saved = localStorage.getItem('nexus_files');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_FILES;
  });

  useEffect(() => {
    localStorage.setItem('nexus_files', JSON.stringify(files));
  }, [files]);

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

  const updateFile = (id: string, content: string, updateOriginal = false) => {
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
        const language = langMap[ext || ''] || f.language;
        return { ...f, name: newName, language };
      }
      return f;
    }));
  };

  return { files, addFile, updateFile, deleteFile, renameFile };
}
