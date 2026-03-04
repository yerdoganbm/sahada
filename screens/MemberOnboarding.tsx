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
  // Phone already captured during auth → pre-fill
  const [fullName, setFullName] = useState(currentUser?.name && currentUser.name !== 'Yeni Üye' ? currentUser.name : '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [error, setError] = useState('');

  const canSkipPhone = !!(currentUser?.phone);

  const handleSubmit = () => {
    if (!fullName.trim()) { setError('Ad Soyad zorunludur.'); return; }
    onComplete(fullName.trim(), phone.trim() || currentUser?.phone || undefined);
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="px-5 pt-12 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 text-sm font-bold hover:text-white transition-colors mb-8">
          <Icon name="arrow_back" size={16} /> Geri
        </button>

        {/* Progress: step 2 of 2 */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-1.5 rounded-full bg-primary/40" />
          <div className="w-8 h-1.5 rounded-full bg-primary" />
        </div>

        <h1 className="text-2xl font-black text-white mb-1">Son bir adım 👋</h1>
        <p className="text-slate-500 text-sm">
          {pendingJoinCode ? 'Takıma katılmak için adını gir.' : 'Profilini tamamla.'}
        </p>
      </div>

      <div className="flex-1 px-5 max-w-sm mx-auto w-full space-y-4 pt-4">
        {/* Full name */}
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
            Ad Soyad <span className="text-red-500">*</span>
          </label>
          <input
            value={fullName}
            onChange={e => { setFullName(e.target.value); setError(''); }}
            placeholder="Adın ve soyadın"
            autoFocus
            className="w-full bg-surface border border-white/10 rounded-2xl px-4 py-3.5 text-white text-base focus:outline-none focus:border-primary transition-all"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* Phone — only show if not already captured */}
        {!canSkipPhone && (
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Telefon (opsiyonel)</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0532 000 00 00"
              type="tel"
              className="w-full bg-surface border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="p-3 rounded-xl bg-white/3 border border-white/6">
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Bu bilgiler kaptan tarafından ödeme takibi ve maç koordinasyonu için kullanılır.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!fullName.trim()}
          className="w-full py-4 rounded-2xl bg-primary text-secondary font-black text-base shadow-glow disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>{pendingJoinCode ? 'Devam Et, Takıma Katıl' : 'Tamamla'}</span>
          <Icon name="arrow_forward" size={16} />
        </button>
      </div>
    </div>
  );
};
