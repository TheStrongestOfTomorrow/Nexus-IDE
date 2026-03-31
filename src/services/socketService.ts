type MessageHandler = (data: any) => void;

class SocketService {
  private socket: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private binaryMode = false;
  private currentPasswordHash: string | null = null;

  setBinaryMode(enabled: boolean) {
    this.binaryMode = enabled;
    if (this.socket) {
      this.socket.binaryType = enabled ? 'arraybuffer' : 'blob';
    }
  }

  /**
   * Hash a password using SHA-256 (browser's crypto.subtle).
   * Used client-side before sending any password data over the wire.
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Store a session password. The plain text is immediately hashed
   * and only the hash is kept in memory.
   */
  async setSessionPassword(password: string): Promise<string> {
    const hash = await this.hashPassword(password);
    this.currentPasswordHash = hash;
    return hash;
  }

  /** Clear the stored session password (e.g. when unlocking). */
  clearSessionPassword(): void {
    this.currentPasswordHash = null;
  }

  /** Check whether a password is currently set for this session. */
  isSessionLocked(): boolean {
    return this.currentPasswordHash !== null;
  }

  /**
   * Verify a plain-text password against a stored SHA-256 hash.
   * Returns true only if the hashes match exactly.
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  /**
   * Send a session:auth message with a password hash for verification.
   * Used when a join attempt receives session:password_required.
   */
  authenticateSession(sessionId: string, passwordHash: string) {
    this.send({
      type: 'session:auth',
      sessionId,
      password_hash: passwordHash,
    });
  }

  /**
   * Kick a participant from the session. Only the host may do this.
   */
  kickParticipant(sessionId: string, participantId: string) {
    this.send({
      type: 'session:kick',
      sessionId,
      participantId,
    });
  }

  /**
   * Transfer the host role to another participant.
   * The current host sends this to promote someone else.
   */
  transferHost(sessionId: string, newHostId: string) {
    this.send({
      type: 'session:transfer_host',
      sessionId,
      newHostId,
    });
  }

  /**
   * Notify the server of the session timeout setting (in minutes).
   * Read from localStorage (nexus_collab_timeout) and sent on session create/update.
   */
  sendSessionTimeout(sessionId: string, timeoutMinutes: number) {
    this.send({
      type: 'session:timeout',
      sessionId,
      timeoutMinutes,
    });
  }

  connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      
      const isStatic = host.includes('github.io') || host.includes('vercel.app') || host.includes('netlify.app');
      
      // Fallback to Nexus Cloud signaling server if in static mode
      const socketUrl = isStatic 
        ? 'wss://nexus-cloud-signal.up.railway.app' 
        : `${protocol}//${host}`;

      if (isStatic) {
        console.log('Nexus IDE is running in static mode. Connecting to Nexus Cloud for collaboration...');
      }

      this.socket = new WebSocket(socketUrl);
      if (this.binaryMode) this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = () => {
        console.log('Connected to Nexus WebSocket');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          // Handle binary message (e.g. Minecraft event)
          const view = new DataView(event.data);
          const type = view.getUint8(0);
          if (type === 0x02) { // Minecraft Event
            const decoder = new TextDecoder();
            const jsonStr = decoder.decode(new Uint8Array(event.data, 1));
            const data = JSON.parse(jsonStr);
            this.handlers.forEach(handler => handler({ type: 'minecraft:event', data }));
          }
          return;
        }

        try {
          const data = JSON.parse(event.data);
          this.handlers.forEach(handler => handler(data));
        } catch (err) {
          console.error('Socket message parse error', err);
        }
      };

      this.socket.onclose = () => {
        console.log('Disconnected from Nexus WebSocket');
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // exponential backoff, max 30s
          console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        } else {
          console.error('Max reconnect attempts reached. WebSocket connection failed permanently.');
        }
      };
    } catch (err) {
      console.error('Socket connection error', err);
    }
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  /**
   * Create a new collaboration session, optionally protected with a password hash.
   * If collabTimeout is set in localStorage, the timeout is sent automatically.
   */
  createSession(passwordHash?: string | null) {
    const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.send({
      type: 'session:create',
      sessionId,
      ...(passwordHash ? { password_hash: passwordHash } : {}),
    });
    // Auto-send timeout setting from localStorage
    const timeout = localStorage.getItem('nexus_collab_timeout');
    if (timeout) {
      this.sendSessionTimeout(sessionId, parseInt(timeout, 10) || 30);
    }
    return sessionId;
  }

  /**
   * Join a session with optional password authentication.
   * If the session is locked, the server will compare the provided hash.
   * If no password is provided and the session requires one, the server
   * will reply with session:password_required.
   */
  joinSession(sessionId: string, passwordHash?: string | null) {
    this.send({
      type: 'session:join',
      sessionId,
      ...(passwordHash ? { password_hash: passwordHash } : {}),
    });
  }

  /**
   * Emit a join-request that carries an auth hash for locked sessions.
   * Used as an explicit auth flow before the standard join.
   */
  requestJoin(sessionId: string, passwordHash: string) {
    this.send({
      type: 'join-request',
      sessionId,
      password_hash: passwordHash,
    });
  }

  hostWorkspace(sessionId: string, files: { name: string, content: string }[]) {
    this.send({ type: 'workspace:host', sessionId, files });
  }

  sendMinecraftCommand(sessionId: string, command: string) {
    if (this.binaryMode && this.socket && this.socket.readyState === WebSocket.OPEN) {
      const encoder = new TextEncoder();
      const sessionBytes = encoder.encode(sessionId);
      const commandBytes = encoder.encode(command);
      
      const payload = new Uint8Array(2 + sessionBytes.length + commandBytes.length);
      payload[0] = 0x01; // Type: Minecraft Command
      payload[1] = sessionBytes.length;
      payload.set(sessionBytes, 2);
      payload.set(commandBytes, 2 + sessionBytes.length);
      
      this.socket.send(payload);
    } else {
      this.send({ type: 'minecraft:command', sessionId, command });
    }
  }

  subscribeMinecraftEvents(sessionId: string, eventName: string) {
    this.send({ type: 'minecraft:subscribe', sessionId, eventName });
  }

  /**
   * Request server-side password validation for a session.
   * Emits a session:validate-password message and the server should
   * respond with either session:password-valid or session:password-invalid.
   */
  validatePassword(sessionId: string, passwordHash: string): void {
    this.send({
      type: 'session:validate-password',
      sessionId,
      passwordHash,
    });
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => { this.handlers.delete(handler); };
  }
}

export const socketService = new SocketService();
