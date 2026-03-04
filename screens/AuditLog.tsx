import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { AuditEvent, Player } from '../types';

interface Props {
  events: AuditEvent[];
  onBack: () => void;
  currentUser: Player;
}

const ACTION_META: Record<string, { icon: string; label: string; color: string }> = {
  RESERVATION_CREATED:          { icon: 'add_circle',       label: 'Rezervasyon Oluşturuldu',    color: 'text-blue-400' },
  RESERVATION_APPROVED:         { icon: 'check_circle',     label: 'Rezervasyon Onaylandı',      color: 'text-green-400' },
  RESERVATION_REJECTED:         { icon: 'cancel',           label: 'Rezervasyon Reddedildi',     color: 'text-red-400' },
  RESERVATION_PAYMENT_CONFIRMED:{ icon: 'payments',         label: 'Ödeme Onaylandı',            color: 'text-emerald-400' },
  RESERVATION_USER_CANCELLED:   { icon: 'remove_circle',    label: 'Kullanıcı İptal Etti',       color: 'text-orange-400' },
  VENUE_SETTINGS_SAVED:         { icon: 'settings',         label: 'Saha Ayarları Kaydedildi',   color: 'text-purple-400' },
  WAITLIST_JOINED:              { icon: 'queue',            label: 'Waitlist\'e Katıldı',        color: 'text-cyan-400' },
  WAITLIST_OFFER_ACCEPTED:      { icon: 'done_all',         label: 'Waitlist Teklifi Kabul',     color: 'text-green-400' },
  WAITLIST_CANCELLED:           { icon: 'remove',           label: 'Waitlist İptali',            color: 'text-slate-400' },
  ALTERNATIVE_OFFER_PROPOSED:   { icon: 'swap_horiz',       label: 'Alternatif Teklif Gönderildi', color: 'text-yellow-400' },
  ALTERNATIVE_ACCEPTED:         { icon: 'event_available',  label: 'Alternatif Kabul Edildi',    color: 'text-green-400' },
  ALTERNATIVE_REJECTED:         { icon: 'event_busy',       label: 'Alternatif Reddedildi',      color: 'text-red-400' },
};

type EntityFilter = 'all' | 'reservation' | 'venue' | 'waitlist';

export const AuditLog: React.FC<Props> = ({ events, onBack, currentUser }) => {
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Last 200 events, newest first
  const filtered = useMemo(() => {
    let list = [...events].sort((a, b) => b.at.localeCompare(a.at));
    if (entityFilter !== 'all') list = list.filter(e => e.entityType === entityFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.action.toLowerCase().includes(q) ||
        e.actorName.toLowerCase().includes(q) ||
        e.entityId.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 200);
  }, [events, entityFilter, search]);

  const relTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Az önce';
    if (m < 60) return `${m} dk önce`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} sa önce`;
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const roleLabel: Record<string, string> = {
    admin: 'Admin', member: 'Üye', guest: 'Misafir',
    venue_owner: 'Saha Sahibi', venue_staff: 'Personel', venue_accountant: 'Muhasebeci',
  };

  return (
    <div className="bg-secondary min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/8 px-4 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-surface border border-white/8 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Audit Log</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">{filtered.length} kayıt</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Aksiyon, kullanıcı veya ID ara..."
            className="w-full bg-surface border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-primary" />
        </div>

        {/* Entity filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {(['all','reservation','venue','waitlist'] as EntityFilter[]).map(f => (
            <button key={f} onClick={() => setEntityFilter(f)}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold whitespace-nowrap transition-all ${
                entityFilter===f ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/8 bg-surface text-slate-500'
              }`}>
              {{ all:'Tümü', reservation:'Rezervasyon', venue:'Saha', waitlist:'Waitlist' }[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Icon name="history" size={48} className="text-slate-700 mb-3" />
            <p className="text-slate-500 font-bold">Kayıt bulunamadı</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/5" />
            <div className="space-y-1">
              {filtered.map(e => {
                const meta = ACTION_META[e.action] ?? { icon: 'info', label: e.action, color: 'text-slate-400' };
                const isExpanded = expanded === e.id;
                return (
                  <div key={e.id} className="relative pl-12">
                    {/* Timeline dot */}
                    <div className={`absolute left-3 top-3.5 w-4 h-4 rounded-full border-2 border-secondary flex items-center justify-center z-10 bg-slate-800`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${meta.color.replace('text-','bg-')}`} />
                    </div>

                    <button onClick={() => setExpanded(isExpanded ? null : e.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all mb-1 ${isExpanded ? 'border-white/12 bg-surface' : 'border-white/5 bg-surface/50 hover:bg-surface'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Icon name={meta.icon} size={14} className={`${meta.color} flex-shrink-0`} />
                          <span className={`text-xs font-bold ${meta.color} truncate`}>{meta.label}</span>
                        </div>
                        <span className="text-[9px] text-slate-600 whitespace-nowrap flex-shrink-0">{relTime(e.at)}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 ml-5 flex-wrap">
                        <span className="text-[10px] text-slate-400">{e.actorName}</span>
                        <span className="text-[9px] bg-white/5 text-slate-500 px-1.5 py-0.5 rounded">{roleLabel[e.actorRole] ?? e.actorRole}</span>
                        <span className="text-[9px] text-slate-600 font-mono">#{e.entityId.slice(-8)}</span>
                      </div>

                      {isExpanded && e.meta && Object.keys(e.meta).length > 0 && (
                        <div className="mt-2 ml-5 bg-secondary rounded-lg p-2 space-y-1">
                          {Object.entries(e.meta).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-500 font-mono min-w-[100px]">{k}:</span>
                              <span className="text-[9px] text-slate-300 font-mono">{JSON.stringify(v)}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 pt-1 border-t border-white/5 mt-1">
                            <span className="text-[9px] text-slate-500 font-mono min-w-[100px]">timestamp:</span>
                            <span className="text-[9px] text-slate-400">{new Date(e.at).toLocaleString('tr-TR')}</span>
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
