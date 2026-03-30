/**
 * v86Service — Manages the v86 x86 emulator for running Alpine Linux
 * inside the browser. This is INFRASTRUCTURE ONLY; actual disk images
 * will be loaded lazily in a future update.
 */

// ─── Type Definitions ─────────────────────────────────────────────────────────

interface V86Config {
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

interface V86Emulator {
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

type V86Status = 'stopped' | 'booting' | 'running' | 'paused' | 'error';

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

const DB_NAME = 'nexus_v86';
const DB_VERSION = 1;
const STORE_NAME = 'vm_state';
const VM_STATE_KEY = 'vm_state';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIDB(data: ArrayBuffer): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(data, VM_STATE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function loadFromIDB(): Promise<ArrayBuffer | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(VM_STATE_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function clearIDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(VM_STATE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── v86 CDN Loader ───────────────────────────────────────────────────────────

const V86_CDN_BASE = 'https://cdn.jsdelivr.net/npm/v86@latest/build/';
const V86_WASM_URL = `${V86_CDN_BASE}v86.wasm`;

/**
 * Dynamically injects the v86 libv86.js script tag.
 * Returns the V86 constructor from the global scope.
 */
async function loadV86Library(): Promise<new (config: V86Config) => V86Emulator> {
  // Check if already loaded
  if ((window as any).V86) {
    return (window as any).V86;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${V86_CDN_BASE}libv86.js`;
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
  private _status: V86Status = 'stopped';
  private outputCallbacks: Array<(text: string) => void> = [];
  private screenCallbacks: Array<() => void> = [];
  private serial0Element: HTMLElement | null = null;
  private screenElement: HTMLElement | null = null;

  // ─── Public getters ────────────────────────────────────────────────

  get status(): V86Status {
    return this._status;
  }

  get isRunning(): boolean {
    return this._status === 'running';
  }

  // ─── Boot ───────────────────────────────────────────────────────────

  async boot(config?: Partial<V86Config>): Promise<void> {
    if (this.emulator) {
      throw new Error('v86 emulator is already running. Call stop() first.');
    }

    this._status = 'booting';

    try {
      const V86Constructor = await loadV86Library();

      // Create the serial0 and screen container elements
      this.serial0Element = document.createElement('div');
      this.serial0Element.id = 'v86-serial0';
      this.serial0Element.style.display = 'none';
      document.body.appendChild(this.serial0Element);

      this.screenElement = document.createElement('div');
      this.screenElement.id = 'v86-screen';
      this.screenElement.style.display = 'none';
      document.body.appendChild(this.screenElement);

      const defaultConfig: Record<string, any> = {
        wasmPath: V86_WASM_URL,
        memorySize: 128 * 1024 * 1024, // 128 MB
        autostart: true,
        // Screen adapter for GUI mode
        screen_adapter: this.screenElement,
        // ... additional config can be overridden by caller
      };

      // Allow caller to override config (e.g. provide disk image later)
      const finalConfig: Record<string, any> = {
        ...defaultConfig,
        ...config,
        wasm_path: config?.wasmPath || V86_WASM_URL,
        memory_size: config?.memorySize || 128 * 1024 * 1024,
        autostart: config?.autostart !== undefined ? config.autostart : true,
        screen_adapter: this.screenElement,
        serial_container_xtermjs: this.serial0Element,
      };

      // If BIOS/VGA BIOS URLs not provided, use CDN defaults
      if (!finalConfig.bios_url) {
        finalConfig.bios_url = `${V86_CDN_BASE}bios/seabios.bin`;
      }
      if (!finalConfig.vga_bios_url) {
        finalConfig.vga_bios_url = `${V86_CDN_BASE}bios/vgabios.bin`;
      }

      this.emulator = new V86Constructor(finalConfig as any);

      // Listen for serial output
      this.emulator.add_listener('serial0-output-byte', (byte: number) => {
        const char = String.fromCharCode(byte);
        this.outputCallbacks.forEach(cb => cb(char));
      });

      // Listen for emulator status changes
      this.emulator.add_listener('emulator-ready', () => {
        this._status = 'running';
      });

      this.emulator.add_listener('emulator-stopped', () => {
        this._status = 'stopped';
      });

      // Note: If no hard disk image is provided, the emulator will still boot
      // but won't have a filesystem. The disk image will be loaded lazily.
      this._status = 'booting';

    } catch (err: any) {
      this._status = 'error';
      this.cleanup();
      throw err;
    }
  }

  // ─── Stop ───────────────────────────────────────────────────────────

  async stop(): Promise<void> {
    if (!this.emulator) return;

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

  // ─── Event Listeners ────────────────────────────────────────────────

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
      await saveToIDB(state);
      console.log('[v86] VM state saved to IndexedDB');
    } catch (err) {
      console.error('[v86] Failed to save VM state:', err);
      throw err;
    }
  }

  async restoreState(): Promise<boolean> {
    try {
      const state = await loadFromIDB();
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
      return true;
    } catch (err) {
      console.error('[v86] Failed to restore VM state:', err);
      return false;
    }
  }

  async clearState(): Promise<void> {
    try {
      await clearIDB();
      console.log('[v86] VM state cleared from IndexedDB');
    } catch (err) {
      console.error('[v86] Failed to clear VM state:', err);
    }
  }

  // ─── Element Accessors ──────────────────────────────────────────────

  getSerialElement(): HTMLElement | null {
    return this.serial0Element;
  }

  getScreenElement(): HTMLElement | null {
    return this.screenElement;
  }

  // ─── User Setup ─────────────────────────────────────────────────────

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
      // Stay as root, no setup needed
      return;
    }

    const username = config.username || 'nexus';
    const password = config.password || 'nexus';

    // Send setup commands via serial (shell scripting)
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

    if (this.serial0Element && this.serial0Element.parentNode) {
      this.serial0Element.parentNode.removeChild(this.serial0Element);
      this.serial0Element = null;
    }

    if (this.screenElement && this.screenElement.parentNode) {
      this.screenElement.parentNode.removeChild(this.screenElement);
      this.screenElement = null;
    }

    this.outputCallbacks = [];
    this.screenCallbacks = [];
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const v86Service = new V86Service();

export type { V86Config, V86Emulator, V86Status };
export default v86Service;
