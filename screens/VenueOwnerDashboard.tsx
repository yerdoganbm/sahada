import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Reservation, Player } from '../types';

interface VenueOwnerDashboardProps {
  currentUser: Player;
  reservations: Reservation[];
  onNavigate: (screen: string) => void;
  onApproveReservation: (reservationId: string) => void;
  onRejectReservation: (reservationId: string, reason: string) => void;
}

export const VenueOwnerDashboard: React.FC<VenueOwnerDashboardProps> = ({
  currentUser,
  reservations,
  onNavigate,
  onApproveReservation,
  onRejectReservation
}) => {
  const venueIds = currentUser.venueOwnerInfo?.venueIds || [];
  
  // Sadece bu saha sahibine ait rezervasyonları filtrele
  const myReservations = reservations.filter(r => venueIds.includes(r.venueId));
  
  // Bugünkü tarih
  const today = new Date().toISOString().split('T')[0];
  
  // İstatistikler
  const todayReservations = myReservations.filter(r => r.date === today);
  const pendingReservations = myReservations.filter(r => r.status === 'pending');
  const confirmedToday = todayReservations.filter(r => r.status === 'confirmed');
  
  // Bugünkü tahmini gelir
  const todayRevenue = confirmedToday.reduce((sum, r) => sum + r.price, 0);
  
  // Bu haftaki rezervasyonlar
  const thisWeekReservations = myReservations.filter(r => {
    const resDate = new Date(r.date);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return resDate >= new Date() && resDate <= weekFromNow;
  });
  
  // Doluluk oranı hesaplama (Ayda 30 gün * 10 slot = 300 potansiyel rezervasyon)
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  const thisMonthEnd = new Date();
  thisMonthEnd.setMonth(thisMonthEnd.getMonth() + 1);
  thisMonthEnd.setDate(0);
  
  const thisMonthReservations = myReservations.filter(r => {
    const resDate = new Date(r.date);
    return resDate >= thisMonthStart && resDate <= thisMonthEnd && r.status === 'confirmed';
  });
  
  const potentialSlots = venueIds.length * 30 * 10; // Saha sayısı * 30 gün * 10 slot
  const occupancyRate = potentialSlots > 0 ? Math.round((thisMonthReservations.length / potentialSlots) * 100) : 0;

  return (
    <div className="pb-8 bg-secondary min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Icon name="stadium" size={28} className="text-primary" />
              Saha Yönetimi
            </h1>
            <p className="text-slate-400 text-sm mt-1">Hoş geldin, {currentUser.name}</p>
          </div>
          <button 
            onClick={() => onNavigate('settings')}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Icon name="settings" className="text-white" size={20} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="event" size={16} className="text-primary" />
              <span className="text-[10px] text-slate-400 uppercase font-bold">Bugün</span>
            </div>
            <p className="text-2xl font-black text-white">{todayReservations.length}</p>
            <p className="text-[10px] text-slate-400">{confirmedToday.length} onaylı</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="pending" size={16} className="text-yellow-500" />
              <span className="text-[10px] text-slate-400 uppercase font-bold">Bekliyor</span>
            </div>
            <p className="text-2xl font-black text-yellow-500">{pendingReservations.length}</p>
            <p className="text-[10px] text-slate-400">Onay gerekli</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="payments" size={16} className="text-primary" />
              <span className="text-[10px] text-slate-400 uppercase font-bold">Gelir</span>
            </div>
            <p className="text-xl font-black text-primary">{todayRevenue.toLocaleString('tr-TR')}₺</p>
            <p className="text-[10px] text-slate-400">Bugün</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Bekleyen Onaylar */}
        {pendingReservations.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="pending_actions" size={18} className="text-yellow-500" />
              Bekleyen Onaylar ({pendingReservations.length})
            </h3>
            <div className="space-y-3">
              {pendingReservations.slice(0, 3).map(reservation => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  onApprove={() => onApproveReservation(reservation.id)}
                  onReject={() => onRejectReservation(reservation.id, 'Saha müsait değil')}
                  isPending
                />
              ))}
            </div>
            {pendingReservations.length > 3 && (
              <button
                onClick={() => onNavigate('reservationManagement')}
                className="w-full mt-3 py-2 text-primary text-sm font-bold hover:bg-white/5 rounded-xl transition-colors"
              >
                Tümünü Gör ({pendingReservations.length})
              </button>
            )}
          </div>
        )}

        {/* Hızlı İşlemler */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Hızlı İşlemler</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionCard
              icon="list_alt"
              title="Rezervasyonlar"
              subtitle={`${myReservations.length} toplam`}
              color="bg-blue-500/10 text-blue-500 border-blue-500/20"
              onClick={() => onNavigate('reservationManagement')}
            />
            <QuickActionCard
              icon="calendar_month"
              title="Takvim"
              subtitle="Bu hafta"
              color="bg-purple-500/10 text-purple-500 border-purple-500/20"
              onClick={() => onNavigate('venueCalendar')}
            />
            <QuickActionCard
              icon="account_balance_wallet"
              title="Gelir Raporu"
              subtitle={`${currentUser.venueOwnerInfo?.totalRevenue.toLocaleString('tr-TR')}₺`}
              color="bg-green-500/10 text-green-500 border-green-500/20"
              onClick={() => onNavigate('venueFinancialReports')}
            />
            <QuickActionCard
              icon="groups"
              title="Müşteriler"
              subtitle={`${currentUser.venueOwnerInfo?.totalReservations} rezervasyon`}
              color="bg-orange-500/10 text-orange-500 border-orange-500/20"
              onClick={() => onNavigate('customerManagement')}
            />
          </div>
        </div>

        {/* Bu Haftaki Rezervasyonlar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Icon name="date_range" size={18} />
              Bu Hafta ({thisWeekReservations.length})
            </h3>
            <button
              onClick={() => onNavigate('venueCalendar')}
              className="text-primary text-xs font-bold"
            >
              Takvim →
            </button>
          </div>
          <div className="space-y-3">
            {thisWeekReservations.slice(0, 5).map(reservation => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onApprove={() => onApproveReservation(reservation.id)}
                onReject={() => onRejectReservation(reservation.id, 'İptal edildi')}
              />
            ))}
          </div>
        </div>

        {/* İstatistikler Özeti */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 border border-white/10">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="analytics" size={18} className="text-primary" />
            Performans Özeti
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <StatItem
              label="Doluluk Oranı"
              value={`${occupancyRate}%`}
              icon="percent"
              color="text-primary"
            />
            <StatItem
              label="Ort. Yanıt"
              value={`${currentUser.venueOwnerInfo?.responseTime || 0} dk`}
              icon="schedule"
              color="text-blue-500"
            />
            <StatItem
              label="Toplam Gelir"
              value={`${(currentUser.venueOwnerInfo?.totalRevenue || 0).toLocaleString('tr-TR')}₺`}
              icon="trending_up"
              color="text-green-500"
            />
            <StatItem
              label="Değerlendirme"
              value={`${currentUser.rating || 0}/10`}
              icon="star"
              color="text-yellow-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Alt Componentler
const ReservationCard: React.FC<{
  reservation: Reservation;
  onApprove: () => void;
  onReject: () => void;
  isPending?: boolean;
}> = ({ reservation, onApprove, onReject, isPending }) => {
  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    confirmed: 'bg-green-500/10 text-green-500 border-green-500/30',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/30',
    completed: 'bg-blue-500/10 text-blue-500 border-blue-500/30'
  };

  const statusLabels = {
    pending: 'Bekliyor',
    confirmed: 'Onaylandı',
    cancelled: 'İptal',
    completed: 'Tamamlandı'
  };

  return (
    <div className="bg-surface rounded-2xl border border-white/5 p-4 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-white">{reservation.teamName}</h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[reservation.status]}`}>
              {statusLabels[reservation.status]}
            </span>
          </div>
          <p className="text-xs text-slate-400">{reservation.venueName}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-primary">{reservation.price.toLocaleString('tr-TR')}₺</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
        <div className="flex items-center gap-1">
          <Icon name="calendar_today" size={14} />
          <span>{new Date(reservation.date).toLocaleDateString('tr-TR')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Icon name="schedule" size={14} />
          <span>{reservation.startTime} - {reservation.endTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <Icon name="groups" size={14} />
          <span>{reservation.participants} kişi</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 pb-3 border-b border-white/5">
        <Icon name="person" size={14} />
        <span>{reservation.contactPerson}</span>
        <span>•</span>
        <Icon name="phone" size={14} />
        <span>{reservation.contactPhone}</span>
      </div>

      {isPending && (
        <div className="flex gap-2">
          <button
            onClick={onReject}
            className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold text-xs hover:bg-red-500/20 transition-colors"
          >
            Reddet
          </button>
          <button
            onClick={onApprove}
            className="flex-1 py-2 rounded-xl bg-primary text-secondary font-bold text-xs shadow-glow hover:shadow-glow-lg transition-all"
          >
            Onayla
          </button>
        </div>
      )}
    </div>
  );
};

const QuickActionCard: React.FC<{
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onClick: () => void;
}> = ({ icon, title, subtitle, color, onClick }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-2xl border ${color} hover:scale-105 transition-all text-left`}
  >
    <Icon name={icon} size={24} className="mb-2" />
    <h4 className="font-bold text-sm text-white mb-0.5">{title}</h4>
    <p className="text-[10px] opacity-70">{subtitle}</p>
  </button>
);

const StatItem: React.FC<{
  label: string;
  value: string;
  icon: string;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div>
    <div className="flex items-center gap-1 mb-1">
      <Icon name={icon} size={14} className={color} />
      <span className="text-[10px] text-slate-400">{label}</span>
    </div>
    <p className={`text-lg font-black ${color}`}>{value}</p>
  </div>
);
