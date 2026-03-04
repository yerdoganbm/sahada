import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Venue, Reservation, Player, TeamProfile } from '../types';

interface BookingScreenProps {
  venueId: string;
  venues: Venue[];
  currentUser: Player | null;
  teamProfile: TeamProfile | null;
  onBack: () => void;
  onComplete: (reservation: Reservation) => void;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({
  venueId, venues, currentUser, teamProfile, onBack, onComplete
}) => {
  const venue = venues.find(v => v.id === venueId) || venues[0];

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [step, setStep] = useState<'selection' | 'contact' | 'processing' | 'success'>('selection');

  // Contact / booking detail state
  const [contactPerson, setContactPerson] = useState(currentUser?.name || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.contactNumber || '');
  const [participants, setParticipants] = useState('14');
  const [notes, setNotes] = useState('');
  const [contactError, setContactError] = useState('');

  // Built reservation (set after success so success screen can show it)
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);

  // --- Date strip: next 7 days ---
  const dates = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : d.toLocaleDateString('tr-TR', { weekday: 'short' });
      const dayNumber = d.getDate();
      const isoDate = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const displayDate = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      arr.push({ index: i, dayName, dayNumber, isoDate, displayDate });
    }
    return arr;
  }, []);

  // --- Time slots ---
  const timeSlots = useMemo(() => {
    const slots = [];
    const startHour = 16;
    const endHour = 24;
    const isBusyDay = [4, 5, 6].includes((new Date().getDay() + selectedDateIndex) % 7);
    for (let h = startHour; h < endHour; h++) {
      const label = `${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`;
      const isFull = (h + selectedDateIndex) % 3 === 0 && isBusyDay;
      // Apply pricing tiers if available
      let slotPrice = venue.price;
      if (venue.pricing) {
        const isWeekend = [5, 6].includes((new Date().getDay() + selectedDateIndex) % 7);
        if (isWeekend) {
          slotPrice = h < 12 ? venue.pricing.weekendMorning : h < 18 ? venue.pricing.weekendAfternoon : venue.pricing.weekendPrime;
        } else {
          slotPrice = h < 12 ? venue.pricing.weekdayMorning : h < 18 ? venue.pricing.weekdayAfternoon : venue.pricing.weekdayPrime;
        }
      }
      slots.push({ id: `slot_${h}`, startTime: `${String(h).padStart(2, '0')}:00`, endTime: `${String(h + 1).padStart(2, '0')}:00`, label, status: isFull ? 'full' : 'available', price: slotPrice });
    }
    return slots;
  }, [selectedDateIndex, venue]);

  const activeDate = dates[selectedDateIndex];
  const activeSlot = timeSlots.find(s => s.id === selectedSlot);

  // --- Validation ---
  const validateContact = (): boolean => {
    if (!contactPerson.trim()) { setContactError('Ad Soyad zorunludur'); return false; }
    if (!contactPhone.trim() || contactPhone.replace(/\D/g, '').length < 10) {
      setContactError('Geçerli bir telefon numarası girin'); return false;
    }
    const p = Number(participants);
    if (!p || p < 2 || p > 22) { setContactError('Katılımcı sayısı 2-22 arasında olmalı'); return false; }
    setContactError('');
    return true;
  };

  const handleConfirm = () => {
    if (!validateContact()) return;
    setStep('processing');
    setTimeout(() => {
      const reservation: Reservation = {
        id: `res_${Date.now()}`,
        venueId: venue.id,
        venueName: venue.name,
        teamId: teamProfile?.id,
        teamName: teamProfile?.name || currentUser?.name || 'Misafir Takım',
        date: activeDate.isoDate,
        startTime: activeSlot?.startTime || '20:00',
        endTime: activeSlot?.endTime || '21:00',
        duration: 60,
        price: activeSlot?.price ?? venue.price,
        status: 'pending',
        participants: Number(participants),
        contactPerson: contactPerson.trim(),
        contactPhone: contactPhone.trim(),
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        paymentStatus: 'pending',
      };
      setCreatedReservation(reservation);
      setStep('success');
    }, 1800);
  };

  // --- Success screen ---
  if (step === 'success' && createdReservation) {
    return (
      <div className="bg-secondary min-h-screen flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-yellow-500/20 border-2 border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.25)]">
          <Icon name="pending_actions" size={44} className="text-yellow-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Talebiniz Alındı!</h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-xs">
          Rezervasyon talebiniz saha sahibine iletildi. <span className="text-white font-bold">Onay aldığınızda</span> maç takviminize otomatik eklenecek.
        </p>

        {/* Summary card */}
        <div className="w-full max-w-xs bg-surface border border-white/8 rounded-2xl p-4 mb-6 text-left space-y-3">
          <SummaryRow icon="stadium" label={venue.name} />
          <SummaryRow icon="calendar_today" label={activeDate.displayDate} />
          <SummaryRow icon="schedule" label={`${createdReservation.startTime} – ${createdReservation.endTime}`} />
          <SummaryRow icon="groups" label={`${createdReservation.participants} Kişi`} />
          <div className="border-t border-white/5 pt-3 flex justify-between items-center">
            <span className="text-xs text-slate-500">Toplam Ücret</span>
            <span className="text-lg font-black text-primary">{createdReservation.price.toLocaleString('tr-TR')}₺</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <Icon name="hourglass_top" size={14} className="text-yellow-400" />
            <span className="text-[11px] font-bold text-yellow-400">Saha Onayı Bekleniyor</span>
          </div>
        </div>

        <button
          onClick={() => onComplete(createdReservation)}
          className="w-full max-w-xs bg-surface border border-white/10 py-4 rounded-2xl text-white font-bold hover:bg-white/5 transition-colors"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  // --- Processing screen ---
  if (step === 'processing') {
    return (
      <div className="bg-secondary min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-bold text-white mb-2">Talep Gönderiliyor</h2>
        <p className="text-slate-400 text-sm">Lütfen bekleyin...</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary min-h-screen pb-safe-bottom flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-secondary/85 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex items-center gap-3 safe-top">
        <button
          onClick={step === 'contact' ? () => setStep('selection') : onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform"
        >
          <Icon name="arrow_back" className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-white text-lg leading-none">Rezervasyon Talebi</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">{venue.name}</p>
        </div>
        {/* Step indicator */}
        <div className="flex gap-1">
          <div className={`w-6 h-1.5 rounded-full ${step === 'selection' ? 'bg-primary' : 'bg-primary'}`} />
          <div className={`w-6 h-1.5 rounded-full ${step === 'contact' ? 'bg-primary' : 'bg-white/15'}`} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── STEP 1: Date & Slot Selection ── */}
        {step === 'selection' && (
          <div className="p-4 space-y-6 animate-fade-in">

            {/* Date Strip */}
            <div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Tarih Seçimi</h3>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {dates.map((date) => (
                  <button
                    key={date.index}
                    onClick={() => { setSelectedDateIndex(date.index); setSelectedSlot(null); }}
                    className={`min-w-[68px] p-3 rounded-2xl flex flex-col items-center border transition-all ${
                      selectedDateIndex === date.index
                        ? 'bg-primary border-primary shadow-glow transform scale-105'
                        : 'bg-surface border-white/5 text-slate-400'
                    }`}
                  >
                    <span className={`text-[9px] font-black uppercase mb-1 ${selectedDateIndex === date.index ? 'text-secondary' : 'text-slate-500'}`}>{date.dayName}</span>
                    <span className={`text-xl font-black ${selectedDateIndex === date.index ? 'text-secondary' : 'text-white'}`}>{date.dayNumber}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Grid */}
            <div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Saat Seçimi</h3>
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    disabled={slot.status === 'full'}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      slot.status === 'full'
                        ? 'bg-surface/50 border-white/5 opacity-40 cursor-not-allowed'
                        : selectedSlot === slot.id
                          ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'bg-surface border-white/5 hover:border-white/20 active:scale-[0.97]'
                    }`}
                  >
                    <span className={`block text-base font-black font-mono mb-1.5 ${selectedSlot === slot.id ? 'text-primary' : 'text-white'}`}>{slot.label}</span>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-bold">{slot.price.toLocaleString('tr-TR')}₺</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                        slot.status === 'full' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {slot.status === 'full' ? 'DOLU' : 'BOŞ'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Contact & Confirm ── */}
        {step === 'contact' && activeSlot && (
          <div className="p-4 space-y-5 animate-fade-in">

            {/* Seçim özeti */}
            <div className="bg-surface rounded-2xl border border-white/8 p-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Seçiminiz</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Icon name="event" size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{activeDate.displayDate}</p>
                  <p className="text-slate-400 text-xs">{activeSlot.startTime} – {activeSlot.endTime} · <span className="text-primary font-bold">{activeSlot.price.toLocaleString('tr-TR')}₺</span></p>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">İletişim Bilgileri</p>

              {contactError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                  <Icon name="error_outline" size={15} className="text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">{contactError}</p>
                </div>
              )}

              <FormField label="Ad Soyad *">
                <input
                  value={contactPerson}
                  onChange={e => { setContactPerson(e.target.value); setContactError(''); }}
                  placeholder="Ahmet Yılmaz"
                  className={inputCls}
                />
              </FormField>

              <FormField label="Telefon *">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">+90</span>
                  <input
                    value={contactPhone}
                    onChange={e => { setContactPhone(e.target.value); setContactError(''); }}
                    type="tel"
                    placeholder="5XX XXX XX XX"
                    className={`${inputCls} pl-14`}
                  />
                </div>
              </FormField>

              <FormField label="Katılımcı Sayısı *">
                <div className="flex gap-2">
                  {['8', '10', '12', '14', '16'].map(n => (
                    <button
                      key={n}
                      onClick={() => setParticipants(n)}
                      className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                        participants === n
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-white/10 bg-surface text-slate-400 hover:border-white/20'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Not (opsiyonel)">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Saha sahibine iletmek istediğiniz bilgiler..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </FormField>
            </div>

            {/* Price breakdown */}
            <div className="bg-surface rounded-2xl border border-white/8 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Saha ücreti</span>
                <span className="text-white font-bold">{activeSlot.price.toLocaleString('tr-TR')}₺</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Platform ücreti</span>
                <span className="text-white font-bold">25₺</span>
              </div>
              <div className="border-t border-white/5 pt-2 flex justify-between">
                <span className="text-sm font-bold text-white">Toplam</span>
                <span className="text-xl font-black text-primary">{(activeSlot.price + 25).toLocaleString('tr-TR')}₺</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Icon name="info_outline" size={13} className="text-slate-600" />
                <p className="text-[10px] text-slate-600">Ödeme saha onayı sonrası tahsil edilir.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="p-4 bg-secondary/90 backdrop-blur-xl border-t border-white/5 sticky bottom-0 z-50 safe-bottom">
        {step === 'selection' ? (
          <button
            disabled={!selectedSlot}
            onClick={() => setStep('contact')}
            className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-black text-sm shadow-glow transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Devam Et <Icon name="arrow_forward" size={18} />
          </button>
        ) : (
          <button
            onClick={handleConfirm}
            className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-black text-sm shadow-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Icon name="send" size={16} /> Rezervasyon Talebi Gönder
          </button>
        )}
      </div>
    </div>
  );
};

// ── Helper components ──────────────────────────────────────────────────────

const inputCls = 'w-full bg-secondary border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all';

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{label}</label>
    {children}
  </div>
);

const SummaryRow: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2.5">
    <Icon name={icon} size={15} className="text-slate-500 flex-shrink-0" />
    <span className="text-sm text-slate-300 font-medium">{label}</span>
  </div>
);
