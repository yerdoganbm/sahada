/**
 * CaptainOutbox — Tüm outbox mesajlarını göster + kopyala
 */
import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Player, Team, Reservation, OutboxMessage, ScreenName } from '../types';

interface Props {
  currentUser: Player | null;
  outboxMessages: OutboxMessage[];
  teams: Team[];
  reservations: Reservation[];
  onBack: () => void;
  onCopy: (id: string) => void;
}

export const CaptainOutbox: React.FC<Props> = ({
  currentUser, outboxMessages, teams, reservations, onBack, onCopy,
}) => {
  const [filter, setFilter] = useState<'all' | 'draft' | 'copied'>('all');
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState('all');

  const myTeams = teams.filter(t => t.captainUserId === currentUser?.id);

  const filtered = useMemo(() => {
    return outboxMessages
      .filter(m => {
        if (filter !== 'all' && m.status !== filter) return false;
        if (selectedTeamId !== 'all' && m.teamId !== selectedTeamId) return false;
        return true;
      })
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [outboxMessages, filter, selectedTeamId]);

  const draftCount = outboxMessages.filter(m => m.status === 'draft').length;

  const copy = async (msg: OutboxMessage) => {
    await navigator.clipboard.writeText(msg.body).catch(() => {});
    setCopied(msg.id);
    onCopy(msg.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = async () => {
    const drafts = filtered.filter(m => m.status === 'draft');
    const text = drafts.map(m => `--- ${m.toLabel} ---\n${m.body}`).join('\n\n');
    await navigator.clipboard.writeText(text).catch(() => {});
    drafts.forEach(m => onCopy(m.id));
    setCopied('all');
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="pb-10 bg-secondary min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Mesaj Kutusu</h1>
            {draftCount > 0 && <p className="text-xs text-yellow-400">{draftCount} gönderilmemiş taslak</p>}
          </div>
          {filtered.some(m => m.status === 'draft') && (
            <button onClick={copyAll}
              className={`px-3 py-2 rounded-xl border text-xs font-black transition-all ${copied === 'all' ? 'bg-primary/15 border-primary/25 text-primary' : 'bg-white/5 border-white/10 text-slate-300'}`}>
              {copied === 'all' ? '✓ Tümü' : 'Tümünü Kopyala'}
            </button>
          )}
        </div>

        {/* Team filter */}
        {myTeams.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-2">
            <button onClick={() => setSelectedTeamId('all')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${selectedTeamId === 'all' ? 'bg-primary/15 border-primary/25 text-primary' : 'border-white/10 text-slate-500'}`}>
              Tüm Takımlar
            </button>
            {myTeams.map(t => (
              <button key={t.id} onClick={() => setSelectedTeamId(t.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${selectedTeamId === t.id ? 'bg-primary/15 border-primary/25 text-primary' : 'border-white/10 text-slate-500'}`}>
                {t.name}
              </button>
            ))}
          </div>
        )}

        {/* Status filter */}
        <div className="flex gap-2">
          {(['all', 'draft', 'copied'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${filter === f ? 'bg-white/15 text-white' : 'text-slate-500'}`}>
              {f === 'all' ? 'Tümü' : f === 'draft' ? 'Taslak' : 'Kopyalandı'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Icon name="outbox" size={40} className="text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">Mesaj yok</p>
            <p className="text-slate-600 text-xs mt-1">Maç planlandığında üyelere otomatik mesajlar oluşturulur.</p>
          </div>
        ) : (
          filtered.map(msg => {
            const res = reservations.find(r => r.id === msg.reservationId);
            const team = teams.find(t => t.id === msg.teamId);
            return (
              <div key={msg.id} className="bg-surface rounded-2xl border border-white/8 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-sm">{msg.toLabel}</p>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${msg.status === 'copied' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {msg.status === 'copied' ? '✓ Kopyalandı' : 'Taslak'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px]">
                      {team?.name}{res ? ` · ${res.date} ${res.startTime}` : ''}
                    </p>
                    <p className="text-slate-600 text-[9px]">{new Date(msg.at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-3">
                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">{msg.body}</p>
                </div>

                <button onClick={() => copy(msg)}
                  className={`w-full py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                    copied === msg.id ? 'bg-primary/15 border-primary/25 text-primary' : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'}`}>
                  <Icon name="content_copy" size={12} />
                  {copied === msg.id ? '✓ Kopyalandı' : 'Mesajı Kopyala'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
