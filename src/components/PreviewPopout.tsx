import React, { useEffect, useState } from 'react';
import { FileNode } from '../hooks/useFileSystem';
import Preview from './Preview';
import { nexusChannel } from '../hooks/useWindow';

export default function PreviewPopout() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  useEffect(() => {
    // Initial sync from main window
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) setActiveFileId(id);

    // Listen for updates from main window
    const handleSync = (event: MessageEvent) => {
      if (event.data.type === 'workspace:sync') {
        setFiles(event.data.files);
      } else if (event.data.type === 'file:active') {
        setActiveFileId(event.data.id);
      }
    };

    nexusChannel.addEventListener('message', handleSync);
    
    // Request initial state
    nexusChannel.postMessage({ type: 'workspace:request-sync' });

    return () => nexusChannel.removeEventListener('message', handleSync);
  }, []);

  return (
    <div className="fixed inset-0 bg-nexus-bg">
      <Preview files={files} activeFileId={activeFileId} />
    </div>
  );
}
