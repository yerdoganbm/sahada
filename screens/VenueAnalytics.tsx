import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Venue, Reservation, ScreenName } from '../types';

interface Props {
  venues: Venue[];
  reservations: Reservation[];
  onBack: () => void;
  onNavigate: (s: ScreenName) => void;
}

type Range = 'next7' | 'last7';
type SlotReservation = Reservation & { _hour: number };

// Generate an ISO date array
const getDates = (range: Range): string[] => {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    if (range === 'next7') d.setDate(d.getDate() + i);
    else d.setDate(d.getDate() - 6 + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const HOURS = Array.from({ length: 16 }, (_, i) => i + 8); // 08-23

export const VenueAnalytics: React.FC<Props> = ({ venues, reservations, onBack }) => {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '');
  const [range, setRange] = useState<Range>('next7');
  const [selectedCell, setSelectedCell] = useState<{ date: string; hour: number } | null>(null);

  const dates = useMemo(() => getDates(range), [range]);

  const venueRes = useMemo(() =>
    reservations.filter(r => r.venueId === venueId && dates.includes(r.date)),
    [reservations, venueId, dates]
  );

  // ── Heatmap data ─────────────────────────────────────────────────────────────
  type CellStatus = 'confirmed' | 'hold' | 'pending' | 'empty';
  const getCellStatus = (date: string, hour: number): CellStatus => {
    const now = new Date().toISOString();
    for (const r of venueRes) {
      if (r.date !== date) continue;
      const startH = parseInt(r.startTime.split(':')[0]);
      const endH = Math.ceil(parseInt(r.endTime.split(':')[0]) + parseInt(r.endTime.split(':')[1]) / 60);
      if (hour < startH || hour >= endH) continue;
      if (r.status === 'confirmed') return 'confirmed';
      if (r.status === 'pending') {
        if (r.paymentStatus === 'paid') return 'hold';
        if (r.holdExpiresAt && r.holdExpiresAt > now) return 'hold';
        return 'pending';
      }
    }
    return 'empty';
  };

  const cellReservations = useMemo((): Reservation[] => {
    if (!selectedCell) return [];
    const { date, hour } = selectedCell;
    return venueRes.filter(r => {
      if (r.date !== date) return false;
      const startH = parseInt(r.startTime.split(':')[0]);
      const endH = Math.ceil(parseInt(r.endTime.split(':')[0]) + parseInt(r.endTime.split(':')[1]) / 60);
      return hour >= startH && hour < endH;
    });
  }, [selectedCell, venueRes]);

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const allSlots = dates.length * HOURS.length;
    let filledSlots = 0;
    for (const date of dates) {
      for (const hour of HOURS) {
        if (getCellStatus(date, hour) !== 'empty') filledSlots++;
      }
    }

    const confirmedRes = venueRes.filter(r => r.status === 'confirmed');
    const cancelledRes = venueRes.filter(r => r.status === 'cancelled');
    const revenue = confirmedRes.reduce((s, r) => s + (r.paymentStatus === 'paid' ? r.price : 0), 0);
    const totalDecided = confirmedRes.length + cancelledRes.length;
    const cancelRate = totalDecided > 0 ? Math.round(cancelledRes.length / totalDecided * 100) : 0;

    const responseTimes = venueRes
      .filter(r => r.confirmedAt || r.cancelledAt)
      .map(r => {
        const created = new Date(r.createdAt).getTime();
        const acted = new Date((r.confirmedAt ?? r.cancelledAt)!).getTime();
        return (acted - created) / 60000; // minutes
      });
    const avgResponse = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    return {
      occupancy: allSlots > 0 ? Math.round(filledSlots / allSlots * 100) : 0,
      revenue,
      cancelRate,
      avgResponse,
      totalRes: venueRes.length,
      confirmedCount: confirmedRes.length,
    };
  }, [venueRes, dates]); // eslint-disable-line react-hooks/exhaustive-deps

  const cellColor: Record<CellStatus, string> = {
    confirmed: 'bg-primary/70',
    hold:      'bg-yellow-500/60',
    pending:   'bg-orange-500/40',
    empty:     'bg-white/[0.03]',
  };

  const dayLabel = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    const today = new Date().toISOString().split('T')[0];
    if (iso === today) return 'Bugün';
    return d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-secondary min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/8 px-4 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-surface border border-white/8 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white flex-1">Saha Analitikleri</h1>
        </div>

        {/* Venue selector */}
        {venues.length > 1 && (
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-0.5">
            {venues.map(v => (
              <button key={v.id} onClick={() => setVenueId(v.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all ${
                  venueId===v.id ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/8 bg-surface text-slate-400'
                }`}>
                {v.name}
              </button>
            ))}
          </div>
        )}

        {/* Range toggle */}
        <div className="flex gap-2">
          {([['next7','Sonraki 7 Gün'],['last7','Geçen 7 Gün']] as [Range,string][]).map(([r,label]) => (
            <button key={r} onClick={() => setRange(r)}
              className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                range===r ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/8 bg-surface text-slate-400'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <KPICard icon="percent" label="Doluluk" value={`${kpi.occupancy}%`} color="text-primary" sub={`${range==='next7'?'Sonraki':'Geçen'} 7 gün`} />
          <KPICard icon="payments" label="Gelir (Ödenen)" value={`${kpi.revenue.toLocaleString('tr-TR')}₺`} color="text-green-400" sub={`${kpi.confirmedCount} onaylı`} />
          <KPICard icon="cancel" label="İptal Oranı" value={`${kpi.cancelRate}%`} color={kpi.cancelRate > 20 ? 'text-red-400' : 'text-slate-300'} sub={`${kpi.totalRes} toplam res.`} />
          <KPICard icon="schedule" label="Ort. Yanıt" value={kpi.avgResponse > 0 ? `${kpi.avgResponse} dk` : '—'} color="text-blue-400" sub="Onay/red süresi" />
        </div>

        {/* Legend */}
        <div className="flex gap-3 flex-wrap">
          {([['bg-primary/70','Onaylı'],['bg-yellow-500/60','Hold/Kaporalı'],['bg-orange-500/40','Bekliyor'],['bg-white/[0.03] border border-white/8','Boş']] as [string,string][]).map(([cls,lbl]) => (
            <div key={lbl} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${cls}`} />
              <span className="text-[9px] text-slate-400">{lbl}</span>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="bg-surface rounded-2xl border border-white/6 p-3 overflow-x-auto">
          <div className="min-w-[420px]">
            {/* Column headers (dates) */}
            <div className="flex ml-10 mb-1">
              {dates.map(d => (
                <div key={d} className="flex-1 text-center">
                  <span className="text-[8px] text-slate-400 font-bold">{dayLabel(d)}</span>
                </div>
              ))}
            </div>

            {/* Rows (hours) */}
            {HOURS.map(h => (
              <div key={h} className="flex items-center mb-0.5">
                <div className="w-10 flex-shrink-0 text-right pr-2">
                  <span className="text-[8px] text-slate-500 font-mono">{String(h).padStart(2,'0')}:00</span>
                </div>
                {dates.map(d => {
                  const cs = getCellStatus(d, h);
                  const isSelected = selectedCell?.date === d && selectedCell?.hour === h;
                  return (
                    <button key={d}
                      onClick={() => setSelectedCell(isSelected ? null : { date: d, hour: h })}
                      className={`flex-1 h-6 mx-px rounded transition-all ${cellColor[cs]} ${
                        isSelected ? 'ring-2 ring-white/40 scale-[1.15] z-10 relative' : 'hover:brightness-125'
                      } ${cs !== 'empty' ? 'cursor-pointer' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Side panel: selected cell reservations */}
        {selectedCell && (
          <div className="bg-surface rounded-2xl border border-primary/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">
                {dayLabel(selectedCell.date)} · {String(selectedCell.hour).padStart(2,'0')}:00
              </h3>
              <button onClick={() => setSelectedCell(null)} className="text-slate-500 hover:text-slate-300">
                <Icon name="close" size={16} />
              </button>
            </div>

            {cellReservations.length === 0 ? (
              <p className="text-slate-500 text-xs">Bu saatte rezervasyon yok</p>
            ) : (
              <div className="space-y-2">
                {cellReservations.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-bold text-white">{r.teamName}</p>
                      <p className="text-[10px] text-slate-400">{r.startTime}–{r.endTime} · {r.participants} kişi</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{r.price.toLocaleString('tr-TR')}₺</p>
                      <span className={`text-[9px] font-bold ${
                        r.status==='confirmed' ? 'text-green-400' : r.status==='cancelled' ? 'text-red-400' : 'text-yellow-400'
                      }`}>{({ confirmed:'Onaylı', pending:'Bekliyor', cancelled:'İptal', completed:'Tamamlandı' } as Record<string,string>)[r.status]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const KPICard: React.FC<{ icon: string; label: string; value: string; color: string; sub: string }> = ({ icon, label, value, color, sub }) => (
  <div className="bg-surface rounded-2xl border border-white/6 p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon name={icon} size={16} className={color} />
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{label}</span>
    </div>
    <p className={`text-2xl font-black ${color} leading-none mb-1`}>{value}</p>
    <p className="text-[9px] text-slate-600">{sub}</p>
  </div>
);
