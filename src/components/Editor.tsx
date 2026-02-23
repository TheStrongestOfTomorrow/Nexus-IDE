import React from 'react';
import MonacoEditor from '@monaco-editor/react';
import { FileNode } from '../hooks/useFileSystem';

interface EditorProps {
  activeFile: FileNode | null;
  onChange: (id: string, content: string) => void;
}

export default function Editor({ activeFile, onChange }: EditorProps) {
  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-[#cccccc]">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-2">Nexus IDE</h2>
          <p className="text-gray-500">Select a file to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex items-center px-4 py-2 bg-[#2d2d2d] border-b border-[#1e1e1e]">
        <span className="text-sm text-[#cccccc] font-mono">{activeFile.name}</span>
      </div>
      <div className="flex-1 relative">
        <MonacoEditor
          height="100%"
          language={activeFile.language}
          theme="vs-dark"
          value={activeFile.content}
          onChange={(value) => onChange(activeFile.id, value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
}
