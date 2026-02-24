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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1e1e1e] border border-[#333] shadow-2xl m-10 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
        <span className="text-xs font-bold text-white uppercase tracking-wider">File Comparison</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onApply}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
      <div className="flex-1">
        <MonacoDiffEditor
          original={original}
          modified={modified}
          language={language}
          theme="vs-dark"
          options={{
            renderSideBySide: true,
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            readOnly: false,
            originalEditable: false,
          }}
        />
      </div>
    </div>
  );
}
