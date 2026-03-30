class TerminalService {
  private streams: Record<string, string[]> = {
    bash: [],
    scripts: []
  };
  private maxLines = 100;
  private listeners: Set<(streams: Record<string, string[]>) => void> = new Set();

  append(stream: 'bash' | 'scripts', data: string) {
    const lines = data.split(/\r?\n/);
    this.streams[stream] = [...this.streams[stream], ...lines].slice(-this.maxLines);
    this.notify();
  }

  getOutput(stream: 'bash' | 'scripts' = 'bash') {
    return this.streams[stream].join('\n');
  }

  subscribe(listener: (streams: Record<string, string[]>) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.streams));
  }
}

export const terminalService = new TerminalService();
