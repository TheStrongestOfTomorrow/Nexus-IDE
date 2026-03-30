// Error handling and reporting service

export interface NexusError {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  code?: string;
  timestamp: number;
  context?: Record<string, any>;
  recoverable: boolean;
  suggestion?: string;
}

class ErrorHandlingService {
  private errors: NexusError[] = [];
  private listeners: ((errors: NexusError[]) => void)[] = [];

  constructor() {
    // Listen for unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error, 'RUNTIME_ERROR');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, 'PROMISE_REJECTION');
    });
  }

  captureError(error: any, code: string = 'UNKNOWN'): NexusError {
    const nexusError: NexusError = {
      id: Math.random().toString(36).substring(2, 11),
      type: 'error',
      title: error?.name || 'Error',
      message: error?.message || String(error),
      code,
      timestamp: Date.now(),
      recoverable: this.isRecoverable(code),
      suggestion: this.getSuggestion(code, error),
    };

    this.errors.push(nexusError);
    this.notifyListeners();

    console.error('[Nexus Error]', nexusError);
    return nexusError;
  }

  captureWarning(message: string, code: string = 'WARNING', context?: Record<string, any>): NexusError {
    const warning: NexusError = {
      id: Math.random().toString(36).substring(2, 11),
      type: 'warning',
      title: 'Warning',
      message,
      code,
      timestamp: Date.now(),
      context,
      recoverable: true,
    };

    this.errors.push(warning);
    this.notifyListeners();
    return warning;
  }

  captureInfo(message: string, code: string = 'INFO'): NexusError {
    const info: NexusError = {
      id: Math.random().toString(36).substring(2, 11),
      type: 'info',
      title: 'Information',
      message,
      code,
      timestamp: Date.now(),
      recoverable: true,
    };

    this.errors.push(info);
    this.notifyListeners();
    return info;
  }

  private isRecoverable(code: string): boolean {
    const unrecoverables = ['MEMORY_ERROR', 'CRITICAL_FAILURE', 'FATAL'];
    return !unrecoverables.includes(code);
  }

  private getSuggestion(code: string, error: any): string | undefined {
    const suggestions: Record<string, string> = {
      'API_ERROR': 'Check your API key in settings. Make sure it\'s valid and has the required permissions.',
      'NETWORK_ERROR': 'Check your internet connection. Try refreshing the page.',
      'FILE_ERROR': 'The file might not exist or you don\'t have permissions to access it.',
      'PARSE_ERROR': 'The file format might be corrupted. Try editing it manually.',
      'SYNTAX_ERROR': 'There\'s a syntax error in your code. Check the line number indicated.',
      'PERMISSION_ERROR': 'You don\'t have permission to perform this action.',
      'NOT_FOUND': 'The requested resource was not found. Check if it exists.',
    };

    return suggestions[code];
  }

  getErrors(): NexusError[] {
    return [...this.errors];
  }

  getRecentErrors(count: number = 10): NexusError[] {
    return this.errors.slice(-count);
  }

  clearErrors(): void {
    this.errors = [];
    this.notifyListeners();
  }

  clearError(id: string): void {
    this.errors = this.errors.filter(e => e.id !== id);
    this.notifyListeners();
  }

  subscribe(callback: (errors: NexusError[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getErrors()));
  }
}

export default new ErrorHandlingService();
