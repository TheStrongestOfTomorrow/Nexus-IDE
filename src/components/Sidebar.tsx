import React, { useState } from 'react';
import { FileNode } from '../hooks/useFileSystem';
import { File, FilePlus, Trash2, Edit2, X, Check, FileCode, FileJson, FileText, Database, Hash, FileType, Download, Box, Layout, GitCompare, FolderOpen } from 'lucide-react';
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
  onApplyTemplate: (template: any) => void;
  onShowDiff?: (id: string) => void;
  onOpenFolder?: () => void;
  onSelectFolder?: (folderPath: string) => void;
  activeFolder?: string | null;
}

export default function Sidebar({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  onRenameFile,
  onExport,
  onApplyTemplate,
  onShowDiff,
  onOpenFolder,
  onSelectFolder,
  activeFolder
}: SidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
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
    <div className="w-64 flex-shrink-0 bg-[#f3f3f3] dark:bg-[#252526] border-r border-gray-200 dark:border-[#333] flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 text-sm font-semibold text-gray-700 dark:text-[#cccccc] uppercase tracking-wider">
        <span>Explorer</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsAdding(true)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded"
            title="New File"
          >
            <FilePlus size={16} />
          </button>
          <button
            onClick={onExport}
            className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded"
            title="Export as ZIP"
          >
            <Download size={16} />
          </button>
          {onOpenFolder && (
            <button
              onClick={onOpenFolder}
              className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded"
              title="Open Local Folder"
            >
              <FolderOpen size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
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
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2d2e] rounded transition-colors text-left"
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
                  "flex items-center gap-2 px-4 py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-[#2a2d2e] group transition-colors",
                  activeFolder === folder && "bg-blue-500/10 text-blue-500"
                )}
              >
                <span className={cn("text-[10px] transition-transform", expandedFolders.has(folder) ? "rotate-90" : "")}>›</span>
                <span className="text-xs font-bold truncate flex-1">{folder}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFolder?.(folder);
                  }}
                  className="hidden group-hover:block p-1 hover:bg-blue-500/20 rounded text-blue-500"
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
                        ? "bg-blue-100 dark:bg-[#37373d] text-blue-900 dark:text-white"
                        : "text-gray-700 dark:text-[#cccccc] hover:bg-gray-200 dark:hover:bg-[#2a2d2e]"
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
                          className="p-1 hover:bg-gray-300 dark:hover:bg-[#4d4d4d] rounded text-gray-500 dark:text-gray-400"
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
                        className="p-1 hover:bg-gray-300 dark:hover:bg-[#4d4d4d] rounded text-gray-500 dark:text-gray-400"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFile(file.id);
                        }}
                        className="p-1 hover:bg-gray-300 dark:hover:bg-[#4d4d4d] rounded text-gray-500 dark:text-gray-400"
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
