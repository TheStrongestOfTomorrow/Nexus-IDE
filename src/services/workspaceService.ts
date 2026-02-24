import { openDB, IDBPDatabase } from 'idb';
import { FileNode } from '../hooks/useFileSystem';

const DB_NAME = 'nexus_workspace_db';
const STORE_NAME = 'workspaces';

export interface Workspace {
  id: string;
  name: string;
  files: FileNode[];
  lastModified: number;
}

class WorkspaceService {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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
  }
}

export const workspaceService = new WorkspaceService();
