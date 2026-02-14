import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Reservation } from '../types';

interface CustomerManagementProps {
  onBack: () => void;
  reservations?: Reservation[];
  venueIds?: string[];
}

interface CustomerStats {
  name: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking: string;
  status: 'active' | 'inactive';
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ 
  onBack,
  reservations = [],
  venueIds = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'bookings' | 'spent'>('bookings');

  // Bu saha sahibinin rezervasyonlarından müşteri istatistikleri oluştur
  const customerStats = useMemo(() => {
    const myReservations = reservations.filter(r => venueIds.includes(r.venueId));
    const customerMap = new Map<string, CustomerStats>();

    myReservations.forEach(res => {
      const key = res.contactPhone;
      const existing = customerMap.get(key);

      if (existing) {
        existing.totalBookings += 1;
        if (res.status === 'completed' || res.status === 'confirmed') {
          existing.totalSpent += res.price;
        }
        if (new Date(res.date) > new Date(existing.lastBooking)) {
          existing.lastBooking = res.date;
        }
      } else {
        customerMap.set(key, {
          name: res.contactPerson,
          phone: res.contactPhone,
          totalBookings: 1,
          totalSpent: (res.status === 'completed' || res.status === 'confirmed') ? res.price : 0,
          lastBooking: res.date,
          status: 'active'
        });
      }
    });

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    customerMap.forEach((customer) => {
      if (new Date(customer.lastBooking) < threeMonthsAgo) {
        customer.status = 'inactive';
      }
    });

    return Array.from(customerMap.values());
  }, [reservations, venueIds]);

  const filteredCustomers = useMemo(() => {
    let filtered = customerStats.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
    );

    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'bookings') return b.totalBookings - a.totalBookings;
      if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
      return 0;
    });

    return filtered;
  }, [customerStats, searchQuery, sortBy]);

  const totalCustomers = customerStats.length;
  const activeCustomers = customerStats.filter(c => c.status === 'active').length;
  const totalRevenue = customerStats.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div className="pb-8 bg-secondary min-h-screen">
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Müşteri Yönetimi</h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Toplam</p>
            <p className="text-xl font-black text-white">{totalCustomers}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Aktif</p>
            <p className="text-xl font-black text-primary">{activeCustomers}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Gelir</p>
            <p className="text-lg font-black text-white">{totalRevenue.toLocaleString()} ₺</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="relative">
            <Icon 
              name="search" 
              size={20} 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
            />
            <input
              type="text"
              placeholder="İsim veya telefon ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('bookings')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                sortBy === 'bookings' 
                  ? 'bg-primary text-secondary' 
                  : 'bg-surface text-slate-400 border border-white/10'
              }`}
            >
              En Çok Rezervasyon
            </button>
            <button
              onClick={() => setSortBy('spent')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                sortBy === 'spent' 
                  ? 'bg-primary text-secondary' 
                  : 'bg-surface text-slate-400 border border-white/10'
              }`}
            >
              En Çok Harcama
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                sortBy === 'name' 
                  ? 'bg-primary text-secondary' 
                  : 'bg-surface text-slate-400 border border-white/10'
              }`}
            >
              İsme Göre
            </button>
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="person_off" size={64} className="text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold mb-2">Müşteri Bulunamadı</h3>
            <p className="text-slate-400 text-sm">
              {searchQuery ? 'Arama kriterlerinize uygun müşteri yok' : 'Henüz müşteri kaydı yok'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.phone}
                className="bg-surface rounded-2xl p-4 border border-white/5 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <span className="text-primary font-bold text-lg">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{customer.name}</h3>
                      <p className="text-slate-400 text-xs">{customer.phone}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      customer.status === 'active'
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {customer.status === 'active' ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Rezervasyon
                    </p>
                    <p className="text-white font-bold">{customer.totalBookings}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Harcama
                    </p>
                    <p className="text-white font-bold">{customer.totalSpent} ₺</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Son Rez.
                    </p>
                    <p className="text-white font-bold text-xs">
                      {new Date(customer.lastBooking).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
