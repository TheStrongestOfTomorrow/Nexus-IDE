/**
 * WebContainer Service for Nexus IDE v5.5.5
 * Provides a browser-based Node.js runtime using StackBlitz WebContainer API.
 * Modernized with output buffer cap, stdin support, process kill, status tracking,
 * command execution, and improved error handling.
 */

import { WebContainer, WebContainerProcess } from '@webcontainer/api';
import { FileNode } from '../hooks/useFileSystem';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type WebContainerStatus = 'idle' | 'starting' | 'running' | 'error';

export interface WebContainerState {
  status: WebContainerStatus;
  isBooted: boolean;
  isReady: boolean;
  error: string | null;
  url: string | null;
  port: number | null;
  output: string[];
  nodeVersion: string | null;
}

export type WebContainerOutputListener = (output: string) => void;
export type WebContainerUrlListener = (url: string, port: number) => void;
export type WebContainerStatusListener = (status: WebContainerStatus, prevStatus: WebContainerStatus) => void;

// ─── Constants ──────────────────────────────────────────────────────────────────

const OUTPUT_BUFFER_CAP = 50000; // Max characters to buffer
const OUTPUT_LINES_CAP = 500;    // Max line entries to keep in array

// ─── Service ────────────────────────────────────────────────────────────────────

class WebContainerService {
  private instance: WebContainer | null = null;
  private currentProcess: WebContainerProcess | null = null;
  private _status: WebContainerStatus = 'idle';
  private state: WebContainerState = {
    status: 'idle',
    isBooted: false,
    isReady: false,
    error: null,
    url: null,
    port: null,
    output: [],
    nodeVersion: null,
  };

  private outputListeners: Set<WebContainerOutputListener> = new Set();
  private urlListeners: Set<WebContainerUrlListener> = new Set();
  private statusListeners: Set<WebContainerStatusListener> = new Set();

  // ── Status Tracking ──────────────────────────────────────────────────────────

  /** Get current status */
  get status(): WebContainerStatus {
    return this._status;
  }

  /** Set status with notification to listeners */
  private setStatus(newStatus: WebContainerStatus): void {
    const prev = this._status;
    if (prev === newStatus) return;
    this._status = newStatus;
    this.state.status = newStatus;
    this.statusListeners.forEach(listener => listener(newStatus, prev));
  }

  /** Subscribe to status changes */
  onStatusChange(listener: WebContainerStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  // ── Feature Detection ────────────────────────────────────────────────────────

  /**
   * Check if WebContainer is supported in the current browser.
   * Requires SharedArrayBuffer (cross-origin isolation via COOP/COEP headers).
   */
  isSupported(): boolean {
    return typeof SharedArrayBuffer !== 'undefined';
  }

  // ── State Access ─────────────────────────────────────────────────────────────

  /** Get a snapshot of the current state */
  getState(): WebContainerState {
    return { ...this.state };
  }

  // ── Subscriptions ────────────────────────────────────────────────────────────

  /** Subscribe to output events */
  onOutput(listener: WebContainerOutputListener): () => void {
    this.outputListeners.add(listener);
    return () => this.outputListeners.delete(listener);
  }

  /** Subscribe to URL ready events (when dev server starts) */
  onUrlReady(listener: WebContainerUrlListener): () => void {
    this.urlListeners.add(listener);
    return () => this.urlListeners.delete(listener);
  }

  // ── Output Management ────────────────────────────────────────────────────────

  /**
   * Emit output to all listeners with buffer cap enforcement.
   * Limits total buffered output to OUTPUT_BUFFER_CAP characters.
   */
  private emitOutput(output: string): void {
    this.state.output.push(output);

    // Enforce line cap (keep last N lines)
    if (this.state.output.length > OUTPUT_LINES_CAP) {
      this.state.output = this.state.output.slice(-OUTPUT_LINES_CAP);
    }

    // Enforce character cap (trim from beginning if exceeded)
    const totalChars = this.state.output.reduce((sum, line) => sum + line.length, 0);
    if (totalChars > OUTPUT_BUFFER_CAP) {
      let removed = 0;
      while (removed < totalChars - OUTPUT_BUFFER_CAP && this.state.output.length > 1) {
        removed += this.state.output[0].length;
        this.state.output.shift();
      }
    }

    this.outputListeners.forEach(listener => listener(output));
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────

  /**
   * Boot the WebContainer instance.
   * Handles errors gracefully with descriptive messages.
   */
  async boot(): Promise<void> {
    if (this.instance) {
      return;
    }

    if (!this.isSupported()) {
      const msg = 'WebContainer is not supported in this browser. Cross-origin isolation (COOP/COEP headers) is required for SharedArrayBuffer.';
      this.state.error = msg;
      this.setStatus('error');
      this.emitOutput(`\x1b[31m[WebContainer Error] ${msg}\x1b[0m\n`);
      throw new Error(msg);
    }

    try {
      this.setStatus('starting');
      this.emitOutput('[WebContainer] Booting...\n');

      this.instance = await WebContainer.boot();
      this.state.isBooted = true;
      this.setStatus('running');
      this.emitOutput('[WebContainer] Booted successfully!\n');

      // Get Node.js version
      try {
        const nodeProcess = await this.instance.spawn('node', ['--version']);
        let versionOutput = '';
        const reader = nodeProcess.output.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            versionOutput += value;
          }
        } finally {
          reader.releaseLock();
        }
        const version = versionOutput.trim();
        this.state.nodeVersion = version;
        this.emitOutput(`[WebContainer] Node.js ${version}\n`);
      } catch {
        this.emitOutput('[WebContainer] Node.js (version detection unavailable)\n');
      }

      // Set up server-ready listener
      this.instance.on('server-ready', (port, url) => {
        try {
          this.state.url = url;
          this.state.port = port;
          this.state.isReady = true;
          this.emitOutput(`\x1b[32m[WebContainer] Server ready at ${url} (port ${port})\x1b[0m\n`);
          this.urlListeners.forEach(listener => listener(url, port));
        } catch (err: any) {
          this.emitOutput(`\x1b[31m[WebContainer] Error handling server-ready: ${err.message}\x1b[0m\n`);
        }
      });

      // Set up error listener
      this.instance.on('error', (error) => {
        this.state.error = error.message;
        this.emitOutput(`\x1b[31m[WebContainer Error] ${error.message}\x1b[0m\n`);
      });

    } catch (error: any) {
      const msg = error?.message || 'Unknown error during boot';
      this.state.error = msg;
      this.setStatus('error');
      this.emitOutput(`\x1b[31m[WebContainer Error] Failed to boot: ${msg}\x1b[0m\n`);
      throw error;
    }
  }

  // ── File System Operations ───────────────────────────────────────────────────

  /**
   * Convert Nexus files to WebContainer FileSystemTree format.
   */
  private convertToFileSystemTree(files: FileNode[]): Record<string, any> {
    const tree: Record<string, any> = {};

    for (const file of files) {
      const pathParts = file.name.split('/');
      let current = tree;

      for (let i = 0; i < pathParts.length - 1; i++) {
        const dir = pathParts[i];
        if (!current[dir]) {
          current[dir] = { directory: {} };
        }
        current = current[dir].directory;
      }

      const fileName = pathParts[pathParts.length - 1];
      current[fileName] = {
        file: {
          contents: file.content,
        },
      };
    }

    return tree;
  }

  /**
   * Mount files into the WebContainer.
   */
  async mountFiles(files: FileNode[]): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer is not booted. Call boot() first.');
    }

    try {
      const tree = this.convertToFileSystemTree(files);
      await this.instance.mount(tree);
      this.emitOutput(`[WebContainer] Mounted ${files.length} file(s)\n`);
    } catch (error: any) {
      const msg = error?.message || 'Unknown error mounting files';
      this.emitOutput(`\x1b[31m[WebContainer Error] Failed to mount files: ${msg}\x1b[0m\n`);
      throw new Error(`Failed to mount files: ${msg}`);
    }
  }

  /**
   * Write a single file to the WebContainer.
   */
  async writeFile(path: string, content: string): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer is not booted. Call boot() first.');
    }

    try {
      await this.instance.fs.writeFile(path, content);
    } catch (error: any) {
      const msg = error?.message || 'Unknown error writing file';
      throw new Error(`Failed to write file '${path}': ${msg}`);
    }
  }

  /**
   * Read a file from the WebContainer.
   */
  async readFile(path: string): Promise<string> {
    if (!this.instance) {
      throw new Error('WebContainer is not booted. Call boot() first.');
    }

    try {
      const content = await this.instance.fs.readFile(path, 'utf-8');
      return content;
    } catch (error: any) {
      const msg = error?.message || 'Unknown error reading file';
      throw new Error(`Failed to read file '${path}': ${msg}`);
    }
  }

  // ── Process Management ───────────────────────────────────────────────────────

  /**
   * Ensure the WebContainer is booted and ready.
   */
  async ensureReady(): Promise<void> {
    if (!this.instance) {
      await this.boot();
    }
  }

  /**
   * Spawn a process in the WebContainer (non-interactive).
   * Output is piped to listeners automatically.
   */
  async spawn(command: string, args: string[] = []): Promise<number> {
    if (!this.instance) {
      throw new Error('WebContainer is not booted. Call boot() first.');
    }

    this.emitOutput(`\x1b[90m$ ${command} ${args.join(' ')}\x1b[0m\n`);

    try {
      const process = await this.instance.spawn(command, args);
      this.currentProcess = process;

      process.output.pipeTo(
        new WritableStream({
          write: (data) => {
            this.emitOutput(data);
          },
        })
      );

      const exitCode = await process.exit;
      this.currentProcess = null;
      return exitCode;
    } catch (error: any) {
      this.currentProcess = null;
      const msg = error?.message || 'Unknown error spawning process';
      this.emitOutput(`\x1b[31m[Error] Failed to run '${command}': ${msg}\x1b[0m\n`);
      throw new Error(`Failed to spawn '${command}': ${msg}`);
    }
  }

  /**
   * Spawn a process and return it for interactive use.
   * The caller is responsible for piping stdin and handling stdout/stderr.
   */
  async spawnInteractive(command: string, args: string[] = []): Promise<{
    process: WebContainerProcess;
    exitCode: Promise<number>;
  }> {
    if (!this.instance) {
      throw new Error('WebContainer is not booted. Call boot() first.');
    }

    this.emitOutput(`\x1b[90m$ ${command} ${args.join(' ')}\x1b[0m\n`);

    try {
      const process = await this.instance.spawn(command, args);
      this.currentProcess = process;
      const exitCode = process.exit;

      // Clean up current process reference on exit
      exitCode.then(() => {
        if (this.currentProcess === process) {
          this.currentProcess = null;
        }
      }).catch(() => {
        if (this.currentProcess === process) {
          this.currentProcess = null;
        }
      });

      return { process, exitCode };
    } catch (error: any) {
      const msg = error?.message || 'Unknown error spawning interactive process';
      this.emitOutput(`\x1b[31m[Error] Failed to run '${command}': ${msg}\x1b[0m\n`);
      throw new Error(`Failed to spawn interactive '${command}': ${msg}`);
    }
  }

  /**
   * Write data to the current process's stdin.
   * Used for interactive shell input.
   */
  writeStdin(data: string): void {
    if (!this.currentProcess) {
      return;
    }

    try {
      const writer = this.currentProcess.input.getWriter();
      writer.write(data).catch(() => {
        // Process may have already exited — silently ignore
      }).finally(() => {
        writer.releaseLock();
      });
    } catch {
      // Process may have already exited — silently ignore
    }
  }

  /**
   * Kill the current running process gracefully.
   */
  killProcess(): void {
    if (!this.currentProcess) {
      return;
    }

    try {
      this.currentProcess.kill();
      this.emitOutput('\x1b[33m[WebContainer] Process killed\x1b[0m\n');
    } catch (error: any) {
      this.emitOutput(`\x1b[31m[WebContainer Error] Failed to kill process: ${error?.message || 'unknown'}\x1b[0m\n`);
    }

    this.currentProcess = null;
  }

  /**
   * Check if a process is currently running.
   */
  hasRunningProcess(): boolean {
    return this.currentProcess !== null;
  }

  /**
   * Execute a command and collect the full output.
   * Returns the combined stdout/stderr output string.
   */
  async runCommand(command: string): Promise<string> {
    if (!this.instance) {
      throw new Error('WebContainer is not booted. Call boot() first.');
    }

    try {
      const parts = command.trim().split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);

      const proc = await this.instance.spawn(cmd, args);

      // Collect all output
      let output = '';
      const reader = proc.output.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          output += value;
        }
      } finally {
        reader.releaseLock();
      }

      await proc.exit;
      return output;
    } catch (error: any) {
      const msg = error?.message || 'Unknown error';
      throw new Error(`Command '${command}' failed: ${msg}`);
    }
  }

  // ── Interactive Shell ───────────────────────────────────────────────────────

  /**
   * Start an interactive shell session (/bin/bash or /bin/sh).
   * Spawns the shell with output piped to listeners and stdin ready for input.
   * Returns the process and its exit code promise for the caller to monitor.
   */
  async startShell(shellPath?: string): Promise<{
    process: WebContainerProcess;
    exitCode: Promise<number>;
  }> {
    if (!this.instance) {
      throw new Error('WebContainer is not booted. Call boot() first.');
    }

    // Kill any existing process before starting a new shell
    if (this.currentProcess) {
      this.killProcess();
    }

    // Try bash first, fall back to sh
    const shell = shellPath || '/bin/bash';
    this.emitOutput(`\x1b[90m[WebContainer] Starting interactive shell: ${shell}\x1b[0m\n`);

    try {
      const { process, exitCode } = await this.spawnInteractive(shell, []);

      // Pipe stdout to listeners automatically
      process.output.pipeTo(
        new WritableStream({
          write: (data) => {
            this.emitOutput(data);
          },
        })
      );

      // Clean up on exit
      exitCode.then((code) => {
        const msg = code === 0
          ? '\x1b[32m[WebContainer] Shell exited normally (code 0)\x1b[0m\n'
          : `\x1b[33m[WebContainer] Shell exited with code ${code}\x1b[0m\n`;
        this.emitOutput(msg);
      }).catch(() => {
        this.emitOutput('\x1b[33m[WebContainer] Shell exited unexpectedly\x1b[0m\n');
      });

      return { process, exitCode };
    } catch (error: any) {
      // If /bin/bash fails, try /bin/sh as fallback
      if (shell === '/bin/bash') {
        this.emitOutput('\x1b[33m[WebContainer] /bin/bash not available, falling back to /bin/sh\x1b[0m\n');
        return this.startShell('/bin/sh');
      }
      const msg = error?.message || 'Unknown error starting shell';
      this.emitOutput(`\x1b[31m[WebContainer Error] Failed to start shell: ${msg}\x1b[0m\n`);
      throw new Error(`Failed to start shell: ${msg}`);
    }
  }

  /**
   * Get the last N characters of buffered output from the output state.
   * Useful for terminal integrations that need to read recent output.
   */
  getProcessOutput(charCount: number = 5000): string {
    const totalChars = this.state.output.reduce((sum, line) => sum + line.length, 0);
    const slice = Math.min(charCount, totalChars);

    if (slice >= totalChars) {
      return this.state.output.join('');
    }

    // Walk backwards through lines to collect at least `slice` characters
    let collected = '';
    for (let i = this.state.output.length - 1; i >= 0; i--) {
      const line = this.state.output[i];
      if (collected.length + line.length > slice) {
        collected = line.slice(-(slice - collected.length)) + collected;
        break;
      }
      collected = line + collected;
    }
    return collected;
  }

  // ── Package Management ───────────────────────────────────────────────────────

  /**
   * Install npm dependencies.
   */
  async installDependencies(): Promise<number> {
    this.emitOutput('[WebContainer] Installing dependencies...\n');
    try {
      const exitCode = await this.spawn('npm', ['install']);
      if (exitCode === 0) {
        this.emitOutput('\x1b[32m[WebContainer] Dependencies installed successfully!\x1b[0m\n');
      } else {
        this.emitOutput(`\x1b[33m[WebContainer] Installation exited with code ${exitCode}\x1b[0m\n`);
      }
      return exitCode;
    } catch (error: any) {
      this.emitOutput(`\x1b[31m[WebContainer Error] npm install failed: ${error?.message || 'unknown'}\x1b[0m\n`);
      throw error;
    }
  }

  /**
   * Start a development server.
   */
  async startDevServer(): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer is not booted. Call boot() first.');
    }

    this.emitOutput('[WebContainer] Starting development server...\n');
    await this.spawn('npm', ['run', 'dev']);
  }

  /**
   * Run an npm script.
   */
  async runScript(script: string): Promise<number> {
    return this.spawn('npm', ['run', script]);
  }

  /**
   * Execute a Node.js script.
   */
  async runNode(script: string): Promise<number> {
    return this.spawn('node', [script]);
  }

  /**
   * Create a package.json if it doesn't exist in the file list.
   */
  async ensurePackageJson(files: FileNode[]): Promise<FileNode[]> {
    const hasPackageJson = files.some(f => f.name === 'package.json' || f.name.endsWith('/package.json'));

    if (!hasPackageJson) {
      const defaultPackageJson: FileNode = {
        id: 'pkg-json',
        name: 'package.json',
        content: JSON.stringify({
          name: 'nexus-project',
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview'
          },
          dependencies: {}
        }, null, 2),
        language: 'json',
      };
      return [...files, defaultPackageJson];
    }

    return files;
  }

  // ── Directory Operations ─────────────────────────────────────────────────────

  /**
   * Get directory listing.
   */
  async readDir(path: string): Promise<string[]> {
    if (!this.instance) {
      throw new Error('WebContainer is not booted. Call boot() first.');
    }

    try {
      const entries = await this.instance.fs.readdir(path, { withFileTypes: true });
      return entries.map(e => `${e.isDirectory() ? '📁 ' : '📄 '}${e.name}`);
    } catch (error: any) {
      const msg = error?.message || 'Unknown error';
      throw new Error(`Failed to read directory '${path}': ${msg}`);
    }
  }

  // ── Teardown ─────────────────────────────────────────────────────────────────

  /**
   * Tear down the WebContainer instance.
   */
  async teardown(): Promise<void> {
    try {
      if (this.currentProcess) {
        this.killProcess();
      }
    } catch {
      // Best effort kill
    }

    this.instance = null;
    this.currentProcess = null;
    this._status = 'idle';
    this.state = {
      status: 'idle',
      isBooted: false,
      isReady: false,
      error: null,
      url: null,
      port: null,
      output: [],
      nodeVersion: null,
    };
    this.emitOutput('[WebContainer] Teardown complete\n');
  }

  /**
   * Clear output history.
   */
  clearOutput(): void {
    this.state.output = [];
  }

  /**
   * Get the raw WebContainer instance (for advanced usage).
   */
  getInstance(): WebContainer | null {
    return this.instance;
  }
}

// ─── Singleton Export ───────────────────────────────────────────────────────────

export const webcontainerService = new WebContainerService();
export default webcontainerService;
