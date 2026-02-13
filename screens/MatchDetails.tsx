
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from '../components/Icon';
import { MOCK_MATCHES, MOCK_PLAYERS } from '../constants';
import { Player, RsvpStatus, ChatMessage, Match } from '../types';
import { PitchView } from '../components/PitchView';

interface MatchDetailsProps {
  matchId: string;
  onBack: () => void;
  currentUser: Player;
  rsvpStatus: RsvpStatus;
  onRsvpChange: (status: RsvpStatus) => void;
  allPlayers?: Player[];
  allMatches?: Match[];
}

type ViewMode = 'overview' | 'roster' | 'chat';

export const MatchDetails: React.FC<MatchDetailsProps> = ({ 
  matchId, 
  onBack, 
  currentUser, 
  rsvpStatus, 
  onRsvpChange,
  allPlayers = MOCK_PLAYERS,
  allMatches = MOCK_MATCHES
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [showMVPModal, setShowMVPModal] = useState(false);
  const [mvpVote, setMvpVote] = useState<string | null>(null);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: '1', senderId: '3', senderName: 'Caner', avatar: 'https://i.pravatar.cc/150?u=3', text: 'Beyler bu maç kaçmaz, kadroyu kuralım hemen.', timestamp: '14:30', isMe: false },
      { id: '2', senderId: '1', senderName: 'Ahmet', avatar: 'https://i.pravatar.cc/150?u=1', text: 'Ben kaleye geçerim gerekirse.', timestamp: '14:32', isMe: false },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const match = allMatches.find(m => m.id === matchId) || allMatches[0];
  const isCompleted = match.status === 'completed';

  useEffect(() => {
      if (viewMode === 'chat') {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [messages, viewMode]);

  const handleSendMessage = () => {
      if (!newMessage.trim()) return;
      const msg: ChatMessage = {
          id: Date.now().toString(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          avatar: currentUser.avatar,
          text: newMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: true
      };
      setMessages([...messages, msg]);
      setNewMessage('');
  };

  // Dynamic Roster Logic
  const { squad, waitlist } = useMemo(() => {
    const otherPlayers = allPlayers.filter(p => p.id !== currentUser.id);
    let allPlayersList = [...otherPlayers];
    if (rsvpStatus === 'yes') {
        allPlayersList = [currentUser, ...otherPlayers];
    }
    return {
        squad: allPlayersList.slice(0, 14),
        waitlist: allPlayersList.slice(14)
    };
  }, [rsvpStatus, currentUser, allPlayers]);

  const teamA = squad.filter((_, i) => i % 2 === 0);
  const teamB = squad.filter((_, i) => i % 2 !== 0);

  // --- Sub-Component: Chat View ---
  const ChatView = () => (
      <div className="flex flex-col h-[calc(100vh-180px)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                      {!msg.isMe && (
                          <img src={msg.avatar} className="w-8 h-8 rounded-full mr-2 self-end mb-1" />
                      )}
                      <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${msg.isMe ? 'bg-primary text-secondary rounded-br-none' : 'bg-surface text-white rounded-bl-none border border-white/5'}`}>
                          {!msg.isMe && <p className="text-[10px] text-primary font-bold mb-0.5">{msg.senderName}</p>}
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-[9px] text-right mt-1 ${msg.isMe ? 'text-secondary/60' : 'text-slate-400'}`}>{msg.timestamp}</p>
                      </div>
                  </div>
              ))}
              <div ref={chatEndRef} />
          </div>
          <div className="p-3 bg-secondary border-t border-white/5 flex gap-2">
              <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Mesaj yaz..." 
                  className="flex-1 bg-surface border border-white/10 rounded-full px-4 py-3 text-sm text-white focus:outline-none focus:border-primary"
              />
              <button 
                  onClick={handleSendMessage}
                  className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-secondary shadow-glow active:scale-95 transition-transform"
              >
                  <Icon name="send" size={20} />
              </button>
          </div>
      </div>
  );

  // --- Sub-Component: Roster View ---
  const RosterView = () => {
    const [activeTab, setActiveTab] = useState<'lineup' | 'pitch'>('lineup');

    return (
      <div className="animate-fade-in">
        <div className="flex p-1 bg-surface rounded-xl mb-6 border border-white/5">
          <button onClick={() => setActiveTab('lineup')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'lineup' ? 'bg-primary text-secondary shadow-lg shadow-primary/25' : 'text-slate-400 hover:text-white'}`}>Kadro</button>
          <button onClick={() => setActiveTab('pitch')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'pitch' ? 'bg-primary text-secondary shadow-lg shadow-primary/25' : 'text-slate-400 hover:text-white'}`}>Saha</button>
        </div>

        {activeTab === 'pitch' ? (
           <PitchView teamA={teamA} teamB={teamB} />
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">As Kadro</h3>
                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Güvenilirlik: %92</span>
              </div>
              {squad.map((player, index) => (
                <PlayerRow key={player.id} player={player} index={index + 1} isMe={player.id === currentUser.id} />
              ))}
            </div>
            {waitlist.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-dashed border-slate-800">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-sm font-bold text-alert uppercase tracking-wider">Yedek Listesi</h3>
                </div>
                {waitlist.map((player, index) => (
                  <PlayerRow key={player.id} player={player} index={index + 1} isWaitlist isMe={player.id === currentUser.id} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-8 bg-secondary min-h-screen">
      {/* Custom Header */}
      <div className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
        <button onClick={() => viewMode !== 'overview' ? setViewMode('overview') : onBack()} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
          <Icon name="arrow_back" className="text-white" />
        </button>
        <span className="font-bold text-white text-lg">
          {viewMode === 'overview' ? 'Maç Detayı' : viewMode === 'roster' ? 'Kadro' : 'Sohbet'}
        </span>
        <button 
            onClick={() => setViewMode(viewMode === 'chat' ? 'overview' : 'chat')}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${viewMode === 'chat' ? 'bg-primary text-secondary border-primary' : 'bg-surface border-white/5 text-white'}`}
        >
          <Icon name="chat" />
        </button>
      </div>

      <div className="p-4">
        {viewMode === 'overview' ? (
          <div className="animate-fade-in space-y-6">
            
            {/* Completed Match State */}
            {isCompleted && (
                <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-900/20 border border-yellow-500/30 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                        <h3 className="text-yellow-500 font-bold text-sm">Maç Tamamlandı</h3>
                        <p className="text-slate-400 text-xs">Skor: 5 - 3</p>
                    </div>
                    <button 
                        onClick={() => setShowMVPModal(true)}
                        className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-yellow-500/20 animate-pulse"
                    >
                        MVP Oyla 👑
                    </button>
                </div>
            )}

            {/* Match Info Card */}
            <div className="bg-surface rounded-2xl border border-white/5 p-4 space-y-4 shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               
               <div className="flex items-start gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                     <Icon name="calendar_month" />
                  </div>
                  <div>
                     <h3 className="text-white font-bold">{match.date}, Salı</h3>
                     <p className="text-slate-400 text-sm">{match.time}</p>
                  </div>
               </div>
               
               <div className="flex items-start gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                     <Icon name="stadium" />
                  </div>
                  <div>
                     <h3 className="text-white font-bold">{match.location}</h3>
                     <p className="text-slate-400 text-sm">Kadıköy, İstanbul</p>
                  </div>
               </div>
            </div>

            {/* RSVP Buttons (Only if Upcoming) */}
            {!isCompleted && (
                <div className="space-y-3">
                <button 
                    onClick={() => onRsvpChange('yes')}
                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                        rsvpStatus === 'yes' 
                        ? 'bg-primary text-secondary shadow-glow' 
                        : 'bg-surface border border-white/5 text-white hover:bg-slate-800'
                    }`}
                >
                    <Icon name="check_circle" filled={rsvpStatus === 'yes'} />
                    Katılıyorum
                </button>
                
                <div className="flex gap-3">
                    <button onClick={() => onRsvpChange('maybe')} className={`flex-1 py-3 rounded-2xl font-medium text-sm transition-all ${rsvpStatus === 'maybe' ? 'bg-white text-secondary' : 'bg-surface border border-white/5 text-slate-400'}`}>Belki</button>
                    <button onClick={() => onRsvpChange('no')} className={`flex-1 py-3 rounded-2xl font-medium text-sm transition-all ${rsvpStatus === 'no' ? 'bg-red-500 text-white' : 'bg-surface border border-white/5 text-slate-400'}`}>Katılmıyorum</button>
                </div>
                </div>
            )}

            {/* Roster Status */}
            <div className="bg-surface rounded-2xl p-4 border border-white/5">
               <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-white text-sm">Kadro Durumu</h3>
                  <span className={`text-xs font-mono font-bold ${squad.length >= 14 ? 'text-primary' : 'text-slate-400'}`}>
                     {squad.length}/14
                  </span>
               </div>
               <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((squad.length / 14) * 100, 100)}%` }} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setViewMode('roster')}>
                     <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                        <Icon name="groups" size={16} className="text-white" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs text-white font-bold">Kadroyu Gör</span>
                        <span className="text-[10px] text-slate-500">Detaylar</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                     <div className="w-8 h-8 rounded-full bg-alert/10 flex items-center justify-center">
                        <Icon name="warning" size={14} className="text-alert" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs text-slate-400">Ödemeler</span>
                        <span className="text-[10px] text-alert font-bold">5 Eksik</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : viewMode === 'chat' ? (
            <ChatView />
        ) : (
          <RosterView />
        )}
      </div>

      {/* MVP Voting Modal */}
      {showMVPModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
              <div className="bg-surface w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-slide-up h-[80vh] flex flex-col">
                  <div className="p-6 bg-gradient-to-b from-yellow-900/40 to-surface border-b border-white/5 text-center">
                      <h2 className="text-2xl font-bold text-white mb-1">Maçın Adamı</h2>
                      <p className="text-sm text-yellow-500">Bu maçın yıldızı sence kimdi?</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3">
                      {squad.map(p => (
                          <button 
                            key={p.id}
                            onClick={() => setMvpVote(p.id)}
                            className={`flex flex-col items-center p-3 rounded-xl border transition-all ${mvpVote === p.id ? 'bg-yellow-500/20 border-yellow-500 transform scale-105' : 'bg-secondary border-white/5 hover:bg-white/5'}`}
                          >
                              <img src={p.avatar} className="w-12 h-12 rounded-full mb-2 object-cover" />
                              <span className="text-xs text-white font-bold text-center leading-tight">{p.name}</span>
                          </button>
                      ))}
                  </div>

                  <div className="p-4 bg-surface border-t border-white/10 pb-safe-bottom">
                      <button 
                        disabled={!mvpVote}
                        onClick={() => { alert('Oyunuz kaydedildi!'); setShowMVPModal(false); }}
                        className="w-full bg-yellow-500 text-black py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
                      >
                          Oy Ver
                      </button>
                      <button onClick={() => setShowMVPModal(false)} className="w-full mt-2 py-3 text-slate-400 text-xs font-bold">Vazgeç</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// ... Sub-components (PlayerRow etc) remain the same ...
const PlayerRow: React.FC<any> = ({ player, index, isWaitlist = false, isMe = false }) => (
  <div className={`flex items-center p-3 rounded-2xl border transition-all mb-2 ${isMe ? 'bg-primary/10 border-primary/40' : isWaitlist ? 'bg-surface/30 border-alert/20 opacity-70' : 'glass border-white/5 hover:border-primary/30'}`}>
    <span className={`w-6 text-center text-sm font-mono ${isWaitlist ? 'text-alert' : isMe ? 'text-primary font-bold' : 'text-slate-500'}`}>{index}</span>
    <div className="relative mx-3">
      <img src={player.avatar} alt={player.name} className={`w-10 h-10 rounded-full object-cover border-2 ${isWaitlist ? 'border-alert/50' : 'border-slate-600'}`} />
      {player.position === 'GK' && <span className="absolute -bottom-1 -right-1 bg-yellow-600 text-[9px] font-bold px-1.5 rounded-full border border-secondary text-white">GK</span>}
    </div>
    <div className="flex-1">
      <h4 className={`font-medium text-sm ${isMe ? 'text-primary' : isWaitlist ? 'text-slate-300' : 'text-white'}`}>{player.name} {isMe && '(Sen)'}</h4>
      <div className="flex items-center gap-2 mt-0.5">
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${player.reliability > 90 ? 'bg-primary' : player.reliability > 70 ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <span className="text-[10px] text-slate-500 font-mono">R:{player.reliability}%</span>
        </div>
        <span className="text-[10px] text-slate-600">•</span>
        <span className="text-[10px] text-slate-400">{player.position}</span>
      </div>
    </div>
    <div className="flex flex-col items-end">
      <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${isWaitlist ? 'bg-alert/20 text-alert' : 'bg-surface text-slate-400'}`}>{player.rating}</div>
    </div>
  </div>
);
