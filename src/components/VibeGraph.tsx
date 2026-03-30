import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { FileNode } from '../hooks/useFileSystem';
import { Maximize2, Minimize2, RefreshCw, X, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface VibeGraphProps {
  files: FileNode[];
  onClose: () => void;
  onSelectFile?: (id: string) => void;
}

export default function VibeGraph({ files, onClose, onSelectFile }: VibeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [graphDefinition, setGraphDefinition] = useState('');

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }, []);

  useEffect(() => {
    const generateGraph = () => {
      let definition = 'graph LR\n';
      const nodes = new Set<string>();
      const edges: string[] = [];

      files.forEach(file => {
        const fileName = file.name.split('/').pop() || file.name;
        const nodeId = file.id.replace(/[^a-zA-Z0-9]/g, '_');
        nodes.add(`${nodeId}["${fileName}"]`);

        // Simple regex to find imports
        const importRegex = /import\s+.*\s+from\s+['"](.+)['"]/g;
        let match;
        while ((match = importRegex.exec(file.content)) !== null) {
          const importPath = match[1];
          const importedFileName = importPath.split('/').pop() || importPath;
          
          // Try to find the imported file in our workspace
          const importedFile = files.find(f => 
            f.name.includes(importedFileName) || 
            (importedFileName.endsWith('.tsx') && f.name.includes(importedFileName.replace('.tsx', ''))) ||
            (importedFileName.endsWith('.ts') && f.name.includes(importedFileName.replace('.ts', '')))
          );

          if (importedFile) {
            const targetId = importedFile.id.replace(/[^a-zA-Z0-9]/g, '_');
            edges.push(`${nodeId} --> ${targetId}`);
          }
        }
      });

      nodes.forEach(node => { definition += `  ${node}\n`; });
      edges.forEach(edge => { definition += `  ${edge}\n`; });

      // Add click events
      files.forEach(file => {
        const nodeId = file.id.replace(/[^a-zA-Z0-9]/g, '_');
        definition += `  click ${nodeId} call handleNodeClick("${file.id}")\n`;
      });

      setGraphDefinition(definition);
    };

    generateGraph();
  }, [files]);

  useEffect(() => {
    if (graphDefinition && containerRef.current) {
      containerRef.current.innerHTML = `<div class="mermaid">${graphDefinition}</div>`;
      mermaid.contentLoaded();
      
      // Expose click handler to window for mermaid
      (window as any).handleNodeClick = (id: string) => {
        onSelectFile?.(id);
      };

      return () => {
        delete (window as any).handleNodeClick;
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphDefinition]);

  return (
    <div className={cn(
      "bg-nexus-sidebar border-l border-nexus-border flex flex-col transition-all duration-300 shadow-2xl",
      isMaximized ? "fixed inset-10 z-[150] rounded-2xl border-2 border-nexus-accent/50 shadow-nexus-accent/20" : "w-80 h-full"
    )}>
      <div className="flex items-center justify-between px-4 py-3 bg-nexus-sidebar border-b border-nexus-border">
        <div className="flex items-center gap-2">
          <Share2 size={14} className="text-nexus-accent" />
          <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Vibe Graph</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 hover:bg-nexus-bg rounded-lg text-nexus-text-muted hover:text-white transition-all">
            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-nexus-bg rounded-lg text-nexus-text-muted hover:text-white transition-all">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-nexus-bg no-scrollbar" ref={containerRef} />
      <div className="p-3 bg-nexus-sidebar border-t border-nexus-border text-[9px] text-nexus-text-muted text-center uppercase tracking-widest font-bold italic">
        Live Data Flow Visualization
      </div>
    </div>
  );
}
