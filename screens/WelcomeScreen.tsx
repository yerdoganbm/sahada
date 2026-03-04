import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { ScreenName } from '../types';

interface WelcomeScreenProps {
  onNavigate: (screen: ScreenName, params?: any) => void;
}

const PLAYER_FEATURES = [
  { icon: 'sports_soccer', text: 'Maç oluştur & katıl' },
  { icon: 'groups', text: 'Takımını yönet' },
  { icon: 'leaderboard', text: 'İstatistik takibi' },
  { icon: 'payments', text: 'Borç & ödeme takibi' },
];

const VENUE_FEATURES = [
  { icon: 'event_available', text: 'Rezervasyonları onayla' },
  { icon: 'bar_chart', text: 'Gelir & doluluk raporu' },
  { icon: 'manage_accounts', text: 'Müşteri yönetimi' },
  { icon: 'calendar_month', text: 'Saha takvimi' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  const [selected, setSelected] = useState<'player' | 'venue_owner' | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    onNavigate('login', { userType: selected });
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col overflow-hidden relative">
      {/* Ambient BG */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/3" />
      </div>

      {/* Brand Header */}
      <div className="relative z-10 flex flex-col items-center pt-14 pb-5 px-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center shadow-[0_0_28px_rgba(16,185,129,0.4)] mb-4 transform -rotate-3">
          <Icon name="sports_soccer" size={34} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter italic">SAHADA</h1>
        <p className="text-slate-500 text-sm mt-1 font-light tracking-wider">Maç Senin. Kontrol Sende.</p>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pb-8">
        <p className="text-center text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">
          Nasıl kullanmak istiyorsun?
        </p>

        <div className="space-y-3 mb-5">
          <RoleCard
            selected={selected === 'player'}
            onSelect={() => setSelected('player')}
            icon="sports_soccer"
            title="Oyuncuyum"
            subtitle="Maç oyna, takım yönet, istatistik takip et"
            accentColor="green"
            features={PLAYER_FEATURES}
            badge="Ücretsiz"
            badgeColor="bg-primary/20 text-primary"
          />
          <RoleCard
            selected={selected === 'venue_owner'}
            onSelect={() => setSelected('venue_owner')}
            icon="stadium"
            title="Saha Sahibiyim"
            subtitle="Rezervasyon yönet, gelir takip et, sahan dolsun"
            accentColor="blue"
            features={VENUE_FEATURES}
            badge="İş Ortağı"
            badgeColor="bg-blue-500/20 text-blue-400"
          />
        </div>

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] ${
            selected
              ? selected === 'venue_owner'
                ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)]'
                : 'bg-primary text-secondary shadow-[0_0_20px_rgba(16,185,129,0.35)]'
              : 'bg-white/5 text-slate-700 cursor-not-allowed border border-white/5'
          }`}
        >
          {selected ? (
            <><span>Devam Et</span><Icon name="arrow_forward" size={18} /></>
          ) : (
            'Bir seçenek seç'
          )}
        </button>

        <div className="flex items-center gap-3 mt-4 mb-4">
          <div className="h-px bg-white/5 flex-1" />
          <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">veya</span>
          <div className="h-px bg-white/5 flex-1" />
        </div>

        <button
          onClick={() => onNavigate('phoneAuth')}
          className="w-full py-3.5 rounded-2xl bg-green-500/8 border border-green-500/20 text-green-400 font-bold text-sm hover:bg-green-500/12 transition-all flex items-center justify-center gap-2"
        >
          <Icon name="phone" size={16} />
          Davet Koduyla Gir (Oyuncu)
        </button>

        <button
          onClick={() => onNavigate('login')}
          className="w-full py-3.5 rounded-2xl border border-white/10 text-slate-400 font-bold text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2"
        >
          <Icon name="login" size={16} />
          Zaten hesabım var, giriş yap
        </button>

        <p className="text-[9px] text-center text-slate-700 mt-6 leading-relaxed">
          Devam ederek{' '}
          <span className="text-slate-500 underline cursor-pointer">Kullanım Koşulları</span>{' '}
          ve{' '}
          <span className="text-slate-500 underline cursor-pointer">Gizlilik Politikası</span>'nı kabul edersiniz.
        </p>
      </div>
    </div>
  );
};

interface RoleCardProps {
  selected: boolean;
  onSelect: () => void;
  icon: string;
  title: string;
  subtitle: string;
  accentColor: 'green' | 'blue';
  features: { icon: string; text: string }[];
  badge: string;
  badgeColor: string;
}

const RoleCard: React.FC<RoleCardProps> = ({
  selected, onSelect, icon, title, subtitle, accentColor, features, badge, badgeColor
}) => {
  const a = accentColor === 'green'
    ? { border: 'border-primary', from: 'from-primary/8', ico: 'text-primary', divider: 'border-primary/20', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]', radio: 'border-primary bg-primary' }
    : { border: 'border-blue-500', from: 'from-blue-500/8', ico: 'text-blue-400', divider: 'border-blue-500/20', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.12)]', radio: 'border-blue-500 bg-blue-500' };

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-300 bg-gradient-to-br to-transparent ${
        selected
          ? `${a.border} ${a.from} ${a.glow}`
          : 'border-white/8 bg-white/3 hover:border-white/15'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
          selected ? `${a.from} border border-white/10` : 'bg-white/5'
        }`}>
          <Icon name={icon} size={24} className={selected ? a.ico : 'text-slate-600'} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={`font-black text-sm ${selected ? 'text-white' : 'text-slate-400'}`}>{title}</h3>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">{subtitle}</p>
        </div>

        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
          selected ? a.radio : 'border-slate-700'
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>

      {/* Expanded features */}
      <div className={`overflow-hidden transition-all duration-300 ${selected ? 'max-h-24 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className={`border-t ${a.divider} pt-3 grid grid-cols-2 gap-y-1.5`}>
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Icon name={f.icon} size={11} className={a.ico} />
              <span className="text-[10px] text-slate-500">{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
};
