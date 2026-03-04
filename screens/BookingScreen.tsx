import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Venue, Reservation, Player, TeamProfile } from '../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookingScreenProps {
  venueId: string;
  venues: Venue[];
  existingReservations: Reservation[];
  currentUser: Player | null;
  teamProfile: TeamProfile | null;
  onBack: () => void;
  onCreateReservation: (reservation: Reservation) => void;
}

type Duration = 60 | 90 | 120;
type Step = 'selection' | 'contact' | 'payment' | 'processing' | 'success';
type PayMethod = 'credit_card' | 'bank_transfer' | 'cash';

// ─── Time helpers ─────────────────────────────────────────────────────────────

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

/** "HH:MM" veya "24:00" → dakika */
function parseTime(t: string): number {
  if (t === '24:00') return 1440;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** dakika → "HH:MM" */
function minToTime(m: number): string {
  const hh = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// ─── Slot motor ───────────────────────────────────────────────────────────────

function isWeekendDate(isoDate: string): boolean {
  const d = new Date(`${isoDate}T12:00:00`).getDay();
  return d === 0 || d === 6;
}

function getPricingBucket(startMin: number, isWeekend: boolean, venue: Venue): number {
  if (!venue.pricing) return venue.price;
  const h = startMin / 60;
  if (isWeekend) {
    if (h < 12) return venue.pricing.weekendMorning;
    if (h < 18) return venue.pricing.weekendAfternoon;
    return venue.pricing.weekendPrime;
  } else {
    if (h < 12) return venue.pricing.weekdayMorning;
    if (h < 18) return venue.pricing.weekdayAfternoon;
    return venue.pricing.weekdayPrime;
  }
}

function calcSlotPrice(startMin: number, duration: Duration, isoDate: string, venue: Venue): number {
  const hourly = getPricingBucket(startMin, isWeekendDate(isoDate), venue);
  return Math.round((hourly * duration) / 60 / 10) * 10;
}

type SlotStatus = 'available' | 'blocked' | 'hold';

function getSlotStatus(
  slotStart: number,
  slotEnd: number,
  venueId: string,
  isoDate: string,
  reservations: Reservation[]
): SlotStatus {
  const now = new Date().toISOString();
  const candidates = reservations.filter(r => r.venueId === venueId && r.date === isoDate);
  for (const r of candidates) {
    const rStart = parseTime(r.startTime);
    const rEnd = parseTime(r.endTime);
    if (rStart >= slotEnd || rEnd <= slotStart) continue; // no overlap
    if (r.status === 'confirmed') return 'blocked';
    if (r.status === 'pending') {
      if (r.paymentStatus === 'paid') return 'blocked';      // hard block
      if (r.holdExpiresAt && r.holdExpiresAt > now) return 'hold'; // soft hold
    }
  }
  return 'available';
}

interface SlotItem {
  id: string;
  startMin: number;
  endMin: number;
  startTime: string;
  endTime: string;
  label: string;
  price: number;
  status: SlotStatus;
}

function generateSlots(
  isoDate: string,
  duration: Duration,
  venue: Venue,
  reservations: Reservation[]
): SlotItem[] {
  // Determine working hours for this day
  let openMin = 16 * 60; // fallback 16:00
  let closeMin = 24 * 60; // fallback 24:00
  let isClosed = false;

  if (venue.workingHours) {
    const dayIndex = new Date(`${isoDate}T12:00:00`).getDay();
    const dayKey = DAY_KEYS[dayIndex];
    const dayHours = venue.workingHours[dayKey];
    if (dayHours) {
      isClosed = dayHours.isClosed;
      openMin = parseTime(dayHours.open);
      closeMin = parseTime(dayHours.close);
    }
  }

  if (isClosed) return [];

  const slots: SlotItem[] = [];
  // Step every 30 min but only list slots aligned to the hour for cleaner UX
  const step = 30;
  for (let start = openMin; start + duration <= closeMin; start += step) {
    const end = start + duration;
    const status = getSlotStatus(start, end, venue.id, isoDate, reservations);
    slots.push({
      id: `slot_${start}`,
      startMin: start,
      endMin: end,
      startTime: minToTime(start),
      endTime: minToTime(end),
      label: `${minToTime(start)} – ${minToTime(end)}`,
      price: calcSlotPrice(start, duration, isoDate, venue),
      status,
    });
  }
  return slots;
}

// ─── Deposit calculator ───────────────────────────────────────────────────────

interface DepositInfo {
  required: boolean;
  amount: number;
  policy: { freeCancelUntilHours: number; latePenaltyPercent: number };
}

function calcDeposit(slotPrice: number, startMin: number, isoDate: string): DepositInfo {
  const startHour = startMin / 60;
  const isPrime = startHour >= 18;
  const isWeekend = isWeekendDate(isoDate);
  const required = isPrime || isWeekend;
  if (!required) {
    return { required: false, amount: 0, policy: { freeCancelUntilHours: 24, latePenaltyPercent: 50 } };
  }
  const raw = slotPrice * 0.2;
  const amount = Math.max(200, Math.min(500, Math.round(raw / 10) * 10));
  return { required: true, amount, policy: { freeCancelUntilHours: 24, latePenaltyPercent: 100 } };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const BookingScreen: React.FC<BookingScreenProps> = ({
  venueId, venues, existingReservations, currentUser, teamProfile, onBack, onCreateReservation,
}) => {
  const venue = useMemo(() => venues.find(v => v.id === venueId) || venues[0], [venueId, venues]);

  // ── Date strip ─────────────────────────────────────────────────────────────
  const dates = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const DAY_NAMES_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      arr.push({
        index: i,
        isoDate,
        dayName: i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : DAY_NAMES_TR[dayOfWeek],
        dayNumber: d.getDate(),
        displayDate: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }
    return arr;
  }, []);

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [duration, setDuration] = useState<Duration>(60);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('selection');
  // Contact
  const [contactPerson, setContactPerson] = useState(currentUser?.name || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.contactNumber || '');
  const [participants, setParticipants] = useState('14');
  const [notes, setNotes] = useState('');
  const [contactError, setContactError] = useState('');
  // Payment
  const [payMethod, setPayMethod] = useState<PayMethod>('credit_card');
  // Result
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);

  const activeDate = dates[selectedDateIndex];

  // ── Slot generation ────────────────────────────────────────────────────────
  const slots = useMemo(
    () => generateSlots(activeDate.isoDate, duration, venue, existingReservations),
    [activeDate.isoDate, duration, venue, existingReservations]
  );
  const activeSlot = slots.find(s => s.id === selectedSlotId);
  const deposit = activeSlot ? calcDeposit(activeSlot.price, activeSlot.startMin, activeDate.isoDate) : null;
  const SERVICE_FEE = 25;
  const totalPrice = activeSlot ? activeSlot.price + SERVICE_FEE : 0;

  // ── Working hours check for closed indicator ───────────────────────────────
  const isDayClosed = useMemo(() => {
    if (!venue.workingHours) return false;
    const dayKey = DAY_KEYS[new Date(`${activeDate.isoDate}T12:00:00`).getDay()];
    return venue.workingHours[dayKey]?.isClosed ?? false;
  }, [activeDate.isoDate, venue]);

  // ── Validate contact step ──────────────────────────────────────────────────
  const validateContact = (): boolean => {
    if (!contactPerson.trim()) { setContactError('Ad Soyad zorunludur'); return false; }
    if (!contactPhone.replace(/\D/g, '') || contactPhone.replace(/\D/g, '').length < 10) {
      setContactError('Geçerli bir telefon numarası girin'); return false;
    }
    const p = Number(participants);
    if (!p || p < 2 || p > 22) { setContactError('Katılımcı sayısı 2-22 arasında olmalı'); return false; }
    setContactError('');
    return true;
  };

  // ── Confirm booking ────────────────────────────────────────────────────────
  const handleConfirmPayment = () => {
    if (!activeSlot || !deposit) return;
    setStep('processing');

    setTimeout(() => {
      const now = new Date().toISOString();
      const HOLD_MINUTES = 15;
      const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString();

      let paymentStatus: 'pending' | 'paid' = 'pending';
      let depositPaidAt: string | undefined;
      let holdExp: string | undefined;

      if (payMethod === 'credit_card') {
        if (deposit.required) {
          paymentStatus = 'paid';   // kapora anında ödenmiş sayılır
          depositPaidAt = now;
        } else {
          paymentStatus = 'paid';   // kaporasız tam ödeme
        }
      } else {
        // bank_transfer / cash → soft hold
        holdExp = holdExpiresAt;
      }

      const reservation: Reservation = {
        id: `res_${Date.now()}`,
        venueId: venue.id,
        venueName: venue.name,
        teamId: teamProfile?.id,
        teamName: teamProfile?.name || currentUser?.name || 'Misafir Takım',
        date: activeDate.isoDate,
        startTime: activeSlot.startTime,
        endTime: activeSlot.endTime,
        duration,
        price: activeSlot.price,
        status: 'pending',
        participants: Number(participants),
        contactPerson: contactPerson.trim(),
        contactPhone: contactPhone.trim(),
        notes: notes.trim() || undefined,
        createdAt: now,
        createdByUserId: currentUser?.id,
        paymentStatus,
        paymentMethod: payMethod,
        depositRequired: deposit.required,
        depositAmount: deposit.required ? deposit.amount : 0,
        depositPaidAt,
        holdExpiresAt: holdExp,
        cancellationPolicy: deposit.required ? deposit.policy : undefined,
      };

      setCreatedReservation(reservation);
      setStep('success');
    }, 1800);
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === 'success' && createdReservation) {
    const isPaidDeposit = createdReservation.paymentStatus === 'paid';
    return (
      <div className="bg-secondary min-h-screen flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-2 ${
          isPaidDeposit
            ? 'bg-primary/20 border-primary/40 shadow-glow'
            : 'bg-yellow-500/20 border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.25)]'
        }`}>
          <Icon
            name={isPaidDeposit ? 'lock_clock' : 'pending_actions'}
            size={44}
            className={isPaidDeposit ? 'text-primary' : 'text-yellow-400'}
          />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">
          {isPaidDeposit ? 'Kapora Alındı!' : 'Talebiniz Alındı!'}
        </h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-xs">
          {isPaidDeposit
            ? 'Kaporanız onaylandı. Saha sahibinin rezervasyonu onaylaması bekleniyor.'
            : 'Talep saha sahibine iletildi. Ödeme alındıktan sonra saha onayı verilecek.'}
        </p>

        <div className="w-full max-w-xs bg-surface border border-white/8 rounded-2xl p-4 mb-6 text-left space-y-2.5">
          <SRow icon="stadium" label={venue.name} />
          <SRow icon="calendar_today" label={activeDate.displayDate} />
          <SRow icon="schedule" label={`${createdReservation.startTime} – ${createdReservation.endTime} (${duration} dk)`} />
          <SRow icon="groups" label={`${createdReservation.participants} Kişi`} />
          {createdReservation.depositRequired && (
            <SRow
              icon="payments"
              label={`Kapora: ${createdReservation.depositAmount?.toLocaleString('tr-TR')}₺ – ${
                isPaidDeposit ? 'Ödendi ✓' : `${payMethod === 'bank_transfer' ? 'IBAN ile gönder' : 'Nakit – 15 dk hold'}`
              }`}
            />
          )}
          <div className="border-t border-white/5 pt-2.5 flex justify-between items-center">
            <span className="text-xs text-slate-500">Toplam</span>
            <span className="text-lg font-black text-primary">{(createdReservation.price + SERVICE_FEE).toLocaleString('tr-TR')}₺</span>
          </div>
          <StatusBadge
            label={
              isPaidDeposit
                ? 'Kapora Ödendi – Onay Bekleniyor'
                : payMethod === 'bank_transfer'
                  ? 'IBAN Havalesi Bekleniyor (15 dk hold)'
                  : 'Nakit Hold (15 dk)'
            }
            color={isPaidDeposit ? 'green' : 'yellow'}
          />
        </div>

        <button
          onClick={() => onCreateReservation(createdReservation)}
          className="w-full max-w-xs bg-surface border border-white/10 py-4 rounded-2xl text-white font-bold hover:bg-white/5 transition-colors"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  // ── Processing screen ──────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="bg-secondary min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-bold text-white mb-2">İşleniyor…</h2>
        <p className="text-slate-400 text-sm">Rezervasyon talebi oluşturuluyor</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-secondary/85 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex items-center gap-3 safe-top">
        <button
          onClick={() => { if (step === 'payment') setStep('contact'); else if (step === 'contact') setStep('selection'); else onBack(); }}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform"
        >
          <Icon name="arrow_back" className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-white text-lg leading-none">Rezervasyon</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">{venue.name}</p>
        </div>
        {/* 3-step dots */}
        <div className="flex gap-1.5">
          {(['selection', 'contact', 'payment'] as Step[]).map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${
              step === s ? 'w-5 bg-primary' : i < ['selection','contact','payment'].indexOf(step) ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-white/15'
            }`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── STEP 1: Date + Duration + Slot ── */}
        {step === 'selection' && (
          <div className="p-4 space-y-5 animate-fade-in">

            {/* Date strip */}
            <div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 px-0.5">Tarih</h3>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {dates.map(d => (
                  <button
                    key={d.index}
                    onClick={() => { setSelectedDateIndex(d.index); setSelectedSlotId(null); }}
                    className={`min-w-[64px] p-2.5 rounded-2xl flex flex-col items-center border transition-all ${
                      selectedDateIndex === d.index
                        ? 'bg-primary border-primary shadow-glow scale-105'
                        : 'bg-surface border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <span className={`text-[9px] font-black uppercase mb-0.5 ${selectedDateIndex === d.index ? 'text-secondary' : 'text-slate-500'}`}>{d.dayName}</span>
                    <span className={`text-lg font-black ${selectedDateIndex === d.index ? 'text-secondary' : 'text-white'}`}>{d.dayNumber}</span>
                    {d.isWeekend && <span className={`text-[8px] font-bold mt-0.5 ${selectedDateIndex === d.index ? 'text-secondary/70' : 'text-yellow-500/60'}`}>H.Sonu</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration picker */}
            <div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 px-0.5">Süre</h3>
              <div className="flex gap-2">
                {([60, 90, 120] as Duration[]).map(d => (
                  <button
                    key={d}
                    onClick={() => { setDuration(d); setSelectedSlotId(null); }}
                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                      duration === d
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 bg-surface text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {d === 60 ? '1 saat' : d === 90 ? '1.5 saat' : '2 saat'}
                  </button>
                ))}
              </div>
            </div>

            {/* Closed day notice */}
            {isDayClosed ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icon name="lock" size={40} className="text-slate-700 mb-3" />
                <p className="text-slate-500 font-bold">Bu gün saha kapalı</p>
                <p className="text-slate-600 text-xs mt-1">Farklı bir tarih seçin</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icon name="event_busy" size={40} className="text-slate-700 mb-3" />
                <p className="text-slate-500 font-bold">Müsait slot bulunamadı</p>
                <p className="text-slate-600 text-xs mt-1">Farklı tarih veya süre deneyin</p>
              </div>
            ) : (
              <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 px-0.5">Saat Seçimi</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {slots.map(slot => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      selected={selectedSlotId === slot.id}
                      isWeekend={activeDate.isWeekend}
                      onSelect={() => slot.status !== 'blocked' && setSelectedSlotId(slot.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Contact ── */}
        {step === 'contact' && activeSlot && (
          <div className="p-4 space-y-4 animate-fade-in">
            {/* Selection summary */}
            <div className="bg-surface rounded-2xl border border-white/8 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Icon name="event" size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{activeDate.displayDate}</p>
                <p className="text-slate-400 text-xs">{activeSlot.label} · <span className="text-primary font-bold">{activeSlot.price.toLocaleString('tr-TR')}₺</span> · {duration} dk</p>
              </div>
            </div>

            {contactError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <Icon name="error_outline" size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{contactError}</p>
              </div>
            )}

            <FormField label="Ad Soyad *">
              <input value={contactPerson} onChange={e => { setContactPerson(e.target.value); setContactError(''); }}
                placeholder="Ahmet Yılmaz" className={inputCls} />
            </FormField>
            <FormField label="Telefon *">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">+90</span>
                <input value={contactPhone} onChange={e => { setContactPhone(e.target.value); setContactError(''); }}
                  type="tel" placeholder="5XX XXX XX XX" className={`${inputCls} pl-14`} />
              </div>
            </FormField>
            <FormField label="Katılımcı Sayısı *">
              <div className="flex gap-2">
                {['8', '10', '12', '14', '16'].map(n => (
                  <button key={n} onClick={() => setParticipants(n)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                      participants === n ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 bg-surface text-slate-400 hover:border-white/20'
                    }`}
                  >{n}</button>
                ))}
              </div>
            </FormField>
            <FormField label="Not (opsiyonel)">
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Saha sahibine iletmek istediğiniz bilgiler..." rows={3}
                className={`${inputCls} resize-none`} />
            </FormField>
          </div>
        )}

        {/* ── STEP 3: Payment ── */}
        {step === 'payment' && activeSlot && deposit && (
          <div className="p-4 space-y-4 animate-fade-in">

            {/* Price breakdown */}
            <div className="bg-surface rounded-2xl border border-white/8 p-4 space-y-2.5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Ödeme Özeti</p>
              <PriceLine label="Saha ücreti" value={`${activeSlot.price.toLocaleString('tr-TR')}₺`} />
              <PriceLine label={`Süre (${duration} dk)`} value="" note={duration === 60 ? '1 saat' : duration === 90 ? '1,5 saat' : '2 saat'} />
              <PriceLine label="Platform ücreti" value="25₺" />
              <div className="border-t border-white/5 pt-2.5">
                <PriceLine label="Toplam" value={`${(activeSlot.price + SERVICE_FEE).toLocaleString('tr-TR')}₺`} bold />
              </div>

              {deposit.required && (
                <div className="border-t border-white/5 pt-2.5 space-y-2">
                  <PriceLine label="Kapora (şimdi)" value={`${deposit.amount.toLocaleString('tr-TR')}₺`} highlight />
                  <PriceLine label="Kalan bakiye" value={`${(activeSlot.price + SERVICE_FEE - deposit.amount).toLocaleString('tr-TR')}₺`} note="Maç günü ödenir" />
                  <div className="flex items-start gap-2 bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-2.5 mt-1">
                    <Icon name="info" size={13} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-yellow-300 leading-relaxed">
                      {deposit.policy.freeCancelUntilHours} saat öncesine kadar ücretsiz iptal.
                      Geç iptalde kapora iade edilmez.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment method */}
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Ödeme Yöntemi</p>
              <div className="space-y-2">
                {([
                  { id: 'credit_card' as PayMethod, icon: 'credit_card', label: 'Kredi / Banka Kartı', sublabel: deposit.required ? 'Kapora anında tahsil edilir → hard lock' : 'Hemen onaylanır' },
                  { id: 'bank_transfer' as PayMethod, icon: 'account_balance', label: 'Havale / EFT', sublabel: `15 dk içinde IBAN'a kapora gönderin (soft hold)` },
                  { id: 'cash' as PayMethod, icon: 'payments', label: 'Nakit', sublabel: 'Saha girişinde ödeme – 15 dk hold' },
                ] as { id: PayMethod; icon: string; label: string; sublabel: string }[]).map(opt => (
                  <button key={opt.id} onClick={() => setPayMethod(opt.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      payMethod === opt.id ? 'border-primary/50 bg-primary/8' : 'border-white/8 bg-surface hover:border-white/15'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${payMethod === opt.id ? 'bg-primary/20' : 'bg-white/5'}`}>
                      <Icon name={opt.icon} size={18} className={payMethod === opt.id ? 'text-primary' : 'text-slate-500'} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${payMethod === opt.id ? 'text-white' : 'text-slate-300'}`}>{opt.label}</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{opt.sublabel}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${payMethod === opt.id ? 'border-primary bg-primary' : 'border-slate-600'}`}>
                      {payMethod === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="p-4 bg-secondary/90 backdrop-blur-xl border-t border-white/5 sticky bottom-0 z-50 safe-bottom">
        {step === 'selection' && (
          <button disabled={!selectedSlotId || activeSlot?.status === 'blocked'}
            onClick={() => setStep('contact')}
            className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-black text-sm shadow-glow transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Devam Et <Icon name="arrow_forward" size={18} />
          </button>
        )}
        {step === 'contact' && (
          <button onClick={() => { if (validateContact()) setStep('payment'); }}
            className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-black text-sm shadow-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Ödeme Adımına Geç <Icon name="arrow_forward" size={18} />
          </button>
        )}
        {step === 'payment' && (
          <button onClick={handleConfirmPayment}
            className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-black text-sm shadow-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Icon name="lock" size={16} /> Rezervasyon Talebi Gönder
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const inputCls = 'w-full bg-secondary border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all';

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{label}</label>
    {children}
  </div>
);

const SRow: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2.5">
    <Icon name={icon} size={14} className="text-slate-500 flex-shrink-0" />
    <span className="text-xs text-slate-300">{label}</span>
  </div>
);

const StatusBadge: React.FC<{ label: string; color: 'green' | 'yellow' }> = ({ label, color }) => (
  <div className={`flex items-center justify-center gap-1.5 rounded-xl py-2 border ${
    color === 'green' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
  }`}>
    <Icon name={color === 'green' ? 'check_circle' : 'hourglass_top'} size={13} />
    <span className="text-[11px] font-bold">{label}</span>
  </div>
);

const PriceLine: React.FC<{ label: string; value: string; note?: string; bold?: boolean; highlight?: boolean }> = ({ label, value, note, bold, highlight }) => (
  <div className="flex items-center justify-between">
    <span className={`text-xs ${bold ? 'text-white font-bold' : 'text-slate-400'}`}>{label}</span>
    <div className="flex items-center gap-1.5">
      {note && <span className="text-[10px] text-slate-600">{note}</span>}
      {value && <span className={`text-sm font-bold ${bold ? 'text-primary text-base' : highlight ? 'text-yellow-400' : 'text-white'}`}>{value}</span>}
    </div>
  </div>
);

const SlotCard: React.FC<{
  slot: SlotItem;
  selected: boolean;
  isWeekend: boolean;
  onSelect: () => void;
}> = ({ slot, selected, isWeekend, onSelect }) => {
  const isPrime = slot.startMin / 60 >= 18;
  const statusMap = {
    available: { cls: selected ? 'bg-primary/10 border-primary shadow-[0_0_12px_rgba(16,185,129,0.2)]' : 'bg-surface border-white/5 hover:border-white/20 active:scale-[0.97]', label: 'BOŞ', labelCls: 'bg-green-500/15 text-green-400' },
    blocked:   { cls: 'bg-surface/50 border-white/5 opacity-40 cursor-not-allowed', label: 'DOLU', labelCls: 'bg-red-500/15 text-red-400' },
    hold:      { cls: 'bg-yellow-500/5 border-yellow-500/25 cursor-not-allowed', label: 'HOLD', labelCls: 'bg-yellow-500/15 text-yellow-500' },
  };
  const s = statusMap[slot.status];

  return (
    <button onClick={onSelect} disabled={slot.status === 'blocked' || slot.status === 'hold'}
      className={`p-3.5 rounded-xl border text-left transition-all ${s.cls}`}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`font-black text-sm font-mono ${selected ? 'text-primary' : slot.status !== 'available' ? 'text-slate-600' : 'text-white'}`}>
          {slot.startTime}
        </span>
        <span className="text-slate-600 text-xs">→</span>
        <span className={`text-xs font-mono ${selected ? 'text-primary/70' : 'text-slate-500'}`}>{slot.endTime}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-slate-300">{slot.price.toLocaleString('tr-TR')}₺</span>
          {(isPrime || isWeekend) && (
            <span className="text-[8px] font-black text-yellow-500/70 uppercase">
              {isPrime && isWeekend ? 'H.Sonu Prime' : isPrime ? 'Prime' : 'H.Sonu'}
            </span>
          )}
        </div>
        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${s.labelCls}`}>{s.label}</span>
      </div>
    </button>
  );
};
