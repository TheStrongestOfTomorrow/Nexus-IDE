import React, { useMemo } from 'react';
import { PieChart, BarChart, Code, FileText, Layers, Database } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';

interface ProjectInsightsProps {
  files: FileNode[];
}

export default function ProjectInsights({ files }: ProjectInsightsProps) {
  const stats = useMemo(() => {
    let totalLines = 0;
    const languages: Record<string, number> = {};
    const fileTypes: Record<string, number> = {};

    files.forEach(file => {
      const lines = file.content.split('\n').length;
      totalLines += lines;

      const ext = file.name.split('.').pop() || 'unknown';
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;

      const lang = file.language || 'text';
      languages[lang] = (languages[lang] || 0) + 1;
    });

    return { totalLines, languages, fileTypes };
  }, [files]);

  return (
    <div className="p-4 bg-nexus-sidebar h-full overflow-y-auto">
      <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
        <BarChart size={16} className="text-nexus-accent" />
        PROJECT INSIGHTS
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-nexus-bg border border-nexus-border p-4 rounded flex flex-col items-center justify-center gap-2">
          <Code size={24} className="text-nexus-accent" />
          <span className="text-2xl font-bold text-white">{stats.totalLines}</span>
          <span className="text-[10px] text-nexus-text-muted uppercase tracking-wider">Total Lines</span>
        </div>
        <div className="bg-nexus-bg border border-nexus-border p-4 rounded flex flex-col items-center justify-center gap-2">
          <FileText size={24} className="text-emerald-400" />
          <span className="text-2xl font-bold text-white">{files.length}</span>
          <span className="text-[10px] text-nexus-text-muted uppercase tracking-wider">Total Files</span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-bold text-nexus-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers size={12} /> Languages
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.languages)
              .sort(([, a], [, b]) => b - a)
              .map(([lang, count]) => (
                <div key={lang} className="flex items-center gap-2">
                  <div className="flex-1 bg-nexus-bg h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-nexus-accent" 
                      style={{ width: `${(count / files.length) * 100}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-mono text-nexus-text w-16 text-right">
                    {lang} ({Math.round((count / files.length) * 100)}%)
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-nexus-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Database size={12} /> File Types
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(stats.fileTypes).map(([ext, count]) => (
              <div key={ext} className="bg-nexus-bg border border-nexus-border p-2 rounded flex flex-col items-center">
                <span className="text-xs font-bold text-white">.{ext}</span>
                <span className="text-[10px] text-nexus-text-muted">{count} files</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
