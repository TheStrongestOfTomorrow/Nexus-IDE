import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { socketService } from '../services/socketService';
import { terminalService } from '../services/terminalService';
import webcontainerService, { WebContainerState } from '../services/webcontainerService';
import { X, Terminal as TerminalIcon, Cpu, Loader2, ScrollText, Activity, Circle, CheckCircle2 } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';
import { cn } from '../lib/utils';

interface TerminalProps {
  files: FileNode[];
  onClose: () => void;
  onPreview?: () => void;
}

type WcStatus = 'checking' | 'booting' | 'ready' | 'unavailable';
type ActiveStream = 'bash' | 'scripts' | 'output';

// Commands that need interactive stdin/stdout piping
const INTERACTIVE_COMMANDS = ['node', 'npx', 'python', 'bash', 'sh', 'vim', 'nano', 'top', 'htop'];

function getPrompt(dir: string): string {
  return `\x1b[1;32mnexus\x1b[0m:\x1b[1;34m${dir}\x1b[0m$ `;
}

function resolvePath(cwd: string, target: string): string {
  if (target.startsWith('/')) {
    // Absolute path
    return target.replace(/\/+$/, '') || '/';
  }
  if (target === '..') {
    const parts = cwd.split('/').filter(Boolean);
    parts.pop();
    return '/' + parts.join('/') || '/';
  }
  if (target === '.') {
    return cwd;
  }
  const combined = cwd === '/' ? `/${target}` : `${cwd}/${target}`;
  return combined.replace(/\/+$/, '') || '/';
}

function getBaseName(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

const WELCOME_MESSAGE = [
  '\x1b[1;32mWelcome to Nexus Terminal 5.1\x1b[0m',
  '\x1b[90mPowered by StackBlitz WebContainer\x1b[0m',
  '',
  'The terminal runs commands in a browser-based Node.js environment.',
  'Supported: ls, mkdir, cat, echo, node, npx, npm, time, and more.',
  'Type \x1b[1;36m"help"\x1b[0m for available commands.',
  '',
].join('\r\n');

export default function Terminal({ files, onClose, onPreview }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [activeStream, setActiveStream] = useState<ActiveStream>('bash');
  const [wcStatus, setWcStatus] = useState<WcStatus>('checking');
  const [mountedFileCount, setMountedFileCount] = useState(0);
  const [isPyodideLoading, setIsPyodideLoading] = useState(false);

  // Shell state refs (persist across re-renders, no prompt flicker)
  const currentLineRef = useRef('');
  const currentDirRef = useRef('/home/project');
  const isInteractiveRef = useRef(false);
  const pyodideRef = useRef<any>(null);
  const isBootedRef = useRef(false);
  const isMountedRef = useRef(false);
  const currentProcessRef = useRef<any>(null);
  const disposableRef = useRef<any>(null);
  const wcOutputBufferRef = useRef<string[]>([]);

  // Write the shell prompt
  const writePrompt = useCallback((term: XTerm) => {
    term.write(getPrompt(currentDirRef.current));
  }, []);

  // Initialize xterm once
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

    // Small delay to ensure DOM is laid out before fitting
    setTimeout(() => fitAddon.fit(), 10);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Write welcome message
    term.writeln(WELCOME_MESSAGE);
    writePrompt(term);

    return () => {
      term.dispose();
      if (disposableRef.current) {
        disposableRef.current.dispose();
        disposableRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Boot and mount WebContainer
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setWcStatus('checking');

      // Small delay to let UI render the "checking" state
      await new Promise(r => setTimeout(r, 100));

      if (cancelled) return;

      if (!webcontainerService.isSupported()) {
        setWcStatus('unavailable');
        if (xtermRef.current) {
          xtermRef.current.writeln('\x1b[90m[WebContainer] Not supported in this environment — using local commands.\x1b[0m');
          xtermRef.current.writeln('');
        }
        return;
      }

      setWcStatus('booting');

      try {
        await webcontainerService.ensureReady();
        if (cancelled) return;

        isBootedRef.current = true;
        setWcStatus('ready');

        // Auto-mount project files
        if (!isMountedRef.current && files.length > 0) {
          try {
            await webcontainerService.mountFiles(files);
            isMountedRef.current = true;
            setMountedFileCount(files.length);
            if (xtermRef.current) {
              xtermRef.current.writeln(`\x1b[90m[WebContainer] Ready (${files.length} files mounted)\x1b[0m`);
              xtermRef.current.writeln('');
              writePrompt(xtermRef.current);
            }
          } catch (err: any) {
            if (xtermRef.current) {
              xtermRef.current.writeln(`\x1b[31m[WebContainer] Failed to mount files: ${err.message}\x1b[0m`);
              writePrompt(xtermRef.current);
            }
          }
        } else if (files.length === 0) {
          if (xtermRef.current) {
            xtermRef.current.writeln('\x1b[90m[WebContainer] Ready (no files to mount)\x1b[0m');
            xtermRef.current.writeln('');
            writePrompt(xtermRef.current);
          }
        }
      } catch (err: any) {
        setWcStatus('unavailable');
        if (xtermRef.current) {
          xtermRef.current.writeln(`\x1b[31m[WebContainer] Boot failed: ${err.message}\x1b[0m`);
          xtermRef.current.writeln('');
          writePrompt(xtermRef.current);
        }
      }
    };

    boot();

    return () => { cancelled = true; };
  }, [files, writePrompt]);

  // Subscribe to WebContainer output for the Output tab
  useEffect(() => {
    if (activeStream !== 'output') return;

    const unsub = webcontainerService.onOutput((output: string) => {
      wcOutputBufferRef.current.push(output);
      // Keep last 500 entries
      if (wcOutputBufferRef.current.length > 500) {
        wcOutputBufferRef.current = wcOutputBufferRef.current.slice(-500);
      }
    });

    return () => { unsub(); };
  }, [activeStream]);

  // Subscribe to terminalService for Scripts tab
  useEffect(() => {
    if (activeStream !== 'scripts') return;

    const unsub = terminalService.subscribe((streams) => {
      if (activeStream !== 'scripts' || !xtermRef.current) return;
      const term = xtermRef.current;
      term.clear();
      term.writeln('\x1b[1;33mNexus Script Logs\x1b[0m');
      term.writeln('Background script output will appear here.');
      term.writeln('------------------------------------------');
      term.write(streams.scripts.join('\r\n'));
    });

    return () => { unsub(); };
  }, [activeStream]);

  // Handle tab switching — update xterm content
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    if (activeStream === 'bash') {
      // Restore bash — just write prompt (content is already there)
      // Don't clear, user's terminal history is preserved
    } else if (activeStream === 'scripts') {
      term.clear();
      term.writeln('\x1b[1;33mNexus Script Logs\x1b[0m');
      term.writeln('Background script output will appear here.');
      term.writeln('------------------------------------------');
      const logs = terminalService.getOutput('scripts');
      if (logs) term.write(logs.replace(/\n/g, '\r\n'));
    } else if (activeStream === 'output') {
      term.clear();
      term.writeln('\x1b[1;36mWebContainer Output\x1b[0m');
      term.writeln('Raw output from WebContainer processes.');
      term.writeln('------------------------------------------');
      term.write(wcOutputBufferRef.current.join(''));
    }
  }, [activeStream]);

  // Main input handler
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    if (disposableRef.current) {
      disposableRef.current.dispose();
    }

    const disposable = term.onData(async (data: string) => {
      // If in interactive mode, pipe everything to the running process
      if (isInteractiveRef.current && currentProcessRef.current) {
        try {
          currentProcessRef.current.stdin.write(data);
        } catch {
          // Process might have ended
        }
        return;
      }

      // Non-interactive: only handle bash tab input
      if (activeStream !== 'bash') return;

      if (data === '\r') {
        // Enter key
        const command = currentLineRef.current.trim();
        currentLineRef.current = '';
        term.write('\r\n');

        if (command) {
          await executeCommand(term, command);
        } else {
          writePrompt(term);
        }
      } else if (data === '\u007f') {
        // Backspace
        if (currentLineRef.current.length > 0) {
          currentLineRef.current = currentLineRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data === '\x03') {
        // Ctrl+C
        if (currentLineRef.current.length > 0) {
          term.write('^C\r\n');
          currentLineRef.current = '';
          writePrompt(term);
        }
      } else if (data === '\x04') {
        // Ctrl+D
        term.write('^D\r\n');
        writePrompt(term);
      } else if (data === '\t') {
        // Tab — basic completion (no-op for now)
        term.write('  ');
        currentLineRef.current += '  ';
      } else if (data >= ' ') {
        // Printable characters
        currentLineRef.current += data;
        term.write(data);
      }
    });

    disposableRef.current = disposable;

    return () => {
      if (disposableRef.current) {
        disposableRef.current.dispose();
        disposableRef.current = null;
      }
    };
  }, [activeStream, wcStatus, files, onPreview, writePrompt]);

  // Execute a shell command
  const executeCommand = useCallback(async (term: XTerm, rawCommand: string) => {
    const parts = rawCommand.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // ============================================
    // Shell builtins (handled locally, no WC needed)
    // ============================================
    if (cmd === 'cd') {
      if (args.length === 0 || args[0] === '~') {
        currentDirRef.current = '/home/project';
      } else {
        const target = resolvePath(currentDirRef.current, args[0]);
        currentDirRef.current = target;
      }
      writePrompt(term);
      return;
    }

    if (cmd === 'pwd') {
      term.writeln(currentDirRef.current);
      writePrompt(term);
      return;
    }

    if (cmd === 'clear') {
      term.clear();
      return;
    }

    if (cmd === 'help') {
      term.writeln('\r\n\x1b[1;36mAvailable Commands:\x1b[0m\r\n');
      term.writeln('  \x1b[1;33mShell Builtins:\x1b[0m');
      term.writeln('    cd <path>       Change directory');
      term.writeln('    pwd             Print working directory');
      term.writeln('    clear           Clear terminal');
      term.writeln('    help            Show this help message');
      term.writeln('    exit            Close terminal panel\r\n');
      term.writeln('  \x1b[1;33mFile Operations:\x1b[0m');
      term.writeln('    ls [path]       List files');
      term.writeln('    ls -la [path]   List files (detailed)');
      term.writeln('    cat <file>      Display file contents');
      term.writeln('    echo <text>     Print text');
      term.writeln('    touch <file>    Create empty file');
      term.writeln('    cp <src> <dst>  Copy file');
      term.writeln('    mv <src> <dst>  Move / rename file');
      term.writeln('    rm <file>       Delete file\r\n');
      term.writeln('  \x1b[1;33mExecution:\x1b[0m');
      term.writeln('    node <file>     Run a Node.js script (interactive)');
      term.writeln('    npx <cmd>       Run an npx command (interactive)');
      term.writeln('    npm install     Install dependencies');
      term.writeln('    npm run <s>     Run an npm script');
      term.writeln('    npm start       Start the dev server');
      term.writeln('    npm test        Run tests');
      term.writeln('    time <cmd>      Measure command execution time');
      term.writeln('    python <file>   Run a Python script (Pyodide)\r\n');
      term.writeln('  \x1b[1;33mOther:\x1b[0m');
      term.writeln('    <any>           Fallback: run in WebContainer\r\n');
      writePrompt(term);
      return;
    }

    if (cmd === 'exit') {
      onClose();
      return;
    }

    // ============================================
    // WebContainer commands
    // ============================================
    if (wcStatus === 'ready' || wcStatus === 'booting') {
      // Wait for ready if still booting
      if (wcStatus === 'booting') {
        term.writeln('\x1b[90mWaiting for WebContainer to boot...\x1b[0m');
        try {
          await webcontainerService.ensureReady();
        } catch (err: any) {
          term.writeln(`\x1b[31mWebContainer boot failed: ${err.message}\x1b[0m`);
          writePrompt(term);
          return;
        }
      }

      // --- ls ---
      if (cmd === 'ls') {
        const hasLa = args.includes('-la') || args.includes('-l') || args.includes('-a');
        const targetPath = args.find(a => !a.startsWith('-'));
        const lsPath = targetPath
          ? resolvePath(currentDirRef.current, targetPath)
          : currentDirRef.current;
        try {
          await webcontainerService.spawn('ls', hasLa ? ['-la', lsPath] : [lsPath]);
        } catch (err: any) {
          term.writeln(`\x1b[31mls: ${err.message}\x1b[0m`);
        }
        writePrompt(term);
        return;
      }

      // --- mkdir ---
      if (cmd === 'mkdir') {
        if (args.length === 0) {
          term.writeln('\x1b[31mmkdir: missing operand\x1b[0m');
          writePrompt(term);
          return;
        }
        const dirPath = resolvePath(currentDirRef.current, args[0]);
        try {
          await webcontainerService.spawn('mkdir', ['-p', dirPath]);
        } catch (err: any) {
          term.writeln(`\x1b[31mmkdir: ${err.message}\x1b[0m`);
        }
        writePrompt(term);
        return;
      }

      // --- cat ---
      if (cmd === 'cat') {
        if (args.length === 0) {
          term.writeln('\x1b[31mcat: missing file operand\x1b[0m');
          writePrompt(term);
          return;
        }
        const filePath = resolvePath(currentDirRef.current, args[0]);
        try {
          const content = await webcontainerService.readFile(filePath);
          term.write(content.replace(/\n/g, '\r\n'));
        } catch (err: any) {
          term.writeln(`\x1b[31mcat: ${filePath}: ${err.message}\x1b[0m`);
        }
        writePrompt(term);
        return;
      }

      // --- echo ---
      if (cmd === 'echo') {
        term.writeln(args.join(' '));
        writePrompt(term);
        return;
      }

      // --- touch ---
      if (cmd === 'touch') {
        if (args.length === 0) {
          term.writeln('\x1b[31mtouch: missing file operand\x1b[0m');
          writePrompt(term);
          return;
        }
        const filePath = resolvePath(currentDirRef.current, args[0]);
        try {
          await webcontainerService.writeFile(filePath, '');
          term.writeln(`\x1b[90mCreated ${filePath}\x1b[0m`);
        } catch (err: any) {
          term.writeln(`\x1b[31mtouch: ${err.message}\x1b[0m`);
        }
        writePrompt(term);
        return;
      }

      // --- cp ---
      if (cmd === 'cp') {
        if (args.length < 2) {
          term.writeln('\x1b[31mcp: missing file operand\x1b[0m');
          writePrompt(term);
          return;
        }
        const srcPath = resolvePath(currentDirRef.current, args[0]);
        const dstPath = resolvePath(currentDirRef.current, args[1]);
        try {
          const content = await webcontainerService.readFile(srcPath);
          await webcontainerService.writeFile(dstPath, content);
          term.writeln(`\x1b[90mCopied ${srcPath} -> ${dstPath}\x1b[0m`);
        } catch (err: any) {
          term.writeln(`\x1b[31mcp: ${err.message}\x1b[0m`);
        }
        writePrompt(term);
        return;
      }

      // --- rm ---
      if (cmd === 'rm') {
        if (args.length === 0) {
          term.writeln('\x1b[31mrm: missing operand\x1b[0m');
          writePrompt(term);
          return;
        }
        const filePath = resolvePath(currentDirRef.current, args[0]);
        try {
          await webcontainerService.spawn('rm', ['-rf', filePath]);
          term.writeln(`\x1b[90mRemoved ${filePath}\x1b[0m`);
        } catch (err: any) {
          term.writeln(`\x1b[31mrm: ${err.message}\x1b[0m`);
        }
        writePrompt(term);
        return;
      }

      // --- mv ---
      if (cmd === 'mv') {
        if (args.length < 2) {
          term.writeln('\x1b[31mmv: missing file operand\x1b[0m');
          writePrompt(term);
          return;
        }
        const srcPath = resolvePath(currentDirRef.current, args[0]);
        const dstPath = resolvePath(currentDirRef.current, args[1]);
        try {
          await webcontainerService.spawn('mv', [srcPath, dstPath]);
          term.writeln(`\x1b[90mMoved ${srcPath} -> ${dstPath}\x1b[0m`);
        } catch (err: any) {
          term.writeln(`\x1b[31mmv: ${err.message}\x1b[0m`);
        }
        writePrompt(term);
        return;
      }

      // --- time <cmd> ---
      if (cmd === 'time') {
        if (args.length === 0) {
          term.writeln('\x1b[31mtime: missing command\x1b[0m');
          writePrompt(term);
          return;
        }
        const innerCmd = args[0];
        const innerArgs = args.slice(1);
        const isInteractive = INTERACTIVE_COMMANDS.includes(innerCmd);

        term.writeln(`\x1b[90mTiming: ${innerCmd} ${innerArgs.join(' ')}\x1b[0m`);
        const start = performance.now();

        try {
          if (isInteractive) {
            await runInteractiveCommand(term, innerCmd, innerArgs);
          } else {
            await webcontainerService.spawn(innerCmd, innerArgs);
          }
        } catch (err: any) {
          term.writeln(`\x1b[31m${err.message}\x1b[0m`);
        }

        const elapsed = ((performance.now() - start) / 1000).toFixed(2);
        term.writeln(`\x1b[90mreal\t${elapsed}s\x1b[0m`);
        writePrompt(term);
        return;
      }

      // --- node (interactive) ---
      if (cmd === 'node') {
        try {
          await runInteractiveCommand(term, 'node', args);
        } catch (err: any) {
          term.writeln(`\x1b[31m${err.message}\x1b[0m`);
          writePrompt(term);
        }
        return;
      }

      // --- npx (interactive) ---
      if (cmd === 'npx') {
        try {
          await runInteractiveCommand(term, 'npx', args);
        } catch (err: any) {
          term.writeln(`\x1b[31m${err.message}\x1b[0m`);
          writePrompt(term);
        }
        return;
      }

      // --- npm install ---
      if (cmd === 'npm' && args[0] === 'install') {
        term.writeln('\x1b[1;32m> Installing dependencies...\x1b[0m');
        try {
          await webcontainerService.installDependencies();
        } catch (err: any) {
          term.writeln(`\x1b[31m${err.message}\x1b[0m`);
        }
        writePrompt(term);
        return;
      }

      // --- npm run <script> ---
      if (cmd === 'npm' && args[0] === 'run' && args[1]) {
        const scriptName = args[1];
        term.writeln(`\x1b[1;32m> npm run ${scriptName}\x1b[0m`);
        try {
          // Use spawn for output to show via onOutput listener
          await webcontainerService.spawn('npm', ['run', scriptName]);
        } catch (err: any) {
          term.writeln(`\x1b[31m${err.message}\x1b[0m`);
        }
        writePrompt(term);
        return;
      }

      // --- npm start ---
      if (cmd === 'npm' && args[0] === 'start') {
        term.writeln('\x1b[1;32m> npm start\x1b[0m');
        try {
          await webcontainerService.spawn('npm', ['start']);
        } catch (err: any) {
          term.writeln(`\x1b[31m${err.message}\x1b[0m`);
        }
        writePrompt(term);
        return;
      }

      // --- npm test ---
      if (cmd === 'npm' && args[0] === 'test') {
        term.writeln('\x1b[1;32m> npm test\x1b[0m');
        try {
          await webcontainerService.spawn('npm', ['test']);
        } catch (err: any) {
          term.writeln(`\x1b[31m${err.message}\x1b[0m`);
        }
        writePrompt(term);
        return;
      }

      // --- python (Pyodide) ---
      if (cmd === 'python') {
        await runPython(term, args, files);
        return;
      }

      // --- Generic command fallback (interactive) ---
      try {
        const isGenericInteractive = INTERACTIVE_COMMANDS.includes(cmd);
        if (isGenericInteractive) {
          await runInteractiveCommand(term, cmd, args);
        } else {
          // Non-interactive: use spawn for automatic output capture
          await webcontainerService.spawn(cmd, args);
          writePrompt(term);
        }
      } catch (err: any) {
        term.writeln(`\x1b[31m${cmd}: ${err.message}\x1b[0m`);
        writePrompt(term);
      }
      return;
    }

    // ============================================
    // WebContainer unavailable — local fallback
    // ============================================

    // python via Pyodide still works without WC
    if (cmd === 'python') {
      await runPython(term, args, files);
      return;
    }

    // Local ls fallback
    if (cmd === 'ls') {
      const cwd = currentDirRef.current;
      let filtered = files;
      if (cwd !== '/' && cwd !== '/home/project') {
        filtered = files.filter(f => f.name.startsWith(cwd.replace('/home/project/', '')));
      }
      if (filtered.length === 0) {
        term.writeln('\x1b[90m(empty)\x1b[0m');
      } else {
        filtered.forEach(f => {
          const name = getBaseName(f.name);
          term.writeln(name);
        });
      }
      writePrompt(term);
      return;
    }

    if (cmd === 'clear') {
      term.clear();
      return;
    }

    if (cmd === 'echo') {
      term.writeln(args.join(' '));
      writePrompt(term);
      return;
    }

    // Final fallback: send to socket
    socketService.send({ type: 'terminal-input', data: rawCommand + '\n' });
    // Write a prompt after a short delay in case socket doesn't respond
    setTimeout(() => {
      if (!isInteractiveRef.current) {
        writePrompt(term);
      }
    }, 500);
  }, [wcStatus, files, onClose, writePrompt]);

  // Run an interactive command: pipe stdin/stdout
  const runInteractiveCommand = useCallback(async (term: XTerm, command: string, args: string[]) => {
    const { process, exitCode } = await webcontainerService.spawnInteractive(command, args);
    currentProcessRef.current = process;
    isInteractiveRef.current = true;

    // Pipe process stdout → xterm
    if (process.output) {
      process.output.pipeTo(
        new WritableStream({
          write: (data: string) => {
            term.write(data);
          },
        })
      );
    }

    // Wait for exit
    const code = await exitCode;
    currentProcessRef.current = null;
    isInteractiveRef.current = false;

    if (code !== 0) {
      term.writeln(`\r\n\x1b[90m[Process exited with code ${code}]\x1b[0m`);
    } else {
      term.writeln(`\r\n\x1b[90m[Process exited with code 0]\x1b[0m`);
    }
    writePrompt(term);
  }, [writePrompt]);

  // Run Python via Pyodide
  const runPython = useCallback(async (term: XTerm, args: string[], projectFiles: FileNode[]) => {
    if (!pyodideRef.current) {
      setIsPyodideLoading(true);
      term.writeln('\r\n\x1b[1;33mLoading Pyodide runtime...\x1b[0m');
      try {
        // @ts-ignore
        pyodideRef.current = await window.loadPyodide();
        setIsPyodideLoading(false);
        term.writeln('\x1b[1;32mPyodide loaded successfully.\x1b[0m');
      } catch (err: any) {
        setIsPyodideLoading(false);
        term.writeln('\x1b[1;31mFailed to load Pyodide.\x1b[0m');
        writePrompt(term);
        return;
      }
    }

    const fileName = args[0];
    if (fileName) {
      const file = projectFiles.find(f => f.name === fileName || f.name.endsWith('/' + fileName));
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
      term.writeln('\r\n\x1b[90mPython REPL not available. Use "python <file>" to run a script.\x1b[0m');
    }
    writePrompt(term);
  }, [writePrompt]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // Also observe the terminal container for size changes
    const observer = new ResizeObserver(() => {
      handleResize();
    });

    if (terminalRef.current?.parentElement) {
      observer.observe(terminalRef.current.parentElement);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  // Socket subscription for fallback output
  useEffect(() => {
    const unsub = socketService.subscribe((msg) => {
      if (msg.type === 'terminal-output' && activeStream === 'bash' && xtermRef.current) {
        xtermRef.current.write(msg.data);
        terminalService.append('bash', msg.data);
      }
    });

    return () => { unsub(); };
  }, [activeStream]);

  // WebContainer status indicator
  const WcStatusBadge = () => {
    if (wcStatus === 'checking') {
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <Loader2 size={10} className="animate-spin" />
          <span>WebContainer: Checking...</span>
        </div>
      );
    }
    if (wcStatus === 'booting') {
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
          <Loader2 size={10} className="animate-spin" />
          <span>WebContainer: Booting...</span>
        </div>
      );
    }
    if (wcStatus === 'ready') {
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <CheckCircle2 size={10} />
          <span>WebContainer: Ready{mountedFileCount > 0 ? ` (${mountedFileCount} files)` : ''}</span>
        </div>
      );
    }
    // unavailable
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-red-400">
        <Circle size={10} />
        <span>WebContainer: Unavailable</span>
      </div>
    );
  };

  return (
    <div className="h-64 bg-nexus-bg border-t border-nexus-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1 bg-nexus-sidebar border-b border-nexus-border">
        <div className="flex items-center gap-4">
          {/* Terminal icon + label */}
          <div className="flex items-center gap-2">
            <TerminalIcon size={12} className="text-nexus-accent" />
            <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Nexus Terminal</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center bg-nexus-bg rounded p-0.5">
            {(['bash', 'scripts', 'output'] as ActiveStream[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveStream(tab)}
                className={cn(
                  'px-3 py-0.5 rounded text-[10px] font-bold transition-all',
                  activeStream === tab
                    ? 'bg-nexus-sidebar text-white'
                    : 'text-nexus-text-muted hover:text-white'
                )}
              >
                {tab === 'bash' && 'Bash'}
                {tab === 'scripts' && 'Script Logs'}
                {tab === 'output' && 'Output'}
              </button>
            ))}
          </div>

          {/* WebContainer status */}
          <WcStatusBadge />

          {/* Pyodide loading */}
          {isPyodideLoading && (
            <div className="flex items-center gap-1 text-[10px] text-amber-500">
              <Loader2 size={10} className="animate-spin" />
              <span>Pyodide...</span>
            </div>
          )}
        </div>

        {/* Close button */}
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Terminal body */}
      <div ref={terminalRef} className="flex-1 overflow-hidden p-2" />
    </div>
  );
}
