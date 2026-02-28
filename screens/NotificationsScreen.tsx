
import React from 'react';
import { Icon } from '../components/Icon';
import { AppNotification, ScreenName } from '../types';

interface NotificationsScreenProps {
  onBack: () => void;
  onNavigate: (screen: ScreenName, params?: any) => void;
  currentUser?: unknown;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack, onNavigate, notifications, onMarkAllRead, onMarkRead }) => {
  const handleNotificationClick = (n: AppNotification) => {
    onMarkRead(n.id);
    if (n.actionScreen) onNavigate(n.actionScreen);
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'match': return 'sports_soccer';
          case 'payment': return 'payments';
          case 'social': return 'emoji_events';
          default: return 'notifications';
      }
  };

  const getColor = (type: string) => {
      switch(type) {
          case 'match': return 'text-primary bg-primary/10';
          case 'payment': return 'text-red-500 bg-red-500/10';
          case 'social': return 'text-yellow-500 bg-yellow-500/10';
          default: return 'text-blue-500 bg-blue-500/10';
      }
  };

  return (
    <div className="bg-secondary min-h-screen pb-safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
        <div className="flex items-center gap-3">
           <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
             <Icon name="arrow_back" className="text-white" />
           </button>
           <h1 className="font-bold text-white text-lg">Bildirimler</h1>
        </div>
        <button onClick={onMarkAllRead} className="text-xs text-primary font-bold">Tümünü Oku</button>
      </div>

      <div className="p-4 space-y-3">
          {notifications.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                  <Icon name="notifications_off" size={48} className="text-slate-600 mb-2 mx-auto" />
                  <p className="text-sm text-slate-400">Bildiriminiz yok.</p>
              </div>
          ) : (
              notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 rounded-2xl flex gap-4 cursor-pointer active:scale-[0.99] transition-all border ${n.isRead ? 'bg-transparent border-transparent' : 'bg-surface border-white/5'}`}
                  >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getColor(n.type)}`}>
                          <Icon name={getIcon(n.type)} size={24} />
                      </div>
                      <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm font-bold ${n.isRead ? 'text-slate-400' : 'text-white'}`}>{n.title}</h4>
                              <span className="text-[10px] text-slate-500">{n.time}</span>
                          </div>
                          <p className={`text-xs ${n.isRead ? 'text-slate-500' : 'text-slate-300'} leading-relaxed`}>{n.message}</p>
                      </div>
                      {!n.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      )}
                  </div>
              ))
          )}
      </div>
    </div>
  );
};
