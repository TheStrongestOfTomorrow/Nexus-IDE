import React, { useState, useMemo, useCallback } from 'react';
import { Server, Plus, Trash2, Edit3, Check, X, GitCompare, ChevronDown, ChevronRight, Shield, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { FileNode } from '../hooks/useFileSystem';

interface EnvironmentManagerProps {
  files?: FileNode[];
  onUpdateFile?: (fileId: string, content: string) => void;
}

interface EnvVariable {
  key: string;
  value: string;
}

interface ParsedEnvFile {
  fileId: string;
  fileName: string;
  variables: EnvVariable[];
}

const ENV_FILE_PATTERNS = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.staging',
  '.env.development',
];

const ENV_TEMPLATE = `# Environment Variables
# Add your environment variables below
# Example: KEY=value

APP_NAME=Nexus-IDE
APP_VERSION=1.0.0
`;

function parseEnvContent(content: string): EnvVariable[] {
  const vars: EnvVariable[] = [];
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) {
      vars.push({ key, value });
    }
  });
  return vars;
}

function serializeEnvVariables(variables: EnvVariable[], existingContent: string): string {
  // Rebuild content: keep comments, update/add variables
  const varMap = new Map(variables.map(v => [v.key, v.value]));
  const usedKeys = new Set<string>();
  const lines = existingContent.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return line;
    const key = trimmed.slice(0, eqIdx).trim();
    if (key && varMap.has(key)) {
      usedKeys.add(key);
      return `${key}=${varMap.get(key)}`;
    }
    return line;
  });

  // Append any new keys
  varMap.forEach((value, key) => {
    if (!usedKeys.has(key)) {
      lines.push(`${key}=${value}`);
    }
  });

  return lines.join('\n');
}

export default function EnvironmentManager({ files = [], onUpdateFile }: EnvironmentManagerProps) {
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [compareFromFileId, setCompareFromFileId] = useState<string>('');
  const [compareToFileId, setCompareToFileId] = useState<string>('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddVar, setShowAddVar] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Find .env files and parse them
  const parsedEnvFiles = useMemo((): ParsedEnvFile[] => {
    return files
      .filter(f => {
        const name = f.name.toLowerCase();
        return ENV_FILE_PATTERNS.some(p => name === p || name.endsWith('/' + p));
      })
      .map(f => ({
        fileId: f.id,
        fileName: f.name,
        variables: parseEnvContent(f.content),
      }));
  }, [files]);

  // Find which env files are missing
  const missingEnvFiles = useMemo(() => {
    const foundNames = new Set(parsedEnvFiles.map(f => f.fileName.toLowerCase()));
    return ENV_FILE_PATTERNS.filter(p => !foundNames.has(p));
  }, [parsedEnvFiles]);

  // File lookup helper
  const getFileById = useCallback((id: string) => files.find(f => f.id === id), [files]);

  // Cross-env comparison
  const diffVars = useMemo(() => {
    if (!showComparison || !compareFromFileId || !compareToFileId) return [];
    const fromFile = parsedEnvFiles.find(f => f.fileId === compareFromFileId);
    const toFile = parsedEnvFiles.find(f => f.fileId === compareToFileId);
    if (!fromFile || !toFile) return [];

    const diffs: { key: string; fromVal: string | null; toVal: string | null; type: 'changed' | 'added' | 'removed' }[] = [];
    const allKeys = new Set([...fromFile.variables.map(v => v.key), ...toFile.variables.map(v => v.key)]);

    allKeys.forEach(key => {
      const fromVar = fromFile.variables.find(v => v.key === key);
      const toVar = toFile.variables.find(v => v.key === key);
      if (!fromVar) {
        diffs.push({ key, fromVal: null, toVal: toVar?.value ?? '', type: 'added' });
      } else if (!toVar) {
        diffs.push({ key, fromVal: fromVar.value, toVal: null, type: 'removed' });
      } else if (fromVar.value !== toVar.value) {
        diffs.push({ key, fromVal: fromVar.value, toVal: toVar.value, type: 'changed' });
      }
    });

    return diffs;
  }, [showComparison, compareFromFileId, compareToFileId, parsedEnvFiles]);

  const activeParsed = parsedEnvFiles.find(f => f.fileId === expandedFileId);

  const handleAddVar = () => {
    if (!newKey.trim() || !expandedFileId || !onUpdateFile) return;
    const file = getFileById(expandedFileId);
    if (!file) return;

    const current = parseEnvContent(file.content);
    if (current.some(v => v.key === newKey.trim())) return;
    current.push({ key: newKey.trim(), value: newValue });
    const newContent = serializeEnvVariables(current, file.content);
    onUpdateFile(expandedFileId, newContent);
    setNewKey('');
    setNewValue('');
    setShowAddVar(null);
  };

  const handleDeleteVar = (key: string) => {
    if (!expandedFileId || !onUpdateFile) return;
    const file = getFileById(expandedFileId);
    if (!file) return;

    const current = parseEnvContent(file.content).filter(v => v.key !== key);
    const newContent = serializeEnvVariables(current, file.content);
    onUpdateFile(expandedFileId, newContent);
    setEditingKey(null);
  };

  const handleEditVar = (key: string) => {
    if (!expandedFileId || !onUpdateFile) return;
    const file = getFileById(expandedFileId);
    if (!file) return;

    const current = parseEnvContent(file.content);
    const updated = current.map(v => v.key === key ? { ...v, value: editValue } : v);
    const newContent = serializeEnvVariables(updated, file.content);
    onUpdateFile(expandedFileId, newContent);
    setEditingKey(null);
  };

  const handleCreateEnv = (fileName: string) => {
    if (!onUpdateFile) return;
    // We need to add a new file — since we can't create files from here,
    // show a helpful message
    alert(`To create ${fileName}, use the file explorer to create a new file and paste the following template:\n\n${ENV_TEMPLATE}`);
  };

  const canEdit = !!onUpdateFile;

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
          <Server size={16} className="text-nexus-accent" />
          Environments
        </h2>

        {/* Found env files tabs */}
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {parsedEnvFiles.map(env => (
            <button
              key={env.fileId}
              onClick={() => { setExpandedFileId(expandedFileId === env.fileId ? null : env.fileId); setShowAddVar(null); setEditingKey(null); }}
              className={cn(
                'p-2 rounded-lg border text-center transition-all',
                expandedFileId === env.fileId
                  ? 'border-nexus-accent/50 bg-nexus-accent/10'
                  : 'border-nexus-border bg-nexus-bg hover:border-nexus-accent/30'
              )}
            >
              <div className="text-sm mb-0.5 text-emerald-400">
                <FileText size={14} className="mx-auto" />
              </div>
              <div className="text-[8px] font-bold text-white uppercase truncate">{env.fileName.replace('.env', '') || '.env'}</div>
              <div className="text-[8px] text-nexus-text-muted">{env.variables.length} vars</div>
            </button>
          ))}
        </div>

        {/* Missing files */}
        {missingEnvFiles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {missingEnvFiles.map(name => (
              <button
                key={name}
                onClick={() => handleCreateEnv(name)}
                className="flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-nexus-border text-[8px] text-nexus-text-muted hover:text-white hover:border-nexus-accent/50 transition-colors"
              >
                <Plus size={8} />
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {parsedEnvFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="w-16 h-16 bg-nexus-bg rounded-2xl flex items-center justify-center border border-nexus-border shadow-xl">
              <Shield size={32} className="text-nexus-text-muted" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs font-bold text-white">No .env Files Found</p>
              <p className="text-[10px] text-nexus-text-muted leading-relaxed max-w-[200px]">
                Create a .env, .env.local, .env.production, .env.staging, or .env.development file to manage your environment variables here.
              </p>
            </div>
          </div>
        )}

        {/* Active env file variables */}
        {activeParsed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-2">
                <Shield size={12} className="text-nexus-accent" />
                {activeParsed.fileName}
              </h3>
              {!canEdit && (
                <span className="text-[8px] text-amber-400 font-bold uppercase">Read-only</span>
              )}
            </div>

            <div className="bg-nexus-bg rounded-xl border border-nexus-border overflow-hidden shadow-sm">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-0 text-[9px] font-bold text-nexus-text-muted uppercase tracking-wider border-b border-nexus-border">
                <div className="p-2.5">Key</div>
                <div className="p-2.5">Value</div>
                <div className="p-2.5 text-right">Actions</div>
              </div>
              {activeParsed.variables.length === 0 && (
                <div className="p-4 text-center text-[10px] text-nexus-text-muted italic opacity-50">
                  No variables defined
                </div>
              )}
              {activeParsed.variables.map(variable => (
                <div key={variable.key} className="grid grid-cols-[1fr_1fr_auto] gap-0 border-b border-nexus-border last:border-none hover:bg-nexus-sidebar transition-colors">
                  <div className="p-2.5">
                    <span className="text-[10px] text-nexus-accent font-mono font-bold">{variable.key}</span>
                  </div>
                  <div className="p-2.5">
                    {editingKey === variable.key ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="flex-1 bg-nexus-sidebar border border-nexus-accent rounded px-2 py-0.5 text-[10px] text-white font-mono outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditVar(variable.key)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-nexus-text-muted font-mono truncate block">{variable.value || '(empty)'}</span>
                    )}
                  </div>
                  <div className="p-2.5 flex items-center justify-end gap-1">
                    {editingKey !== variable.key && canEdit && (
                      <>
                        <button
                          onClick={() => { setEditingKey(variable.key); setEditValue(variable.value); }}
                          className="p-1 text-nexus-text-muted hover:text-white transition-colors"
                        >
                          <Edit3 size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteVar(variable.key)}
                          className="p-1 text-nexus-text-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Variable */}
            {canEdit && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddVar(showAddVar === 'active' ? null : 'active')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-nexus-bg hover:bg-nexus-bg/80 text-white rounded-lg text-[10px] font-bold transition-all border border-nexus-border uppercase tracking-widest"
                >
                  <Plus size={12} />
                  Add Variable
                </button>
              </div>
            )}

            {showAddVar === 'active' && canEdit && (
              <div className="p-3 bg-nexus-bg rounded-xl border border-nexus-border space-y-2 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    className="bg-nexus-sidebar border border-nexus-border rounded-lg px-3 py-1.5 text-[10px] text-white font-mono outline-none focus:border-nexus-accent"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    className="bg-nexus-sidebar border border-nexus-border rounded-lg px-3 py-1.5 text-[10px] text-white font-mono outline-none focus:border-nexus-accent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddVar(null)}
                    className="flex-1 text-[10px] text-nexus-text-muted hover:text-white transition-colors uppercase font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddVar}
                    disabled={!newKey.trim()}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest disabled:opacity-50"
                  >
                    <Plus size={10} />
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cross-env Comparison */}
        {parsedEnvFiles.length >= 2 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="flex items-center gap-2 text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest w-full"
            >
              <GitCompare size={12} className="text-nexus-accent" />
              Cross-Environment Comparison
              {showComparison ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
            </button>

            {showComparison && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={compareFromFileId}
                    onChange={e => setCompareFromFileId(e.target.value)}
                    className="bg-nexus-bg border border-nexus-border rounded-lg px-3 py-1.5 text-[10px] text-white outline-none focus:border-nexus-accent"
                  >
                    <option value="">Select file...</option>
                    {parsedEnvFiles.map(env => (
                      <option key={env.fileId} value={env.fileId}>{env.fileName}</option>
                    ))}
                  </select>
                  <select
                    value={compareToFileId}
                    onChange={e => setCompareToFileId(e.target.value)}
                    className="bg-nexus-bg border border-nexus-border rounded-lg px-3 py-1.5 text-[10px] text-white outline-none focus:border-nexus-accent"
                  >
                    <option value="">Select file...</option>
                    {parsedEnvFiles.map(env => (
                      <option key={env.fileId} value={env.fileId}>{env.fileName}</option>
                    ))}
                  </select>
                </div>

                {compareFromFileId && compareToFileId && (
                  <div className="bg-nexus-bg rounded-xl border border-nexus-border overflow-hidden shadow-sm">
                    {diffVars.length > 0 ? (
                      diffVars.map(diff => (
                        <div key={diff.key} className="p-2.5 border-b border-nexus-border last:border-none">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-nexus-accent font-mono font-bold">{diff.key}</span>
                            {diff.type === 'changed' && (
                              <span className="text-[9px] text-amber-400 font-bold uppercase bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">changed</span>
                            )}
                            {diff.type === 'added' && (
                              <span className="text-[9px] text-emerald-400 font-bold uppercase bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">added</span>
                            )}
                            {diff.type === 'removed' && (
                              <span className="text-[9px] text-red-400 font-bold uppercase bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/30">removed</span>
                            )}
                          </div>
                          {diff.type !== 'added' && (
                            <div className="flex items-center gap-2 text-[9px]">
                              <span className="text-nexus-text-muted w-16 shrink-0 truncate">{parsedEnvFiles.find(e => e.fileId === compareFromFileId)?.fileName}:</span>
                              <span className="text-red-400 font-mono line-through">{diff.fromVal}</span>
                            </div>
                          )}
                          {diff.type !== 'removed' && (
                            <div className="flex items-center gap-2 text-[9px]">
                              <span className="text-nexus-text-muted w-16 shrink-0 truncate">{parsedEnvFiles.find(e => e.fileId === compareToFileId)?.fileName}:</span>
                              <span className="text-emerald-400 font-mono">{diff.toVal}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-[10px] text-nexus-text-muted italic opacity-50">
                        No differences found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Summary of all env files */}
        {parsedEnvFiles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">All Environment Files</h3>
            <div className="space-y-1.5">
              {parsedEnvFiles.map(env => (
                <button
                  key={env.fileId}
                  onClick={() => setExpandedFileId(env.fileId)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all',
                    expandedFileId === env.fileId
                      ? 'border-nexus-accent/50 bg-nexus-accent/10'
                      : 'border-nexus-border bg-nexus-bg hover:border-nexus-accent/30'
                  )}
                >
                  <FileText size={14} className="text-nexus-accent shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[10px] font-bold text-white truncate">{env.fileName}</div>
                    <div className="text-[9px] text-nexus-text-muted">{env.variables.length} variable{env.variables.length !== 1 ? 's' : ''}</div>
                  </div>
                  {expandedFileId === env.fileId ? <ChevronDown size={12} className="text-nexus-text-muted" /> : <ChevronRight size={12} className="text-nexus-text-muted" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-nexus-border bg-nexus-bg">
        <p className="text-[9px] text-nexus-text-muted text-center font-bold uppercase tracking-widest">
          Nexus Pro — Environment Management
        </p>
      </div>
    </div>
  );
}
