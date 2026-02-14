import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Player, Payment } from '../types';

interface DebtListProps {
  onBack: () => void;
  players: Player[];
  payments: Payment[];
}

interface PlayerDebt {
  player: Player;
  totalDebt: number;
  paidAmount: number;
  pendingAmount: number;
  lastPaymentDate?: string;
}

export const DebtList: React.FC<DebtListProps> = ({ onBack, players, payments }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'debt' | 'name'>('debt');

  // Borç hesaplama
  const playerDebts = useMemo(() => {
    const debts: PlayerDebt[] = players.map(player => {
      const playerPayments = payments.filter(p => p.playerId === player.id);
      const totalDebt = playerPayments.reduce((sum, p) => sum + p.amount, 0);
      const paidAmount = playerPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      const pendingAmount = totalDebt - paidAmount;
      
      const lastPayment = playerPayments
        .filter(p => p.status === 'paid')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      return {
        player,
        totalDebt,
        paidAmount,
        pendingAmount,
        lastPaymentDate: lastPayment?.date
      };
    });

    return debts.filter(d => d.totalDebt > 0);
  }, [players, payments]);

  // Filtreleme ve sıralama
  const filteredDebts = useMemo(() => {
    let filtered = playerDebts.filter(d =>
      d.player.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (sortBy === 'debt') {
        return b.pendingAmount - a.pendingAmount;
      } else {
        return a.player.name.localeCompare(b.player.name);
      }
    });

    return filtered;
  }, [playerDebts, searchQuery, sortBy]);

  // Toplam borç
  const totalPendingDebt = playerDebts.reduce((sum, d) => sum + d.pendingAmount, 0);
  const debtorsCount = playerDebts.filter(d => d.pendingAmount > 0).length;

  return (
    <div className="pb-8 bg-secondary min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-secondary/90 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-surface border border-white/5 flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Borçlu Listesi</h1>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-[10px] text-red-400 uppercase font-bold mb-1">Toplam Borç</p>
            <p className="text-2xl font-black text-red-500">{totalPendingDebt} ₺</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <p className="text-[10px] text-yellow-400 uppercase font-bold mb-1">Borçlu Sayısı</p>
            <p className="text-2xl font-black text-yellow-500">{debtorsCount} Kişi</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search & Sort */}
        <div className="space-y-3">
          <div className="relative">
            <Icon
              name="search"
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Oyuncu ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('debt')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                sortBy === 'debt'
                  ? 'bg-primary text-secondary'
                  : 'bg-surface text-slate-400 border border-white/10'
              }`}
            >
              En Çok Borçlu
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

        {/* Debt List */}
        {filteredDebts.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="check_circle" size={64} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-white font-bold mb-2">Harika!</h3>
            <p className="text-slate-400 text-sm">
              {searchQuery ? 'Arama sonucu bulunamadı' : 'Kimsenin borcu yok! 🎉'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDebts.map((debt) => (
              <div
                key={debt.player.id}
                className="bg-surface rounded-2xl p-4 border border-white/5 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700">
                      <img
                        src={debt.player.avatar}
                        alt={debt.player.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{debt.player.name}</h3>
                      <p className="text-slate-400 text-xs">{debt.player.position}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      debt.pendingAmount > 0
                        ? 'bg-red-500/20 text-red-500'
                        : 'bg-green-500/20 text-green-500'
                    }`}
                  >
                    {debt.pendingAmount > 0 ? `${debt.pendingAmount} ₺` : 'Ödendi'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Toplam
                    </p>
                    <p className="text-white font-bold text-sm">{debt.totalDebt} ₺</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Ödenen
                    </p>
                    <p className="text-green-500 font-bold text-sm">{debt.paidAmount} ₺</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Kalan
                    </p>
                    <p className="text-red-500 font-bold text-sm">{debt.pendingAmount} ₺</p>
                  </div>
                </div>

                {debt.lastPaymentDate && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-slate-400">
                      Son ödeme:{' '}
                      <span className="text-white font-medium">
                        {new Date(debt.lastPaymentDate).toLocaleDateString('tr-TR')}
                      </span>
                    </p>
                  </div>
                )}

                {debt.pendingAmount > 0 && (
                  <button className="w-full mt-3 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
                    <Icon name="notifications" size={16} />
                    Hatırlat
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
