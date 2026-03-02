import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { socketService } from '../services/socketService';
import { X, Terminal as TerminalIcon, Cpu, Loader2 } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';

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

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#569cd6',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    term.writeln('\x1b[1;34mWelcome to Nexus Shell v3.1\x1b[0m');
    term.writeln('Type \x1b[1;32m"help"\x1b[0m to see available local commands.');
    term.write('\r\n$ ');

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleCommand = async (command: string) => {
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

    socketService.send({ type: 'terminal-init' });

    const unsubscribe = socketService.subscribe((msg) => {
      if (msg.type === 'terminal-output') {
        term.write(msg.data);
      }
    });

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      unsubscribe();
      term.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="h-64 bg-[#1e1e1e] border-t border-[#333] flex flex-col">
      <div className="flex items-center justify-between px-4 py-1 bg-[#252526] border-b border-[#333]">
        <div className="flex items-center gap-2">
          <TerminalIcon size={12} className="text-blue-500" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nexus Shell</span>
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
