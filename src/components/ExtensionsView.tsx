import React, { useState } from 'react';
import { Puzzle, Plus, Trash2, ExternalLink, CheckCircle2, ShoppingBag, Star, Download, Upload, FileArchive } from 'lucide-react';
import { cn } from '../lib/utils';
import JSZip from 'jszip';

const FEATURED_EXTENSIONS = [
  {
    id: 'theme-monokai',
    name: 'Monokai Pro',
    description: 'The classic Monokai theme for Monaco.',
    url: 'https://cdn.jsdelivr.net/npm/monaco-themes/dist/themes/Monokai.json',
    type: 'theme'
  },
  {
    id: 'theme-dracula',
    name: 'Dracula',
    description: 'A dark theme for many editors and shells.',
    url: 'https://cdn.jsdelivr.net/npm/monaco-themes/dist/themes/Dracula.json',
    type: 'theme'
  },
  {
    id: 'ext-prettier',
    name: 'Prettier',
    description: 'Opinionated code formatter for Monaco.',
    url: 'https://cdn.jsdelivr.net/npm/prettier@2.8.8/standalone.js',
    type: 'formatter'
  }
];

interface Extension {
  id: string;
  name: string;
  description: string;
  url: string;
  enabled: boolean;
}

interface ExtensionsViewProps {
  extensions: Extension[];
  onAddExtension: (url: string, metadata?: any) => void;
  onRemoveExtension: (id: string) => void;
  onToggleExtension: (id: string) => void;
}

export default function ExtensionsView({ extensions, onAddExtension, onRemoveExtension, onToggleExtension }: ExtensionsViewProps) {
  const [newUrl, setNewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim()) {
      onAddExtension(newUrl.trim());
      setNewUrl('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      
      // Look for package.json
      const packageJsonFile = content.file('extension/package.json');
      if (!packageJsonFile) {
        throw new Error('Invalid VSIX: package.json not found');
      }

      const packageJson = JSON.parse(await packageJsonFile.async('text'));
      const id = packageJson.name || Math.random().toString(36).substr(2, 9);
      const name = packageJson.displayName || packageJson.name;
      const description = packageJson.description || 'VS Code Extension';

      // Mocking the "install" by just adding it to the list
      // In a real scenario, we'd extract themes/contributions here
      onAddExtension(`vsix://${id}`, {
        id,
        name,
        description,
        enabled: true,
        isVsix: true,
        packageJson
      });

      alert(`Installed ${name} successfully!`);
    } catch (err: any) {
      console.error('VSIX Error:', err);
      alert(`Failed to load VSIX: ${err.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Extensions</h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            placeholder="Extension Script URL"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-xs outline-none focus:border-nexus-accent text-white shadow-inner"
          />
          <button
            type="submit"
            className="w-full bg-nexus-accent hover:bg-nexus-accent/80 text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-nexus-accent/20 uppercase tracking-widest"
          >
            <Plus size={14} />
            Install from URL
          </button>
          <div className="relative">
            <input
              type="file"
              accept=".vsix"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <button
              type="button"
              className="w-full bg-nexus-bg hover:bg-nexus-bg/80 text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-nexus-border uppercase tracking-widest"
            >
              {isUploading ? <Plus size={14} className="animate-spin" /> : <Upload size={14} />}
              Load .VSIX
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-nexus-sidebar">
        {/* Marketplace */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-2">
            <ShoppingBag size={12} /> Featured
          </h3>
          <div className="space-y-2">
            {FEATURED_EXTENSIONS.map(ext => {
              const isInstalled = extensions.some(e => e.url === ext.url);
              return (
                <div key={ext.id} className="p-3 bg-nexus-bg rounded-xl border border-nexus-border hover:border-nexus-accent/30 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-white">{ext.name}</span>
                    </div>
                    {!isInstalled && (
                      <button
                        onClick={() => onAddExtension(ext.url)}
                        className="p-1.5 hover:bg-nexus-sidebar text-nexus-accent rounded-md transition-colors"
                        title="Install"
                      >
                        <Download size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-nexus-text-muted mb-3 leading-relaxed">{ext.description}</p>
                  <span className="text-[9px] px-2 py-0.5 rounded-lg bg-nexus-sidebar text-nexus-text-muted font-bold uppercase border border-nexus-border">
                    {ext.type}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Installed</h3>
          {extensions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-nexus-text-muted gap-2">
              <Puzzle size={32} className="opacity-10" />
              <p className="text-xs italic">No extensions installed</p>
            </div>
          ) : (
            <div className="space-y-2">
              {extensions.map(ext => (
                <div key={ext.id} className="p-3 bg-nexus-bg rounded-xl border border-nexus-border group shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{ext.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onToggleExtension(ext.id)}
                        className={cn(
                          "p-1.5 rounded-md hover:bg-nexus-sidebar transition-colors",
                          ext.enabled ? "text-emerald-500" : "text-nexus-text-muted"
                        )}
                        title={ext.enabled ? "Disable" : "Enable"}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        onClick={() => onRemoveExtension(ext.id)}
                        className="p-1.5 rounded-md hover:bg-nexus-sidebar text-red-400 transition-colors"
                        title="Uninstall"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-nexus-text-muted mb-3 line-clamp-2 leading-relaxed">{ext.description || ext.url}</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase border",
                      ext.enabled ? "bg-emerald-900/10 text-emerald-400 border-emerald-500/20" : "bg-nexus-sidebar text-nexus-text-muted border-nexus-border"
                    )}>
                      {ext.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <a href={ext.url} target="_blank" rel="noreferrer" className="text-[9px] text-nexus-accent hover:underline flex items-center gap-0.5 ml-auto font-bold">
                      SOURCE <ExternalLink size={8} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="p-4 border-t border-nexus-border bg-nexus-bg">
        <p className="text-[10px] text-nexus-text-muted leading-relaxed italic text-center font-bold tracking-wider">
          NEXUS 4.0 EXTENSION ENGINE
        </p>
      </div>
    </div>
  );
}
