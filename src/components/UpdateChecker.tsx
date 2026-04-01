/**
 * UpdateChecker — Shows update notifications for Nexus IDE
 * Respects airplane mode, provides download progress, and handles in-place updates.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Download, RefreshCw, Loader2, CheckCircle, AlertCircle, X, ExternalLink } from 'lucide-react';
import { autoUpdateService, UpdateCheckResult } from '../services/autoUpdateService';
import { airplaneModeService } from '../services/airplaneModeService';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface UpdateCheckerProps {
  isOffline: boolean;
  /** External trigger to force a manual check */
  triggerCheck?: number;
}

// ─── Update states ───────────────────────────────────────────────────────────

type UpdateState =
  | 'idle'
  | 'checking'
  | 'update-available'
  | 'downloading'
  | 'applying'
  | 'ready-to-reload'
  | 'error'
  | 'dismissed';

// ─── Component ───────────────────────────────────────────────────────────────

export const UpdateChecker: React.FC<UpdateCheckerProps> = ({
  isOffline,
  triggerCheck,
}) => {
  const [state, setState] = useState<UpdateState>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [applyProgress, setApplyProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const dismissedRef = useRef(false);
  const checkInProgressRef = useRef(false);

  // ── Check for updates ─────────────────────────────────────────────────────

  const checkForUpdates = useCallback(async (silent = false) => {
    if (checkInProgressRef.current) return;
    if (airplaneModeService.isOffline || isOffline) return;
    if (dismissedRef.current && !silent) return;

    checkInProgressRef.current = true;

    if (!silent) {
      setState('checking');
    }

    try {
      const result = await autoUpdateService.checkForUpdates();

      if (result && result.hasUpdate) {
        setUpdateInfo(result);
        if (dismissedRef.current) {
          // Was previously dismissed — don't show again this session
          setState('dismissed');
        } else {
          setState('update-available');
        }
      } else {
        setState('idle');
      }
    } catch (err: any) {
      if (!silent) {
        setErrorMessage(err.message || 'Failed to check for updates');
        setState('error');
        // Auto-dismiss errors after a few seconds
        setTimeout(() => {
          if (state === 'error') setState('idle');
        }, 5000);
      }
    } finally {
      checkInProgressRef.current = false;
    }
  }, [isOffline, state]);

  // ── On mount: check once after a short delay ──────────────────────────────

  useEffect(() => {
    // Wait a bit before checking so the IDE has time to load
    const timer = setTimeout(() => {
      checkForUpdates(true);
    }, 10000); // 10 seconds after mount

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Triggered check (from settings or other component) ────────────────────

  useEffect(() => {
    if (triggerCheck && triggerCheck > 0) {
      dismissedRef.current = false;
      checkForUpdates(false);
    }
  }, [triggerCheck, checkForUpdates]);

  // ── Handle "Update Now" ───────────────────────────────────────────────────

  const handleUpdateNow = useCallback(async () => {
    if (!updateInfo) return;

    try {
      // Step 1: Download
      setState('downloading');
      setDownloadProgress(0);

      const tarballData = await autoUpdateService.downloadUpdate(
        updateInfo.downloadUrl,
        (percent) => setDownloadProgress(percent),
      );

      // Step 2: Extract and store in IndexedDB
      setState('applying');
      setApplyProgress(0);

      await autoUpdateService.applyUpdate(tarballData, (percent) => setApplyProgress(percent));

      // Store version metadata
      await autoUpdateService.storeUpdateMeta(updateInfo.tagName, updateInfo.latestVersion);

      setState('ready-to-reload');
    } catch (err: any) {
      console.error('[UpdateChecker] Update failed:', err);
      setErrorMessage(err.message || 'Update failed');
      setState('error');
    }
  }, [updateInfo]);

  // ── Handle reload ─────────────────────────────────────────────────────────

  const handleReload = useCallback(() => {
    autoUpdateService.reloadToApply();
  }, []);

  // ── Handle dismiss ────────────────────────────────────────────────────────

  const handleDismiss = useCallback(() => {
    dismissedRef.current = true;
    setState('dismissed');
  }, []);

  // ── Handle retry ──────────────────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    setErrorMessage('');
    checkForUpdates(false);
  }, [checkForUpdates]);

  // ── Nothing to show ───────────────────────────────────────────────────────

  if (state === 'idle' || state === 'dismissed' || state === 'checking') {
    // Checking state: show a subtle indicator in the status bar only
    // (No popup for background checks)
    return null;
  }

  // ── Release notes dialog (simple) ─────────────────────────────────────────
  // We'll show inline for simplicity rather than a full dialog

  const formatPublishedDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] w-auto max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Error State */}
      {state === 'error' && (
        <div className="bg-red-900/90 backdrop-blur-sm border border-red-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Update Error</p>
            <p className="text-xs text-red-200 mt-0.5 break-words">{errorMessage}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleRetry}
              className="px-2 py-1 text-xs bg-red-700/50 hover:bg-red-700 rounded-md transition-colors"
              title="Retry"
            >
              <RefreshCw size={12} />
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Update Available */}
      {state === 'update-available' && updateInfo && (
        <div className="bg-neutral-900/95 backdrop-blur-sm border border-neutral-700 text-white px-4 py-3 rounded-xl shadow-2xl">
          <div className="flex items-start gap-3">
            <Download size={18} className="text-nexus-accent mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                Nexus v{updateInfo.latestVersion} is available
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Currently running v{updateInfo.currentVersion}
                {updateInfo.publishedAt && (
                  <> · Released {formatPublishedDate(updateInfo.publishedAt)}</>
                )}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/10 rounded-md transition-colors shrink-0"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-2 ml-7">
            <button
              onClick={() => window.open(updateInfo.releaseUrl, '_blank', 'noopener,noreferrer')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <ExternalLink size={11} />
              Release Notes
            </button>
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleUpdateNow}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-nexus-accent hover:bg-nexus-accent/80 text-white font-semibold rounded-md transition-colors shadow-sm"
            >
              <Download size={11} />
              Update Now
            </button>
          </div>
        </div>
      )}

      {/* Downloading */}
      {state === 'downloading' && updateInfo && (
        <div className="bg-neutral-900/95 backdrop-blur-sm border border-neutral-700 text-white px-4 py-3 rounded-xl shadow-2xl">
          <div className="flex items-start gap-3">
            <Loader2 size={18} className="text-nexus-accent mt-0.5 shrink-0 animate-spin" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                Downloading Nexus v{updateInfo.latestVersion}...
              </p>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-neutral-400">Downloading update</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{downloadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-nexus-accent rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applying */}
      {state === 'applying' && updateInfo && (
        <div className="bg-neutral-900/95 backdrop-blur-sm border border-neutral-700 text-white px-4 py-3 rounded-xl shadow-2xl">
          <div className="flex items-start gap-3">
            <Loader2 size={18} className="text-yellow-400 mt-0.5 shrink-0 animate-spin" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                Installing update...
              </p>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-neutral-400">Extracting files</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{applyProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${applyProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ready to reload */}
      {state === 'ready-to-reload' && updateInfo && (
        <div className="bg-emerald-900/90 backdrop-blur-sm border border-emerald-700 text-white px-4 py-3 rounded-xl shadow-2xl">
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-emerald-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                Nexus v{updateInfo.latestVersion} is ready!
              </p>
              <p className="text-[10px] text-emerald-200 mt-0.5">
                Reload the IDE to apply the update. Your work will be saved.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 ml-7">
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1 text-xs text-emerald-200/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleReload}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-md transition-colors shadow-sm"
            >
              <RefreshCw size={11} />
              Reload Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateChecker;
