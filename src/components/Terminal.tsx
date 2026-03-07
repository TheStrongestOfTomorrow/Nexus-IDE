import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { socketService } from '../services/socketService';
import { terminalService } from '../services/terminalService';
import { X, Terminal as TerminalIcon, Cpu, Loader2, ScrollText } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';
import { cn } from '../lib/utils';

interface TerminalProps {
  files: FileNode[];
  onClose: () => void;
  onPreview?: () => void;
}

export default function Terminal({ files, onClose, onPreview }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isPyodideLoading, setIsPyodideLoading] = useState(false);
  const pyodideRef = useRef<any>(null);
  const currentLineRef = useRef('');
  const [activeStream, setActiveStream] = useState<'bash' | 'scripts'>('bash');

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#cccccc',
        cursor: '#00ff00',
        selectionBackground: 'rgba(0, 255, 0, 0.3)',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    if (activeStream === 'bash') {
      term.writeln('\x1b[1;32mWelcome to Nexus Shell v4.0\x1b[0m');
      term.writeln('Type \x1b[1;36m"help"\x1b[0m to see available local commands.');
      term.write('\r\n\x1b[1;32m$\x1b[0m ');
    } else {
      term.writeln('\x1b[1;33mNexus Script Logs\x1b[0m');
      term.writeln('Background script output will appear here.');
      term.writeln('------------------------------------------');
      const logs = terminalService.getOutput('scripts');
      if (logs) term.write(logs.replace(/\n/g, '\r\n'));
    }

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleCommand = async (command: string) => {
      if (activeStream !== 'bash') return;
      const args = command.trim().split(' ');
      const cmd = args[0].toLowerCase();

      if (cmd === 'help') {
        term.writeln('\r\nAvailable Local Commands:');
        term.writeln('  python [file]   Run a python file or start REPL (Pyodide)');
        term.writeln('  npm run dev     Start local preview server');
        term.writeln('  ls              List files in workspace');
        term.writeln('  clear           Clear terminal');
        term.writeln('  help            Show this help');
      } else if (cmd === 'ls') {
        term.writeln('\r\n' + files.map(f => f.name).join('\n'));
      } else if (cmd === 'clear') {
        term.clear();
      } else if (cmd === 'npm' && args[1] === 'run' && args[2] === 'dev') {
        term.writeln('\r\n\x1b[1;32m> Starting Nexus Preview Server...\x1b[0m');
        term.writeln('> Local: http://localhost:3000');
        if (onPreview) onPreview();
      } else if (cmd === 'python') {
        if (!pyodideRef.current) {
          setIsPyodideLoading(true);
          term.writeln('\r\n\x1b[1;33mLoading Pyodide runtime...\x1b[0m');
          try {
            // @ts-ignore
            pyodideRef.current = await window.loadPyodide();
            setIsPyodideLoading(false);
            term.writeln('\x1b[1;32mPyodide loaded successfully.\x1b[0m');
          } catch (err) {
            setIsPyodideLoading(false);
            term.writeln('\x1b[1;31mFailed to load Pyodide.\x1b[0m');
            return;
          }
        }

        const fileName = args[1];
        if (fileName) {
          const file = files.find(f => f.name === fileName || f.name.endsWith('/' + fileName));
          if (file) {
            term.writeln(`\r\n\x1b[1;34mRunning ${file.name}...\x1b[0m`);
            try {
              pyodideRef.current.setStdout({ batched: (s: string) => term.writeln(s) });
              pyodideRef.current.setStderr({ batched: (s: string) => term.writeln('\x1b[1;31m' + s + '\x1b[0m') });
              await pyodideRef.current.runPythonAsync(file.content);
            } catch (err: any) {
              term.writeln('\x1b[1;31m' + err.message + '\x1b[0m');
            }
          } else {
            term.writeln(`\r\nFile not found: ${fileName}`);
          }
        } else {
          term.writeln('\r\nPython REPL not fully supported in this shell yet. Use "python [file]".');
        }
      } else {
        // Fallback to socket terminal if connected
        socketService.send({ type: 'terminal-input', data: command + '\n' });
      }
    };

    term.onData((data) => {
      if (activeStream !== 'bash') return;
      if (data === '\r') { // Enter
        handleCommand(currentLineRef.current);
        currentLineRef.current = '';
        term.write('\r\n$ ');
      } else if (data === '\u007f') { // Backspace
        if (currentLineRef.current.length > 0) {
          currentLineRef.current = currentLineRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else {
        currentLineRef.current += data;
        term.write(data);
      }
    });

    if (activeStream === 'bash') {
      socketService.send({ type: 'terminal-init' });
    }

    const unsubscribe = socketService.subscribe((msg) => {
      if (msg.type === 'terminal-output' && activeStream === 'bash') {
        term.write(msg.data);
        terminalService.append('bash', msg.data);
      }
    });

    const unsubscribeLogs = terminalService.subscribe((streams) => {
      if (activeStream === 'scripts') {
        // This is a bit inefficient, but for demo purposes
        term.clear();
        term.writeln('\x1b[1;33mNexus Script Logs\x1b[0m');
        term.writeln('Background script output will appear here.');
        term.writeln('------------------------------------------');
        term.write(streams.scripts.join('\r\n'));
      }
    });

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      unsubscribe();
      unsubscribeLogs();
      term.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [activeStream]);

  return (
    <div className="h-64 bg-nexus-bg border-t border-nexus-border flex flex-col">
      <div className="flex items-center justify-between px-4 py-1 bg-nexus-sidebar border-b border-nexus-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TerminalIcon size={12} className="text-nexus-accent" />
            <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Terminal</span>
          </div>
          
          <div className="flex items-center bg-nexus-bg rounded p-0.5">
            <button 
              onClick={() => setActiveStream('bash')}
              className={cn(
                "px-3 py-0.5 rounded text-[10px] font-bold transition-all",
                activeStream === 'bash' ? "bg-nexus-sidebar text-white" : "text-nexus-text-muted hover:text-white"
              )}
            >
              Bash
            </button>
            <button 
              onClick={() => setActiveStream('scripts')}
              className={cn(
                "px-3 py-0.5 rounded text-[10px] font-bold transition-all",
                activeStream === 'scripts' ? "bg-nexus-sidebar text-white" : "text-nexus-text-muted hover:text-white"
              )}
            >
              Script Logs
            </button>
          </div>

          {isPyodideLoading && (
            <div className="flex items-center gap-1 ml-2 text-[10px] text-amber-500">
              <Loader2 size={10} className="animate-spin" />
              <span>Initializing Pyodide...</span>
            </div>
          )}
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X size={14} />
        </button>
      </div>
      <div ref={terminalRef} className="flex-1 overflow-hidden p-2" />
    </div>
  );
}
