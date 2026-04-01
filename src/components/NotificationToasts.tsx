import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import notificationService from '../services/notificationService';

export default function NotificationToasts() {
  const [notifications, setNotifications] = useState(notificationService['notifications'] || []);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    return () => { unsubscribe(); };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-16 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {notifications.map(notif => {
        const styles = {
          info: 'bg-blue-900/90 border-blue-500/50 text-blue-200',
          success: 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200',
          warning: 'bg-amber-900/90 border-amber-500/50 text-amber-200',
          error: 'bg-red-900/90 border-red-500/50 text-red-200',
        }[notif.type];
        const Icon = { info: Info, success: CheckCircle, warning: AlertTriangle, error: AlertCircle }[notif.type];

        return (
          <div key={notif.id} className={`flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-xl animate-in slide-in-from-right-4 ${styles}`}>
            <Icon size={16} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">{notif.title}</p>
              {notif.message && <p className="text-[10px] opacity-80 mt-0.5 line-clamp-2">{notif.message}</p>}
            </div>
            <button onClick={() => notificationService.dismiss(notif.id)} className="flex-shrink-0 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
