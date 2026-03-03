import { openDB, IDBPDatabase } from 'idb';
import { FileNode } from '../hooks/useFileSystem';

const DB_NAME = 'nexus_workspace_db';
const STORE_NAME = 'workspaces';
const MEMORY_STORE = 'project_memory';

export interface Workspace {
  id: string;
  name: string;
  files: FileNode[];
  lastModified: number;
}

class WorkspaceService {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (oldVersion < 2) {
          db.createObjectStore(MEMORY_STORE, { keyPath: 'workspaceId' });
        }
      },
    });
  }

  async saveWorkspace(workspace: Workspace) {
    const db = await this.dbPromise;
    await db.put(STORE_NAME, {
      ...workspace,
      lastModified: Date.now(),
    });
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const db = await this.dbPromise;
    return db.get(STORE_NAME, id);
  }

  async getAllWorkspaces(): Promise<Workspace[]> {
    const db = await this.dbPromise;
    return db.getAll(STORE_NAME);
  }

  async deleteWorkspace(id: string) {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, id);
    await db.delete(MEMORY_STORE, id);
  }

  async saveMemory(workspaceId: string, memory: Record<string, string>) {
    const db = await this.dbPromise;
    await db.put(MEMORY_STORE, { workspaceId, memory, lastUpdated: Date.now() });
  }

  async getMemory(workspaceId: string): Promise<Record<string, string> | undefined> {
    const db = await this.dbPromise;
    const entry = await db.get(MEMORY_STORE, workspaceId);
    return entry?.memory;
  }
}

export const workspaceService = new WorkspaceService();
