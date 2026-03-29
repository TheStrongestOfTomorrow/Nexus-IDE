/**
 * Session Persistence Service for Nexus IDE
 * Saves and restores the FULL IDE session to IndexedDB:
 * - Editor state (open tabs, active file, cursor positions, scroll positions)
 * - Panel layout (terminal, AI, preview, sidebar visibility)
 * - UI mode and settings
 * - AI provider/model selections
 * - Terminal command history
 * - Workspace association
 */

export interface EditorSessionState {
  activeFileId: string | null;
  openFileIds: string[];
  activeActivity: string;
  showSidebar: boolean;
  showAI: boolean;
  showTerminal: boolean;
  showPreview: boolean;
  showSettings: boolean;
  showVibeGraph: boolean;
  showMinecraftScripts: boolean;
  isZenMode: boolean;
  uiMode: string;
  selectedAIProvider: string;
  selectedModels: Record<string, string>;
  timestamp: number;
  version: string;
  sessionId: string | null;
}

const DB_NAME = 'NexusSessions';
const STORE_NAME = 'sessions';
const HISTORY_STORE = 'terminal_history';
const DB_VERSION = 1;

class SessionPersistenceService {
  private db: IDBDatabase | null = null;

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
    });
  }

  /**
   * Save the full IDE session state
   */
  async saveSession(state: EditorSessionState): Promise<void> {
    const db = await this.openDB();
    const session = {
      ...state,
      id: 'current',
      timestamp: Date.now(),
      version: '5.1.5',
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(session);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Restore the saved session state
   */
  async restoreSession(): Promise<EditorSessionState | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('current');

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Check if a saved session exists
   */
  async hasSavedSession(): Promise<boolean> {
    try {
      const session = await this.restoreSession();
      return session !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get the timestamp of the last saved session
   */
  async getLastSaveTime(): Promise<number | null> {
    const session = await this.restoreSession();
    return session?.timestamp || null;
  }

  /**
   * Clear the saved session
   */
  async clearSession(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete('current');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Terminal history — save a command
   */
  async saveTerminalCommand(command: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(HISTORY_STORE, 'readwrite');
      const store = tx.objectStore(HISTORY_STORE);

      const entry = {
        id: `cmd-${Date.now()}`,
        command,
        timestamp: Date.now(),
      };

      store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Terminal history — get recent commands
   */
  async getTerminalHistory(limit: number = 100): Promise<string[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(HISTORY_STORE, 'readonly');
        const store = tx.objectStore(HISTORY_STORE);
        const req = store.getAll();

        req.onsuccess = () => {
          const entries = (req.result || [])
            .sort((a: any, b: any) => b.timestamp - a.timestamp)
            .slice(0, limit)
            .map((e: any) => e.command);
          resolve(entries);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  /**
   * Terminal history — clear
   */
  async clearTerminalHistory(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(HISTORY_STORE, 'readwrite');
      const store = tx.objectStore(HISTORY_STORE);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export default new SessionPersistenceService();
