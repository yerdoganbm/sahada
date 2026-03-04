import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Player } from '../types';

interface VenueFinancialReportsProps {
  currentUser: Player;
  onBack: () => void;
  onExportReservations?: (venueId: string, from: string, to: string) => void;
  onExportCash?: (venueId: string, from: string, to: string) => void;
  onExportDayClose?: (venueId: string) => void;
}

export const VenueFinancialReports: React.FC<VenueFinancialReportsProps> = ({
  currentUser, onBack,
  onExportReservations, onExportCash, onExportDayClose,
}) => {
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportFrom, setExportFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [exportTo, setExportTo] = useState(new Date().toISOString().split('T')[0]);
  const venueId = currentUser.venueOwnerInfo?.venueIds?.[0] ?? '';

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
          <h1 className="text-xl font-black text-white flex-1">Gelir Raporu</h1>
          {(onExportReservations || onExportCash || onExportDayClose) && (
            <button onClick={() => setShowExportPanel(!showExportPanel)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${showExportPanel ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-slate-400'}`}>
              <Icon name="download" size={18} />
            </button>
          )}
        </div>

        {/* CSV Export Panel */}
        {showExportPanel && (
          <div className="mt-3 bg-secondary/80 border border-white/8 rounded-2xl p-4 animate-fade-in">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">CSV Export</p>
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Başlangıç</label>
                <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Bitiş</label>
                <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {onExportReservations && (
                <button onClick={() => { onExportReservations(venueId, exportFrom, exportTo); setShowExportPanel(false); }}
                  className="py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black flex flex-col items-center gap-1">
                  <Icon name="event_note" size={14} />
                  Rezervasyonlar
                </button>
              )}
              {onExportCash && (
                <button onClick={() => { onExportCash(venueId, exportFrom, exportTo); setShowExportPanel(false); }}
                  className="py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black flex flex-col items-center gap-1">
                  <Icon name="point_of_sale" size={14} />
                  Kasa Girişleri
                </button>
              )}
              {onExportDayClose && (
                <button onClick={() => { onExportDayClose(venueId); setShowExportPanel(false); }}
                  className="py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black flex flex-col items-center gap-1">
                  <Icon name="lock_clock" size={14} />
                  Gün Sonu
                </button>
              )}
            </div>
          </div>
        )}
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
