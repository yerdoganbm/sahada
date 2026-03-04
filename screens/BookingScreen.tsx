import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Venue, Reservation, Player, TeamProfile, WaitlistEntry, MaintenanceTask } from '../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookingScreenProps {
  venueId: string;
  venues: Venue[];
  existingReservations: Reservation[];
  existingWaitlist?: WaitlistEntry[];
  maintenanceTasks?: MaintenanceTask[];
  currentUser: Player | null;
  teamProfile: TeamProfile | null;
  onBack: () => void;
  onCreateReservation: (reservation: Reservation) => void;
  onJoinWaitlist?: (venueId: string, venueName: string, date: string, startTime: string, durationMinutes: number) => void;
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

type SlotStatus = 'available' | 'blocked' | 'hold' | 'maintenance' | 'past';

function getSlotStatus(
  slotStart: number,
  slotEnd: number,
  venueId: string,
  isoDate: string,
  reservations: Reservation[],
  maintenanceTasks: MaintenanceTask[] = []
): SlotStatus {
  const now = new Date().toISOString();
  // Check maintenance blocks first
  for (const mt of maintenanceTasks) {
    if (mt.venueId !== venueId) continue;
    if (mt.status === 'cancelled' || mt.status === 'done') continue;
    if (mt.startDate > isoDate || (mt.endDate && mt.endDate < isoDate)) continue;
    const mtStart = mt.startTime ? parseTime(mt.startTime) : 0;
    const mtEnd = mt.endTime ? parseTime(mt.endTime) : 24 * 60;
    if (slotStart < mtEnd && slotEnd > mtStart) return 'maintenance';
  }
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

// PRO: demand tier drives heatmap color
type DemandTier = 'low' | 'medium' | 'high' | 'peak';

interface SlotItem {
  id: string;
  startMin: number;
  endMin: number;
  startTime: string;
  endTime: string;
  label: string;
  price: number;
  status: SlotStatus;
  // PRO fields
  demandTier: DemandTier;
  fillPercent: number;         // 0-100 historical fill for this hour/day
  priceTier: 'morning' | 'afternoon' | 'prime';
  isPrime: boolean;
  isWeekendSlot: boolean;
  recurringCount: number;      // how many recurring reservations this slot
}

// PRO: Compute historical fill% for a given hour block across past 4 weeks
function computeHistoricalFill(
  hourBlock: number, // hour integer e.g. 20
  dayOfWeek: number,
  venueId: string,
  reservations: Reservation[]
): number {
  const sampleRes = reservations.filter(r => {
    if (r.venueId !== venueId || r.status === 'cancelled') return false;
    const d = new Date(r.date + 'T12:00:00');
    const h = parseInt(r.startTime.split(':')[0], 10);
    const daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000);
    return d.getDay() === dayOfWeek && h === hourBlock && daysAgo > 0 && daysAgo <= 56;
  });
  // 8 weeks * 1 slot per week = 8 samples max
  const maxSamples = 8;
  return Math.min(100, Math.round((sampleRes.length / maxSamples) * 100));
}

function getDemandTier(fillPct: number, isPrime: boolean, isWE: boolean): DemandTier {
  const base = fillPct + (isPrime ? 20 : 0) + (isWE ? 10 : 0);
  if (base >= 80) return 'peak';
  if (base >= 55) return 'high';
  if (base >= 30) return 'medium';
  return 'low';
}

function generateSlots(
  isoDate: string,
  duration: Duration,
  venue: Venue,
  reservations: Reservation[],
  maintenanceTasks: MaintenanceTask[] = []
): SlotItem[] {
  // Determine working hours for this day
  let openMin = 16 * 60; // fallback 16:00
  let closeMin = 24 * 60; // fallback 24:00
  let isClosed = false;

  const dayIndex = new Date(`${isoDate}T12:00:00`).getDay();

  if (venue.workingHours) {
    const dayKey = DAY_KEYS[dayIndex];
    const dayHours = venue.workingHours[dayKey];
    if (dayHours) {
      isClosed = dayHours.isClosed;
      openMin = parseTime(dayHours.open);
      closeMin = parseTime(dayHours.close);
    }
  }

  if (isClosed) return [];

  const isWE = dayIndex === 0 || dayIndex === 6;
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const isToday = isoDate === new Date().toISOString().split('T')[0];

  const slots: SlotItem[] = [];
  const step = 30;

  for (let start = openMin; start + duration <= closeMin; start += step) {
    const end = start + duration;
    const isPast = isToday && end <= nowMin;
    
    let status = isPast
      ? 'past' as SlotStatus
      : getSlotStatus(start, end, venue.id, isoDate, reservations, maintenanceTasks);

    const h = Math.floor(start / 60);
    const priceTier: SlotItem['priceTier'] = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'prime';
    const isPrime = priceTier === 'prime';
    const fillPct = status !== 'available'
      ? 100
      : computeHistoricalFill(h, dayIndex, venue.id, reservations);
    const demandTier = getDemandTier(fillPct, isPrime, isWE);

    // Count recurring reservations overlapping this slot
    const recurringCount = reservations.filter(r =>
      r.venueId === venue.id && r.date === isoDate && r.recurringRuleId &&
      parseTime(r.startTime) < end && parseTime(r.endTime) > start
    ).length;

    slots.push({
      id: `slot_${start}`,
      startMin: start,
      endMin: end,
      startTime: minToTime(start),
      endTime: minToTime(end),
      label: `${minToTime(start)} – ${minToTime(end)}`,
      price: calcSlotPrice(start, duration, isoDate, venue),
      status,
      demandTier,
      fillPercent: fillPct,
      priceTier,
      isPrime,
      isWeekendSlot: isWE,
      recurringCount,
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
  venueId, venues, existingReservations, existingWaitlist = [], maintenanceTasks = [], currentUser, teamProfile, onBack, onCreateReservation, onJoinWaitlist,
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
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  // Check if current user is already waiting for a specific slot
  const isAlreadyWaiting = (startTime: string): boolean => {
    if (!currentUser) return false;
    return existingWaitlist.some(
      w => w.venueId === venue.id && w.date === activeDate.isoDate &&
           w.startTime === startTime && w.createdByUserId === currentUser.id &&
           (w.status === 'waiting' || w.status === 'offered')
    );
  };
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
    () => generateSlots(activeDate.isoDate, duration, venue, existingReservations, maintenanceTasks),
    [activeDate.isoDate, duration, venue, existingReservations, maintenanceTasks]
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

  // ── Waitlist success ────────────────────────────────────────────────────────
  if (waitlistSuccess && activeSlot) {
    return (
      <div className="bg-secondary min-h-screen flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center mb-6">
          <Icon name="queue" size={44} className="text-blue-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Sıraya Alındın!</h1>
        <p className="text-slate-400 text-sm mb-6 max-w-xs leading-relaxed">
          Slot açıldığında sana 15 dakikalık ödeme penceresi sunulacak. <br />
          <span className="text-blue-400 font-bold">Rezervasyonlarım</span> ekranından takip edebilirsin.
        </p>
        <div className="w-full max-w-xs bg-surface border border-white/8 rounded-2xl p-4 mb-6 text-left space-y-2">
          <SRow icon="stadium" label={venue.name} />
          <SRow icon="calendar_today" label={activeDate.displayDate} />
          <SRow icon="schedule" label={`${activeSlot.startTime} – ${activeSlot.endTime} (${duration} dk)`} />
          <div className="flex items-center gap-2 mt-2 p-2 bg-blue-500/8 rounded-xl border border-blue-500/20">
            <Icon name="info" size={13} className="text-blue-400" />
            <span className="text-[10px] text-blue-300">Slot DOLU. Sıradaki kişisin.</span>
          </div>
        </div>
        <button onClick={onBack} className="w-full max-w-xs bg-surface border border-white/10 py-4 rounded-2xl text-white font-bold">
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
                {/* PRO: Slot Summary Bar */}
                {(() => {
                  const avail = slots.filter(s => s.status === 'available').length;
                  const total = slots.filter(s => s.status !== 'past').length;
                  const cheapest = slots.filter(s => s.status === 'available').sort((a,b) => a.price - b.price)[0];
                  const peakSlots = slots.filter(s => s.demandTier === 'peak' && s.status === 'available').length;
                  const fillPct = total > 0 ? Math.round(((total - avail) / total) * 100) : 0;
                  return (
                    <div className="flex items-center gap-2 mb-3 px-0.5 flex-wrap">
                      {/* Fill bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Doluluk</span>
                          <span className="text-[9px] font-black text-white">{fillPct}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${fillPct > 75 ? 'bg-red-500' : fillPct > 50 ? 'bg-yellow-500' : 'bg-primary'}`}
                            style={{ width: `${fillPct}%` }} />
                        </div>
                      </div>
                      {/* KPIs */}
                      <div className="flex gap-1.5">
                        <div className="text-center px-2 py-1 bg-surface rounded-xl border border-white/6">
                          <p className="text-[10px] font-black text-green-400">{avail}</p>
                          <p className="text-[7px] text-slate-600 uppercase">Boş</p>
                        </div>
                        {cheapest && (
                          <div className="text-center px-2 py-1 bg-surface rounded-xl border border-white/6">
                            <p className="text-[10px] font-black text-primary">{cheapest.price.toLocaleString('tr-TR')}₺</p>
                            <p className="text-[7px] text-slate-600 uppercase">En Ucuz</p>
                          </div>
                        )}
                        {peakSlots > 0 && (
                          <div className="text-center px-2 py-1 bg-red-500/8 rounded-xl border border-red-500/15">
                            <p className="text-[10px] font-black text-red-400">{peakSlots}</p>
                            <p className="text-[7px] text-red-500/60 uppercase">Peak</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 px-0.5">Saat Seçimi</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {slots.map(slot => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      selected={selectedSlotId === slot.id}
                      alreadyWaiting={isAlreadyWaiting(slot.startTime)}
                      onSelect={() => slot.status === 'available' && setSelectedSlotId(slot.id)}
                      onJoinWaitlist={onJoinWaitlist && slot.status === 'blocked' ? () => {
                        onJoinWaitlist(venue.id, venue.name, activeDate.isoDate, slot.startTime, duration);
                        setWaitlistSuccess(true);
                      } : undefined}
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

// PRO: Demand-based heatmap colors
const DEMAND_STYLES: Record<DemandTier, { bar: string; glow: string; badge: string; badgeText: string }> = {
  low:    { bar: 'bg-slate-600',    glow: '',                                         badge: 'bg-slate-600/15 border-slate-600/25',     badgeText: 'text-slate-400' },
  medium: { bar: 'bg-green-500',    glow: '',                                         badge: 'bg-green-500/10 border-green-500/20',     badgeText: 'text-green-400' },
  high:   { bar: 'bg-yellow-500',   glow: 'shadow-[0_0_8px_rgba(234,179,8,0.2)]',    badge: 'bg-yellow-500/10 border-yellow-500/20',   badgeText: 'text-yellow-400' },
  peak:   { bar: 'bg-red-500',      glow: 'shadow-[0_0_10px_rgba(239,68,68,0.25)]',  badge: 'bg-red-500/10 border-red-500/20',         badgeText: 'text-red-400' },
};

const DEMAND_LABEL: Record<DemandTier, string> = {
  low: 'Sakin', medium: 'Normal', high: 'Yoğun', peak: 'Çok Yoğun',
};

const SlotCard: React.FC<{
  slot: SlotItem;
  selected: boolean;
  alreadyWaiting?: boolean;
  onSelect: () => void;
  onJoinWaitlist?: () => void;
}> = ({ slot, selected, alreadyWaiting, onSelect, onJoinWaitlist }) => {
  const isAvail = slot.status === 'available';
  const ds = DEMAND_STYLES[slot.demandTier];

  const statusMap: Record<SlotStatus, { cls: string; label: string; labelCls: string }> = {
    available:   {
      cls: selected
        ? `bg-primary/10 border-primary shadow-[0_0_14px_rgba(16,185,129,0.25)] ${ds.glow}`
        : `bg-surface border-white/5 hover:border-white/20 active:scale-[0.97] ${ds.glow}`,
      label: 'BOŞ', labelCls: 'bg-green-500/15 text-green-400',
    },
    blocked:     { cls: 'bg-surface/40 border-white/5 opacity-50 cursor-not-allowed',      label: 'DOLU',  labelCls: 'bg-red-500/15 text-red-400' },
    hold:        { cls: 'bg-yellow-500/5 border-yellow-500/20 cursor-not-allowed',          label: 'HOLD',  labelCls: 'bg-yellow-500/15 text-yellow-500' },
    maintenance: { cls: 'bg-orange-500/5 border-orange-500/15 opacity-40 cursor-not-allowed', label: 'BAKIM', labelCls: 'bg-orange-500/15 text-orange-400' },
    past:        { cls: 'bg-white/2 border-white/4 opacity-25 cursor-not-allowed',          label: 'GEÇTI', labelCls: 'bg-slate-600/15 text-slate-600' },
  };
  const s = statusMap[slot.status] ?? statusMap.blocked;

  return (
    <button onClick={onSelect} disabled={!isAvail}
      className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${s.cls}`}
    >
      {/* Demand fill bar — bottom strip */}
      {isAvail && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
          <div
            className={`h-full transition-all ${ds.bar}`}
            style={{ width: `${slot.fillPercent}%` }}
          />
        </div>
      )}

      {/* Time row */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`font-black text-sm font-mono ${selected ? 'text-primary' : !isAvail ? 'text-slate-600' : 'text-white'}`}>
          {slot.startTime}
        </span>
        <span className="text-slate-700 text-[10px]">→</span>
        <span className={`text-xs font-mono ${selected ? 'text-primary/70' : 'text-slate-500'}`}>{slot.endTime}</span>
        {slot.recurringCount > 0 && isAvail === false && (
          <span className="ml-auto text-[8px] text-indigo-400 font-black flex items-center gap-0.5">
            <span>🔁</span>
          </span>
        )}
      </div>

      {/* Price + badges */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-black ${selected ? 'text-primary' : isAvail ? 'text-white' : 'text-slate-600'}`}>
            {slot.price.toLocaleString('tr-TR')}₺
          </span>
          {slot.isPrime && (
            <span className="text-[7px] font-black text-yellow-500/80 bg-yellow-500/8 border border-yellow-500/15 px-1 py-0.5 rounded uppercase">Prime</span>
          )}
          {slot.isWeekendSlot && !slot.isPrime && (
            <span className="text-[7px] font-black text-purple-400/80 bg-purple-500/8 border border-purple-500/15 px-1 py-0.5 rounded uppercase">H.Sonu</span>
          )}
        </div>
        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${s.labelCls}`}>{s.label}</span>
      </div>

      {/* Demand badge for available slots */}
      {isAvail && slot.demandTier !== 'low' && (
        <div className={`mt-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-lg border w-fit ${ds.badge}`}>
          <span className={`text-[8px] font-black ${ds.badgeText}`}>
            {DEMAND_LABEL[slot.demandTier]}
          </span>
          {slot.fillPercent > 0 && (
            <span className={`text-[7px] ${ds.badgeText} opacity-60`}>%{slot.fillPercent}</span>
          )}
        </div>
      )}

      {/* Waitlist button */}
      {slot.status === 'blocked' && onJoinWaitlist && (
        <button
          onClick={e => { e.stopPropagation(); onJoinWaitlist(); }}
          className={`mt-2 w-full py-1.5 rounded-lg text-[9px] font-black border transition-all ${
            alreadyWaiting
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 cursor-default'
              : 'bg-white/5 border-white/15 text-slate-300 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400'
          }`}
          disabled={alreadyWaiting}
        >
          {alreadyWaiting ? '✓ Waitlist\'tesiniz' : '+ Waitlist\'e Gir'}
        </button>
      )}
    </button>
  );
};
