
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Venue, Player, ScreenName } from '../types';

interface VenueDetailsProps {
  venueId: string;
  venues: Venue[];
  onBack: () => void;
  onNavigate: (screen: ScreenName, params?: any) => void;
  currentUser: Player;
}

export const VenueDetails: React.FC<VenueDetailsProps> = ({ venueId, venues, onBack, onNavigate, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'admin'>('info');
  const venue = venues.find(v => v.id === venueId) || venues[0];

  const canManage = currentUser.role === 'admin' || currentUser.tier === 'partner';

  return (
    <div className="bg-secondary min-h-screen pb-24">
      {/* Hero Image Section */}
      <div className="relative h-64 w-full">
         <img src={venue.image} className="w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/50 to-transparent"></div>
         
         {/* Top Nav Overlay */}
         <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top flex justify-between items-center">
            <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
               <Icon name="arrow_back" />
            </button>
            <div className="flex gap-2">
               <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                  <Icon name="share" />
               </button>
            </div>
         </div>

         {/* Venue Title Overlay */}
         <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
               <span className="bg-primary text-secondary text-[10px] font-bold px-2 py-0.5 rounded uppercase">Popüler</span>
               <div className="flex text-yellow-500">
                  <Icon name="star" size={12} filled />
                  <Icon name="star" size={12} filled />
                  <Icon name="star" size={12} filled />
                  <Icon name="star" size={12} filled />
                  <Icon name="star_half" size={12} filled />
               </div>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight leading-none mb-1">{venue.name}</h1>
            <p className="text-slate-300 text-sm flex items-center gap-1">
               <Icon name="location_on" size={14} /> {venue.district}, İstanbul • 2.4 km mesafe
            </p>
         </div>
      </div>

      {/* Tab Switcher - Only for Admins/Partners */}
      {canManage && (
          <div className="px-4 py-4">
             <div className="bg-surface rounded-xl p-1 flex border border-white/5">
                <button 
                   onClick={() => setActiveTab('info')}
                   className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'info' ? 'bg-primary text-secondary shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                   Saha Detayları
                </button>
                <button 
                   onClick={() => setActiveTab('admin')}
                   className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-primary text-secondary shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                   Yönetici Notları
                </button>
             </div>
          </div>
      )}

      <div className={`px-4 ${!canManage ? 'mt-4' : ''}`}>
         {activeTab === 'admin' && canManage ? (
            <div className="space-y-6 animate-fade-in">
               {/* Organizer Note Card */}
               <div className="bg-surface rounded-2xl p-5 border border-white/5 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-2">
                        <Icon name="sticky_note_2" className="text-blue-400" />
                        <h3 className="font-bold text-white text-lg">Organizatör Notları</h3>
                     </div>
                     <span className="text-[10px] text-slate-500 italic">Son güncelleme: {venue.organizerNotes?.lastUpdate}</span>
                  </div>
                  
                  <div className="space-y-3 font-mono text-sm">
                     <div className="bg-secondary/50 p-3 rounded-xl border border-white/5">
                        <p className="text-slate-300 mb-2">{venue.organizerNotes?.customNotes}</p>
                        <p className="text-slate-300">Soyunma odası şifresi: <span className="text-white font-bold">{venue.organizerNotes?.doorCode}</span></p>
                     </div>
                     <div className="flex justify-end">
                        <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded border border-green-500/20 flex items-center gap-1">
                           <Icon name="check" size={12} /> Otomatik Kaydedildi
                        </span>
                        <button className="ml-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors">
                           GÜNCELLE
                        </button>
                     </div>
                  </div>
               </div>

               {/* Contact Person */}
               <div className="bg-surface rounded-2xl p-5 border border-white/5">
                  <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                     <Icon name="badge" className="text-blue-400" /> Saha Yetkilileri
                  </h3>
                  <div className="bg-secondary/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                     <div>
                        <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Saha Sorumlusu</span>
                        <div className="text-white font-bold text-lg">{venue.organizerNotes?.contactPerson}</div>
                        <div className="text-slate-400 font-mono text-sm">{venue.organizerNotes?.contactPhone}</div>
                     </div>
                     <button className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center text-primary hover:bg-primary hover:text-secondary transition-colors">
                        <Icon name="phone" size={20} />
                     </button>
                  </div>
                  <button className="w-full mt-3 py-3 rounded-xl border border-dashed border-slate-700 text-slate-500 text-xs font-bold hover:bg-white/5 transition-colors">
                     + YETKİLİ EKLE
                  </button>
               </div>

               {/* Price History */}
               <div className="bg-surface rounded-2xl p-5 border border-white/5">
                  <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2">
                        <Icon name="trending_up" className="text-blue-400" />
                        <h3 className="font-bold text-white text-lg">Fiyat Değişimleri</h3>
                     </div>
                     <button className="text-blue-400 text-xs font-bold bg-blue-400/10 px-2 py-1 rounded hover:bg-blue-400/20 transition-colors">Ekle +</button>
                  </div>
                  
                  <div className="space-y-4 relative">
                     {/* Timeline Line */}
                     <div className="absolute top-2 bottom-2 left-[19px] w-[2px] bg-slate-800"></div>

                     {venue.priceHistory && venue.priceHistory.length > 0 ? (
                        venue.priceHistory.map((history, i) => (
                           <div key={i} className="flex gap-4 relative z-10">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-surface ${i === 0 ? 'bg-primary text-secondary' : 'bg-slate-700 text-slate-400'}`}>
                                 <Icon name={i===0 ? "arrow_upward" : "remove"} size={16} />
                              </div>
                              <div className="flex-1">
                                 <span className="text-xs text-slate-500 font-bold block mb-0.5">{history.date}</span>
                                 <div className="text-white font-bold text-lg font-mono">{history.price} TL <span className={`text-[10px] ml-1 px-1.5 py-0.5 rounded ${i===0 ? 'bg-red-500/20 text-red-400' : ''}`}>{i===0 ? '+25%' : ''}</span></div>
                                 <div className="text-slate-400 text-xs">Sebep: {history.reason}</div>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="text-slate-500 text-sm pl-10">Geçmiş fiyat verisi bulunamadı.</div>
                     )}
                  </div>
               </div>
            </div>
         ) : (
            <div className="space-y-6 animate-fade-in">
               {/* Quick Stats */}
               <div className="grid grid-cols-4 gap-3">
                  <InfoCard label="Saatlik" value={`₺${venue.price}`} icon="payments" color="text-primary" />
                  <InfoCard label="Zemin" value="FIFA Suni" icon="grass" color="text-green-400" />
                  <InfoCard label="Kapasite" value={venue.capacity} icon="groups" color="text-blue-400" />
                  <InfoCard label="Otopark" value="Ücretsiz" icon="local_parking" color="text-purple-400" />
               </div>

               {/* Features */}
               <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
                  <h3 className="font-bold text-white text-lg mb-3 flex items-center gap-2">
                     <Icon name="info" className="text-primary" /> Tesis Notları
                  </h3>
                  <ul className="space-y-2">
                     {venue.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                           <Icon name="check_circle" size={16} className="text-primary mt-0.5" />
                           {feature} var.
                        </li>
                     ))}
                     <li className="flex items-start gap-2 text-sm text-slate-300">
                        <Icon name="check_circle" size={16} className="text-primary mt-0.5" />
                        Krampon zorunluluğu yoktur.
                     </li>
                  </ul>
               </div>

               {/* Map / Location */}
               <div className="bg-surface rounded-2xl p-1 border border-white/5">
                  <div className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-800">
                     <div className="absolute inset-0 opacity-50 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/29.0,41.0,13,0/400x150?access_token=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja2xsN3F3OG0wMDc2MnB0Ynh5cm15ZnVyIn0.7j_k9lQ6y0d3y0q0f0g0g0')] bg-cover bg-center" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse border border-primary/50">
                           <Icon name="sports_soccer" className="text-primary" size={24} />
                        </div>
                     </div>
                  </div>
                  <div className="p-4">
                     <h3 className="font-bold text-white mb-1">Konum</h3>
                     <p className="text-slate-400 text-sm">{venue.address}</p>
                     <div className="flex gap-3 mt-4">
                        <button className="flex-1 bg-surface hover:bg-white/10 border border-white/10 py-2 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2">
                           <Icon name="map" size={16} /> Harita
                        </button>
                        <button className="flex-1 bg-surface hover:bg-white/10 border border-white/10 py-2 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2">
                           <Icon name="directions" size={16} /> Yol Tarifi
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>

      {/* Floating Call/Book Button */}
      {(!canManage || activeTab === 'info') && (
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-secondary/90 backdrop-blur-xl border-t border-white/5 safe-bottom z-40">
            <button 
               onClick={() => onNavigate('booking', { id: venueId })}
               className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-glow transition-all active:scale-[0.98]"
            >
               <Icon name="calendar_month" />
               Hemen Rezerve Et
            </button>
         </div>
      )}
    </div>
  );
};

const InfoCard = ({ label, value, icon, color }: any) => (
   <div className="bg-surface rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center text-center h-24">
      <Icon name={icon} className={`${color} mb-2`} size={24} />
      <span className="text-[10px] text-slate-400 uppercase font-bold">{label}</span>
      <span className="text-xs text-white font-bold mt-0.5">{value}</span>
   </div>
);
