/**
 * Auto-Update Service for Nexus IDE v5.2.0
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

interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  release: ReleaseInfo | null;
  error: string | null;
}

type UpdateListener = (result: UpdateCheckResult) => void;

class AutoUpdateService {
  private static CURRENT_VERSION = '5.2.0';
  private static REPO = 'TheStrongestOfTomorrow/Nexus-IDE';
  private listeners: Set<UpdateListener> = new Set();
  private lastCheckResult: UpdateCheckResult | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  get currentVersion(): string {
    return AutoUpdateService.CURRENT_VERSION;
  }

  get lastResult(): UpdateCheckResult | null {
    return this.lastCheckResult;
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
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
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
