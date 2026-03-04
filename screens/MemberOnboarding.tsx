import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Player } from '../types';

interface Props {
  currentUser: Player | null;
  pendingJoinCode?: string | null;
  onComplete: (fullName: string, phone?: string) => void;
  onBack: () => void;
}

export const MemberOnboarding: React.FC<Props> = ({ currentUser, pendingJoinCode, onComplete, onBack }) => {
  const [fullName, setFullName] = useState(currentUser?.name ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!fullName.trim()) { setError('Ad Soyad zorunludur.'); return; }
    onComplete(fullName.trim(), phone.trim() || undefined);
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Profilini Tamamla</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-sm mx-auto w-full">
        <div className="w-full space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
            <Icon name="person" size={32} className="text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-white font-black text-2xl mb-1">Merhaba! 👋</h2>
            <p className="text-slate-400 text-sm">
              {pendingJoinCode ? 'Takıma katılmak için bilgilerini gir.' : 'Devam etmek için bilgilerini gir.'}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Ad Soyad *</label>
              <input value={fullName} onChange={e => { setFullName(e.target.value); setError(''); }}
                placeholder="Adın ve soyadın"
                className="w-full bg-surface border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Telefon (opsiyonel)</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="0532 000 00 00" type="tel"
                className="w-full bg-surface border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary transition-all" />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="bg-slate-800/50 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Bu bilgiler kaptan tarafından ödeme takibi ve maç koordinasyonu için kullanılır.
            </p>
          </div>

          <button onClick={handleSubmit} disabled={!fullName.trim()}
            className="w-full py-4 rounded-2xl bg-primary text-secondary font-black text-base shadow-glow disabled:opacity-40">
            Devam Et →
          </button>
        </div>
      </div>
    </div>
  );
};
