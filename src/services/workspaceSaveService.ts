// Workspace Save Service - Save/load entire workspace with IndexedDB persistence

export interface NexusWorkspace {
  id?: string;
  version: string;
  timestamp: number;
  name: string;
  files: Array<{ name: string; content: string; language?: string }>;
  settings: {
    theme: string;
    fontSize: string;
    selectedAIProvider?: string;
    selectedModels?: Record<string, string>;
  };
  metadata: {
    projectName: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
    tags?: string[];
    fileCount: number;
  };
}

export interface ExportFormat {
  nexus: NexusWorkspace;
  zip: { files: Array<{ name: string; content: string }> };
}

class WorkspaceSaveService {
  private DB_NAME = 'NexusWorkspaces';
  private STORE_NAME = 'workspaces';
  private DB_VERSION = 2;

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Save workspace to IndexedDB
   */
  async saveWorkspaceToIDB(workspace: NexusWorkspace): Promise<string> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const id = workspace.id || `workspace-${Date.now()}`;
      store.put({ ...workspace, id, timestamp: Date.now(), metadata: { ...workspace.metadata, updatedAt: Date.now() } });

      transaction.oncomplete = () => {
        db.close();
        resolve(id);
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  }

  /**
   * Update an existing workspace's files (for auto-save)
   */
  async updateWorkspaceFiles(id: string, files: Array<{ name: string; content: string; language?: string }>): Promise<void> {
    const workspace = await this.loadWorkspaceFromIDB(id);
    if (!workspace) throw new Error('Workspace not found');

    workspace.files = files;
    workspace.metadata.fileCount = files.length;
    workspace.timestamp = Date.now();
    workspace.metadata.updatedAt = Date.now();

    await this.saveWorkspaceToIDB(workspace);
  }

  /**
   * Load workspace from IndexedDB
   */
  async loadWorkspaceFromIDB(id: string): Promise<NexusWorkspace | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
        db.close();
      };
      getRequest.onerror = () => {
        db.close();
        reject(getRequest.error);
      };
    });
  }

  /**
   * Delete a specific workspace
   */
  async deleteWorkspace(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.delete(id);

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  }

  /**
   * Rename a workspace
   */
  async renameWorkspace(id: string, newName: string): Promise<void> {
    const workspace = await this.loadWorkspaceFromIDB(id);
    if (!workspace) throw new Error('Workspace not found');

    workspace.name = newName;
    workspace.metadata.projectName = newName;
    workspace.timestamp = Date.now();
    workspace.metadata.updatedAt = Date.now();

    await this.saveWorkspaceToIDB(workspace);
  }

  /**
   * List all saved workspaces (sorted by most recent first)
   */
  async listWorkspaces(): Promise<NexusWorkspace[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const allRequest = store.getAll();

      allRequest.onsuccess = () => {
        const workspaces = (allRequest.result || []).sort((a: NexusWorkspace, b: NexusWorkspace) => b.timestamp - a.timestamp);
        resolve(workspaces);
        db.close();
      };
      allRequest.onerror = () => {
        db.close();
        reject(allRequest.error);
      };
    });
  }

  /**
   * Get the most recently saved workspace
   */
  async getLatestWorkspace(): Promise<NexusWorkspace | null> {
    const workspaces = await this.listWorkspaces();
    return workspaces.length > 0 ? workspaces[0] : null;
  }

  /**
   * Generate .nexus file (workspace export)
   * IMPORTANT: Does NOT include API keys or personal data
   */
  generateNexusFile(workspace: NexusWorkspace): string {
    const exportData: NexusWorkspace = {
      version: workspace.version,
      timestamp: workspace.timestamp,
      name: workspace.name,
      files: workspace.files,
      settings: {
        theme: workspace.settings.theme,
        fontSize: workspace.settings.fontSize,
      },
      metadata: workspace.metadata,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import .nexus file
   */
  async importNexusFile(fileContent: string): Promise<NexusWorkspace> {
    try {
      const workspace = JSON.parse(fileContent) as NexusWorkspace;

      if (!workspace.files || !workspace.metadata) {
        throw new Error('Invalid .nexus file format');
      }

      workspace.timestamp = Date.now();
      workspace.metadata.updatedAt = Date.now();

      return workspace;
    } catch (error) {
      throw new Error(`Failed to import .nexus file: ${error}`);
    }
  }

  /**
   * Get storage stats
   */
  async getStorageStats(): Promise<{
    used: number;
    quota: number;
    percentage: number;
    estimateAvailable: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      return {
        used,
        quota,
        percentage: quota > 0 ? Math.round((used / quota) * 100) : 0,
        estimateAvailable: quota - used,
      };
    }
    return { used: 0, quota: 0, percentage: 0, estimateAvailable: 0 };
  }

  /**
   * Clear all workspaces (destructive!)
   */
  async clearAllWorkspaces(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.clear();

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  }

  /**
   * Create a new workspace snapshot
   */
  createSnapshot(files: Array<{ name: string; content: string; language?: string }>, metadata: Partial<{
    projectName: string;
    description?: string;
    createdAt: number;
    tags?: string[];
  }> = {}): NexusWorkspace {
    const now = Date.now();
    return {
      version: '5.1.0',
      timestamp: now,
      name: metadata.projectName || 'Untitled Project',
      files,
      settings: {
        theme: 'dark',
        fontSize: '13px',
      },
      metadata: {
        projectName: metadata.projectName || 'Untitled',
        createdAt: metadata.createdAt || now,
        updatedAt: now,
        fileCount: files.length,
        tags: metadata.tags || [],
        ...(metadata.description && { description: metadata.description }),
      },
    };
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  }

  /**
   * Format bytes for display
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

export default new WorkspaceSaveService();
