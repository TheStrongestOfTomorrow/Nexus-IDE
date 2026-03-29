import React, { useState } from 'react';
import { FileNode } from '../hooks/useFileSystem';
import { File, FilePlus, Trash2, Edit2, X, Check, FileCode, FileJson, FileText, Database, Hash, FileType, Download, Box, Layout, GitCompare, FolderOpen, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { GRAPHICS_TEMPLATES } from '../constants/templates';

interface SidebarProps {
  files: FileNode[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onAddFile: (name: string) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onExport: () => void;
  onClearWorkspace?: () => void;
  onApplyTemplate: (template: any) => void;
  onShowDiff?: (id: string) => void;
  onOpenFolder?: () => void;
  onSelectFolder?: (folderPath: string) => void;
  activeFolder?: string | null;
  pendingAiActions?: any[] | null;
  onAcceptAiActions?: (actions: any[]) => void;
  onRejectAiActions?: () => void;
}

export default function Sidebar({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  onRenameFile,
  onExport,
  onClearWorkspace,
  onApplyTemplate,
  onShowDiff,
  onOpenFolder,
  onSelectFolder,
  activeFolder,
  pendingAiActions,
  onAcceptAiActions,
  onRejectAiActions
}: SidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
  };

  const getDir = (path: string) => {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/');
  };

  // Group files by directory
  const fileTree: Record<string, FileNode[]> = {};
  files.forEach(file => {
    const dir = getDir(file.name);
    if (!fileTree[dir]) fileTree[dir] = [];
    fileTree[dir].push(file);
  });

  const allFolders = Array.from(new Set(files.map(f => getDir(f.name)))).sort();

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onAddFile(newFileName.trim());
      setNewFileName('');
      setIsAdding(false);
    }
  };

  const handleRenameSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (editName.trim()) {
      onRenameFile(id, editName.trim());
      setEditingId(null);
    }
  };

  const getFileIcon = (fileName: string, isActive: boolean) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconSize = 16;
    const iconClass = isActive ? "text-blue-500" : "text-gray-400";

    switch (ext) {
      case 'html':
      case 'htm':
        return <FileType size={iconSize} className={cn(iconClass, "text-orange-500")} />;
      case 'css':
        return <Hash size={iconSize} className={cn(iconClass, "text-blue-400")} />;
      case 'js':
      case 'jsx':
        return <FileCode size={iconSize} className={cn(iconClass, "text-yellow-400")} />;
      case 'ts':
      case 'tsx':
        return <FileCode size={iconSize} className={cn(iconClass, "text-blue-500")} />;
      case 'py':
        return <FileCode size={iconSize} className={cn(iconClass, "text-blue-300")} />;
      case 'node':
      case 'cjs':
      case 'mjs':
        return <FileCode size={iconSize} className={cn(iconClass, "text-green-500")} />;
      case 'json':
        return <FileJson size={iconSize} className={cn(iconClass, "text-yellow-600")} />;
      case 'md':
        return <FileText size={iconSize} className={cn(iconClass, "text-gray-400")} />;
      case 'sql':
        return <Database size={iconSize} className={cn(iconClass, "text-pink-500")} />;
      default:
        return <File size={iconSize} className={iconClass} />;
    }
  };

  return (
    <div className="w-64 flex-shrink-0 bg-nexus-sidebar border-r border-nexus-border flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 text-sm font-semibold text-nexus-text uppercase tracking-wider">
        <span>Explorer</span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsAdding(true)}
            className="p-1 hover:bg-nexus-bg rounded transition-colors"
            title="New File"
          >
            <FilePlus size={16} />
          </button>
          <button 
            onClick={onExport}
            className="p-1 hover:bg-nexus-bg rounded transition-colors"
            title="Export as ZIP"
          >
            <Download size={16} />
          </button>
          {onOpenFolder && (
            <button 
              onClick={onOpenFolder}
              className="p-1 hover:bg-nexus-bg rounded transition-colors"
              title="Open Local Folder"
            >
              <FolderOpen size={16} />
            </button>
          )}
          {onClearWorkspace && files.length > 0 && (
            <button 
              onClick={() => setShowClearConfirm(!showClearConfirm)}
              className={cn(
                "p-1 rounded transition-colors",
                showClearConfirm 
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                  : "hover:bg-nexus-bg text-nexus-text-muted hover:text-red-400"
              )}
              title="Delete All Files"
            >
              <AlertTriangle size={16} />
            </button>
          )}
        </div>

        {/* Clear Workspace Confirmation */}
        {showClearConfirm && (
          <div className="px-4 py-2 bg-red-500/5 border-b border-red-500/10 animate-in slide-in-from-top-2">
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-2">
              Delete all {files.length} file{files.length !== 1 ? 's' : ''}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onClearWorkspace();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-[10px] font-bold transition-colors"
              >
                Yes, Delete All
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-1 bg-nexus-bg hover:bg-nexus-border text-nexus-text-muted rounded text-[10px] font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2 relative">
        {/* Vibe Check Popup */}
        {pendingAiActions && (
          <div className="absolute top-2 left-2 right-2 z-20 bg-nexus-accent text-white p-3 rounded-lg shadow-xl border border-white/20 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-yellow-300" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Vibe Check</span>
            </div>
            <p className="text-[10px] opacity-90 mb-3">
              The AI wants to perform {pendingAiActions.length} actions.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={onRejectAiActions}
                className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded text-[10px] font-bold transition-colors"
              >
                Reject
              </button>
              <button 
                onClick={() => onAcceptAiActions?.(pendingAiActions)}
                className="flex-1 py-1.5 bg-white hover:bg-blue-50 text-nexus-accent rounded text-[10px] font-bold transition-colors shadow-sm"
              >
                Accept
              </button>
            </div>
          </div>
        )}

        {/* Templates Section */}
        <div className="mb-4">
          <button 
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full flex items-center justify-between px-4 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layout size={12} />
              Templates
            </div>
            <span className={cn("transition-transform", showTemplates ? "rotate-90" : "")}>›</span>
          </button>
          
          {showTemplates && (
            <div className="mt-1 px-2 space-y-1">
              {Object.entries(GRAPHICS_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => onApplyTemplate(template)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-nexus-text-muted hover:bg-nexus-bg hover:text-white rounded transition-colors text-left"
                >
                  <Box size={14} className="text-emerald-500" />
                  {template.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
          Files
        </div>

        {isAdding && (
          <form onSubmit={handleAddSubmit} className="px-4 py-1 flex items-center gap-2">
            <File size={16} className="text-gray-400" />
            <input
              autoFocus
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onBlur={() => setIsAdding(false)}
              className="flex-1 bg-white dark:bg-[#3c3c3c] border border-blue-500 text-sm px-1 py-0.5 outline-none text-gray-900 dark:text-white"
              placeholder="filename.ext"
            />
          </form>
        )}

        {allFolders.map(folder => (
          <div key={folder}>
            {folder !== '' && (
              <div 
                onClick={() => toggleFolder(folder)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1 cursor-pointer hover:bg-nexus-bg group transition-colors",
                  activeFolder === folder && "bg-nexus-accent/10 text-nexus-accent"
                )}
              >
                <span className={cn("text-[10px] transition-transform", expandedFolders.has(folder) ? "rotate-90" : "")}>›</span>
                <span className="text-xs font-bold truncate flex-1">{folder}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFolder?.(folder);
                  }}
                  className="hidden group-hover:block p-1 hover:bg-nexus-accent/20 rounded text-nexus-accent"
                  title="Preview Folder"
                >
                  <Layout size={12} />
                </button>
              </div>
            )}
            
            {(folder === '' || expandedFolders.has(folder)) && fileTree[folder]?.map(file => (
              <div key={file.id} className={cn(folder !== '' && "pl-4")}>
                {editingId === file.id ? (
                  <form 
                    onSubmit={(e) => handleRenameSubmit(e, file.id)}
                    className="px-4 py-1 flex items-center gap-2 bg-blue-50 dark:bg-[#37373d]"
                  >
                    <File size={16} className="text-gray-400" />
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onBlur={() => setEditingId(null)}
                      className="flex-1 bg-white dark:bg-[#3c3c3c] border border-blue-500 text-sm px-1 py-0.5 outline-none text-gray-900 dark:text-white"
                    />
                  </form>
                ) : (
                  <div
                    onClick={() => onSelectFile(file.id)}
                    className={cn(
                      "group flex items-center justify-between px-4 py-1 cursor-pointer text-sm",
                      activeFileId === file.id 
                        ? "bg-nexus-bg text-white border-l-2 border-nexus-accent" 
                        : "text-nexus-text hover:bg-nexus-bg/50"
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {getFileIcon(file.name, activeFileId === file.id)}
                      <span className="truncate">{file.name.split('/').pop()}</span>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-1">
                      {onShowDiff && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShowDiff(file.id);
                          }}
                          className="p-1 hover:bg-nexus-border rounded text-nexus-text-muted"
                          title="Show Diff"
                        >
                          <GitCompare size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(file.id);
                          setEditName(file.name);
                        }}
                        className="p-1 hover:bg-nexus-border rounded text-nexus-text-muted"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFile(file.id);
                        }}
                        className="p-1 hover:bg-nexus-border rounded text-nexus-text-muted"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
