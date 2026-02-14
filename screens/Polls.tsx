
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { MOCK_POLLS } from '../constants';
import { Poll, Player, TransferRequest } from '../types';

interface PollsProps {
  onBack: () => void;
  polls?: Poll[];
  setPolls?: React.Dispatch<React.SetStateAction<Poll[]>>;
  currentUser?: Player;
  transferRequests?: TransferRequest[];
  onStartTransferVote?: (transferId: string) => void;
  onFinalizeTransfer?: (transferId: string, approved: boolean) => void;
  onVote?: (pollId: string, optionId: string) => void;
}

export const Polls: React.FC<PollsProps> = ({ 
    onBack, 
    polls = MOCK_POLLS, 
    setPolls, 
    currentUser, 
    transferRequests = [], 
    onStartTransferVote,
    onFinalizeTransfer,
    onVote
}) => {
  // Permission Check: Admin OR Captain can manage polls
  const canManage = currentUser?.role === 'admin' || currentUser?.isCaptain;

  const handleVote = (pollId: string, optionId: string) => {
    // Önce parent'taki handler'ı çağır (App.tsx)
    if (onVote) {
      onVote(pollId, optionId);
      return;
    }
    
    // Fallback: setPolls varsa kullan
    if (!setPolls) return;
    setPolls(prev => prev.map(poll => {
      if (poll.id !== pollId) return poll;
      if (poll.isVoted) return poll; // Prevent double voting

      const updatedOptions = poll.options.map(opt => {
        if (opt.id === optionId) {
          return { ...opt, votes: opt.votes + 1 };
        }
        return opt;
      });

      return {
        ...poll,
        options: updatedOptions,
        totalVotes: poll.totalVotes + 1,
        isVoted: true
      };
    }));
  };

  // Get Pending Transfers for Management
  const pendingTransfers = transferRequests.filter(tr => tr.status === 'pending_captain');

  return (
    <div className="bg-secondary min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
          <Icon name="arrow_back" className="text-white" />
        </button>
        <div className="text-center">
             <h1 className="font-bold text-white text-lg">Anketler</h1>
             <p className="text-[10px] text-slate-400">Takımın Sesi</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Pending Transfer Approvals (Manager Only) */}
        {canManage && pendingTransfers.length > 0 && (
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase px-1">Bekleyen Transfer Onayları</h3>
                {pendingTransfers.map(tr => (
                    <div key={tr.id} className="bg-surface border border-yellow-500/20 rounded-2xl p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                <Icon name="person_add" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white">Transfer Önerisi</h4>
                                <p className="text-[10px] text-slate-400">Takım arkadaşların bir oyuncu önerdi.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 py-2 bg-surface border border-white/10 rounded-lg text-xs font-bold text-slate-400">Reddet</button>
                            <button 
                                onClick={() => onStartTransferVote && onStartTransferVote(tr.id)}
                                className="flex-1 py-2 bg-yellow-500 text-black rounded-lg text-xs font-bold shadow-lg"
                            >
                                Oylama Başlat
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Poll List */}
        <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase px-1 mb-3">Aktif Anketler</h3>
            <div className="space-y-4">
                {polls.map(poll => (
                <div key={poll.id} className="bg-surface rounded-2xl p-5 border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-white text-base leading-tight pr-4">{poll.question}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${poll.endDate === 'Bitti' ? 'bg-slate-700 text-slate-400' : 'bg-green-500/20 text-green-500'}`}>
                            {poll.endDate}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {poll.options.map(option => {
                            const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
                            
                            return (
                            <button 
                                key={option.id}
                                disabled={poll.isVoted}
                                onClick={() => handleVote(poll.id, option.id)}
                                className="w-full relative h-12 rounded-xl overflow-hidden bg-secondary border border-white/5 group disabled:cursor-default"
                            >
                                {/* Progress Bar Background */}
                                {poll.isVoted && (
                                    <div 
                                        className="absolute top-0 left-0 bottom-0 bg-primary/10 transition-all duration-1000 ease-out"
                                        style={{ width: `${percentage}%` }}
                                    />
                                )}
                                
                                <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
                                    <span className={`text-sm font-medium ${poll.isVoted ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                        {option.text}
                                    </span>
                                    {poll.isVoted && (
                                        <span className="text-xs font-bold text-primary font-mono">{percentage}%</span>
                                    )}
                                </div>
                            </button>
                            );
                        })}
                    </div>

                    <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500">
                        <span>Toplam {poll.totalVotes} oy</span>
                        {poll.isVoted && <span className="flex items-center gap-1 text-green-500"><Icon name="check_circle" size={12} /> Oy kullanıldı</span>}
                    </div>

                    {/* Manager Finalize Button for Transfer Polls */}
                    {canManage && poll.relatedTransferId && poll.isVoted && (
                        <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                            <button 
                                onClick={() => onFinalizeTransfer && onFinalizeTransfer(poll.relatedTransferId!, false)}
                                className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold"
                            >
                                Reddet
                            </button>
                            <button 
                                onClick={() => onFinalizeTransfer && onFinalizeTransfer(poll.relatedTransferId!, true)}
                                className="flex-1 py-2 rounded-lg bg-green-500 text-white text-xs font-bold shadow-lg"
                            >
                                Transferi Onayla
                            </button>
                        </div>
                    )}
                </div>
                ))}
            </div>
        </div>

        {polls.length === 0 && (
           <div className="text-center py-20 opacity-50">
              <Icon name="poll" size={48} className="text-slate-600 mb-2 mx-auto" />
              <p className="text-sm text-slate-400">Aktif anket bulunmuyor.</p>
           </div>
        )}
      </div>
    </div>
  );
};
