import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Player, Venue } from '../types';

interface VenueOwnerOnboardingProps {
  phone: string;
  onComplete: (owner: Player, venue: Venue) => void;
  onBack: () => void;
}

interface FormData {
  // Adım 1 — Kişisel
  firstName: string;
  lastName: string;
  email: string;
  // Adım 2 — İşletme
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  // Adım 3 — Saha
  venueName: string;
  venueDistrict: string;
  venueAddress: string;
  venuePhone: string;
  venuePrice: string;
  venueCapacity: string;
  venueFeatures: string[];
  // Adım 4 — Banka
  iban: string;
  bankName: string;
  accountHolder: string;
}

const DISTRICTS = [
  'Adalar','Arnavutköy','Ataşehir','Avcılar','Bağcılar','Bahçelievler','Bakırköy',
  'Başakşehir','Bayrampaşa','Beşiktaş','Beykoz','Beylikdüzü','Beyoğlu',
  'Büyükçekmece','Çatalca','Çekmeköy','Esenler','Esenyurt','Eyüpsultan',
  'Fatih','Gaziosmanpaşa','Güngören','Kadıköy','Kağıthane','Kartal',
  'Küçükçekmece','Maltepe','Pendik','Sancaktepe','Sarıyer','Şile',
  'Şişli','Silivri','Sultanbeyli','Sultangazi','Tuzla','Ümraniye','Üsküdar',
  'Zeytinburnu',
];

const BANKS = [
  'Ziraat Bankası','İş Bankası','Garanti BBVA','Yapı Kredi','Akbank',
  'Halkbank','Vakıfbank','Denizbank','TEB','QNB Finansbank','İNG',
  'HSBC','Şekerbank','Anadolubank',
];

const FEATURES_LIST = [
  { id: 'parking', label: 'Otopark', icon: 'local_parking' },
  { id: 'shower', label: 'Duş & Soyunma', icon: 'shower' },
  { id: 'cafe', label: 'Kafe / Kantin', icon: 'local_cafe' },
  { id: 'lighting', label: 'Işıklı Saha', icon: 'lightbulb' },
  { id: 'tribunes', label: 'Tribün', icon: 'stadium' },
  { id: 'grass', label: 'Çim Zemin', icon: 'grass' },
  { id: 'indoor', label: 'Kapalı Alan', icon: 'roofing' },
  { id: 'security', label: '7/24 Güvenlik', icon: 'security' },
];

const CAPACITIES = ['5v5', '6v6', '7v7', '8v8', '11v11'];

const STEPS = [
  { label: 'Kişisel', icon: 'person' },
  { label: 'İşletme', icon: 'business' },
  { label: 'Saha', icon: 'stadium' },
  { label: 'Ödeme', icon: 'account_balance' },
];

export const VenueOwnerOnboarding: React.FC<VenueOwnerOnboardingProps> = ({ phone, onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '',
    companyName: '', taxNumber: '', taxOffice: '',
    venueName: '', venueDistrict: 'Kadıköy', venueAddress: '', venuePhone: phone,
    venuePrice: '', venueCapacity: '7v7', venueFeatures: [],
    iban: '', bankName: 'Ziraat Bankası', accountHolder: '',
  });

  const set = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleFeature = (id: string) => {
    setForm(prev => ({
      ...prev,
      venueFeatures: prev.venueFeatures.includes(id)
        ? prev.venueFeatures.filter(f => f !== id)
        : [...prev.venueFeatures, id],
    }));
  };

  const validateStep = (): boolean => {
    const errs: Partial<FormData> = {};
    if (step === 0) {
      if (!form.firstName.trim()) errs.firstName = 'Ad gerekli';
      if (!form.lastName.trim()) errs.lastName = 'Soyad gerekli';
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Geçerli e-posta girin';
    }
    if (step === 1) {
      // Company info is optional — don't block on empty
      if (form.taxNumber && !/^\d{10}$/.test(form.taxNumber.replace(/\s/g, ''))) errs.taxNumber = 'Vergi no 10 haneli olmalı';
    }
    if (step === 2) {
      if (!form.venueName.trim()) errs.venueName = 'Saha adı gerekli';
      if (!form.venueAddress.trim()) errs.venueAddress = 'Adres gerekli';
      if (!form.venuePrice || isNaN(Number(form.venuePrice)) || Number(form.venuePrice) < 100) {
        errs.venuePrice = 'Geçerli bir fiyat girin (min. 100₺)';
      }
    }
    if (step === 3) {
      const cleanIban = form.iban.replace(/\s/g, '');
      // Only validate IBAN format if user entered something
      if (cleanIban && !/^TR\d{24}$/.test(cleanIban)) errs.iban = 'Geçerli IBAN: TR ile başlamalı, 26 karakter';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 3) { setStep(s => s + 1); return; }
    // Final submit
    handleSubmit();
  };

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      const ownerId = 'venue_owner_' + Date.now();
      const venueId = 'v_' + Date.now();

      const newOwner: Player = {
        id: ownerId,
        name: `${form.firstName} ${form.lastName}`,
        position: 'MID',
        rating: 0,
        reliability: 100,
        avatar: `https://i.pravatar.cc/150?u=${ownerId}`,
        role: 'venue_owner',
        tier: 'free',
        venueOwnerInfo: {
          venueIds: [venueId],
          businessInfo: {
            companyName: form.companyName,
            taxNumber: form.taxNumber,
            iban: form.iban.replace(/\s/g, ''),
            bankName: form.bankName,
            accountHolder: form.accountHolder,
          },
          commissionRate: 15,
          totalRevenue: 0,
          totalReservations: 0,
          responseTime: 0,
        },
      };

      const newVenue: Venue = {
        id: venueId,
        name: form.venueName,
        district: form.venueDistrict,
        address: form.venueAddress,
        image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
        price: Number(form.venuePrice),
        rating: 0,
        status: 'pending_review',
        features: form.venueFeatures.map(f => FEATURES_LIST.find(x => x.id === f)?.label ?? f),
        phone: form.venuePhone,
        capacity: form.venueCapacity,
        ownerId: ownerId,
        organizerNotes: {
          doorCode: '-',
          contactPerson: `${form.firstName} ${form.lastName}`,
          contactPhone: form.venuePhone,
          lastUpdate: new Date().toISOString(),
          customNotes: 'Yeni kayıt — onay bekleniyor.',
        },
        priceHistory: [],
      };

      setIsLoading(false);
      onComplete(newOwner, newVenue);
    }, 1800);
  };

  const formatIban = (value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 26);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-secondary flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-secondary/90 backdrop-blur-xl border-b border-white/5 px-5 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onBack()}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <Icon name="arrow_back" size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-white font-black text-lg leading-none">Saha Sahibi Kaydı</h1>
            <p className="text-slate-500 text-[11px] mt-0.5">{STEPS[step].label} — Adım {step + 1} / 4</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 relative">
              <div className={`h-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-blue-500' : 'bg-white/10'}`} />
            </div>
          ))}
        </div>

        {/* Step icons */}
        <div className="flex mt-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                i < step ? 'bg-blue-500' : i === step ? 'bg-blue-500/20 border border-blue-500' : 'bg-white/5'
              }`}>
                {i < step
                  ? <Icon name="check" size={12} className="text-white" />
                  : <Icon name={s.icon} size={12} className={i === step ? 'text-blue-400' : 'text-slate-700'} />
                }
              </div>
              <span className={`text-[8px] font-bold mt-0.5 ${i <= step ? 'text-blue-400' : 'text-slate-700'}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">

        {/* STEP 0 — Kişisel Bilgiler */}
        {step === 0 && (
          <StepContainer
            title="Kişisel Bilgiler"
            subtitle="Hesabınıza bağlı temel bilgiler."
            icon="person"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ad *" error={errors.firstName}>
                <input value={form.firstName} onChange={e => set('firstName', e.target.value)}
                  placeholder="Kemal" autoFocus
                  className={inputCls(!!errors.firstName)} />
              </Field>
              <Field label="Soyad *" error={errors.lastName}>
                <input value={form.lastName} onChange={e => set('lastName', e.target.value)}
                  placeholder="Arslan"
                  className={inputCls(!!errors.lastName)} />
              </Field>
            </div>
            <Field label="Telefon">
              <div className="flex items-center bg-surface border border-green-500/20 rounded-xl px-4 py-3.5 gap-2">
                <span className="text-base">🇹🇷</span>
                <span className="text-white font-bold text-sm">+90 {(phone.length === 10 ? phone : phone.slice(-10)).replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4')}</span>
                <div className="ml-auto flex items-center gap-1">
                  <Icon name="verified" size={14} className="text-green-400" />
                  <span className="text-[10px] font-bold text-green-400">Onaylandı</span>
                </div>
              </div>
            </Field>
            <Field label="E-posta (opsiyonel)" error={errors.email}>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                type="email" placeholder="ornek@email.com"
                className={inputCls(!!errors.email)} />
            </Field>
          </StepContainer>
        )}

        {/* STEP 1 — İşletme */}
        {step === 1 && (
          <StepContainer
            title="İşletme Bilgileri"
            subtitle="Fatura ve yasal işlemler için gereklidir."
            icon="business"
          >
            <Field label="Şirket / İşletme Adı *" error={errors.companyName}>
              <input value={form.companyName} onChange={e => set('companyName', e.target.value)}
                placeholder="Arslan Spor Tesisleri" autoFocus
                className={inputCls(!!errors.companyName)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vergi Numarası" error={errors.taxNumber}>
                <input value={form.taxNumber} onChange={e => set('taxNumber', e.target.value)}
                  placeholder="1234567890" maxLength={10}
                  className={inputCls(!!errors.taxNumber)} />
              </Field>
              <Field label="Vergi Dairesi">
                <input value={form.taxOffice} onChange={e => set('taxOffice', e.target.value)}
                  placeholder="Kadıköy"
                  className={inputCls(false)} />
              </Field>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Icon name="info" size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Şirket bilgileri isteğe bağlıdır. Ödeme ve fatura işlemleri için kullanılır.
                  Bireysel saha sahipleri bu adımı atlayabilir.
                </p>
              </div>
            </div>
          </StepContainer>
        )}

        {/* STEP 2 — Saha Bilgileri */}
        {step === 2 && (
          <StepContainer
            title="Saha Bilgileri"
            subtitle="Sahanızın müşterilere gösterilecek detayları."
            icon="stadium"
          >
            <Field label="Saha Adı *" error={errors.venueName}>
              <input value={form.venueName} onChange={e => set('venueName', e.target.value)}
                placeholder="Olimpik Halı Saha" autoFocus
                className={inputCls(!!errors.venueName)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="İlçe *">
                <div className="relative">
                  <select value={form.venueDistrict} onChange={e => set('venueDistrict', e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm appearance-none focus:outline-none focus:border-blue-500 transition-colors">
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Icon name="expand_more" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </Field>
              <Field label="Kapasite">
                <div className="relative">
                  <select value={form.venueCapacity} onChange={e => set('venueCapacity', e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm appearance-none focus:outline-none focus:border-blue-500 transition-colors">
                    {CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Icon name="expand_more" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </Field>
            </div>

            <Field label="Tam Adres *" error={errors.venueAddress}>
              <textarea value={form.venueAddress} onChange={e => set('venueAddress', e.target.value)}
                placeholder="Moda Caddesi No:12, Kadıköy / İstanbul" rows={2}
                className={`${inputCls(!!errors.venueAddress)} resize-none`} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Saha Telefonu">
                <input value={form.venuePhone} onChange={e => set('venuePhone', e.target.value)}
                  type="tel" placeholder="5XX XXX XX XX"
                  className={inputCls(false)} />
              </Field>
              <Field label="Saatlik Fiyat (₺) *" error={errors.venuePrice}>
                <div className="relative">
                  <input value={form.venuePrice} onChange={e => set('venuePrice', e.target.value.replace(/\D/g, ''))}
                    type="text" inputMode="numeric" placeholder="1200"
                    className={`${inputCls(!!errors.venuePrice)} pr-8`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">₺</span>
                </div>
              </Field>
            </div>

            {/* Özellikler */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                Saha Özellikleri
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FEATURES_LIST.map(f => {
                  const active = form.venueFeatures.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFeature(f.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                          : 'border-white/10 bg-surface text-slate-500 hover:border-white/20'
                      }`}
                    >
                      <Icon name={f.icon} size={15} />
                      <span className="text-[11px] font-bold">{f.label}</span>
                      {active && <Icon name="check" size={13} className="ml-auto text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </StepContainer>
        )}

        {/* STEP 3 — Banka Bilgileri */}
        {step === 3 && (
          <StepContainer
            title="Ödeme Bilgileri"
            subtitle="Gelirlerinizin aktarılacağı hesap bilgileri."
            icon="account_balance"
          >
            <Field label="Banka">
              <div className="relative">
                <select value={form.bankName} onChange={e => set('bankName', e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm appearance-none focus:outline-none focus:border-blue-500 transition-colors">
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <Icon name="expand_more" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </Field>

            <Field label="IBAN *" error={errors.iban}>
              <input
                value={form.iban}
                onChange={e => set('iban', formatIban(e.target.value))}
                placeholder="TR33 0006 1005 1978 6457 8413 26"
                maxLength={32}
                className={`${inputCls(!!errors.iban)} font-mono tracking-wider`}
              />
            </Field>

            <Field label="Hesap Sahibi Adı *" error={errors.accountHolder}>
              <input value={form.accountHolder} onChange={e => set('accountHolder', e.target.value)}
                placeholder="Kemal Arslan"
                className={inputCls(!!errors.accountHolder)} />
            </Field>

            {/* Komisyon bilgisi */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="info" size={15} className="text-blue-400" />
                <span className="text-xs font-bold text-white">Ödeme Koşulları</span>
              </div>
              <CommissionRow label="Komisyon Oranı" value="%15" />
              <CommissionRow label="Ödeme Periyodu" value="Haftalık" />
              <CommissionRow label="Min. Ödeme" value="500₺" />
              <p className="text-[10px] text-slate-600 pt-1 border-t border-white/5">
                Her onaylanan rezervasyondan %15 platform komisyonu kesilir. Kalan tutar her Pazartesi IBAN'ınıza transfer edilir.
              </p>
            </div>

            {/* Son onay */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Icon name="verified_user" size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-blue-300 leading-relaxed">
                  Kayıt tamamlandıktan sonra sahanız <strong>24 saat içinde</strong> ekibimiz tarafından incelenerek onaylanacaktır.
                  Onay sonrası rezervasyonlar alınmaya başlanacaktır.
                </p>
              </div>
            </div>
          </StepContainer>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="flex-shrink-0 bg-secondary/95 backdrop-blur-xl border-t border-white/5 p-5 space-y-2">
        <button
          onClick={handleNext}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Icon name="refresh" size={20} className="animate-spin" />
              <span>Kayıt tamamlanıyor...</span>
            </>
          ) : step < 3 ? (
            <><span>Devam Et</span><Icon name="arrow_forward" size={16} /></>
          ) : (
            <><Icon name="check_circle" size={18} /><span>Kaydı Tamamla</span></>
          )}
        </button>

        {/* Optional steps can be skipped */}
        {(step === 1 || step === 3) && (
          <button
            onClick={() => {
              if (step === 1) { setStep(2); return; }      // skip vergi → saha
              if (step === 3) { handleSubmit(); }           // skip banka → finish without IBAN
            }}
            className="w-full py-2.5 text-slate-600 text-xs font-bold hover:text-slate-400 transition-colors flex items-center justify-center gap-1"
          >
            <Icon name="skip_next" size={13} />
            {step === 1 ? 'Bu adımı atla (Şirket bilgisi opsiyonel)' : 'Şimdilik atla — IBAN sonra eklenebilir'}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Helper Components ──────────────────────────────────────────────────────

const inputCls = (hasError: boolean) =>
  `w-full bg-surface border rounded-xl px-4 py-3.5 text-white text-sm placeholder-slate-700 focus:outline-none transition-all ${
    hasError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
  }`;

const StepContainer: React.FC<{ title: string; subtitle: string; icon: string; children: React.ReactNode }> = ({ title, subtitle, icon, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
        <Icon name={icon} size={20} className="text-blue-400" />
      </div>
      <div>
        <h2 className="text-white font-black text-base">{title}</h2>
        <p className="text-slate-500 text-xs">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{label}</label>
    {children}
    {error && (
      <p className="text-red-400 text-[10px] flex items-center gap-1">
        <Icon name="error_outline" size={11} />{error}
      </p>
    )}
  </div>
);

const CommissionRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-[11px] text-slate-500">{label}</span>
    <span className="text-[11px] font-bold text-white">{value}</span>
  </div>
);
