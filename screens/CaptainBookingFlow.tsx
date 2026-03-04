/**
 * CaptainBookingFlow — Kaptan için rezervasyon + ödeme planı + WhatsApp mesajı
 */
import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Player, Team, Venue, Reservation, MaintenanceTask, CaptainPayoutProfile, CaptainPaymentPlan, ScreenName } from '../types';

interface BookingData {
  venueId: string; venueName: string; teamId: string; teamName: string;
  date: string; startTime: string; endTime: string; durationMinutes: number; price: number;
}

interface Props {
  currentUser: Player | null;
  teams: Team[];
  venues: Venue[];
  reservations: Reservation[];
  maintenanceTasks: MaintenanceTask[];
  captainPayoutProfiles: CaptainPayoutProfile[];
  onBack: () => void;
  onNavigate: (s: ScreenName) => void;
  onCreatePlan: (reservationId: string, teamId: string, plan: CaptainPaymentPlan['plan'], totalPrice: number, memberIds: string[], collectionMode: CaptainPaymentPlan['collectionMode']) => void;
  onCreateReservation: (data: BookingData) => string;
}

type Step = 'venue' | 'slot' | 'members' | 'plan' | 'success';

const PLAN_OPTS: { key: CaptainPaymentPlan['plan']; label: string; desc: string; icon: string }[] = [
  { key: 'deposit_now_rest_later', label: 'Kapora Şimdi + Kalan Sonra', desc: 'En çok tercih edilen', icon: 'payment' },
  { key: 'all_eft',               label: 'Hepsi EFT',                  desc: 'Maçtan önce tam ödeme', icon: 'account_balance' },
  { key: 'all_cash_on_site',      label: 'Hepsi Nakit',                desc: 'Saha kapısında ödeme', icon: 'payments' },
  { key: 'pay_later_hold',        label: 'Önce Hold, Sonra Öde',       desc: 'Slot tutulur, ödeme sonra', icon: 'schedule' },
];

function getNextDates(n = 14): { iso: string; label: string; day: string }[] {
  const arr = [];
  for (let i = 1; i <= n; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const day = d.toLocaleDateString('tr-TR', { weekday: 'short' });
    arr.push({ iso, label, day });
  }
  return arr;
}

export const CaptainBookingFlow: React.FC<Props> = ({
  currentUser, teams, venues, reservations, captainPayoutProfiles,
  onBack, onNavigate, onCreatePlan, onCreateReservation,
}) => {
  const [step, setStep] = useState<Step>('venue');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(90);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [plan, setPlan] = useState<CaptainPaymentPlan['plan']>('deposit_now_rest_later');
  const [collectionMode, setCollectionMode] = useState<CaptainPaymentPlan['collectionMode']>('split_equal');
  const [createdResId, setCreatedResId] = useState('');
  const [copied, setCopied] = useState(false);

  const myTeams = teams.filter(t => t.captainUserId === currentUser?.id);
  const selectedTeam = myTeams.find(t => t.id === selectedTeamId);
  const selectedVenue = venues.find(v => v.id === selectedVenueId);
  const dates = getNextDates(14);
  const captainProfile = captainPayoutProfiles.find(p => p.captainUserId === currentUser?.id);

  const timeSlots = useMemo(() => {
    if (!selectedVenue || !selectedDate) return [];
    const slots = [];
    const blocked = reservations.filter(r => r.venueId === selectedVenueId && r.date === selectedDate && r.status !== 'cancelled');
    for (let h = 16; h <= 22; h++) {
      for (const m of [0, 30]) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const endMin = h * 60 + m + duration;
        const endH = Math.floor(endMin / 60);
        const endM = endMin % 60;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        const isBlocked = blocked.some(r => {
          const rs = parseInt(r.startTime) * 60 + parseInt(r.startTime.split(':')[1]);
          const re = parseInt(r.endTime) * 60 + parseInt(r.endTime.split(':')[1]);
          const ss = h * 60 + m;
          return ss < re && endMin > rs;
        });
        if (endH <= 23) slots.push({ time, endTime, isBlocked });
      }
    }
    return slots;
  }, [selectedVenue, selectedDate, duration, reservations]);

  const price = selectedVenue
    ? (() => {
        const d = new Date((selectedDate || new Date().toISOString().split('T')[0]) + 'T12:00:00').getDay();
        const isWE = d === 0 || d === 6;
        const h = selectedTime ? parseInt(selectedTime.split(':')[0]) : 20;
        const isPrime = h >= 18;
        const p = selectedVenue.pricing;
        const hourly = p
          ? (isWE ? (isPrime ? p.weekendPrime : h < 12 ? p.weekendMorning : p.weekendAfternoon)
                  : (isPrime ? p.weekdayPrime : h < 12 ? p.weekdayMorning : p.weekdayAfternoon))
          : selectedVenue.price;
        return Math.round((hourly * duration) / 60 / 10) * 10;
      })()
    : 0;

  const perMember = selectedMembers.length > 0 ? Math.round(price / selectedMembers.length / 10) * 10 : 0;

  const handleConfirm = () => {
    if (!selectedVenueId || !selectedDate || !selectedTime || !selectedTeamId) return;
    const endH = Math.floor((parseInt(selectedTime.split(':')[0]) * 60 + parseInt(selectedTime.split(':')[1]) + duration) / 60);
    const endM = (parseInt(selectedTime.split(':')[0]) * 60 + parseInt(selectedTime.split(':')[1]) + duration) % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    const resId = onCreateReservation({
      venueId: selectedVenueId, venueName: selectedVenue?.name ?? '',
      teamId: selectedTeamId, teamName: selectedTeam?.name ?? '',
      date: selectedDate, startTime: selectedTime, endTime,
      durationMinutes: duration, price,
    });
    onCreatePlan(resId, selectedTeamId, plan, price, selectedMembers, collectionMode);
    setCreatedResId(resId);
    setStep('success');
  };

  const buildWaPaymentMsg = () => {
    const endTime = selectedTime && (() => {
      const m = parseInt(selectedTime.split(':')[0]) * 60 + parseInt(selectedTime.split(':')[1]) + duration;
      return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    })();
    return `⚽ *MAÇ ÖDEMESİ*\n📍 ${selectedVenue?.name}\n📅 ${selectedDate} · ${selectedTime}–${endTime}\n👥 ${selectedMembers.length} kişi\n💸 Kişi başı: ${perMember}₺\n\nEFT: ${captainProfile?.iban ?? 'IBAN ekleyin'}\nHesap: ${captainProfile?.accountName ?? '—'}\nAçıklama: TEAM-${selectedTeamId}-RES-${createdResId}-U[sizin kisaltmaniz]\n\nNakit: ${captainProfile?.phoneForCash ?? '—'}\n\nSon ödeme: 48 saat içinde`;
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const STEPS = ['Saha', 'Saat', 'Üyeler', 'Plan'];

  return (
    <div className="pb-24 bg-secondary min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={step === 'venue' ? onBack : () => setStep(step === 'slot' ? 'venue' : step === 'members' ? 'slot' : step === 'plan' ? 'members' : 'plan')}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-lg font-black text-white flex-1">Maç Planla</h1>
        </div>
        {step !== 'success' && (
          <div className="flex gap-1">
            {STEPS.map((s, i) => {
              const stepIdx = ['venue','slot','members','plan'].indexOf(step);
              return (
                <div key={s} className={`flex-1 h-1 rounded-full transition-all ${i <= stepIdx ? 'bg-primary' : 'bg-white/10'}`} />
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">

        {/* ── STEP: VENUE ── */}
        {step === 'venue' && (
          <>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Takım Seç</label>
              <div className="space-y-2">
                {myTeams.length === 0 ? (
                  <div className="p-4 bg-surface rounded-2xl border border-white/8 text-center">
                    <p className="text-slate-400 text-sm mb-2">Henüz takımın yok</p>
                    <button onClick={() => onNavigate('teamManagement')} className="text-primary text-xs font-bold">Takım Oluştur →</button>
                  </div>
                ) : (
                  myTeams.map(t => (
                    <button key={t.id} onClick={() => setSelectedTeamId(t.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${selectedTeamId === t.id ? 'border-primary bg-primary/8' : 'border-white/8 bg-surface hover:border-white/15'}`}>
                      <Icon name="shield" size={18} className={selectedTeamId === t.id ? 'text-primary' : 'text-slate-500'} />
                      <div>
                        <p className={`font-bold text-sm ${selectedTeamId === t.id ? 'text-primary' : 'text-white'}`}>{t.name}</p>
                        <p className="text-slate-500 text-xs">{t.memberUserIds.length} üye</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Saha Seç</label>
              <div className="space-y-2">
                {venues.filter(v => v.status === 'active').map(v => (
                  <button key={v.id} onClick={() => setSelectedVenueId(v.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${selectedVenueId === v.id ? 'border-primary bg-primary/8' : 'border-white/8 bg-surface hover:border-white/15'}`}>
                    <div className="w-10 h-10 rounded-xl bg-slate-700 overflow-hidden flex-shrink-0">
                      {v.image && <img src={v.image} alt={v.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${selectedVenueId === v.id ? 'text-primary' : 'text-white'}`}>{v.name}</p>
                      <p className="text-slate-500 text-xs">{v.district} · {v.price}₺/saat</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep('slot')} disabled={!selectedVenueId || !selectedTeamId}
              className="w-full py-4 rounded-2xl bg-primary text-secondary font-black disabled:opacity-40">
              Devam → Saat Seç
            </button>
          </>
        )}

        {/* ── STEP: SLOT ── */}
        {step === 'slot' && (
          <>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tarih</label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {dates.map(d => (
                  <button key={d.iso} onClick={() => setSelectedDate(d.iso)}
                    className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border transition-all ${selectedDate === d.iso ? 'bg-primary border-primary text-secondary' : 'bg-surface border-white/8 text-slate-300'}`}>
                    <span className="text-[9px] font-bold uppercase">{d.day}</span>
                    <span className="font-black text-sm">{d.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Süre</label>
              <div className="flex gap-2">
                {[60, 90, 120].map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${duration === d ? 'bg-primary border-primary text-secondary' : 'bg-surface border-white/10 text-slate-400'}`}>
                    {d}dk
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Saat Seç</label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map(slot => (
                    <button key={slot.time} onClick={() => setSelectedTime(slot.time)} disabled={slot.isBlocked}
                      className={`py-3 rounded-xl border text-xs font-black transition-all ${
                        selectedTime === slot.time ? 'bg-primary border-primary text-secondary' :
                        slot.isBlocked ? 'bg-white/3 border-white/5 text-slate-700 cursor-not-allowed' :
                        'bg-surface border-white/8 text-white hover:border-white/20'}`}>
                      <div>{slot.time}</div>
                      {selectedVenue && !slot.isBlocked && <div className="text-[8px] opacity-60">{Math.round((selectedVenue.price * duration) / 60 / 10) * 10}₺</div>}
                      {slot.isBlocked && <div className="text-[8px]">DOLU</div>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setStep('members')} disabled={!selectedDate || !selectedTime}
              className="w-full py-4 rounded-2xl bg-primary text-secondary font-black disabled:opacity-40">
              Devam → Katılımcılar
            </button>
          </>
        )}

        {/* ── STEP: MEMBERS ── */}
        {step === 'members' && selectedTeam && (
          <>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Katılımcılar</label>
              <button onClick={() => setSelectedMembers(s => s.length === selectedTeam.memberUserIds.length ? [] : [...selectedTeam.memberUserIds])}
                className="text-xs text-primary font-bold">
                {selectedMembers.length === selectedTeam.memberUserIds.length ? 'Hepsini Kaldır' : 'Tümünü Seç'}
              </button>
            </div>
            <div className="space-y-2">
              {selectedTeam.memberUserIds.map(uid => {
                const sel = selectedMembers.includes(uid);
                return (
                  <button key={uid} onClick={() => setSelectedMembers(s => sel ? s.filter(id => id !== uid) : [...s, uid])}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${sel ? 'border-primary bg-primary/8' : 'border-white/8 bg-surface'}`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'border-primary bg-primary' : 'border-slate-600'}`}>
                      {sel && <Icon name="check" size={12} className="text-secondary" />}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <Icon name="person" size={14} className="text-slate-400" />
                    </div>
                    <span className={`font-bold text-sm ${sel ? 'text-primary' : 'text-white'}`}>{uid}</span>
                  </button>
                );
              })}
            </div>

            {selectedMembers.length > 0 && (
              <div className="bg-primary/8 border border-primary/20 rounded-2xl p-3 text-center">
                <p className="text-primary font-black text-sm">{selectedMembers.length} kişi · Kişi başı {perMember}₺</p>
                <p className="text-slate-400 text-xs">Toplam: {price.toLocaleString('tr-TR')}₺</p>
              </div>
            )}

            <button onClick={() => setStep('plan')} disabled={selectedMembers.length === 0}
              className="w-full py-4 rounded-2xl bg-primary text-secondary font-black disabled:opacity-40">
              Devam → Ödeme Planı
            </button>
          </>
        )}

        {/* ── STEP: PLAN ── */}
        {step === 'plan' && (
          <>
            <div className="bg-surface rounded-2xl border border-white/8 p-3 mb-2">
              <p className="text-xs text-slate-400">{selectedVenue?.name} · {selectedDate} {selectedTime}</p>
              <p className="text-white font-black">{selectedTeam?.name} · {selectedMembers.length} kişi · {price}₺</p>
            </div>

            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Ödeme Planı</label>
            <div className="space-y-2">
              {PLAN_OPTS.map(opt => (
                <button key={opt.key} onClick={() => setPlan(opt.key)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${plan === opt.key ? 'border-primary bg-primary/8' : 'border-white/8 bg-surface hover:border-white/15'}`}>
                  <Icon name={opt.icon} size={18} className={plan === opt.key ? 'text-primary' : 'text-slate-500'} />
                  <div>
                    <p className={`font-bold text-sm ${plan === opt.key ? 'text-primary' : 'text-white'}`}>{opt.label}</p>
                    <p className="text-slate-500 text-xs">{opt.desc}</p>
                  </div>
                  {plan === opt.key && <Icon name="check_circle" size={16} className="text-primary ml-auto" />}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-white/8">
              <div>
                <p className="text-sm font-bold text-white">Eşit Bölüşüm</p>
                <p className="text-xs text-slate-500">Kişi başı {perMember}₺</p>
              </div>
              <button onClick={() => setCollectionMode(c => c === 'split_equal' ? 'manual' : 'split_equal')}
                className={`w-12 h-6 rounded-full transition-all ${collectionMode === 'split_equal' ? 'bg-primary' : 'bg-slate-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-all ${collectionMode === 'split_equal' ? 'ml-6' : 'ml-0.5'}`} />
              </button>
            </div>

            <button onClick={handleConfirm}
              className="w-full py-4 rounded-2xl bg-primary text-secondary font-black text-base shadow-glow flex items-center justify-center gap-2">
              <Icon name="check_circle" size={18} /> Rezervasyon Oluştur
            </button>
          </>
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === 'success' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-4">
                <Icon name="check_circle" size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-black text-white mb-1">Rezervasyon Oluşturuldu!</h2>
              <p className="text-slate-400 text-sm text-center">Owner onayı bekleniyor. Ödeme toplaması başladı.</p>
            </div>

            <div className="bg-surface rounded-2xl border border-white/8 p-4 space-y-2">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Özet</p>
              <div className="flex justify-between"><span className="text-slate-400 text-xs">Saha</span><span className="text-white text-xs font-bold">{selectedVenue?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 text-xs">Tarih / Saat</span><span className="text-white text-xs font-bold">{selectedDate} {selectedTime}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 text-xs">Toplam</span><span className="text-white text-xs font-bold">{price.toLocaleString('tr-TR')}₺</span></div>
              <div className="flex justify-between"><span className="text-slate-400 text-xs">Kişi başı</span><span className="text-primary text-xs font-black">{perMember}₺</span></div>
            </div>

            {/* WhatsApp Payment message */}
            <div className="bg-green-500/8 border border-green-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon name="chat" size={16} className="text-green-400" />
                <p className="text-green-400 font-black text-sm">WhatsApp Grubuna At</p>
              </div>
              <div className="bg-black/20 rounded-xl p-3">
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">{buildWaPaymentMsg()}</p>
              </div>
              <button onClick={() => copy(buildWaPaymentMsg())}
                className={`w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${copied ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-green-500/15 border border-green-500/25 text-green-400'}`}>
                <Icon name="content_copy" size={14} /> {copied ? '✓ Kopyalandı!' : 'Kopyala'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => onNavigate('captainDashboard')}
                className="py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm">
                Panele Dön
              </button>
              <button onClick={() => { /* navigate to payment hub */ onNavigate('reservationPaymentHub'); }}
                className="py-3 rounded-2xl bg-primary text-secondary font-black text-sm">
                Ödeme Hub →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
