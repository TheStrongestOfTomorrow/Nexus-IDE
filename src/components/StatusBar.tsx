import React, { useState, useEffect } from 'react';
import { Wifi, Bell, CheckCircle2, Brain, Download, Loader2, ZapOff, Sparkles } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';
import { cn } from '../lib/utils';

interface StatusBarProps {
  activeFile: FileNode | null;
  onScanProject?: () => void;
  onPreinstallOffline?: () => void;
  isPreinstalling?: boolean;
  preinstallProgress?: number;
  vibeProgress?: { active: boolean, percent: number, message: string };
}

export default function StatusBar({ 
  activeFile, 
  onScanProject, 
  onPreinstallOffline, 
  isPreinstalling, 
  preinstallProgress,
  vibeProgress
}: StatusBarProps) {
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    const checkPwa = () => {
      // @ts-ignore
      if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
        setIsPwaInstalled(true);
      }
    };
    checkPwa();
    window.addEventListener('appinstalled', () => setIsPwaInstalled(true));
  }, []);

  return (
    <div className="h-6 bg-nexus-accent text-white flex items-center justify-between px-3 text-[11px] flex-shrink-0 select-none">
      <div className="flex items-center h-full">
        <div className="flex items-center gap-1 px-2 hover:bg-white/10 h-full cursor-pointer transition-colors">
          <Wifi size={12} />
          <span>Online</span>
        </div>
        {isPwaInstalled && (
          <div className="flex items-center gap-1 px-2 hover:bg-white/10 h-full cursor-pointer transition-colors text-emerald-300">
            <CheckCircle2 size={12} />
            <span>PWA Active</span>
          </div>
        )}
        {onScanProject && (
          <div 
            onClick={onScanProject}
            className="flex items-center gap-1 px-2 hover:bg-white/10 h-full cursor-pointer transition-colors"
            title="Scan Project"
          >
            <Brain size={12} />
            <span>Scan</span>
          </div>
        )}
        {onPreinstallOffline && (
          <div 
            onClick={onPreinstallOffline}
            className={cn(
              "flex items-center gap-1 px-2 h-full cursor-pointer transition-colors",
              isPreinstalling ? "bg-white/20" : "hover:bg-white/10",
              preinstallProgress === 100 ? "text-emerald-300" : ""
            )}
            title="Pre-install dependencies for offline use"
          >
            {isPreinstalling ? (
              <Loader2 size={12} className="animate-spin" />
            ) : preinstallProgress === 100 ? (
              <CheckCircle2 size={12} />
            ) : (
              <ZapOff size={12} />
            )}
            <span>{isPreinstalling ? 'Pre-installing...' : preinstallProgress === 100 ? 'Offline Ready' : 'Go Offline Ready'}</span>
          </div>
        )}
        
        {vibeProgress?.active && (
          <div className="flex items-center gap-2 px-3 bg-blue-600/50 h-full animate-pulse">
            <Sparkles size={12} className="text-yellow-400" />
            <span className="font-mono">{vibeProgress.message}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center h-full">
        {activeFile && (
          <div className="px-2 hover:bg-white/10 h-full flex items-center cursor-pointer uppercase">
            {activeFile.language}
          </div>
        )}
        <div className="px-2 hover:bg-white/10 h-full flex items-center cursor-pointer">
          <CheckCircle2 size={12} className="mr-1" />
          Ready
        </div>
      </div>
    </div>
  );
}
