
import React, { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { ScreenName } from '../types';

interface WelcomeScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

const TESTIMONIALS = [
  { text: "Kadro kurmak artık işkence değil.", author: "Ahmet Y. (Kaptan)" },
  { text: "Borç takibi için birebir.", author: "Mehmet K. (Admin)" },
  { text: "İstatistiklerimi görmek motive ediyor.", author: "Caner E. (Forvet)" }
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col justify-end overflow-hidden bg-secondary">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
          alt="Football Pitch Night" 
          className="w-full h-full object-cover animate-[pulse_10s_ease-in-out_infinite] scale-110"
        />
        {/* Gradient Mesh Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/80 to-transparent z-20"></div>
      </div>

      {/* Top Brand Badge */}
      <div className="absolute top-12 left-0 right-0 z-30 flex justify-center animate-fade-in">
         <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-white tracking-widest uppercase">10.000+ Oyuncu Sahada</span>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-30 px-6 pb-safe-bottom w-full max-w-md mx-auto">
        
        {/* Hero Typography */}
        <div className="mb-8 text-center">
          <div className="inline-block p-4 rounded-3xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)] transform -rotate-3">
             <Icon name="sports_soccer" size={48} className="text-primary" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter italic drop-shadow-2xl">
            SAHADA
          </h1>
          <p className="text-lg text-slate-300 font-light mt-2 tracking-wide">
            Maç Senin. <span className="text-primary font-bold">Kontrol Sende.</span>
          </p>
        </div>

        {/* Sliding Testimonials / Features */}
        <div className="h-20 mb-8 relative flex items-center justify-center">
           {TESTIMONIALS.map((item, index) => (
             <div 
               key={index}
               className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-out transform ${
                 index === activeTestimonial 
                   ? 'opacity-100 translate-y-0 scale-100' 
                   : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
               }`}
             >
                <p className="text-sm text-center text-white/90 font-medium italic">"{item.text}"</p>
                <div className="flex items-center gap-1 mt-2">
                   <Icon name="star" size={12} className="text-yellow-500" filled />
                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.author}</span>
                </div>
             </div>
           ))}
        </div>

        {/* Primary Actions Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl animate-slide-up mb-6">
           <button 
             onClick={() => onNavigate('login')}
             className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-bold text-base shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group mb-3"
           >
             Hemen Başla <Icon name="arrow_forward" size={20} className="group-hover:translate-x-1 transition-transform" />
           </button>
           
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onNavigate('login')}
                className="bg-secondary/50 hover:bg-secondary/80 border border-white/5 text-white py-3 rounded-xl font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                 <Icon name="add_circle" size={16} className="text-slate-400" />
                 Takım Kur
              </button>
              <button 
                onClick={() => onNavigate('joinTeam')}
                className="bg-secondary/50 hover:bg-secondary/80 border border-white/5 text-white py-3 rounded-xl font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                 <Icon name="qr_code" size={16} className="text-slate-400" />
                 Koda Katıl
              </button>
           </div>
        </div>

        {/* Footer Legal */}
        <p className="text-[9px] text-center text-slate-500 pb-4 opacity-60">
           Devam ederek Hizmet Şartları ve Gizlilik Politikasını kabul etmiş sayılırsınız. © 2024 Sahada App
        </p>

      </div>
    </div>
  );
};
