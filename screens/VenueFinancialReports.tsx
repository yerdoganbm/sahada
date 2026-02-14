import React from 'react';
import { Icon } from '../components/Icon';
import { Player } from '../types';

interface VenueFinancialReportsProps {
  currentUser: Player;
  onBack: () => void;
}

export const VenueFinancialReports: React.FC<VenueFinancialReportsProps> = ({ currentUser, onBack }) => {
  const totalRevenue = currentUser.venueOwnerInfo?.totalRevenue || 0;
  const commissionRate = currentUser.venueOwnerInfo?.commissionRate || 15;
  const commission = totalRevenue * (commissionRate / 100);
  const netRevenue = totalRevenue - commission;

  return (
    <div className="pb-8 bg-secondary min-h-screen">
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Gelir Raporu</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-br from-green-500/20 to-green-900/20 rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="account_balance_wallet" size={24} className="text-green-500" />
            <span className="text-xs text-green-400 font-bold uppercase">Toplam Gelir</span>
          </div>
          <p className="text-4xl font-black text-white mb-1">{totalRevenue.toLocaleString('tr-TR')}₺</p>
          <p className="text-xs text-green-300">{currentUser.venueOwnerInfo?.totalReservations || 0} rezervasyon</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="trending_down" size={20} className="text-orange-500" />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Komisyon</span>
            </div>
            <p className="text-2xl font-black text-orange-500 mb-1">{commission.toLocaleString('tr-TR')}₺</p>
            <p className="text-xs text-slate-400">%{commissionRate} oranında</p>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="trending_up" size={20} className="text-primary" />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Net Gelir</span>
            </div>
            <p className="text-2xl font-black text-primary mb-1">{netRevenue.toLocaleString('tr-TR')}₺</p>
            <p className="text-xs text-slate-400">Tahsil edilecek</p>
          </div>
        </div>

        <div className="text-center py-12">
          <Icon name="bar_chart" size={64} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-bold mb-2">Detaylı Raporlar</h3>
          <p className="text-slate-400 text-sm">Haftalık/Aylık grafikler yakında eklenecek</p>
        </div>
      </div>
    </div>
  );
};
