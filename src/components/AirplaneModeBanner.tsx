/**
 * Airplane Mode Banner — Shows when device goes offline
 * Displays offline status, lists affected features, dismissable
 */

import React, { useState } from 'react';
import { Plane, Wifi, WifiOff, X, AlertTriangle, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

interface AirplaneModeBannerProps {
  isOffline: boolean;
  isFullLock: boolean;
  onDismiss: () => void;
}

export default function AirplaneModeBanner({ isOffline, isFullLock, onDismiss }: AirplaneModeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!isOffline || dismissed) return null;

  return (
    <div className={cn(
      "px-4 py-2 flex items-center justify-between gap-3 text-xs",
      isFullLock
        ? "bg-amber-900/30 border-b border-amber-500/30 text-amber-300"
        : "bg-blue-900/30 border-b border-blue-500/30 text-blue-300"
    )}>
      <div className="flex items-center gap-2">
        {isFullLock ? (
          <Lock size={14} className="text-amber-400 flex-shrink-0" />
        ) : (
          <Plane size={14} className="text-blue-400 flex-shrink-0" />
        )}
        <span className="font-bold uppercase tracking-wider">
          {isFullLock ? 'Airplane Mode — Internet Features Locked' : 'Airplane Mode Active'}
        </span>
        <span className="text-[10px] opacity-70">
          {isFullLock
            ? 'Internet-reliant features are disabled until connection is restored.'
            : 'Online features paused. Editor, terminal, and files still work offline.'
          }
        </span>
      </div>
      <div className="flex items-center gap-2">
        {!isFullLock && (
          <div className="flex items-center gap-1">
            <WifiOff size={10} className="opacity-60" />
            <span className="text-[10px] opacity-60">Collab, Minecraft, Cloud AI, GitHub Push</span>
          </div>
        )}
        <button
          onClick={() => { setDismissed(true); onDismiss(); }}
          className="p-0.5 hover:bg-white/10 rounded transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
