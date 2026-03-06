/**
 * VenueStaffManagement – Saha sahibi personel & muhasebeci yönetimi
 * Davet gönder, mevcut ekibi görüntüle, yetki değiştir/iptal et
 */
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Player } from '../types';

interface VenueStaffManagementProps {
  currentUser: Player;
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: 'venue_staff' | 'venue_accountant';
  status: 'active' | 'pending';
  addedAt: string;
}

const ROLE_META: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  venue_staff: {
    label: 'Personel',
    color: '#3B82F6',
    icon: 'badge',
    desc: 'Rezervasyon, takvim, müşteri, bakım, mesaj',
  },
  venue_accountant: {
    label: 'Muhasebeci',
    color: '#8B5CF6',
    icon: 'calculate',
    desc: 'Gelir raporları, analitik, kasa, audit log',
  },
};

// Demo data
const DEMO_STAFF: StaffMember[] = [
  { id: 's1', name: 'Serkan Yıldız', phone: '5000000098', role: 'venue_staff', status: 'active', addedAt: '2025-01-15' },
  { id: 's2', name: 'Ayşe Kaya', phone: '5000000097', role: 'venue_accountant', status: 'active', addedAt: '2025-02-01' },
];

export const VenueStaffManagement: React.FC<VenueStaffManagementProps> = ({
  currentUser,
  onBack,
  onNavigate,
}) => {
  const [staff, setStaff] = useState<StaffMember[]>(DEMO_STAFF);
  const [showInvite, setShowInvite] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'venue_staff' | 'venue_accountant'>('venue_staff');
  const [inviteName, setInviteName] = useState('');
  const [sending, setSending] = useState(false);

  const fmtPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6)}`;
    return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6,8)} ${d.slice(8)}`;
  };

  const rawInvitePhone = invitePhone.replace(/\D/g, '');
  const phoneValid = rawInvitePhone.length === 10;
  const nameValid = inviteName.trim().length >= 2;
  const canSend = phoneValid && nameValid;

  const handleSendInvite = () => {
    if (!canSend) return;
    setSending(true);
    setTimeout(() => {
      const newMember: StaffMember = {
        id: 'inv_' + Date.now(),
        name: inviteName.trim(),
        phone: rawInvitePhone,
        role: inviteRole,
        status: 'pending',
        addedAt: new Date().toISOString().slice(0, 10),
      };
      setStaff(prev => [newMember, ...prev]);
      setInvitePhone('');
      setInviteName('');
      setShowInvite(false);
      setSending(false);
    }, 800);
  };

  const handleRevoke = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const activeStaff = staff.filter(s => s.role === 'venue_staff');
  const activeAccountants = staff.filter(s => s.role === 'venue_accountant');

  return (
    <div className="min-h-screen bg-secondary pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-secondary/95 backdrop-blur-xl border-b border-white/5 px-5 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Icon name="arrow_back" size={18} className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-black text-lg">Ekip Yönetimi</h1>
            <p className="text-slate-500 text-[11px]">Personel ve muhasebeci davet et, yetkilendir</p>
          </div>
          <button onClick={() => setShowInvite(true)}
            className="px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 hover:bg-blue-400 transition-colors">
            <Icon name="person_add" size={16} />
            Davet Et
          </button>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Yetki Açıklaması */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(ROLE_META).map(([key, meta]) => (
            <div key={key} className="bg-surface rounded-2xl border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${meta.color}18` }}>
                  <Icon name={meta.icon} size={18} style={{ color: meta.color }} />
                </div>
                <span className="text-white font-bold text-sm">{meta.label}</span>
              </div>
              <p className="text-slate-500 text-[10px] leading-relaxed">{meta.desc}</p>
            </div>
          ))}
        </div>

        {/* Personel Listesi */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Icon name="badge" size={16} className="text-blue-400" />
            Personel ({activeStaff.length})
          </h3>
          {activeStaff.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-white/5 p-6 text-center">
              <Icon name="person_add" size={32} className="text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Henüz personel eklenmedi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeStaff.map(s => (
                <StaffCard key={s.id} member={s} onRevoke={() => handleRevoke(s.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Muhasebeci Listesi */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Icon name="calculate" size={16} className="text-purple-400" />
            Muhasebeci ({activeAccountants.length})
          </h3>
          {activeAccountants.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-white/5 p-6 text-center">
              <Icon name="person_add" size={32} className="text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Henüz muhasebeci eklenmedi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeAccountants.map(s => (
                <StaffCard key={s.id} member={s} onRevoke={() => handleRevoke(s.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Bilgi notu */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Icon name="info" size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-blue-300 leading-relaxed mb-1">
                <strong>Nasıl çalışır?</strong>
              </p>
              <ul className="text-[10px] text-slate-400 space-y-1 list-disc ml-3">
                <li>Davet ettiğiniz kişi uygulamaya girdiğinde otomatik olarak rolü atanır</li>
                <li>Personel sadece günlük operasyonları yönetebilir</li>
                <li>Muhasebeci sadece finansal raporlara erişebilir</li>
                <li>Yetkileri istediğiniz zaman iptal edebilirsiniz</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Davet Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
          <div className="relative w-full max-w-md bg-secondary border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-black text-lg">Ekip Üyesi Davet Et</h2>
              <button onClick={() => setShowInvite(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <Icon name="close" size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Rol seçimi */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Rol Seçin</label>
              <div className="grid grid-cols-2 gap-2">
                {(['venue_staff', 'venue_accountant'] as const).map(role => {
                  const meta = ROLE_META[role];
                  const active = inviteRole === role;
                  return (
                    <button key={role} onClick={() => setInviteRole(role)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-white/10 bg-surface hover:border-white/20'
                      }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name={meta.icon} size={16} style={{ color: active ? meta.color : '#64748b' }} />
                        <span className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-400'}`}>{meta.label}</span>
                      </div>
                      <p className="text-[9px] text-slate-600 leading-relaxed">{meta.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ad */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Ad Soyad *</label>
              <input value={inviteName} onChange={e => setInviteName(e.target.value)}
                placeholder="Serkan Yıldız"
                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>

            {/* Telefon */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Telefon Numarası *</label>
              <div className="flex items-center bg-surface border border-white/10 rounded-xl px-4 py-3 gap-2 focus-within:border-blue-500 transition-colors">
                <span className="text-white/40 text-sm font-bold flex-shrink-0">+90</span>
                <div className="w-px h-4 bg-white/10 flex-shrink-0" />
                <input value={invitePhone} onChange={e => setInvitePhone(fmtPhone(e.target.value))}
                  type="tel" placeholder="532 000 00 00"
                  className="flex-1 bg-transparent text-white text-sm font-bold focus:outline-none placeholder-slate-700" />
                {phoneValid && <Icon name="check_circle" size={18} className="text-green-400" />}
              </div>
            </div>

            {/* Gönder */}
            <button onClick={handleSendInvite} disabled={!canSend || sending}
              className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                canSend
                  ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                  : 'bg-white/5 text-slate-700 cursor-not-allowed'
              }`}>
              {sending ? (
                <><Icon name="refresh" size={16} className="animate-spin" /> Gönderiliyor...</>
              ) : (
                <><Icon name="send" size={16} /> Davet Gönder</>
              )}
            </button>

            <p className="text-[10px] text-slate-600 text-center">
              Davet edilen kişi uygulamaya giriş yaptığında otomatik olarak yetkilendirilecektir.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: none; opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
};

// Staff card component
const StaffCard: React.FC<{ member: StaffMember; onRevoke: () => void }> = ({ member, onRevoke }) => {
  const meta = ROLE_META[member.role];
  return (
    <div className="bg-surface rounded-2xl border border-white/5 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
        style={{ background: `${meta.color}18` }}>
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-bold text-sm truncate">{member.name}</p>
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full border"
            style={{ color: meta.color, background: `${meta.color}15`, borderColor: `${meta.color}30` }}>
            {meta.label}
          </span>
          {member.status === 'pending' && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              Bekliyor
            </span>
          )}
        </div>
        <p className="text-slate-600 text-[10px] mt-0.5">+90 {member.phone.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4')}</p>
      </div>
      <button onClick={onRevoke}
        className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors"
        title="Yetkiyi iptal et">
        <Icon name="person_remove" size={16} className="text-red-400" />
      </button>
    </div>
  );
};
