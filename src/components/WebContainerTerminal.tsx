/**
 * WebContainer Terminal Component for Nexus IDE
 * Provides a terminal interface for running Node.js applications in the browser
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Square, RefreshCw, Download, Upload, Terminal as TerminalIcon, AlertCircle, CheckCircle, Loader2, ExternalLink, Folder, File } from 'lucide-react';
import webcontainerService, { WebContainerState } from '../services/webcontainerService';
import { FileNode } from '../hooks/useFileSystem';

interface WebContainerTerminalProps {
  files: FileNode[];
  onFileUpdate?: (path: string, content: string) => void;
  className?: string;
}

export default function WebContainerTerminal({ files, onFileUpdate, className = '' }: WebContainerTerminalProps) {
  const [state, setState] = useState<WebContainerState>(webcontainerService.getState());
  const [output, setOutput] = useState<string[]>([]);
  const [command, setCommand] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [projectFiles, setProjectFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Check support and subscribe to output
  useEffect(() => {
    setIsSupported(webcontainerService.isSupported());

    const unsubOutput = webcontainerService.onOutput((out) => {
      setOutput(prev => [...prev.slice(-500), out]); // Keep last 500 lines
    });

    const unsubUrl = webcontainerService.onUrlReady((url, port) => {
      setState(webcontainerService.getState());
    });

    return () => {
      unsubOutput();
      unsubUrl();
    };
  }, []);

  // Sync files when they change
  useEffect(() => {
    setProjectFiles(files);
  }, [files]);

  const handleBoot = async () => {
    try {
      await webcontainerService.boot();
      setState(webcontainerService.getState());
    } catch (error: any) {
      console.error('Failed to boot WebContainer:', error);
    }
  };

  const handleMountFiles = async () => {
    try {
      const filesToMount = await webcontainerService.ensurePackageJson(projectFiles);
      await webcontainerService.mountFiles(filesToMount);
      setProjectFiles(filesToMount);
    } catch (error: any) {
      console.error('Failed to mount files:', error);
    }
  };

  const handleInstall = async () => {
    try {
      await webcontainerService.installDependencies();
    } catch (error: any) {
      console.error('Failed to install dependencies:', error);
    }
  };

  const handleRunDev = async () => {
    try {
      // Boot if not booted
      if (!state.isBooted) {
        await handleBoot();
      }
      
      // Mount files
      await handleMountFiles();
      
      // Install dependencies
      await webcontainerService.installDependencies();
      
      // Start dev server
      await webcontainerService.startDevServer();
    } catch (error: any) {
      console.error('Failed to run dev server:', error);
    }
  };

  const handleRunScript = async (script: string) => {
    try {
      if (!state.isBooted) {
        await handleBoot();
        await handleMountFiles();
      }
      await webcontainerService.runScript(script);
    } catch (error: any) {
      console.error('Failed to run script:', error);
    }
  };

  const handleRunNode = async (filename: string) => {
    try {
      if (!state.isBooted) {
        await handleBoot();
        await handleMountFiles();
      }
      await webcontainerService.runNode(filename);
    } catch (error: any) {
      console.error('Failed to run Node script:', error);
    }
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const parts = command.trim().split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    setOutput(prev => [...prev, `$ ${command}\n`]);

    try {
      if (!state.isBooted) {
        await handleBoot();
        await handleMountFiles();
      }
      await webcontainerService.spawn(cmd, args);
    } catch (error: any) {
      setOutput(prev => [...prev, `Error: ${error.message}\n`]);
    }

    setCommand('');
  };

  const handleClearOutput = () => {
    setOutput([]);
    webcontainerService.clearOutput();
  };

  const handleReadFile = async () => {
    if (!selectedFile || !state.isBooted) return;
    
    try {
      const content = await webcontainerService.readFile(selectedFile);
      setOutput(prev => [...prev, `--- ${selectedFile} ---\n${content}\n---\n`]);
    } catch (error: any) {
      setOutput(prev => [...prev, `Error reading file: ${error.message}\n`]);
    }
  };

  const handleListFiles = async () => {
    if (!state.isBooted) return;
    
    try {
      const entries = await webcontainerService.readDir('/');
      setOutput(prev => [...prev, '--- Root Directory ---\n', ...entries.map(e => `${e}\n`), '---\n']);
    } catch (error: any) {
      setOutput(prev => [...prev, `Error listing files: ${error.message}\n`]);
    }
  };

  // Quick actions for common operations
  const quickActions = [
    { label: 'Boot', icon: Play, action: handleBoot, color: 'text-green-400', disabled: state.isBooted },
    { label: 'Mount Files', icon: Upload, action: handleMountFiles, color: 'text-blue-400', disabled: !state.isBooted },
    { label: 'npm install', icon: Download, action: handleInstall, color: 'text-yellow-400', disabled: !state.isBooted },
    { label: 'npm run dev', icon: Play, action: handleRunDev, color: 'text-purple-400', disabled: false },
    { label: 'List Files', icon: Folder, action: handleListFiles, color: 'text-cyan-400', disabled: !state.isBooted },
  ];

  if (!isSupported) {
    return (
      <div className={`h-full flex flex-col bg-slate-950 text-slate-300 ${className}`}>
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <TerminalIcon size={18} className="text-orange-400" />
          <span className="font-bold text-sm">WebContainer Terminal</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <AlertCircle size={48} className="mx-auto text-orange-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">WebContainer Not Supported</h3>
            <p className="text-sm text-slate-400 mb-4">
              WebContainer requires cross-origin isolation (SharedArrayBuffer). 
              Make sure the server is running with proper COOP/COEP headers.
            </p>
            <p className="text-xs text-slate-500">
              Run the development server with: <code className="bg-slate-800 px-2 py-1 rounded">npm run dev</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-slate-950 text-slate-300 ${className}`}>
      {/* Header */}
      <div className="p-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon size={16} className="text-green-400" />
          <span className="font-bold text-sm">WebContainer</span>
          {state.isBooted && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle size={12} />
              Ready
            </span>
          )}
          {state.error && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <AlertCircle size={12} />
              Error
            </span>
          )}
        </div>
        
        {/* Status indicator */}
        {state.url && (
          <a 
            href={state.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <ExternalLink size={12} />
            Port {state.port}
          </a>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-b border-slate-800 flex flex-wrap gap-1">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={action.action}
            disabled={action.disabled}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
          >
            <action.icon size={12} />
            {action.label}
          </button>
        ))}
        <button
          onClick={handleClearOutput}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
        >
          <RefreshCw size={12} />
          Clear
        </button>
      </div>

      {/* Output Area */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-auto p-3 font-mono text-xs bg-slate-950 whitespace-pre-wrap break-all"
      >
        {output.length === 0 ? (
          <div className="text-slate-500 italic">
            WebContainer Terminal - Run Node.js in your browser!{'\n'}
            Click "Boot" to start, then "Mount Files" to load your project.{'\n'}
            Supports: npm, node, and most Node.js packages.
          </div>
        ) : (
          output.map((line, i) => (
            <div key={i} className={`
              ${line.startsWith('[WebContainer Error]') ? 'text-red-400' : ''}
              ${line.startsWith('[WebContainer]') ? 'text-cyan-400' : ''}
              ${line.startsWith('$') ? 'text-green-400' : ''}
            `}>
              {line}
            </div>
          ))
        )}
      </div>

      {/* Command Input */}
      <form onSubmit={handleCommand} className="border-t border-slate-800 p-2 flex gap-2">
        <span className="text-green-400 font-mono">$</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command (e.g., npm install lodash)"
          className="flex-1 bg-transparent text-sm outline-none font-mono placeholder:text-slate-600"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={!command.trim()}
          className="px-3 py-1 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-bold rounded transition-colors"
        >
          Run
        </button>
      </form>

      {/* File Browser (Optional) */}
      {showFileBrowser && state.isBooted && (
        <div className="border-t border-slate-800 p-2 max-h-48 overflow-auto">
          <div className="text-xs font-bold mb-2 text-slate-400">Project Files</div>
          <div className="grid grid-cols-2 gap-1">
            {projectFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => setSelectedFile(file.name)}
                className={`flex items-center gap-1 p-1 text-xs rounded ${
                  selectedFile === file.name ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                <File size={12} />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>
          {selectedFile && (
            <button
              onClick={handleReadFile}
              className="mt-2 w-full py-1 bg-blue-600 hover:bg-blue-500 text-xs rounded"
            >
              Read: {selectedFile}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
