import React, { useState, useEffect, useCallback } from 'react';
import { Save, FolderOpen, Trash2, Edit2, X, Check, Clock, FileText, HardDrive, Download, Upload, Plus, RefreshCw, AlertTriangle, Archive } from 'lucide-react';
import { cn } from '../lib/utils';
import workspaceSaveService, { NexusWorkspace } from '../services/workspaceSaveService';

interface WorkspacePanelProps {
  files: Array<{ name: string; content: string; language?: string }>;
  onLoadWorkspace: (files: Array<{ name: string; content: string }>, name: string) => void;
  onImportFiles?: (file: File) => void;
}

export default function WorkspacePanel({ files, onLoadWorkspace, onImportFiles }: WorkspacePanelProps) {
  const [workspaces, setWorkspaces] = useState<NexusWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState<{ used: number; quota: number; percentage: number } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');

  const refreshWorkspaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await workspaceSaveService.listWorkspaces();
      setWorkspaces(list);
      const stats = await workspaceSaveService.getStorageStats();
      setStorageStats(stats);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const handleSave = async (name?: string) => {
    if (files.length === 0) {
      setAutoSaveStatus('No files to save');
      setTimeout(() => setAutoSaveStatus(''), 2000);
      return;
    }

    setSaving(true);
    try {
      const snapshot = workspaceSaveService.createSnapshot(
        files.map(f => ({ name: f.name, content: f.content, language: f.language })),
        { projectName: name || saveName || `Project ${new Date().toLocaleDateString()}` }
      );

      await workspaceSaveService.saveWorkspaceToIDB(snapshot);
      setShowSaveDialog(false);
      setSaveName('');
      setAutoSaveStatus(`Saved "${snapshot.name}"`);
      setTimeout(() => setAutoSaveStatus(''), 3000);
      await refreshWorkspaces();
    } catch (err) {
      console.error('Failed to save workspace:', err);
      setAutoSaveStatus('Save failed!');
      setTimeout(() => setAutoSaveStatus(''), 3000);
    }
    setSaving(false);
  };

  const handleLoad = async (workspace: NexusWorkspace) => {
    if (confirm(`Load "${workspace.name}"? This will replace your current files.`)) {
      onLoadWorkspace(workspace.files.map(f => ({ name: f.name, content: f.content })), workspace.name);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirmDeleteId === id) {
      try {
        await workspaceSaveService.deleteWorkspace(id);
        setConfirmDeleteId(null);
        await refreshWorkspaces();
        setAutoSaveStatus(`Deleted "${name}"`);
        setTimeout(() => setAutoSaveStatus(''), 2000);
      } catch (err) {
        console.error('Failed to delete workspace:', err);
      }
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleRename = async (id: string) => {
    if (editName.trim()) {
      try {
        await workspaceSaveService.renameWorkspace(id, editName.trim());
        setEditingId(null);
        setEditName('');
        await refreshWorkspaces();
      } catch (err) {
        console.error('Failed to rename workspace:', err);
      }
    }
  };

  const handleExportNexus = async (workspace: NexusWorkspace) => {
    const nexusContent = workspaceSaveService.generateNexusFile(workspace);
    const blob = new Blob([nexusContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workspace.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.nexus`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportNexus = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.nexus,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        const workspace = await workspaceSaveService.importNexusFile(content);
        await workspaceSaveService.saveWorkspaceToIDB(workspace);
        await refreshWorkspaces();
        setAutoSaveStatus(`Imported "${workspace.name}"`);
        setTimeout(() => setAutoSaveStatus(''), 3000);
      } catch (err) {
        alert(`Failed to import: ${err}`);
      }
    };
    input.click();
  };

  const handleClearAll = async () => {
    if (confirm('Delete ALL saved workspaces? This cannot be undone!')) {
      try {
        await workspaceSaveService.clearAllWorkspaces();
        await refreshWorkspaces();
        setAutoSaveStatus('All workspaces cleared');
        setTimeout(() => setAutoSaveStatus(''), 3000);
      } catch (err) {
        console.error('Failed to clear workspaces:', err);
      }
    }
  };

  const getLanguageIcon = (file: NexusWorkspace) => {
    const exts = new Set(file.files.map(f => f.name.split('.').pop()));
    const hasJs = exts.has('js') || exts.has('jsx');
    const hasTs = exts.has('ts') || exts.has('tsx');
    const hasHtml = exts.has('html');
    const hasPy = exts.has('py');

    if (hasTs) return '📘 TypeScript';
    if (hasJs) return '📙 JavaScript';
    if (hasPy) return '🐍 Python';
    if (hasHtml) return '🌐 HTML';
    return '📄 Mixed';
  };

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      {/* Header */}
      <div className="px-4 py-3 border-b border-nexus-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive size={16} className="text-nexus-accent" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Workspaces</span>
            <span className="text-[9px] bg-nexus-bg px-1.5 py-0.5 rounded text-nexus-text-muted font-mono">{workspaces.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="p-1.5 hover:bg-nexus-accent/20 rounded-lg text-nexus-accent transition-colors"
              title="Save Current Workspace"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={handleImportNexus}
              className="p-1.5 hover:bg-nexus-bg rounded-lg text-nexus-text-muted hover:text-white transition-colors"
              title="Import .nexus File"
            >
              <Upload size={14} />
            </button>
            <button
              onClick={refreshWorkspaces}
              className="p-1.5 hover:bg-nexus-bg rounded-lg text-nexus-text-muted hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Status message */}
        {autoSaveStatus && (
          <div className="mt-2 px-2 py-1 bg-nexus-accent/10 rounded text-[10px] text-nexus-accent font-medium animate-in slide-in-from-top-1">
            {autoSaveStatus}
          </div>
        )}

        {/* Storage stats */}
        {storageStats && storageStats.quota > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[9px] text-nexus-text-muted mb-1">
              <span>Storage</span>
              <span>{workspaceSaveService.formatBytes(storageStats.used)} / {workspaceSaveService.formatBytes(storageStats.quota)}</span>
            </div>
            <div className="w-full h-1 bg-nexus-bg rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  storageStats.percentage > 80 ? "bg-red-500" : storageStats.percentage > 50 ? "bg-yellow-500" : "bg-nexus-accent"
                )}
                style={{ width: `${Math.min(storageStats.percentage, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="px-4 py-3 bg-nexus-accent/5 border-b border-nexus-accent/20 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2">
            <Save size={14} className="text-nexus-accent" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Save Workspace</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave(saveName || undefined);
                if (e.key === 'Escape') setShowSaveDialog(false);
              }}
              className="flex-1 bg-nexus-bg border border-nexus-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-nexus-accent text-white"
              placeholder="Workspace name..."
            />
            <button
              onClick={() => handleSave(saveName || undefined)}
              disabled={saving || files.length === 0}
              className="px-3 py-1.5 bg-nexus-accent hover:bg-nexus-accent/80 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-all"
            >
              {saving ? '...' : 'Save'}
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="p-1.5 hover:bg-nexus-bg rounded-lg text-nexus-text-muted transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {files.length === 0 && (
            <p className="text-[9px] text-red-400 mt-1">No open files to save</p>
          )}
        </div>
      )}

      {/* Workspace List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={20} className="animate-spin text-nexus-text-muted" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Archive size={32} className="text-nexus-text-muted/30 mb-3" />
            <p className="text-xs text-nexus-text-muted mb-1">No saved workspaces</p>
            <p className="text-[10px] text-nexus-text-muted/60 mb-4">
              Save your current workspace to access it later
            </p>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg text-xs font-bold transition-all"
            >
              <Save size={14} />
              Save Current
            </button>
          </div>
        ) : (
          <div className="py-2">
            {workspaces.map(workspace => (
              <div
                key={workspace.id}
                className="group mx-2 mb-1 p-3 rounded-lg border border-transparent hover:border-nexus-border hover:bg-nexus-bg/50 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingId === workspace.id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleRename(workspace.id!); }}
                        className="flex items-center gap-1"
                      >
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => setEditingId(null)}
                          className="flex-1 bg-nexus-sidebar border border-nexus-accent rounded px-2 py-0.5 text-xs outline-none text-white"
                        />
                        <button type="submit" className="p-0.5 text-emerald-400 hover:text-emerald-300"><Check size={12} /></button>
                        <button type="button" onClick={() => setEditingId(null)} className="p-0.5 text-red-400 hover:text-red-300"><X size={12} /></button>
                      </form>
                    ) : (
                      <button
                        onClick={() => handleLoad(workspace)}
                        className="text-xs font-bold text-white hover:text-nexus-accent transition-colors truncate block text-left"
                      >
                        {workspace.name}
                      </button>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-nexus-text-muted flex items-center gap-1">
                        <Clock size={9} />
                        {workspaceSaveService.formatTimestamp(workspace.timestamp)}
                      </span>
                      <span className="text-[9px] text-nexus-text-muted">
                        {workspace.metadata.fileCount || workspace.files.length} file{workspace.files.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[9px] text-nexus-text-muted/60">
                        {getLanguageIcon(workspace)}
                      </span>
                    </div>
                    {workspace.metadata.tags && workspace.metadata.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {workspace.metadata.tags.map((tag, i) => (
                          <span key={i} className="text-[8px] px-1.5 py-0.5 bg-nexus-accent/10 text-nexus-accent rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => handleLoad(workspace)}
                      className="p-1 hover:bg-nexus-accent/20 rounded text-nexus-text-muted hover:text-nexus-accent transition-colors"
                      title="Load Workspace"
                    >
                      <FolderOpen size={12} />
                    </button>
                    <button
                      onClick={() => handleExportNexus(workspace)}
                      className="p-1 hover:bg-nexus-bg rounded text-nexus-text-muted hover:text-white transition-colors"
                      title="Export .nexus"
                    >
                      <Download size={12} />
                    </button>
                    <button
                      onClick={() => { setEditingId(workspace.id!); setEditName(workspace.name); }}
                      className="p-1 hover:bg-nexus-bg rounded text-nexus-text-muted hover:text-white transition-colors"
                      title="Rename"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(workspace.id!, workspace.name)}
                      className={cn(
                        "p-1 rounded transition-colors",
                        confirmDeleteId === workspace.id
                          ? "bg-red-500/20 text-red-400"
                          : "hover:bg-red-500/10 text-nexus-text-muted hover:text-red-400"
                      )}
                      title={confirmDeleteId === workspace.id ? "Click again to confirm" : "Delete"}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {workspaces.length > 0 && (
        <div className="px-4 py-2 border-t border-nexus-border">
          <button
            onClick={handleClearAll}
            className="flex items-center justify-center gap-2 w-full py-1.5 text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/5 rounded transition-colors"
          >
            <AlertTriangle size={10} />
            Clear All Workspaces
          </button>
        </div>
      )}
    </div>
  );
}
