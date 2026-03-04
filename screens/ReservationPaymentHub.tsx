/**
 * ReservationPaymentHub — Kaptan ödeme merkezi
 * Tabs: Katkılar / Outbox / Sahaya Öde / Ledger / Özet
 */
import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Player, Reservation, CaptainPaymentPlan, MemberContribution, LedgerEntry, OutboxMessage, CaptainPayoutProfile, Venue, MatchRSVP, ScreenName, MoneyMethod } from '../types';

interface Props {
  currentUser: Player | null;
  reservations: Reservation[];
  captainPaymentPlans: CaptainPaymentPlan[];
  memberContributions: MemberContribution[];
  ledger: LedgerEntry[];
  outboxMessages: OutboxMessage[];
  captainPayoutProfiles: CaptainPayoutProfile[];
  venues: Venue[];
  matchRsvps: MatchRSVP[];
  navParams?: any;
  onBack: () => void;
  onNavigate: (s: ScreenName) => void;
  onRecordPayment: (teamId: string, resId: string, memberId: string, amount: number, method: MoneyMethod, note?: string) => void;
  onCaptainPayVenue: (resId: string, amount: number, method: MoneyMethod, note?: string) => void;
  onCopyOutbox: (id: string) => void;
}

type Tab = 'contributions' | 'outbox' | 'pay_venue' | 'ledger' | 'summary';

export const ReservationPaymentHub: React.FC<Props> = ({
  currentUser, reservations, captainPaymentPlans, memberContributions, ledger,
  outboxMessages, captainPayoutProfiles, venues, matchRsvps,
  navParams, onBack, onNavigate,
  onRecordPayment, onCaptainPayVenue, onCopyOutbox,
}) => {
  const [tab, setTab] = useState<Tab>('contributions');
  const [showPayModal, setShowPayModal] = useState<string | null>(null); // memberId
  const [payAmt, setPayAmt] = useState('');
  const [payMethod, setPayMethod] = useState<MoneyMethod>('eft');
  const [payNote, setPayNote] = useState('');
  const [venuePayAmt, setVenuePayAmt] = useState('');
  const [venuePayMethod, setVenuePayMethod] = useState<MoneyMethod>('eft');
  const [copied, setCopied] = useState<string | null>(null);

  const resId = navParams?.reservationId ?? reservations.find(r => r.isCaptainFlow)?.id ?? '';
  const reservation = reservations.find(r => r.id === resId);
  const plan = captainPaymentPlans.find(p => p.reservationId === resId);
  const contribs = memberContributions.filter(c => c.reservationId === resId);
  const resLedger = ledger.filter(l => l.reservationId === resId);
  const resOutbox = outboxMessages.filter(m => m.reservationId === resId);
  const venue = venues.find(v => v.id === reservation?.venueId);
  const rsvps = matchRsvps.filter(r => r.reservationId === resId);

  const totalCollected = contribs.reduce((s, c) => s + c.paidAmount, 0);
  const totalExpected = contribs.reduce((s, c) => s + c.expectedAmount, 0);
  const collectPct = totalExpected > 0 ? Math.min(100, Math.round((totalCollected / totalExpected) * 100)) : 0;
  const unpaidCount = contribs.filter(c => c.status !== 'paid').length;
  const goingCount = rsvps.filter(r => r.status === 'going').length;
  const captainProfile = captainPayoutProfiles.find(p => p.captainUserId === currentUser?.id);

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRecordPayment = (memberId: string, teamId: string) => {
    const amt = parseFloat(payAmt);
    if (!amt || amt <= 0) return;
    onRecordPayment(teamId, resId, memberId, amt, payMethod, payNote || undefined);
    setShowPayModal(null);
    setPayAmt(''); setPayNote('');
  };

  const handleVenuePay = () => {
    const amt = parseFloat(venuePayAmt);
    if (!amt || !reservation) return;
    onCaptainPayVenue(resId, amt, venuePayMethod);
    setVenuePayAmt('');
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'contributions', label: 'Katkılar', icon: 'people' },
    { key: 'outbox',        label: 'Mesajlar', icon: 'outbox' },
    { key: 'pay_venue',     label: 'Sahaya Öde', icon: 'payments' },
    { key: 'ledger',        label: 'Kayıtlar', icon: 'receipt_long' },
    { key: 'summary',       label: 'Özet', icon: 'bar_chart' },
  ];

  if (!reservation) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center p-6">
          <Icon name="event_busy" size={48} className="text-slate-700 mb-3 mx-auto" />
          <p className="text-slate-400">Rezervasyon bulunamadı.</p>
          <button onClick={onBack} className="mt-4 text-primary font-bold text-sm">← Geri Dön</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10 bg-secondary min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-0 border-b border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-white truncate">{reservation.venueName}</h1>
            <p className="text-xs text-slate-400">{reservation.date} · {reservation.startTime} · {reservation.price?.toLocaleString('tr-TR')}₺</p>
          </div>
          <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${reservation.status === 'confirmed' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
            {reservation.status === 'confirmed' ? 'Onaylı' : 'Onay Bekliyor'}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex gap-3 mb-1.5 text-[10px]">
            <span className="text-slate-500 flex-1">Toplama %{collectPct} · {totalCollected.toLocaleString('tr-TR')}₺ / {totalExpected.toLocaleString('tr-TR')}₺</span>
            {goingCount > 0 && <span className="text-primary">{goingCount} katılıyor</span>}
            {unpaidCount > 0 && <span className="text-red-400">{unpaidCount} eksik</span>}
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${collectPct >= 100 ? 'bg-primary' : collectPct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${collectPct}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1 px-2.5 py-2.5 border-b-2 text-[10px] font-black whitespace-nowrap transition-all ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-600 hover:text-white'}`}>
              <Icon name={t.icon} size={11} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">

        {/* ── CONTRIBUTIONS TAB ── */}
        {tab === 'contributions' && (
          <>
            {contribs.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Katkı kaydı yok</p>
            ) : (
              contribs.map(c => {
                const remaining = c.expectedAmount - c.paidAmount;
                const reminderText = `⚠️ Hatırlatma: ${reservation.date} ${reservation.startTime} maçı için ödemen eksik. Kalan: ${remaining}₺\nEFT: ${captainProfile?.iban ?? '—'}\nAçıklama: TEAM-${reservation.teamId}-RES-${resId}-U${c.memberUserId.slice(-3)}`;
                return (
                  <div key={c.id} className="bg-surface rounded-2xl border border-white/8 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                          <Icon name="person" size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold">{c.memberName || c.memberUserId}</p>
                          <p className="text-slate-500 text-[10px]">Beklenen: {c.expectedAmount}₺</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                        c.status === 'paid' ? 'bg-green-500/15 text-green-400' :
                        c.status === 'partial' ? 'bg-yellow-500/15 text-yellow-400' :
                        'bg-red-500/10 text-red-400'}`}>
                        {c.status === 'paid' ? 'Ödedi ✓' : c.status === 'partial' ? `Kısmi · ${c.paidAmount}₺` : 'Bekliyor'}
                      </span>
                    </div>

                    {c.status !== 'paid' && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setShowPayModal(c.memberUserId)}
                          className="flex-1 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-black">
                          + Ödeme Kaydet
                        </button>
                        <button onClick={() => copy(reminderText, `remind_${c.id}`)}
                          className={`px-3 py-2 rounded-xl border text-[10px] font-black transition-all ${copied === `remind_${c.id}` ? 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                          {copied === `remind_${c.id}` ? '✓' : '📋 Hatırlatma'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── OUTBOX TAB ── */}
        {tab === 'outbox' && (
          <>
            {resOutbox.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Outbox mesajı yok</p>
            ) : (
              resOutbox.map(msg => (
                <div key={msg.id} className="bg-surface rounded-2xl border border-white/8 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 text-xs">{msg.toLabel}</p>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${msg.status === 'copied' ? 'bg-green-500/15 text-green-400' : 'bg-slate-600/15 text-slate-500'}`}>
                      {msg.status === 'copied' ? 'Kopyalandı' : 'Taslak'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">{msg.body}</p>
                  <button onClick={() => { copy(msg.body, `out_${msg.id}`); onCopyOutbox(msg.id); }}
                    className={`w-full py-2 rounded-xl border text-xs font-black transition-all ${copied === `out_${msg.id}` ? 'bg-primary/15 border-primary/25 text-primary' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                    {copied === `out_${msg.id}` ? '✓ Kopyalandı' : <><Icon name="content_copy" size={11} className="inline mr-1" />Kopyala</>}
                  </button>
                </div>
              ))
            )}
          </>
        )}

        {/* ── PAY VENUE TAB ── */}
        {tab === 'pay_venue' && (
          <div className="space-y-3">
            {venue?.iban ? (
              <div className="bg-surface rounded-2xl border border-white/8 p-4 space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Saha IBAN Bilgisi</p>
                <p className="text-white font-bold text-sm">{venue.iban}</p>
                <p className="text-slate-400 text-xs">{venue.accountName} · {venue.bankName}</p>
                <button onClick={() => copy(venue.iban!, 'venue_iban')}
                  className={`w-full py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${copied === 'venue_iban' ? 'bg-primary/15 border-primary/25 text-primary' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                  {copied === 'venue_iban' ? '✓ Kopyalandı' : <><Icon name="content_copy" size={12} />IBAN Kopyala</>}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-yellow-500/8 border border-yellow-500/20 rounded-2xl">
                <p className="text-yellow-400 text-xs">Saha IBAN bilgisi eklenmemiş. Saha sahibi VenueSettings'ten ekleyebilir.</p>
              </div>
            )}

            <div className="bg-surface rounded-2xl border border-white/8 p-4 space-y-3">
              <p className="text-sm font-black text-white">Ödeme Kaydı</p>
              <div className="grid grid-cols-3 gap-2">
                {(['eft', 'cash', 'card'] as MoneyMethod[]).map(m => (
                  <button key={m} onClick={() => setVenuePayMethod(m)}
                    className={`py-2 rounded-xl border text-xs font-black transition-all ${venuePayMethod === m ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-secondary border-white/10 text-slate-400'}`}>
                    {m === 'eft' ? 'EFT' : m === 'cash' ? 'Nakit' : 'Kart'}
                  </button>
                ))}
              </div>
              <input value={venuePayAmt} onChange={e => setVenuePayAmt(e.target.value)} type="number"
                placeholder={`Tutar (toplam: ${reservation.price?.toLocaleString('tr-TR')}₺)`}
                className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary" />
              <button onClick={handleVenuePay} disabled={!venuePayAmt}
                className="w-full py-3 rounded-2xl bg-primary text-secondary font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                <Icon name="check_circle" size={16} /> Ödeme Kaydını Oluştur
              </button>
            </div>

            <div className="p-3 bg-surface rounded-xl border border-white/6">
              <p className="text-[9px] text-slate-500">Sahaya ödeme durumu: <span className={`font-bold ${reservation.venuePaymentStatus === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>{reservation.venuePaymentStatus ?? 'unpaid'}</span></p>
              {reservation.venuePaidTotal && <p className="text-[9px] text-slate-500">Ödenen: {reservation.venuePaidTotal}₺</p>}
            </div>
          </div>
        )}

        {/* ── LEDGER TAB ── */}
        {tab === 'ledger' && (
          <>
            {resLedger.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Henüz kayıt yok</p>
            ) : (
              resLedger.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 p-3.5 bg-surface rounded-2xl border border-white/6">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.direction === 'member_to_captain' ? 'bg-green-500/15' :
                    entry.direction === 'captain_to_venue' ? 'bg-blue-500/15' : 'bg-orange-500/15'}`}>
                    <Icon name={entry.direction === 'member_to_captain' ? 'arrow_downward' : 'arrow_upward'} size={14}
                      className={entry.direction === 'member_to_captain' ? 'text-green-400' : entry.direction === 'captain_to_venue' ? 'text-blue-400' : 'text-orange-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold">
                      {entry.direction === 'member_to_captain' ? `Üye ödedi (${entry.method})` :
                       entry.direction === 'captain_to_venue' ? `Sahaya ödendi (${entry.method})` :
                       `İade (${entry.method})`}
                    </p>
                    <p className="text-slate-500 text-[10px]">{new Date(entry.at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    {entry.note && <p className="text-slate-600 text-[9px]">{entry.note}</p>}
                  </div>
                  <span className={`font-black text-sm ${entry.direction === 'member_to_captain' ? 'text-green-400' : 'text-blue-400'}`}>
                    {entry.amount.toLocaleString('tr-TR')}₺
                  </span>
                </div>
              ))
            )}
          </>
        )}

        {/* ── SUMMARY TAB ── */}
        {tab === 'summary' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Toplam Hedef', val: `${totalExpected.toLocaleString('tr-TR')}₺`, color: 'text-white' },
                { label: 'Toplanan',     val: `${totalCollected.toLocaleString('tr-TR')}₺`, color: 'text-green-400' },
                { label: 'Eksik',        val: `${(totalExpected - totalCollected).toLocaleString('tr-TR')}₺`, color: 'text-red-400' },
                { label: 'RSVP Going',   val: `${goingCount} kişi`, color: 'text-primary' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-surface rounded-2xl border border-white/8 p-3 text-center">
                  <p className={`font-black text-lg ${kpi.color}`}>{kpi.val}</p>
                  <p className="text-slate-500 text-[9px] uppercase tracking-widest">{kpi.label}</p>
                </div>
              ))}
            </div>

            <button onClick={() => {
              const rows = [['Üye', 'Beklenen', 'Ödedi', 'Kalan', 'Durum'], ...contribs.map(c => [c.memberUserId, String(c.expectedAmount), String(c.paidAmount), String(c.expectedAmount - c.paidAmount), c.status])];
              const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
              const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `mac-odeme-${resId}.csv`; a.click();
            }} className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-black text-sm flex items-center justify-center gap-2">
              <Icon name="download" size={15} /> CSV İndir
            </button>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPayModal(null)}>
          <div className="w-full max-w-md bg-surface rounded-t-3xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-white">Ödeme Kaydet</h3>
            <p className="text-xs text-slate-400">Üye: {showPayModal}</p>
            <div className="grid grid-cols-3 gap-2">
              {(['eft', 'cash', 'card'] as MoneyMethod[]).map(m => (
                <button key={m} onClick={() => setPayMethod(m)}
                  className={`py-2.5 rounded-xl border text-xs font-black ${payMethod === m ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-secondary border-white/10 text-slate-400'}`}>
                  {m === 'eft' ? 'EFT' : m === 'cash' ? 'Nakit' : 'Kart'}
                </button>
              ))}
            </div>
            <input value={payAmt} onChange={e => setPayAmt(e.target.value)} type="number" placeholder="Tutar (₺)"
              className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2.5 text-white text-lg font-bold text-center focus:outline-none focus:border-primary" />
            <input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Not (opsiyonel)"
              className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowPayModal(null)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-bold">İptal</button>
              <button onClick={() => handleRecordPayment(showPayModal, reservation.teamId ?? '')} disabled={!payAmt}
                className="flex-1 py-3 rounded-xl bg-primary text-secondary font-black disabled:opacity-40">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
