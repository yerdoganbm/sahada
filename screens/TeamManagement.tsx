import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Player, Team, TeamInvite, TeamJoinRequest, CaptainPayoutProfile, ScreenName } from '../types';

interface Props {
  currentUser: Player | null;
  teams: Team[];
  teamInvites: TeamInvite[];
  teamJoinRequests: TeamJoinRequest[];
  captainPayoutProfiles: CaptainPayoutProfile[];
  onBack: () => void;
  onNavigate: (s: ScreenName) => void;
  onCreateTeam: (name: string) => void;
  onCreateInviteCode: (teamId: string, opts: { maxUses?: number; autoApprove?: boolean; expiresInDays?: number }) => any;
  onRevokeInviteCode: (inviteId: string) => void;
  onApproveJoinRequest: (requestId: string) => void;
  onRejectJoinRequest: (requestId: string) => void;
  onSavePayoutProfile: (profile: Partial<CaptainPayoutProfile>) => void;
}

const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://sahada.app';

export const TeamManagement: React.FC<Props> = ({
  currentUser, teams, teamInvites, teamJoinRequests, captainPayoutProfiles,
  onBack, onNavigate, onCreateTeam, onCreateInviteCode, onRevokeInviteCode,
  onApproveJoinRequest, onRejectJoinRequest, onSavePayoutProfile,
}) => {
  const [tab, setTab] = useState<'teams' | 'invites' | 'iban' | 'requests'>('teams');
  const [newTeamName, setNewTeamName] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  const myTeams = useMemo(() => teams.filter(t => t.captainUserId === currentUser?.id), [teams, currentUser]);
  const myInvites = useMemo(() => teamInvites.filter(i => myTeams.some(t => t.id === i.teamId)), [teamInvites, myTeams]);
  const myRequests = useMemo(() => teamJoinRequests.filter(r => myTeams.some(t => t.id === r.teamId) && r.status === 'pending'), [teamJoinRequests, myTeams]);
  const captainProfile = captainPayoutProfiles.find(p => p.captainUserId === currentUser?.id) ?? { captainUserId: currentUser?.id ?? '' };

  const [ibanForm, setIbanForm] = useState({
    iban: captainProfile.iban ?? '', accountName: captainProfile.accountName ?? '',
    bankName: captainProfile.bankName ?? '', phoneForCash: captainProfile.phoneForCash ?? '',
  });

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const TABS = [
    { k: 'teams', label: 'Takımlar', icon: 'groups' },
    { k: 'invites', label: 'Davet', icon: 'link' },
    { k: 'iban', label: 'IBAN', icon: 'account_balance' },
    { k: 'requests', label: 'Talepler', icon: 'notifications', badge: myRequests.length },
  ] as const;

  return (
    <div className="pb-24 bg-secondary min-h-screen">
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-0 border-b border-white/10">
        <div className="flex items-center gap-3 pb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Takım Yönetimi</h1>
        </div>
        <div className="flex gap-1 pb-0">
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1 text-xs font-bold border-b-2 transition-all relative ${tab === t.k ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>
              {t.label}
              {t.badge > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center">{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* TEAMS TAB */}
        {tab === 'teams' && (
          <>
            <div className="bg-surface rounded-2xl border border-white/5 p-4 space-y-3">
              <p className="text-sm font-bold text-white">Yeni Takım Oluştur</p>
              <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                placeholder="Takım adı" className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary" />
              <button onClick={() => { if (newTeamName.trim()) { onCreateTeam(newTeamName.trim()); setNewTeamName(''); } }}
                disabled={!newTeamName.trim()}
                className="w-full py-2.5 rounded-xl bg-primary text-secondary font-bold text-sm disabled:opacity-40">
                Oluştur
              </button>
            </div>
            {myTeams.map(team => (
              <div key={team.id} className="bg-surface rounded-2xl border border-white/5 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon name="groups" size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-bold">{team.name}</p>
                    <p className="text-slate-400 text-xs">{team.memberUserIds.length} üye</p>
                  </div>
                </div>
                <button onClick={() => setTab('invites')}
                  className="w-full py-2 rounded-xl bg-white/5 border border-white/8 text-slate-300 text-sm font-bold">
                  Davet Kodu Yönet →
                </button>
              </div>
            ))}
          </>
        )}

        {/* INVITES TAB */}
        {tab === 'invites' && (
          <>
            {myTeams.map(team => {
              const invite = myInvites.find(i => i.teamId === team.id && i.status === 'active');
              const joinLink = invite ? `${APP_URL}?join=${invite.code}` : '';
              const waText = invite ? `Takıma katıl: ${team.name}\nLink: ${joinLink}\nNot: İlk girişte ad-soyad ve telefon istenecek. Maç ödemeleri kaptan üzerinden toplanacak.` : '';
              return (
                <div key={team.id} className="bg-surface rounded-2xl border border-white/5 p-4 space-y-3">
                  <p className="text-white font-bold text-sm">{team.name}</p>
                  {invite ? (
                    <>
                      <div className="bg-secondary rounded-xl p-3 border border-white/8">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Davet Kodu</p>
                          <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{invite.code}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{invite.usesCount}/{invite.maxUses ?? '∞'} kullanım · {invite.autoApprove ? 'Otomatik Onay ✓' : 'Manuel Onay'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => copy(invite.code, 'code_' + invite.id)}
                          className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${copiedKey === 'code_' + invite.id ? 'border-green-500/20 text-green-400' : 'border-white/10 text-slate-300'}`}>
                          <Icon name="content_copy" size={12} />
                          {copiedKey === 'code_' + invite.id ? '✓ Kopyalandı' : 'Kodu Kopyala'}
                        </button>
                        <button onClick={() => copy(joinLink, 'link_' + invite.id)}
                          className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${copiedKey === 'link_' + invite.id ? 'border-green-500/20 text-green-400' : 'border-white/10 text-slate-300'}`}>
                          <Icon name="link" size={12} />
                          {copiedKey === 'link_' + invite.id ? '✓ Kopyalandı' : 'Linki Kopyala'}
                        </button>
                      </div>
                      <button onClick={() => copy(waText, 'wa_' + invite.id)}
                        className={`w-full py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${copiedKey === 'wa_' + invite.id ? 'border-green-500/20 bg-green-500/8 text-green-400' : 'border-green-600/20 bg-green-600/8 text-green-400 hover:bg-green-600/12'}`}>
                        <Icon name="chat" size={14} />
                        {copiedKey === 'wa_' + invite.id ? '✓ WhatsApp Metni Kopyalandı!' : 'WhatsApp Davet Metni Kopyala'}
                      </button>
                      <button onClick={() => onRevokeInviteCode(invite.id)}
                        className="w-full py-2 rounded-xl border border-red-500/20 text-red-400 text-xs font-bold">
                        Kodu İptal Et
                      </button>
                    </>
                  ) : (
                    <button onClick={() => onCreateInviteCode(team.id, { maxUses: 20, autoApprove: true })}
                      className="w-full py-3 rounded-xl bg-primary text-secondary font-bold text-sm">
                      Davet Kodu Oluştur
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* IBAN TAB */}
        {tab === 'iban' && (
          <div className="bg-surface rounded-2xl border border-white/5 p-4 space-y-3">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Icon name="account_balance" size={16} className="text-primary" />
              Ödeme Bilgilerim
            </p>
            <p className="text-xs text-slate-400">Üyeler bu bilgilerle sana EFT yapacak.</p>
            {[
              { key: 'iban', label: 'IBAN', placeholder: 'TR33 0006 1005 1978 6457 8413 26' },
              { key: 'accountName', label: 'Hesap Adı', placeholder: 'Adın Soyadın' },
              { key: 'bankName', label: 'Banka', placeholder: 'Ziraat Bankası' },
              { key: 'phoneForCash', label: 'Nakit İçin Tel', placeholder: '0532 000 00 00' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">{label}</label>
                <input value={(ibanForm as any)[key]} onChange={e => setIbanForm(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary" />
              </div>
            ))}
            <button onClick={() => onSavePayoutProfile(ibanForm)}
              className="w-full py-3 rounded-xl bg-primary text-secondary font-bold text-sm">
              Kaydet
            </button>
            <div className="bg-secondary p-3 rounded-xl border border-white/8">
              <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">EFT Açıklama Formatı</p>
              <p className="text-xs font-mono text-primary">TEAM-{'{teamId}'}-RES-{'{reservationId}'}-U{'{userId}'}</p>
            </div>
          </div>
        )}

        {/* REQUESTS TAB */}
        {tab === 'requests' && (
          <div>
            {myRequests.length === 0 ? (
              <div className="text-center py-8 bg-surface rounded-2xl border border-white/5">
                <Icon name="check_circle" size={36} className="text-slate-700 mb-2 mx-auto" />
                <p className="text-slate-500 text-sm">Bekleyen katılım talebi yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map(req => {
                  const team = myTeams.find(t => t.id === req.teamId);
                  return (
                    <div key={req.id} className="bg-surface rounded-2xl border border-white/5 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-bold">{req.displayName}</p>
                          <p className="text-slate-400 text-xs">{team?.name} · {new Date(req.requestedAt).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-yellow-500/15 border border-yellow-500/20 text-yellow-400">Bekliyor</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => onApproveJoinRequest(req.id)}
                          className="flex-1 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-sm">
                          ✓ Onayla
                        </button>
                        <button onClick={() => onRejectJoinRequest(req.id)}
                          className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm">
                          ✕ Reddet
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
