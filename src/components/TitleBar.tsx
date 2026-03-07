import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Zap, Command, Globe, Settings, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { FileNode } from '../hooks/useFileSystem';

interface TitleBarProps {
  activeFile: FileNode | null;
  onSearch: (query: string) => void;
  onSettings?: () => void;
}

export default function TitleBar({ activeFile, onSearch, onSettings }: TitleBarProps) {
  const [isWCOSupported, setIsWCOSupported] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if ('windowControlsOverlay' in navigator) {
      // @ts-ignore
      setIsWCOSupported(navigator.windowControlsOverlay.visible);
      // @ts-ignore
      navigator.windowControlsOverlay.addEventListener('geometrychange', (e) => {
        setIsWCOSupported(e.visible);
      });
    }
  }, []);

  const breadcrumbs = activeFile ? activeFile.name.split('/') : [];

  return (
    <div 
      className={cn(
        "h-8 flex items-center bg-nexus-sidebar border-b border-nexus-border select-none",
        isWCOSupported ? "titlebar-overlay" : ""
      )}
      style={{
        // @ts-ignore
        paddingLeft: 'env(titlebar-area-x, 0)',
        // @ts-ignore
        paddingRight: 'calc(100% - env(titlebar-area-width, 100%))',
        // @ts-ignore
        width: 'env(titlebar-area-width, 100%)',
        // @ts-ignore
        height: 'env(titlebar-area-height, 32px)',
        appRegion: 'drag'
      } as any}
    >
      <div className="flex items-center gap-3 px-4 w-full h-full">
        {/* App Icon & Name */}
        <div className="flex items-center gap-2 mr-4">
          <Zap size={14} className="text-nexus-accent" />
          <span className="text-[11px] font-bold text-white uppercase tracking-widest">Nexus 4.1</span>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-[11px] text-gray-500 overflow-hidden whitespace-nowrap flex-1">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              <span className={cn(
                "hover:text-gray-300 cursor-pointer transition-colors",
                i === breadcrumbs.length - 1 ? "text-gray-300 font-medium" : ""
              )}>
                {crumb}
              </span>
              {i < breadcrumbs.length - 1 && <ChevronRight size={10} className="opacity-40" />}
            </React.Fragment>
          ))}
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-4" style={{ appRegion: 'no-drag' } as any}>
          <div className="relative group">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-nexus-text-muted group-focus-within:text-nexus-accent transition-colors" />
            <input 
              type="text"
              placeholder="Search files or commands... (Ctrl+P)"
              className="w-full bg-nexus-bg border border-nexus-border rounded px-8 py-0.5 text-[11px] text-nexus-text focus:outline-none focus:border-nexus-accent/50 transition-all"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-40">
              <Command size={10} />
              <span className="text-[9px]">P</span>
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 ml-auto" style={{ appRegion: 'no-drag' } as any}>
          <button className="p-1 hover:bg-[#333] rounded text-gray-500 hover:text-gray-300 transition-colors">
            <Globe size={14} />
          </button>
          <button className="p-1 hover:bg-[#333] rounded text-gray-500 hover:text-gray-300 transition-colors">
            <User size={14} />
          </button>
          <button 
            onClick={onSettings}
            className="p-1 hover:bg-[#333] rounded text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
