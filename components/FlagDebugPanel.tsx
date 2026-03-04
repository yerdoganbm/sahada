import React, { useState } from 'react';
import { FLAGS, toggleFlag, resetFlags, FeatureFlags } from '../src/config/flags';
import { Icon } from './Icon';

/**
 * FlagDebugPanel — geliştirme ortamında feature flag toggle paneli.
 * Üretimde göstermek için NODE_ENV=production'da render'ı kapat.
 */
export const FlagDebugPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [localFlags, setLocalFlags] = useState<FeatureFlags>({ ...FLAGS });

  const handleToggle = (key: keyof FeatureFlags) => {
    const next = !localFlags[key];
    toggleFlag(key, next);
    setLocalFlags(prev => ({ ...prev, [key]: next }));
  };

  const handleReset = () => {
    resetFlags();
    setLocalFlags({ ...FLAGS });
  };

  // Prod'da gizle
  if (import.meta.env.PROD) return null;

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-24 right-4 z-[9999] w-10 h-10 rounded-full bg-slate-800 border border-white/15 shadow-lg flex items-center justify-center hover:bg-slate-700 transition-all"
        title="Feature Flags"
      >
        <Icon name="tune" size={16} className="text-slate-300" />
      </button>

      {open && (
        <div className="fixed bottom-36 right-4 z-[9999] w-64 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-xs font-black text-white uppercase tracking-widest">Feature Flags</span>
            <div className="flex gap-2">
              <button onClick={handleReset} className="text-[9px] text-slate-500 hover:text-white font-bold">Reset</button>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
                <Icon name="close" size={14} />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-72 p-2 space-y-1">
            {(Object.keys(localFlags) as (keyof FeatureFlags)[]).map(key => (
              <button
                key={key}
                onClick={() => handleToggle(key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  localFlags[key] ? 'bg-primary/10 text-primary' : 'bg-white/3 text-slate-500'
                }`}
              >
                <span>{key}</span>
                <div className={`w-7 h-4 rounded-full border transition-all ${localFlags[key] ? 'bg-primary/40 border-primary/50' : 'bg-white/8 border-white/10'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-all mt-0.5 ${localFlags[key] ? 'ml-3.5' : 'ml-0.5'}`} />
                </div>
              </button>
            ))}
          </div>
          <p className="text-[9px] text-slate-700 text-center py-2 border-t border-white/5">Değişiklikler sayfa yenilenince aktif olur</p>
        </div>
      )}
    </>
  );
};
