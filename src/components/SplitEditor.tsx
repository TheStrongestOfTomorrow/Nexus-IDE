import React, { useState, useRef, useCallback } from 'react';
import { X, Columns2 } from 'lucide-react';
import Editor from './Editor';
import { cn } from '../lib/utils';

interface SplitEditorProps {
  files: any[];
  leftFileId: string | null;
  rightFileId: string | null;
  onSelectFile: (id: string) => void;
  onUpdateFile: (id: string, content: string) => void;
  onCloseSplit: () => void;
  apiKeys: Record<string, string>;
  onToggleTerminal: () => void;
}

export default function SplitEditor({
  files,
  leftFileId,
  rightFileId,
  onSelectFile,
  onUpdateFile,
  onCloseSplit,
  apiKeys,
  onToggleTerminal,
}: SplitEditorProps) {
  const [splitPosition, setSplitPosition] = useState(50); // percentage
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const leftFile = files.find((f) => f.id === leftFileId) || null;
  const rightFile = files.find((f) => f.id === rightFileId) || null;

  // ─── Drag Handler ─────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const container = containerRef.current;
      if (!container) return;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !container) return;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        setSplitPosition(Math.max(20, Math.min(80, percentage)));
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    []
  );

  // ─── Keyboard shortcut to close split ─────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseSplit();
      }
    },
    [onCloseSplit]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col h-full bg-nexus-bg"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* ─── Split Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-nexus-sidebar border-b border-nexus-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Columns2 size={14} className="text-nexus-accent" />
          <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">
            Split Editor
          </span>
        </div>
        <button
          onClick={onCloseSplit}
          className="p-1 hover:bg-nexus-bg rounded text-nexus-text-muted hover:text-white transition-colors"
          title="Close split (Esc)"
        >
          <X size={14} />
        </button>
      </div>

      {/* ─── Split Panes ───────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane */}
        <div className="flex flex-col overflow-hidden" style={{ width: `${splitPosition}%` }}>
          {leftFile ? (
            <Editor
              file={leftFile}
              onChange={(content) => onUpdateFile(leftFile.id, content)}
              apiKeys={apiKeys}
              onToggleTerminal={onToggleTerminal}
              hideBreadcrumbs
            />
          ) : (
            <EmptyPane label="No file selected" onPick={() => {}} />
          )}
        </div>

        {/* ─── Draggable Divider ────────────────────────────────── */}
        <div
          className="w-[3px] cursor-col-resize hover:bg-[#007acc]/50 active:bg-[#007acc] transition-colors flex-shrink-0 relative group"
          onMouseDown={handleMouseDown}
        >
          {/* Visual drag handle indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gray-600 group-hover:bg-[#007acc] transition-colors" />
        </div>

        {/* Right pane */}
        <div className="flex flex-col overflow-hidden flex-1 min-w-0">
          {rightFile ? (
            <Editor
              file={rightFile}
              onChange={(content) => onUpdateFile(rightFile.id, content)}
              apiKeys={apiKeys}
              onToggleTerminal={onToggleTerminal}
              hideBreadcrumbs
            />
          ) : (
            <EmptyPane
              label="No file selected"
              onPick={() => {
                // Pick the next file that isn't on the left
                const next = files.find((f) => f.id !== leftFileId);
                if (next) onSelectFile(next.id);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty Pane Placeholder ────────────────────────────────────────────────

function EmptyPane({ label, onPick }: { label: string; onPick: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-nexus-bg text-nexus-text-muted">
      <div className="text-center">
        <Columns2 size={24} className="mx-auto mb-2 opacity-30" />
        <p className="text-xs text-gray-600">{label}</p>
        <button
          onClick={onPick}
          className="mt-2 px-3 py-1 text-[10px] bg-nexus-border hover:bg-nexus-border/80 text-white rounded transition-colors"
        >
          Pick file
        </button>
      </div>
    </div>
  );
}
