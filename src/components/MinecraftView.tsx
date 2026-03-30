import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Copy, Check, Terminal, Play, Trash2, Wifi, WifiOff, Info } from 'lucide-react';
import { socketService } from '../services/socketService';
import { cn } from '../lib/utils';

interface MinecraftViewProps {
  sessionId: string | null;
}

export default function MinecraftView({ sessionId }: MinecraftViewProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const wsUrl = sessionId 
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/minecraft?sid=${sessionId}`
    : '';
  const connectCommand = `/connect ${window.location.host}/minecraft?sid=${sessionId}`;

  useEffect(() => {
    const unsubscribe = socketService.subscribe((msg) => {
      if (msg.type === 'minecraft:connected') {
        setIsConnected(true);
        setLogs(prev => [...prev, { type: 'system', message: 'Minecraft connected!', timestamp: Date.now() }]);
      } else if (msg.type === 'minecraft:disconnected') {
        setIsConnected(false);
        setLogs(prev => [...prev, { type: 'system', message: 'Minecraft disconnected.', timestamp: Date.now() }]);
      } else if (msg.type === 'minecraft:event') {
        setLogs(prev => [...prev, { type: 'event', data: msg.data, timestamp: Date.now() }]);
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !sessionId) return;
    
    socketService.sendMinecraftCommand(sessionId, command.trim());
    
    setLogs(prev => [...prev, { type: 'command', message: command.trim(), timestamp: Date.now() }]);
    setCommand('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(connectCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearLogs = () => setLogs([]);

  if (!sessionId) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center space-y-4 bg-nexus-sidebar">
        <div className="w-16 h-16 bg-nexus-bg rounded-2xl flex items-center justify-center border border-nexus-border shadow-xl mb-4">
          <Gamepad2 size={32} className="text-nexus-text" />
        </div>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Minecraft Bridge</h2>
        <p className="text-xs text-nexus-text-muted leading-relaxed">
          Please start or join a collaboration session first to enable the Minecraft Bridge.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border flex items-center justify-between bg-nexus-sidebar">
        <div className="flex items-center gap-2">
          <Gamepad2 size={16} className="text-emerald-500" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Minecraft Bridge</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
          )} />
          <span className="text-[10px] text-nexus-text-muted uppercase font-bold">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-nexus-sidebar">
        {/* Connection Info */}
        <div className="p-3 bg-nexus-bg rounded-xl border border-nexus-border space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">
            <Info size={14} className="text-nexus-accent" />
            How to Connect
          </div>
          <p className="text-[11px] text-nexus-text-muted leading-relaxed">
            1. Open Minecraft Bedrock Edition.<br />
            2. Enable cheats in your world.<br />
            3. Type the following command in chat:
          </p>
          <div className="flex items-center gap-2 bg-nexus-sidebar p-2 rounded-lg border border-nexus-border group shadow-inner">
            <code className="text-[10px] text-emerald-400 font-mono truncate flex-1 font-bold">
              {connectCommand}
            </code>
            <button 
              onClick={copyToClipboard}
              className="p-1.5 hover:bg-nexus-bg rounded-md text-nexus-text-muted transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-amber-500/80 italic leading-tight">
            Note: You may need to disable "Encrypted WebSockets" in Minecraft settings.
          </p>
        </div>

        {/* Logs */}
        <div className="flex flex-col h-[300px] bg-nexus-bg rounded-xl border border-nexus-border overflow-hidden shadow-sm">
          <div className="px-3 py-2 border-b border-nexus-border flex items-center justify-between bg-nexus-sidebar">
            <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Event Log</span>
            <button onClick={clearLogs} className="text-nexus-text-muted hover:text-white transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1 no-scrollbar">
            {logs.length === 0 && (
              <div className="text-nexus-text-muted italic p-2 opacity-50">Waiting for events...</div>
            )}
            {logs.map((log, i) => (
              <div key={i} className={cn(
                "p-1.5 rounded-lg border",
                log.type === 'system' ? "text-blue-400 bg-blue-900/10 border-blue-500/20" :
                log.type === 'command' ? "text-emerald-400 bg-emerald-900/10 border-emerald-500/20" :
                "text-nexus-text-muted bg-nexus-sidebar border-nexus-border"
              )}>
                <span className="opacity-30 mr-2 font-bold">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                {log.type === 'event' ? (
                  <span className="break-all">{JSON.stringify(log.data)}</span>
                ) : (
                  <span className="font-bold">{log.message}</span>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      <div className="p-3 bg-nexus-sidebar border-t border-nexus-border">
        <form onSubmit={handleSendCommand} className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={e => setCommand(e.target.value)}
            disabled={!isConnected}
            placeholder={isConnected ? "Enter Minecraft command..." : "Waiting for connection..."}
            className="flex-1 bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-xs outline-none text-white focus:border-emerald-500 disabled:opacity-50 shadow-inner"
          />
          <button
            type="submit"
            disabled={!isConnected || !command.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20 uppercase tracking-widest"
          >
            <Play size={12} />
            Run
          </button>
        </form>
      </div>
    </div>
  );
}
