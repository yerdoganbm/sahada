import React, { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { Venue, VenueLocation } from '../types';
import { VenueLocationEditor } from './VenueLocationEditor';

interface VenueSettingsProps {
  venues: Venue[];                        // Sadece owner'ın sahaları geçirilecek
  onBack: () => void;
  onSave: (venueId: string, updates: Partial<Venue>) => void;
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba',
  thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar',
};

const DEFAULT_WORKING_HOURS = {
  monday:    { open: '08:00', close: '23:00', isClosed: false },
  tuesday:   { open: '08:00', close: '23:00', isClosed: false },
  wednesday: { open: '08:00', close: '23:00', isClosed: false },
  thursday:  { open: '08:00', close: '23:00', isClosed: false },
  friday:    { open: '08:00', close: '23:00', isClosed: false },
  saturday:  { open: '09:00', close: '23:00', isClosed: false },
  sunday:    { open: '09:00', close: '22:00', isClosed: false },
};

const DEFAULT_PRICING = {
  weekdayMorning:   800,
  weekdayAfternoon: 1000,
  weekdayPrime:     1400,
  weekendMorning:   900,
  weekendAfternoon: 1100,
  weekendPrime:     1600,
};

const STATUS_OPTIONS: { value: Venue['status']; label: string; color: string; icon: string }[] = [
  { value: 'active',      label: 'Aktif',       color: 'border-green-500/40 bg-green-500/10 text-green-400',  icon: 'check_circle' },
  { value: 'closed',      label: 'Kapalı',      color: 'border-red-500/40 bg-red-500/10 text-red-400',        icon: 'cancel' },
  { value: 'maintenance', label: 'Bakımda',     color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400', icon: 'build' },
];

const TABS = ['Genel', 'Fiyatlar', 'Çalışma Saatleri', 'İptal Politikası', 'Konum'] as const;
type Tab = typeof TABS[number];

export const VenueSettings: React.FC<VenueSettingsProps> = ({ venues, onBack, onSave }) => {
  const [selectedVenueId, setSelectedVenueId] = useState<string>(venues[0]?.id || '');
  const [activeTab, setActiveTab] = useState<Tab>('Genel');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const venue = venues.find(v => v.id === selectedVenueId) || venues[0];

  // ── Local editable state ─────────────────────────────────
  const [status, setStatus] = useState<Venue['status']>(venue?.status || 'active');
  const [phone, setPhone] = useState(venue?.phone || '');
  const [email, setEmail] = useState(venue?.email || '');

  const [pricing, setPricing] = useState({
    ...DEFAULT_PRICING,
    ...(venue?.pricing || {}),
  });

  const [workingHours, setWorkingHours] = useState<typeof DEFAULT_WORKING_HOURS>({
    ...DEFAULT_WORKING_HOURS,
    ...(venue?.workingHours || {}),
  });

  const [cancelPolicy, setCancelPolicy] = useState({
    freeCancelUntilHours: venue?.cancellationPolicy?.freeCancelUntilHours ?? 24,
    latePenaltyPercent: venue?.cancellationPolicy?.latePenaltyPercent ?? 100,
  });

  // Sync when venue changes
  useEffect(() => {
    if (!venue) return;
    setStatus(venue.status || 'active');
    setPhone(venue.phone || '');
    setEmail(venue.email || '');
    setPricing({ ...DEFAULT_PRICING, ...(venue.pricing || {}) });
    setWorkingHours({ ...DEFAULT_WORKING_HOURS, ...(venue.workingHours || {}) });
    setCancelPolicy({
      freeCancelUntilHours: venue.cancellationPolicy?.freeCancelUntilHours ?? 24,
      latePenaltyPercent: venue.cancellationPolicy?.latePenaltyPercent ?? 100,
    });
    setSaveSuccess(false);
  }, [selectedVenueId]);

  const setPricingField = (field: keyof typeof DEFAULT_PRICING, value: string) => {
    const n = Number(value.replace(/\D/g, ''));
    setPricing(prev => ({ ...prev, [field]: n }));
  };

  const setDayHours = (day: DayKey, field: 'open' | 'close' | 'isClosed', value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = () => {
    const updates: Partial<Venue> = {
      status,
      phone: phone.trim(),
      email: email.trim() || undefined,
      pricing,
      workingHours,
      cancellationPolicy: cancelPolicy,
      updatedAt: new Date().toISOString(),
    };
    onSave(selectedVenueId, updates);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  if (!venue) {
    return (
      <div className="bg-secondary min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Saha bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-secondary/90 backdrop-blur-xl border-b border-white/5 px-4 pt-10 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Icon name="arrow_back" size={18} className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-black text-lg leading-none">Saha Ayarları</h1>
            <p className="text-slate-500 text-[11px] mt-0.5">Detayları düzenle ve kaydet</p>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 px-3 py-1.5 rounded-full">
              <Icon name="check" size={13} className="text-green-400" />
              <span className="text-[10px] font-bold text-green-400">Kaydedildi</span>
            </div>
          )}
        </div>

        {/* Venue selector (multi-venue) */}
        {venues.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {venues.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVenueId(v.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all ${
                  selectedVenueId === v.id
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-white/10 bg-surface text-slate-400 hover:border-white/20'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 bg-surface rounded-xl p-1 border border-white/5 mt-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab ? 'bg-primary text-secondary shadow' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 space-y-5">

        {/* ── Tab: Genel ── */}
        {activeTab === 'Genel' && (
          <>
            {/* Venue status */}
            <Section title="Saha Durumu" icon="toggle_on">
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      status === opt.value ? opt.color : 'border-white/8 bg-surface text-slate-600 hover:border-white/15'
                    }`}
                  >
                    <Icon name={opt.icon} size={20} />
                    <span className="text-[10px] font-black">{opt.label}</span>
                  </button>
                ))}
              </div>
              {status === 'closed' && (
                <InfoBox icon="info" text="Saha kapalıyken yeni rezervasyon talebi alınmaz. Mevcut onaylı rezervasyonlar etkilenmez." color="red" />
              )}
              {status === 'maintenance' && (
                <InfoBox icon="build" text="Bakım modunda saha listede görünür ancak rezervasyon yapılamaz." color="yellow" />
              )}
            </Section>

            {/* Contact */}
            <Section title="İletişim Bilgileri" icon="contact_phone">
              <SettingField label="Telefon">
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  type="tel"
                  className={inputCls}
                />
              </SettingField>
              <SettingField label="E-posta (opsiyonel)">
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="saha@email.com"
                  type="email"
                  className={inputCls}
                />
              </SettingField>
            </Section>

            {/* Venue info (read-only) */}
            <Section title="Saha Bilgisi" icon="info">
              <div className="space-y-2">
                <InfoRow label="Saha Adı" value={venue.name} />
                <InfoRow label="İlçe" value={venue.district} />
                <InfoRow label="Kapasite" value={venue.capacity} />
                <InfoRow label="Temel Fiyat" value={`${venue.price.toLocaleString('tr-TR')}₺/saat`} />
              </div>
              <p className="text-[10px] text-slate-600 mt-2">Saha adı, adres ve kapasite için ekibimizie ulaşın.</p>
            </Section>
          </>
        )}

        {/* ── Tab: Fiyatlar ── */}
        {activeTab === 'Fiyatlar' && (
          <>
            <InfoBox icon="info" text="Fiyatlar saat dilimine göre otomatik uygulanır. Belirtilmezse temel saha fiyatı kullanılır." color="blue" />

            <Section title="Hafta İçi" icon="today">
              <PricingGrid>
                <PricingField label="Sabah (08-12)" sublabel="Hafta içi" value={pricing.weekdayMorning} onChange={v => setPricingField('weekdayMorning', v)} />
                <PricingField label="Öğleden Sonra (12-18)" sublabel="Hafta içi" value={pricing.weekdayAfternoon} onChange={v => setPricingField('weekdayAfternoon', v)} />
                <PricingField label="Prime Time (18-24)" sublabel="Hafta içi" value={pricing.weekdayPrime} onChange={v => setPricingField('weekdayPrime', v)} isHighlighted />
              </PricingGrid>
            </Section>

            <Section title="Hafta Sonu" icon="weekend">
              <PricingGrid>
                <PricingField label="Sabah (08-12)" sublabel="Hafta sonu" value={pricing.weekendMorning} onChange={v => setPricingField('weekendMorning', v)} />
                <PricingField label="Öğleden Sonra (12-18)" sublabel="Hafta sonu" value={pricing.weekendAfternoon} onChange={v => setPricingField('weekendAfternoon', v)} />
                <PricingField label="Prime Time (18-24)" sublabel="Hafta sonu" value={pricing.weekendPrime} onChange={v => setPricingField('weekendPrime', v)} isHighlighted />
              </PricingGrid>
            </Section>
          </>
        )}

        {/* ── Tab: Çalışma Saatleri ── */}
        {activeTab === 'Çalışma Saatleri' && (
          <>
            <Section title="Haftalık Program" icon="schedule">
              <div className="space-y-2">
                {(Object.keys(DAY_LABELS) as DayKey[]).map(day => (
                  <DayRow
                    key={day}
                    label={DAY_LABELS[day]}
                    day={workingHours[day]}
                    onChange={(field, value) => setDayHours(day, field, value)}
                  />
                ))}
              </div>
            </Section>
            <InfoBox icon="info" text="Kapalı günlerde rezervasyon alınmaz. Değişiklikler anında geçerli olur." color="blue" />
          </>
        )}

        {activeTab === 'İptal Politikası' && (
          <>
            <Section title="İptal Kuralları" icon="policy">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                    Ücretsiz İptal Süresi
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={cancelPolicy.freeCancelUntilHours}
                      onChange={e => setCancelPolicy(p => ({ ...p, freeCancelUntilHours: Number(e.target.value) }))}
                      className="w-24 bg-secondary border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm text-center focus:outline-none focus:border-primary"
                      min={0} max={168}
                    />
                    <span className="text-slate-400 text-sm">saat öncesine kadar ücretsiz iptal</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">Örn: 24 = maçtan 24 saat öncesine kadar ücretsiz</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                    Geç İptal Cezası
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={cancelPolicy.latePenaltyPercent}
                      onChange={e => setCancelPolicy(p => ({ ...p, latePenaltyPercent: Math.min(100, Math.max(0, Number(e.target.value))) }))}
                      className="w-24 bg-secondary border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm text-center focus:outline-none focus:border-primary"
                      min={0} max={100}
                    />
                    <span className="text-slate-400 text-sm">% kapora iade edilmez</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">Örn: 100 = kapora tamamen yanar · 50 = yarısı iade</p>
                </div>

                {/* Preview */}
                <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-3 mt-2">
                  <p className="text-[11px] text-yellow-300 font-bold mb-1">Politika Önizlemesi</p>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Maçtan <span className="text-white font-bold">{cancelPolicy.freeCancelUntilHours} saat</span> öncesine kadar iptal ücretsiz.<br />
                    Daha geç iptal edilirse kapora'nın{' '}
                    <span className="text-white font-bold">%{cancelPolicy.latePenaltyPercent}</span>'i iade edilmez
                    {cancelPolicy.latePenaltyPercent < 100 ? ` (kalan %${100 - cancelPolicy.latePenaltyPercent} iade edilir)` : ''}.
                  </p>
                </div>
              </div>
            </Section>
            <InfoBox icon="info" text="Bu politika yalnızca bu sahaya ait rezervasyonlara uygulanır." color="blue" />
          </>
        )}

        {/* ── KONUM TAB ── */}
        {activeTab === 'Konum' && venue && (
          <>
            {venue.location?.verifiedAt && (
              <div className="flex items-center gap-2 p-3 bg-green-500/8 border border-green-500/20 rounded-2xl">
                <Icon name="verified" size={14} className="text-green-400" />
                <div>
                  <p className="text-xs font-bold text-green-400">Konum Doğrulandı</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(venue.location.verifiedAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            )}
            <VenueLocationEditor
              venueId={venue.id}
              venueName={venue.name}
              initialLocation={venue.location}
              onSave={(loc: VenueLocation) => {
                onSave(venue.id, { location: loc });
              }}
            />
            <InfoBox icon="place" text="Konum bilgisi haritada aç, yakındaki sahalar ve servis alanı doğrulama için kullanılır. Konum izni yalnızca 'Konumu Doğrula' butonuna tıklandığında istenir." color="blue" />
          </>
        )}

      </div>

      {/* Save button (not shown on Konum tab — saves inline) */}
      {activeTab !== 'Konum' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-secondary/95 backdrop-blur-xl border-t border-white/5 p-4">
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 bg-primary text-secondary shadow-glow hover:bg-green-400 active:scale-[0.98] transition-all"
          >
            <Icon name="save" size={18} /> Değişiklikleri Kaydet
          </button>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────

const inputCls = 'w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all';

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
      <Icon name={icon} size={15} className="text-slate-500" />
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

const SettingField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">{label}</label>
    {children}
  </div>
);

const InfoBox: React.FC<{ icon: string; text: string; color: 'blue' | 'red' | 'yellow' }> = ({ icon, text, color }) => {
  const c = { blue: 'bg-blue-500/8 border-blue-500/20 text-blue-300', red: 'bg-red-500/8 border-red-500/20 text-red-300', yellow: 'bg-yellow-500/8 border-yellow-500/20 text-yellow-300' };
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border p-3 ${c[color]}`}>
      <Icon name={icon} size={14} className="flex-shrink-0 mt-0.5" />
      <p className="text-[11px] leading-relaxed">{text}</p>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
    <span className="text-xs text-slate-500">{label}</span>
    <span className="text-xs font-bold text-slate-300">{value}</span>
  </div>
);

const PricingGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="space-y-3">{children}</div>
);

const PricingField: React.FC<{ label: string; sublabel: string; value: number; onChange: (v: string) => void; isHighlighted?: boolean }> = ({ label, sublabel, value, onChange, isHighlighted }) => (
  <div className={`flex items-center justify-between p-3 rounded-xl border ${isHighlighted ? 'border-primary/30 bg-primary/5' : 'border-white/8 bg-secondary'}`}>
    <div>
      <p className={`text-xs font-bold ${isHighlighted ? 'text-primary' : 'text-white'}`}>{label}</p>
      <p className="text-[10px] text-slate-500">{sublabel}</p>
    </div>
    <div className="relative w-24">
      <input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        type="text"
        inputMode="numeric"
        className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-right text-sm font-black text-white pr-7 focus:outline-none focus:border-primary transition-colors"
      />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold pointer-events-none">₺</span>
    </div>
  </div>
);

const DayRow: React.FC<{
  label: string;
  day: { open: string; close: string; isClosed: boolean };
  onChange: (field: 'open' | 'close' | 'isClosed', value: string | boolean) => void;
}> = ({ label, day, onChange }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${day.isClosed ? 'border-white/5 bg-surface opacity-60' : 'border-white/8 bg-surface'}`}>
    <div className="w-20 flex-shrink-0">
      <p className={`text-xs font-bold ${day.isClosed ? 'text-slate-600' : 'text-white'}`}>{label}</p>
    </div>
    {!day.isClosed ? (
      <div className="flex items-center gap-2 flex-1">
        <TimeSelect value={day.open} onChange={v => onChange('open', v)} />
        <span className="text-slate-600 text-xs">–</span>
        <TimeSelect value={day.close} onChange={v => onChange('close', v)} />
      </div>
    ) : (
      <div className="flex-1 text-center">
        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wide">Kapalı</span>
      </div>
    )}
    {/* Toggle */}
    <button
      onClick={() => onChange('isClosed', !day.isClosed)}
      className={`w-9 h-5 rounded-full relative transition-all flex-shrink-0 ${day.isClosed ? 'bg-white/10' : 'bg-primary'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow ${day.isClosed ? 'left-0.5' : 'left-4'}`} />
    </button>
  </div>
);

const HOURS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 7; // 07:00 – 23:00
  return `${String(h).padStart(2, '0')}:00`;
});

const TimeSelect: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div className="relative flex-1">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-secondary border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs appearance-none focus:outline-none focus:border-primary"
    >
      {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
    </select>
  </div>
);
