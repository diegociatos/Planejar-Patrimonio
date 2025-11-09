import React from 'react';
import { Notification } from '../types';
import Icon from './Icon';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onNotificationClick: (notification: Notification) => void;
  onClearAll: () => void;
}

const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anos";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " dias";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutos";
    return "agora";
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose, onNotificationClick, onClearAll }) => {
  
  const handleItemClick = (notification: Notification) => {
    onNotificationClick(notification);
    onClose();
  }

  return (
    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="text-base font-semibold text-gray-800">Notificações</h3>
        <button onClick={onClearAll} className="text-xs font-medium text-brand-secondary hover:underline">
          Marcar todas como lidas
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`w-full text-left p-3 flex items-start space-x-3 hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50' : 'bg-white'}`}
            >
              <div className="flex-shrink-0 mt-1">
                {n.type === 'message' && <Icon name="chat" className="w-5 h-5 text-blue-500" />}
                {n.type === 'task' && <Icon name="tasks" className="w-5 h-5 text-yellow-500" />}
                {n.type === 'alert' && <Icon name="bell" className="w-5 h-5 text-green-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{timeSince(n.createdAt)}</p>
              </div>
              {!n.isRead && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>}
            </button>
          ))
        ) : (
          <div className="text-center p-8 text-sm text-gray-500">
            <Icon name="check" className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            Nenhuma notificação nova.
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;