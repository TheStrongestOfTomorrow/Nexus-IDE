/**
 * Airplane Mode Service for Nexus IDE
 * Detects online/offline status, manages airplane mode state
 * Internet-reliant features are locked when offline
 *
 * v5.4.1 — Fixed false-positive offline detection:
 *   - Removed unreliable cross-origin ping (ad blockers, COEP, rate limits caused false positives)
 *   - Replaced with navigator.onLine (browser-native, reliable) + passive connectivity probe
 *   - Added debounce: requires 2 consecutive failures before declaring offline
 *   - Once ping-declared offline, waits for browser 'online' event before re-checking
 *   - handleOffline now respects manual override (was inconsistent with handleOnline)
 *   - Banner dismissal no longer resets on online→offline→online flip-flops
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

  /** Consecutive ping failure count — used for debounce */
  private _consecutiveFailures: number = 0;

  /** Number of consecutive failures required before declaring offline */
  private static readonly FAILURE_THRESHOLD = 2;

  /** Whether a ping-declared offline is active (waiting for browser 'online' to recover) */
  private _pingDeclaredOffline: boolean = false;

  constructor() {
    // Set up browser event listeners — these are the PRIMARY source of truth
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Start lightweight connectivity probe (secondary, debounced)
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
    return OFFLINE_FEATURES.some(f => f.id === featureId);
  }

  /**
   * Manually toggle airplane mode
   */
  setManualOverride(enabled: boolean): void {
    this._manualOverride = enabled;
    if (enabled) {
      this._status = 'offline';
      this._pingDeclaredOffline = false;
    } else {
      // Re-check actual status using navigator.onLine
      this._status = navigator.onLine ? 'online' : 'offline';
      // Reset failure counter so pings start fresh
      this._consecutiveFailures = 0;
      this._pingDeclaredOffline = false;
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
   * Lightweight connectivity probe — supplements navigator.onLine.
   *
   * Key design decisions:
   * - Uses navigator.onLine as primary signal (browser-native, reliable)
   * - Pings only as a secondary check to detect "connected but no internet" scenarios
   * - Requires FAILURE_THRESHOLD consecutive failures before going offline (debounce)
   * - Once ping-declared offline, STOPS pinging and waits for browser 'online' event
   * - This prevents flip-flopping: online → offline → online → offline...
   */
  private startPingCheck(): void {
    // Check every 60 seconds (was 30, reduced frequency to avoid false positives)
    this._pingInterval = setInterval(() => {
      this.ping();
    }, 60000);

    // Initial check after 5 seconds (was 2, give the page time to load)
    setTimeout(() => this.ping(), 5000);
  }

  private async ping(): Promise<void> {
    // Don't ping if manually set to airplane mode
    if (this._manualOverride) return;

    // If we're already offline due to ping failures, stop pinging.
    // Wait for the browser's 'online' event to recover us.
    if (this._pingDeclaredOffline) return;

    // If navigator.onLine says we're offline, trust it — don't bother pinging
    if (!navigator.onLine) return;

    // Clean up previous timeout
    if (this._pingTimeout) {
      clearTimeout(this._pingTimeout);
    }

    const controller = new AbortController();
    this._pingTimeout = setTimeout(() => controller.abort(), 8000); // 8s timeout (was 5, more lenient)

    try {
      // Use a small, fast, reliable endpoint
      // no-cors: returns opaque response but proves connectivity if it doesn't throw
      const response = await fetch('https://api.github.com/zen', {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-store',
      });

      this._lastOnlineCheck = Date.now();

      // If fetch didn't throw, we have connectivity
      this._consecutiveFailures = 0;

      // Only notify if status actually changed
      if (this._status !== 'online') {
        this._status = 'online';
        this._pingDeclaredOffline = false;
        this.notifyListeners();
      }
    } catch {
      this._lastOnlineCheck = Date.now();
      this._consecutiveFailures++;

      // Only go offline after FAILURE_THRESHOLD consecutive failures
      if (this._consecutiveFailures >= AirplaneModeService.FAILURE_THRESHOLD) {
        if (this._status !== 'offline') {
          this._status = 'offline';
          this._pingDeclaredOffline = true;
          this.notifyListeners();
        }
      }
      // Otherwise: silent failure, will retry next interval
    }
  }

  private handleOnline = (): void => {
    if (this._manualOverride) return;

    // Browser says we're back online — reset all failure state
    this._status = 'online';
    this._consecutiveFailures = 0;
    this._pingDeclaredOffline = false;
    this._lastOnlineCheck = Date.now();
    this.notifyListeners();
  };

  private handleOffline = (): void => {
    // Respect manual override (consistent with handleOnline)
    if (this._manualOverride) return;

    this._status = 'offline';
    this._consecutiveFailures = 0; // Reset — browser event takes precedence
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
