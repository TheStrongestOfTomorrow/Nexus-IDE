import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { v86Service, V86Status } from '../services/v86Service';
import {
  Play,
  Square,
  Pause,
  SkipForward,
  Save,
  Maximize2,
  Minimize2,
  Loader2,
  Monitor,
  X,
  RotateCw,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LinuxTerminalProps {
  onClose?: () => void;
  onFullscreen?: () => void;
}

type TerminalMode = 'serial' | 'screen';

export default function LinuxTerminal({ onClose, onFullscreen }: LinuxTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const screenContainerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<V86Status>(v86Service.status);
  const [mode, setMode] = useState<TerminalMode>('serial');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubOutputRef = useRef<(() => void) | null>(null);
  const unsubScreenRef = useRef<(() => void) | null>(null);

  // Subscribe to v86 status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(v86Service.status);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Initialize xterm.js terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0c0c0c',
        foreground: '#cccccc',
        cursor: '#00ff41',
        cursorAccent: '#0c0c0c',
        selectionBackground: 'rgba(0, 255, 65, 0.25)',
        black: '#0c0c0c',
        red: '#c50f1f',
        green: '#13a10e',
        yellow: '#c19c00',
        blue: '#0037da',
        magenta: '#881798',
        cyan: '#3a96dd',
        white: '#cccccc',
        brightBlack: '#767676',
        brightRed: '#e74856',
        brightGreen: '#16c60c',
        brightYellow: '#f9f1a5',
        brightBlue: '#3b78ff',
        brightMagenta: '#b4009e',
        brightCyan: '#61d6d6',
        brightWhite: '#f2f2f2',
      },
      allowTransparency: false,
      scrollback: 5000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    setTimeout(() => fitAddon.fit(), 50);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln('\x1b[1;32m  ___  ____  ____  _     _____ _   _ _____  \x1b[0m');
    term.writeln('\x1b[1;32m / _ \\|  _ \\|  _ \\| |   | ____| \\ | |_   _| \x1b[0m');
    term.writeln('\x1b[1;32m| | | | |_) | |_) | |   |  _| |  \\| | | |   \x1b[0m');
    term.writeln('\x1b[1;32m| |_| |  __/|  __/| |___| |___| |\\  | | |   \x1b[0m');
    term.writeln('\x1b[1;32m \\___/|_|   |_|   |_____|_____|_| \\_| |_|   \x1b[0m');
    term.writeln('');
    term.writeln('\x1b[90m Nexus Linux Terminal — v86 x86 Emulator\x1b[0m');
    term.writeln('\x1b[90m Powered by Alpine Linux (v86)\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[33m⚠ Disk image will be loaded in a future update.\x1b[0m');
    term.writeln('\x1b[33m  The emulator infrastructure is ready.\x1b[0m');
    term.writeln('');
    term.writeln('Click \x1b[1;32m[Boot Linux]\x1b[0m to start the emulator.');
    term.writeln('');

    return () => {
      term.dispose();
      if (unsubOutputRef.current) {
        unsubOutputRef.current();
        unsubOutputRef.current = null;
      }
      if (unsubScreenRef.current) {
        unsubScreenRef.current();
        unsubScreenRef.current = null;
      }
    };
  }, []);

  // Connect to v86 serial output
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    // Subscribe to output if emulator is running
    if (v86Service.isRunning && mode === 'serial') {
      const unsub = v86Service.onOutput((text: string) => {
        term.write(text);
      });
      unsubOutputRef.current = unsub;
    }

    return () => {
      if (unsubOutputRef.current) {
        unsubOutputRef.current();
        unsubOutputRef.current = null;
      }
    };
  }, [status, mode]);

  // Connect xterm input to v86
  useEffect(() => {
    const term = xtermRef.current;
    if (!term || status !== 'running' || mode !== 'serial') return;

    const disposable = term.onData((data: string) => {
      v86Service.sendInput(data);
    });

    return () => disposable.dispose();
  }, [status, mode]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

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

  // Boot handler
  const handleBoot = useCallback(async () => {
    setError(null);
    try {
      await v86Service.boot();
      setStatus(v86Service.status);
    } catch (err: any) {
      setError(err.message || 'Failed to boot Linux');
      setStatus('error');
    }
  }, []);

  // Stop handler
  const handleStop = useCallback(async () => {
    await v86Service.stop();
    setStatus('stopped');
    if (xtermRef.current) {
      xtermRef.current.writeln('\r\n\x1b[90m[Emulator stopped]\x1b[0m\r\n');
    }
  }, []);

  // Pause/Resume handler
  const handlePauseResume = useCallback(() => {
    if (status === 'running') {
      v86Service.pause();
      setStatus('paused');
    } else if (status === 'paused') {
      v86Service.resume();
      setStatus('running');
    }
  }, [status]);

  // Save state handler
  const handleSaveState = useCallback(async () => {
    try {
      await v86Service.saveState();
      if (xtermRef.current) {
        xtermRef.current.writeln('\r\n\x1b[32m[VM state saved]\x1b[0m\r\n');
      }
    } catch {
      if (xtermRef.current) {
        xtermRef.current.writeln('\r\n\x1b[31m[Failed to save VM state]\x1b[0m\r\n');
      }
    }
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    if (onFullscreen) onFullscreen();
    setTimeout(() => {
      if (fitAddonRef.current) fitAddonRef.current.fit();
    }, 100);
  }, [onFullscreen]);

  // Status badge
  const StatusBadge = () => {
    switch (status) {
      case 'booting':
        return (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
            <Loader2 size={10} className="animate-spin" />
            <span>Booting...</span>
          </div>
        );
      case 'running':
        return (
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Running</span>
          </div>
        );
      case 'paused':
        return (
          <div className="flex items-center gap-1.5 text-[10px] text-yellow-400">
            <Pause size={10} />
            <span>Paused</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-[10px] text-red-400">
            <X size={10} />
            <span>Error</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <Monitor size={10} />
            <span>Stopped</span>
          </div>
        );
    }
  };

  return (
    <div className={cn(
      "flex flex-col bg-nexus-bg border-t border-nexus-border",
      isFullscreen ? "fixed inset-0 z-[300]" : "h-96"
    )}>
      {/* ─── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#1a1a2e] border-b border-nexus-border flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Linux icon + label */}
          <div className="flex items-center gap-2">
            <Monitor size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">
              Linux Terminal
            </span>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center bg-nexus-bg rounded p-0.5">
            <button
              onClick={() => setMode('serial')}
              className={cn(
                'px-3 py-0.5 rounded text-[10px] font-bold transition-all',
                mode === 'serial'
                  ? 'bg-[#1a1a2e] text-white'
                  : 'text-nexus-text-muted hover:text-white'
              )}
            >
              Serial
            </button>
            <button
              onClick={() => setMode('screen')}
              disabled={status !== 'running'}
              className={cn(
                'px-3 py-0.5 rounded text-[10px] font-bold transition-all',
                mode === 'screen'
                  ? 'bg-[#1a1a2e] text-white'
                  : 'text-nexus-text-muted hover:text-white',
                status !== 'running' && 'opacity-40 cursor-not-allowed'
              )}
            >
              Screen
            </button>
          </div>

          {/* Status */}
          <StatusBadge />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* Boot / Stop */}
          {status === 'stopped' || status === 'error' ? (
            <button
              onClick={handleBoot}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
            >
              <Play size={10} />
              Boot Linux
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
            >
              <Square size={10} />
              Stop
            </button>
          )}

          {/* Pause / Resume */}
          {(status === 'running' || status === 'paused') && (
            <button
              onClick={handlePauseResume}
              className="flex items-center gap-1.5 px-3 py-1 bg-nexus-border hover:bg-nexus-border/80 text-white rounded text-[10px] font-bold transition-colors"
            >
              {status === 'running' ? (
                <>
                  <Pause size={10} />
                  Pause
                </>
              ) : (
                <>
                  <SkipForward size={10} />
                  Resume
                </>
              )}
            </button>
          )}

          {/* Save State */}
          {status === 'running' && (
            <button
              onClick={handleSaveState}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
              title="Save VM state to IndexedDB"
            >
              <Save size={10} />
              Save State
            </button>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-nexus-border rounded text-nexus-text-muted hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-nexus-border rounded text-nexus-text-muted hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Error Banner ─────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border-b border-red-500/20">
          <RotateCw size={12} className="text-red-400" />
          <span className="text-[10px] text-red-400">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* ─── Terminal / Screen Content ────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative">
        {/* Serial terminal (xterm.js) */}
        <div
          ref={terminalRef}
          className={cn(
            'absolute inset-0 p-2',
            mode === 'serial' ? 'block' : 'hidden'
          )}
        />

        {/* Screen output (v86 canvas) */}
        <div
          ref={screenContainerRef}
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-black',
            mode === 'screen' ? 'block' : 'hidden'
          )}
        >
          {status === 'running' ? (
            <div
              id="v86-screen-container"
              className="w-full h-full"
              ref={(el) => {
                if (el && el.children.length === 0) {
                  const screenEl = v86Service.getScreenElement();
                  if (screenEl) {
                    screenEl.style.display = 'block';
                    screenEl.style.width = '100%';
                    screenEl.style.height = '100%';
                    el.appendChild(screenEl);
                  }
                }
              }}
            />
          ) : (
            <div className="text-center">
              <Monitor size={48} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-xs">Screen output will appear when the emulator is running</p>
            </div>
          )}
        </div>

        {/* Boot progress overlay */}
        {status === 'booting' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
            <div className="text-center space-y-4">
              <Loader2 size={32} className="text-emerald-400 animate-spin mx-auto" />
              <div>
                <p className="text-white text-sm font-bold">Booting Alpine Linux...</p>
                <p className="text-gray-500 text-[10px] mt-1">Loading v86 emulator via CDN</p>
              </div>
              <div className="w-48 h-1 bg-gray-800 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
