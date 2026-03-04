/**
 * CreateProfile — Minimal first-time profile setup
 * Replaces the old "takma ad + slider" screen.
 * Just: full name + position (optional). Back button included.
 */
import React, { useState } from 'react';
import { Icon } from '../components/Icon';

interface CreateProfileProps {
  onComplete: (profileData: { name: string; position: string; shirtNumber?: number }) => void;
  onBack?: () => void;
  /** If provided, shown as context banner */
  isCaptain?: boolean;
}

const POSITIONS = [
  { id: 'GK',  label: 'Kaleci',    emoji: '🧤' },
  { id: 'DEF', label: 'Defans',    emoji: '🛡️' },
  { id: 'MID', label: 'Orta Saha', emoji: '⚙️' },
  { id: 'FWD', label: 'Forvet',    emoji: '⚡' },
];

export const CreateProfile: React.FC<CreateProfileProps> = ({ onComplete, onBack, isCaptain }) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('MID');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Ad Soyad zorunludur.');
      return;
    }
    onComplete({ name: name.trim(), position });
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 text-sm font-bold hover:text-white transition-colors mb-8">
            <Icon name="arrow_back" size={16} /> Geri
          </button>
        )}

        {/* Context banner */}
        {isCaptain ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-5 w-fit">
            <span className="text-base">🏆</span>
            <span className="text-yellow-300 text-xs font-bold">Kaptan olarak kayıt</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 mb-5 w-fit">
            <span className="text-base">⚽</span>
            <span className="text-primary text-xs font-bold">Oyuncu olarak kayıt</span>
          </div>
        )}

        <h1 className="text-2xl font-black text-white mb-1">Profil oluştur</h1>
        <p className="text-slate-500 text-sm">Diğer oyuncular seni bu bilgilerle tanıyacak.</p>
      </div>

      <div className="flex-1 px-5 max-w-sm mx-auto w-full space-y-5 pt-2">
        {/* Full name */}
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
            Ad Soyad <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            placeholder="Adın ve soyadın"
            autoFocus
            className={`w-full bg-surface border rounded-2xl px-4 py-3.5 text-white text-base focus:outline-none transition-all ${
              error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary'
            }`}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          {error && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
              <Icon name="error_outline" size={12} />
              {error}
            </p>
          )}
        </div>

        {/* Position */}
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
            Mevki <span className="text-slate-700">(opsiyonel)</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {POSITIONS.map(p => (
              <button
                key={p.id}
                onClick={() => setPosition(p.id)}
                className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all duration-200 ${
                  position === p.id
                    ? 'border-primary/40 bg-primary/10 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'border-white/8 bg-white/3 hover:border-white/15'
                }`}
              >
                <span className="text-lg mb-1">{p.emoji}</span>
                <span className={`text-[10px] font-bold ${position === p.id ? 'text-primary' : 'text-slate-500'}`}>
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 rounded-xl bg-white/3 border border-white/5">
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Bu bilgileri istediğin zaman Profil ekranından değiştirebilirsin.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            name.trim()
              ? 'bg-primary text-secondary shadow-[0_0_24px_rgba(16,185,129,0.35)]'
              : 'bg-white/5 text-slate-700 cursor-not-allowed'
          }`}
        >
          <span>{isCaptain ? 'Başla, Takım Kur →' : 'Başla →'}</span>
        </button>
      </div>
    </div>
  );
};
