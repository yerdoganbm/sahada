
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { ScreenName, WhatsAppTemplate, AutomationRule, Player } from '../types';

interface WhatsAppIntegrationProps {
  onBack: () => void;
  onNavigate: (screen: ScreenName) => void;
  currentUser: Player;
}

export const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({ onBack, onNavigate, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'connect' | 'templates' | 'automation'>('connect');
  const [isConnected, setIsConnected] = useState(true);

  // AUTH CHECK
  if (currentUser.role !== 'admin' && currentUser.tier !== 'partner') {
    return (
        <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-alert/10 rounded-full flex items-center justify-center mb-4">
                <Icon name="smart_toy" size={32} className="text-alert" />
            </div>
            <h2 className="text-white text-lg font-bold mb-2">Bot Yönetimi Kısıtlı</h2>
            <p className="text-slate-400 text-xs mb-6">WhatsApp bot ayarlarını sadece yöneticiler yapılandırabilir.</p>
            <button onClick={onBack} className="bg-surface border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-xs">
                Geri Dön
            </button>
        </div>
    );
  }

  // Mock Templates
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([
    { id: '1', title: 'Yoklama Mesajı', content: '📅 *MAÇ YOKLAMASI*\n\nTarih: {tarih}\nSaat: {saat}\nSaha: {saha}\n\nLütfen aşağıdaki linkten durumu bildirin:', variables: ['{tarih}', '{saat}', '{saha}'] },
    { id: '2', title: 'Ödeme Hatırlatma', content: '💰 *ÖDEME HATIRLATMA*\n\nMerhaba {ad}, son maçtan {tutar} TL bakiyeniz bulunmaktadır. Lütfen bugün gönderim yapınız.\n\nIBAN: TR12 3456...', variables: ['{ad}', '{tutar}'] },
  ]);

  // Mock Rules
  const [rules, setRules] = useState<AutomationRule[]>([
    { id: 'r1', title: 'Son 24 Saat Hatırlatması', isEnabled: true, description: 'Maça 24 saat kala kadroyu otomatik paylaş.' },
    { id: 'r2', title: 'Borç Takibi', isEnabled: false, description: 'Maçtan 2 gün sonra ödemeyenlere otomatik mesaj at.' },
    { id: 'r3', title: 'Sessiz Saatler', isEnabled: true, description: '23:00 - 09:00 arası otomatik mesaj gönderme.' },
  ]);

  const toggleRule = (id: string) => {
      setRules(rules.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
  };

  return (
    <div className="bg-secondary min-h-screen pb-safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
         <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
           <Icon name="arrow_back" className="text-white" />
         </button>
         <div className="text-center">
            <h1 className="font-bold text-white text-lg">WhatsApp Merkezi</h1>
            <p className="text-[10px] text-slate-400">Entegrasyon & Otomasyon</p>
         </div>
         <button onClick={() => onNavigate('messageLogs')} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 text-slate-400">
           <Icon name="history" />
         </button>
      </div>

      {/* Tabs */}
      <div className="p-4">
         <div className="bg-surface p-1 rounded-xl flex border border-white/5 mb-6">
            <button onClick={() => setActiveTab('connect')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'connect' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Bağlantı</button>
            <button onClick={() => setActiveTab('templates')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'templates' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Şablonlar</button>
            <button onClick={() => setActiveTab('automation')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'automation' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Otomasyon</button>
         </div>

         {/* CONNECT TAB */}
         {activeTab === 'connect' && (
             <div className="space-y-6 animate-fade-in">
                 <div className={`rounded-2xl p-6 border text-center ${isConnected ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                     <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${isConnected ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                         <Icon name="whatsapp" size={40} />
                     </div>
                     <h3 className="text-white font-bold text-lg mb-1">{isConnected ? 'Bağlantı Aktif' : 'Bağlantı Yok'}</h3>
                     <p className="text-slate-400 text-xs mb-6">{isConnected ? 'Bot şu anda "Halı Saha Grubu ⚽" grubunu dinliyor.' : 'QR kodunu taratarak botu aktif hale getirin.'}</p>
                     
                     <div className="flex gap-3 justify-center">
                         <button onClick={() => setIsConnected(!isConnected)} className="px-6 py-3 rounded-xl bg-surface border border-white/10 text-white text-xs font-bold hover:bg-white/5">
                             {isConnected ? 'Bağlantıyı Kes' : 'QR Kodu Göster'}
                         </button>
                         {isConnected && (
                             <button className="px-6 py-3 rounded-xl bg-green-600 text-white text-xs font-bold shadow-lg shadow-green-600/20">
                                 Test Mesajı Gönder
                             </button>
                         )}
                     </div>
                 </div>

                 <div className="bg-surface rounded-2xl p-4 border border-white/5">
                     <h3 className="text-sm font-bold text-white mb-3">Bağlı Gruplar</h3>
                     <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-white/5">
                         <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                             <Icon name="groups" className="text-slate-300" />
                         </div>
                         <div className="flex-1">
                             <h4 className="text-sm font-bold text-white">Halı Saha Grubu ⚽</h4>
                             <p className="text-[10px] text-slate-500">18 Üye • Yönetici Yetkisi Var</p>
                         </div>
                         <button className="text-xs text-red-400 font-bold">Kaldır</button>
                     </div>
                 </div>
             </div>
         )}

         {/* TEMPLATES TAB */}
         {activeTab === 'templates' && (
             <div className="space-y-4 animate-fade-in">
                 {templates.map(t => (
                     <div key={t.id} className="bg-surface rounded-2xl p-4 border border-white/5">
                         <div className="flex justify-between items-center mb-2">
                             <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                 <Icon name="description" size={16} className="text-primary" />
                                 {t.title}
                             </h3>
                             <button className="text-slate-400 hover:text-white"><Icon name="edit" size={16} /></button>
                         </div>
                         <div className="bg-secondary/50 p-3 rounded-xl border border-white/5 mb-3">
                             <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{t.content}</p>
                         </div>
                         <div className="flex gap-2 justify-end">
                             <button className="px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-[10px] font-bold text-slate-300">Önizle</button>
                             <button className="px-3 py-1.5 rounded-lg bg-[#25D366]/20 text-[#25D366] text-[10px] font-bold border border-[#25D366]/20 flex items-center gap-1">
                                 <Icon name="share" size={12} /> Paylaş
                             </button>
                         </div>
                     </div>
                 ))}
                 <button className="w-full py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 text-xs font-bold hover:bg-white/5">
                     + Yeni Şablon Ekle
                 </button>
             </div>
         )}

         {/* AUTOMATION TAB */}
         {activeTab === 'automation' && (
             <div className="space-y-4 animate-fade-in">
                 <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-3 mb-4">
                     <Icon name="info" className="text-blue-500 shrink-0" size={18} />
                     <p className="text-xs text-slate-300">
                         Otomasyon kuralları botun kendi başına aksiyon almasını sağlar.
                     </p>
                 </div>

                 {rules.map(r => (
                     <div key={r.id} className="bg-surface rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                         <div className="flex-1 pr-4">
                             <h3 className="font-bold text-white text-sm mb-1">{r.title}</h3>
                             <p className="text-[10px] text-slate-400">{r.description}</p>
                         </div>
                         <button 
                             onClick={() => toggleRule(r.id)}
                             className={`w-12 h-6 rounded-full relative transition-colors ${r.isEnabled ? 'bg-primary' : 'bg-slate-700'}`}
                         >
                             <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${r.isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                         </button>
                     </div>
                 ))}
             </div>
         )}
      </div>
    </div>
  );
};
