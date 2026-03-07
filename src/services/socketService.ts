type MessageHandler = (data: any) => void;

class SocketService {
  private socket: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private binaryMode = false;

  setBinaryMode(enabled: boolean) {
    this.binaryMode = enabled;
    if (this.socket) {
      this.socket.binaryType = enabled ? 'arraybuffer' : 'blob';
    }
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.socket = new WebSocket(`${protocol}//${host}`);
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
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, 2000);
      }
    };
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  createSession() {
    const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.send({ type: 'session:create', sessionId });
    return sessionId;
  }

  joinSession(sessionId: string) {
    this.send({ type: 'session:join', sessionId });
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

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => { this.handlers.delete(handler); };
  }
}

export const socketService = new SocketService();
