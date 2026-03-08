import React, { useMemo } from 'react';
import { CheckSquare, AlertCircle, FileCode } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';

interface TodoScannerProps {
  files: FileNode[];
  onSelectFile: (id: string) => void;
}

export default function TodoScanner({ files, onSelectFile }: TodoScannerProps) {
  const todos = useMemo(() => {
    const results: { file: FileNode; items: { line: number; type: string; text: string }[] }[] = [];
    
    files.forEach(file => {
      const lines = file.content.split('\n');
      const fileTodos: { line: number; type: string; text: string }[] = [];
      
      lines.forEach((content, index) => {
        const match = content.match(/\/\/\s*(TODO|FIXME|HACK|NOTE|BUG):\s*(.*)/i);
        if (match) {
          fileTodos.push({
            line: index + 1,
            type: match[1].toUpperCase(),
            text: match[2].trim()
          });
        }
      });

      if (fileTodos.length > 0) {
        results.push({ file, items: fileTodos });
      }
    });

    return results;
  }, [files]);

  return (
    <div className="p-4 bg-nexus-sidebar h-full overflow-y-auto">
      <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
        <CheckSquare size={16} className="text-nexus-accent" />
        TODO SCANNER
      </h2>

      {todos.length === 0 ? (
        <div className="text-center text-nexus-text-muted mt-10">
          <CheckSquare size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-xs">No todos found. Clean code! ✨</p>
        </div>
      ) : (
        <div className="space-y-6">
          {todos.map(({ file, items }) => (
            <div key={file.id} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-nexus-text-muted bg-nexus-bg/50 px-2 py-1 rounded">
                <FileCode size={12} />
                {file.name}
              </div>
              <div className="space-y-1">
                {items.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => onSelectFile(file.id)}
                    className="group flex gap-3 px-3 py-2 rounded hover:bg-nexus-bg cursor-pointer border border-transparent hover:border-nexus-border transition-all"
                  >
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded h-fit ${
                      item.type === 'FIXME' || item.type === 'BUG' ? 'bg-red-900/50 text-red-400' :
                      item.type === 'HACK' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-blue-900/50 text-blue-400'
                    }`}>
                      {item.type}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-nexus-text truncate group-hover:text-white">{item.text}</p>
                      <p className="text-[10px] text-nexus-text-muted font-mono mt-0.5">Line {item.line}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
