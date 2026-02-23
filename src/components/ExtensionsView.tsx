import React, { useState } from 'react';
import { Puzzle, Plus, Trash2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Extension {
  id: string;
  name: string;
  description: string;
  url: string;
  enabled: boolean;
}

interface ExtensionsViewProps {
  extensions: Extension[];
  onAddExtension: (url: string) => void;
  onRemoveExtension: (id: string) => void;
  onToggleExtension: (id: string) => void;
}

export default function ExtensionsView({ extensions, onAddExtension, onRemoveExtension, onToggleExtension }: ExtensionsViewProps) {
  const [newUrl, setNewUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim()) {
      onAddExtension(newUrl.trim());
      setNewUrl('');
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
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
      </div>

      <div className="p-4 border-t border-[#333] bg-[#1e1e1e]">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Extensions are external JavaScript files that can modify the IDE's behavior. Use with caution.
        </p>
      </div>
    </div>
  );
}
