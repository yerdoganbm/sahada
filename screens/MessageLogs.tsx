
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { ScreenName, MessageLog, Player } from '../types';

interface MessageLogsProps {
  onBack: () => void;
  currentUser: Player;
}

export const MessageLogs: React.FC<MessageLogsProps> = ({ onBack, currentUser }) => {
  // AUTH CHECK
  if (currentUser.role !== 'admin' && currentUser.tier !== 'partner') {
    return (
        <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-alert/10 rounded-full flex items-center justify-center mb-4">
                <Icon name="lock" size={32} className="text-alert" />
            </div>
            <h2 className="text-white text-lg font-bold mb-2">Erişim Reddedildi</h2>
            <p className="text-slate-400 text-xs mb-6">Log kayıtlarını sadece yetkili kullanıcılar görüntüleyebilir.</p>
            <button onClick={onBack} className="bg-surface border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-xs">
                Geri Dön
            </button>
        </div>
    );
  }

  const [logs] = useState<MessageLog[]>([
    { id: '1', type: 'reminder', recipient: 'Halı Saha Grubu ⚽', status: 'sent', timestamp: 'Bugün 14:00', content: 'Maça 24 saat kaldı! Lütfen eksikleri tamamlayalım.' },
    { id: '2', type: 'payment', recipient: 'Ahmet Yılmaz', status: 'sent', timestamp: 'Dün 10:30', content: 'Ödeme hatırlatması: 150 TL bakiyeniz var.' },
    { id: '3', type: 'squad', recipient: 'Mehmet Demir', status: 'failed', timestamp: 'Dün 09:00', content: 'Yedek listesinden maça davet edildiniz.' },
  ]);

  return (
    <div className="bg-secondary min-h-screen pb-24">
      <div className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
         <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
           <Icon name="arrow_back" className="text-white" />
         </button>
         <h1 className="font-bold text-white text-lg">Mesaj Günlüğü</h1>
         <div className="w-10"></div>
      </div>

      <div className="p-4 space-y-4">
          {logs.map(log => (
              <div key={log.id} className="bg-surface rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.type === 'reminder' ? 'bg-blue-500/20 text-blue-400' : 
                              log.type === 'payment' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'
                          }`}>
                              {log.type}
                          </span>
                          <span className="text-xs text-slate-400">{log.timestamp}</span>
                      </div>
                      <Icon name={log.status === 'sent' ? 'check_circle' : 'error'} size={16} className={log.status === 'sent' ? 'text-green-500' : 'text-red-500'} />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Kime: {log.recipient}</h4>
                  <p className="text-xs text-slate-400 bg-secondary/50 p-2 rounded-lg border border-white/5 font-mono">
                      {log.content}
                  </p>
                  {log.status === 'failed' && (
                      <button className="mt-2 text-[10px] font-bold text-primary flex items-center gap-1">
                          <Icon name="refresh" size={12} /> Tekrar Dene
                      </button>
                  )}
              </div>
          ))}
      </div>
    </div>
  );
};
