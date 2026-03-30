import { useState, useEffect, useRef, useCallback } from 'react';
import { autoUpdateService, UpdateCheckResult } from '../services/autoUpdateService';
import { airplaneModeService } from '../services/airplaneModeService';

export function usePWA() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isPreinstalling, setIsPreinstalling] = useState(false);
  const [preinstallProgress, setPreinstallProgress] = useState(0);
  const waitingWorker = useRef<ServiceWorker | null>(null);

  // ── Auto-update state (GitHub releases) ──────────────────────────────────

  const [autoUpdateChecking, setAutoUpdateChecking] = useState(false);
  const [autoUpdateResult, setAutoUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [autoUpdateError, setAutoUpdateError] = useState<string | null>(null);
  const autoUpdateCheckTriggerRef = useRef(0);

  // ── Service Worker update detection (existing PWA logic) ──────────────────

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

  // ── On boot: clear pending update flag after reload ──────────────────────

  useEffect(() => {
    if (autoUpdateService.isUpdatePending()) {
      autoUpdateService.clearPendingFlag();
      // The update was applied; clean up the stored update data
      autoUpdateService.clearStoredUpdate().catch(() => {
        // Non-critical — ignore if IndexedDB cleanup fails
      });
    }
  }, []);

  // ── Service Worker actions (existing) ────────────────────────────────────

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

  // ── Auto-update check (GitHub releases) ──────────────────────────────────

  /**
   * Trigger a check for GitHub release updates.
   * Returns the result and also updates state.
   * This is safe to call from Settings > "Check for Updates".
   */
  const checkAutoUpdate = useCallback(async (): Promise<UpdateCheckResult | null> => {
    // Skip if offline (airplane mode)
    if (airplaneModeService.isOffline) {
      setAutoUpdateError('Cannot check for updates while offline');
      return null;
    }

    setAutoUpdateChecking(true);
    setAutoUpdateError(null);
    setAutoUpdateResult(null);

    try {
      const result = await autoUpdateService.checkForUpdates();
      setAutoUpdateResult(result);

      if (!result) {
        setAutoUpdateError('Could not reach the update server');
      } else if (result.hasUpdate) {
        // Update available — the UpdateChecker component handles the notification
      } else {
        // Already on latest version
        setAutoUpdateError(null);
      }

      return result;
    } catch (err: any) {
      const message = err.message || 'Failed to check for updates';
      setAutoUpdateError(message);
      return null;
    } finally {
      setAutoUpdateChecking(false);
    }
  }, []);

  /**
   * Get a trigger counter that can be passed to UpdateChecker to force a re-check.
   */
  const getAutoUpdateTrigger = useCallback(() => {
    autoUpdateCheckTriggerRef.current += 1;
    return autoUpdateCheckTriggerRef.current;
  }, []);

  return {
    // Existing PWA (service worker) state & actions
    showUpdatePrompt, setShowUpdatePrompt,
    isPreinstalling, setIsPreinstalling,
    preinstallProgress, setPreinstallProgress,
    handleUpdateApp,
    preinstallOffline,

    // Auto-update (GitHub releases) state & actions
    autoUpdateChecking,
    autoUpdateResult,
    autoUpdateError,
    checkAutoUpdate,
    getAutoUpdateTrigger,
  };
}
