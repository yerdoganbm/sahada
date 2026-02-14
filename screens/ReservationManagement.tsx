import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Reservation, Player } from '../types';

interface ReservationManagementProps {
  currentUser: Player;
  reservations: Reservation[];
  onBack: () => void;
  onApproveReservation: (reservationId: string) => void;
  onRejectReservation: (reservationId: string, reason: string) => void;
  onViewDetails: (reservationId: string) => void;
}

type FilterType = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export const ReservationManagement: React.FC<ReservationManagementProps> = ({
  currentUser,
  reservations,
  onBack,
  onApproveReservation,
  onRejectReservation,
  onViewDetails
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const venueIds = currentUser.venueOwnerInfo?.venueIds || [];
  
  // Filtreleme
  const myReservations = reservations.filter(r => venueIds.includes(r.venueId));
  
  const filteredReservations = myReservations.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    // Önce pending, sonra tarihe göre sırala
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // İstatistikler
  const stats = {
    all: myReservations.length,
    pending: myReservations.filter(r => r.status === 'pending').length,
    confirmed: myReservations.filter(r => r.status === 'confirmed').length,
    completed: myReservations.filter(r => r.status === 'completed').length,
    cancelled: myReservations.filter(r => r.status === 'cancelled').length,
  };

  const handleReject = () => {
    if (selectedReservation && rejectReason.trim()) {
      onRejectReservation(selectedReservation, rejectReason);
      setShowRejectModal(false);
      setSelectedReservation(null);
      setRejectReason('');
    }
  };

  return (
    <div className="pb-8 bg-secondary min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Icon name="arrow_back" className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white">Rezervasyon Yönetimi</h1>
            <p className="text-slate-400 text-xs">{filteredReservations.length} rezervasyon</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Takım veya kişi ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <FilterTab
            label="Tümü"
            count={stats.all}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <FilterTab
            label="Bekliyor"
            count={stats.pending}
            active={filter === 'pending'}
            onClick={() => setFilter('pending')}
            color="yellow"
          />
          <FilterTab
            label="Onaylı"
            count={stats.confirmed}
            active={filter === 'confirmed'}
            onClick={() => setFilter('confirmed')}
            color="green"
          />
          <FilterTab
            label="Tamamlandı"
            count={stats.completed}
            active={filter === 'completed'}
            onClick={() => setFilter('completed')}
            color="blue"
          />
          <FilterTab
            label="İptal"
            count={stats.cancelled}
            active={filter === 'cancelled'}
            onClick={() => setFilter('cancelled')}
            color="red"
          />
        </div>
      </div>

      <div className="p-4">
        {filteredReservations.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="event_busy" size={64} className="text-slate-700 mx-auto mb-4" />
            <h3 className="text-white font-bold mb-2">Rezervasyon Bulunamadı</h3>
            <p className="text-slate-400 text-sm">
              {searchTerm ? 'Arama kriterlerinize uygun rezervasyon yok' : 'Bu kategoride rezervasyon bulunmuyor'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReservations.map(reservation => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onApprove={() => onApproveReservation(reservation.id)}
                onReject={() => {
                  setSelectedReservation(reservation.id);
                  setShowRejectModal(true);
                }}
                onViewDetails={() => onViewDetails(reservation.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface w-full max-w-sm rounded-3xl border border-white/10 p-6 shadow-2xl animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3 text-red-500">
                <Icon name="cancel" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Rezervasyonu Reddet</h3>
              <p className="text-xs text-slate-400 mt-1">Lütfen iptal nedenini belirtin</p>
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="İptal nedeni (örn: Saha müsait değil, bakımda...)"
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-red-500 mb-6 resize-none"
              rows={4}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedReservation(null);
                  setRejectReason('');
                }}
                className="flex-1 py-3 rounded-xl bg-surface border border-white/10 text-slate-400 font-bold text-xs"
              >
                Vazgeç
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Alt Componentler
const FilterTab: React.FC<{
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: 'yellow' | 'green' | 'blue' | 'red';
}> = ({ label, count, active, onClick, color }) => {
  const colors = {
    yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500',
    green: 'border-green-500/30 bg-green-500/10 text-green-500',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-500',
    red: 'border-red-500/30 bg-red-500/10 text-red-500',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all ${
        active
          ? color
            ? colors[color]
            : 'border-primary/30 bg-primary/10 text-primary'
          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
      }`}
    >
      <span>{label}</span>
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-white/20' : 'bg-white/10'}`}>
        {count}
      </span>
    </button>
  );
};

const ReservationCard: React.FC<{
  reservation: Reservation;
  onApprove: () => void;
  onReject: () => void;
  onViewDetails: () => void;
}> = ({ reservation, onApprove, onReject, onViewDetails }) => {
  const statusColors = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30', icon: 'pending' },
    confirmed: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30', icon: 'check_circle' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', icon: 'cancel' },
    completed: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30', icon: 'task_alt' }
  };

  const paymentColors = {
    pending: { bg: 'bg-orange-500/10', text: 'text-orange-500', label: 'Ödeme Bekliyor' },
    paid: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Ödendi' },
    refunded: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'İade Edildi' }
  };

  const status = statusColors[reservation.status];
  const payment = paymentColors[reservation.paymentStatus];

  return (
    <div className="bg-surface rounded-2xl border border-white/5 p-4 hover:border-primary/30 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon name={status.icon} size={16} className={status.text} />
            <h4 className="font-bold text-white">{reservation.teamName}</h4>
          </div>
          <p className="text-xs text-slate-400">{reservation.venueName}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-primary">{reservation.price.toLocaleString('tr-TR')}₺</p>
          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${payment.bg} ${payment.text} mt-1`}>
            {payment.label}
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="flex items-center gap-4 text-xs text-slate-400 mb-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-1">
          <Icon name="calendar_today" size={14} />
          <span>{new Date(reservation.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
        </div>
        <div className="flex items-center gap-1">
          <Icon name="schedule" size={14} />
          <span>{reservation.startTime} - {reservation.endTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <Icon name="groups" size={14} />
          <span>{reservation.participants}</span>
        </div>
      </div>

      {/* Contact */}
      <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
        <div className="flex items-center gap-1">
          <Icon name="person" size={14} />
          <span>{reservation.contactPerson}</span>
        </div>
        <span className="text-slate-700">•</span>
        <div className="flex items-center gap-1">
          <Icon name="phone" size={14} />
          <span>{reservation.contactPhone}</span>
        </div>
      </div>

      {/* Notes */}
      {reservation.notes && (
        <div className="bg-white/5 rounded-xl p-3 mb-3">
          <p className="text-xs text-slate-300">{reservation.notes}</p>
        </div>
      )}

      {/* Cancel Reason */}
      {reservation.status === 'cancelled' && reservation.cancelReason && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-3">
          <p className="text-xs text-red-400">
            <strong>İptal Nedeni:</strong> {reservation.cancelReason}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {reservation.status === 'pending' ? (
          <>
            <button
              onClick={onReject}
              className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold text-xs hover:bg-red-500/20 transition-colors"
            >
              Reddet
            </button>
            <button
              onClick={onApprove}
              className="flex-1 py-2.5 rounded-xl bg-primary text-secondary font-bold text-xs shadow-glow hover:shadow-glow-lg transition-all"
            >
              Onayla
            </button>
          </>
        ) : (
          <button
            onClick={onViewDetails}
            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-colors"
          >
            Detayları Gör
          </button>
        )}
      </div>

      {/* Timestamps */}
      <div className="flex items-center gap-3 text-[10px] text-slate-600 mt-3">
        <span>Oluşturuldu: {new Date(reservation.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        {reservation.confirmedAt && (
          <span>• Onaylandı: {new Date(reservation.confirmedAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        )}
      </div>
    </div>
  );
};
