/**
 * PaymentProofModal — Pro ödeme ve dekont gönderme akışı
 * Nakit / EFT / Kapora / Kart / Kısmi ödeme
 */
import React, { useState, useRef, useCallback } from 'react';
import { MoneyMethod } from '../types';

export interface PaymentProofSubmitPayload {
  method: MoneyMethod | 'deposit';
  amount: number;
  proofUrl?: string;
  proofFile?: File;
  note?: string;
  isPartial?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: PaymentProofSubmitPayload) => Promise<void> | void;
  expectedAmount: number;
  paidAmount?: number;
  memberName?: string;
  reservationLabel?: string;
  captainMode?: boolean;
  availableMethods?: Array<MoneyMethod | 'deposit'>;
}

const METHODS = [
  { id: 'cash' as const, label: 'Nakit', sub: 'Kaptana elden teslim', emoji: '💵', color: '#10B981', colorBg: 'rgba(16,185,129,0.1)', needsProof: false },
  { id: 'eft'  as const, label: 'EFT / Havale', sub: 'Banka transferi — dekont gönder', emoji: '🏦', color: '#3B82F6', colorBg: 'rgba(59,130,246,0.1)', needsProof: true },
  { id: 'deposit' as const, label: 'Kapora', sub: 'Rezervasyon güvencesi (kısmi)', emoji: '🔒', color: '#F59E0B', colorBg: 'rgba(245,158,11,0.1)', needsProof: true },
  { id: 'card' as const, label: 'Kart (POS)', sub: 'Kredi / banka kartı', emoji: '💳', color: '#8B5CF6', colorBg: 'rgba(139,92,246,0.1)', needsProof: true },
  { id: 'partial' as const, label: 'Kısmi Ödeme', sub: 'Bir kısmını ver, geri kalan borçta kalır', emoji: '📊', color: '#EC4899', colorBg: 'rgba(236,72,153,0.1)', needsProof: false },
];

export const PaymentProofModal: React.FC<Props> = ({
  isOpen, onClose, onSubmit, expectedAmount, paidAmount = 0,
  memberName, reservationLabel, captainMode = false, availableMethods,
}) => {
  const remaining = Math.max(0, expectedAmount - paidAmount);
  const [step, setStep] = useState<'method'|'amount'|'proof'|'confirm'>('method');
  const [method, setMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState(remaining > 0 ? String(remaining) : '');
  const [proofUrl, setProofUrl] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredMethods = availableMethods
    ? METHODS.filter(m => (availableMethods as string[]).includes(m.id))
    : METHODS;

  const sel = METHODS.find(m => m.id === method);
  const parsedAmount = parseFloat(amount) || 0;
  const isPartial = parsedAmount > 0 && parsedAmount < remaining;

  const reset = () => {
    setStep('method'); setMethod(null);
    setAmount(remaining > 0 ? String(remaining) : '');
    setProofUrl(''); setProofFile(null); setNote(''); setSubmitting(false);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) return;
    setProofFile(file); setProofUrl('');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) handleFile(file);
  }, []);

  const handleSubmit = async () => {
    if (!method || parsedAmount <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ method: method as any, amount: parsedAmount, proofUrl: proofUrl || undefined, proofFile: proofFile || undefined, note: note || undefined, isPartial });
      reset(); onClose();
    } finally { setSubmitting(false); }
  };

  if (!isOpen) return null;
  const c = sel?.color ?? '#10B981';

  return (
    <>
      <style>{`
        @keyframes pm-up { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:none; } }
        @keyframes pm-bg { from { opacity:0; } to { opacity:1; } }
        @keyframes pm-st { from { opacity:0; transform:translateX(10px); } to { opacity:1; transform:none; } }
        .pm-sheet { animation: pm-up 0.32s cubic-bezier(0.16,1,0.3,1) both; }
        .pm-bg    { animation: pm-bg 0.2s ease both; }
        .pm-step  { animation: pm-st 0.22s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>
      <div className="pm-bg fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
        <div className="pm-sheet w-full max-w-md flex flex-col rounded-t-3xl overflow-hidden"
          style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none', maxHeight: '92dvh' }}>

          {/* Handle + progress */}
          <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
          </div>
          <div className="flex-shrink-0 flex items-center gap-1.5 px-5 pb-3">
            {['method','amount','proof','confirm'].map((s,i) => {
              const idx = ['method','amount','proof','confirm'].indexOf(step);
              return <div key={s} className="h-1 rounded-full flex-1 transition-all duration-300"
                style={{ background: i <= idx ? c : 'rgba(255,255,255,0.1)' }} />;
            })}
          </div>

          {/* Header */}
          <div className="flex-shrink-0 px-5 pb-4 flex items-start justify-between">
            <div>
              <h3 className="text-white text-lg font-black">{captainMode ? 'Ödeme Kaydet' : 'Ödeme Gönder'}</h3>
              <p className="text-slate-600 text-xs mt-0.5">
                {memberName && <span className="text-slate-400 font-bold">{memberName} · </span>}
                {reservationLabel ?? 'Rezervasyon ödemesi'}
              </p>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Summary bar */}
          <div className="flex-shrink-0 mx-5 mb-4 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-[9px] uppercase font-black tracking-widest">Toplam Pay</p>
                <p className="text-white text-xl font-black">₺{expectedAmount.toLocaleString('tr-TR')}</p>
              </div>
              {paidAmount > 0 && (
                <div className="text-right">
                  <p className="text-slate-600 text-[9px] uppercase font-black tracking-widest">Ödenen</p>
                  <p className="text-green-400 text-xl font-black">₺{paidAmount.toLocaleString('tr-TR')}</p>
                </div>
              )}
              {remaining > 0 && (
                <div className="text-right">
                  <p className="text-slate-600 text-[9px] uppercase font-black tracking-widest">Kalan</p>
                  <p className="text-yellow-400 text-xl font-black">₺{remaining.toLocaleString('tr-TR')}</p>
                </div>
              )}
            </div>
            {paidAmount > 0 && expectedAmount > 0 && (
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((paidAmount/expectedAmount)*100))}%`, background: '#10B981' }} />
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="flex-1 overflow-y-auto px-5 pb-8 min-h-0">

            {/* STEP 1: METHOD */}
            {step === 'method' && (
              <div className="pm-step space-y-2">
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-3">Ödeme yöntemini seç</p>
                {filteredMethods.map(m => (
                  <button key={m.id} onClick={() => { setMethod(m.id); setStep('amount'); }}
                    className="w-full text-left rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: m.colorBg }}>{m.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-sm">{m.label}</p>
                      <p className="text-slate-600 text-[10px] mt-0.5">{m.sub}</p>
                    </div>
                    {m.needsProof && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)' }}>DEKONT</span>}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M4 2.5l4 3.5-4 3.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* STEP 2: AMOUNT */}
            {step === 'amount' && sel && (
              <div className="pm-step space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: sel.colorBg, border: `1px solid ${sel.color}30` }}>
                  <span className="text-2xl">{sel.emoji}</span>
                  <div>
                    <p style={{ color: sel.color }} className="font-black text-sm">{sel.label}</p>
                    <p className="text-slate-600 text-[10px]">{sel.sub}</p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-2">Miktar (₺)</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-lg">₺</span>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={String(remaining)} autoFocus
                      className="w-full pl-9 pr-4 py-4 rounded-2xl text-white text-xl font-black focus:outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${parsedAmount > 0 ? sel.color : 'rgba(255,255,255,0.1)'}` }} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[...new Set([remaining, Math.round(remaining/2), 100, 200].filter(v => v > 0 && v <= remaining).map(v => Math.round(v)))].slice(0,4).map(v => (
                      <button key={v} onClick={() => setAmount(String(v))}
                        className="flex-1 py-2 rounded-xl text-[11px] font-black transition-all"
                        style={{ background: parsedAmount === v ? sel.color : 'rgba(255,255,255,0.05)', color: parsedAmount === v ? '#0d1117' : 'rgba(255,255,255,0.4)', border: `1px solid ${parsedAmount === v ? sel.color : 'rgba(255,255,255,0.08)'}` }}>
                        ₺{v}
                      </button>
                    ))}
                  </div>
                  {isPartial && <p className="text-yellow-400 text-[10px] mt-2">⚠ Kısmi ödeme: ₺{(remaining-parsedAmount).toFixed(0)} borçlu kalacak</p>}
                </div>
                <div>
                  <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-2">Not (opsiyonel)</p>
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ödeme notu..."
                    className="w-full px-4 py-3 rounded-2xl text-white text-sm focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep('method')} className="flex-1 py-3.5 rounded-2xl font-black text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>← Geri</button>
                  <button onClick={() => setStep(sel.needsProof ? 'proof' : 'confirm')} disabled={parsedAmount <= 0}
                    className="flex-[2] py-3.5 rounded-2xl font-black text-sm transition-all active:scale-[0.97]"
                    style={{ background: parsedAmount > 0 ? sel.color : 'rgba(255,255,255,0.06)', color: parsedAmount > 0 ? '#0d1117' : 'rgba(255,255,255,0.2)', boxShadow: parsedAmount > 0 ? `0 0 20px ${sel.color}40` : 'none' }}>
                    Devam →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PROOF */}
            {step === 'proof' && sel && (
              <div className="pm-step space-y-4">
                <div>
                  <p className="text-white font-black text-base mb-1">Dekont / Kanıt</p>
                  <p className="text-slate-600 text-[11px]">Link gir veya dosya yükle — opsiyonel, sonra da eklenebilir</p>
                </div>
                <div>
                  <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-2">Dekont linki</p>
                  <input value={proofUrl} onChange={e => { setProofUrl(e.target.value); setProofFile(null); }} placeholder="https://..."
                    className="w-full px-4 py-3 rounded-2xl text-white text-sm focus:outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${proofUrl ? sel.color : 'rgba(255,255,255,0.1)'}` }} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-slate-700 text-[10px] font-black uppercase">veya</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>
                {/* Drop zone */}
                <div onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className="rounded-2xl p-5 text-center cursor-pointer transition-all"
                  style={{ background: dragOver ? `${sel.color}18` : (proofFile ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)'), border: `1.5px dashed ${dragOver ? sel.color : (proofFile ? '#10B981' : 'rgba(255,255,255,0.1)')}` }}>
                  <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  {proofFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'rgba(16,185,129,0.1)' }}>📎</div>
                      <p className="text-green-400 font-bold text-sm">{proofFile.name}</p>
                      <p className="text-slate-600 text-[10px]">{(proofFile.size/1024).toFixed(0)} KB</p>
                      <button onClick={e => { e.stopPropagation(); setProofFile(null); }} className="text-red-400 text-[10px] font-bold">Kaldır</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 2v10M6 6l4-4 4 4M3 14v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-slate-500 text-xs font-bold">Dosya sürükle veya tıkla</p>
                      <p className="text-slate-700 text-[10px]">PNG, JPG, PDF · Max 10MB</p>
                    </div>
                  )}
                </div>
                <p className="text-slate-700 text-[10px] text-center">Dekont yoksa atla — sonra ödeme geçmişinden eklenebilir</p>
                <div className="flex gap-2">
                  <button onClick={() => setStep('amount')} className="flex-1 py-3.5 rounded-2xl font-black text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>← Geri</button>
                  <button onClick={() => setStep('confirm')} className="flex-[2] py-3.5 rounded-2xl font-black text-sm transition-all active:scale-[0.97]"
                    style={{ background: sel.color, color: '#0d1117', boxShadow: `0 0 20px ${sel.color}40` }}>
                    {proofUrl || proofFile ? 'Dekontu Ekle →' : 'Dekontsuz →'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: CONFIRM */}
            {step === 'confirm' && sel && (
              <div className="pm-step space-y-4">
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Özet — Onayla</p>
                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${sel.color}30`, background: `linear-gradient(135deg, ${sel.colorBg} 0%, rgba(255,255,255,0.01) 100%)` }}>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: sel.colorBg }}>{sel.emoji}</div>
                      <div>
                        <p className="text-white font-black text-sm">{sel.label}</p>
                        {memberName && <p className="text-slate-500 text-[10px]">{memberName}</p>}
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-[11px]">Tutar</span>
                        <span className="text-xl font-black" style={{ color: sel.color }}>₺{parsedAmount.toLocaleString('tr-TR')}</span>
                      </div>
                      {isPartial && <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-[11px]">Kalan borç</span>
                        <span className="text-yellow-400 font-bold text-sm">₺{(remaining-parsedAmount).toFixed(0)}</span>
                      </div>}
                      {(proofUrl || proofFile) && <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-[11px]">Dekont</span>
                        <span className="text-green-400 font-bold text-[11px]">{proofFile ? `📎 ${proofFile.name}` : '🔗 Link'}</span>
                      </div>}
                      {note && <div className="flex justify-between items-start gap-3">
                        <span className="text-slate-600 text-[11px] flex-shrink-0">Not</span>
                        <span className="text-slate-400 text-[11px] text-right">{note}</span>
                      </div>}
                    </div>
                  </div>
                </div>
                {captainMode && <div className="px-3.5 py-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <p className="text-yellow-400 text-[10px] font-bold">⚠ Kaptan adına kayıt. İşlem geri alınamaz.</p>
                </div>}
                <div className="flex gap-2">
                  <button onClick={() => setStep(sel.needsProof ? 'proof' : 'amount')} disabled={submitting} className="flex-1 py-3.5 rounded-2xl font-black text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>← Geri</button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex-[2] py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                    style={{ background: submitting ? 'rgba(255,255,255,0.06)' : sel.color, color: submitting ? 'rgba(255,255,255,0.3)' : '#0d1117', boxShadow: submitting ? 'none' : `0 0 24px ${sel.color}50` }}>
                    {submitting ? (<><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>Gönderiliyor…</>) : 'Onayla & Gönder ✓'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
