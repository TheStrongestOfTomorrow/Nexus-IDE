/**
 * FileBridgeService — Bidirectional file synchronization between
 * the Nexus IDE workspace and the Alpine Linux filesystem running inside v86.
 *
 * Provides push/pull of individual files or entire workspaces, auto-sync
 * with configurable intervals, Alpine filesystem commands, and a typed
 * event system for lifecycle hooks.
 */

import { v86Service, V86Status } from '../services/v86Service';

// ─── Exported Types ────────────────────────────────────────────────────────────

export interface FileBridgeConfig {
  /** Base path in Alpine for workspace files (default: `/home/nexus/workspace`) */
  alpineBasePath: string;
  /** Whether to auto-sync on file changes (default: `false`) */
  autoSync: boolean;
  /** Auto-sync interval in milliseconds (default: `5000`) */
  syncInterval: number;
  /** Glob patterns to exclude from sync (default: `['node_modules/**', '.git/**', '*.lock']`) */
  excludedPatterns: string[];
}

export interface FileEntry {
  name: string;
  content: string;
}

export interface SyncStats {
  pushed: number;
  pulled: number;
}

// ─── Internal Types ────────────────────────────────────────────────────────────

interface DirectoryEntry {
  name: string;
  type: 'file' | 'dir';
  size: number;
}

interface DiskUsage {
  used: number;
  total: number;
}

// ─── Default Configuration ─────────────────────────────────────────────────────

const DEFAULT_CONFIG: FileBridgeConfig = {
  alpineBasePath: '/home/nexus/workspace',
  autoSync: false,
  syncInterval: 5000,
  excludedPatterns: ['node_modules/**', '.git/**', '*.lock'],
};

// ─── Glob Matching ─────────────────────────────────────────────────────────────

/**
 * Simple glob matcher supporting `*` (single segment) and `**` (multi-segment).
 * Handles both forward and backslash separators.
 */
function matchesGlob(filePath: string, pattern: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');

  // Build regex from glob pattern
  let regex = '^';
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i];

    if (ch === '*') {
      // `**/` matches any number of path segments (including zero)
      if (pattern[i + 1] === '*' && pattern[i + 2] === '/') {
        regex += '(?:.+/)?';
        i += 3;
        continue;
      }
      // `**` at end matches everything remaining
      if (pattern[i + 1] === '*') {
        regex += '.*';
        i += 2;
        continue;
      }
      // Single `*` matches anything within one segment
      regex += '[^/]*';
      i++;
    } else if (ch === '?') {
      regex += '[^/]';
      i++;
    } else if ('.+^${}()|[]\\'.includes(ch)) {
      regex += '\\' + ch;
      i++;
    } else {
      regex += ch;
      i++;
    }
  }

  regex += '$';
  return new RegExp(regex).test(normalized);
}

function isExcluded(filePath: string, patterns: string[]): boolean {
  return patterns.some(p => matchesGlob(filePath, p));
}

// ─── Path Utilities ────────────────────────────────────────────────────────────

/** Normalize a path: collapse backslashes, strip leading `./`, strip trailing `/`. */
function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+$/, '');
}

/** Extract the unique directory paths required by a list of file paths. */
function extractDirectories(filePaths: string[]): string[] {
  const dirs = new Set<string>();
  for (const fp of filePaths) {
    const parts = fp.split('/');
    // Build up each parent directory
    for (let depth = 1; depth < parts.length; depth++) {
      dirs.add(parts.slice(0, depth).join('/'));
    }
  }
  return Array.from(dirs).sort();
}

// ─── FileBridgeService ────────────────────────────────────────────────────────

class FileBridgeService {
  private config: FileBridgeConfig;
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;
  private currentFiles: FileEntry[] = [];
  private syncing = false;

  // Event listener sets
  private syncStartCallbacks: Set<() => void> = new Set();
  private syncCompleteCallbacks: Set<(stats: SyncStats) => void> = new Set();
  private errorCallbacks: Set<(error: string) => void> = new Set();

  constructor(config?: Partial<FileBridgeConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.log('FileBridgeService initialized', this.config);
  }

  // ─── Configuration ──────────────────────────────────────────────────────

  /** Return a read-only snapshot of the current configuration. */
  getConfig(): Readonly<FileBridgeConfig> {
    return { ...this.config };
  }

  /** Merge updates into the live configuration. */
  updateConfig(updates: Partial<FileBridgeConfig>): void {
    this.config = { ...this.config, ...updates };
    this.log('Config updated', this.config);

    // If auto-sync state changed, react
    if (updates.autoSync !== undefined) {
      if (updates.autoSync && !this.autoSyncTimer && this.currentFiles.length > 0) {
        this.startAutoSync(this.currentFiles);
      } else if (!updates.autoSync && this.autoSyncTimer) {
        this.stopAutoSync();
      }
    }
  }

  // ─── Path Mapping ───────────────────────────────────────────────────────

  /**
   * Sanitize a path segment to prevent shell injection.
   * Strips characters that could be interpreted by the shell.
   */
  private sanitizePath(path: string): string {
    return path.replace(/[;&|`$(){}<>!#'\"\\\n\r]/g, '');
  }

  /**
   * Map a local workspace-relative path to the full Alpine path.
   * Sanitizes the path to prevent shell injection.
   *
   * Example: `src/App.tsx` → `/home/nexus/workspace/src/App.tsx`
   */
  mapToAlpine(localPath: string): string {
    const normalized = this.sanitizePath(normalizePath(localPath));
    if (normalized.includes('..')) {
      this.warn('mapToAlpine> Path traversal blocked');
      return `${this.config.alpineBasePath}/`;
    }
    return `${this.config.alpineBasePath}/${normalized}`;
  }

  /**
   * Map a full Alpine path back to a local workspace-relative path.
   *
   * Example: `/home/nexus/workspace/src/App.tsx` → `src/App.tsx`
   */
  mapToLocal(alpinePath: string): string {
    const normalized = normalizePath(alpinePath);
    const base = normalizePath(this.config.alpineBasePath);
    const prefix = `${base}/`;
    if (normalized.startsWith(prefix)) {
      return normalized.slice(prefix.length);
    }
    // If the path doesn't start with the base, return as-is
    return normalized;
  }

  // ─── Internal Helpers ───────────────────────────────────────────────────

  /** Throw if v86 is not in a usable state. */
  private ensureRunning(): void {
    if (!v86Service.isRunning) {
      const msg = `v86 is not running (status: ${v86Service.status}). Cannot perform file bridge operation.`;
      this.emitError(msg);
      throw new Error(msg);
    }
  }

  /** Consistent log prefix. */
  private log(message: string, ...data: unknown[]): void {
    console.log(`[FileBridge] ${message}`, ...data);
  }

  private warn(message: string, ...data: unknown[]): void {
    console.warn(`[FileBridge] ${message}`, ...data);
  }

  private error(message: string, ...data: unknown[]): void {
    console.error(`[FileBridge] ${message}`, ...data);
  }

  // ─── Shell Command Execution ────────────────────────────────────────────

  /**
   * Execute a shell command inside the Alpine VM via serial and return its
   * stdout.  Uses unique begin/end markers so the output can be reliably
   * extracted from the serial stream.
   *
   * @param command  Shell command to run (e.g. `ls -la /tmp`)
   * @param timeout  Maximum time to wait for output in ms (default 10 000)
   */
  private async executeCommand(command: string, timeout = 10000): Promise<string> {
    this.ensureRunning();

    // Block dangerous shell metacharacters
    const dangerous = /[;&|`$(){}<>!]/;
    if (dangerous.test(command)) {
      this.warn('executeCommand> Dangerous characters detected, sanitizing');
      command = command.replace(/[;&|`$(){}<>!]/g, '');
    }

    const id =
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 7);
    const beginMarker = `NXFB_BEGIN_${id}`;
    const endMarker = `NXFB_END_${id}`;

    return new Promise<string>((resolve, reject) => {
      let buffer = '';
      let settled = false;
      let timerId: ReturnType<typeof setTimeout>;

      const cleanup = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timerId);
          unsubscribe();
        }
      };

      const unsubscribe = v86Service.onOutput((text: string) => {
        buffer += text;

        if (buffer.includes(endMarker)) {
          cleanup();

          // Normalise line endings once
          const normalised = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

          // The command itself is echoed back and contains the markers.
          // Find the *second* occurrence of beginMarker (the echo output)
          // and the first occurrence of endMarker after it.
          const firstBegin = normalised.indexOf(beginMarker);
          const secondBegin = normalised.indexOf(beginMarker, firstBegin + beginMarker.length);
          if (secondBegin === -1) {
            reject(new Error(`FileBridge: could not locate begin marker in command output`));
            return;
          }
          const contentStart = secondBegin + beginMarker.length;

          const endIdx = normalised.indexOf(endMarker, contentStart);
          if (endIdx === -1) {
            reject(new Error(`FileBridge: could not locate end marker in command output`));
            return;
          }

          const raw = normalised.substring(contentStart, endIdx);
          // Strip leading/trailing whitespace
          resolve(raw.replace(/^\n+/, '').replace(/\n+$/, ''));
        }
      });

      // Send the command through the serial console
      const fullCmd = `echo ${beginMarker} ; ${command} 2>&1 ; echo ${endMarker}`;
      this.log(`exec> ${command}`);
      v86Service.sendInput(fullCmd + '\n');

      // Safety timeout
      timerId = setTimeout(() => {
        cleanup();
        reject(
          new Error(`FileBridge: command timed out after ${timeout}ms — ${command}`)
        );
      }, timeout);
    });
  }

  // ─── Ensure Alpine Directories ──────────────────────────────────────────

  /**
   * Create all directories required by a set of Alpine paths.
   * Uses a single `mkdir -p` call to be efficient.
   */
  private ensureAlpineDirectories(alpinePaths: string[]): void {
    this.ensureRunning();

    const dirs = extractDirectories(alpinePaths);
    if (dirs.length === 0) return;

    const fullPaths = dirs.map(d => `${this.config.alpineBasePath}/${this.sanitizePath(d)}`);
    const cmd = `mkdir -p ${fullPaths.map(p => `"${p}"`).join(' ')}`;
    v86Service.sendInput(cmd + '\n');
    this.log(`Created directories for ${dirs.length} path(s)`);
  }

  // ─── Core File Operations ───────────────────────────────────────────────

  /**
   * Push a single file from the local workspace to the Alpine VM.
   *
   * @param localPath  Workspace-relative path (e.g. `src/App.tsx`)
   * @param content    File content as a UTF-8 string
   */
  pushFile(localPath: string, content: string): void {
    this.ensureRunning();

    const alpinePath = this.mapToAlpine(localPath);
    this.log(`pushFile> ${localPath} → ${alpinePath}`);

    // Ensure parent directory exists
    const dirPart = alpinePath.substring(0, alpinePath.lastIndexOf('/'));
    if (dirPart.length > 0) {
      v86Service.sendInput(`mkdir -p "${dirPart}"\n`);
    }

    v86Service.writeFile(alpinePath, content);
  }

  /**
   * Pull a single file from the Alpine VM and return its content as a string.
   *
   * @param alpinePath  Absolute path inside Alpine (e.g. `/home/nexus/workspace/src/App.tsx`)
   */
  async pullFile(alpinePath: string): Promise<string> {
    this.ensureRunning();

    this.log(`pullFile> ${alpinePath}`);
    const data = await v86Service.readFile(alpinePath);
    return new TextDecoder().decode(data);
  }

  /**
   * Push an entire workspace snapshot to Alpine.
   * Skips files matching any of the configured `excludedPatterns`.
   *
   * @param files  Array of `{ name, content }` representing the workspace
   */
  pushWorkspace(files: FileEntry[]): void {
    this.ensureRunning();

    const eligible = files.filter(f => !isExcluded(f.name, this.config.excludedPatterns));
    if (eligible.length === 0) {
      this.log('pushWorkspace> No files to push (all excluded)');
      return;
    }

    this.log(`pushWorkspace> Pushing ${eligible.length} file(s) (${files.length - eligible.length} excluded)`);

    // Batch-create directories
    this.ensureAlpineDirectories(eligible.map(f => f.name));

    // Write each file
    for (const file of eligible) {
      const alpinePath = this.mapToAlpine(file.name);
      try {
        v86Service.writeFile(alpinePath, file.content);
      } catch (err) {
        this.error(`pushWorkspace> Failed to write ${alpinePath}:`, err);
      }
    }

    this.currentFiles = files;
  }

  /**
   * Pull the entire workspace from Alpine by listing the base directory
   * recursively and reading each file.
   *
   * @returns Array of `{ name, content }` with paths relative to the workspace root
   */
  async pullWorkspace(): Promise<FileEntry[]> {
    this.ensureRunning();
    this.emitSyncStart();

    this.log(`pullWorkspace> Scanning ${this.config.alpineBasePath}`);
    try {
      // List all files recursively
      const listing = await this.executeCommand(
        `find ${this.config.alpineBasePath} -type f`
      );

      const alpinePaths = listing
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .filter(p => !isExcluded(this.mapToLocal(p), this.config.excludedPatterns));

      const entries: FileEntry[] = [];

      for (const alpinePath of alpinePaths) {
        try {
          const content = await this.pullFile(alpinePath);
          const localName = this.mapToLocal(alpinePath);
          entries.push({ name: localName, content });
        } catch (err) {
          this.warn(`pullWorkspace> Skipping ${alpinePath}:`, err);
        }
      }

      this.currentFiles = entries;
      const stats: SyncStats = { pushed: 0, pulled: entries.length };
      this.emitSyncComplete(stats);
      this.log(`pullWorkspace> Pulled ${entries.length} file(s)`);
      return entries;
    } catch (err: any) {
      const msg = `pullWorkspace failed: ${err.message ?? err}`;
      this.emitError(msg);
      throw new Error(msg);
    }
  }

  /**
   * Delete a single file inside the Alpine VM via `rm`.
   *
   * @param alpinePath  Absolute path inside Alpine
   */
  deleteAlpineFile(alpinePath: string): void {
    this.ensureRunning();

    const safePath = this.sanitizePath(alpinePath);
    this.log(`deleteAlpineFile> ${safePath}`);
    v86Service.sendInput(`rm -f "${safePath}"\n`);
  }

  // ─── Auto-Sync ──────────────────────────────────────────────────────────

  /**
   * Start the auto-sync loop.  On every tick the entire workspace snapshot
   * is re-pushed to Alpine.
   *
   * @param files  Current workspace snapshot
   */
  startAutoSync(files: FileEntry[]): void {
    if (this.autoSyncTimer) {
      this.warn('startAutoSync> Auto-sync already running; stopping previous instance');
      this.stopAutoSync();
    }

    this.currentFiles = files;
    this.config.autoSync = true;
    this.log(`startAutoSync> Starting with interval ${this.config.syncInterval}ms`);

    // Perform an immediate sync
    this.syncNow(files);

    this.autoSyncTimer = setInterval(() => {
      this.syncNow(this.currentFiles);
    }, this.config.syncInterval);
  }

  /** Stop the auto-sync loop. */
  stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
      this.config.autoSync = false;
      this.log('stopAutoSync> Auto-sync stopped');
    }
  }

  /**
   * Trigger an immediate workspace sync (push current snapshot to Alpine).
   * Respects the `syncing` guard to prevent overlapping sync operations.
   *
   * @param files  Workspace snapshot to push
   */
  syncNow(files: FileEntry[]): void {
    if (this.syncing) {
      this.warn('syncNow> Sync already in progress, skipping');
      return;
    }

    this.syncing = true;
    this.emitSyncStart();

    try {
      this.pushWorkspace(files);
      this.currentFiles = files;

      const stats: SyncStats = { pushed: files.length, pulled: 0 };
      this.emitSyncComplete(stats);
      this.log(`syncNow> Synced ${files.length} file(s)`);
    } catch (err: any) {
      const msg = `syncNow failed: ${err.message ?? err}`;
      this.emitError(msg);
    } finally {
      this.syncing = false;
    }
  }

  /** Whether the auto-sync loop is currently active. */
  get isAutoSyncing(): boolean {
    return this.autoSyncTimer !== null;
  }

  // ─── Alpine Filesystem Commands ─────────────────────────────────────────

  /**
   * Create a directory (with parents) inside Alpine.
   *
   * @param path  Absolute or relative (to workspace root) path
   */
  mkdir(path: string): void {
    this.ensureRunning();

    const alpinePath = path.startsWith('/') ? this.sanitizePath(path) : this.mapToAlpine(path);
    this.log(`mkdir> ${alpinePath}`);
    v86Service.sendInput(`mkdir -p "${alpinePath}"\n`);
  }

  /**
   * List the contents of a directory inside Alpine.
   *
   * @param path  Absolute or relative (to workspace root) path. Defaults to the workspace root.
   * @returns Array of `{ name, type, size }` entries
   */
  async listFiles(path?: string): Promise<DirectoryEntry[]> {
    this.ensureRunning();

    const target = path ? (path.startsWith('/') ? this.sanitizePath(path) : this.mapToAlpine(path)) : this.config.alpineBasePath;
    this.log(`listFiles> ${target}`);

    const output = await this.executeCommand(`ls -la "${target}"`);

    // Parse `ls -la` output
    // Typical busybox ls -la line:
    // drwxr-xr-x    2 root     root          4096 Jan  1  1970 src
    // -rw-r--r--    1 root     root           123 Jan  1  1970 App.tsx
    const lines = output.split('\n').filter(Boolean);

    const entries: DirectoryEntry[] = [];
    for (const line of lines) {
      // Skip header lines (e.g. "total 42")
      if (!line.startsWith('-') && !line.startsWith('d') && !line.startsWith('l')) {
        continue;
      }

      const parts = line.split(/\s+/);
      if (parts.length < 7) continue;

      const typeChar = line[0];
      const type: 'file' | 'dir' = typeChar === 'd' ? 'dir' : 'file';
      const size = parseInt(parts[4], 10) || 0;
      const name = parts.slice(6).join(' ');

      entries.push({ name, type, size });
    }

    return entries;
  }

  /**
   * Get filesystem disk usage from Alpine via `df`.
   *
   * @returns `{ used, total }` in **bytes**
   */
  async getDiskUsage(): Promise<DiskUsage> {
    this.ensureRunning();

    this.log('getDiskUsage>');
    const output = await this.executeCommand('df -h /');

    // Parse `df -h /` output
    // Filesystem                Size      Used Available Use% Mounted on
    // /dev/root                 1.8G      523M    1.2G  30% /
    const lines = output.split('\n').filter(Boolean);
    let usedStr = '0';
    let totalStr = '0';

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);
      if (parts.length >= 6 && parts[5] === '/') {
        totalStr = parts[1];
        usedStr = parts[2];
        break;
      }
    }

    const used = this.parseHumanSize(usedStr);
    const total = this.parseHumanSize(totalStr);
    return { used, total };
  }

  /**
   * Convert a human-readable size string (e.g. `523M`, `1.8G`, `1024K`) to bytes.
   */
  private parseHumanSize(size: string): number {
    const trimmed = size.trim().toUpperCase();
    const match = trimmed.match(/^([\d.]+)([KMGTPE]?)/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      '': 1,
      K: 1024,
      M: 1024 ** 2,
      G: 1024 ** 3,
      T: 1024 ** 4,
      P: 1024 ** 5,
      E: 1024 ** 6,
    };

    return Math.round(value * (multipliers[unit] ?? 1));
  }

  // ─── Event System ───────────────────────────────────────────────────────

  /**
   * Subscribe to sync-start events.
   * @returns Unsubscribe function
   */
  onSyncStart(callback: () => void): () => void {
    this.syncStartCallbacks.add(callback);
    return () => {
      this.syncStartCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to sync-complete events.
   * @returns Unsubscribe function
   */
  onSyncComplete(callback: (stats: SyncStats) => void): () => void {
    this.syncCompleteCallbacks.add(callback);
    return () => {
      this.syncCompleteCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to error events.
   * @returns Unsubscribe function
   */
  onError(callback: (error: string) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  // ─── Event Emitters (private) ──────────────────────────────────────────

  private emitSyncStart(): void {
    this.syncStartCallbacks.forEach(cb => {
      try { cb(); } catch (err) { this.error('onSyncStart callback threw:', err); }
    });
  }

  private emitSyncComplete(stats: SyncStats): void {
    this.syncCompleteCallbacks.forEach(cb => {
      try { cb(stats); } catch (err) { this.error('onSyncComplete callback threw:', err); }
    });
  }

  private emitError(message: string): void {
    this.errorCallbacks.forEach(cb => {
      try { cb(message); } catch (err) { this.error('onError callback threw:', err); }
    });
  }
}

// ─── Singleton Export ──────────────────────────────────────────────────────────

export const fileBridgeService = new FileBridgeService();

export default fileBridgeService;
