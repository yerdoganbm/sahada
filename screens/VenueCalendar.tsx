import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Reservation } from '../types';

interface VenueCalendarProps {
  onBack: () => void;
  reservations?: Reservation[];
  venueIds?: string[];
}

export const VenueCalendar: React.FC<VenueCalendarProps> = ({ 
  onBack, 
  reservations = [],
  venueIds = []
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Takvim hesaplamaları
  const { year, month, daysInMonth, firstDayOfMonth } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    return { year, month, daysInMonth, firstDayOfMonth };
  }, [currentDate]);

  // Bu saha sahibinin rezervasyonlarını filtrele
  const myReservations = useMemo(() => {
    return reservations.filter(r => venueIds.includes(r.venueId));
  }, [reservations, venueIds]);

  // Belirli bir tarihteki rezervasyonları al
  const getReservationsForDate = (dateStr: string) => {
    return myReservations.filter(r => r.date === dateStr);
  };

  // Tarih dizisi oluştur
  const calendarDays = useMemo(() => {
    const days = [];
    // Boş günler (önceki aydan)
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  }, [firstDayOfMonth, daysInMonth]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  const selectedDayReservations = selectedDate ? getReservationsForDate(selectedDate) : [];

  return (
    <div className="pb-8 bg-secondary min-h-screen">
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Rezervasyon Takvimi</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Month Navigator */}
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Icon name="chevron_left" className="text-white" />
            </button>
            <h2 className="text-white font-bold text-lg">
              {monthNames[month]} {year}
            </h2>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Icon name="chevron_right" className="text-white" />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayReservations = getReservationsForDate(dateStr);
              const hasReservations = dayReservations.length > 0;
              const confirmedCount = dayReservations.filter(r => r.status === 'confirmed').length;
              const isToday = new Date().toDateString() === new Date(dateStr).toDateString();
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative
                    ${isSelected ? 'bg-primary text-secondary ring-2 ring-primary' : 
                      isToday ? 'bg-primary/20 text-primary border border-primary' :
                      hasReservations ? 'bg-white/10 text-white border border-white/20' : 
                      'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                  <span className="text-sm font-bold">{day}</span>
                  {hasReservations && (
                    <div className="flex gap-0.5 mt-1">
                      {confirmedCount > 0 && (
                        <div className="w-1 h-1 rounded-full bg-green-500" />
                      )}
                      {dayReservations.length > confirmedCount && (
                        <div className="w-1 h-1 rounded-full bg-yellow-500" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="bg-surface rounded-2xl p-4 border border-white/5 animate-fade-in">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Icon name="event" size={20} className="text-primary" />
              {new Date(selectedDate).toLocaleDateString('tr-TR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>

            {selectedDayReservations.length === 0 ? (
              <p className="text-slate-400 text-sm">Bu tarihte rezervasyon yok</p>
            ) : (
              <div className="space-y-2">
                {selectedDayReservations.map(res => (
                  <div key={res.id} className="bg-secondary rounded-xl p-3 border border-white/5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-bold text-sm">{res.teamName}</p>
                        <p className="text-slate-400 text-xs">{res.venueName}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg
                        ${res.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                          res.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          res.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                          'bg-slate-500/20 text-slate-400'}`}
                      >
                        {res.status === 'confirmed' ? 'Onaylı' :
                         res.status === 'pending' ? 'Bekliyor' :
                         res.status === 'cancelled' ? 'İptal' : 'Tamamlandı'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Icon name="schedule" size={14} />
                        {res.startTime} - {res.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="payments" size={14} />
                        {res.price} ₺
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <h4 className="text-white font-bold text-sm mb-3">Renk Açıklamaları</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-slate-400">Onaylı rezervasyon</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-xs text-slate-400">Bekleyen rezervasyon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
