
import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/Toast';
import { BottomNav } from './components/BottomNav';
import { MobileHeader } from './components/MobileHeader';
import { InstallBanner } from './components/InstallBanner';
import { useViewportHeight } from './hooks/useMobileFeatures';
import { ScreenName, Venue, Player, Payment, Transaction, SubscriptionTier, RsvpStatus, Match, TransferRequest, Poll, TeamProfile, JoinRequest, Reservation, AppNotification } from './types';
import { Dashboard } from './screens/Dashboard';
import { TeamList } from './screens/TeamList';
import { MatchDetails } from './screens/MatchDetails';
import { MatchCard } from './components/MatchCard'; 
import { Header } from './components/Header';
import { Icon } from './components/Icon';
import { MOCK_MATCHES, MOCK_VENUES, MOCK_PLAYERS, MOCK_PAYMENTS, MOCK_TRANSACTIONS, MOCK_POLLS, MOCK_RESERVATIONS, MOCK_TALENT_POOL, MOCK_NOTIFICATIONS } from './constants';
import { PaymentLedger } from './screens/PaymentLedger';
import { AdminDashboard } from './screens/AdminDashboard';
import { MemberManagement } from './screens/MemberManagement';
import { ProfileScreen } from './screens/ProfileScreen';
import { VenueList } from './screens/VenueList';
import { VenueDetails } from './screens/VenueDetails';
import { LineupManager } from './screens/LineupManager';
import { SquadShareWizard } from './screens/SquadShareWizard';
import { Settings } from './screens/Settings';
import { LoginScreen } from './screens/LoginScreen';
import { JoinTeamScreen } from './screens/JoinTeamScreen'; 
import { VenueAdd } from './screens/VenueAdd';
import { CreateProfile } from './screens/CreateProfile';
import { Leaderboard } from './screens/Leaderboard';
import { FinancialReports } from './screens/FinancialReports';
import { DebtList } from './screens/DebtList';
import { MatchCreate } from './screens/MatchCreate';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import { Polls } from './screens/Polls';
import { BookingScreen } from './screens/BookingScreen';
import { TournamentScreen } from './screens/TournamentScreen';
import { WhatsAppIntegration } from './screens/WhatsAppIntegration';
import { AttendanceScreen } from './screens/AttendanceScreen';
import { ReserveSystem } from './screens/ReserveSystem';
import { MessageLogs } from './screens/MessageLogs';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { TeamSetup } from './screens/TeamSetup';
import { EditProfileScreen } from './screens/EditProfileScreen';
// VENUE OWNER SCREENS
import { VenueOwnerDashboard } from './screens/VenueOwnerDashboard';
import { ReservationManagement } from './screens/ReservationManagement';
import { ReservationDetails } from './screens/ReservationDetails';
import { VenueCalendar } from './screens/VenueCalendar';
import { VenueFinancialReports } from './screens/VenueFinancialReports';
import { CustomerManagement } from './screens/CustomerManagement';
// SCOUT SYSTEM SCREENS
import { ScoutDashboard } from './screens/ScoutDashboard';
import { TalentPool } from './screens/TalentPool';
import { ScoutReports } from './screens/ScoutReports';
// 🧠 NEURO-CORE INTEGRATION
import { useSynapseTracking, useActionTracker } from './hooks/useNeuroCore';

function App() {
  // ===========================================
  // STATE MANAGEMENT - TEK DOĞRULUK KAYNAĞI
  // ===========================================
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('welcome');
  const [screenHistory, setScreenHistory] = useState<ScreenName[]>([]);
  
  // 📱 Mobile: Setup viewport height for mobile browsers
  useViewportHeight();
  
  // Browser back button desteği
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      if (screenHistory.length > 0) {
        const previousScreen = screenHistory[screenHistory.length - 1];
        setScreenHistory(prev => prev.slice(0, -1));
        setCurrentScreen(previousScreen);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [screenHistory]);

  // Mock Data States - TÜM VERİLER BURADA
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [venues, setVenues] = useState<Venue[]>(MOCK_VENUES);
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);
  const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [polls, setPolls] = useState<Poll[]>(MOCK_POLLS);
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS); // VENUE OWNER
  const [talentPool, setTalentPool] = useState<any[]>(MOCK_TALENT_POOL); // SCOUT SYSTEM
  
  // Additional States
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('pending');
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([
    // Mock join requests
    {
      id: 'jr1',
      name: 'Ali Veli',
      position: 'MID',
      phone: '0532 111 22 33',
      avatar: 'https://i.pravatar.cc/150?u=jr1',
      timestamp: '2 saat önce',
      status: 'pending'
    },
    {
      id: 'jr2',
      name: 'Veli Yıldız',
      position: 'FWD',
      phone: '0532 444 55 66',
      avatar: 'https://i.pravatar.cc/150?u=jr2',
      timestamp: '5 saat önce',
      status: 'pending'
    }
  ]);
  const [teamProfile, setTeamProfile] = useState<TeamProfile | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [matchDetailsId, setMatchDetailsId] = useState<string | null>(null);
  const [venueDetailsId, setVenueDetailsId] = useState<string | null>(null);
  const [reservationDetailsId, setReservationDetailsId] = useState<string | null>(null);

  // 🧠 NEURO-CORE: AUTOMATIC SYNAPSE TRACKING
  // Her ekran değişikliğinde kullanıcı davranışı otomatik kaydedilir
  useSynapseTracking(currentUser?.id, currentScreen);
  
  // 🧠 NEURO-CORE: ACTION TRACKER
  // Önemli olayları manuel kaydetmek için
  const trackAction = useActionTracker(currentUser?.id, currentScreen);

  // ===========================================
  // LOGIN HANDLER - RBAC LOGIC
  // ===========================================
  const handleLogin = (userId: string, isNewTeam?: boolean) => {
    // Check if user exists in MOCK_PLAYERS
    const user = MOCK_PLAYERS.find(p => p.id === userId);
    
    if (user) {
      // User found - Log in with their role; auth stack temizlensin, gereksiz geri dönüş olmasın
      setCurrentUser(user);
      setScreenHistory([]);
      // Giriş yapan kullanıcının takımını gösterebilmek için varsayılan takım (henüz takım kurulmadıysa)
      setTeamProfile(prev => prev ?? {
        id: 'default',
        name: 'Sahada FC',
        shortName: 'Sahada',
        colors: ['#10B981', '#0B0F1A'],
        foundedYear: '2024',
        logo: '',
        inviteCode: 'SAHADA-2024'
      });
      
      // Sabit Test Senaryoları:
      if (userId === '1') {
        // Admin (Ahmet Yılmaz)
        console.log('✅ Yönetici olarak giriş yapıldı:', user.name);
        setCurrentScreen('dashboard');
      } else if (userId === '7') {
        // Kaptan (Burak Yılmaz)
        console.log('✅ Kaptan olarak giriş yapıldı:', user.name);
        setCurrentScreen('dashboard');
      } else if (userId === '2') {
        // Üye (Mehmet Demir)
        console.log('✅ Üye olarak giriş yapıldı:', user.name);
        setCurrentScreen('dashboard');
      } else if (user.role === 'venue_owner') {
        // Saha Sahibi
        console.log('🏟️ Saha sahibi olarak giriş yapıldı:', user.name);
        setCurrentScreen('venueOwnerDashboard');
      } else {
        // Diğer mevcut kullanıcılar
        console.log('✅ Giriş yapıldı:', user.name);
        setCurrentScreen('dashboard');
      }
    } else if (isNewTeam) {
      // Yeni takım kuruluyor - admin olarak giriş
      const newAdmin: Player = {
        id: userId, // Unique ID with timestamp
        name: 'Yeni Yönetici',
        position: 'MID',
        rating: 7.0,
        reliability: 100,
        avatar: 'https://i.pravatar.cc/150?u=' + userId,
        role: 'admin',
        isCaptain: true,
        tier: 'free',
        phone: userId.replace('new_admin_', '') // Telefon numarasını kaydet
      };
      setCurrentUser(newAdmin);
      console.log('✅ Yeni takım kurucusu oluşturuldu:', newAdmin);
      setScreenHistory(prev => [...prev, 'login']);
      setCurrentScreen('teamSetup');
    } else {
      // Bilinmeyen kullanıcı - profil oluşturma ekranına yönlendir (geri = login)
      console.log('❌ Kullanıcı bulunamadı, profil oluşturma ekranına yönlendiriliyor...');
      setScreenHistory(prev => [...prev, 'login']);
      setCurrentScreen('createProfile');
    }
  };

  // ===========================================
  // NAVIGATION HANDLER
  // ===========================================
  const navigateTo = (screen: ScreenName, params?: any) => {
    // Role-Based Access Control (RBAC)
    const protectedAdminScreens: ScreenName[] = ['admin', 'matchCreate', 'financialReports'];
    const protectedMemberScreens: ScreenName[] = ['dashboard'];
    
    // Yönetici ekranlarına erişim kontrolü
    if (protectedAdminScreens.includes(screen)) {
      if (!currentUser) {
        console.warn('⚠️ Giriş yapmanız gerekiyor!');
        alert('Bu özelliğe erişmek için giriş yapmanız gerekiyor.');
        setCurrentScreen('login');
        return;
      }
      
      if (currentUser.role !== 'admin' && currentUser.tier !== 'partner') {
        console.warn('⚠️ Yetkiniz yok! Sadece yöneticiler erişebilir.');
        alert('Bu özelliğe sadece yöneticiler erişebilir.');
        setCurrentScreen('dashboard');
        return;
      }
    }
    
    // Üye ekranlarına erişim kontrolü (giriş yapmış kullanıcılar)
    if (protectedMemberScreens.includes(screen) && !currentUser) {
      console.warn('⚠️ Giriş yapmanız gerekiyor!');
      setCurrentScreen('login');
      return;
    }
    
    // Parametre bazlı navigasyonlar
    if (params?.matchId) {
      setMatchDetailsId(params.matchId);
    }
    if (params?.venueId) {
      setVenueDetailsId(params.venueId);
    }
    
    // Geçmişe ekle (geri dön için)
    setScreenHistory(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
  };

  // ===========================================
  // GO BACK HANDLER
  // ===========================================
  const goBack = () => {
    // Clear detail IDs when leaving detail screens to avoid stale state
    if (currentScreen === 'matchDetails') setMatchDetailsId(null);
    if (currentScreen === 'venueDetails') setVenueDetailsId(null);
    if (currentScreen === 'reservationDetails') setReservationDetailsId(null);

    if (screenHistory.length > 0) {
      const previousScreen = screenHistory[screenHistory.length - 1];
      setScreenHistory(prev => prev.slice(0, -1));
      setCurrentScreen(previousScreen);
    } else {
      // Varsayılan geri dönüş
      if (currentUser) {
        setCurrentScreen('dashboard');
      } else {
        setCurrentScreen('welcome');
      }
    }
  };

  // ===========================================
  // DATA MUTATION HANDLERS - İNTERAKTİF İŞLEMLER
  // ===========================================

  // 1. PROFİL GÜNCELLEME
  const handleUpdateProfile = (updatedUser: Player) => {
    console.log('📝 Profil güncelleniyor:', updatedUser);
    
    // currentUser'ı güncelle
    setCurrentUser(updatedUser);
    
    // players listesindeki kullanıcıyı güncelle
    setPlayers(prev => prev.map(p => 
      p.id === updatedUser.id ? updatedUser : p
    ));
    
    console.log('✅ Profil başarıyla güncellendi!');
  };

  // 2. MAÇ OLUŞTURMA
  const handleCreateMatch = (newMatch: Match) => {
    console.log('⚽ Yeni maç oluşturuluyor:', newMatch);
    
    // Matches listesine ekle
    setMatches(prev => [...prev, newMatch]);
    
    console.log('✅ Maç başarıyla oluşturuldu!');
    
    // 🧠 NEURO-CORE: Track match creation (High dopamine event!)
    trackAction('match_created', { matchId: newMatch.id, venue: newMatch.venue });
    
    // Dashboard'a yönlendir
    navigateTo('dashboard');
  };

  // 3. RSVP GÜNCELLEME (FIX #6: Per-Match RSVP)
  const handleRsvpChange = (matchId: string, status: RsvpStatus) => {
    if (!currentUser) return;
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      alert('Maç bulunamadı.');
      return;
    }
    // Match'in attendees array'ini güncelle
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        const existingAttendees = m.attendees || [];
        const playerIndex = existingAttendees.findIndex(a => a.playerId === currentUser.id);
        
        if (playerIndex >= 0) {
          // Mevcut oyuncu, durumu güncelle
          const updated = [...existingAttendees];
          updated[playerIndex] = { playerId: currentUser.id, status };
          return { ...m, attendees: updated };
        } else {
          // Yeni oyuncu, ekle
          return { ...m, attendees: [...existingAttendees, { playerId: currentUser.id, status }] };
        }
      }
      return m;
    }));
    
    // Global rsvpStatus'ü de güncelle (geriye uyumluluk için)
    setRsvpStatus(status);
    
    console.log('✅ Katılım durumunuz güncellendi!');
  };

  // 4. KATILIM İSTEĞİ ONAYLAMA
  const handleApproveJoinRequest = (request: JoinRequest) => {
    console.log('✅ Katılım isteği onaylanıyor:', request);
    
    // Yeni oyuncu oluştur
    const newPlayer: Player = {
      id: request.id,
      name: request.name,
      position: request.position,
      rating: 6.0, // Varsayılan başlangıç puanı
      reliability: 100, // Yeni üye güvenilir kabul edilir
      avatar: request.avatar,
      role: 'member',
      tier: 'free'
    };
    
    // Players listesine ekle
    setPlayers(prev => [...prev, newPlayer]);
    
    // JoinRequests listesinden çıkar
    setJoinRequests(prev => prev.filter(jr => jr.id !== request.id));
    
    console.log('✅ Oyuncu takıma eklendi!');
  };

  // 5. KATILIM İSTEĞİ REDDETMe
  const handleRejectJoinRequest = (requestId: string) => {
    console.log('❌ Katılım isteği reddediliyor:', requestId);
    
    // JoinRequests listesinden çıkar veya durumunu güncelle
    setJoinRequests(prev => prev.map(jr => 
      jr.id === requestId ? { ...jr, status: 'rejected' as const } : jr
    ));
    
    // Veya tamamen sil
    // setJoinRequests(prev => prev.filter(jr => jr.id !== requestId));
    
    console.log('✅ İstek reddedildi!');
  };

  // 6. SAHA EKLEME
  const handleVenueAdd = (venue: Venue) => {
    console.log('🏟️ Yeni saha ekleniyor:', venue);
    setVenues(prev => [...prev, venue]);
    console.log('✅ Saha başarıyla eklendi!');
    goBack();
  };

  // 7. İŞLEM (Transaction) EKLEME
  const handleTransactionAdd = (transaction: Transaction) => {
    console.log('💰 Yeni işlem ekleniyor:', transaction);
    setTransactions(prev => [...prev, transaction]);
    console.log('✅ İşlem kaydedildi!');
  };

  // 8. ÖDEME DURUMU GÜNCELLEME
  const handleUpdatePayment = (paymentId: string, newStatus: Payment['status']) => {
    console.log(`💳 Ödeme güncelleniyor: ${paymentId} -> ${newStatus}`);
    setPayments(prev => prev.map(p => 
      p.id === paymentId ? { ...p, status: newStatus } : p
    ));
    console.log('✅ Ödeme durumu güncellendi!');
  };

  // 9. ANKET OYLAMAANKET OYLAMA
  const handlePollVote = (pollId: string, optionId: string) => {
    console.log(`🗳️ Anket oylaması: Poll ${pollId}, Seçenek ${optionId}`);
    
    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId && !poll.isVoted) {
        return {
          ...poll,
          isVoted: true,
          options: poll.options.map(opt => 
            opt.id === optionId 
              ? { ...opt, votes: opt.votes + 1 }
              : opt
          ),
          totalVotes: poll.totalVotes + 1
        };
      }
      return poll;
    }));
    
    console.log('✅ Oyunuz kaydedildi!');
  };

  // 10. OYUNCU ROL DEĞİŞİKLİĞİ (Admin)
  const handleChangePlayerRole = (playerId: string, newRole: 'admin' | 'member') => {
    console.log(`👤 Oyuncu rolü değiştiriliyor: ${playerId} -> ${newRole}`);
    
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, role: newRole } : p
    ));
    
    // Eğer currentUser'ın rolü değişiyorsa onu da güncelle
    if (currentUser?.id === playerId) {
      setCurrentUser(prev => prev ? { ...prev, role: newRole } : null);
    }
    
    console.log('✅ Rol güncellendi!');
  };

  // 11. TRANSFER İSTEĞİ OLUŞTURMA
  const handleProposeTransfer = (playerId: string) => {
    console.log('🔄 Transfer önerisi oluşturuluyor:', playerId);
    
    const newTransferRequest: TransferRequest = {
      id: `tr_${Date.now()}`,
      playerId: playerId,
      proposerId: currentUser!.id,
      status: 'pending_captain'
    };
    
    setTransferRequests(prev => [...prev, newTransferRequest]);
    console.log('✅ Transfer önerisi gönderildi!');
  };

  // 12. PROFİL OLUŞTURMA TAMAMLAMA
  const handleProfileComplete = (profileData?: { name: string; position: string; shirtNumber?: number }) => {
    console.log('🎉 Profil oluşturuluyor...', profileData);
    
    // Eğer currentUser varsa güncelle, yoksa yeni oluştur
    if (currentUser) {
      const updatedUser: Player = {
        ...currentUser,
        name: profileData?.name || currentUser.name,
        position: (profileData?.position as any) || currentUser.position,
        shirtNumber: profileData?.shirtNumber || currentUser.shirtNumber
      };
      setCurrentUser(updatedUser);
      setPlayers(prev => {
        const existing = prev.find(p => p.id === currentUser.id);
        if (existing) {
          return prev.map(p => p.id === currentUser.id ? updatedUser : p);
        }
        return [...prev, updatedUser];
      });
    } else {
      // Yeni kullanıcı oluştur
      const newUser: Player = {
        id: `player_${Date.now()}`,
        name: profileData?.name || 'Yeni Oyuncu',
        position: (profileData?.position as any) || 'MID',
        rating: 7.0,
        reliability: 80,
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
        role: 'member',
        tier: 'free',
        shirtNumber: profileData?.shirtNumber
      };
      setCurrentUser(newUser);
      setPlayers(prev => [...prev, newUser]);
    }
    console.log('✅ Profil oluşturuldu! Dashboard\'a yönlendiriliyor...');
    setScreenHistory([]);
    setCurrentScreen('dashboard');
  };

  // 13. TAKIM KURULUM TAMAMLAMA (Dashboard'a yönlendir)
  const handleTeamSetupComplete = (team: TeamProfile) => {
    console.log('⚽ Takım profili oluşturuluyor:', team);
    setTeamProfile(team);
    
    // Kullanıcı bilgilerini güncelle
    if (currentUser) {
      const updatedUser: Player = {
        ...currentUser,
        name: team.founderName || currentUser.name, // Takım kurucusunun adını kullan
        email: team.founderEmail,
        phone: currentUser.phone // Telefon numarası zaten kayıtlı
      };
      setCurrentUser(updatedUser);
      
      // Players listesine ekle
      setPlayers(prev => {
        const exists = prev.find(p => p.id === updatedUser.id);
        if (exists) {
          return prev.map(p => p.id === updatedUser.id ? updatedUser : p);
        }
        return [...prev, updatedUser];
      });
      
      console.log('✅ Takım ve kurucu profili başarıyla oluşturuldu!', { team, user: updatedUser });
    }
    setScreenHistory([]);
    setCurrentScreen('dashboard');
  };

  // 14. SCOUTING: OYUNCU ÖNERİSİ (Guest Player)
  const handleProposePlayer = (playerData: Partial<Player>, referrerId: string) => {
    console.log('🔍 Yeni oyuncu önerisi alınıyor:', playerData, 'Öneren:', referrerId);
    
    const newPlayer: Player = {
      id: `guest_${Date.now()}`,
      name: playerData.name || 'Misafir Oyuncu',
      position: playerData.position || 'MID',
      rating: playerData.rating || 6.0,
      reliability: 100,
      avatar: playerData.avatar || `https://i.pravatar.cc/150?u=guest_${Date.now()}`,
      role: 'guest',
      tier: 'free',
      referredBy: referrerId,
      trialStatus: 'pending_approval',
      contactNumber: playerData.contactNumber || ''
    };
    
    setPlayers(prev => [...prev, newPlayer]);
    
    console.log('✅ Oyuncu önerisi gönderildi! Admin onayı bekleniyor.');
    alert(`${newPlayer.name} başarıyla önerildi! Admin onayından sonra deneme sürecine alınacak.`);
  };

  // 15. SCOUTING: DENEME SÜRECİNİ BAŞLAT (Admin)
  const handleStartTrial = (playerId: string) => {
    console.log('🔄 Deneme süreci başlatılıyor:', playerId);
    
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, trialStatus: 'in_trial' as const } : p
    ));
    
    console.log('✅ Oyuncu deneme sürecine alındı!');
  };

  // 16. SCOUTING: FİNAL KARAR (Promote/Reject)
  const handleFinalDecision = (playerId: string, decision: 'promote' | 'reject') => {
    console.log(`⚖️ Final karar: ${playerId} -> ${decision}`);
    
    if (decision === 'promote') {
      // Guest -> Member
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, role: 'member', trialStatus: undefined } : p
      ));
      console.log('✅ Oyuncu asil üye oldu!');
    } else {
      // Reject -> Remove from list
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      console.log('❌ Oyuncu elendi.');
    }
  };

  // 17. FIX #9: BOOKING (REZERVASYON) TAMAMLAMA
  const handleBooking = (newMatch: Match) => {
    console.log('📅 Rezervasyon tamamlanıyor:', newMatch);
    setMatches(prev => [...prev, newMatch]);
    console.log('✅ Maç oluşturuldu ve takvime eklendi!');
    navigateTo('dashboard');
  };

  // 18. FIX #5: MAÇ SKORU GÜNCELLEME
  const handleUpdateMatchScore = (matchId: string, score: string, newStatus?: 'completed' | 'cancelled') => {
    console.log(`⚽ Maç skoru güncelleniyor: ${matchId} -> ${score}`);
    
    setMatches(prev => prev.map(m => 
      m.id === matchId 
        ? { ...m, score, status: newStatus || m.status } 
        : m
    ));
    
    console.log('✅ Maç sonucu güncellendi!');
  };

  // MAÇ DÜZENLEME
  const handleEditMatch = (matchId: string, updates: Partial<Match>) => {
    console.log(`✏️ Maç düzenleniyor: ${matchId}`, updates);
    
    setMatches(prev => prev.map(m => 
      m.id === matchId 
        ? { ...m, ...updates } 
        : m
    ));
    
    console.log('✅ Maç başarıyla güncellendi!');
  };

  // MAÇ İPTAL ETME
  const handleCancelMatch = (matchId: string, reason: string) => {
    console.log(`❌ Maç iptal ediliyor: ${matchId}, Neden: ${reason}`);
    
    const confirmCancel = window.confirm(
      `Bu maçı iptal etmek istediğinizden emin misiniz?\n\nNeden: ${reason}`
    );
    
    if (confirmCancel) {
      setMatches(prev => prev.map(m => 
        m.id === matchId 
          ? { ...m, status: 'cancelled' as const } 
          : m
      ));
      
      alert('✅ Maç iptal edildi! Takım üyelerine bildirim gönderildi.');
      console.log('✅ Maç iptal edildi!');
    }
  };

  // 19. FIX #7: AIDAT ÖDEMESİ / DEKONT YÜKLEME (Player Action)
  const handleUploadPaymentProof = (paymentId: string, proofUrl: string) => {
    console.log(`📤 Dekont yükleniyor: ${paymentId}`);
    
    setPayments(prev => prev.map(p => 
      p.id === paymentId 
        ? { ...p, proofUrl, status: 'waiting_approval' } 
        : p
    ));
    
    console.log('✅ Dekont yüklendi, admin onayı bekleniyor.');
    alert('Dekont yüklendi! Yönetici onayından sonra ödemeniz işlenecek.');
  };

  // 20. FIX #2: FİNANSAL RAPOR - GELİR EKLEME
  const handleAddIncome = (income: Transaction) => {
    console.log('💵 Gelir ekleniyor:', income);
    setTransactions(prev => [...prev, { ...income, category: 'gelir' }]);
    console.log('✅ Gelir kaydedildi!');
  };

  // VENUE OWNER HANDLERS
  // Rezervasyon onaylama
  const handleApproveReservation = (reservationId: string) => {
    console.log('✅ Rezervasyon onaylanıyor:', reservationId);
    setReservations(prev => prev.map(r => 
      r.id === reservationId 
        ? { ...r, status: 'confirmed' as const, confirmedAt: new Date().toISOString() }
        : r
    ));
    alert('Rezervasyon onaylandı! Takıma bildirim gönderildi.');
  };

  // Rezervasyon reddetme
  const handleRejectReservation = (reservationId: string, reason: string) => {
    console.log('❌ Rezervasyon reddediliyor:', reservationId, 'Neden:', reason);
    setReservations(prev => prev.map(r => 
      r.id === reservationId 
        ? { 
            ...r, 
            status: 'cancelled' as const, 
            cancelledAt: new Date().toISOString(),
            cancelReason: reason,
            paymentStatus: 'refunded' as const
          }
        : r
    ));
    alert('Rezervasyon reddedildi. Müşteriye bildirim gönderildi.');
  };

  // =========================================== 
  // SCOUT SYSTEM HANDLERS
  // ===========================================

  const handleAddCandidate = (data: any) => {
    const newCandidate = {
      id: 'talent_' + Date.now(),
      ...data,
      discoveredBy: currentUser?.id || '1',
      discoveredDate: new Date().toISOString(),
      status: 'scouting',
      trialMatchesPlayed: 0,
      trialMatchesTotal: 3,
      scoutReports: []
    };
    setTalentPool(prev => [...prev, newCandidate]);
    console.log('✅ Yeni aday eklendi:', newCandidate.name);
  };

  const handleCreateScoutReport = (report: any) => {
    const reportWithId = {
      id: 'sr_' + Date.now(),
      ...report,
      date: new Date().toISOString()
    };

    setTalentPool(prev => prev.map(player => {
      if (player.id === report.playerId) {
        const updatedReports = [...(player.scoutReports || []), reportWithId];
        
        // Calculate average score
        const avgScore = updatedReports.reduce((sum: number, r: any) => sum + r.overallScore, 0) / updatedReports.length;
        const avgPotential = updatedReports.reduce((sum: number, r: any) => sum + r.potential, 0) / updatedReports.length;

        return {
          ...player,
          scoutReports: updatedReports,
          averageScore: Number(avgScore.toFixed(1)),
          potentialRating: Number(avgPotential.toFixed(1))
        };
      }
      return player;
    }));

    console.log('✅ Scout raporu oluşturuldu:', report.scoutName);
  };

  const handleMakeTalentDecision = (playerId: string, decision: 'sign' | 'reject' | 'extend_trial', notes: string) => {
    setTalentPool(prev => prev.map(player => {
      if (player.id === playerId) {
        if (decision === 'sign') {
          // Promote to member - also add to players array
          const newPlayer: Player = {
            id: player.id,
            name: player.name,
            position: player.position,
            rating: player.averageScore || 7,
            reliability: 100,
            avatar: player.avatar,
            role: 'member',
            attributes: {
              pac: 70,
              sho: 70,
              pas: 70,
              dri: 70,
              def: 70,
              phy: 70
            }
          };
          
          setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
          
          return {
            ...player,
            status: 'signed',
            finalDecision: decision,
            finalDecisionBy: currentUser?.id,
            finalDecisionDate: new Date().toISOString(),
            finalDecisionNotes: notes
          };
        } else if (decision === 'reject') {
          return {
            ...player,
            status: 'rejected',
            finalDecision: decision,
            finalDecisionBy: currentUser?.id,
            finalDecisionDate: new Date().toISOString(),
            finalDecisionNotes: notes
          };
        } else {
          // Extend trial
          return {
            ...player,
            trialMatchesTotal: player.trialMatchesTotal + 3,
            finalDecisionNotes: notes
          };
        }
      }
      return player;
    }));

    const decisionText = decision === 'sign' ? 'İmzalandı' : 
                        decision === 'reject' ? 'Reddedildi' : 
                        'Deneme süresi uzatıldı';
    console.log(`✅ Karar: ${decisionText} - Notlar: ${notes}`);
  };

  // ===========================================

  // MVP Oylama
  const handleMVPVote = (matchId: string, playerId: string) => {
    if (!currentUser) return;
    
    console.log('🏆 MVP oylaması:', { matchId, playerId, voterId: currentUser.id });
    
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        const currentVotes = m.mvpVotes || [];
        // Aynı kullanıcı tekrar oy kullanamaz
        const hasVoted = currentVotes.some(v => v.voterId === currentUser.id);
        
        if (hasVoted) {
          alert('Zaten oy kullandınız!');
          return m;
        }
        
        const newVotes = [...currentVotes, { playerId, voterId: currentUser.id }];
        
        // Oy sayısını hesapla ve MVP kazananı belirle
        const voteCounts: Record<string, number> = {};
        newVotes.forEach(v => {
          voteCounts[v.playerId] = (voteCounts[v.playerId] || 0) + 1;
        });
        
        const winner = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        
        console.log('📊 Oy durumu:', voteCounts, 'Lider:', winner);
        
        return { 
          ...m, 
          mvpVotes: newVotes,
          mvpWinner: winner 
        };
      }
      return m;
    }));
    
    alert('Oyunuz kaydedildi! ✅');
  };

  // Settings Update Handler
  const handleUpdateSettings = (updates: Partial<Player>) => {
    if (!currentUser) return;
    
    console.log('⚙️ Ayarlar güncelleniyor:', updates);
    
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    setPlayers(prev => prev.map(p => p.id === currentUser.id ? updatedUser : p));
  };

  // Logout Handler
  const handleLogout = () => {
    console.log('👋 Çıkış yapılıyor...');
    const confirmLogout = window.confirm('Çıkış yapmak istediğinize emin misiniz?');
    if (confirmLogout) {
      setCurrentUser(null);
      setCurrentScreen('welcome');
      setScreenHistory([]);
      setTeamProfile(null);
      console.log('✅ Çıkış başarılı!');
    }
  };

  // ===========================================
  // RENDER SCREEN LOGIC
  // ===========================================
  const renderScreen = () => {
    switch (currentScreen) {
      // ========== PUBLIC SCREENS ==========
      case 'welcome':
        return (
          <WelcomeScreen 
            onNavigate={navigateTo}
          />
        );

      case 'login':
        return (
          <LoginScreen 
            onLogin={handleLogin}
          />
        );

      case 'joinTeam':
        return (
          <JoinTeamScreen 
            onBack={goBack}
            onSubmit={(request) => {
              console.log('📝 Katılım isteği alındı:', request);
              setJoinRequests(prev => [...prev, request]);
              navigateTo('createProfile');
            }}
          />
        );

      case 'createProfile':
        return (
          <CreateProfile 
            onComplete={handleProfileComplete}
          />
        );

      case 'teamSetup':
        return (
          <TeamSetup 
            onBack={goBack}
            onComplete={handleTeamSetupComplete}
          />
        );

      // ========== PROTECTED MEMBER SCREENS ==========
      case 'dashboard':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <Dashboard 
            onNavigate={navigateTo}
            currentUser={currentUser}
            rsvpStatus={rsvpStatus}
            onRsvpChange={setRsvpStatus}
            transferRequests={transferRequests}
            allMatches={matches}
            allPlayers={players}
            teamProfile={teamProfile}
          />
        );

      case 'matches':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <div className="min-h-screen bg-secondary p-4">
            <Header
              title="Maçlar"
              onBack={goBack}
              leftAction={
                <button onClick={() => navigateTo('notifications')} className="p-2 rounded-full hover:bg-slate-800 transition-colors" aria-label="Bildirimler">
                  <Icon name="notifications" className="text-slate-400" size={20} />
                </button>
              }
            />
            <div className="space-y-3 mt-4">
              {matches.map(match => (
                <MatchCard 
                  key={match.id}
                  match={match}
                  onClick={() => navigateTo('matchDetails', { matchId: match.id })}
                />
              ))}
            </div>
          </div>
        );

      case 'matchDetails':
        if (!currentUser || !matchDetailsId) {
          navigateTo('dashboard');
          return null;
        }
        return (
          <MatchDetails 
            matchId={matchDetailsId}
            onBack={goBack}
            currentUser={currentUser}
            rsvpStatus={rsvpStatus}
            onRsvpChange={(status) => handleRsvpChange(matchDetailsId, status)}
            onUpdateScore={handleUpdateMatchScore}
            onMVPVote={handleMVPVote}
            onEditMatch={handleEditMatch}
            onCancelMatch={handleCancelMatch}
            allPlayers={players}
            allMatches={matches}
          />
        );

      case 'team':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <TeamList 
            onBack={goBack}
            onNavigate={navigateTo}
            players={players}
            currentUser={currentUser}
            transferRequests={transferRequests}
            onProposePlayer={handleProposeTransfer}
          />
        );

      case 'profile':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <ProfileScreen 
            onBack={goBack}
            onNavigate={navigateTo}
            currentUser={currentUser}
            teamProfile={teamProfile}
            onLogout={() => {
              setCurrentUser(null);
              setTeamProfile(null);
              setScreenHistory([]);
              setCurrentScreen('welcome');
            }}
          />
        );

      case 'editProfile':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <EditProfileScreen 
            onBack={goBack}
            currentUser={currentUser}
            onSave={handleUpdateProfile}
          />
        );

      case 'payments':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <PaymentLedger 
            onBack={goBack}
            payments={payments}
            players={players}
            currentUser={currentUser}
            onUpdatePayment={handleUpdatePayment}
            onUploadProof={handleUploadPaymentProof}
          />
        );

      case 'members':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <MemberManagement 
            onBack={goBack}
            players={players}
            setPlayers={setPlayers}
            currentUser={currentUser}
            joinRequests={joinRequests}
            onApproveRequest={handleApproveJoinRequest}
            onRejectRequest={handleRejectJoinRequest}
            onChangeRole={handleChangePlayerRole}
            onProposePlayer={handleProposePlayer}
          />
        );

      case 'venues':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <VenueList 
            onBack={goBack}
            onNavigate={navigateTo}
            venues={venues}
            currentUser={currentUser}
          />
        );

      case 'venueDetails':
        if (!currentUser || !venueDetailsId) {
          navigateTo('venues');
          return null;
        }
        const currentVenue = venues.find(v => v.id === venueDetailsId);
        if (!currentVenue) {
          navigateTo('venues');
          return null;
        }
        return (
          <VenueDetails 
            onBack={goBack}
            venue={currentVenue}
            currentUser={currentUser}
          />
        );

      case 'venueAdd':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <VenueAdd 
            onBack={goBack}
            onSave={handleVenueAdd}
          />
        );

      case 'lineupManager':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <LineupManager 
            onBack={goBack}
            players={players}
            currentUser={currentUser}
            onShare={() => navigateTo('squadShare')}
          />
        );

      case 'squadShare':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <SquadShareWizard 
            onBack={goBack}
            players={players}
          />
        );

      case 'settings':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <Settings 
            onBack={goBack}
            currentUser={currentUser}
            onUpdateSettings={handleUpdateSettings}
            onLogout={handleLogout}
          />
        );

      case 'leaderboard':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <Leaderboard 
            onBack={goBack}
            players={players}
            currentUser={currentUser}
          />
        );

      case 'subscription':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <SubscriptionScreen 
            onBack={goBack}
            onNavigate={navigateTo}
            currentUser={currentUser}
          />
        );

      case 'polls':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <Polls 
            onBack={goBack}
            polls={polls}
            setPolls={setPolls}
            currentUser={currentUser}
            transferRequests={transferRequests}
            onVote={handlePollVote}
          />
        );

      case 'booking':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <BookingScreen 
            onBack={goBack}
            venues={venues}
            venueId={venueDetailsId || venues[0]?.id}
            onComplete={handleBooking}
          />
        );

      case 'tournament':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <TournamentScreen 
            onBack={goBack}
            onNavigate={navigateTo}
            currentUser={currentUser}
          />
        );

      case 'attendance':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <AttendanceScreen 
            onBack={goBack}
            matches={matches}
            players={players}
            currentUser={currentUser}
          />
        );

      case 'whatsappCenter':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        if (currentUser.role !== 'admin' && currentUser.tier !== 'partner') {
          alert('WhatsApp merkezi sadece yöneticiler için erişilebilir.');
          navigateTo('dashboard');
          return null;
        }
        return (
          <WhatsAppIntegration 
            onBack={goBack}
            currentUser={currentUser}
          />
        );

      case 'reserveSystem':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <ReserveSystem 
            onBack={goBack}
            players={players}
            currentUser={currentUser}
            onNavigate={navigateTo}
          />
        );

      case 'messageLogs':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <MessageLogs 
            onBack={goBack}
            currentUser={currentUser}
          />
        );

      case 'notifications':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <NotificationsScreen 
            onBack={goBack}
            onNavigate={navigateTo}
            currentUser={currentUser}
            notifications={notifications}
            onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
            onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))}
          />
        );

      // ========== PROTECTED ADMIN SCREENS ==========
      case 'admin':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        if (currentUser.role !== 'admin' && currentUser.tier !== 'partner') {
          alert('Bu özelliğe sadece yöneticiler erişebilir.');
          navigateTo('dashboard');
          return null;
        }
        return (
          <AdminDashboard 
            onBack={goBack}
            onNavigate={navigateTo}
            currentUser={currentUser}
            joinRequests={joinRequests}
            matches={matches}
            payments={payments}
            players={players}
            onStartTrial={handleStartTrial}
            onFinalDecision={handleFinalDecision}
            onApproveRequest={handleApproveJoinRequest}
            onRejectRequest={handleRejectJoinRequest}
          />
        );

      case 'matchCreate':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        if (currentUser.role !== 'admin' && currentUser.tier !== 'partner') {
          alert('Maç oluşturma yetkisi sadece yöneticilere aittir.');
          navigateTo('dashboard');
          return null;
        }
        return (
          <MatchCreate 
            onBack={goBack}
            venues={venues}
            currentUser={currentUser}
            players={players}
            onSave={handleCreateMatch}
          />
        );

      case 'debtList':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        if (currentUser.role !== 'admin') {
          alert('Borç listesine sadece yöneticiler erişebilir.');
          navigateTo('dashboard');
          return null;
        }
        return (
          <DebtList
            onBack={goBack}
            players={players}
            payments={payments}
          />
        );

      case 'financialReports':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        if (currentUser.role !== 'admin' && currentUser.tier !== 'partner') {
          alert('Finansal raporlara sadece yöneticiler erişebilir.');
          navigateTo('dashboard');
          return null;
        }
        return (
          <FinancialReports 
            onBack={goBack}
            transactions={transactions}
            onAddTransaction={handleTransactionAdd}
            currentUser={currentUser}
          />
        );

      // ========== VENUE OWNER SCREENS ==========
      case 'venueOwnerDashboard':
        if (!currentUser || currentUser.role !== 'venue_owner') {
          navigateTo('login');
          return null;
        }
        return (
          <VenueOwnerDashboard
            currentUser={currentUser}
            reservations={reservations}
            onNavigate={navigateTo}
            onApproveReservation={handleApproveReservation}
            onRejectReservation={handleRejectReservation}
          />
        );

      case 'reservationManagement':
        if (!currentUser || currentUser.role !== 'venue_owner') {
          navigateTo('login');
          return null;
        }
        return (
          <ReservationManagement
            currentUser={currentUser}
            reservations={reservations}
            onBack={goBack}
            onApproveReservation={handleApproveReservation}
            onRejectReservation={handleRejectReservation}
            onViewDetails={(id) => {
              setReservationDetailsId(id);
              navigateTo('reservationDetails');
            }}
          />
        );

      case 'reservationDetails':
        if (!currentUser || currentUser.role !== 'venue_owner' || !reservationDetailsId) {
          navigateTo('venueOwnerDashboard');
          return null;
        }
        const selectedReservation = reservations.find(r => r.id === reservationDetailsId);
        if (!selectedReservation) {
          navigateTo('reservationManagement');
          return null;
        }
        return (
          <ReservationDetails
            reservation={selectedReservation}
            onBack={goBack}
            onApprove={handleApproveReservation}
            onReject={handleRejectReservation}
          />
        );

      case 'venueCalendar':
        if (!currentUser || currentUser.role !== 'venue_owner') {
          navigateTo('login');
          return null;
        }
        return (
          <VenueCalendar 
            onBack={goBack} 
            reservations={reservations}
            venueIds={currentUser.venueOwnerInfo?.venueIds || []}
          />
        );

      case 'venueFinancialReports':
        if (!currentUser || currentUser.role !== 'venue_owner') {
          navigateTo('login');
          return null;
        }
        return <VenueFinancialReports currentUser={currentUser} onBack={goBack} />;

      case 'customerManagement':
        if (!currentUser || currentUser.role !== 'venue_owner') {
          navigateTo('login');
          return null;
        }
        return (
          <CustomerManagement 
            onBack={goBack}
            reservations={reservations}
            venueIds={currentUser.venueOwnerInfo?.venueIds || []}
          />
        );

      // ========== SCOUT SYSTEM ==========
      case 'scoutDashboard':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <ScoutDashboard
            onBack={goBack}
            onNavigate={navigateTo}
            currentUser={currentUser}
            talentPool={talentPool}
            players={players}
          />
        );

      case 'talentPool':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <TalentPool
            onBack={goBack}
            onNavigate={navigateTo}
            currentUser={currentUser}
            talentPool={talentPool}
            onAddCandidate={handleAddCandidate}
            onMakeDecision={handleMakeTalentDecision}
          />
        );

      case 'scoutReports':
        if (!currentUser) {
          navigateTo('login');
          return null;
        }
        return (
          <ScoutReports
            onBack={goBack}
            onNavigate={navigateTo}
            currentUser={currentUser}
            talentPool={talentPool}
            onCreateReport={handleCreateScoutReport}
          />
        );

      // ========== DEFAULT ==========
      default:
        return (
          <div className="min-h-screen bg-secondary flex items-center justify-center p-6 text-center">
            <div>
              <Icon name="error" size={64} className="text-alert mx-auto mb-4" />
              <h2 className="text-white text-xl font-bold mb-2">Sayfa Bulunamadı</h2>
              <p className="text-slate-400 text-sm mb-6">
                Aradığınız sayfa mevcut değil.
              </p>
              <button 
                onClick={() => setCurrentScreen(currentUser ? 'dashboard' : 'welcome')}
                className="bg-primary text-secondary px-6 py-3 rounded-xl font-bold"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        );
    }
  };

  // ===========================================
  // COMPONENT RENDER
  // ===========================================
  return (
    <ToastProvider>
      <div className="app-container mobile-content">
        {/* Mobile Header - Show on mobile for logged-in users */}
        {currentUser && currentScreen !== 'welcome' && currentScreen !== 'login' && (
          <MobileHeader
            title={getScreenTitle(currentScreen)}
            showBack={screenHistory.length > 0 && currentScreen !== 'dashboard'}
            onBack={screenHistory.length > 0 && currentScreen !== 'dashboard' ? goBack : undefined}
            leftAction={{
              icon: 'notifications',
              onClick: () => navigateTo('notifications'),
              badge: notifications.filter(n => !n.isRead).length,
            }}
          />
        )}

        {/* Main Content */}
        {renderScreen()}

        {/* Bottom Navigation - REMOVED */}
        {/* Install PWA Banner */}
        {currentUser && <InstallBanner />}
      </div>
    </ToastProvider>
  );
}

// Helper function to get screen titles for mobile header
function getScreenTitle(screen: ScreenName): string {
  const titles: Record<string, string> = {
    dashboard: 'Ana Sayfa',
    team: 'Takım',
    matches: 'Maçlar',
    profile: 'Profil',
    settings: 'Ayarlar',
    admin: 'Yönetim',
    members: 'Üyeler',
    venues: 'Sahalar',
    payments: 'Ödemeler',
    polls: 'Anketler',
    matchCreate: 'Maç Oluştur',
    financialReports: 'Finansal Raporlar',
    whatsapp: 'WhatsApp',
    notifications: 'Bildirimler',
    // Add more as needed
  };
  return titles[screen] || 'Sahada';
}

export default App;
