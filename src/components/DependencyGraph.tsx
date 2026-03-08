import React, { useMemo } from 'react';
import { Package, Box } from 'lucide-react';
import { FileNode } from '../hooks/useFileSystem';

interface DependencyGraphProps {
  files: FileNode[];
}

export default function DependencyGraph({ files }: DependencyGraphProps) {
  const dependencies = useMemo(() => {
    const pkgJson = files.find(f => f.name === 'package.json');
    if (!pkgJson) return { deps: {}, devDeps: {} };

    try {
      const json = JSON.parse(pkgJson.content);
      return {
        deps: json.dependencies || {},
        devDeps: json.devDependencies || {}
      };
    } catch {
      return { deps: {}, devDeps: {} };
    }
  }, [files]);

  return (
    <div className="p-4 bg-nexus-sidebar h-full overflow-y-auto">
      <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
        <Package size={16} className="text-nexus-accent" />
        DEPENDENCY VISUALIZER
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-nexus-text-muted uppercase tracking-wider flex items-center gap-2">
            <Box size={12} /> Production ({Object.keys(dependencies.deps).length})
          </h3>
          <div className="grid gap-2">
            {Object.entries(dependencies.deps).map(([name, version]) => (
              <div key={name} className="bg-nexus-bg border border-nexus-border p-3 rounded flex items-center justify-between group hover:border-nexus-accent transition-colors">
                <span className="text-sm font-medium text-nexus-text group-hover:text-white">{name}</span>
                <span className="text-[10px] bg-[#333] px-2 py-0.5 rounded text-nexus-text-muted font-mono">{String(version)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-nexus-text-muted uppercase tracking-wider flex items-center gap-2">
            <Box size={12} /> Development ({Object.keys(dependencies.devDeps).length})
          </h3>
          <div className="grid gap-2">
            {Object.entries(dependencies.devDeps).map(([name, version]) => (
              <div key={name} className="bg-nexus-bg border border-nexus-border p-3 rounded flex items-center justify-between group hover:border-nexus-accent transition-colors">
                <span className="text-sm font-medium text-nexus-text group-hover:text-white">{name}</span>
                <span className="text-[10px] bg-[#333] px-2 py-0.5 rounded text-nexus-text-muted font-mono">{String(version)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
