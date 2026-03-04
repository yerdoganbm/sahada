import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Reservation, WaitlistEntry, Player, ScreenName, AlternativeSlotOffer } from '../types';

interface Props {
  currentUser: Player;
  reservations: Reservation[];
  waitlist: WaitlistEntry[];
  onBack: () => void;
  onCancelReservation: (id: string, reason: string) => void;
  onAcceptWaitlistOffer: (waitlistEntryId: string, payMethod: 'credit_card' | 'bank_transfer' | 'cash') => void;
  onCancelWaitlist: (waitlistEntryId: string) => void;
  onAcceptAlternative: (reservationId: string, altIndex: number) => void;
  onRejectAlternative: (reservationId: string) => void;
  onNavigate: (screen: ScreenName) => void;
}

type Tab = 'reservations' | 'waitlist';
type PayMethod = 'credit_card' | 'bank_transfer' | 'cash';

export const MyReservations: React.FC<Props> = ({
  currentUser, reservations, waitlist, onBack,
  onCancelReservation, onAcceptWaitlistOffer, onCancelWaitlist,
  onAcceptAlternative, onRejectAlternative, onNavigate,
}) => {
  const [tab, setTab] = useState<Tab>('reservations');
  const [cancelModal, setCancelModal] = useState<{ id: string; policy?: { freeCancelUntilHours: number; latePenaltyPercent: number } } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [payModal, setPayModal] = useState<string | null>(null); // waitlist entry id
  const [payMethod, setPayMethod] = useState<PayMethod>('credit_card');
  const [altModal, setAltModal] = useState<string | null>(null); // reservation id

  // ── My reservations ──────────────────────────────────────────────────────────
  const myRes = useMemo(() =>
    reservations
      .filter(r => r.createdByUserId === currentUser.id || r.teamId === currentUser.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reservations, currentUser.id]
  );

  // ── My waitlist ──────────────────────────────────────────────────────────────
  const myWait = useMemo(() =>
    waitlist
      .filter(w => w.createdByUserId === currentUser.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [waitlist, currentUser.id]
  );

  const activeOffers = myWait.filter(w => w.status === 'offered');
  const altOffers = myRes.filter(r => r.alternativeOffer?.status === 'offered');
  const badgeCount = activeOffers.length + altOffers.length;

  const formatDate = (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // ── Countdown ────────────────────────────────────────────────────────────────
  const Countdown: React.FC<{ expiresAt: string }> = ({ expiresAt }) => {
    const [remaining, setRemaining] = React.useState('');
    React.useEffect(() => {
      const tick = () => {
        const diff = new Date(expiresAt).getTime() - Date.now();
        if (diff <= 0) { setRemaining('Süresi doldu'); return; }
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setRemaining(`${m}:${String(s).padStart(2, '0')}`);
      };
      tick();
      const iv = setInterval(tick, 1000);
      return () => clearInterval(iv);
    }, [expiresAt]);
    const isUrgent = new Date(expiresAt).getTime() - Date.now() < 5 * 60 * 1000;
    return (
      <span className={`font-mono font-black text-sm ${isUrgent ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
        {remaining}
      </span>
    );
  };

  // ── Status helpers ───────────────────────────────────────────────────────────
  const resStatusMap = {
    pending:   { label: 'Onay Bekliyor', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
    confirmed: { label: 'Onaylandı',     cls: 'bg-green-500/15  text-green-400  border-green-500/25' },
    cancelled: { label: 'İptal Edildi',  cls: 'bg-red-500/15    text-red-400    border-red-500/25' },
    completed: { label: 'Tamamlandı',    cls: 'bg-slate-500/15  text-slate-400  border-slate-500/25' },
  };
  const waitStatusMap = {
    waiting:   { label: 'Sırada',         cls: 'bg-blue-500/15    text-blue-400   border-blue-500/25' },
    offered:   { label: 'Teklif Geldi!',  cls: 'bg-yellow-500/15  text-yellow-400 border-yellow-500/25 animate-pulse' },
    accepted:  { label: 'Kabul Edildi',   cls: 'bg-green-500/15   text-green-400  border-green-500/25' },
    expired:   { label: 'Süresi Doldu',   cls: 'bg-slate-500/15   text-slate-400  border-slate-500/25' },
    cancelled: { label: 'İptal',          cls: 'bg-red-500/15     text-red-400    border-red-500/25' },
  };

  const canCancel = (r: Reservation) =>
    (r.status === 'pending' || r.status === 'confirmed') &&
    r.createdByUserId === currentUser.id;

  const calcRefundPreview = (r: Reservation) => {
    const policy = r.cancellationPolicy ?? { freeCancelUntilHours: 24, latePenaltyPercent: 100 };
    const resStart = new Date(`${r.date}T${r.startTime}:00`);
    const hoursUntil = (resStart.getTime() - Date.now()) / 3600000;
    if (!r.depositRequired || !r.depositAmount || r.paymentStatus !== 'paid') return null;
    if (hoursUntil >= policy.freeCancelUntilHours)
      return { full: true, refund: r.depositAmount, penalty: 0, policy };
    const penalty = Math.round(r.depositAmount * policy.latePenaltyPercent / 100);
    return { full: false, refund: r.depositAmount - penalty, penalty, policy };
  };

  return (
    <div className="bg-secondary min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/8 px-4 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-surface border border-white/8 flex items-center justify-center active:scale-95 transition-transform">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Rezervasyonlarım</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">{currentUser.name}</p>
          </div>
          {badgeCount > 0 && (
            <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-[10px] font-black text-white">{badgeCount}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {([['reservations','Rezervasyonlar', myRes.length], ['waitlist','Waitlist', myWait.filter(w=>w.status==='waiting'||w.status==='offered').length]] as [Tab,string,number][]).map(([t,label,cnt]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all flex-1 justify-center ${
                tab === t ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/8 bg-surface text-slate-400'
              }`}
            >
              {label}
              <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${tab===t?'bg-primary/20 text-primary':'bg-white/8 text-slate-500'}`}>{cnt}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* ── RESERVATIONS TAB ── */}
        {tab === 'reservations' && (
          myRes.length === 0
            ? <Empty icon="event_note" text="Henüz rezervasyonunuz yok" sub='Saha seçip rezervasyon yapabilirsiniz' action={{ label: 'Sahalar', fn: () => onNavigate('venues') }} />
            : myRes.map(r => {
                const st = resStatusMap[r.status];
                const refPreview = calcRefundPreview(r);
                const hasAltOffer = r.alternativeOffer?.status === 'offered';
                return (
                  <div key={r.id} className={`bg-surface rounded-2xl border p-4 transition-all ${hasAltOffer ? 'border-yellow-500/30' : 'border-white/6'}`}>
                    {/* Alt offer banner */}
                    {hasAltOffer && r.alternativeOffer && (
                      <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/25 rounded-xl px-3 py-2 mb-3">
                        <Icon name="swap_horiz" size={14} className="text-yellow-400 flex-shrink-0" />
                        <span className="text-[11px] text-yellow-300 flex-1">Saha sahibi alternatif saat önerdi!</span>
                        <Countdown expiresAt={r.alternativeOffer.expiresAt} />
                        <button onClick={() => setAltModal(r.id)} className="text-[10px] font-black text-yellow-400 bg-yellow-500/15 px-2 py-1 rounded-lg border border-yellow-500/25">İncele</button>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-bold text-white text-sm">{r.venueName}</h4>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${st.cls}`}>{st.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{formatDate(r.date)} · {r.startTime}–{r.endTime}</p>
                      </div>
                      <p className="text-lg font-black text-primary ml-2">{r.price.toLocaleString('tr-TR')}₺</p>
                    </div>

                    {/* Payment row */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3 flex-wrap">
                      <span className={r.paymentStatus === 'paid' ? 'text-green-400' : r.paymentStatus === 'refunded' ? 'text-blue-400' : 'text-orange-400'}>
                        {r.paymentStatus === 'paid' ? '✓ Ödendi' : r.paymentStatus === 'refunded' ? '↩ İade' : '⏳ Ödeme Bekliyor'}
                      </span>
                      {r.paymentMethod && <span>· {({ credit_card: 'Kart', bank_transfer: 'Havale', cash: 'Nakit' } as Record<string,string>)[r.paymentMethod]}</span>}
                      {r.depositRequired && r.depositAmount ? (
                        <span>· Kapora {r.depositAmount.toLocaleString('tr-TR')}₺ {r.depositPaidAt ? '✓' : '⏳'}</span>
                      ) : null}
                    </div>

                    {/* Refund / penalty info */}
                    {r.status === 'cancelled' && (r.refundedAmount !== undefined || r.penaltyAmount !== undefined) && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {(r.refundedAmount ?? 0) > 0 && <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-lg">↩ İade: {r.refundedAmount?.toLocaleString('tr-TR')}₺</span>}
                        {(r.penaltyAmount ?? 0) > 0 && <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg">⚠ Ceza: {r.penaltyAmount?.toLocaleString('tr-TR')}₺</span>}
                      </div>
                    )}

                    {/* Cancel button */}
                    {canCancel(r) && (
                      <button
                        onClick={() => { setCancelModal({ id: r.id, policy: r.cancellationPolicy }); setCancelReason(''); }}
                        className="w-full py-2 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/15 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Icon name="cancel" size={13} />
                        İptal Et
                        {refPreview && !refPreview.full && (
                          <span className="text-[9px] text-red-500 ml-1">({refPreview.policy.latePenaltyPercent}% ceza)</span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })
        )}

        {/* ── WAITLIST TAB ── */}
        {tab === 'waitlist' && (
          myWait.length === 0
            ? <Empty icon="queue" text="Waitlist'te değilsiniz" sub="Dolu slotlarda 'Waitlist'e Gir' butonunu kullanın" />
            : myWait.map(w => {
                const st = waitStatusMap[w.status];
                return (
                  <div key={w.id} className={`bg-surface rounded-2xl border p-4 ${w.status === 'offered' ? 'border-yellow-500/35' : 'border-white/6'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-bold text-white text-sm">{w.venueName}</h4>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${st.cls}`}>{st.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{formatDate(w.date)} · {w.startTime} · {w.durationMinutes} dk</p>
                      </div>
                    </div>

                    {/* Offered: countdown + accept */}
                    {w.status === 'offered' && w.offerExpiresAt && (
                      <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-3 mb-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-yellow-300 font-bold">Slot açıldı! Kabul süresi:</span>
                          <Countdown expiresAt={w.offerExpiresAt} />
                        </div>
                        <p className="text-[10px] text-slate-400">Süre dolarsa sıradaki kişiye teklif gönderilecek.</p>
                      </div>
                    )}

                    {w.status === 'offered' && (
                      <div className="flex gap-2">
                        <button onClick={() => onCancelWaitlist(w.id)}
                          className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold">
                          Vazgeç
                        </button>
                        <button onClick={() => { setPayModal(w.id); setPayMethod('credit_card'); }}
                          className="flex-1 py-2.5 rounded-xl bg-primary text-secondary text-xs font-black shadow-glow active:scale-[0.98]">
                          Kabul Et →
                        </button>
                      </div>
                    )}

                    {w.status === 'waiting' && (
                      <button onClick={() => onCancelWaitlist(w.id)}
                        className="w-full py-2 rounded-xl bg-white/4 border border-white/8 text-slate-400 text-xs font-bold">
                        Listeden Çık
                      </button>
                    )}

                    <p className="text-[9px] text-slate-600 mt-2">Oluşturuldu: {formatTime(w.createdAt)}</p>
                  </div>
                );
              })
        )}
      </div>

      {/* ── Cancel Modal ── */}
      {cancelModal && (
        <Modal onClose={() => setCancelModal(null)} title="Rezervasyonu İptal Et">
          {cancelModal.policy && (
            <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-3 mb-4">
              <p className="text-[11px] text-orange-300 font-bold mb-1">İptal Politikası</p>
              <p className="text-[10px] text-slate-400">Maçtan {cancelModal.policy.freeCancelUntilHours} saat öncesine kadar ücretsiz iptal.</p>
              <p className="text-[10px] text-slate-400">Geç iptalde kapora'nın %{cancelModal.policy.latePenaltyPercent}'i iade edilmez.</p>
            </div>
          )}
          <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
            placeholder="İptal nedeni..." rows={3}
            className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-red-500 resize-none mb-4" />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setCancelModal(null)} className="py-3 rounded-xl bg-surface border border-white/10 text-slate-400 font-bold text-sm">Vazgeç</button>
            <button onClick={() => { if (cancelReason.trim()) { onCancelReservation(cancelModal.id, cancelReason); setCancelModal(null); } }}
              disabled={!cancelReason.trim()}
              className="py-3 rounded-xl bg-red-500 text-white font-bold text-sm disabled:opacity-40">
              İptal Et
            </button>
          </div>
        </Modal>
      )}

      {/* ── Pay Method Modal (waitlist accept) ── */}
      {payModal && (
        <Modal onClose={() => setPayModal(null)} title="Ödeme Yöntemini Seç">
          <div className="space-y-2 mb-4">
            {([
              { id: 'credit_card' as PayMethod, icon: 'credit_card', label: 'Kredi / Banka Kartı', sub: 'Kapora anında tahsil → hard lock' },
              { id: 'bank_transfer' as PayMethod, icon: 'account_balance', label: 'Havale / EFT', sub: '15 dk içinde IBAN\'a gönder' },
              { id: 'cash' as PayMethod, icon: 'payments', label: 'Nakit', sub: 'Saha girişinde öde – 15 dk hold' },
            ]).map(opt => (
              <button key={opt.id} onClick={() => setPayMethod(opt.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${payMethod===opt.id?'border-primary/40 bg-primary/8':'border-white/8 bg-secondary'}`}>
                <Icon name={opt.icon} size={18} className={payMethod===opt.id?'text-primary':'text-slate-500'} />
                <div className="flex-1">
                  <p className={`text-sm font-bold ${payMethod===opt.id?'text-white':'text-slate-300'}`}>{opt.label}</p>
                  <p className="text-[10px] text-slate-500">{opt.sub}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${payMethod===opt.id?'border-primary bg-primary':'border-slate-600'}`}>
                  {payMethod===opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => { onAcceptWaitlistOffer(payModal, payMethod); setPayModal(null); }}
            className="w-full py-3.5 rounded-2xl bg-primary text-secondary font-black shadow-glow">
            Rezervasyon Oluştur
          </button>
        </Modal>
      )}

      {/* ── Alternative Offer Modal ── */}
      {altModal && (() => {
        const r = myRes.find(r => r.id === altModal);
        if (!r?.alternativeOffer) return null;
        const offer = r.alternativeOffer;
        return (
          <Modal onClose={() => setAltModal(null)} title="Alternatif Saatler">
            <div className="mb-3">
              <p className="text-[11px] text-slate-400 mb-1">Saha sahibinin önerdiği alternatif saatler:</p>
              {offer.expiresAt && <p className="text-[10px] text-yellow-400">Teklif geçerlilik: <Countdown expiresAt={offer.expiresAt} /></p>}
            </div>
            <div className="space-y-2 mb-4">
              {offer.alternatives.map((alt, i) => (
                <button key={i} onClick={() => { onAcceptAlternative(altModal, i); setAltModal(null); }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 bg-secondary hover:border-primary/40 hover:bg-primary/5 transition-all text-left group">
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                      {new Date(alt.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} · {alt.startTime}
                    </p>
                    <p className="text-[10px] text-slate-500">{alt.durationMinutes} dk</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-black">{alt.price.toLocaleString('tr-TR')}₺</p>
                    <p className="text-[9px] text-slate-600 group-hover:text-primary/60">Kabul Et →</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => { onRejectAlternative(altModal); setAltModal(null); }}
              className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 font-bold text-sm">
              Alternatifleri Reddet
            </button>
          </Modal>
        );
      })()}
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const Empty: React.FC<{ icon: string; text: string; sub: string; action?: { label: string; fn: () => void } }> = ({ icon, text, sub, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <Icon name={icon} size={56} className="text-slate-700 mb-4" />
    <p className="text-white font-bold mb-1">{text}</p>
    <p className="text-slate-500 text-xs mb-4">{sub}</p>
    {action && <button onClick={action.fn} className="text-primary text-sm font-bold">{action.label} →</button>}
  </div>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 p-5 shadow-2xl animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-black text-base">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
          <Icon name="close" size={16} className="text-slate-400" />
        </button>
      </div>
      {children}
    </div>
  </div>
);
