/**
 * v86Service — Manages the v86 x86 emulator for running operating systems
 * inside the browser. The default Buildroot Linux image is bundled in the
 * project (public/v86/buildroot-bzimage.bin, ~5MB). Custom images (ISO, IMG,
 * floppy) can be uploaded by the user for Windows or other Linux distros.
 *
 * v5.4.1 — Added custom image boot support, improved bundled image handling.
 */

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface V86Config {
  wasmPath: string;
  biosUrl?: string;
  vgaBiosUrl?: string;
  hda?: {
    buffer: ArrayBuffer;
    async: boolean;
  };
  memorySize: number; // bytes (e.g. 128 * 1024 * 1024)
  autostart: boolean;
}

/** Configuration for booting a custom OS image */
export interface CustomImageConfig {
  /** File name for display */
  name: string;
  /** Raw ArrayBuffer of the image file */
  buffer: ArrayBuffer;
  /** File extension — determines how v86 mounts the image */
  extension: string;
  /** Optional custom memory size override (bytes) */
  memorySize?: number;
}

export interface V86Emulator {
  create_file(path: string, buffer: Uint8Array): void;
  read_file(path: string): Promise<Uint8Array>;
  serial0_send(text: string): void;
  add_listener(event: string, callback: (...args: any[]) => void): void;
  remove_listener(event: string, callback: (...args: any[]) => void): void;
  save_state(): Promise<ArrayBuffer>;
  restore_state(state: ArrayBuffer): void;
  destroy(): void;
  screen_adapter: HTMLElement;
  run(): void;
  stop(): void;
  restart(): void;
  is_running(): boolean;
}

/**
 * Full lifecycle stages for the emulator boot process.
 * Backward-compatible: existing checks for 'stopped'|'booting'|'running'|'paused'|'error' still work.
 */
export type V86Status =
  | 'idle'
  | 'loading-image'
  | 'configuring'
  | 'booting'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'error';

/** Typed event payload for boot-progress events. */
export interface BootProgressEvent {
  stage: V86Status;
  progress: number;   // 0-100
  message: string;
}

/** All events emitted by V86Service. */
export type V86ServiceEvent =
  | 'boot-progress'
  | 'state-saved'
  | 'state-restored';

/** Shape of a file entry returned by listDirectory. */
export interface FileEntry {
  permissions: string;
  links: number;
  owner: string;
  group: string;
  size: number;
  date: string;
  name: string;
  isDirectory: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Local v86 assets — served from public/v86/ for COEP compatibility
const V86_BIOS_URL     = '/v86/seabios.bin';
const V86_VGA_BIOS_URL = '/v86/vgabios.bin';
const V86_BZIMAGE_URL  = '/v86/buildroot-bzimage.bin';

const V86_CDN_BASE = 'https://cdn.jsdelivr.net/npm/v86@latest/build/';
const V86_WASM_URL = `${V86_CDN_BASE}v86.wasm`;
const V86_LIB_URL  = `${V86_CDN_BASE}libv86.js`;

const RAM_SIZE = 128 * 1024 * 1024; // 128 MB
const BZIMAGE_SIZE = 5_166_352; // buildroot-bzimage.bin exact size

// Memory defaults for custom images (ISOs need more RAM)
const DEFAULT_CDROM_RAM = 512 * 1024 * 1024;  // 512 MB for ISO images
const DEFAULT_HDA_RAM     = 256 * 1024 * 1024;  // 256 MB for disk images
const DEFAULT_FDA_RAM     = 64 * 1024 * 1024;   // 64 MB for floppy images

const DEFAULT_AUTO_SAVE_INTERVAL_MS = 60_000; // 1 minute

// ─── IndexedDB ────────────────────────────────────────────────────────────────

const DB_NAME    = 'nexus_v86';
const DB_VERSION = 2; // bumped to add disk_images store
const VM_STATE_STORE    = 'vm_state';
const DISK_IMAGES_STORE = 'disk_images';
const VM_STATE_KEY      = 'vm_state';
const DISK_IMAGE_KEY    = 'buildroot-bzimage';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VM_STATE_STORE)) {
        db.createObjectStore(VM_STATE_STORE);
      }
      if (!db.objectStoreNames.contains(DISK_IMAGES_STORE)) {
        db.createObjectStore(DISK_IMAGES_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

// ─── VM State helpers (keep existing) ────────────────────────────────────────

async function saveVMStateToIDB(data: ArrayBuffer): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(VM_STATE_STORE, 'readwrite');
    const store = tx.objectStore(VM_STATE_STORE);
    const req   = store.put(data, VM_STATE_KEY);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function loadVMStateFromIDB(): Promise<ArrayBuffer | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(VM_STATE_STORE, 'readonly');
    const store = tx.objectStore(VM_STATE_STORE);
    const req   = store.get(VM_STATE_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  });
}

async function clearVMStateInIDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(VM_STATE_STORE, 'readwrite');
    const store = tx.objectStore(VM_STATE_STORE);
    const req   = store.delete(VM_STATE_KEY);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── Disk Image helpers ───────────────────────────────────────────────────────

async function saveDiskImageToIDB(buffer: ArrayBuffer): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(DISK_IMAGES_STORE, 'readwrite');
    const store = tx.objectStore(DISK_IMAGES_STORE);
    const req   = store.put(buffer, DISK_IMAGE_KEY);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function loadDiskImageFromIDB(): Promise<ArrayBuffer | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(DISK_IMAGES_STORE, 'readonly');
    const store = tx.objectStore(DISK_IMAGES_STORE);
    const req   = store.get(DISK_IMAGE_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Fetch the buildroot bzImage from the local URL and cache it in IndexedDB.
 * Reports download progress via `onProgress(loadedBytes, totalBytes)`.
 */
async function fetchAndCacheDiskImage(
  url: string = V86_BZIMAGE_URL,
  onProgress?: (loaded: number, total: number) => void,
): Promise<ArrayBuffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download disk image: HTTP ${response.status} ${response.statusText}`,
    );
  }

  if (!response.body) {
    // Fallback: fetch without streaming if ReadableStream is unavailable
    const buffer = await response.arrayBuffer();
    await saveDiskImageToIDB(buffer);
    return buffer;
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress?.(loaded, total);
  }

  // Concatenate chunks into a single ArrayBuffer
  const buffer = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }

  await saveDiskImageToIDB(buffer.buffer as ArrayBuffer);
  return buffer.buffer as ArrayBuffer;
}

// ─── v86 CDN Loader ───────────────────────────────────────────────────────────

async function loadV86Library(): Promise<new (config: V86Config) => V86Emulator> {
  if ((window as any).V86) {
    return (window as any).V86;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src   = V86_LIB_URL;
    script.async = true;

    script.onload = () => {
      if ((window as any).V86) {
        resolve((window as any).V86);
      } else {
        reject(new Error('v86 library loaded but V86 constructor not found'));
      }
    };

    script.onerror = () => {
      reject(new Error(`Failed to load v86 library from CDN: ${script.src}`));
    };

    document.head.appendChild(script);
  });
}

// ─── V86Service ───────────────────────────────────────────────────────────────

class V86Service {
  private emulator: V86Emulator | null = null;
  private _status: V86Status = 'idle';
  private outputCallbacks: Array<(text: string) => void> = [];
  private screenCallbacks: Array<() => void> = [];
  private screenElement: HTMLElement | null = null;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  /** Typed event listeners keyed by event name. */
  private eventListeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  /** Pending command resolver — used by runCommand to capture serial output. */
  private commandResolve: ((output: string) => void) | null = null;
  private commandBuffer: string = '';
  private commandMarker: string = '';

  // ─── Public getters ────────────────────────────────────────────────

  get status(): V86Status {
    return this._status;
  }

  get isRunning(): boolean {
    return this._status === 'running';
  }

  // ─── Event System ──────────────────────────────────────────────────

  /**
   * Subscribe to a typed service event.
   * Returns an unsubscribe function.
   */
  on<E extends V86ServiceEvent>(
    event: E,
    callback: E extends 'boot-progress'
      ? (payload: BootProgressEvent) => void
      : () => void,
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback as (...args: any[]) => void);

    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        this.eventListeners.set(
          event,
          listeners.filter(cb => cb !== callback),
        );
      }
    };
  }

  /** Emit an event to all registered listeners. */
  private emit(event: V86ServiceEvent, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(cb => {
        try {
          cb(...args);
        } catch (err) {
          console.error(`[v86] Error in ${event} listener:`, err);
        }
      });
    }
  }

  /** Update status and emit a boot-progress event. */
  private setStatus(stage: V86Status, progress: number, message: string): void {
    this._status = stage;
    this.emit('boot-progress', { stage, progress, message });
  }

  // ─── Disk Image ────────────────────────────────────────────────────

  /**
   * Load the Alpine disk image — from IndexedDB cache or by downloading.
   * Progress is reported via boot-progress events.
   */
  private async acquireDiskImage(): Promise<ArrayBuffer> {
    // 1. Try IndexedDB cache
    this.setStatus('loading-image', 5, 'Checking disk image cache...');
    try {
      const cached = await loadDiskImageFromIDB();
      if (cached && cached.byteLength > 0) {
        this.setStatus('loading-image', 100, 'Disk image loaded from cache');
        return cached;
      }
    } catch (err) {
      console.warn('[v86] Failed to read disk image cache:', err);
    }

    // 2. Load from local public/v86/ directory (bundled, no network needed)
    this.setStatus('loading-image', 10, 'Loading bundled Linux kernel...');
    try {
      const buffer = await fetchAndCacheDiskImage(V86_BZIMAGE_URL, (loaded, total) => {
        const pct = total > 0 ? Math.min(Math.round((loaded / total) * 85) + 10, 95) : 50;
        const msg = total > 0
          ? `Loading Linux kernel... ${((loaded / total) * 100).toFixed(0)}%`
          : `Loading Linux kernel... ${(loaded / (1024 * 1024)).toFixed(1)} MB`;
        this.setStatus('loading-image', pct, msg);
      });
      this.setStatus('loading-image', 100, 'Kernel loaded and cached');
      return buffer;
    } catch (err: any) {
      this.setStatus('error', 0, `Failed to load disk image: ${err.message}`);
      throw new Error(`Failed to load disk image: ${err.message}`);
    }
  }

  // ─── Boot ───────────────────────────────────────────────────────────

  /**
   * Boot with a custom uploaded image (ISO, IMG, floppy).
   * The image is passed as an ArrayBuffer and mounted appropriately.
   */
  async bootCustomImage(imageConfig: CustomImageConfig, network_relay_url?: string): Promise<void> {
    if (this.emulator) {
      throw new Error('v86 emulator is already running. Call stop() first.');
    }

    try {
      this.setStatus('configuring', 0, 'Loading v86 emulator library...');
      const V86Constructor = await loadV86Library();

      this.setStatus('configuring', 50, 'Configuring emulator for custom image...');
      this.createDomElements();

      // Determine how to mount based on file extension
      const ext = imageConfig.extension.toLowerCase();
      const imageConfigObj: Record<string, any> = {};
      let bootLabel = imageConfig.name;

      if (ext === '.iso') {
        imageConfigObj.cdrom = { buffer: imageConfig.buffer };
        bootLabel = `ISO: ${imageConfig.name}`;
      } else if (ext === '.img' || ext === '.bin') {
        // .img/.bin could be bzImage or hard disk image
        // If file is > 20MB, treat as hard disk; otherwise as bzImage kernel
        if (imageConfig.buffer.byteLength > 20 * 1024 * 1024) {
          imageConfigObj.hda = { buffer: imageConfig.buffer, async: true };
          bootLabel = `Disk: ${imageConfig.name}`;
        } else {
          imageConfigObj.bzimage = { buffer: imageConfig.buffer };
          imageConfigObj.cmdline = 'console=ttyS0 tsc=reliable mitigations=off random.trust_cpu=on';
          bootLabel = `Kernel: ${imageConfig.name}`;
        }
      } else if (ext === '.fdd' || ext === '.flp') {
        imageConfigObj.fda = { buffer: imageConfig.buffer };
        bootLabel = `Floppy: ${imageConfig.name}`;
      } else {
        // Unknown extension — try as CDROM
        imageConfigObj.cdrom = { buffer: imageConfig.buffer };
        bootLabel = `Image: ${imageConfig.name}`;
      }

      // Select appropriate RAM size
      let ramSize = imageConfig.memorySize || RAM_SIZE;
      if (!imageConfig.memorySize) {
        if (imageConfigObj.cdrom) ramSize = DEFAULT_CDROM_RAM;
        else if (imageConfigObj.hda && imageConfig.buffer.byteLength > 20 * 1024 * 1024) ramSize = DEFAULT_HDA_RAM;
        else if (imageConfigObj.fda) ramSize = DEFAULT_FDA_RAM;
      }

      const emulatorConfig: Record<string, any> = {
        wasm_path:    V86_WASM_URL,
        bios_url:     V86_BIOS_URL,
        vga_bios_url: V86_VGA_BIOS_URL,
        memory_size:  ramSize,
        autostart:    true,
        screen_adapter: this.screenElement,
        ...imageConfigObj,
      };

      if (network_relay_url) {
        emulatorConfig.network_relay_url = network_relay_url;
      }

      this.setStatus('booting', 0, `Booting ${bootLabel}...`);
      this.emulator = new V86Constructor(emulatorConfig as any);
      this.wireEventListeners(bootLabel);
    } catch (err: any) {
      this.setStatus('error', 0, err.message || 'Failed to boot emulator');
      this.cleanup();
      throw err;
    }
  }

  /**
   * Boot the default bundled Buildroot Linux VM.
   * The ~5MB kernel image is already in public/v86/buildroot-bzimage.bin.
   *
   * 1. Loads v86 library from CDN
   * 2. Acquires bundled disk image (from IndexedDB cache or local fetch)
   * 3. Configures and creates the v86 emulator
   * 4. Listens for 'emulator-ready' to confirm boot
   * 5. Restores saved VM state if available
   */
  async boot(config?: Partial<V86Config>, network_relay_url?: string): Promise<void> {
    if (this.emulator) {
      throw new Error('v86 emulator is already running. Call stop() first.');
    }

    try {
      // ── Stage 1: Load v86 library ──────────────────────────────────
      this.setStatus('configuring', 0, 'Loading v86 emulator library...');
      const V86Constructor = await loadV86Library();

      // ── Stage 2: Acquire disk image ────────────────────────────────
      const diskBuffer = await this.acquireDiskImage();

      // ── Stage 3: Create DOM elements ──────────────────────────────
      this.setStatus('configuring', 90, 'Setting up emulator...');
      this.createDomElements();

      // ── Stage 4: Build emulator config ─────────────────────────────
      const emulatorConfig: Record<string, any> = {
        wasm_path:        config?.wasmPath || V86_WASM_URL,
        bios_url:         config?.biosUrl  || V86_BIOS_URL,
        vga_bios_url:     config?.vgaBiosUrl || V86_VGA_BIOS_URL,
        memory_size:      config?.memorySize || RAM_SIZE,
        autostart:        config?.autostart !== undefined ? config.autostart : true,
        bzimage:          { buffer: diskBuffer },
        cmdline:          "console=ttyS0 tsc=reliable mitigations=off random.trust_cpu=on",
        screen_adapter:   this.screenElement,
      };

      if (network_relay_url) {
        emulatorConfig.network_relay_url = network_relay_url;
      }

      // ── Stage 5: Instantiate emulator ──────────────────────────────
      this.setStatus('booting', 0, 'Booting Buildroot Linux...');
      this.emulator = new V86Constructor(emulatorConfig as any);

      this.wireEventListeners('Buildroot Linux');

    } catch (err: any) {
      this.setStatus('error', 0, err.message || 'Failed to boot emulator');
      this.cleanup();
      throw err;
    }
  }

  // ─── Stop ───────────────────────────────────────────────────────────

  async stop(): Promise<void> {
    this.stopAutoSave();

    if (!this.emulator) {
      this._status = 'stopped';
      return;
    }

    try {
      this.emulator.stop();
      this.emulator.destroy();
    } catch {
      // Ignore errors during cleanup
    }

    this.cleanup();
    this._status = 'stopped';
  }

  // ─── Pause / Resume ─────────────────────────────────────────────────

  pause(): void {
    if (!this.emulator || this._status !== 'running') return;

    try {
      (this.emulator as any).stop();
      this._status = 'paused';
    } catch {
      this._status = 'error';
    }
  }

  resume(): void {
    if (!this.emulator || this._status !== 'paused') return;

    try {
      this.emulator.run();
      this._status = 'running';
    } catch {
      this._status = 'error';
    }
  }

  // ─── Send Input ─────────────────────────────────────────────────────

  sendInput(text: string): void {
    if (!this.emulator || this._status !== 'running') return;

    this.emulator.serial0_send(text);
  }

  // ─── Command Execution ──────────────────────────────────────────────

  /**
   * Send a shell command via serial and wait for output.
   * Uses a unique marker to detect when the command has finished.
   *
   * @param cmd  The shell command to execute (e.g. 'ls -la /home')
   * @param timeoutMs  Maximum time to wait for output (default 10000ms)
   * @returns The raw output text between the command echo and the marker
   */
  async runCommand(cmd: string, timeoutMs: number = 10_000): Promise<string> {
    if (!this.emulator || this._status !== 'running') {
      throw new Error('Cannot run command: emulator not running');
    }

    if (this.commandResolve) {
      throw new Error('Another command is already executing. Wait for it to finish.');
    }

    return new Promise<string>((resolve, reject) => {
      // Generate a unique end-of-output marker
      const marker = `__NEXUS_CMD_END_${Date.now()}_${Math.random().toString(36).slice(2)}__`;
      this.commandMarker  = marker;
      this.commandBuffer  = '';

      const timeout = setTimeout(() => {
        this.commandResolve = null;
        this.commandBuffer  = '';
        this.commandMarker  = '';
        reject(new Error(`Command timed out after ${timeoutMs}ms: ${cmd}`));
      }, timeoutMs);

      this.commandResolve = (output: string) => {
        clearTimeout(timeout);
        this.commandResolve = null;
        this.commandMarker  = '';
        this.commandBuffer  = '';
        resolve(output);
      };

      // Send command + echo marker so we can detect completion
      this.emulator.serial0_send(`${cmd}\n`);
      this.emulator.serial0_send(`echo '${marker}'\n`);
    });
  }

  /**
   * Parse raw `ls -la` output into structured FileEntry objects.
   */
  private parseLsOutput(raw: string): FileEntry[] {
    const lines = raw.split('\n').filter(line => line.trim().length > 0);
    const entries: FileEntry[] = [];

    // Expected format: permissions links owner group size month day time/year name
    const lsRegex =
      /^([dl\-rwxsStT]{10})\s+(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(\w{3}\s+\d{1,2}\s+[\d:]+)\s+(.+)$/;

    for (const line of lines) {
      const match = line.match(lsRegex);
      if (match) {
        entries.push({
          permissions: match[1],
          links:       parseInt(match[2], 10),
          owner:       match[3],
          group:       match[4],
          size:        parseInt(match[5], 10),
          date:        match[6],
          name:        match[7],
          isDirectory: match[1].startsWith('d'),
        });
      }
    }

    return entries;
  }

  /**
   * List files in a directory inside the Alpine VM.
   * Sends `ls -la {path}` and parses the output.
   *
   * @param path  Directory path (default '/')
   * @returns Array of FileEntry objects
   */
  async listDirectory(path: string = '/'): Promise<FileEntry[]> {
    const output = await this.runCommand(`ls -la ${path}`);
    return this.parseLsOutput(output);
  }

  // ─── File Operations ────────────────────────────────────────────────

  writeFile(path: string, content: string | Uint8Array): void {
    if (!this.emulator) {
      console.warn('[v86] Cannot write file: emulator not running');
      return;
    }

    let buffer: Uint8Array;
    if (typeof content === 'string') {
      buffer = new TextEncoder().encode(content);
    } else {
      buffer = content;
    }

    try {
      this.emulator.create_file(path, buffer);
    } catch (err) {
      console.error(`[v86] Failed to write file ${path}:`, err);
    }
  }

  async readFile(path: string): Promise<Uint8Array> {
    if (!this.emulator) {
      throw new Error('Cannot read file: emulator not running');
    }

    return this.emulator.read_file(path);
  }

  // ─── Event Listeners (legacy, backward-compatible) ─────────────────

  onOutput(callback: (text: string) => void): () => void {
    this.outputCallbacks.push(callback);
    return () => {
      this.outputCallbacks = this.outputCallbacks.filter(cb => cb !== callback);
    };
  }

  onScreenChange(callback: () => void): () => void {
    this.screenCallbacks.push(callback);
    return () => {
      this.screenCallbacks = this.screenCallbacks.filter(cb => cb !== callback);
    };
  }

  // ─── State Persistence ──────────────────────────────────────────────

  async saveState(): Promise<void> {
    if (!this.emulator) {
      console.warn('[v86] Cannot save state: emulator not running');
      return;
    }

    try {
      const state = await this.emulator.save_state();
      await saveVMStateToIDB(state);
      console.log('[v86] VM state saved to IndexedDB');
      this.emit('state-saved');
    } catch (err) {
      console.error('[v86] Failed to save VM state:', err);
      throw err;
    }
  }

  async restoreState(): Promise<boolean> {
    try {
      const state = await loadVMStateFromIDB();
      if (!state) {
        console.log('[v86] No saved VM state found');
        return false;
      }

      if (!this.emulator) {
        console.warn('[v86] Cannot restore state: emulator not running');
        return false;
      }

      this.emulator.restore_state(state);
      this._status = 'running';
      console.log('[v86] VM state restored from IndexedDB');
      this.emit('state-restored');
      return true;
    } catch (err) {
      console.error('[v86] Failed to restore VM state:', err);
      return false;
    }
  }

  async clearState(): Promise<void> {
    try {
      await clearVMStateInIDB();
      console.log('[v86] VM state cleared from IndexedDB');
    } catch (err) {
      console.error('[v86] Failed to clear VM state:', err);
    }
  }

  // ─── Auto-Save ──────────────────────────────────────────────────────

  /**
   * Start periodic VM state saving.
   *
   * @param intervalMs  Save interval in milliseconds (default 60000 = 1 min)
   */
  startAutoSave(intervalMs: number = DEFAULT_AUTO_SAVE_INTERVAL_MS): void {
    this.stopAutoSave();

    this.autoSaveTimer = setInterval(async () => {
      if (this.emulator && this._status === 'running') {
        try {
          await this.saveState();
        } catch {
          // Auto-save failure is non-fatal; already logged inside saveState
        }
      }
    }, intervalMs);

    console.log(`[v86] Auto-save started (interval: ${intervalMs}ms)`);
  }

  /** Stop the periodic auto-save timer. */
  stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('[v86] Auto-save stopped');
    }
  }

  // ─── Element Accessors ──────────────────────────────────────────────

  getScreenElement(): HTMLElement | null {
    return this.screenElement;
  }

  // ─── User Setup ─────────────────────────────────────────────────────

  /** Extracted DOM element creation shared by boot() and bootCustomImage() */
  private createDomElements(): void {
    this.screenElement = document.createElement('div');
    this.screenElement.id = 'v86-screen';
    this.screenElement.style.display = 'none';
    document.body.appendChild(this.screenElement);
  }

  /** Extracted event listener wiring shared by boot() and bootCustomImage() */
  private wireEventListeners(label: string): void {
    this.emulator!.add_listener('serial0-output-byte', (byte: number) => {
      const char = String.fromCharCode(byte);
      this.outputCallbacks.forEach(cb => cb(char));

      // Accumulate output for runCommand and detect completion marker
      if (this.commandResolve) {
        this.commandBuffer += char;
        // Check if the output contains the end-of-command marker
        const markerIdx = this.commandBuffer.indexOf(this.commandMarker);
        if (markerIdx !== -1) {
          // Extract output before the marker line (including the echo of the marker itself)
          const output = this.commandBuffer.substring(0, markerIdx);
          const resolve = this.commandResolve;
          resolve(output);
        }
      }
    });

    this.emulator!.add_listener('emulator-ready', async () => {
      this.setStatus('running', 100, `${label} is running`);
      console.log(`[v86] Emulator ready — ${label} booted`);

      // Attempt to restore saved state
      try {
        const restored = await this.restoreState();
        if (restored) {
          console.log('[v86] VM state restored after boot');
        }
      } catch (err) {
        // Non-fatal — boot still succeeded
        console.warn('[v86] Could not restore VM state after boot:', err);
      }
    });

    this.emulator!.add_listener('emulator-stopped', () => {
      this.setStatus('stopped', 0, 'Emulator stopped');
    });
  }

  setupUser(config: {
    mode: 'root' | 'user';
    username?: string;
    password?: string;
    autoLogin?: boolean;
  }): void {
    if (!this.emulator || this._status !== 'running') {
      console.warn('[v86] Cannot setup user: emulator not running');
      return;
    }

    if (config.mode === 'root') {
      return;
    }

    const username = config.username || 'nexus';
    const password = config.password || 'nexus';

    const setupScript = [
      `adduser -D ${username}`,
      ...(password ? [`echo "${username}:${password}" | chpasswd`] : []),
      ...(config.autoLogin ? [`echo "su - ${username}" >> /root/.profile`] : []),
    ].join('\n');

    this.sendInput(setupScript + '\n');
  }

  // ─── Internal Cleanup ───────────────────────────────────────────────

  private cleanup(): void {
    this.emulator = null;

    if (this.screenElement && this.screenElement.parentNode) {
      this.screenElement.parentNode.removeChild(this.screenElement);
      this.screenElement = null;
    }

    this.outputCallbacks = [];
    this.screenCallbacks = [];
    this.commandResolve  = null;
    this.commandBuffer   = '';
    this.commandMarker   = '';
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const v86Service = new V86Service();

export default v86Service;
