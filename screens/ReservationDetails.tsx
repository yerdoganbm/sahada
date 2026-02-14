import React from 'react';
import { Icon } from '../components/Icon';
import { Reservation } from '../types';

interface ReservationDetailsProps {
  reservation: Reservation;
  onBack: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
}

export const ReservationDetails: React.FC<ReservationDetailsProps> = ({ 
  reservation, 
  onBack,
  onApprove,
  onReject
}) => {
  const [rejectReason, setRejectReason] = React.useState('');
  const [showRejectModal, setShowRejectModal] = React.useState(false);

  const handleReject = () => {
    if (rejectReason.trim() && onReject) {
      onReject(reservation.id, rejectReason);
      setShowRejectModal(false);
      onBack();
    }
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(reservation.id);
      onBack();
    }
  };

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    confirmed: 'bg-green-500/20 text-green-500',
    cancelled: 'bg-red-500/20 text-red-500',
    completed: 'bg-slate-500/20 text-slate-400'
  };

  const statusLabels = {
    pending: 'Onay Bekliyor',
    confirmed: 'Onaylandı',
    cancelled: 'İptal Edildi',
    completed: 'Tamamlandı'
  };

  const paymentStatusColors = {
    pending: 'text-yellow-500',
    paid: 'text-green-500',
    refunded: 'text-red-500'
  };

  const paymentStatusLabels = {
    pending: 'Ödeme Bekliyor',
    paid: 'Ödendi',
    refunded: 'İade Edildi'
  };

  return (
    <div className="pb-8 bg-secondary min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Rezervasyon Detayı</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Card */}
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${statusColors[reservation.status]}`}>
              {statusLabels[reservation.status]}
            </span>
            <span className="text-xs text-slate-400">#{reservation.id}</span>
          </div>
          
          <h2 className="text-white font-bold text-lg mb-1">{reservation.teamName}</h2>
          <p className="text-slate-400 text-sm">{reservation.venueName}</p>
        </div>

        {/* Date & Time */}
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Icon name="event" size={20} className="text-primary" />
            Tarih ve Saat
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Tarih</span>
              <span className="text-white font-bold text-sm">
                {new Date(reservation.date).toLocaleDateString('tr-TR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Saat</span>
              <span className="text-white font-bold text-sm">
                {reservation.startTime} - {reservation.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Süre</span>
              <span className="text-white font-bold text-sm">{reservation.duration} saat</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Icon name="payments" size={20} className="text-primary" />
            Ödeme Bilgileri
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Tutar</span>
              <span className="text-white font-bold text-lg">{reservation.price} ₺</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Durum</span>
              <span className={`font-bold text-sm ${paymentStatusColors[reservation.paymentStatus]}`}>
                {paymentStatusLabels[reservation.paymentStatus]}
              </span>
            </div>
            {reservation.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Ödeme Yöntemi</span>
                <span className="text-white font-bold text-sm">
                  {reservation.paymentMethod === 'cash' ? 'Nakit' :
                   reservation.paymentMethod === 'credit_card' ? 'Kredi Kartı' : 'Banka Havalesi'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Icon name="person" size={20} className="text-primary" />
            İletişim Bilgileri
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">İsim</span>
              <span className="text-white font-bold text-sm">{reservation.contactPerson}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Telefon</span>
              <span className="text-white font-bold text-sm">{reservation.contactPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Katılımcı Sayısı</span>
              <span className="text-white font-bold text-sm">{reservation.participants} kişi</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {reservation.notes && (
          <div className="bg-surface rounded-2xl p-4 border border-white/5">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <Icon name="description" size={20} className="text-primary" />
              Notlar
            </h3>
            <p className="text-slate-400 text-sm">{reservation.notes}</p>
          </div>
        )}

        {/* Cancel Reason */}
        {reservation.status === 'cancelled' && reservation.cancelReason && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <h3 className="text-red-500 font-bold mb-2 flex items-center gap-2">
              <Icon name="cancel" size={20} />
              İptal Nedeni
            </h3>
            <p className="text-red-300 text-sm">{reservation.cancelReason}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Icon name="schedule" size={20} className="text-primary" />
            Zaman Damgaları
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Oluşturulma</span>
              <span className="text-white text-sm">
                {new Date(reservation.createdAt).toLocaleString('tr-TR')}
              </span>
            </div>
            {reservation.confirmedAt && (
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Onaylanma</span>
                <span className="text-white text-sm">
                  {new Date(reservation.confirmedAt).toLocaleString('tr-TR')}
                </span>
              </div>
            )}
            {reservation.cancelledAt && (
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">İptal</span>
                <span className="text-white text-sm">
                  {new Date(reservation.cancelledAt).toLocaleString('tr-TR')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {reservation.status === 'pending' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowRejectModal(true)}
              className="bg-red-500/20 border border-red-500/30 text-red-500 py-4 rounded-2xl font-bold hover:bg-red-500/30 transition-colors"
            >
              Reddet
            </button>
            <button
              onClick={handleApprove}
              className="bg-primary text-secondary py-4 rounded-2xl font-bold hover:bg-green-500 transition-colors shadow-glow"
            >
              Onayla
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 p-6 shadow-2xl animate-slide-up">
            <h3 className="text-white font-bold text-lg mb-4">Rezervasyonu Reddet</h3>
            <p className="text-slate-400 text-sm mb-4">Lütfen ret nedeninizi yazın:</p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Örn: Saha bakımda olacak"
              className="w-full bg-secondary border border-white/10 rounded-xl p-3 text-white text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="bg-secondary border border-white/10 text-white py-3 rounded-xl font-bold"
              >
                Vazgeç
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="bg-red-500 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
