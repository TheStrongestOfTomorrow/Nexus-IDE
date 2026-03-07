import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Maximize2, Download, RefreshCw } from 'lucide-react';

interface MermaidViewerProps {
  chart: string;
  onClose?: () => void;
}

export default function MermaidViewer({ chart, onClose }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
    });
  }, []);

  useEffect(() => {
    if (containerRef.current && chart) {
      containerRef.current.innerHTML = `<div class="mermaid">${chart}</div>`;
      mermaid.contentLoaded();
    }
  }, [chart]);

  const handleDownload = () => {
    const svg = containerRef.current?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = 'architecture.svg';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="flex flex-col h-full bg-nexus-bg border border-nexus-border rounded-2xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-nexus-sidebar border-b border-nexus-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-nexus-accent animate-pulse" />
          <span className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Architecture Diagram</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownload}
            className="p-1.5 hover:bg-nexus-bg rounded-lg text-nexus-text-muted hover:text-white transition-all"
            title="Download SVG"
          >
            <Download size={14} />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-nexus-bg rounded-lg text-nexus-text-muted hover:text-white transition-all"
            >
              <Maximize2 size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-nexus-bg no-scrollbar">
        <div ref={containerRef} className="w-full h-full flex items-center justify-center transition-all duration-500" />
      </div>
    </div>
  );
}
