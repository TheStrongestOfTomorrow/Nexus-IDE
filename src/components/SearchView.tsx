import React, { useState } from 'react';
import { Search, FileText, ChevronRight, Globe, Command } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';
import { cn } from '../lib/utils';

interface SearchViewProps {
  files: FileNode[];
  onSelectFile: (id: string) => void;
}

export default function SearchView({ files, onSelectFile }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ file: FileNode; line: number; text: string }[]>([]);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }

    const newResults: { file: FileNode; line: number; text: string }[] = [];
    files.forEach(file => {
      const lines = file.content.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(val.toLowerCase())) {
          newResults.push({
            file,
            line: index + 1,
            text: line.trim()
          });
        }
      });
    });
    setResults(newResults.slice(0, 50)); // Limit to 50 results
  };

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Search</h2>
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-text-muted group-focus-within:text-nexus-accent transition-colors" />
          <input
            type="text"
            placeholder="Search in workspace..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-nexus-bg border border-nexus-border rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-nexus-accent text-white shadow-inner"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
        {results.length === 0 && query && (
          <div className="text-center py-8 text-nexus-text-muted text-[10px] uppercase tracking-widest opacity-50">
            No results found
          </div>
        )}
        
        {results.length === 0 && !query && (
          <div className="text-center py-8 text-nexus-text-muted text-[10px] uppercase tracking-widest opacity-50">
            Enter search term
          </div>
        )}

        {results.map((result, i) => (
          <div
            key={i}
            onClick={() => onSelectFile(result.file.id)}
            className="p-2 hover:bg-nexus-bg rounded-lg cursor-pointer group transition-all border border-transparent hover:border-nexus-border"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText size={12} className="text-nexus-accent" />
              <span className="text-[10px] font-bold text-white truncate">{result.file.name}</span>
              <span className="text-[9px] text-nexus-text-muted ml-auto">Line {result.line}</span>
            </div>
            <div className="text-[10px] text-nexus-text-muted font-mono truncate opacity-70 group-hover:opacity-100">
              {result.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
