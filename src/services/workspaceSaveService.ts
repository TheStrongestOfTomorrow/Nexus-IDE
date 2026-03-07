// Workspace Save Service - Save/load entire workspace

export interface NexusWorkspace {
  version: string;
  timestamp: number;
  name: string;
  files: Array<{ name: string; content: string }>;
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
  };
}

export interface ExportFormat {
  nexus: NexusWorkspace; // For .nexus format (workspace-only)
  zip: { files: Array<{ name: string; content: string }> }; // For zip
}

class WorkspaceSaveService {
  private DB_NAME = 'NexusWorkspaces';
  private STORE_NAME = 'workspaces';

  /**
   * Save workspace to IndexedDB
   */
  async saveWorkspaceToIDB(workspace: NexusWorkspace): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);

        const id = `${workspace.metadata.projectName}-${Date.now()}`;
        store.put({ ...workspace, id });

        transaction.oncomplete = () => {
          db.close();
          resolve(id);
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  /**
   * Load workspace from IndexedDB
   */
  async loadWorkspaceFromIDB(id: string): Promise<NexusWorkspace | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          resolve(getRequest.result || null);
          db.close();
        };
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  }

  /**
   * List all saved workspaces
   */
  async listWorkspaces(): Promise<NexusWorkspace[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const allRequest = store.getAll();

        allRequest.onsuccess = () => {
          resolve(allRequest.result);
          db.close();
        };
        allRequest.onerror = () => reject(allRequest.error);
      };
    });
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
      files: workspace.files, // Only workspace files
      settings: {
        theme: workspace.settings.theme,
        fontSize: workspace.settings.fontSize,
        // EXCLUDE: API keys and personal settings
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
      
      // Validate structure
      if (!workspace.files || !workspace.metadata) {
        throw new Error('Invalid .nexus file format');
      }

      // Safety: Reset timestamp to current
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
        percentage: Math.round((used / quota) * 100),
        estimateAvailable: quota - used,
      };
    }
    return { used: 0, quota: 0, percentage: 0, estimateAvailable: 0 };
  }

  /**
   * Clear all workspaces (destructive!)
   */
  async clearAllWorkspaces(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        store.clear();

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  /**
   * Quick snapshot (for auto-save)
   */
  createSnapshot(files: any[], metadata: any): NexusWorkspace {
    return {
      version: '4.2.0',
      timestamp: Date.now(),
      name: metadata.projectName || 'Untitled Project',
      files,
      settings: {
        theme: 'dark',
        fontSize: '13px',
      },
      metadata: {
        projectName: metadata.projectName || 'Untitled',
        createdAt: metadata.createdAt || Date.now(),
        updatedAt: Date.now(),
        tags: metadata.tags || [],
      },
    };
  }
}

export default new WorkspaceSaveService();
