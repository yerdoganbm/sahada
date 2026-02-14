import React from 'react';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'info' | 'warning';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default'
}) => {
  const variantStyles = {
    default: 'text-slate-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600'
  };

  const bgStyles = {
    default: 'bg-slate-50',
    info: 'bg-blue-50',
    warning: 'bg-yellow-50'
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className={`w-20 h-20 rounded-full ${bgStyles[variant]} flex items-center justify-center mb-4`}>
        <Icon name={icon} size={40} className={variantStyles[variant]} />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary hover:bg-green-400 text-secondary px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
        >
          <Icon name="add" size={18} />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Özel empty state'ler
export const NoMatchesEmpty: React.FC<{ onCreateMatch: () => void }> = ({ onCreateMatch }) => (
  <EmptyState
    icon="sports_soccer"
    title="Henüz Maç Yok"
    description="İlk maçını oluştur ve takım arkadaşlarını davet et!"
    actionLabel="Maç Oluştur"
    onAction={onCreateMatch}
  />
);

export const NoPlayersEmpty: React.FC<{ onInvite: () => void }> = ({ onInvite }) => (
  <EmptyState
    icon="group_add"
    title="Takımda Kimse Yok"
    description="Arkadaşlarını davet et ve takımını kur!"
    actionLabel="Oyuncu Davet Et"
    onAction={onInvite}
  />
);

export const NoPaymentsEmpty: React.FC = () => (
  <EmptyState
    icon="payments"
    title="Ödeme Kaydı Yok"
    description="Henüz herhangi bir ödeme işlemi yapılmamış."
    variant="info"
  />
);

export const NoVenuesEmpty: React.FC<{ onAddVenue: () => void }> = ({ onAddVenue }) => (
  <EmptyState
    icon="add_location"
    title="Saha Eklenmemiş"
    description="Maç için kullanabileceğin sahaları ekle."
    actionLabel="Saha Ekle"
    onAction={onAddVenue}
  />
);

export const NoNotificationsEmpty: React.FC = () => (
  <EmptyState
    icon="notifications_off"
    title="Bildirim Yok"
    description="Yeni bildirimler burada görünecek."
    variant="default"
  />
);
