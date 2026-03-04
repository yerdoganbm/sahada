import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { MaintenanceTask, IssueTicket, Venue, Player } from '../types';

interface Props {
  currentUser: Player;
  venues: Venue[];
  tasks: MaintenanceTask[];
  tickets: IssueTicket[];
  onBack: () => void;
  onCreateTask: (task: Omit<MaintenanceTask, 'id' | 'createdAt' | 'createdByUserId'>) => void;
  onUpdateTaskStatus: (id: string, status: MaintenanceTask['status']) => void;
  onCreateTicket: (ticket: Omit<IssueTicket, 'id' | 'createdAt' | 'createdByUserId'>) => void;
  onUpdateTicketStatus: (id: string, status: IssueTicket['status']) => void;
}

type Tab = 'tasks' | 'tickets';

const TASK_STATUS_META: Record<MaintenanceTask['status'], { label: string; cls: string; next?: MaintenanceTask['status']; nextLabel?: string }> = {
  open:        { label: 'Açık',           cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25', next: 'in_progress', nextLabel: 'Başlat' },
  in_progress: { label: 'Devam Ediyor',   cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25',      next: 'done',        nextLabel: 'Tamamlandı' },
  done:        { label: 'Tamamlandı',     cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
  cancelled:   { label: 'İptal',          cls: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
};

const TICKET_STATUS_META: Record<IssueTicket['status'], { label: string; cls: string; next?: IssueTicket['status']; nextLabel?: string }> = {
  open:        { label: 'Açık',         cls: 'bg-red-500/15 text-red-400 border-red-500/25',         next: 'in_progress', nextLabel: 'Üstlen' },
  in_progress: { label: 'Ele Alındı',   cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25',      next: 'done',        nextLabel: 'Çözüldü' },
  done:        { label: 'Çözüldü',      cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
};

const PRIORITY_META = {
  high:   { label: 'Yüksek', cls: 'text-red-400', icon: 'priority_high' },
  medium: { label: 'Orta',   cls: 'text-yellow-400', icon: 'remove' },
  low:    { label: 'Düşük',  cls: 'text-slate-400', icon: 'arrow_downward' },
};

export const MaintenanceCenter: React.FC<Props> = ({
  currentUser, venues, tasks, tickets,
  onBack, onCreateTask, onUpdateTaskStatus, onCreateTicket, onUpdateTicketStatus,
}) => {
  const [tab, setTab] = useState<Tab>('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [venueFilter, setVenueFilter] = useState(venues[0]?.id ?? '');

  // Task draft
  const [taskDraft, setTaskDraft] = useState({
    venueId: venues[0]?.id ?? '',
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    startTime: '',
    endTime: '',
  });

  // Ticket draft
  const [ticketDraft, setTicketDraft] = useState({
    venueId: venues[0]?.id ?? '',
    title: '',
    description: '',
    priority: 'medium' as IssueTicket['priority'],
  });

  const filteredTasks = useMemo(() => tasks.filter(t => t.venueId === venueFilter), [tasks, venueFilter]);
  const filteredTickets = useMemo(() => tickets.filter(t => t.venueId === venueFilter), [tickets, venueFilter]);

  const openCount = filteredTasks.filter(t => t.status === 'open' || t.status === 'in_progress').length
    + filteredTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  const handleCreateTask = () => {
    if (!taskDraft.title.trim()) return;
    onCreateTask({ ...taskDraft, endDate: taskDraft.endDate || undefined, startTime: taskDraft.startTime || undefined, endTime: taskDraft.endTime || undefined, status: 'open' });
    setShowTaskModal(false);
    setTaskDraft(p => ({ ...p, title: '', description: '' }));
  };

  const handleCreateTicket = () => {
    if (!ticketDraft.title.trim()) return;
    onCreateTicket({ ...ticketDraft, status: 'open' });
    setShowTicketModal(false);
    setTicketDraft(p => ({ ...p, title: '', description: '' }));
  };

  return (
    <div className="bg-secondary min-h-screen flex flex-col">
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/8 px-4 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-surface border border-white/8 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Bakım & Arıza</h1>
            {openCount > 0 && <p className="text-[10px] text-orange-400">{openCount} aktif görev</p>}
          </div>
          {tab === 'tasks'
            ? <button onClick={() => setShowTaskModal(true)} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-glow"><Icon name="add" className="text-secondary" /></button>
            : <button onClick={() => setShowTicketModal(true)} className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center"><Icon name="add" className="text-white" /></button>
          }
        </div>

        {venues.length > 1 && (
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-0.5">
            {venues.map(v => (
              <button key={v.id} onClick={() => setVenueFilter(v.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all ${venueFilter === v.id ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/8 bg-surface text-slate-400'}`}>
                {v.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {(['tasks', 'tickets'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${tab === t ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/8 bg-surface text-slate-400'}`}>
              {t === 'tasks' ? `Bakım Planı (${filteredTasks.length})` : `Arıza Kayıtları (${filteredTickets.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === 'tasks' && (
          filteredTasks.length === 0
            ? <Empty icon="construction" text="Bakım planı yok" sub="+ butonu ile bakım görevi ekleyin" />
            : filteredTasks.map(task => {
                const meta = TASK_STATUS_META[task.status];
                return (
                  <div key={task.id} className="bg-surface rounded-2xl border border-white/6 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-bold text-white text-sm">{task.title}</h4>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${meta.cls}`}>{meta.label}</span>
                        </div>
                        {task.description && <p className="text-[11px] text-slate-400 mb-1">{task.description}</p>}
                        <p className="text-[10px] text-slate-500">
                          {task.startDate}{task.endDate && task.endDate !== task.startDate ? ` → ${task.endDate}` : ''}
                          {task.startTime ? ` · ${task.startTime}${task.endTime ? `–${task.endTime}` : ''}` : ' (Tüm gün)'}
                        </p>
                      </div>
                    </div>
                    {meta.next && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => onUpdateTaskStatus(task.id, meta.next!)}
                          className="flex-1 py-2 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs font-bold">
                          {meta.nextLabel}
                        </button>
                        {task.status !== 'cancelled' && task.status !== 'done' && (
                          <button onClick={() => onUpdateTaskStatus(task.id, 'cancelled')}
                            className="px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-xs font-bold">
                            İptal
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
        )}

        {tab === 'tickets' && (
          filteredTickets.length === 0
            ? <Empty icon="bug_report" text="Arıza kaydı yok" sub="+ butonu ile yeni arıza bildirin" />
            : filteredTickets.map(ticket => {
                const meta = TICKET_STATUS_META[ticket.status];
                const pri = PRIORITY_META[ticket.priority];
                return (
                  <div key={ticket.id} className="bg-surface rounded-2xl border border-white/6 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-bold text-white text-sm">{ticket.title}</h4>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${meta.cls}`}>{meta.label}</span>
                          <span className={`text-[9px] font-bold flex items-center gap-0.5 ${pri.cls}`}>
                            <Icon name={pri.icon} size={9} />
                            {pri.label}
                          </span>
                        </div>
                        {ticket.description && <p className="text-[11px] text-slate-400 mb-1">{ticket.description}</p>}
                        <p className="text-[9px] text-slate-600">{new Date(ticket.createdAt).toLocaleString('tr-TR')}</p>
                      </div>
                    </div>
                    {meta.next && (
                      <button onClick={() => onUpdateTicketStatus(ticket.id, meta.next!)}
                        className="w-full mt-2 py-2 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs font-bold">
                        {meta.nextLabel}
                      </button>
                    )}
                  </div>
                );
              })
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <Modal title="Yeni Bakım Görevi" onClose={() => setShowTaskModal(false)}>
          <div className="space-y-3">
            {venues.length > 1 && (
              <Field label="Saha">
                <select value={taskDraft.venueId} onChange={e => setTaskDraft(p => ({ ...p, venueId: e.target.value }))}
                  className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </Field>
            )}
            <Field label="Başlık">
              <input value={taskDraft.title} onChange={e => setTaskDraft(p => ({ ...p, title: e.target.value }))}
                placeholder="Örn: Çim yenileme"
                className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary" />
            </Field>
            <Field label="Açıklama">
              <textarea value={taskDraft.description} onChange={e => setTaskDraft(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="Detaylar..."
                className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-primary" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Başlangıç Tarihi"><input type="date" value={taskDraft.startDate} onChange={e => setTaskDraft(p => ({ ...p, startDate: e.target.value }))} className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none" /></Field>
              <Field label="Bitiş Tarihi"><input type="date" value={taskDraft.endDate} onChange={e => setTaskDraft(p => ({ ...p, endDate: e.target.value }))} className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Başlangıç Saati (boş=tüm gün)"><input type="time" value={taskDraft.startTime} onChange={e => setTaskDraft(p => ({ ...p, startTime: e.target.value }))} className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none" /></Field>
              <Field label="Bitiş Saati"><input type="time" value={taskDraft.endTime} onChange={e => setTaskDraft(p => ({ ...p, endTime: e.target.value }))} className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none" /></Field>
            </div>
          </div>
          <button onClick={handleCreateTask} disabled={!taskDraft.title.trim()}
            className="w-full mt-4 py-3.5 rounded-2xl bg-primary text-secondary font-black disabled:opacity-40">
            Görevi Oluştur
          </button>
        </Modal>
      )}

      {/* Ticket Modal */}
      {showTicketModal && (
        <Modal title="Yeni Arıza Kaydı" onClose={() => setShowTicketModal(false)}>
          <div className="space-y-3">
            {venues.length > 1 && (
              <Field label="Saha">
                <select value={ticketDraft.venueId} onChange={e => setTicketDraft(p => ({ ...p, venueId: e.target.value }))}
                  className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </Field>
            )}
            <Field label="Başlık">
              <input value={ticketDraft.title} onChange={e => setTicketDraft(p => ({ ...p, title: e.target.value }))}
                placeholder="Örn: Kale direği kırık"
                className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary" />
            </Field>
            <Field label="Açıklama">
              <textarea value={ticketDraft.description} onChange={e => setTicketDraft(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="Detaylar..."
                className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-primary" />
            </Field>
            <Field label="Öncelik">
              <div className="flex gap-2">
                {(['high','medium','low'] as const).map(p => (
                  <button key={p} onClick={() => setTicketDraft(prev => ({ ...prev, priority: p }))}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${ticketDraft.priority === p ? `border-current bg-current/10 ${PRIORITY_META[p].cls}` : 'border-white/10 text-slate-400'}`}>
                    <Icon name={PRIORITY_META[p].icon} size={11} />
                    {PRIORITY_META[p].label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <button onClick={handleCreateTicket} disabled={!ticketDraft.title.trim()}
            className="w-full mt-4 py-3.5 rounded-2xl bg-red-500 text-white font-black disabled:opacity-40">
            Arıza Bildir
          </button>
        </Modal>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{label}</label>
    {children}
  </div>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 p-5 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-black text-base">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><Icon name="close" size={16} className="text-slate-400" /></button>
      </div>
      {children}
    </div>
  </div>
);

const Empty: React.FC<{ icon: string; text: string; sub: string }> = ({ icon, text, sub }) => (
  <div className="flex flex-col items-center py-14 text-center">
    <Icon name={icon} size={50} className="text-slate-700 mb-3" />
    <p className="text-white font-bold mb-1">{text}</p>
    <p className="text-slate-500 text-xs">{sub}</p>
  </div>
);
