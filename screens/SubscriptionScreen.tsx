
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { SubscriptionTier, Player } from '../types';

interface SubscriptionScreenProps {
  onBack: () => void;
  onUpgrade: (tier: SubscriptionTier) => void;
  currentUser: Player;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ onBack, onUpgrade, currentUser }) => {
  // Determine role-based view settings
  const isAdmin = currentUser.role === 'admin';
  const isPartner = currentUser.tier === 'partner';
  // Normal member can ONLY see player packs. Partners and Admins can see Venue packs.
  const canSeeVenuePacks = isAdmin || isPartner;

  // Default tab: Partners see venue first, others see player first
  const [targetAudience, setTargetAudience] = useState<'player' | 'venue'>(isPartner ? 'venue' : 'player');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('free');

  const initiatePurchase = (tier: SubscriptionTier) => {
      // Admins already have everything defined
      if (isAdmin) return;
      
      setSelectedTier(tier);
      setShowPaymentModal(true);
  };

  return (
    <div className="bg-secondary min-h-screen pb-safe-bottom relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 right-0 h-[60vh] bg-gradient-to-b from-slate-900 to-secondary pointer-events-none" />
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
         <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
           <Icon name="arrow_back" className="text-white" />
         </button>
         <h1 className="font-bold text-white text-lg">Üyelik Paketleri</h1>
         <div className="w-10"></div>
      </div>

      <div className="p-6 relative z-10">
        
        {/* Admin Special Banner */}
        {isAdmin && (
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-2xl mb-6 shadow-lg shadow-purple-900/40 border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                    <Icon name="admin_panel_settings" className="text-white" size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">Sistem Yöneticisi</h3>
                    <p className="text-[10px] text-purple-100">Tüm paketler ve yetkiler hesabınızda tanımlıdır.</p>
                </div>
            </div>
        )}

        {/* Toggle User Type (Only visible if authorized) */}
        {canSeeVenuePacks && (
            <div className="flex justify-center mb-6">
            <div className="bg-surface p-1 rounded-2xl border border-white/10 flex">
                <button 
                    onClick={() => setTargetAudience('player')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${targetAudience === 'player' ? 'bg-primary text-secondary shadow-lg' : 'text-slate-400'}`}
                >
                    Oyuncular İçin
                </button>
                <button 
                    onClick={() => setTargetAudience('venue')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${targetAudience === 'venue' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400'}`}
                >
                    Saha Sahipleri
                </button>
            </div>
            </div>
        )}

        {/* Header Text */}
        <div className="text-center mb-8">
           <h2 className="text-2xl font-bold text-white mb-2">
              {targetAudience === 'player' ? 'Sahada Yıldızlaş!' : 'İşletmeni Büyüt'}
           </h2>
           <p className="text-slate-400 text-sm max-w-xs mx-auto">
              {targetAudience === 'player' 
                ? 'Detaylı istatistikler, öncelikli rezervasyon ve scouting özelliklerine eriş.' 
                : 'Rezervasyon takibi, gelir raporları ve müşteri yönetimi tek ekranda.'}
           </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-8">
           <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Aylık</span>
           <button 
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className={`w-12 h-6 rounded-full relative transition-colors ${billingCycle === 'monthly' ? 'bg-slate-700' : 'bg-green-500'}`}
           >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${billingCycle === 'monthly' ? 'translate-x-0' : 'translate-x-6'}`} />
           </button>
           <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-500'}`}>Yıllık</span>
              <span className="bg-green-500/20 text-green-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-green-500/20">-%20</span>
           </div>
        </div>

        {/* Pricing Cards */}
        <div className="space-y-6">
           
           {targetAudience === 'player' ? (
             <>
               {/* Free Plan */}
               <PricingCard 
                  title="Starter"
                  price="Ücretsiz"
                  features={[
                     'Maçlara katıl ve oluştur',
                     'Temel profil istatistikleri',
                     'Takım sohbeti',
                     'Reklamlı deneyim'
                  ]}
                  buttonText={isAdmin ? "Tanımlı (Varsayılan)" : "Mevcut Plan"}
                  isCurrent
               />
               
               {/* Pro Plan */}
               <PricingCard 
                  title="Pro Baller"
                  price={billingCycle === 'monthly' ? '₺49.99' : '₺479.99'}
                  period={billingCycle === 'monthly' ? '/ay' : '/yıl'}
                  features={[
                     'Detaylı Scouting Analizleri (Pas, Şut vb.)',
                     'Maç sonu MVP oylamasında x2 Puan',
                     'Sınırsız Kadro Taslağı Kaydetme',
                     'Profilde "Premium" Rozeti',
                     'Reklamsız Deneyim'
                  ]}
                  buttonText={isAdmin ? "Yönetici Yetkisi" : "Pro'ya Geç"}
                  isPremium
                  recommend
                  disabled={isAdmin}
                  onClick={() => initiatePurchase('premium')}
               />
             </>
           ) : (
             <>
                {/* Venue Plan */}
                <PricingCard 
                   title="Saha Partner"
                   price={billingCycle === 'monthly' ? '₺499.00' : '₺4,999.00'}
                   period={billingCycle === 'monthly' ? '/ay' : '/yıl'}
                   features={[
                      'Saha Yönetim Paneli',
                      'Online Rezervasyon Alma',
                      'Gelir/Gider Raporları',
                      'Müşteri Veritabanı (CRM)',
                      'Uygulamada "Öne Çıkan Saha" etiketi',
                      '7/24 Öncelikli Destek'
                   ]}
                   buttonText={isAdmin ? "Yönetici Yetkisi" : "İşletmeni Ekle"}
                   isVenue
                   recommend
                   disabled={isAdmin}
                   onClick={() => initiatePurchase('partner')}
                />
             </>
           )}

        </div>

        <p className="text-center text-[10px] text-slate-500 mt-8">
           İptal etmek isterseniz, fatura döneminiz bitmeden 24 saat önce ayarlar menüsünden aboneliğinizi sonlandırabilirsiniz.
        </p>

        {/* Payment Simulation Modal */}
        {showPaymentModal && (
            <PaymentModal 
                tier={selectedTier} 
                onClose={() => setShowPaymentModal(false)} 
                onSuccess={(tier) => {
                    onUpgrade(tier);
                    setShowPaymentModal(false);
                    onBack();
                }} 
            />
        )}

      </div>
    </div>
  );
};

interface PricingCardProps {
   title: string;
   price: string;
   period?: string;
   features: string[];
   buttonText: string;
   isPremium?: boolean;
   isVenue?: boolean;
   isCurrent?: boolean;
   recommend?: boolean;
   onClick?: () => void;
   disabled?: boolean;
}

const PricingCard = ({ title, price, period, features, buttonText, isPremium, isVenue, isCurrent, recommend, onClick, disabled }: PricingCardProps) => (
   <div className={`relative rounded-3xl p-6 border transition-all duration-300 ${
      isPremium 
         ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]' 
      : isVenue
         ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
      : 'bg-surface border-white/5'
   }`}>
      {recommend && (
         <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${isVenue ? 'bg-blue-500 text-white' : 'bg-yellow-500 text-black'}`}>
            En Popüler
         </div>
      )}

      <div className="flex justify-between items-start mb-4">
         <div>
            <h3 className={`text-lg font-bold ${isPremium ? 'text-yellow-400' : isVenue ? 'text-blue-400' : 'text-white'}`}>{title}</h3>
            {isPremium && <span className="text-[10px] text-slate-400">Yıldız oyuncular için</span>}
         </div>
         {isPremium && <Icon name="workspace_premium" className="text-yellow-500" size={24} />}
         {isVenue && <Icon name="storefront" className="text-blue-500" size={24} />}
      </div>

      <div className="flex items-baseline gap-1 mb-6">
         <span className="text-3xl font-black text-white tracking-tight">{price}</span>
         {period && <span className="text-sm text-slate-500">{period}</span>}
      </div>

      <div className="space-y-3 mb-8">
         {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-3">
               <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isPremium ? 'bg-yellow-500/20 text-yellow-500' : isVenue ? 'bg-blue-500/20 text-blue-500' : 'bg-slate-700 text-slate-400'
               }`}>
                  <Icon name="check" size={12} />
               </div>
               <span className="text-sm text-slate-300 leading-tight">{feature}</span>
            </div>
         ))}
      </div>

      <button 
         onClick={onClick}
         disabled={disabled || isCurrent}
         className={`w-full py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
            disabled 
               ? 'bg-white/10 text-white border border-white/20 cursor-default opacity-80' 
            : isCurrent 
               ? 'bg-white/5 text-slate-400 border border-white/10 cursor-default' 
            : isPremium 
               ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]' 
            : isVenue 
               ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
               : 'bg-primary text-secondary'
         }`}
      >
         {buttonText}
      </button>

   </div>
);

const PaymentModal = ({ tier, onClose, onSuccess }: { tier: SubscriptionTier, onClose: () => void, onSuccess: (t: SubscriptionTier) => void }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Form, 2: Processing, 3: Success

    const handlePay = () => {
        setStep(2);
        setTimeout(() => {
            setStep(3);
            setTimeout(() => {
                onSuccess(tier);
            }, 1500);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-slide-up">
                {step === 1 && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white text-lg">Ödeme Bilgileri</h3>
                            <button onClick={onClose}><Icon name="close" className="text-slate-400" /></button>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl border border-white/5 mb-4">
                                <div className="flex justify-between items-center mb-4">
                                    <Icon name="contactless" className="text-slate-400" />
                                    <span className="text-xs font-bold text-white font-mono">VISA</span>
                                </div>
                                <div className="text-lg font-mono text-slate-300 tracking-widest mb-4">**** **** **** 4242</div>
                                <div className="flex justify-between">
                                    <div className="text-xs text-slate-500 uppercase">Card Holder<br/><span className="text-slate-300">AHMET YILMAZ</span></div>
                                    <div className="text-xs text-slate-500 uppercase">Expires<br/><span className="text-slate-300">12/25</span></div>
                                </div>
                            </div>

                            <button onClick={handlePay} className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-xl font-bold shadow-glow active:scale-95 transition-transform">
                                {tier === 'partner' ? '₺499.00 Öde' : '₺49.99 Öde'}
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
                            <Icon name="lock" size={12} /> Güvenli Ödeme Altyapısı
                        </p>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-10 flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h3 className="text-white font-bold">İşleminiz Yapılıyor...</h3>
                        <p className="text-slate-400 text-sm mt-2">Lütfen bekleyiniz, bankanızla iletişim kuruluyor.</p>
                    </div>
                )}

                {step === 3 && (
                    <div className="p-10 flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                            <Icon name="check" className="text-white" size={32} />
                        </div>
                        <h3 className="text-white font-bold text-xl">Ödeme Başarılı!</h3>
                        <p className="text-slate-400 text-sm mt-2 text-center">Aboneliğiniz anında aktif edildi. Yönlendiriliyorsunuz...</p>
                    </div>
                )}
            </div>
        </div>
    );
};
