import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { RecurringRule, Venue, Reservation, Player, ScreenName } from '../types';

const DAY_LABELS = ['Paz', 'Pts', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const FREQ_LABELS: Record<string, string> = { WEEKLY: 'Haftalık' };

interface Props {
  currentUser: Player;
  recurringRules: RecurringRule[];
  reservations: Reservation[];
  venues: Venue[];
  onBack: () => void;
  onCreateRule: (rule: Omit<RecurringRule, 'id' | 'createdAt'>) => void;
  onPauseRule: (id: string) => void;
  onCancelRule: (id: string) => void;
  onNavigate: (s: ScreenName) => void;
}

type Tab = 'rules' | 'upcoming';

export const RecurringManagement: React.FC<Props> = ({
  currentUser, recurringRules, reservations, venues,
  onBack, onCreateRule, onPauseRule, onCancelRule,
}) => {
  const [tab, setTab] = useState<Tab>('rules');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Draft form state
  const [draft, setDraft] = useState({
    venueId: venues[0]?.id ?? '',
    customerName: '',
    customerPhone: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    byWeekdays: [2] as number[],
    startTime: '20:00',
    durationMinutes: 90,
    autoConfirm: true,
    pricingMode: 'bucket' as 'fixed' | 'bucket',
    fixedPrice: 1200,
    paymentMode: 'invoice_monthly' as 'invoice_monthly' | 'pay_each',
  });

  const toggleDay = (d: number) => {
    setDraft(prev => ({
      ...prev,
      byWeekdays: prev.byWeekdays.includes(d)
        ? prev.byWeekdays.filter(x => x !== d)
        : [...prev.byWeekdays, d].sort(),
    }));
  };

  const handleCreate = () => {
    if (!draft.customerName.trim() || draft.byWeekdays.length === 0) return;
    const venueName = venues.find(v => v.id === draft.venueId)?.name ?? '';
    onCreateRule({
      ...draft,
      venueName,
      endDate: draft.endDate || undefined,
      customerPhone: draft.customerPhone || undefined,
      fixedPrice: draft.pricingMode === 'fixed' ? draft.fixedPrice : undefined,
      freq: 'WEEKLY',
      status: 'active',
      createdByUserId: currentUser.id,
    });
    setShowCreateModal(false);
  };

  // Upcoming recurring reservations (next 28 days from recurring)
  const upcoming = useMemo(() => {
    return reservations
      .filter(r => r.recurringRuleId && new Date(r.date) >= new Date())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 40);
  }, [reservations]);

  const statusMeta = {
    active:    { label: 'Aktif',   cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
    paused:    { label: 'Duraklatıldı', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
    cancelled: { label: 'İptal',   cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
  };

  return (
    <div className="bg-secondary min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/8 px-4 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-surface border border-white/8 flex items-center justify-center active:scale-95">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Sabit Rezervasyonlar</h1>
            <p className="text-[10px] text-slate-500">{recurringRules.filter(r => r.status === 'active').length} aktif kural</p>
          </div>
          {(currentUser.role === 'venue_owner' || currentUser.role === 'venue_staff') && (
            <button onClick={() => setShowCreateModal(true)}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-glow active:scale-95">
              <Icon name="add" className="text-secondary" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(['rules', 'upcoming'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${tab === t ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/8 bg-surface text-slate-400'}`}>
              {t === 'rules' ? 'Kurallar' : `Yaklaşan (${upcoming.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === 'rules' && (
          recurringRules.length === 0
            ? <Empty icon="repeat" text="Henüz kural yok" sub="+ butonu ile sabit rezervasyon kuralı ekleyin" />
            : recurringRules.map(rule => {
                const meta = statusMeta[rule.status];
                const venue = venues.find(v => v.id === rule.venueId);
                const ruleRes = reservations.filter(r => r.recurringRuleId === rule.id);
                const upcoming4w = ruleRes.filter(r => r.date >= new Date().toISOString().split('T')[0]).length;
                return (
                  <div key={rule.id} className="bg-surface rounded-2xl border border-white/6 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-bold text-white text-sm">{rule.customerName}</h4>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${meta.cls}`}>{meta.label}</span>
                          {rule.autoConfirm && <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">Oto-Onay</span>}
                        </div>
                        <p className="text-[11px] text-slate-400">{venue?.name ?? rule.venueId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary">
                          {rule.pricingMode === 'fixed' ? `${rule.fixedPrice?.toLocaleString('tr-TR')}₺` : 'Bucket fiyat'}
                        </p>
                        <p className="text-[9px] text-slate-500">{rule.paymentMode === 'invoice_monthly' ? 'Aylık fatura' : 'Her seferinde'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-3 flex-wrap text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Icon name="repeat" size={11} />
                        {FREQ_LABELS[rule.freq]}: {rule.byWeekdays.map(d => DAY_LABELS[d]).join(', ')}
                      </span>
                      <span>{rule.startTime} · {rule.durationMinutes} dk</span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className={`flex-1 text-center py-1.5 rounded-xl border text-[9px] font-bold ${upcoming4w > 0 ? 'bg-blue-500/8 border-blue-500/20 text-blue-400' : 'bg-white/4 border-white/8 text-slate-500'}`}>
                        {upcoming4w} rezervasyon üretildi (4 hafta)
                      </div>
                      <p className="text-[9px] text-slate-600">
                        {rule.startDate}{rule.endDate ? ` → ${rule.endDate}` : ' → Süresiz'}
                      </p>
                    </div>

                    {rule.status !== 'cancelled' && (
                      <div className="flex gap-2">
                        {rule.status === 'active'
                          ? <button onClick={() => onPauseRule(rule.id)}
                              className="flex-1 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold">
                              Duraklat
                            </button>
                          : <button onClick={() => {/* resume – just for UX consistency */}}
                              className="flex-1 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                              Devam Et
                            </button>
                        }
                        <button onClick={() => onCancelRule(rule.id)}
                          className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                          İptal Et
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
        )}

        {tab === 'upcoming' && (
          upcoming.length === 0
            ? <Empty icon="event_repeat" text="Yaklaşan sabit rezervasyon yok" sub="Kural oluşturun" />
            : upcoming.map(r => (
                <div key={r.id} className="bg-surface rounded-2xl border border-white/6 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{r.customerName || r.teamName}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(r.date + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })} · {r.startTime} – {r.endTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{r.price.toLocaleString('tr-TR')}₺</p>
                      <span className={`text-[9px] font-bold ${r.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {r.status === 'confirmed' ? 'Onaylı' : 'Bekliyor'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 p-5 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black text-base">Yeni Sabit Rezervasyon</h3>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <Icon name="close" size={16} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Venue */}
              {venues.length > 1 && (
                <Field label="Saha">
                  <select value={draft.venueId} onChange={e => setDraft(p => ({ ...p, venueId: e.target.value }))}
                    className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </Field>
              )}

              {/* Customer */}
              <Field label="Müşteri / Takım Adı">
                <input value={draft.customerName} onChange={e => setDraft(p => ({ ...p, customerName: e.target.value }))}
                  placeholder="ABC Spor Kulübü"
                  className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary" />
              </Field>
              <Field label="Telefon (opsiyonel)">
                <input value={draft.customerPhone} onChange={e => setDraft(p => ({ ...p, customerPhone: e.target.value }))}
                  placeholder="0532..." type="tel"
                  className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary" />
              </Field>

              {/* Days */}
              <Field label="Günler">
                <div className="flex gap-2">
                  {DAY_LABELS.map((label, d) => (
                    <button key={d} onClick={() => toggleDay(d)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition-all ${
                        draft.byWeekdays.includes(d) ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-secondary border-white/10 text-slate-500'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Time & Duration */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Saat">
                  <input type="time" value={draft.startTime} onChange={e => setDraft(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none" />
                </Field>
                <Field label="Süre (dk)">
                  <select value={draft.durationMinutes} onChange={e => setDraft(p => ({ ...p, durationMinutes: Number(e.target.value) }))}
                    className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
                    {[60, 90, 120].map(d => <option key={d} value={d}>{d} dk</option>)}
                  </select>
                </Field>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Başlangıç">
                  <input type="date" value={draft.startDate} onChange={e => setDraft(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none" />
                </Field>
                <Field label="Bitiş (opsiyonel)">
                  <input type="date" value={draft.endDate} onChange={e => setDraft(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none" />
                </Field>
              </div>

              {/* Pricing */}
              <Field label="Fiyatlandırma">
                <div className="flex gap-2">
                  {(['fixed', 'bucket'] as const).map(m => (
                    <button key={m} onClick={() => setDraft(p => ({ ...p, pricingMode: m }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${draft.pricingMode === m ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 bg-secondary text-slate-400'}`}>
                      {m === 'fixed' ? 'Sabit Fiyat' : 'Bucket Fiyat'}
                    </button>
                  ))}
                </div>
              </Field>
              {draft.pricingMode === 'fixed' && (
                <Field label="Sabit Fiyat (₺)">
                  <input type="number" value={draft.fixedPrice} onChange={e => setDraft(p => ({ ...p, fixedPrice: Number(e.target.value) }))}
                    className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary" />
                </Field>
              )}

              {/* Options */}
              <div className="flex items-center justify-between p-3 bg-secondary rounded-xl border border-white/8">
                <span className="text-sm text-slate-300">Otomatik Onay</span>
                <button onClick={() => setDraft(p => ({ ...p, autoConfirm: !p.autoConfirm }))}
                  className={`w-12 h-6 rounded-full transition-all ${draft.autoConfirm ? 'bg-primary' : 'bg-slate-700'} flex items-center px-1`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${draft.autoConfirm ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              <Field label="Ödeme Modu">
                <div className="flex gap-2">
                  {([['invoice_monthly','Aylık Fatura'],['pay_each','Her Seferinde']] as const).map(([m, label]) => (
                    <button key={m} onClick={() => setDraft(p => ({ ...p, paymentMode: m }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${draft.paymentMode === m ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 bg-secondary text-slate-400'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <button onClick={handleCreate} disabled={!draft.customerName.trim() || draft.byWeekdays.length === 0}
              className="w-full mt-4 py-3.5 rounded-2xl bg-primary text-secondary font-black shadow-glow disabled:opacity-40">
              Kural Oluştur + Rezervasyonları Üret
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{label}</label>
    {children}
  </div>
);

const Empty: React.FC<{ icon: string; text: string; sub: string }> = ({ icon, text, sub }) => (
  <div className="flex flex-col items-center py-16 text-center">
    <Icon name={icon} size={52} className="text-slate-700 mb-3" />
    <p className="text-white font-bold mb-1">{text}</p>
    <p className="text-slate-500 text-xs">{sub}</p>
  </div>
);
