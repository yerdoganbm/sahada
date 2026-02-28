
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Venue, ScreenName, Player } from '../types';

interface VenueListProps {
  onBack: () => void;
  onNavigate: (screen: ScreenName, params?: any) => void;
  venues: Venue[];
  currentUser: Player;
}

export const VenueList: React.FC<VenueListProps> = ({ onBack, onNavigate, venues, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVenues = venues.filter(venue => 
    venue.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    venue.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddVenueClick = () => {
    // Check if user is Partner or Admin
    if (currentUser.tier === 'partner' || currentUser.role === 'admin') {
      onNavigate('venueAdd');
    } else {
      if(confirm("Saha eklemek için 'Saha Partner' üyeliğine sahip olmalısınız. Üyelik sayfasına gitmek ister misiniz?")) {
        onNavigate('subscription');
      }
    }
  };

  return (
    <div className="bg-secondary min-h-screen pb-safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
        <div className="flex items-center gap-3">
           <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
             <Icon name="arrow_back" className="text-white" />
           </button>
           <h1 className="font-bold text-white text-lg">Saha Yönetim & Notlar</h1>
        </div>
        <button 
          onClick={handleAddVenueClick}
          className="bg-primary text-secondary text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-green-400 transition-colors"
        >
          <Icon name="add" size={14} />
          Yeni Saha
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
           <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Saha adı, bölge veya yetkili ara..." 
              className="w-full bg-surface border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder-slate-500"
           />
           <Icon name="search" className="absolute left-4 top-3.5 text-slate-500" size={20} />
           {searchTerm.length > 0 && (
             <button 
               onClick={() => setSearchTerm('')}
               className="absolute right-3 top-3.5 text-slate-500 hover:text-white"
             >
               <Icon name="close" size={18} />
             </button>
           )}
        </div>

        {/* List Title */}
        <div className="flex justify-between items-end px-1 mt-6">
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
             {searchTerm ? 'Arama Sonuçları' : 'Kayıtlı Sahalar'} ({filteredVenues.length})
           </span>
        </div>

        {/* Venue Cards */}
        <div className="space-y-3">
           {filteredVenues.length === 0 ? (
             <div className="text-center py-10 opacity-50">
               <Icon name="stadium" size={48} className="text-slate-600 mb-2 mx-auto" />
               <p className="text-sm text-slate-400">Saha bulunamadı.</p>
             </div>
           ) : (
             filteredVenues.map(venue => (
              <div 
                key={venue.id} 
                onClick={() => onNavigate('venueDetails', { id: venue.id })}
                className="bg-surface rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all active:scale-[0.99] cursor-pointer group flex gap-4"
              >
                  <div className="w-20 h-20 rounded-xl bg-slate-800 overflow-hidden relative shadow-lg shrink-0">
                    <img src={venue.image} alt={venue.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-white text-base leading-tight truncate pr-2">{venue.name}</h3>
                        {venue.status === 'active' && <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)] mt-1.5 shrink-0"></span>}
                        {venue.status === 'price_update' && <span className="w-2 h-2 rounded-full bg-alert mt-1.5 shrink-0"></span>}
                        {venue.status === 'archived' && <span className="w-2 h-2 rounded-full bg-slate-600 mt-1.5 shrink-0"></span>}
                    </div>
                    <p className="text-xs text-slate-400 mb-2 truncate">{venue.district}, İstanbul</p>
                    
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          venue.status === 'active' ? 'bg-primary/10 text-primary' : 
                          venue.status === 'price_update' ? 'bg-alert/10 text-alert' : 
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {venue.status === 'active' ? 'Aktif' : venue.status === 'price_update' ? 'Fiyat?' : 'Arşiv'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-md bg-white/5">
                          {venue.price}₺
                        </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-center items-end text-slate-500">
                    <Icon name="chevron_right" />
                  </div>
              </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};
