import React from 'react';
import { GitBranch, Wifi, Bell, CheckCircle2, Brain } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';

interface StatusBarProps {
  activeFile: FileNode | null;
  githubUser: any | null;
  onScanProject?: () => void;
}

export default function StatusBar({ activeFile, githubUser, onScanProject }: StatusBarProps) {
  return (
    <div className="h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-[11px] flex-shrink-0 select-none">
      <div className="flex items-center h-full">
        <div className="flex items-center gap-1 px-2 hover:bg-white/10 h-full cursor-pointer transition-colors">
          <GitBranch size={12} />
          <span>main</span>
        </div>
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
