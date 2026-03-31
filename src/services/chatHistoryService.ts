// AI Chat History Service - Privacy-first chat saving

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  tokens?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  provider: string;
  model: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  totalTokens?: number;
}

class ChatHistoryService {
  private DB_NAME = 'NexusChatHistory';
  private STORE_NAME = 'chats';
  private ENABLED_KEY = 'chat_history_enabled';

  /**
   * Check if chat history is enabled (privacy setting)
   */
  isEnabled(): boolean {
    return localStorage.getItem(this.ENABLED_KEY) === 'true';
  }

  /**
   * Enable/disable chat history
   */
  setEnabled(enabled: boolean): void {
    if (enabled) {
      localStorage.setItem(this.ENABLED_KEY, 'true');
    } else {
      localStorage.removeItem(this.ENABLED_KEY);
      // Clear all history when disabled
      this.clearAllChats().catch((err) => console.error('Failed to clear chat history:', err));
    }
  }

  /**
   * Save chat message
   */
  async saveChatMessage(sessionId: string, message: ChatMessage): Promise<void> {
    if (!this.isEnabled()) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);

        // Get existing session or create new
        const getRequest = store.get(sessionId);

        getRequest.onsuccess = () => {
          const session: ChatSession = getRequest.result || {
            id: sessionId,
            title: 'Chat Session',
            provider: 'unknown',
            model: 'unknown',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          session.messages.push(message);
          session.updatedAt = Date.now();

          store.put(session);
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
        };

        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  /**
   * Load chat session
   */
  async loadChatSession(sessionId: string): Promise<ChatSession | null> {
    if (!this.isEnabled()) return null;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const getRequest = store.get(sessionId);

        getRequest.onsuccess = () => {
          resolve(getRequest.result || null);
          db.close();
        };
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  }

  /**
   * List all chat sessions
   */
  async listChatSessions(): Promise<ChatSession[]> {
    if (!this.isEnabled()) return [];

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const allRequest = store.getAll();

        allRequest.onsuccess = () => {
          resolve(allRequest.result.sort((a, b) => b.updatedAt - a.updatedAt));
          db.close();
        };
        allRequest.onerror = () => reject(allRequest.error);
      };
    });
  }

  /**
   * Delete single chat session
   */
  async deleteChatSession(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        store.delete(sessionId);

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  /**
   * Clear all chats (when disabling feature)
   */
  async clearAllChats(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
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
   * Get storage used by chats
   */
  async getChatStorageSize(): Promise<number> {
    const sessions = await this.listChatSessions();
    let totalSize = 0;

    sessions.forEach(session => {
      session.messages.forEach(msg => {
        totalSize += msg.content.length;
      });
    });

    return totalSize;
  }

  /**
   * Export chat session as JSON
   */
  exportChatSession(session: ChatSession): string {
    return JSON.stringify(session, null, 2);
  }

  /**
   * Create new chat session
   */
  createSession(provider: string, model: string): ChatSession {
    return {
      id: `chat-${Date.now()}`,
      title: `${provider} - ${model}`,
      provider,
      model,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalTokens: 0,
    };
  }
}

export default new ChatHistoryService();
