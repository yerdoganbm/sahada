import React from 'react';
import { Icon } from '../components/Icon';
import { Reservation, Player, Venue, AlternativeSlotOffer, MessageTemplate, OutboxMessage } from '../types';

interface ReservationDetailsProps {
  reservation: Reservation;
  onBack: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onMarkPaid?: (id: string) => void;
  onProposeAlternative?: (id: string, alternatives: AlternativeSlotOffer['alternatives']) => void;
  onCheckIn?: (id: string, code: string) => boolean;
  onMarkNoShow?: (id: string, reason: string) => void;
  onCopyMessage?: (outboxId: string, body: string) => void;
  onCreateOutbox?: (msg: Omit<OutboxMessage, 'id' | 'createdAt' | 'status' | 'createdByUserId'>) => void;
  messageTemplates?: MessageTemplate[];
  renderTemplate?: (body: string, vars: Record<string, string>) => string;
  currentUser?: Player | null;
  venues?: Venue[];
  existingReservations?: Reservation[];
}

export const ReservationDetails: React.FC<ReservationDetailsProps> = ({
  reservation: r, onBack, onApprove, onReject, onMarkPaid, onProposeAlternative,
  onCheckIn, onMarkNoShow, onCopyMessage, onCreateOutbox, messageTemplates = [], renderTemplate,
  currentUser, venues = [], existingReservations = [],
}) => {
  const [rejectReason, setRejectReason] = React.useState('');
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [showAltModal, setShowAltModal] = React.useState(false);
  const [checkInCode, setCheckInCode] = React.useState('');
  const [checkInError, setCheckInError] = React.useState('');
  const [checkInSuccess, setCheckInSuccess] = React.useState(false);
  const [noShowReason, setNoShowReason] = React.useState('');
  const [showNoShowModal, setShowNoShowModal] = React.useState(false);
  const [showMsgPanel, setShowMsgPanel] = React.useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = React.useState('');
  const [msgPreview, setMsgPreview] = React.useState('');
  const [msgCopied, setMsgCopied] = React.useState(false);

  // Alternative slot builder state
  const [altSlots, setAltSlots] = React.useState<Array<{ date: string; startTime: string; durationMinutes: number; price: number }>>([
    { date: '', startTime: '18:00', durationMinutes: 90, price: r.price },
  ]);

  const addAltSlot = () => {
    if (altSlots.length >= 3) return;
    setAltSlots(prev => [...prev, { date: '', startTime: '20:00', durationMinutes: 90, price: r.price }]);
  };

  const updateAlt = (i: number, key: string, val: string | number) => {
    setAltSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s));
  };

  const canSubmitAlts = altSlots.some(s => s.date && s.startTime);

  const handleReject = () => {
    if (rejectReason.trim() && onReject) {
      onReject(r.id, rejectReason);
      setShowRejectModal(false);
      onBack();
    }
  };

  const handleApprove = () => {
    if (onApprove) { onApprove(r.id); onBack(); }
  };

  const handleMarkPaid = () => {
    if (onMarkPaid) { onMarkPaid(r.id); }
  };

  // ── Check-in logic ───────────────────────────────────────────────────────────
  const handleCheckInVerify = () => {
    if (!onCheckIn) return;
    const ok = onCheckIn(r.id, checkInCode.trim());
    if (ok) { setCheckInSuccess(true); setCheckInError(''); }
    else { setCheckInError('Kod eşleşmedi. Tekrar deneyin.'); }
  };

  const handleNoShowConfirm = () => {
    if (onMarkNoShow && noShowReason.trim()) {
      onMarkNoShow(r.id, noShowReason);
      setShowNoShowModal(false);
    }
  };

  // ── Messaging logic ────────────────────────────────────────────────────────
  const templateVars: Record<string, string> = {
    customerName: r.customerName || r.teamName || '',
    venueName: r.venueName,
    date: new Date(r.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
    time: r.startTime,
    depositAmount: String(r.depositAmount ?? 0),
    checkInCode: r.checkInCode ?? '------',
    iban: 'TR33 0006 1005 1978 6457 8413 26',
  };

  const handleTemplateSelect = (key: string) => {
    setSelectedTemplateKey(key);
    const tpl = messageTemplates.find(t => t.key === key);
    if (tpl && renderTemplate) {
      setMsgPreview(renderTemplate(tpl.body, templateVars));
    }
    setMsgCopied(false);
  };

  const handleCopyMsg = () => {
    if (!msgPreview || !onCreateOutbox || !onCopyMessage) return;
    navigator.clipboard?.writeText(msgPreview).catch(() => {});
    const phone = r.customerPhone || r.contactPhone;
    const msgId = `om_${Date.now()}`;
    onCreateOutbox({
      venueId: r.venueId,
      toLabel: r.customerName || r.teamName,
      phone,
      templateKey: selectedTemplateKey as any,
      body: msgPreview,
    });
    onCopyMessage(msgId, msgPreview);
    setMsgCopied(true);
  };

  // ── Format duration ─────────────────────────────────────────────────────────
  const formatDuration = (dk: number): string => {
    if (dk < 60) return `${dk} dakika`;
    const h = Math.floor(dk / 60);
    const m = dk % 60;
    return m === 0 ? `${h} saat` : `${h} saat ${m} dakika`;
  };

  const statusColors = {
    pending:   'bg-yellow-500/20 text-yellow-500',
    confirmed: 'bg-green-500/20 text-green-500',
    cancelled: 'bg-red-500/20 text-red-500',
    completed: 'bg-slate-500/20 text-slate-400',
  };
  const statusLabels = {
    pending:   'Onay Bekliyor',
    confirmed: 'Onaylandı',
    cancelled: 'İptal Edildi',
    completed: 'Tamamlandı',
  };
  const paymentColors = { pending: 'text-yellow-500', paid: 'text-green-500', refunded: 'text-red-500' };
  const paymentLabels = { pending: 'Ödeme Bekliyor', paid: 'Ödendi', refunded: 'İade Edildi' };
  const methodLabels = { credit_card: 'Kredi / Banka Kartı', bank_transfer: 'Havale / EFT', cash: 'Nakit' };

  const holdExpired = r.holdExpiresAt ? new Date(r.holdExpiresAt) < new Date() : false;
  const showMarkPaid = r.status === 'pending' && r.paymentStatus !== 'paid' &&
    (r.paymentMethod === 'bank_transfer' || r.paymentMethod === 'cash') && !holdExpired;

  return (
    <div className="pb-8 bg-secondary min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Rezervasyon Detayı</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* Status card */}
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${statusColors[r.status]}`}>
              {statusLabels[r.status]}
            </span>
            <span className="text-[10px] text-slate-600 font-mono">#{r.id.slice(-8)}</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-0.5">{r.teamName}</h2>
          <p className="text-slate-400 text-sm">{r.venueName}</p>
        </div>

        {/* Date & Time */}
        <SectionCard title="Tarih ve Saat" icon="event">
          <Row label="Tarih" value={new Date(r.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} />
          <Row label="Saat" value={`${r.startTime} – ${r.endTime}`} />
          <Row label="Süre" value={formatDuration(r.duration)} />
          <Row label="Katılımcı" value={`${r.participants} kişi`} />
        </SectionCard>

        {/* Payment */}
        <SectionCard title="Ödeme Bilgileri" icon="payments">
          <Row label="Tutar" value={`${r.price.toLocaleString('tr-TR')} ₺`} bold />
          <Row label="Durum">
            <span className={`font-bold text-sm ${paymentColors[r.paymentStatus]}`}>{paymentLabels[r.paymentStatus]}</span>
          </Row>
          {r.paymentMethod && (
            <Row label="Yöntem" value={methodLabels[r.paymentMethod]} />
          )}
          {/* Deposit block */}
          {r.depositRequired && r.depositAmount ? (
            <div className={`mt-3 rounded-xl p-3 border ${r.depositPaidAt ? 'bg-green-500/8 border-green-500/20' : 'bg-yellow-500/8 border-yellow-500/20'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon name={r.depositPaidAt ? 'check_circle' : 'payments'} size={15} className={r.depositPaidAt ? 'text-green-400' : 'text-yellow-400'} />
                  <span className={`text-xs font-bold ${r.depositPaidAt ? 'text-green-300' : 'text-yellow-300'}`}>
                    Kapora: {r.depositAmount.toLocaleString('tr-TR')}₺
                  </span>
                </div>
                <span className={`text-[10px] font-black ${r.depositPaidAt ? 'text-green-400' : 'text-yellow-500'}`}>
                  {r.depositPaidAt ? 'Ödendi ✓' : 'Bekleniyor'}
                </span>
              </div>
              {r.depositPaidAt && (
                <p className="text-[10px] text-slate-400 ml-5">
                  {new Date(r.depositPaidAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {r.cancellationPolicy && (
                <p className="text-[10px] text-slate-500 mt-1.5 ml-0.5">
                  {r.cancellationPolicy.freeCancelUntilHours}s öncesine kadar ücretsiz iptal •
                  Geç iptalde %{r.cancellationPolicy.latePenaltyPercent} kapora iade edilmez
                </p>
              )}
            </div>
          ) : null}

          {/* Hold info */}
          {r.holdExpiresAt && r.paymentStatus !== 'paid' && (
            <div className={`mt-2 flex items-center gap-2 rounded-xl px-3 py-2 border ${holdExpired ? 'bg-red-500/8 border-red-500/20' : 'bg-slate-500/8 border-slate-500/20'}`}>
              <Icon name={holdExpired ? 'timer_off' : 'hourglass_bottom'} size={13} className={holdExpired ? 'text-red-400' : 'text-slate-400'} />
              <span className={`text-[10px] font-bold ${holdExpired ? 'text-red-400' : 'text-slate-400'}`}>
                {holdExpired ? 'Hold süresi doldu' : `Hold bitiş: ${new Date(r.holdExpiresAt).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            </div>
          )}
        </SectionCard>

        {/* Contact */}
        <SectionCard title="İletişim" icon="person">
          <Row label="İsim"   value={r.contactPerson} />
          <Row label="Telefon" value={r.contactPhone} />
        </SectionCard>

        {/* Notes */}
        {r.notes && (
          <SectionCard title="Not" icon="description">
            <p className="text-slate-300 text-sm leading-relaxed">{r.notes}</p>
          </SectionCard>
        )}

        {/* Cancel reason */}
        {r.status === 'cancelled' && r.cancelReason && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="cancel" size={16} className="text-red-500" />
              <span className="text-red-500 font-bold text-sm">İptal Nedeni</span>
            </div>
            <p className="text-red-300 text-sm">{r.cancelReason}</p>
          </div>
        )}

        {/* Timestamps */}
        <SectionCard title="Zaman Damgaları" icon="schedule">
          <Row label="Oluşturulma" value={new Date(r.createdAt).toLocaleString('tr-TR')} />
          {r.confirmedAt  && <Row label="Onaylanma" value={new Date(r.confirmedAt).toLocaleString('tr-TR')} />}
          {r.cancelledAt  && <Row label="İptal"     value={new Date(r.cancelledAt).toLocaleString('tr-TR')} />}
          {r.refundedAt   && <Row label="İade"      value={new Date(r.refundedAt).toLocaleString('tr-TR')} />}
          {r.recurringRuleId && <Row label="Kaynak" value="🔁 Sabit Rezervasyon" />}
        </SectionCard>

        {/* ── Check-in Panel ── */}
        {r.status === 'confirmed' && r.checkInStatus && r.checkInStatus !== 'not_started' && (
          <SectionCard title="Check-in" icon="qr_code_2">
            <div className="space-y-3">
              {/* Status badge */}
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${
                r.checkInStatus === 'checked_in'  ? 'bg-green-500/8 border-green-500/20' :
                r.checkInStatus === 'no_show'     ? 'bg-red-500/8 border-red-500/20' :
                                                    'bg-yellow-500/8 border-yellow-500/20'
              }`}>
                <Icon name={r.checkInStatus === 'checked_in' ? 'check_circle' : r.checkInStatus === 'no_show' ? 'cancel' : 'schedule'} size={16}
                  className={r.checkInStatus === 'checked_in' ? 'text-green-400' : r.checkInStatus === 'no_show' ? 'text-red-400' : 'text-yellow-400'} />
                <span className="text-sm font-bold text-white">
                  {{ not_started: 'Bekleniyor', ready: 'Hazır – Kod Üretildi', checked_in: 'Check-in Yapıldı ✓', no_show: 'No-show ✗' }[r.checkInStatus]}
                </span>
              </div>

              {/* Code display */}
              {r.checkInCode && (r.checkInStatus === 'ready' || r.checkInStatus === 'checked_in') && (
                <div className="bg-secondary rounded-xl p-3 flex items-center justify-between border border-white/8">
                  <span className="text-xs text-slate-400">Check-in Kodu</span>
                  <span className="text-2xl font-black text-primary font-mono tracking-widest">{r.checkInCode}</span>
                </div>
              )}

              {/* Code verify */}
              {r.checkInStatus === 'ready' && onCheckIn && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input value={checkInCode} onChange={e => setCheckInCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                      placeholder="Müşteri kodunu gir" maxLength={6}
                      className="flex-1 bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-primary" />
                    <button onClick={handleCheckInVerify}
                      disabled={checkInCode.length < 6}
                      className="px-4 py-2.5 rounded-xl bg-primary text-secondary font-bold text-sm disabled:opacity-40">
                      Doğrula
                    </button>
                  </div>
                  {checkInError && <p className="text-xs text-red-400">{checkInError}</p>}
                  {checkInSuccess && <p className="text-xs text-green-400">✓ Check-in başarılı!</p>}
                </div>
              )}

              {/* No-show button */}
              {(r.checkInStatus === 'ready') && onMarkNoShow && (() => {
                const start = new Date(`${r.date}T${r.startTime}:00`);
                const minsLate = (Date.now() - start.getTime()) / 60000;
                if (minsLate < 15) return null;
                return (
                  <button onClick={() => setShowNoShowModal(true)}
                    className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5">
                    <Icon name="person_off" size={13} />
                    No-show İşaretle ({Math.floor(minsLate)} dk geç)
                  </button>
                );
              })()}
            </div>
          </SectionCard>
        )}

        {/* ── Mesajlar Panel ── */}
        {messageTemplates.length > 0 && onCreateOutbox && (
          <div>
            <button onClick={() => setShowMsgPanel(!showMsgPanel)}
              className="w-full flex items-center justify-between p-4 bg-surface rounded-2xl border border-white/6 hover:border-white/12 transition-all">
              <div className="flex items-center gap-2">
                <Icon name="chat_bubble" size={16} className="text-green-400" />
                <span className="text-sm font-bold text-white">WhatsApp Mesajları</span>
              </div>
              <Icon name={showMsgPanel ? 'expand_less' : 'expand_more'} size={16} className="text-slate-400" />
            </button>
            {showMsgPanel && (
              <div className="mt-2 bg-surface rounded-2xl border border-white/6 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {messageTemplates.map(tpl => (
                    <button key={tpl.key} onClick={() => handleTemplateSelect(tpl.key)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold text-left transition-all ${
                        selectedTemplateKey === tpl.key ? 'border-green-500/40 bg-green-500/8 text-green-400' : 'border-white/8 bg-secondary text-slate-400 hover:border-white/15'
                      }`}>
                      {tpl.title}
                    </button>
                  ))}
                </div>
                {msgPreview && (
                  <div className="bg-secondary rounded-xl p-3 border border-white/8">
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{msgPreview}</p>
                  </div>
                )}
                {msgPreview && (
                  <button onClick={handleCopyMsg}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      msgCopied ? 'bg-green-500/15 border border-green-500/25 text-green-400' : 'bg-green-500 text-white shadow-lg'
                    }`}>
                    <Icon name={msgCopied ? 'check' : 'content_copy'} size={15} />
                    {msgCopied ? 'Kopyalandı ✓' : 'Kopyala & Outbox\'a Ekle'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {r.status === 'pending' && (
          <div className="space-y-2">
            {showMarkPaid && (
              <button onClick={handleMarkPaid}
                className="w-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 py-3.5 rounded-2xl font-bold text-sm hover:bg-yellow-500/25 transition-colors flex items-center justify-center gap-2">
                <Icon name="payments" size={16} />
                Kapora Geldi — Ödemeyi Onayla
              </button>
            )}
            {/* Alternative offer banner if already proposed */}
            {r.alternativeOffer && (
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${
                r.alternativeOffer.status === 'offered' ? 'bg-yellow-500/8 border-yellow-500/20' :
                r.alternativeOffer.status === 'accepted' ? 'bg-green-500/8 border-green-500/20' :
                'bg-slate-500/8 border-slate-500/20'
              }`}>
                <Icon name="swap_horiz" size={14} className={r.alternativeOffer.status==='offered'?'text-yellow-400':'text-slate-400'} />
                <span className="text-[11px] text-slate-300">
                  Alternatif teklif: <strong>{
                    {offered:'Kullanıcı yanıtı bekleniyor', accepted:'Kabul edildi ✓', expired:'Süresi doldu', rejected:'Reddedildi'}[r.alternativeOffer.status]
                  }</strong>
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowRejectModal(true)}
                className="bg-red-500/20 border border-red-500/30 text-red-500 py-4 rounded-2xl font-bold hover:bg-red-500/30 transition-colors">
                Reddet
              </button>
              <button onClick={handleApprove}
                className="bg-primary text-secondary py-4 rounded-2xl font-bold hover:bg-green-500 transition-colors shadow-glow">
                Onayla
              </button>
            </div>
            {onProposeAlternative && !r.alternativeOffer && (
              <button onClick={() => setShowAltModal(true)}
                className="w-full bg-yellow-500/10 border border-yellow-500/25 text-yellow-300 py-3.5 rounded-2xl font-bold text-sm hover:bg-yellow-500/15 transition-colors flex items-center justify-center gap-2">
                <Icon name="swap_horiz" size={16} />
                Reddetmek Yerine Alternatif Öner
              </button>
            )}
          </div>
        )}
      </div>

      {/* No-Show Modal */}
      {showNoShowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface w-full max-w-sm rounded-3xl border border-white/10 p-5 shadow-2xl animate-slide-up">
            <h3 className="text-white font-black text-base mb-3">No-show İşaretle</h3>
            <p className="text-slate-400 text-xs mb-3">Neden gelmediler?</p>
            <div className="space-y-2 mb-4">
              {['Haber vermedi','Ödeme yapılmadı','Doğal afet/ulaşım','Diğer'].map(reason => (
                <button key={reason} onClick={() => setNoShowReason(reason)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-left transition-all ${noShowReason === reason ? 'border-red-500/40 bg-red-500/10 text-red-300 font-bold' : 'border-white/8 bg-secondary text-slate-400'}`}>
                  {reason}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowNoShowModal(false)} className="py-3 rounded-xl bg-secondary border border-white/10 text-slate-400 font-bold text-sm">Vazgeç</button>
              <button onClick={handleNoShowConfirm} disabled={!noShowReason}
                className="py-3 rounded-xl bg-red-500 text-white font-bold text-sm disabled:opacity-40">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 p-6 shadow-2xl animate-slide-up">
            <h3 className="text-white font-bold text-lg mb-4">Rezervasyonu Reddet</h3>
            <p className="text-slate-400 text-sm mb-4">Ret nedeninizi yazın:</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Örn: Saha bakımda olacak"
              className="w-full bg-secondary border border-white/10 rounded-xl p-3 text-white text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary mb-4 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowRejectModal(false)} className="bg-secondary border border-white/10 text-white py-3 rounded-xl font-bold">Vazgeç</button>
              <button onClick={handleReject} disabled={!rejectReason.trim()} className="bg-red-500 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed">Reddet</button>
            </div>
          </div>
        </div>
      )}

      {/* Alternative Proposal Modal */}
      {showAltModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 p-5 shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black text-base">Alternatif Saat Öner</h3>
              <button onClick={() => setShowAltModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <Icon name="close" size={16} className="text-slate-400" />
              </button>
            </div>
            <p className="text-slate-400 text-xs mb-4">Müşteriye en fazla 3 alternatif saat önerebilirsiniz. Kabul ederlerse rezervasyon otomatik güncellenir.</p>

            <div className="space-y-3 mb-4">
              {altSlots.map((alt, i) => (
                <div key={i} className="bg-secondary rounded-xl border border-white/8 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Alternatif {i + 1}</span>
                    {altSlots.length > 1 && (
                      <button onClick={() => setAltSlots(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-[9px] text-red-400">× Kaldır</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-1">Tarih</label>
                      <input type="date" value={alt.date}
                        onChange={e => updateAlt(i, 'date', e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-1">Saat</label>
                      <input type="time" value={alt.startTime}
                        onChange={e => updateAlt(i, 'startTime', e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-1">Süre (dk)</label>
                      <select value={alt.durationMinutes} onChange={e => updateAlt(i, 'durationMinutes', Number(e.target.value))}
                        className="w-full bg-surface border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none">
                        <option value={60}>60 dk</option>
                        <option value={90}>90 dk</option>
                        <option value={120}>120 dk</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-1">Fiyat (₺)</label>
                      <input type="number" value={alt.price}
                        onChange={e => updateAlt(i, 'price', Number(e.target.value))}
                        className="w-full bg-surface border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {altSlots.length < 3 && (
              <button onClick={addAltSlot} className="w-full py-2 mb-3 rounded-xl border border-dashed border-white/20 text-slate-400 text-xs font-bold hover:border-white/30 transition-colors">
                + Alternatif Ekle
              </button>
            )}

            <div className="text-[10px] text-yellow-400 bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-2.5 mb-4">
              ⏰ Teklif 6 saat geçerlidir. Kullanıcı kabul ederse rezervasyon otomatik güncellenir.
            </div>

            <button
              onClick={() => {
                const validAlts = altSlots.filter(s => s.date && s.startTime);
                if (validAlts.length > 0 && onProposeAlternative) {
                  onProposeAlternative(r.id, validAlts);
                  setShowAltModal(false);
                }
              }}
              disabled={!canSubmitAlts}
              className="w-full py-3.5 rounded-2xl bg-yellow-500 text-black font-black disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Alternatifleri Gönder
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── helpers ─────────────────────────────────────────────────────────────────

const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-surface rounded-2xl p-4 border border-white/5">
    <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
      <Icon name={icon} size={18} className="text-primary" />{title}
    </h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const Row: React.FC<{ label: string; value?: string; bold?: boolean; children?: React.ReactNode }> = ({ label, value, bold, children }) => (
  <div className="flex justify-between items-center">
    <span className="text-slate-400 text-sm">{label}</span>
    {children ?? <span className={`text-sm ${bold ? 'text-white font-bold text-base' : 'text-white font-bold'}`}>{value}</span>}
  </div>
);
