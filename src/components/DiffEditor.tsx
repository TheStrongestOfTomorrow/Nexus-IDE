import React from 'react';
import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react';

interface DiffEditorProps {
  original: string;
  modified: string;
  language?: string;
  onClose: () => void;
  onApply: () => void;
}

export default function DiffEditor({ original, modified, language = 'javascript', onClose, onApply }: DiffEditorProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-nexus-bg border border-nexus-border shadow-2xl m-10 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between px-4 py-3 bg-nexus-sidebar border-b border-nexus-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-nexus-accent animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-widest">Review Changes</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-nexus-text-muted hover:text-white transition-colors uppercase tracking-widest"
          >
            Discard
          </button>
          <button 
            onClick={onApply}
            className="px-6 py-1.5 text-xs bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg font-bold transition-all shadow-lg shadow-nexus-accent/20 uppercase tracking-widest"
          >
            Apply Changes
          </button>
        </div>
      </div>
      <div className="flex-1 bg-nexus-bg">
        <MonacoDiffEditor
          original={original}
          modified={modified}
          language={language}
          theme="vs-dark"
          options={{
            renderSideBySide: true,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
            scrollBeyondLastLine: false,
            readOnly: false,
            originalEditable: false,
            renderOverviewRuler: false,
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden'
            }
          }}
        />
      </div>
    </div>
  );
}
