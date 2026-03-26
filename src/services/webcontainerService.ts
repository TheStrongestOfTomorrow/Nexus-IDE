/**
 * WebContainer Service for Nexus IDE
 * Provides a browser-based Node.js runtime using StackBlitz WebContainer API
 * Allows running Node.js applications entirely in the browser
 */

import { WebContainer } from '@webcontainer/api';
import { FileNode } from '../hooks/useFileSystem';

export interface WebContainerState {
  isBooted: boolean;
  isReady: boolean;
  error: string | null;
  url: string | null;
  port: number | null;
  output: string[];
}

export type WebContainerOutputListener = (output: string) => void;
export type WebContainerUrlListener = (url: string, port: number) => void;

class WebContainerService {
  private instance: WebContainer | null = null;
  private state: WebContainerState = {
    isBooted: false,
    isReady: false,
    error: null,
    url: null,
    port: null,
    output: [],
  };
  private outputListeners: Set<WebContainerOutputListener> = new Set();
  private urlListeners: Set<WebContainerUrlListener> = new Set();

  /**
   * Check if WebContainer is supported in the current browser
   */
  isSupported(): boolean {
    // WebContainer requires SharedArrayBuffer which requires cross-origin isolation
    return typeof SharedArrayBuffer !== 'undefined';
  }

  /**
   * Get the current state of the WebContainer
   */
  getState(): WebContainerState {
    return { ...this.state };
  }

  /**
   * Subscribe to output events
   */
  onOutput(listener: WebContainerOutputListener): () => void {
    this.outputListeners.add(listener);
    return () => this.outputListeners.delete(listener);
  }

  /**
   * Subscribe to URL ready events (when dev server starts)
   */
  onUrlReady(listener: WebContainerUrlListener): () => void {
    this.urlListeners.add(listener);
    return () => this.urlListeners.delete(listener);
  }

  /**
   * Emit output to all listeners
   */
  private emitOutput(output: string): void {
    this.state.output.push(output);
    this.outputListeners.forEach(listener => listener(output));
  }

  /**
   * Boot the WebContainer
   */
  async boot(): Promise<void> {
    if (this.instance) {
      return;
    }

    if (!this.isSupported()) {
      this.state.error = 'WebContainer is not supported in this browser. Cross-origin isolation is required.';
      throw new Error(this.state.error);
    }

    try {
      this.emitOutput('[WebContainer] Booting...\n');
      this.instance = await WebContainer.boot();
      this.state.isBooted = true;
      this.emitOutput('[WebContainer] Booted successfully!\n');

      // Set up server-ready listener
      this.instance.on('server-ready', (port, url) => {
        this.state.url = url;
        this.state.port = port;
        this.state.isReady = true;
        this.emitOutput(`[WebContainer] Server ready at ${url} (port ${port})\n`);
        this.urlListeners.forEach(listener => listener(url, port));
      });

      // Set up error listener
      this.instance.on('error', (error) => {
        this.state.error = error.message;
        this.emitOutput(`[WebContainer Error] ${error.message}\n`);
      });

    } catch (error: any) {
      this.state.error = error.message;
      this.emitOutput(`[WebContainer Error] Failed to boot: ${error.message}\n`);
      throw error;
    }
  }

  /**
   * Convert Nexus files to WebContainer FileSystemTree format
   */
  private convertToFileSystemTree(files: FileNode[]): Record<string, any> {
    const tree: Record<string, any> = {};

    for (const file of files) {
      const pathParts = file.name.split('/');
      let current = tree;

      // Navigate/create nested directories
      for (let i = 0; i < pathParts.length - 1; i++) {
        const dir = pathParts[i];
        if (!current[dir]) {
          current[dir] = { directory: {} };
        }
        current = current[dir].directory;
      }

      // Add the file
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
   * Mount files into the WebContainer
   */
  async mountFiles(files: FileNode[]): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer not booted');
    }

    const tree = this.convertToFileSystemTree(files);
    await this.instance.mount(tree);
    this.emitOutput(`[WebContainer] Mounted ${files.length} files\n`);
  }

  /**
   * Write a single file to the WebContainer
   */
  async writeFile(path: string, content: string): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer not booted');
    }

    await this.instance.fs.writeFile(path, content);
  }

  /**
   * Read a file from the WebContainer
   */
  async readFile(path: string): Promise<string> {
    if (!this.instance) {
      throw new Error('WebContainer not booted');
    }

    const content = await this.instance.fs.readFile(path, 'utf-8');
    return content;
  }

  /**
   * Spawn a process in the WebContainer
   */
  async spawn(command: string, args: string[] = []): Promise<number> {
    if (!this.instance) {
      throw new Error('WebContainer not booted');
    }

    this.emitOutput(`[WebContainer] Running: ${command} ${args.join(' ')}\n`);

    const process = await this.instance.spawn(command, args);

    process.output.pipeTo(
      new WritableStream({
        write: (data) => {
          this.emitOutput(data);
        },
      })
    );

    return process.exit;
  }

  /**
   * Install npm dependencies
   */
  async installDependencies(): Promise<number> {
    this.emitOutput('[WebContainer] Installing dependencies...\n');
    const exitCode = await this.spawn('npm', ['install']);
    
    if (exitCode === 0) {
      this.emitOutput('[WebContainer] Dependencies installed successfully!\n');
    } else {
      this.emitOutput(`[WebContainer] Installation failed with exit code ${exitCode}\n`);
    }
    
    return exitCode;
  }

  /**
   * Start a development server
   */
  async startDevServer(): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer not booted');
    }

    this.emitOutput('[WebContainer] Starting development server...\n');
    
    // Try common dev server commands
    await this.spawn('npm', ['run', 'dev']);
  }

  /**
   * Run npm scripts
   */
  async runScript(script: string): Promise<number> {
    return this.spawn('npm', ['run', script]);
  }

  /**
   * Execute a Node.js script
   */
  async runNode(script: string): Promise<number> {
    return this.spawn('node', [script]);
  }

  /**
   * Create a package.json if it doesn't exist
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

  /**
   * Get directory listing
   */
  async readDir(path: string): Promise<string[]> {
    if (!this.instance) {
      throw new Error('WebContainer not booted');
    }

    const entries = await this.instance.fs.readdir(path, { withFileTypes: true });
    return entries.map(e => `${e.isDirectory() ? '📁 ' : '📄 '}${e.name}`);
  }

  /**
   * Tear down the WebContainer
   */
  async teardown(): Promise<void> {
    if (this.instance) {
      // WebContainer doesn't have a public teardown method
      // It will be garbage collected when the page is closed
      this.instance = null;
      this.state = {
        isBooted: false,
        isReady: false,
        error: null,
        url: null,
        port: null,
        output: [],
      };
      this.emitOutput('[WebContainer] Teardown complete\n');
    }
  }

  /**
   * Clear output history
   */
  clearOutput(): void {
    this.state.output = [];
  }

  /**
   * Get the raw WebContainer instance (for advanced usage)
   */
  getInstance(): WebContainer | null {
    return this.instance;
  }
}

// Export singleton instance
export const webcontainerService = new WebContainerService();
export default webcontainerService;
