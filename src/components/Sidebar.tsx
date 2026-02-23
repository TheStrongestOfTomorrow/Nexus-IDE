import React, { useState } from 'react';
import { FileNode } from '../hooks/useFileSystem';
import { File, FilePlus, Trash2, Edit2, X, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  files: FileNode[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onAddFile: (name: string) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
}

export default function Sidebar({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  onRenameFile
}: SidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  return (
    <div className="w-64 flex-shrink-0 bg-[#f3f3f3] dark:bg-[#252526] border-r border-gray-200 dark:border-[#333] flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 text-sm font-semibold text-gray-700 dark:text-[#cccccc] uppercase tracking-wider">
        <span>Explorer</span>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded"
          title="New File"
        >
          <FilePlus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
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

        {files.map(file => (
          <div key={file.id}>
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
                  <File size={16} className={cn(
                    activeFileId === file.id ? "text-blue-500" : "text-gray-400"
                  )} />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="hidden group-hover:flex items-center gap-1">
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
    </div>
  );
}
