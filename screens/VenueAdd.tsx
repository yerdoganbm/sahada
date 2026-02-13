import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Venue } from '../types';

interface VenueAddProps {
  onBack: () => void;
  onSave: (venue: Venue) => void;
}

export const VenueAdd: React.FC<VenueAddProps> = ({ onBack, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    district: 'Kadıköy',
    address: '',
    price: '',
    phone: '',
    capacity: '7v7'
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    if (!formData.name || !formData.price || !formData.phone) {
      alert('Lütfen zorunlu alanları doldurunuz.');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newVenue: Venue = {
        id: `v${Date.now()}`,
        name: formData.name,
        district: formData.district,
        address: formData.address || `${formData.district} Merkez`,
        image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80', // Default image
        price: Number(formData.price),
        rating: 5.0, // New venues start high :)
        status: 'active',
        features: ['Otopark'],
        phone: formData.phone,
        capacity: formData.capacity,
        organizerNotes: {
            doorCode: '-',
            contactPerson: 'Sistem',
            contactPhone: formData.phone,
            lastUpdate: 'Şimdi',
            customNotes: 'Yeni eklenen saha.'
        },
        priceHistory: []
      };

      onSave(newVenue);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="bg-secondary min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
        <div className="flex items-center gap-3">
           <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
             <Icon name="arrow_back" className="text-white" />
           </button>
           <h1 className="font-bold text-white text-lg">Yeni Saha Ekle</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Form Section */}
        <div className="bg-surface rounded-2xl p-4 border border-white/5 space-y-4">
            
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Saha Adı <span className="text-alert">*</span></label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Örn: Altınordu Tesisleri"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] text-slate-400 font-bold uppercase">İlçe</label>
                 <select 
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                 >
                    <option value="Kadıköy">Kadıköy</option>
                    <option value="Beşiktaş">Beşiktaş</option>
                    <option value="Üsküdar">Üsküdar</option>
                    <option value="Şişli">Şişli</option>
                    <option value="Maltepe">Maltepe</option>
                    <option value="Ataşehir">Ataşehir</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] text-slate-400 font-bold uppercase">Kapasite</label>
                 <select 
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                 >
                    <option value="6v6">6 vs 6</option>
                    <option value="7v7">7 vs 7</option>
                    <option value="8v8">8 vs 8</option>
                    <option value="9v9">9 vs 9</option>
                 </select>
               </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Açık Adres</label>
              <textarea 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Mahalle, Cadde, Sokak..."
                rows={3}
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder-slate-600 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Saatlik Ücret (TL) <span className="text-alert">*</span></label>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="1200"
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder-slate-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Telefon <span className="text-alert">*</span></label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="05XX..."
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder-slate-600"
                  />
                </div>
            </div>
        </div>

        {/* Info */}
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex gap-3">
           <Icon name="info" className="text-primary shrink-0" size={20} />
           <p className="text-xs text-slate-300 leading-relaxed">
             Eklediğiniz saha "Yönetici Onayı" gerektirmeden listenize eklenecektir. Daha sonra detayları güncelleyebilirsiniz.
           </p>
        </div>

      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-secondary/90 backdrop-blur-xl border-t border-white/5 safe-bottom z-50">
        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-green-400 text-secondary py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-glow transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Icon name="refresh" className="animate-spin" />
          ) : (
            <>
              <Icon name="save" size={20} />
              Sahayı Kaydet
            </>
          )}
        </button>
      </div>

    </div>
  );
};