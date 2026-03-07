import { useState, useEffect, useCallback } from 'react';

interface WindowState {
  isOpen: boolean;
  windowRef: Window | null;
}

export function useWindow(id: string) {
  const [state, setState] = useState<WindowState>({
    isOpen: false,
    windowRef: null,
  });

  const openWindow = useCallback((url: string, title: string, options = 'width=800,height=600') => {
    const newWindow = window.open(url, id, options);
    if (newWindow) {
      setState({ isOpen: true, windowRef: newWindow });
      newWindow.document.title = title;
      
      const handleUnload = () => {
        setState({ isOpen: false, windowRef: null });
      };
      
      newWindow.addEventListener('beforeunload', handleUnload);
      
      return () => {
        newWindow.removeEventListener('beforeunload', handleUnload);
        newWindow.close();
      };
    }
  }, [id]);

  const closeWindow = useCallback(() => {
    if (state.windowRef) {
      state.windowRef.close();
      setState({ isOpen: false, windowRef: null });
    }
  }, [state.windowRef]);

  return { ...state, openWindow, closeWindow };
}

// Broadcast channel for cross-window sync
export const nexusChannel = new BroadcastChannel('nexus-sync');
