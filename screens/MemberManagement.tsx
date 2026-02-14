
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Player, JoinRequest } from '../types';

interface MemberManagementProps {
  onBack: () => void;
  currentUser: Player;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  joinRequests?: JoinRequest[];
  onApproveRequest?: (req: JoinRequest) => void;
  onRejectRequest?: (reqId: string) => void;
  onChangeRole?: (playerId: string, newRole: 'admin' | 'member') => void;
  onProposePlayer?: (playerData: Partial<Player>, referrerId: string) => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({ 
    onBack, 
    currentUser, 
    players, 
    setPlayers, 
    joinRequests = [],
    onApproveRequest,
    onRejectRequest,
    onChangeRole,
    onProposePlayer
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'requests' | 'rules'>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Player | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState<'GK'|'DEF'|'MID'|'FWD'>('MID');
  
  // Propose Player Form State
  const [proposeForm, setProposeForm] = useState({
    name: '',
    position: 'MID' as 'GK'|'DEF'|'MID'|'FWD',
    contactNumber: '',
    rating: 6.0
  });

  const isAdmin = currentUser.role === 'admin';

  const handleCopyLink = () => {
    navigator.clipboard.writeText('SAHADA-2024-KOD'); // Mock code
    alert('Davet kodu kopyalandı! Arkadaşlarına "SAHADA-2024-KOD" kodunu iletebilirsin.');
    setShowInviteModal(false);
  };

  const handleAddManualPlayer = () => {
      if (!newPlayerName) return;
      const newPlayer: Player = {
          id: `manual_${Date.now()}`,
          name: newPlayerName,
          position: newPlayerPos,
          rating: 6.0,
          reliability: 100,
          role: 'member',
          tier: 'free',
          avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName('');
      setShowAddPlayerModal(false);
      alert('Oyuncu başarıyla eklendi.');
  };

  const handleRoleChange = (memberId: string, newRole: 'admin' | 'member') => {
    if (!isAdmin) return;
    
    // Önce local state'i güncelle
    setPlayers(prev => prev.map(p => p.id === memberId ? { ...p, role: newRole } : p));
    
    // Sonra parent'a bildir (App.tsx'teki currentUser'ı da güncellemek için)
    if (onChangeRole) {
      onChangeRole(memberId, newRole);
    }
    
    alert('Kullanıcı yetkisi güncellendi.');
    setSelectedMember(null);
  };

  const handleProposePlayer = () => {
    if (!proposeForm.name || !proposeForm.contactNumber) {
      alert('Lütfen isim ve telefon numarasını giriniz.');
      return;
    }
    
    if (onProposePlayer) {
      onProposePlayer({
        name: proposeForm.name,
        position: proposeForm.position,
        contactNumber: proposeForm.contactNumber,
        rating: proposeForm.rating
      }, currentUser.id);
    }
    
    // Reset form
    setProposeForm({
      name: '',
      position: 'MID',
      contactNumber: '',
      rating: 6.0
    });
    setShowProposeModal(false);
  };

  // Helper to render role badge
  const renderRoleBadge = (player: Player) => {
      if (player.role === 'admin') {
          return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30"><Icon name="admin_panel_settings" size={12} /> Yönetici</span>;
      }
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-400">Oyuncu</span>;
  };

  return (
    <div className="pb-24 bg-secondary min-h-screen relative">
      <div className="sticky top-0 z-40 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
          <Icon name="arrow_back" className="text-white" />
        </button>
        <span className="font-bold text-white text-lg">Grup Üyeleri</span>
        
        {isAdmin ? (
            <div className="flex gap-2">
                <button 
                  onClick={() => onNavigate('scoutDashboard')}
                  className="bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-3 h-9 flex items-center gap-1 rounded-lg active:scale-95 transition-transform"
                >
                  <Icon name="person_search" size={16} />
                  Scout
                </button>
                <button onClick={() => setShowAddPlayerModal(true)} className="bg-surface border border-white/10 text-white text-xs font-bold w-9 h-9 flex items-center justify-center rounded-lg active:scale-95 transition-transform">
                   <Icon name="person_add_alt" size={18} />
                </button>
                <button onClick={() => setShowInviteModal(true)} className="bg-primary text-secondary text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                   Davet Et
                </button>
            </div>
        ) : <div className="w-10"></div>}
      </div>

      <div className="p-4">
        {/* Tabs */}
        <div className="flex p-1 bg-surface rounded-xl mb-6 border border-white/5">
          <button onClick={() => setActiveTab('members')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'members' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}>Üye Listesi ({players.length})</button>
          <button onClick={() => setActiveTab('requests')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all relative ${activeTab === 'requests' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}>
              İstekler 
              {joinRequests.length > 0 && <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500"></span>}
          </button>
        </div>

        {/* Oyuncu Öner Button - Tüm kullanıcılar görebilir */}
        <button 
          onClick={() => setShowProposeModal(true)}
          className="w-full mb-4 bg-primary/10 border border-primary/30 text-primary py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Icon name="person_search" size={18} />
          Tanıdığın Birini Öner
        </button>

        {activeTab === 'members' && (
          <>
            <div className="space-y-1">
              {players.map(player => (
                  <div key={player.id} onClick={() => setSelectedMember(player)} className="grid grid-cols-12 gap-2 items-center bg-surface p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer active:bg-white/5">
                    <div className="col-span-8 flex items-center gap-3">
                        <img src={player.avatar} className="w-8 h-8 rounded-full bg-slate-800 object-cover" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{player.name} {player.id === currentUser.id && '(Sen)'}</span>
                          <span className="text-[10px] text-slate-400">{player.position}</span>
                        </div>
                    </div>
                    <div className="col-span-4 flex justify-end gap-2">
                        {renderRoleBadge(player)}
                    </div>
                  </div>
              ))}
            </div>
            {players.length === 1 && (
                <div className="mt-8 text-center px-6 py-8 border-2 border-dashed border-white/10 rounded-2xl">
                    <Icon name="group_add" size={40} className="text-slate-600 mb-2 mx-auto" />
                    <h3 className="text-white font-bold">Takımın Henüz Boş</h3>
                    <p className="text-slate-400 text-xs mb-4">Manuel olarak oyuncu ekle veya davet kodu paylaş.</p>
                </div>
            )}
          </>
        )}

        {activeTab === 'requests' && (
            <div className="space-y-3">
                {joinRequests.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <p className="text-sm text-slate-400">Bekleyen katılım isteği yok.</p>
                    </div>
                ) : (
                    joinRequests.map(req => (
                        <div key={req.id} className="bg-surface p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <img src={req.avatar} className="w-10 h-10 rounded-full" />
                                <div>
                                    <h3 className="font-bold text-white text-sm">{req.name}</h3>
                                    <p className="text-[10px] text-slate-400">{req.position} • {req.phone}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => onRejectRequest && onRejectRequest(req.id)}
                                    className="flex-1 py-2 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold"
                                >
                                    Reddet
                                </button>
                                <button 
                                    onClick={() => onApproveRequest && onApproveRequest(req)}
                                    className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-bold"
                                >
                                    Onayla
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-surface w-full max-w-xs rounded-2xl border border-white/10 p-5 shadow-2xl">
               <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-white">Davet Kodu</h3>
                  <div className="bg-slate-800 p-3 rounded-xl my-4 border border-white/10">
                      <span className="text-2xl font-black text-primary tracking-widest">SAHADA-2024</span>
                  </div>
                  <p className="text-xs text-slate-400">Bu kodu arkadaşınla paylaş, "Takıma Katıl" ekranından giriş yapsın.</p>
               </div>
               <button onClick={handleCopyLink} className="w-full py-3 rounded-xl text-xs font-bold bg-primary text-secondary">Kodu Kopyala</button>
               <button onClick={() => setShowInviteModal(false)} className="w-full mt-2 py-3 text-xs text-slate-500">Kapat</button>
            </div>
         </div>
      )}
      
      {/* Manual Add Player Modal */}
      {showAddPlayerModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-surface w-full max-w-xs rounded-2xl border border-white/10 p-5 shadow-2xl animate-slide-up">
               <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">Manuel Oyuncu Ekle</h3>
                  <p className="text-xs text-slate-400">Uygulamayı kullanmayan birini ekle.</p>
               </div>
               
               <div className="space-y-3 mb-6">
                   <div>
                       <label className="text-[10px] text-slate-500 font-bold uppercase">Ad Soyad</label>
                       <input 
                          type="text" 
                          value={newPlayerName}
                          onChange={e => setNewPlayerName(e.target.value)}
                          className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                          placeholder="Örn: Mehmet"
                       />
                   </div>
                   <div>
                       <label className="text-[10px] text-slate-500 font-bold uppercase">Mevki</label>
                       <div className="flex gap-2 mt-1">
                           {['GK', 'DEF', 'MID', 'FWD'].map(pos => (
                               <button 
                                key={pos} 
                                onClick={() => setNewPlayerPos(pos as any)}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${newPlayerPos === pos ? 'bg-primary text-secondary border-primary' : 'bg-surface border-white/10 text-slate-400'}`}
                               >
                                   {pos}
                               </button>
                           ))}
                       </div>
                   </div>
               </div>

               <div className="flex gap-3">
                  <button onClick={() => setShowAddPlayerModal(false)} className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-400 bg-surface border border-white/10">İptal</button>
                  <button onClick={handleAddManualPlayer} className="flex-1 py-3 rounded-xl text-xs font-bold bg-primary text-secondary">Ekle</button>
               </div>
            </div>
         </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-slide-up">
               <div className="relative h-24 bg-gradient-to-r from-slate-800 to-slate-900">
                  <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/40"><Icon name="close" size={18} /></button>
                  <div className="absolute -bottom-8 left-6">
                     <img src={selectedMember.avatar} className="w-20 h-20 rounded-full border-4 border-surface" />
                  </div>
               </div>
               
               <div className="pt-10 px-6 pb-6">
                  <div className="mb-6">
                     <h3 className="text-xl font-bold text-white flex items-center gap-2">{selectedMember.name} {selectedMember.role === 'admin' && <Icon name="verified_user" className="text-purple-500" size={20} />}</h3>
                     <span className="text-xs text-slate-400 flex items-center gap-1">{selectedMember.role === 'admin' ? 'Yönetici' : 'Oyuncu'} • {selectedMember.position}</span>
                  </div>

                  {isAdmin && currentUser.id !== selectedMember.id ? (
                      <div className="space-y-2">
                         {selectedMember.role === 'member' ? (
                            <button onClick={() => handleRoleChange(selectedMember.id, 'admin')} className="w-full bg-secondary hover:bg-white/5 border border-white/5 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2">
                                <Icon name="admin_panel_settings" className="text-purple-500" /> Yönetici Yap
                            </button>
                         ) : (
                            <button onClick={() => handleRoleChange(selectedMember.id, 'member')} className="w-full bg-secondary hover:bg-white/5 border border-white/5 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2">
                                <Icon name="person" className="text-slate-400" /> Yönetici Yetkisini Al
                            </button>
                         )}
                      </div>
                  ) : <div className="bg-primary/10 p-4 rounded-xl text-center"><p className="text-xs text-slate-300">Profiliniz.</p></div>}
               </div>
            </div>
         </div>
      )}

      {/* Propose Player Modal - YENI */}
      {showProposeModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-surface w-full max-w-xs rounded-2xl border border-white/10 p-5 shadow-2xl animate-slide-up">
               <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">Oyuncu Öner</h3>
                  <p className="text-xs text-slate-400">Tanıdığın birini takıma öner.</p>
               </div>
               
               <div className="space-y-3 mb-6">
                   <div>
                       <label className="text-[10px] text-slate-500 font-bold uppercase">Ad Soyad</label>
                       <input 
                          type="text" 
                          value={proposeForm.name}
                          onChange={e => setProposeForm({...proposeForm, name: e.target.value})}
                          className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                          placeholder="Örn: Ahmet Yılmaz"
                       />
                   </div>
                   <div>
                       <label className="text-[10px] text-slate-500 font-bold uppercase">Telefon</label>
                       <input 
                          type="tel" 
                          value={proposeForm.contactNumber}
                          onChange={e => setProposeForm({...proposeForm, contactNumber: e.target.value})}
                          className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                          placeholder="0532 XXX XX XX"
                       />
                   </div>
                   <div>
                       <label className="text-[10px] text-slate-500 font-bold uppercase">Mevki</label>
                       <div className="flex gap-2 mt-1">
                           {['GK', 'DEF', 'MID', 'FWD'].map(pos => (
                               <button 
                                key={pos} 
                                onClick={() => setProposeForm({...proposeForm, position: pos as any})}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${proposeForm.position === pos ? 'bg-primary text-secondary border-primary' : 'bg-surface border-white/10 text-slate-400'}`}
                               >
                                   {pos}
                               </button>
                           ))}
                       </div>
                   </div>
               </div>

               <div className="flex gap-3">
                  <button onClick={() => setShowProposeModal(false)} className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-400 bg-surface border border-white/10">İptal</button>
                  <button onClick={handleProposePlayer} className="flex-1 py-3 rounded-xl text-xs font-bold bg-primary text-secondary">Öner</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
