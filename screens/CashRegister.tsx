import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { CashEntry, DayClose, Venue, Reservation, Player, CashMethod } from '../types';

interface Props {
  currentUser: Player;
  venues: Venue[];
  reservations: Reservation[];
  cashEntries: CashEntry[];
  dayCloses: DayClose[];
  onBack: () => void;
  onAddCashEntry: (entry: Omit<CashEntry, 'id' | 'at' | 'actorUserId' | 'actorRole'>) => void;
  onCloseDay: (venueId: string, date: string, note?: string) => void;
  onExportCSV: (venueId: string, from: string, to: string) => void;
}

const METHOD_LABELS: Record<CashMethod, { label: string; icon: string; color: string }> = {
  cash:          { label: 'Nakit',   icon: 'payments',          color: 'text-green-400' },
  card:          { label: 'Kart',    icon: 'credit_card',       color: 'text-blue-400' },
  bank_transfer: { label: 'Havale',  icon: 'account_balance',   color: 'text-purple-400' },
};

export const CashRegister: React.FC<Props> = ({
  currentUser, venues, reservations, cashEntries, dayCloses,
  onBack, onAddCashEntry, onCloseDay, onExportCSV,
}) => {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNote, setCloseNote] = useState('');

  // Entry form
  const [newEntry, setNewEntry] = useState({
    method: 'cash' as CashMethod,
    amount: '',
    reservationId: '',
    customerName: '',
    note: '',
  });

  const todayEntries = useMemo(
    () => cashEntries.filter(e => e.venueId === venueId && e.at.startsWith(date)).sort((a, b) => b.at.localeCompare(a.at)),
    [cashEntries, venueId, date]
  );

  const totals = useMemo(() => {
    const t = { cash: 0, card: 0, bank_transfer: 0, total: 0 };
    todayEntries.forEach(e => { t[e.method] += e.amount; t.total += e.amount; });
    return t;
  }, [todayEntries]);

  const isDayClosed = dayCloses.some(d => d.venueId === venueId && d.date === date);
  const canClose = currentUser.role === 'venue_owner' || currentUser.role === 'venue_accountant';

  // Reservations for today (for dropdown)
  const todayReservations = useMemo(
    () => reservations.filter(r => r.venueId === venueId && r.date === date && r.status !== 'cancelled'),
    [reservations, venueId, date]
  );

  const handleAdd = () => {
    const amount = Number(newEntry.amount);
    if (!amount) return;
    const res = reservations.find(r => r.id === newEntry.reservationId);
    onAddCashEntry({
      venueId,
      reservationId: newEntry.reservationId || undefined,
      customerName: newEntry.customerName || res?.teamName || res?.customerName || undefined,
      method: newEntry.method,
      amount,
      note: newEntry.note || undefined,
    });
    setNewEntry({ method: 'cash', amount: '', reservationId: '', customerName: '', note: '' });
    setShowAddModal(false);
  };

  const handleResSelect = (resId: string) => {
    const res = reservations.find(r => r.id === resId);
    setNewEntry(p => ({
      ...p,
      reservationId: resId,
      customerName: res?.customerName || res?.teamName || p.customerName,
      amount: res ? String(res.price - (res.collectedTotal ?? 0)) : p.amount,
    }));
  };

  return (
    <div className="bg-secondary min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/8 px-4 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-surface border border-white/8 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white flex-1">Kasa</h1>
          {isDayClosed && <span className="text-[9px] font-black bg-red-500/15 text-red-400 border border-red-500/25 px-2 py-1 rounded-lg">KAPALI</span>}
          <button onClick={() => onExportCSV(venueId, date, date)}
            className="w-10 h-10 rounded-full bg-surface border border-white/8 flex items-center justify-center" title="CSV İndir">
            <Icon name="download" size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Venue + Date */}
        <div className="flex gap-2 mb-2">
          {venues.length > 1 && (
            <select value={venueId} onChange={e => setVenueId(e.target.value)}
              className="flex-1 bg-surface border border-white/8 rounded-xl px-3 py-2 text-white text-xs focus:outline-none">
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          )}
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="flex-1 bg-surface border border-white/8 rounded-xl px-3 py-2 text-white text-xs focus:outline-none" />
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-2">
          {(['cash','card','bank_transfer','total'] as const).map(key => {
            const val = key === 'total' ? totals.total : totals[key];
            const meta = key === 'total'
              ? { label: 'Toplam', color: 'text-primary' }
              : { label: METHOD_LABELS[key].label, color: METHOD_LABELS[key].color };
            return (
              <div key={key} className="bg-surface rounded-xl p-2 border border-white/6 text-center">
                <p className={`text-sm font-black ${meta.color}`}>{val.toLocaleString('tr-TR')}₺</p>
                <p className="text-[8px] text-slate-500">{meta.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {todayEntries.length === 0
          ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Icon name="point_of_sale" size={52} className="text-slate-700 mb-3" />
              <p className="text-white font-bold mb-1">Bugün tahsilat yok</p>
              <p className="text-slate-500 text-xs">Yeni tahsilat eklemek için + butonuna basın</p>
            </div>
          )
          : todayEntries.map(e => {
              const m = METHOD_LABELS[e.method];
              return (
                <div key={e.id} className="bg-surface rounded-2xl border border-white/6 p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0`}>
                    <Icon name={m.icon} size={18} className={m.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{e.customerName || 'Manuel tahsilat'}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(e.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · {m.label}
                      {e.note ? ` · ${e.note}` : ''}
                    </p>
                  </div>
                  <p className="text-lg font-black text-primary flex-shrink-0">{e.amount.toLocaleString('tr-TR')}₺</p>
                </div>
              );
            })
        }
      </div>

      {/* Bottom actions */}
      {!isDayClosed && (
        <div className="p-4 bg-secondary/95 backdrop-blur-xl border-t border-white/5 flex gap-2 safe-bottom">
          {canClose && (
            <button onClick={() => setShowCloseModal(true)}
              className="flex-1 py-3.5 rounded-2xl bg-orange-500/15 border border-orange-500/25 text-orange-400 font-bold text-sm">
              Günü Kapat
            </button>
          )}
          <button onClick={() => setShowAddModal(true)}
            className="flex-1 py-3.5 rounded-2xl bg-primary text-secondary font-black shadow-glow">
            + Tahsilat Ekle
          </button>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddModal && (
        <Modal title="Yeni Tahsilat" onClose={() => setShowAddModal(false)}>
          <div className="space-y-3">
            {/* Reservation select */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Rezervasyon (opsiyonel)</label>
              <select value={newEntry.reservationId} onChange={e => handleResSelect(e.target.value)}
                className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
                <option value="">— Serbest tahsilat —</option>
                {todayReservations.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.startTime} {r.teamName || r.customerName} {r.price.toLocaleString('tr-TR')}₺{(r.collectedTotal ?? 0) > 0 ? ` (${(r.price - (r.collectedTotal ?? 0)).toLocaleString('tr-TR')}₺ bakiye)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer name */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Müşteri adı</label>
              <input value={newEntry.customerName} onChange={e => setNewEntry(p => ({ ...p, customerName: e.target.value }))}
                placeholder="Ad Soyad"
                className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary" />
            </div>

            {/* Method */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Yöntem</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(METHOD_LABELS) as CashMethod[]).map(m => (
                  <button key={m} onClick={() => setNewEntry(p => ({ ...p, method: m }))}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${newEntry.method === m ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 bg-secondary text-slate-400'}`}>
                    <Icon name={METHOD_LABELS[m].icon} size={14} className={newEntry.method === m ? 'text-primary' : 'text-slate-500'} />
                    {METHOD_LABELS[m].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Tutar (₺)</label>
              <input type="number" value={newEntry.amount} onChange={e => setNewEntry(p => ({ ...p, amount: e.target.value }))}
                placeholder="0"
                className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-xl font-black text-center focus:outline-none focus:border-primary" />
            </div>

            {/* Note */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Not (opsiyonel)</label>
              <input value={newEntry.note} onChange={e => setNewEntry(p => ({ ...p, note: e.target.value }))}
                placeholder="Örn: Kapora"
                className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          <button onClick={handleAdd} disabled={!Number(newEntry.amount)}
            className="w-full mt-4 py-3.5 rounded-2xl bg-primary text-secondary font-black disabled:opacity-40 shadow-glow">
            Tahsilat Ekle
          </button>
        </Modal>
      )}

      {/* Close Day Modal */}
      {showCloseModal && (
        <Modal title="Günü Kapat" onClose={() => setShowCloseModal(false)}>
          <div className="bg-secondary rounded-2xl p-4 mb-4 space-y-2">
            {(['cash','card','bank_transfer'] as const).map(m => (
              <div key={m} className="flex justify-between items-center">
                <span className={`text-sm font-bold ${METHOD_LABELS[m].color}`}>{METHOD_LABELS[m].label}</span>
                <span className="text-white font-black">{totals[m].toLocaleString('tr-TR')}₺</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-white/8">
              <span className="text-sm font-black text-white">TOPLAM</span>
              <span className="text-xl font-black text-primary">{totals.total.toLocaleString('tr-TR')}₺</span>
            </div>
            <p className="text-[10px] text-slate-500">{todayEntries.length} kayıt · {date}</p>
          </div>
          <textarea value={closeNote} onChange={e => setCloseNote(e.target.value)}
            placeholder="Kapanış notu (opsiyonel)" rows={2}
            className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowCloseModal(false)} className="py-3 rounded-xl bg-secondary border border-white/10 text-slate-400 font-bold">Vazgeç</button>
            <button onClick={() => { onCloseDay(venueId, date, closeNote); setShowCloseModal(false); }}
              className="py-3 rounded-xl bg-orange-500 text-white font-black">
              Günü Kapat
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 p-5 shadow-2xl animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-black text-base">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
          <Icon name="close" size={16} className="text-slate-400" />
        </button>
      </div>
      {children}
    </div>
  </div>
);
