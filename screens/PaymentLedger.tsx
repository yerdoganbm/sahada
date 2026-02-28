
import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { MOCK_PLAYERS } from '../constants';
import { ScreenName, Payment, Player } from '../types';

interface PaymentLedgerProps {
  onBack: () => void;
  onNavigate?: (screen: ScreenName) => void;
  payments: Payment[];
  players?: Player[];
  currentUser: Player;
  onUpdatePayment?: (paymentId: string, newStatus: Payment['status']) => void;
  onUploadProof?: (paymentId: string, proofUrl: string) => void; // FIX #7
}

export const PaymentLedger: React.FC<PaymentLedgerProps> = ({ onBack, onNavigate, payments, players = MOCK_PLAYERS, currentUser, onUpdatePayment, onUploadProof }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // --- DATA PREPARATION ---
  const ledgerData = useMemo(() => {
      const targetPlayers = isAdmin ? players.slice(0, 14) : players.filter(p => p.id === currentUser.id);
      return targetPlayers.map(player => {
          const payment = payments.find(p => p.playerId === player.id) || {
              id: `temp_${player.id}`,
              playerId: player.id,
              amount: 150,
              status: 'pending' 
          } as Payment;
          return { player, payment };
      });
  }, [payments, isAdmin, currentUser.id, players]);

  const totalDebt = ledgerData.reduce((sum, item) => sum + item.payment.amount, 0);
  const totalPaid = ledgerData.filter(i => i.payment.status === 'paid').reduce((sum, item) => sum + item.payment.amount, 0);
  const pendingCount = ledgerData.filter(i => i.payment.status !== 'paid').length;
  const unpaidPlayers = ledgerData.filter(i => i.payment.status !== 'paid');

  const handleToggleStatus = (paymentId: string, currentStatus: Payment['status']) => {
      if (!isAdmin || !onUpdatePayment) return;
      const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
      setLoadingAction(paymentId);
      setTimeout(() => {
          onUpdatePayment(paymentId, newStatus as Payment['status']);
          setLoadingAction(null);
      }, 600);
  };

  // FIX #7: Handle Proof Upload (Player Action)
  const handleUploadProof = (paymentId: string) => {
    if (!onUploadProof) return;
    
    // Simulate file upload
    setLoadingAction(`upload_${paymentId}`);
    setTimeout(() => {
      const fakeProofUrl = `https://example.com/receipt_${Date.now()}.jpg`;
      onUploadProof(paymentId, fakeProofUrl);
      setLoadingAction(null);
    }, 1500);
  };

  const handleMemberNotify = () => {
      setLoadingAction('notify');
      setTimeout(() => {
          alert('Ödeme bildirimi yöneticiye gönderildi. Onay bekleniyor.');
          setLoadingAction(null);
      }, 1500);
  };

  const copyIban = () => {
      navigator.clipboard.writeText('TR12 3456 7890 1234 5678 90');
      alert('IBAN Kopyalandı!');
  };

  const handleBulkRemind = () => {
      const names = unpaidPlayers.map(u => u.player.name).join(', ');
      alert(`${unpaidPlayers.length} kişiye (${names}) WhatsApp üzerinden hatırlatma gönderiliyor...`);
  };

  const handleSingleRemind = (name: string) => {
      alert(`${name} kişisine özel WhatsApp mesajı gönderiliyor.`);
  };

  return (
    <div className="bg-secondary min-h-screen pb-safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
                <Icon name="arrow_back" className="text-white" />
            </button>
            <h1 className="font-bold text-white text-lg">{isAdmin ? 'Kasa Yönetimi' : 'Cüzdanım'}</h1>
        </div>
        {isAdmin && (
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 text-primary">
                <Icon name="history" />
            </button>
        )}
      </div>

      <div className="p-4 space-y-6">
          
          {/* --- ADMIN VIEW --- */}
          {isAdmin ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface rounded-2xl p-4 border border-white/5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Toplam Toplanan</span>
                        <div className="text-2xl font-mono font-bold text-primary mt-1">₺{totalPaid}</div>
                        <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="bg-primary h-full" style={{ width: `${(totalPaid/totalDebt)*100}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-surface rounded-2xl p-4 border border-white/5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Bekleyen</span>
                        <div className="text-2xl font-mono font-bold text-alert mt-1">₺{totalDebt - totalPaid}</div>
                        <span className="text-xs text-slate-500 mt-1 block">{pendingCount} Kişi ödemedi</span>
                    </div>
                </div>

                {/* WhatsApp Bulk Action */}
                {pendingCount > 0 && (
                    <button 
                        onClick={handleBulkRemind}
                        className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
                    >
                        <Icon name="whatsapp" size={20} />
                        Ödemeyenlere Hatırlat ({pendingCount})
                    </button>
                )}

                {/* Player List */}
                <div className="bg-surface rounded-3xl border border-white/5 overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5 bg-secondary/30 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase">Oyuncu Listesi</span>
                        <span className="text-xs font-bold text-slate-500">{ledgerData.length} Kişi</span>
                    </div>
                    {ledgerData.map(({ player, payment }) => (
                        <div key={player.id} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img src={player.avatar} className="w-10 h-10 rounded-full border border-slate-600" />
                                    {payment.status === 'waiting_approval' && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-secondary"></div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">{player.name}</h4>
                                    <p className="text-[10px] text-slate-400">{payment.status === 'paid' ? 'Ödeme Alındı' : payment.status === 'waiting_approval' ? 'Onay Bekliyor' : 'Ödeme Bekleniyor'}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {payment.status !== 'paid' && (
                                    <button onClick={() => handleSingleRemind(player.name)} className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                                        <Icon name="chat" size={16} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleToggleStatus(payment.id, payment.status)}
                                    disabled={loadingAction === payment.id}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        payment.status === 'paid' 
                                        ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                        : payment.status === 'waiting_approval'
                                        ? 'bg-blue-500 text-white animate-pulse'
                                        : 'bg-surface border border-white/10 text-slate-400 hover:bg-white/10'
                                    }`}
                                >
                                    {loadingAction === player.id ? (
                                        <Icon name="refresh" className="animate-spin" size={16} />
                                    ) : (
                                        payment.status === 'paid' ? 'ÖDENDİ' : payment.status === 'waiting_approval' ? 'ONAYLA' : 'EKSİK'
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
              </>
          ) : (
              /* --- MEMBER VIEW --- */
              <>
                 {/* Member View Code Remains same as previous but with Share IBAN on WA button */}
                 <div className="relative w-full aspect-[1.8] rounded-3xl overflow-hidden p-6 flex flex-col justify-between shadow-2xl">
                     <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black z-0"></div>
                     <div className="relative z-10 flex justify-between items-start">
                         <div>
                             <span className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-1 block">Güncel Borç</span>
                             <div className="text-4xl font-mono font-bold text-white tracking-tight">
                                 ₺{ledgerData[0]?.payment.status === 'paid' ? '0.00' : '150.00'}
                             </div>
                         </div>
                         <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                             <Icon name="account_balance_wallet" className="text-white" />
                         </div>
                     </div>
                     <div className="relative z-10">
                         <div className="flex gap-3 mb-3">
                             <button onClick={copyIban} className="flex-1 bg-white text-black py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                 <Icon name="content_copy" /> IBAN Kopyala
                             </button>
                             <button className="w-12 h-12 rounded-xl bg-[#25D366] flex items-center justify-center text-white active:scale-95 transition-transform">
                                 <Icon name="share" />
                             </button>
                         </div>
                         
                         {/* FIX #7: Upload Proof Button */}
                         {ledgerData[0]?.payment.status !== 'paid' && onUploadProof && (
                             <button 
                                 onClick={() => handleUploadProof(ledgerData[0].payment.id)}
                                 disabled={loadingAction === `upload_${ledgerData[0].payment.id}`}
                                 className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-500 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                             >
                                 {loadingAction === `upload_${ledgerData[0].payment.id}` ? (
                                     <Icon name="refresh" className="animate-spin" size={18} />
                                 ) : (
                                     <>
                                         <Icon name="upload_file" size={18} />
                                         Dekont Yükle
                                     </>
                                 )}
                             </button>
                         )}
                     </div>
                 </div>
              </>
          )}

      </div>
    </div>
  );
};
