import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { MessageTemplate, OutboxMessage, Reservation, Venue, Player } from '../types';

interface Props {
  currentUser: Player;
  venues: Venue[];
  reservations: Reservation[];
  templates: MessageTemplate[];
  outbox: OutboxMessage[];
  onBack: () => void;
  onCreateOutbox: (msg: Omit<OutboxMessage, 'id' | 'createdAt' | 'status' | 'createdByUserId'>) => void;
  onCopyMessage: (outboxId: string, body: string) => void;
  renderTemplate: (body: string, vars: Record<string, string>) => string;
}

const TEMPLATE_ICONS: Record<string, string> = {
  CONFIRMED:        'check_circle',
  CANCELLED:        'cancel',
  REMINDER_24H:     'notifications',
  REMINDER_3H:      'schedule',
  DEPOSIT_PENDING:  'attach_money',
  MAINTENANCE_NOTICE: 'construction',
};

export const BroadcastCenter: React.FC<Props> = ({
  currentUser, venues, reservations, templates, outbox,
  onBack, onCreateOutbox, onCopyMessage, renderTemplate,
}) => {
  const [tab, setTab] = useState<'broadcast' | 'outbox'>('broadcast');
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [selectedKey, setSelectedKey] = useState('');
  const [freeText, setFreeText] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [generated, setGenerated] = useState(false);

  const targetReservations = useMemo(() =>
    reservations.filter(r =>
      r.venueId === venueId &&
      r.status === 'confirmed' &&
      r.date >= fromDate && r.date <= toDate
    ).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [reservations, venueId, fromDate, toDate]
  );

  const venue = venues.find(v => v.id === venueId);
  const selectedTemplate = templates.find(t => t.key === selectedKey);

  const buildVars = (r: Reservation): Record<string, string> => ({
    customerName: r.customerName || r.teamName || '',
    venueName: r.venueName,
    date: new Date(r.date + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }),
    time: r.startTime,
    depositAmount: String(r.depositAmount ?? 0),
    checkInCode: r.checkInCode ?? '------',
    iban: 'TR33 0006 1005 1978 6457 8413 26',
  });

  const previewBody = (r: Reservation): string => {
    if (useCustom) return freeText;
    if (!selectedTemplate) return '';
    return renderTemplate(selectedTemplate.body, buildVars(r));
  };

  const handleGenerateOutbox = () => {
    if (!targetReservations.length) return;
    if (!useCustom && !selectedTemplate) return;
    if (useCustom && !freeText.trim()) return;

    targetReservations.forEach(r => {
      const body = previewBody(r);
      onCreateOutbox({
        venueId,
        toLabel: r.customerName || r.teamName,
        phone: r.customerPhone || r.contactPhone,
        templateKey: useCustom ? undefined : selectedKey,
        body,
      });
    });
    setGenerated(true);
    setTab('outbox');
  };

  const filteredOutbox = useMemo(() =>
    outbox.filter(m => m.venueId === venueId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [outbox, venueId]
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (msg: OutboxMessage) => {
    navigator.clipboard?.writeText(msg.body).catch(() => {});
    onCopyMessage(msg.id, msg.body);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format phone for WA link
  const waLink = (phone?: string, body?: string) => {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, '').replace(/^0/, '90');
    const text = encodeURIComponent(body ?? '');
    return `https://wa.me/${clean}?text=${text}`;
  };

  return (
    <div className="bg-secondary min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/8 px-4 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-surface border border-white/8 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white flex-1">Toplu Mesaj</h1>
          {filteredOutbox.length > 0 && (
            <div className="bg-primary/15 border border-primary/25 rounded-full px-2.5 py-1 text-[10px] font-black text-primary">
              {filteredOutbox.filter(m => m.status === 'draft').length} bekliyor
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {(['broadcast', 'outbox'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${tab === t ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/8 bg-surface text-slate-400'}`}>
              {t === 'broadcast' ? '📣 Yeni Duyuru' : `📬 Outbox (${filteredOutbox.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* ── BROADCAST TAB ── */}
        {tab === 'broadcast' && (
          <div className="space-y-4">
            {/* Venue + Date range */}
            {venues.length > 1 && (
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Saha</label>
                <select value={venueId} onChange={e => { setVenueId(e.target.value); setGenerated(false); }}
                  className="w-full bg-surface border border-white/8 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Başlangıç</label>
                <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setGenerated(false); }}
                  className="w-full bg-surface border border-white/8 rounded-xl px-3 py-2 text-white text-xs focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Bitiş</label>
                <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setGenerated(false); }}
                  className="w-full bg-surface border border-white/8 rounded-xl px-3 py-2 text-white text-xs focus:outline-none" />
              </div>
            </div>

            {/* Target count */}
            <div className={`rounded-2xl border p-3 flex items-center gap-3 ${targetReservations.length > 0 ? 'bg-primary/8 border-primary/20' : 'bg-white/3 border-white/8'}`}>
              <Icon name="groups" size={18} className={targetReservations.length > 0 ? 'text-primary' : 'text-slate-600'} />
              <div>
                <p className={`text-sm font-black ${targetReservations.length > 0 ? 'text-white' : 'text-slate-500'}`}>
                  {targetReservations.length} onaylı rezervasyon hedefleniyor
                </p>
                <p className="text-[10px] text-slate-500">{fromDate} → {toDate}</p>
              </div>
            </div>

            {/* Template selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Şablon</label>
                <button onClick={() => { setUseCustom(!useCustom); setSelectedKey(''); }}
                  className={`text-[9px] font-black px-2 py-1 rounded-lg border transition-all ${useCustom ? 'border-purple-500/30 bg-purple-500/10 text-purple-400' : 'border-white/10 text-slate-500'}`}>
                  {useCustom ? '✓ Serbest Metin' : 'Serbest Metin'}
                </button>
              </div>
              {!useCustom && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {templates.map(tpl => (
                    <button key={tpl.key} onClick={() => setSelectedKey(tpl.key)}
                      className={`p-3 rounded-xl border text-left transition-all ${selectedKey === tpl.key ? 'border-primary/40 bg-primary/10' : 'border-white/8 bg-surface hover:border-white/15'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name={TEMPLATE_ICONS[tpl.key] ?? 'message'} size={13} className={selectedKey === tpl.key ? 'text-primary' : 'text-slate-500'} />
                        <span className={`text-[10px] font-black ${selectedKey === tpl.key ? 'text-primary' : 'text-slate-400'}`}>{tpl.title}</span>
                      </div>
                      <p className="text-[9px] text-slate-600 line-clamp-2">{tpl.body.replace(/\{[^}]+\}/g, '...')}</p>
                    </button>
                  ))}
                </div>
              )}
              {useCustom && (
                <textarea value={freeText} onChange={e => setFreeText(e.target.value)}
                  placeholder={`Merhaba, ${venue?.name ?? 'Saha'} tarafından bilgi...\n{customerName} placeholder'ı kullanabilirsiniz.`}
                  rows={4}
                  className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-primary" />
              )}
            </div>

            {/* Preview (first reservation) */}
            {targetReservations.length > 0 && (selectedTemplate || (useCustom && freeText)) && (
              <div className="bg-surface rounded-2xl border border-white/8 p-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Önizleme — {targetReservations[0].customerName || targetReservations[0].teamName}
                </p>
                <div className="bg-[#1a1a2e] rounded-xl p-3 border border-white/5">
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                    {previewBody(targetReservations[0])}
                  </p>
                </div>
                {targetReservations.length > 1 && (
                  <p className="text-[9px] text-slate-500 mt-2">+ {targetReservations.length - 1} kişi daha</p>
                )}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerateOutbox}
              disabled={!targetReservations.length || (!selectedTemplate && !freeText)}
              className="w-full py-4 rounded-2xl bg-primary text-secondary font-black shadow-glow disabled:opacity-40 flex items-center justify-center gap-2">
              <Icon name="send" size={18} />
              {targetReservations.length} Kişi için Outbox Oluştur
            </button>

            {generated && (
              <div className="flex items-center gap-2 p-3 bg-green-500/8 border border-green-500/20 rounded-xl">
                <Icon name="check_circle" size={16} className="text-green-400" />
                <p className="text-xs text-green-400 font-bold">Outbox mesajları oluşturuldu. Outbox sekmesinden kopyalayın.</p>
              </div>
            )}
          </div>
        )}

        {/* ── OUTBOX TAB ── */}
        {tab === 'outbox' && (
          <div className="space-y-3">
            {filteredOutbox.length === 0
              ? (
                <div className="flex flex-col items-center py-14 text-center">
                  <Icon name="outbox" size={52} className="text-slate-700 mb-3" />
                  <p className="text-white font-bold mb-1">Outbox boş</p>
                  <p className="text-slate-500 text-xs">Duyuru oluşturun → mesajlar burada belirir</p>
                </div>
              )
              : filteredOutbox.map(msg => {
                  const isCopied = msg.status === 'copied';
                  const isJustCopied = copiedId === msg.id;
                  const waUrl = waLink(msg.phone, msg.body);
                  return (
                    <div key={msg.id} className={`bg-surface rounded-2xl border p-4 transition-all ${isCopied ? 'border-green-500/15' : 'border-white/6'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-white text-sm">{msg.toLabel}</p>
                          {msg.phone && <p className="text-[10px] text-slate-500">{msg.phone}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {msg.templateKey && (
                            <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/15 px-1.5 py-0.5 rounded">{msg.templateKey}</span>
                          )}
                          {isCopied && (
                            <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Icon name="check" size={9} />Kopyalandı
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Message body preview */}
                      <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-3 whitespace-pre-line">{msg.body}</p>

                      <div className="flex gap-2">
                        <button onClick={() => handleCopy(msg)}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            isJustCopied
                              ? 'border-green-500/30 bg-green-500/10 text-green-400'
                              : isCopied
                                ? 'border-white/8 bg-white/3 text-slate-500'
                                : 'border-primary/25 bg-primary/8 text-primary hover:bg-primary/15'
                          }`}>
                          <Icon name={isJustCopied ? 'check' : 'content_copy'} size={13} />
                          {isJustCopied ? 'Kopyalandı!' : 'Kopyala'}
                        </button>
                        {waUrl && (
                          <a href={waUrl} target="_blank" rel="noopener noreferrer"
                            className="flex-1 py-2.5 rounded-xl border border-green-500/25 bg-green-500/8 text-green-400 text-xs font-bold flex items-center justify-center gap-1.5">
                            <Icon name="chat_bubble" size={13} />
                            WA Aç
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>
    </div>
  );
};
