type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

class NotificationService {
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private notifications: Notification[] = [];

  notify(type: NotificationType, title: string, message?: string, duration = 3000) {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const notification: Notification = { id, type, title, message, duration };
    this.notifications = [...this.notifications, notification];
    this.listeners.forEach(l => l(this.notifications));

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
    return id;
  }

  dismiss(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.listeners.forEach(l => l(this.notifications));
  }

  success(title: string, message?: string) { return this.notify('success', title, message); }
  error(title: string, message?: string) { return this.notify('error', title, message, 5000); }
  info(title: string, message?: string) { return this.notify('info', title, message); }
  warning(title: string, message?: string) { return this.notify('warning', title, message, 4000); }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
