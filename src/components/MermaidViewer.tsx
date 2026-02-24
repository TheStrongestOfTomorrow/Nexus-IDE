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
    <div className="flex flex-col h-full bg-[#1e1e1e] border border-[#333] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Architecture Diagram</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownload}
            className="p-1 hover:bg-[#333] rounded text-gray-400 transition-colors"
            title="Download SVG"
          >
            <Download size={14} />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 hover:bg-[#333] rounded text-gray-400 transition-colors"
            >
              <Maximize2 size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#1a1a1a]">
        <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
      </div>
    </div>
  );
}
