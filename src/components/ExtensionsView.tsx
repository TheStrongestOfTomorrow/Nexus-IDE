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
    <div className="flex flex-col h-full bg-[#252526]">
      <div className="p-4 border-b border-[#333]">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Extensions</h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            placeholder="Extension Script URL"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            className="w-full bg-[#3c3c3c] border border-[#3c3c3c] rounded px-2 py-1.5 text-xs outline-none focus:border-[#007acc] text-white"
          />
          <button
            type="submit"
            className="w-full bg-[#007acc] hover:bg-[#0062a3] text-white py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
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
              className="w-full bg-[#3c3c3c] hover:bg-[#444] text-white py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-[#444]"
            >
              {isUploading ? <Plus size={14} className="animate-spin" /> : <Upload size={14} />}
              Load .VSIX
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Marketplace */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <ShoppingBag size={12} /> Featured
          </h3>
          <div className="space-y-2">
            {FEATURED_EXTENSIONS.map(ext => {
              const isInstalled = extensions.some(e => e.url === ext.url);
              return (
                <div key={ext.id} className="p-3 bg-[#1e1e1e] rounded border border-[#333] hover:border-[#444] transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Star size={12} className="text-yellow-500" />
                      <span className="text-xs font-bold text-gray-200">{ext.name}</span>
                    </div>
                    {!isInstalled && (
                      <button
                        onClick={() => onAddExtension(ext.url)}
                        className="p-1 hover:bg-[#333] text-blue-400 rounded"
                        title="Install"
                      >
                        <Download size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2">{ext.description}</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#333] text-gray-400 font-bold uppercase">
                    {ext.type}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Installed</h3>
          {extensions.length === 0 ? (
            <p className="text-xs text-gray-500 italic text-center py-4">No extensions installed</p>
          ) : (
            <div className="space-y-2">
              {extensions.map(ext => (
                <div key={ext.id} className="p-3 bg-[#1e1e1e] rounded border border-[#333] group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-200">{ext.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onToggleExtension(ext.id)}
                        className={cn(
                          "p-1 rounded hover:bg-[#333]",
                          ext.enabled ? "text-emerald-500" : "text-gray-500"
                        )}
                        title={ext.enabled ? "Disable" : "Enable"}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        onClick={() => onRemoveExtension(ext.id)}
                        className="p-1 rounded hover:bg-[#333] text-red-400"
                        title="Uninstall"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2 line-clamp-2">{ext.description || ext.url}</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                      ext.enabled ? "bg-emerald-900/30 text-emerald-400" : "bg-gray-800 text-gray-500"
                    )}>
                      {ext.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <a href={ext.url} target="_blank" rel="noreferrer" className="text-[9px] text-blue-400 hover:underline flex items-center gap-0.5">
                      Source <ExternalLink size={8} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="p-4 border-t border-[#333] bg-[#1e1e1e]">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Extensions are external JavaScript files that can modify the IDE's behavior. Use with caution.
        </p>
      </div>
    </div>
  );
}
