/**
 * Airplane Mode Service for Nexus IDE
 * Detects online/offline status, manages airplane mode state
 * Internet-reliant features are locked when offline
 */

export type AirplaneModeStatus = 'online' | 'offline';
export type FullLockState = boolean;

// Features that require internet
const INTERNET_FEATURES = [
  { id: 'collaboration', name: 'Real-time Collaboration', description: 'WebSocket-based live editing sessions' },
  { id: 'minecraft-bridge', name: 'Minecraft Bridge', description: 'Minecraft server integration via WebSocket' },
  { id: 'ai-cloud', name: 'AI Chat (Cloud Providers)', description: 'Gemini, OpenAI, Anthropic, and other cloud AI providers' },
  { id: 'github', name: 'GitHub Push & Commit', description: 'Pushing commits and managing repos on GitHub' },
  { id: 'auto-update', name: 'Auto-Update Check', description: 'Checking for new versions from GitHub' },
] as const;

// Features that work offline
const OFFLINE_FEATURES = [
  { id: 'editor', name: 'Code Editor', description: 'Full Monaco editor with syntax highlighting' },
  { id: 'files', name: 'File Manager', description: 'Browse and manage project files' },
  { id: 'terminal-wc', name: 'Terminal (WebContainer)', description: 'WebContainer-based shell in the browser' },
  { id: 'terminal-local', name: 'Terminal (v86 Linux)', description: 'Real Linux terminal via v86 emulation' },
  { id: 'settings', name: 'Settings', description: 'All IDE settings and configuration' },
  { id: 'workspace', name: 'Workspace (IndexedDB)', description: 'Save/load projects from local storage' },
  { id: 'extensions', name: 'Extensions (Installed)', description: 'Already-installed extensions continue to work' },
  { id: 'ai-local', name: 'AI (Local / Ollama)', description: 'Ollama running locally on your machine' },
] as const;

type Listener = (status: AirplaneModeStatus) => void;

class AirplaneModeService {
  private listeners: Set<Listener> = new Set();
  private _status: AirplaneModeStatus = navigator.onLine ? 'online' : 'offline';
  private _fullLock: FullLockState = false;
  private _manualOverride: boolean = false;
  private _lastOnlineCheck: number = Date.now();
  private _pingInterval: ReturnType<typeof setInterval> | null = null;
  private _pingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Set up browser event listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Start active ping check (more reliable than navigator.onLine alone)
    this.startPingCheck();
  }

  get status(): AirplaneModeStatus {
    return this._manualOverride ? 'offline' : this._status;
  }

  get fullLock(): FullLockState {
    return this._fullLock;
  }

  get isOnline(): boolean {
    return this.status === 'online';
  }

  get isOffline(): boolean {
    return this.status === 'offline';
  }

  get internetFeatures() {
    return INTERNET_FEATURES;
  }

  get offlineFeatures() {
    return OFFLINE_FEATURES;
  }

  get lastOnlineCheck() {
    return this._lastOnlineCheck;
  }

  /**
   * Check if a specific feature is available
   */
  isFeatureAvailable(featureId: string): boolean {
    if (this.isOnline) return true;
    // Offline — only offline-safe features work
    return OFFLINE_FEATURES.some(f => f.id === featureId);
  }

  /**
   * Manually toggle airplane mode
   */
  setManualOverride(enabled: boolean): void {
    this._manualOverride = enabled;
    if (enabled) {
      this._status = 'offline';
    } else {
      // Re-check actual status
      this._status = navigator.onLine ? 'online' : 'offline';
    }
    this.notifyListeners();
  }

  /**
   * Set full lock mode
   */
  setFullLock(enabled: boolean): void {
    this._fullLock = enabled;
  }

  /**
   * Subscribe to status changes
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Active ping to GitHub to verify real connectivity
   * navigator.onLine only detects network interface, not actual internet
   */
  private startPingCheck(): void {
    // Check every 30 seconds
    this._pingInterval = setInterval(() => {
      this.ping();
    }, 30000);

    // Initial check after 2 seconds
    setTimeout(() => this.ping(), 2000);
  }

  private async ping(): Promise<void> {
    // Don't ping if manually set to airplane mode
    if (this._manualOverride) return;

    // Clean up previous timeout
    if (this._pingTimeout) {
      clearTimeout(this._pingTimeout);
    }

    const controller = new AbortController();
    this._pingTimeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const response = await fetch('https://api.github.com', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-store',
      });

      this._lastOnlineCheck = Date.now();

      if (!controller.signal.aborted && this._status !== 'online') {
        this._status = 'online';
        this.notifyListeners();
      }
    } catch {
      this._lastOnlineCheck = Date.now();

      if (this._status !== 'offline') {
        this._status = 'offline';
        this.notifyListeners();
      }
    }
  }

  private handleOnline = (): void => {
    if (this._manualOverride) return; // Don't override manual airplane mode
    this._status = 'online';
    this._lastOnlineCheck = Date.now();
    this.notifyListeners();
  };

  private handleOffline = (): void => {
    this._status = 'offline';
    this._lastOnlineCheck = Date.now();
    this.notifyListeners();
  };

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.status));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    if (this._pingInterval) clearInterval(this._pingInterval);
    if (this._pingTimeout) clearTimeout(this._pingTimeout);
  }

  /**
   * Format last check time
   */
  formatLastCheck(): string {
    const diffMs = Date.now() - this._lastOnlineCheck;
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 5) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  }
}

export const airplaneModeService = new AirplaneModeService();
export default airplaneModeService;
