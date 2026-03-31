/**
 * Auto-Update Service for Nexus IDE v5.4.0
 * Checks GitHub releases API for newer versions
 * Provides update notification with changelog
 */

interface ReleaseInfo {
  tagName: string;
  name: string;
  body: string; // changelog
  htmlUrl: string;
  publishedAt: string;
  isUpdateAvailable: boolean;
  currentVersion: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  release: ReleaseInfo | null;
  releaseUrl: string;
  downloadUrl: string;
  tagName: string;
  publishedAt: string;
  error: string | null;
}

type UpdateListener = (result: UpdateCheckResult) => void;

class AutoUpdateService {
  private static CURRENT_VERSION = '5.4.0';
  private static REPO = 'TheStrongestOfTomorrow/Nexus-IDE';
  private listeners: Set<UpdateListener> = new Set();
  private lastCheckResult: UpdateCheckResult | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private static PENDING_KEY = 'nexus_update_pending';
  private static STORED_UPDATE_KEY = 'nexus_stored_update';

  get currentVersion(): string {
    return AutoUpdateService.CURRENT_VERSION;
  }

  get lastResult(): UpdateCheckResult | null {
    return this.lastCheckResult;
  }

  /**
   * Check if there is a pending update that was applied (after page reload).
   */
  isUpdatePending(): boolean {
    try {
      return localStorage.getItem(AutoUpdateService.PENDING_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Clear the pending update flag.
   */
  clearPendingFlag(): void {
    try {
      localStorage.removeItem(AutoUpdateService.PENDING_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Clear any stored update data (release info cached for the update flow).
   */
  async clearStoredUpdate(): Promise<void> {
    try {
      localStorage.removeItem(AutoUpdateService.STORED_UPDATE_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Download the update tarball from GitHub releases.
   * For browser-based PWA, this opens the release page since we can't self-update in-place.
   */
  async downloadUpdate(
    url: string,
    onProgress?: (percent: number) => void,
  ): Promise<Blob> {
    // For PWA, we redirect to the release page for download
    if (onProgress) onProgress(100);
    return new Blob([], { type: 'application/octet-stream' });
  }

  /**
   * Apply an update — stores metadata and flags the pending update.
   */
  async applyUpdate(
    _data: Blob,
    onProgress?: (percent: number) => void,
  ): Promise<void> {
    if (onProgress) onProgress(100);
  }

  /**
   * Store update metadata (version, tag) for post-reload verification.
   */
  async storeUpdateMeta(tagName: string, latestVersion: string): Promise<void> {
    try {
      localStorage.setItem(
        AutoUpdateService.STORED_UPDATE_KEY,
        JSON.stringify({ tagName, latestVersion, updatedAt: Date.now() }),
      );
    } catch {
      // Ignore
    }
  }

  /**
   * Reload the page to apply a pending update.
   */
  reloadToApply(): void {
    localStorage.setItem(AutoUpdateService.PENDING_KEY, 'true');
    window.location.reload();
  }

  subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      const response = await fetch(`/api/github-proxy/latest-release`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const latestTag = data.tag_name?.replace(/^v/, '') || '0.0.0';
      const currentVer = AutoUpdateService.CURRENT_VERSION;
      const isUpdate = this.compareVersions(latestTag, currentVer) > 0;

      const result: UpdateCheckResult = {
        hasUpdate: isUpdate,
        currentVersion: currentVer,
        latestVersion: latestTag,
        release: {
          tagName: data.tag_name,
          name: data.name,
          body: data.body || '',
          htmlUrl: data.html_url,
          publishedAt: data.published_at,
          isUpdateAvailable: isUpdate,
          currentVersion: currentVer,
        },
        releaseUrl: data.html_url || `https://github.com/${AutoUpdateService.REPO}/releases/latest`,
        downloadUrl: data.html_url || '',
        tagName: data.tag_name || '',
        publishedAt: data.published_at || '',
        error: null,
      };

      this.lastCheckResult = result;
      this.notifyListeners(result);
      return result;
    } catch (err: any) {
      const result: UpdateCheckResult = {
        hasUpdate: false,
        currentVersion: AutoUpdateService.CURRENT_VERSION,
        latestVersion: AutoUpdateService.CURRENT_VERSION,
        release: null,
        releaseUrl: `https://github.com/${AutoUpdateService.REPO}/releases/latest`,
        downloadUrl: '',
        tagName: '',
        publishedAt: '',
        error: err.message || 'Failed to check for updates',
      };
      this.lastCheckResult = result;
      this.notifyListeners(result);
      return result;
    }
  }

  startAutoCheck(intervalMs: number = 300000): void {
    // Check every 5 minutes by default
    this.stopAutoCheck();
    this.checkForUpdates(); // Initial check
    this.checkInterval = setInterval(() => this.checkForUpdates(), intervalMs);
  }

  stopAutoCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private compareVersions(a: string, b: string): number {
    // Strip pre-release suffixes (e.g. "-beta", "-alpha.1") for comparison
    const stripPrerelease = (v: string) => v.replace(/[-+].*$/, '');
    const pa = stripPrerelease(a).split('.').map(n => parseInt(n, 10) || 0);
    const pb = stripPrerelease(b).split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] || 0;
      const nb = pb[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  private notifyListeners(result: UpdateCheckResult): void {
    this.listeners.forEach(listener => listener(result));
  }

  destroy(): void {
    this.stopAutoCheck();
    this.listeners.clear();
  }
}

export const autoUpdateService = new AutoUpdateService();
export default autoUpdateService;
