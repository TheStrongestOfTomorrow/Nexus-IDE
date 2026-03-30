import { useState, useEffect, useRef } from 'react';

export function usePWA() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isPreinstalling, setIsPreinstalling] = useState(false);
  const [preinstallProgress, setPreinstallProgress] = useState(0);
  const waitingWorker = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) return;

        const handleUpdate = (worker: ServiceWorker) => {
          waitingWorker.current = worker;
          setShowUpdatePrompt(true);
        };

        if (reg.waiting) {
          handleUpdate(reg.waiting);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                handleUpdate(newWorker);
              }
            });
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }
  }, []);

  const handleUpdateApp = () => {
    if (waitingWorker.current) {
      waitingWorker.current.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdatePrompt(false);
  };

  const preinstallOffline = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      setIsPreinstalling(true);
      setPreinstallProgress(0);
      navigator.serviceWorker.controller.postMessage({ type: 'PREINSTALL_DEPENDENCIES' });
    } else {
      alert('Service Worker not active. Please wait for it to register.');
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'PREINSTALL_COMPLETE') {
        setIsPreinstalling(false);
        setPreinstallProgress(100);
        setTimeout(() => setPreinstallProgress(0), 3000);
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);

  return {
    showUpdatePrompt, setShowUpdatePrompt,
    isPreinstalling, setIsPreinstalling,
    preinstallProgress, setPreinstallProgress,
    handleUpdateApp,
    preinstallOffline
  };
}
