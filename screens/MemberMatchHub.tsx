/**
 * MemberMatchHub — Üye için maç + ödeme tek ekranı
 * RSVP + IBAN kopyala + proof gönder + kaptan mesaj şablonu
 */
import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Match, Payment, Player, RsvpStatus, GuestSession } from '../types';

interface Props {
  match: Match;
  currentUser: Player | null;
  guestSession: GuestSession | null;
  payment: Payment | null;
  rsvpStatus: RsvpStatus;
  onBack: () => void;
  onRsvpChange: (status: RsvpStatus) => void;
  onUploadProof: (paymentId: string, proofUrl: string) => void;
  onSignUp: () => void;
  onOpenPaymentModal?: () => void;
}

const RSVP_OPTS: { status: RsvpStatus; label: string; icon: string; cls: string }[] = [
  { status: 'yes',   label: 'Katılıyorum', icon: 'check_circle', cls: 'bg-primary text-secondary' },
  { status: 'maybe', label: 'Belki',       icon: 'help_outline',  cls: 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400' },
  { status: 'no',    label: 'Katılmıyorum',icon: 'cancel',        cls: 'bg-red-500/15 border border-red-500/20 text-red-400' },
];

export const MemberMatchHub: React.FC<Props> = ({
  match, currentUser, guestSession, payment, rsvpStatus,
  onBack, onRsvpChange, onUploadProof, onSignUp, onOpenPaymentModal,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [proofDone, setProofDone] = useState(false);

  const isGuest = !currentUser && !!guestSession;
  const displayName = currentUser?.name ?? guestSession?.displayName ?? '?';

  const iban = match.iban ?? 'TR33 0006 1005 1978 6457 8413 26';
  const ibanHolder = match.ibanHolder ?? 'Takım Kaptanı';
  const amount = match.pricePerPerson;
  const desc = match.matchDescription ?? `Sahada FC Maç Katılım ${match.date}`;

  const dueDate = match.dueAt ? new Date(match.dueAt) : null;
  const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / 86400000) : null;

  // Build "copy all" text
  const copyAllText = `IBAN: ${iban}\nHesap Sahibi: ${ibanHolder}\nTutar: ${amount} TL\nAçıklama: ${desc}`;

  // Captain message template
  const captainMsgText = `Merhaba Kaptan! 👋\n${displayName} olarak ${match.date} ${match.time} maçına RSVP verdim.\nÖdemeyi ${iban} numaralı hesaba "${desc}" açıklamasıyla ${amount}₺ göndereceğim. ✅`;

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUploadProof = () => {
    if (!payment || isGuest) return;
    setUploadLoading(true);
    setTimeout(() => {
      const fakeUrl = `https://receipts.sahada.app/proof_${Date.now()}.jpg`;
      onUploadProof(payment.id, fakeUrl);
      setUploadLoading(false);
      setProofDone(true);
    }, 1500);
  };

  const paymentStatusMeta = {
    paid:             { label: 'Ödendi ✓',      cls: 'bg-green-500/15 border-green-500/25 text-green-400' },
    waiting_approval: { label: 'Onay Bekliyor', cls: 'bg-blue-500/15 border-blue-500/25 text-blue-400' },
    pending:          { label: 'Ödeme Bekliyor', cls: 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400' },
    failed:           { label: 'Başarısız',      cls: 'bg-red-500/15 border-red-500/25 text-red-400' },
    refund:           { label: 'İade Edildi',    cls: 'bg-slate-500/15 border-slate-500/25 text-slate-400' },
  };
  const pMeta = payment ? (paymentStatusMeta[payment.status] ?? paymentStatusMeta.pending) : paymentStatusMeta.pending;

  return (
    <div className="bg-secondary min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/8 px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-surface border border-white/8 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Maç Bilgileri</h1>
            <p className="text-[10px] text-slate-500">{match.date} · {match.time} · {match.location}</p>
          </div>
          {isGuest && (
            <button onClick={onSignUp} className="px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/25 text-primary text-xs font-bold">
              Hesap Oluştur
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-6">
        {/* Match card */}
        <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-2xl border border-primary/15 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="sports_soccer" size={18} className="text-primary" />
            <span className="text-sm font-black text-white">{match.date} — {match.time}</span>
            {match.status === 'upcoming' && (
              <span className="ml-auto text-[9px] font-black bg-green-500/15 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-lg">YAKLAŞAN</span>
            )}
          </div>
          <p className="text-slate-300 text-sm mb-1 flex items-center gap-1.5">
            <Icon name="place" size={13} className="text-slate-500" />{match.location}
          </p>
          {match.opponent && (
            <p className="text-slate-400 text-xs flex items-center gap-1.5">
              <Icon name="shield" size={12} className="text-slate-600" />Rakip: {match.opponent}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 bg-secondary rounded-xl p-2.5 border border-white/6 text-center">
              <p className="text-xl font-black text-primary">{amount}₺</p>
              <p className="text-[9px] text-slate-500 uppercase">Kişi Başı</p>
            </div>
            {daysLeft !== null && daysLeft >= 0 && (
              <div className={`flex-1 rounded-xl p-2.5 border text-center ${daysLeft <= 1 ? 'bg-red-500/8 border-red-500/15' : 'bg-secondary border-white/6'}`}>
                <p className={`text-xl font-black ${daysLeft <= 1 ? 'text-red-400' : 'text-white'}`}>{daysLeft}</p>
                <p className="text-[9px] text-slate-500 uppercase">Gün Kaldı</p>
              </div>
            )}
            {payment && (
              <div className="flex-1">
                <span className={`text-[10px] font-black px-2.5 py-2 rounded-xl border block text-center ${pMeta.cls}`}>{pMeta.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* RSVP */}
        {match.status === 'upcoming' && (
          <div className="bg-surface rounded-2xl border border-white/6 p-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Katılım Durumu</p>
            <div className="grid grid-cols-3 gap-2">
              {RSVP_OPTS.map(opt => (
                <button key={opt.status}
                  onClick={() => onRsvpChange(opt.status)}
                  className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                    rsvpStatus === opt.status ? opt.cls : 'bg-secondary border-white/8 text-slate-500 hover:border-white/15'
                  }`}>
                  <Icon name={opt.icon} size={16} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payment info — always visible */}
        <div className="bg-surface rounded-2xl border border-white/6 p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ödeme Bilgisi</p>
            <button onClick={() => copy(copyAllText, 'all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${
                copiedField === 'all' ? 'bg-green-500/15 border-green-500/25 text-green-400' : 'bg-primary/10 border-primary/20 text-primary'
              }`}>
              <Icon name={copiedField === 'all' ? 'check' : 'content_copy'} size={12} />
              {copiedField === 'all' ? 'Kopyalandı!' : 'Hepsini Kopyala'}
            </button>
          </div>

          {/* IBAN row */}
          <div className="bg-secondary rounded-xl p-3 border border-white/6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-slate-500 uppercase font-black">IBAN</span>
              <button onClick={() => copy(iban.replace(/\s/g,''), 'iban')}
                className={`flex items-center gap-1 text-[9px] font-black transition-all ${copiedField === 'iban' ? 'text-green-400' : 'text-primary'}`}>
                <Icon name={copiedField === 'iban' ? 'check' : 'content_copy'} size={10} />
                {copiedField === 'iban' ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
            <p className="text-white font-black font-mono tracking-wide text-sm">{iban}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{ibanHolder}</p>
          </div>

          {/* Amount */}
          <div className="bg-secondary rounded-xl p-3 border border-white/6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-slate-500 uppercase font-black">Tutar</span>
              <button onClick={() => copy(String(amount), 'amount')}
                className={`flex items-center gap-1 text-[9px] font-black transition-all ${copiedField === 'amount' ? 'text-green-400' : 'text-primary'}`}>
                <Icon name={copiedField === 'amount' ? 'check' : 'content_copy'} size={10} />
                {copiedField === 'amount' ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
            <p className="text-2xl font-black text-primary">{amount} ₺</p>
          </div>

          {/* Description */}
          <div className="bg-secondary rounded-xl p-3 border border-white/6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-slate-500 uppercase font-black">Açıklama</span>
              <button onClick={() => copy(desc, 'desc')}
                className={`flex items-center gap-1 text-[9px] font-black transition-all ${copiedField === 'desc' ? 'text-green-400' : 'text-primary'}`}>
                <Icon name={copiedField === 'desc' ? 'check' : 'content_copy'} size={10} />
                {copiedField === 'desc' ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
            <p className="text-white text-sm font-bold">{desc}</p>
          </div>
        </div>

        {/* Captain message template */}
        <div className="bg-surface rounded-2xl border border-white/6 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Kaptan Mesajı</p>
            <button onClick={() => copy(captainMsgText, 'captain')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${
                copiedField === 'captain' ? 'bg-green-500/15 border-green-500/25 text-green-400' : 'bg-green-500/8 border-green-500/15 text-green-400'
              }`}>
              <Icon name={copiedField === 'captain' ? 'check' : 'chat_bubble'} size={12} />
              {copiedField === 'captain' ? 'Kopyalandı!' : 'WhatsApp Şablonu'}
            </button>
          </div>
          <div className="bg-secondary rounded-xl p-3 border border-white/6">
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{captainMsgText}</p>
          </div>
        </div>

        {/* Proof upload / Guest CTA */}
        {match.status === 'upcoming' && (
          <div className="bg-surface rounded-2xl border border-white/6 p-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Ödeme Kanıtı</p>
            {isGuest ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-yellow-500/8 border border-yellow-500/15 rounded-xl">
                  <Icon name="lock" size={13} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300">Ödeme kanıtı göndermek için hesap gerekli.</p>
                </div>
                <button onClick={onSignUp}
                  className="w-full py-3.5 rounded-2xl bg-primary text-secondary font-black shadow-glow">
                  Hesap Oluştur → Proof Gönder
                </button>
              </div>
            ) : proofDone || payment?.proofUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-green-500/8 border border-green-500/15 rounded-xl">
                  <Icon name="check_circle" size={16} className="text-green-400" />
                  <div>
                    <p className="text-sm font-bold text-green-400">Kanıt Gönderildi ✓</p>
                    <p className="text-[10px] text-slate-500">Kaptan onayı bekleniyor</p>
                  </div>
                </div>
                {onOpenPaymentModal && (
                  <button onClick={onOpenPaymentModal}
                    className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-white/8 transition-all">
                    <Icon name="add" size={14} /> Yeni Dekont Ekle
                  </button>
                )}
              </div>
            ) : (
              <button onClick={onOpenPaymentModal ?? handleUploadProof} disabled={uploadLoading && !onOpenPaymentModal}
                className="w-full py-3.5 rounded-2xl bg-primary/15 border border-primary/25 text-primary font-black flex items-center justify-center gap-2 transition-all active:scale-[0.97]">
                <Icon name="payments" size={16} />Ödeme / Dekont Gönder
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
