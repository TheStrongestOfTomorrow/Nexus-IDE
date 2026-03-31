/**
 * Capacitor Bridge Service for Nexus IDE
 * Provides native Android bridge for Termux-style shell access,
 * filesystem operations, and hardware features.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

class CapacitorBridgeService {
  private isNative: boolean;

  constructor() {
    this.isNative = typeof (window as any).Capacitor !== 'undefined';
  }

  get isAvailable(): boolean {
    return this.isNative;
  }

  /** Check if running inside Capacitor native app */
  isNativePlatform(): boolean {
    return this.isNative;
  }

  /** Execute a shell command via native bridge (requires Termux plugin) */
  async executeCommand(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (!this.isNative) {
      throw new Error('Capacitor bridge only available in native app');
    }
    try {
      const { Capacitor } = await import('@capacitor/core');
      const result = await (Capacitor as any).Plugins?.ShellBridge?.execute({ command })
        ?? await (Capacitor as any).nativeBridge?.execute({ command });
      return result as { stdout: string; stderr: string; exitCode: number };
    } catch {
      return { stdout: '', stderr: 'Native bridge not available', exitCode: 1 };
    }
  }

  /** Get native filesystem access */
  async getNativeFs(): Promise<any> {
    if (!this.isNative) return null;
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — @capacitor/filesystem is optional
      const mod = await import('@capacitor/filesystem');
      return (mod as any).Filesystem;
    } catch {
      return null;
    }
  }

  /** Vibrate device */
  async vibrate(_ms: number = 50): Promise<void> {
    if (!this.isNative) return;
    try {
      // @ts-ignore — @capacitor/haptics is optional
      const mod = await import('@capacitor/haptics');
      await (mod as any).Haptics.impact({ style: 'LIGHT' });
    } catch {
      // Haptics not available
    }
  }

  /** Get device info */
  async getDeviceInfo(): Promise<{ platform: string; model: string; osVersion: string } | null> {
    if (!this.isNative) return null;
    try {
      // @ts-ignore — @capacitor/device is optional
      const mod = await import('@capacitor/device');
      const info = await (mod as any).Device.getInfo();
      return { platform: info.platform, model: info.model || '', osVersion: info.osVersion };
    } catch {
      return null;
    }
  }

  /** Share file via native share sheet */
  async shareFile(options: { name: string; url?: string; text?: string }): Promise<boolean> {
    if (!this.isNative) return false;
    try {
      // @ts-ignore — @capacitor/share is optional
      const mod = await import('@capacitor/share');
      await (mod as any).Share.share({ title: options.name, url: options.url, text: options.text });
      return true;
    } catch {
      return false;
    }
  }

  /** Read a file from native filesystem */
  async readFile(path: string): Promise<string | null> {
    const fs = await this.getNativeFs();
    if (!fs) return null;
    try {
      const result = await fs.readFile({ path });
      return result.data as string;
    } catch {
      return null;
    }
  }

  /** Write a file to native filesystem */
  async writeFile(path: string, data: string): Promise<boolean> {
    const fs = await this.getNativeFs();
    if (!fs) return false;
    try {
      await fs.writeFile({ path, data, directory: 'DOCUMENTS' });
      return true;
    } catch {
      return false;
    }
  }
}

export const capacitorBridgeService = new CapacitorBridgeService();
export default capacitorBridgeService;
