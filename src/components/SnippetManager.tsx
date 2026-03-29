import React, { useState } from 'react';
import { Scissors, Plus, Trash2, Copy, Check } from 'lucide-react';

interface Snippet {
  id: string;
  name: string;
  code: string;
  language: string;
}

export default function SnippetManager() {
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    const saved = localStorage.getItem('nexus_snippets');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'React Component', language: 'typescript', code: 'export default function Component() {\n  return <div>Hello</div>;\n}' },
      { id: '2', name: 'Console Log', language: 'javascript', code: 'console.log("DEBUG:", variable);' }
    ];
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newSnippet, setNewSnippet] = useState({ name: '', code: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const saveSnippets = (newSnippets: Snippet[]) => {
    setSnippets(newSnippets);
    localStorage.setItem('nexus_snippets', JSON.stringify(newSnippets));
  };

  const handleAdd = () => {
    if (!newSnippet.name || !newSnippet.code) return;
    const snippet: Snippet = {
      id: Date.now().toString(),
      name: newSnippet.name,
      code: newSnippet.code,
      language: 'javascript' // Default
    };
    saveSnippets([...snippets, snippet]);
    setNewSnippet({ name: '', code: '' });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    saveSnippets(snippets.filter(s => s.id !== id));
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 bg-nexus-sidebar h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Scissors size={16} className="text-nexus-accent" />
          SNIPPETS
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 hover:bg-white/10 rounded text-nexus-text transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {isAdding && (
        <div className="bg-nexus-bg border border-nexus-border rounded p-3 mb-4 space-y-3 animate-in slide-in-from-top-2">
          <input
            type="text"
            placeholder="Snippet Name"
            className="w-full bg-[#333] border border-transparent rounded px-2 py-1 text-xs text-white focus:border-nexus-accent outline-none"
            value={newSnippet.name}
            onChange={e => setNewSnippet({ ...newSnippet, name: e.target.value })}
          />
          <textarea
            placeholder="Code..."
            className="w-full h-24 bg-[#333] border border-transparent rounded px-2 py-1 text-xs text-white font-mono focus:border-nexus-accent outline-none resize-none"
            value={newSnippet.code}
            onChange={e => setNewSnippet({ ...newSnippet, code: e.target.value })}
          />
          <button 
            onClick={handleAdd}
            className="w-full bg-nexus-accent text-white py-1.5 rounded text-xs font-bold hover:bg-nexus-accent/90"
          >
            SAVE SNIPPET
          </button>
        </div>
      )}

      <div className="space-y-3">
        {snippets.map(snippet => (
          <div key={snippet.id} className="bg-nexus-bg border border-nexus-border rounded p-3 group hover:border-nexus-accent transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">{snippet.name}</span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleCopy(snippet.code, snippet.id)}
                  className="hover:text-nexus-accent transition-colors"
                >
                  {copiedId === snippet.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
                <button 
                  onClick={() => handleDelete(snippet.id)}
                  className="hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <pre className="text-[10px] text-nexus-text-muted font-mono bg-[#1e1e1e] p-2 rounded overflow-x-auto">
              {snippet.code}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
