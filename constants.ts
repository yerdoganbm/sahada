
import { Match, Player, Payment, Venue, Transaction, Poll, TournamentTeam, BracketMatch, Reservation, AppNotification, WaitlistEntry, AuditEvent, RecurringRule, CashEntry, DayClose, MaintenanceTask, IssueTicket, MessageTemplate, OutboxMessage } from './types';

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: '1', type: 'match', title: 'Maç Daveti', message: 'Salı 21:00 maçı için kadroya eklendin. Lütfen onay ver.', time: '10 dk önce', isRead: false, actionScreen: 'matchDetails' },
  { id: '2', type: 'payment', title: 'Ödeme Hatırlatma', message: 'Geçen haftaki maçtan 120 TL bakiyen bulunuyor.', time: '2 saat önce', isRead: false, actionScreen: 'payments' },
  { id: '3', type: 'social', title: 'MVP Seçildin! 👑', message: 'Son maçtaki performansınla arkadaşların seni MVP seçti.', time: 'Dün', isRead: true, actionScreen: 'leaderboard' },
  { id: '4', type: 'system', title: 'Saha Bakımı', message: 'Favori sahanızda zemin yenileme çalışması tamamlandı.', time: '2 gün önce', isRead: true, actionScreen: 'venues' },
];

export const MOCK_PLAYERS: Player[] = [
  { 
    id: '1', name: 'Ahmet Yılmaz', position: 'MID', rating: 8.5, reliability: 95, avatar: 'https://i.pravatar.cc/150?u=1', isCaptain: true, role: 'admin', tier: 'free', marketValue: '2.5M',
    attributes: { pac: 82, sho: 85, pas: 88, dri: 84, def: 60, phy: 70 },
    goals: 8, assists: 12, mvpCount: 2, matchesPlayed: 16
  },
  { 
    id: '2', name: 'Mehmet Demir', position: 'FWD', rating: 9.0, reliability: 88, avatar: 'https://i.pravatar.cc/150?u=2', role: 'member', tier: 'free', marketValue: '3.0M',
    attributes: { pac: 90, sho: 92, pas: 75, dri: 88, def: 40, phy: 75 },
    goals: 32, assists: 6, mvpCount: 8, matchesPlayed: 17
  },
  { 
    id: '3', name: 'Caner Erkin', position: 'DEF', rating: 7.8, reliability: 92, avatar: 'https://i.pravatar.cc/150?u=3', role: 'member', tier: 'free', marketValue: '1.2M',
    attributes: { pac: 75, sho: 60, pas: 78, dri: 70, def: 85, phy: 80 },
    goals: 2, assists: 4, mvpCount: 0, matchesPlayed: 15
  },
  { 
    id: '4', name: 'Volkan Babacan', position: 'GK', rating: 8.2, reliability: 100, avatar: 'https://i.pravatar.cc/150?u=4', role: 'member', tier: 'premium', marketValue: '1.8M',
    attributes: { pac: 50, sho: 50, pas: 60, dri: 50, def: 88, phy: 85 },
    goals: 0, assists: 0, mvpCount: 1, matchesPlayed: 18
  },
  { id: '5', name: 'Ozan Tufan', position: 'MID', rating: 7.5, reliability: 75, avatar: 'https://i.pravatar.cc/150?u=5', role: 'member', tier: 'free', marketValue: '900K', goals: 5, assists: 15, mvpCount: 4, matchesPlayed: 14 },
  { id: '6', name: 'Hakan Çalhanoğlu', position: 'MID', rating: 9.2, reliability: 98, avatar: 'https://i.pravatar.cc/150?u=6', role: 'admin', tier: 'partner', marketValue: '5.0M', goals: 24, assists: 10, mvpCount: 5, matchesPlayed: 17 },
  { id: '7', name: 'Burak Yılmaz', position: 'FWD', rating: 8.1, reliability: 85, avatar: 'https://i.pravatar.cc/150?u=7', role: 'member', isCaptain: true, tier: 'free', goals: 19, assists: 12, mvpCount: 3, matchesPlayed: 16 },
  { id: '8', name: 'Çağlar Söyüncü', position: 'DEF', rating: 8.8, reliability: 90, avatar: 'https://i.pravatar.cc/150?u=8', role: 'member', tier: 'premium', goals: 1, assists: 11, mvpCount: 2, matchesPlayed: 15 },
  { id: '9', name: 'Merih Demiral', position: 'DEF', rating: 8.6, reliability: 82, avatar: 'https://i.pravatar.cc/150?u=9', role: 'member', tier: 'free', goals: 3, assists: 2, mvpCount: 0, matchesPlayed: 14 },
  { id: '10', name: 'Cengiz Ünder', position: 'FWD', rating: 8.3, reliability: 78, avatar: 'https://i.pravatar.cc/150?u=10', role: 'member', tier: 'free', goals: 14, assists: 8, mvpCount: 2, matchesPlayed: 13 },
  { id: '11', name: 'Uğurcan Çakır', position: 'GK', rating: 8.4, reliability: 96, avatar: 'https://i.pravatar.cc/150?u=11', role: 'member', tier: 'premium', goals: 0, assists: 0, mvpCount: 2, matchesPlayed: 12 },
  { id: '12', name: 'İrfan Can', position: 'MID', rating: 7.9, reliability: 88, avatar: 'https://i.pravatar.cc/150?u=12', role: 'member', tier: 'free', goals: 4, assists: 7, mvpCount: 1, matchesPlayed: 16 },
  { id: '13', name: 'Mert Müldür', position: 'DEF', rating: 7.6, reliability: 91, avatar: 'https://i.pravatar.cc/150?u=13', role: 'member', tier: 'free', goals: 0, assists: 5, mvpCount: 0, matchesPlayed: 15 },
  { id: '14', name: 'Orkun Kökçü', position: 'MID', rating: 8.0, reliability: 84, avatar: 'https://i.pravatar.cc/150?u=14', role: 'member', tier: 'free', goals: 6, assists: 9, mvpCount: 1, matchesPlayed: 14 },
  { id: '15', name: 'Yusuf Yazıcı', position: 'MID', rating: 7.7, reliability: 65, avatar: 'https://i.pravatar.cc/150?u=15', role: 'member', tier: 'free', goals: 7, assists: 3, mvpCount: 0, matchesPlayed: 11 },
  { id: '16', name: 'Enes Ünal', position: 'FWD', rating: 7.5, reliability: 70, avatar: 'https://i.pravatar.cc/150?u=16', role: 'member', tier: 'free', goals: 11, assists: 4, mvpCount: 1, matchesPlayed: 12 },
  // SAHA SAHİBİ
  { 
    id: 'venue_owner_1', 
    name: 'Kemal Arslan', 
    position: 'MID',
    rating: 9.5, 
    reliability: 100, 
    avatar: 'https://i.pravatar.cc/150?u=venue_owner_1', 
    role: 'venue_owner', 
    tier: 'premium',
    venueOwnerInfo: {
      venueIds: ['v1', 'v3'],
      businessInfo: {
        companyName: 'Arslan Spor Tesisleri Ltd. Şti.',
        taxNumber: '1234567890',
        iban: 'TR330006100519786457841326',
        bankName: 'Ziraat Bankası',
        accountHolder: 'Kemal Arslan'
      },
      commissionRate: 15,
      totalRevenue: 125000,
      totalReservations: 240,
      responseTime: 12
    }
  },
  // SAHA PERSONELİ
  {
    id: 'venue_staff_1',
    name: 'Serkan Yıldız',
    position: 'GK',
    rating: 7.0,
    reliability: 95,
    avatar: 'https://i.pravatar.cc/150?u=venue_staff_1',
    role: 'venue_staff',
    tier: 'free',
    contactNumber: '5000000098',
    venueOwnerInfo: {
      venueIds: ['v1', 'v3'],
      businessInfo: { companyName: 'Arslan Spor', taxNumber: '', iban: '', bankName: '', accountHolder: '' },
      commissionRate: 0,
      totalRevenue: 0,
      totalReservations: 0,
      responseTime: 0,
    },
  },
  // SAHA MUHASEBECİSİ
  {
    id: 'venue_accountant_1',
    name: 'Ayşe Kaya',
    position: 'MID',
    rating: 7.0,
    reliability: 98,
    avatar: 'https://i.pravatar.cc/150?u=venue_accountant_1',
    role: 'venue_accountant',
    tier: 'free',
    contactNumber: '5000000097',
    venueOwnerInfo: {
      venueIds: ['v1', 'v3'],
      businessInfo: { companyName: 'Arslan Spor', taxNumber: '', iban: '', bankName: '', accountHolder: '' },
      commissionRate: 0,
      totalRevenue: 125000,
      totalReservations: 240,
      responseTime: 0,
    },
  },
];

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    date: 'Bugün',
    time: '21:00',
    location: 'Olimpik Halı Saha',
    status: 'upcoming',
    pricePerPerson: 150,
    opponent: 'Yazılımcılar FC'
  },
  {
    id: 'm2',
    date: '14 Ekim',
    time: '22:00',
    location: 'Merkez Arena',
    status: 'completed',
    score: '5 - 3',
    pricePerPerson: 120,
    opponent: 'Mahalle Gençlik'
  },
  {
    id: 'm3',
    date: '07 Ekim',
    time: '20:00',
    location: 'Olimpik Halı Saha',
    status: 'completed',
    score: '2 - 4',
    pricePerPerson: 120,
    opponent: 'Kuzey Yıldızları'
  }
];

export const MOCK_PAYMENTS: Payment[] = [
  { id: 'p1', playerId: '1', amount: 150, status: 'paid' },
  { id: 'p2', playerId: '2', amount: 150, status: 'pending' },
  { id: 'p3', playerId: '3', amount: 150, status: 'paid' },
  { id: 'p4', playerId: '4', amount: 150, status: 'failed' },
  { id: 'p5', playerId: '5', amount: 150, status: 'pending' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', title: '12 Ekim Maçı - Katılım', category: 'gelir', date: '12 Eki 2023', amount: 2100, status: 'completed', description: '14 Oyuncu Katılımı' },
  { id: 't2', title: 'Saha Ödemesi', category: 'gider', date: '12 Eki 2023', amount: -1800, status: 'pending', description: 'Merkez Halı Saha - Saat 21:00' },
  { id: 't3', title: 'Yeni Top Alımı', category: 'ekipman', date: '08 Eki 2023', amount: -300, status: 'pending', description: 'Nike Flight Pro - 2 Adet' },
  { id: 't4', title: '05 Ekim Maçı - Katılım', category: 'gelir', date: '05 Eki 2023', amount: 2100, status: 'completed', description: '14 Oyuncu Katılımı' },
  { id: 't5', title: 'Saha Ödemesi', category: 'gider', date: '05 Eki 2023', amount: -1800, status: 'pending', description: 'Merkez Halı Saha - Saat 21:00' },
  { id: 't6', title: 'Eylül Maçı', category: 'gelir', date: '15 Eyl 2023', amount: 1800, status: 'completed', description: 'Geçmiş ay verisi' },
  { id: 't7', title: 'Sezon Başı Toplantı', category: 'gider', date: '10 Oca 2023', amount: -500, status: 'completed', description: 'Kafe harcaması' },
];

export const MOCK_VENUES: Venue[] = [
  {
    id: 'v1',
    ownerId: 'venue_owner_1', // Kemal Arslan'ın sahası
    name: 'Olimpik Halı Saha',
    district: 'Kadıköy',
    address: 'Fenerbahçe Mah. Kalamış Cad. No:88',
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    price: 1200,
    rating: 4.8,
    reviewCount: 156,
    status: 'active',
    features: ['Otopark', 'Duş', 'Kafe', 'Krampon Kiralama'],
    phone: '0216 123 45 67',
    email: 'olimpik@sahakirala.com',
    capacity: '7v7',
    pricing: {
      weekdayMorning: 800,
      weekdayAfternoon: 1000,
      weekdayPrime: 1200,
      weekendMorning: 1000,
      weekendAfternoon: 1200,
      weekendPrime: 1500
    },
    workingHours: {
      monday: { open: '08:00', close: '23:00', isClosed: false },
      tuesday: { open: '08:00', close: '23:00', isClosed: false },
      wednesday: { open: '08:00', close: '23:00', isClosed: false },
      thursday: { open: '08:00', close: '23:00', isClosed: false },
      friday: { open: '08:00', close: '23:00', isClosed: false },
      saturday: { open: '08:00', close: '24:00', isClosed: false },
      sunday: { open: '08:00', close: '24:00', isClosed: false }
    },
    stats: {
      totalReservations: 240,
      totalRevenue: 288000,
      averageRating: 4.8,
      occupancyRate: 78,
      cancelRate: 5
    },
    organizerNotes: {
      doorCode: '1907',
      contactPerson: 'Mehmet Can',
      contactPhone: '0532 111 22 33',
      lastUpdate: '2 saat önce',
      customNotes: 'Gece maçlarında ışıklandırma ücreti fiyata dahildir.'
    },
    priceHistory: [
      { date: '12 Ocak 2024', price: 1200, reason: 'Yıllık Enflasyon' },
      { date: '15 Eylül 2023', price: 1000, reason: 'Sezon Başı' }
    ]
  },
  {
    id: 'v2',
    name: 'Yıldız Arena',
    district: 'Beşiktaş',
    address: 'Barbaros Bulvarı No:44',
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    price: 1250,
    rating: 4.9,
    status: 'active',
    features: ['Otopark', 'Wi-Fi', 'Servis'],
    phone: '0212 222 33 44',
    capacity: '8v8',
    organizerNotes: {
      doorCode: '1903',
      contactPerson: 'Ali Veli',
      contactPhone: '0555 444 33 22',
      lastUpdate: '1 gün önce',
      customNotes: 'Zemin yenilendi.'
    },
    location: {
      placeId: 'ChIJq6qq6g3xyhQRnfWCInv-wYc',
      formattedAddress: 'Atatürk Cad. No:28, Kadıköy/İstanbul',
      latLng: { lat: 40.9867, lng: 29.0337 },
      addressComponents: { city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Atatürk Mahallesi', postalCode: '34710' },
      entrance: { lat: 40.9872, lng: 29.0341 },
      parking: { lat: 40.9861, lng: 29.0330 },
      serviceArea: { type: 'radius', meters: 120 },
      verifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedBy: 'gps_owner_check',
      source: 'places_autocomplete',
    },
  },
  {
    id: 'v3',
    ownerId: 'venue_owner_1', // Kemal Arslan'ın 2. sahası
    name: 'Premium Arena',
    district: 'Üsküdar',
    address: 'Sahil Yolu Cad. No:12',
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    price: 1500,
    rating: 4.9,
    reviewCount: 89,
    status: 'active',
    features: ['Otopark', 'Duş', 'VIP Kafe', 'Kapalı Tribün', 'Isıtma'],
    phone: '0216 555 66 77',
    email: 'premium@sahakirala.com',
    capacity: '7v7',
    pricing: {
      weekdayMorning: 1000,
      weekdayAfternoon: 1200,
      weekdayPrime: 1500,
      weekendMorning: 1200,
      weekendAfternoon: 1500,
      weekendPrime: 1800
    },
    workingHours: {
      monday: { open: '08:00', close: '23:00', isClosed: false },
      tuesday: { open: '08:00', close: '23:00', isClosed: false },
      wednesday: { open: '08:00', close: '23:00', isClosed: false },
      thursday: { open: '08:00', close: '23:00', isClosed: false },
      friday: { open: '08:00', close: '23:00', isClosed: false },
      saturday: { open: '08:00', close: '24:00', isClosed: false },
      sunday: { open: '08:00', close: '24:00', isClosed: false }
    },
    stats: {
      totalReservations: 180,
      totalRevenue: 270000,
      averageRating: 4.9,
      occupancyRate: 85,
      cancelRate: 3
    }
  }
];

export const MOCK_POLLS: Poll[] = [
  {
    id: 'poll1',
    question: 'Bu haftanın MVP\'si kim?',
    options: [
      { id: 'o1', text: 'Ahmet Yılmaz', votes: 5 },
      { id: 'o2', text: 'Caner Erkin', votes: 2 },
      { id: 'o3', text: 'Volkan Babacan', votes: 3 }
    ],
    totalVotes: 10,
    isVoted: false,
    endDate: 'Yarın, 23:59'
  },
  {
    id: 'poll2',
    question: 'Bir sonraki maç hangi gün olsun?',
    options: [
      { id: 'o1', text: 'Salı 21:00', votes: 8 },
      { id: 'o2', text: 'Çarşamba 22:00', votes: 4 }
    ],
    totalVotes: 12,
    isVoted: true,
    endDate: 'Bitti'
  }
];

export const MOCK_TOURNAMENT_TEAMS: TournamentTeam[] = [
  { id: 't1', name: 'Bizim Takım', logo: 'https://i.pravatar.cc/100?u=team1', stats: { played: 5, won: 4, drawn: 0, lost: 1, gf: 18, ga: 8, points: 12 } },
  { id: 't2', name: 'Kuzey Yıldızları', logo: 'https://i.pravatar.cc/100?u=team2', stats: { played: 5, won: 3, drawn: 1, lost: 1, gf: 14, ga: 10, points: 10 } },
  { id: 't3', name: 'Mahalle Gençlik', logo: 'https://i.pravatar.cc/100?u=team3', stats: { played: 5, won: 2, drawn: 2, lost: 1, gf: 11, ga: 9, points: 8 } },
  { id: 't4', name: 'Yazılımcılar FC', logo: 'https://i.pravatar.cc/100?u=team4', stats: { played: 5, won: 2, drawn: 0, lost: 3, gf: 9, ga: 15, points: 6 } },
  { id: 't5', name: 'Atletik Spor', logo: 'https://i.pravatar.cc/100?u=team5', stats: { played: 5, won: 1, drawn: 1, lost: 3, gf: 8, ga: 12, points: 4 } },
  { id: 't6', name: 'Veteranlar', logo: 'https://i.pravatar.cc/100?u=team6', stats: { played: 5, won: 0, drawn: 2, lost: 3, gf: 5, ga: 11, points: 2 } },
];

export const MOCK_BRACKET: BracketMatch[] = [
  { 
    id: 'bm1', round: 'quarter', date: '20 Eki 20:00',
    team1: { id: 't1', name: 'Bizim Takım', score: 3 }, 
    team2: { id: 't6', name: 'Veteranlar', score: 1 },
    winnerId: 't1'
  },
  { 
    id: 'bm2', round: 'quarter', date: '20 Eki 21:00',
    team1: { id: 't3', name: 'Mahalle Gençlik', score: 2 }, 
    team2: { id: 't4', name: 'Yazılımcılar FC', score: 0 },
    winnerId: 't3'
  },
  { 
    id: 'bm3', round: 'quarter', date: '21 Eki 20:00',
    team1: { id: 't2', name: 'Kuzey Yıldızları', score: undefined }, 
    team2: { id: 't5', name: 'Atletik Spor', score: undefined },
  },
  { 
    id: 'bm4', round: 'semi', date: '25 Eki 21:00',
    team1: { id: 't1', name: 'Bizim Takım' }, 
    team2: { id: 't3', name: 'Mahalle Gençlik' },
  },
];

// REZERVASYONLAR (Mock Data)
export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'res1',
    venueId: 'v1',
    venueName: 'Olimpik Halı Saha',
    teamName: 'Kuzey Yıldızları',
    date: '2026-03-10',
    startTime: '20:00',
    endTime: '21:30',
    duration: 90,
    price: 1800,
    status: 'pending',
    participants: 14,
    contactPerson: 'Ahmet Yılmaz',
    contactPhone: '0532 111 22 33',
    notes: 'İlk maçımız, lütfen sahayı temiz hazırlayın',
    createdAt: '2026-03-09T10:30:00',
    paymentStatus: 'pending',
    paymentMethod: 'bank_transfer',
    depositRequired: true,
    depositAmount: 300,
    holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 dk hold
    cancellationPolicy: { freeCancelUntilHours: 24, latePenaltyPercent: 100 },
  },
  {
    id: 'res2',
    venueId: 'v1',
    venueName: 'Olimpik Halı Saha',
    teamName: 'Doğu Şampiyonları',
    date: '2026-03-11',
    startTime: '18:00',
    endTime: '19:30',
    duration: 90,
    price: 1800,
    status: 'confirmed',
    participants: 12,
    contactPerson: 'Mehmet Demir',
    contactPhone: '0532 222 33 44',
    createdAt: '2026-03-08T14:20:00',
    confirmedAt: '2026-03-08T14:25:00',
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    depositRequired: true,
    depositAmount: 300,
    depositPaidAt: '2026-03-08T14:22:00',
    cancellationPolicy: { freeCancelUntilHours: 24, latePenaltyPercent: 100 },
  },
  {
    id: 'res3',
    venueId: 'v3',
    venueName: 'Premium Arena',
    teamName: 'Güney Fırtınası',
    date: '2026-03-08',
    startTime: '21:00',
    endTime: '22:30',
    duration: 90,
    price: 2250,
    status: 'completed',
    participants: 16,
    contactPerson: 'Can Öztürk',
    contactPhone: '0532 333 44 55',
    createdAt: '2026-03-05T09:15:00',
    confirmedAt: '2026-03-05T09:20:00',
    paymentStatus: 'paid',
    paymentMethod: 'credit_card',
    depositRequired: true,
    depositAmount: 450,
    depositPaidAt: '2026-03-05T09:16:00',
  },
  {
    id: 'res4',
    venueId: 'v1',
    venueName: 'Olimpik Halı Saha',
    teamName: 'Yazılımcılar FC',
    date: '2026-03-12',
    startTime: '19:00',
    endTime: '20:00',
    duration: 60,
    price: 1200,
    status: 'cancelled',
    participants: 10,
    contactPerson: 'Ali Veli',
    contactPhone: '0532 444 55 66',
    notes: 'Yağmur yağıyor iptal ettik',
    createdAt: '2026-03-07T16:40:00',
    confirmedAt: '2026-03-07T16:45:00',
    cancelledAt: '2026-03-12T15:30:00',
    cancelReason: 'Hava şartları uygun değil',
    paymentStatus: 'refunded',
    refundedAt: '2026-03-12T16:00:00',
    depositRequired: false,
  },
  {
    id: 'res5',
    venueId: 'v1',
    venueName: 'Olimpik Halı Saha',
    teamName: 'Kuzey Yıldızları',
    date: '2026-03-13',
    startTime: '20:00',
    endTime: '21:30',
    duration: 90,
    price: 1800,
    status: 'pending',
    participants: 14,
    contactPerson: 'Ahmet Yılmaz',
    contactPhone: '0532 111 22 33',
    createdAt: '2026-03-09T11:00:00',
    paymentStatus: 'paid',
    paymentMethod: 'credit_card',
    depositRequired: true,
    depositAmount: 360,
    depositPaidAt: '2026-03-09T11:01:00',
    cancellationPolicy: { freeCancelUntilHours: 24, latePenaltyPercent: 100 },
  }
];

// TALENT POOL (Scout System Mock Data)
export const MOCK_TALENT_POOL: any[] = [
  {
    id: 'talent_1',
    name: 'Emre Kaya',
    age: 22,
    position: 'MID',
    contactNumber: '0532 777 88 99',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EmreKaya',
    discoveredBy: '1', // Admin
    discoveredDate: '2026-02-10',
    source: 'referral',
    status: 'in_trial',
    trialMatchesPlayed: 2,
    trialMatchesTotal: 3,
    scoutReports: [
      {
        id: 'sr1',
        playerId: 'talent_1',
        scoutId: '7',
        scoutName: 'Mehmet Demir',
        date: '2026-02-12',
        technical: { ballControl: 7.5, passing: 8, shooting: 6, dribbling: 7, firstTouch: 7.5 },
        physical: { speed: 6, stamina: 7, strength: 5.5, agility: 7 },
        mental: { positioning: 7, decisionMaking: 7.5, gameReading: 8, workRate: 8.5, teamwork: 9 },
        overallScore: 7.3,
        potential: 8,
        recommendation: 'sign_now',
        strengths: ['Mükemmel pas yeteneği', 'Yüksek çalışkanlık', 'Takım oyununa uygun'],
        weaknesses: ['Fiziksel güç düşük', 'Şut isabeti gelişmeli'],
        detailedNotes: 'Orta saha için harika bir aday. Takım oyununa çok uygun, iletişimi güçlü.'
      }
    ],
    averageScore: 7.3,
    potentialRating: 8
  },
  {
    id: 'talent_2',
    name: 'Burak Özdemir',
    age: 19,
    position: 'FWD',
    contactNumber: '0533 888 99 00',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BurakOzdemir',
    discoveredBy: '2',
    discoveredDate: '2026-02-11',
    source: 'tournament',
    status: 'in_trial',
    trialMatchesPlayed: 3,
    trialMatchesTotal: 3,
    scoutReports: [
      {
        id: 'sr2',
        playerId: 'talent_2',
        scoutId: '1',
        scoutName: 'Ahmet Yılmaz',
        date: '2026-02-13',
        technical: { ballControl: 8, passing: 6.5, shooting: 9, dribbling: 8.5, firstTouch: 7.5 },
        physical: { speed: 9, stamina: 7, strength: 6, agility: 8.5 },
        mental: { positioning: 7, decisionMaking: 6.5, gameReading: 6, workRate: 7, teamwork: 7 },
        overallScore: 7.5,
        potential: 9,
        recommendation: 'sign_now',
        strengths: ['Olağanüstü hız', 'Mükemmel şut gücü', 'Genç ve gelişime açık'],
        weaknesses: ['Oyun okuma gelişmeli', 'Pas tercihleri iyileştirilmeli'],
        detailedNotes: 'Çok yetenekli genç forvet. Hız ve şut gücü olağanüstü. Takım oyunu eğitimi ile yıldız olur.'
      }
    ],
    averageScore: 7.5,
    potentialRating: 9
  },
  {
    id: 'talent_3',
    name: 'Kerem Aktaş',
    age: 24,
    position: 'DEF',
    contactNumber: '0534 999 00 11',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KeremAktas',
    discoveredBy: '7',
    discoveredDate: '2026-02-08',
    source: 'referral',
    status: 'scouting',
    trialMatchesPlayed: 0,
    trialMatchesTotal: 3,
    scoutReports: [],
    averageScore: undefined,
    potentialRating: undefined
  },
  {
    id: 'talent_4',
    name: 'Cem Yıldız',
    age: 26,
    position: 'GK',
    contactNumber: '0535 000 11 22',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CemYildiz',
    discoveredBy: '1',
    discoveredDate: '2026-02-09',
    source: 'open_trial',
    status: 'approved',
    trialMatchesPlayed: 3,
    trialMatchesTotal: 3,
    scoutReports: [
      {
        id: 'sr3',
        playerId: 'talent_4',
        scoutId: '7',
        scoutName: 'Mehmet Demir',
        date: '2026-02-11',
        technical: { ballControl: 7, passing: 7, shooting: 5, dribbling: 6, firstTouch: 7 },
        physical: { speed: 6, stamina: 8, strength: 8, agility: 7 },
        mental: { positioning: 9, decisionMaking: 8, gameReading: 9, workRate: 8, teamwork: 8 },
        overallScore: 7.6,
        potential: 7,
        recommendation: 'sign_now',
        strengths: ['Mükemmel refleks', 'Oyunu iyi yönetiyor', 'Tecrübeli'],
        weaknesses: ['Ayak oyunu gelişmeli'],
        detailedNotes: 'Kaleci kadromuzu güçlendirecek tecrübeli bir oyuncu.'
      }
    ],
    averageScore: 7.6,
    potentialRating: 7,
    finalDecision: 'sign',
    finalDecisionBy: '1',
    finalDecisionDate: '2026-02-13',
    finalDecisionNotes: 'Kaleci pozisyonunda ihtiyacımız vardı. İmzalandı.'
  }
];


// ── WAITLIST MOCK ────────────────────────────────────────────────────────────
export const MOCK_WAITLIST: WaitlistEntry[] = [
  {
    id: 'wl1',
    venueId: 'v1',
    venueName: 'Olimpik Halı Saha',
    date: '2026-03-15',
    startTime: '20:00',
    durationMinutes: 90,
    createdByUserId: '2',
    createdByName: 'Mehmet Demir',
    status: 'waiting',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'wl2',
    venueId: 'v1',
    venueName: 'Olimpik Halı Saha',
    date: '2026-03-15',
    startTime: '20:00',
    durationMinutes: 90,
    createdByUserId: '7',
    createdByName: 'Burak Yılmaz',
    status: 'offered',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    offeredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    offerExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  },
];

// ── AUDIT LOG MOCK ───────────────────────────────────────────────────────────
export const MOCK_AUDIT: AuditEvent[] = [
  {
    id: 'aud1',
    at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    actorUserId: 'venue_owner_1',
    actorName: 'Kemal Arslan',
    actorRole: 'venue_owner',
    entityType: 'reservation',
    entityId: 'res2',
    action: 'RESERVATION_APPROVED',
    meta: { venueName: 'Olimpik Halı Saha', teamName: 'Doğu Şampiyonları' },
  },
  {
    id: 'aud2',
    at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actorUserId: '1',
    actorName: 'Ahmet Yılmaz',
    actorRole: 'admin',
    entityType: 'reservation',
    entityId: 'res1',
    action: 'RESERVATION_CREATED',
    meta: { price: 1800, paymentMethod: 'bank_transfer' },
  },
  {
    id: 'aud3',
    at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    actorUserId: '2',
    actorName: 'Mehmet Demir',
    actorRole: 'member',
    entityType: 'waitlist',
    entityId: 'wl1',
    action: 'WAITLIST_JOINED',
    meta: { venueId: 'v1', date: '2026-03-15', startTime: '20:00' },
  },
  {
    id: 'aud4',
    at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    actorUserId: 'venue_owner_1',
    actorName: 'Kemal Arslan',
    actorRole: 'venue_owner',
    entityType: 'venue',
    entityId: 'v1',
    action: 'VENUE_SETTINGS_SAVED',
    meta: { fields: ['workingHours', 'pricing'] },
  },
];

// ── RECURRING RULES ──────────────────────────────────────────────────────────
export const MOCK_RECURRING_RULES: RecurringRule[] = [
  {
    id: 'rr1',
    venueId: 'v1',
    venueName: 'Olimpik Halı Saha',
    createdByUserId: 'venue_owner_1',
    customerName: 'ABC Spor Kulübü',
    customerPhone: '5321234567',
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    freq: 'WEEKLY',
    byWeekdays: [2], // Salı
    startTime: '20:00',
    durationMinutes: 90,
    autoConfirm: true,
    pricingMode: 'fixed',
    fixedPrice: 1500,
    paymentMode: 'invoice_monthly',
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rr2',
    venueId: 'v1',
    venueName: 'Olimpik Halı Saha',
    createdByUserId: 'venue_owner_1',
    customerName: 'XYZ Şirket Takımı',
    customerPhone: '5339876543',
    startDate: '2026-03-01',
    freq: 'WEEKLY',
    byWeekdays: [4, 6], // Perşembe + Cumartesi
    startTime: '18:00',
    durationMinutes: 60,
    autoConfirm: true,
    pricingMode: 'bucket',
    paymentMode: 'pay_each',
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── CASH ENTRIES ─────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
export const MOCK_CASH_ENTRIES: CashEntry[] = [
  {
    id: 'ce1',
    venueId: 'v1',
    at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    actorUserId: 'venue_staff_1',
    actorRole: 'venue_staff',
    reservationId: 'res2',
    customerName: 'Doğu Şampiyonları',
    method: 'cash',
    amount: 1800,
    note: 'Tam ödeme',
  },
  {
    id: 'ce2',
    venueId: 'v1',
    at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actorUserId: 'venue_staff_1',
    actorRole: 'venue_staff',
    customerName: 'Batı Kartalları',
    method: 'card',
    amount: 900,
    note: 'Kapora',
  },
];

export const MOCK_DAY_CLOSES: DayClose[] = [];

// ── MAINTENANCE ───────────────────────────────────────────────────────────────
export const MOCK_MAINTENANCE_TASKS: MaintenanceTask[] = [
  {
    id: 'mt1',
    venueId: 'v1',
    title: 'Çim Yenileme',
    description: 'Kuzey sahası çim zemin yenilenmesi',
    startDate: '2026-03-20',
    endDate: '2026-03-21',
    startTime: '08:00',
    endTime: '18:00',
    status: 'open',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdByUserId: 'venue_owner_1',
  },
];

export const MOCK_ISSUE_TICKETS: IssueTicket[] = [
  {
    id: 'it1',
    venueId: 'v1',
    title: 'Kale direği hasarlı',
    description: 'Güney sahası sol kale direği deforme olmuş',
    status: 'open',
    priority: 'high',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    createdByUserId: 'venue_staff_1',
  },
];

// ── MESSAGE TEMPLATES ─────────────────────────────────────────────────────────
export const MOCK_MESSAGE_TEMPLATES: MessageTemplate[] = [
  { id: 'tpl1', venueId: 'v1', key: 'CONFIRMED', title: 'Rezervasyon Onayı', body: 'Merhaba {customerName}! {venueName} için {date} tarihli {time} saatindeki rezervasyonunuz onaylandı. Bizi tercih ettiğiniz için teşekkürler 🎉', createdAt: new Date().toISOString() },
  { id: 'tpl2', venueId: 'v1', key: 'CANCELLED', title: 'İptal Bildirimi', body: 'Merhaba {customerName}, {date} tarihli {time} rezervasyonunuz maalesef iptal edildi. Yeniden rezervasyon için bizi arayabilirsiniz.', createdAt: new Date().toISOString() },
  { id: 'tpl3', venueId: 'v1', key: 'REMINDER_24H', title: '24 Saat Hatırlatma', body: 'Hatırlatma 📅 Merhaba {customerName}! Yarın {time} {venueName} rezervasyonunuz var. Görüşmek üzere!', createdAt: new Date().toISOString() },
  { id: 'tpl4', venueId: 'v1', key: 'REMINDER_3H', title: '3 Saat Hatırlatma', body: '⚽ Merhaba {customerName}! {time} rezervasyonunuz 3 saat sonra. Check-in kodunuz: {checkInCode}', createdAt: new Date().toISOString() },
  { id: 'tpl5', venueId: 'v1', key: 'DEPOSIT_PENDING', title: 'Kapora Bekleniyor', body: 'Merhaba {customerName}, {date} {time} rezervasyonunuz için {depositAmount}₺ kapora ödemeniz beklenmektedir. IBAN: {iban}', createdAt: new Date().toISOString() },
  { id: 'tpl6', venueId: 'v1', key: 'MAINTENANCE_NOTICE', title: 'Bakım Bildirimi', body: 'Sayın {customerName}, {date} tarihinde {venueName} bakım nedeniyle hizmet veremeyecektir. Yeni randevu için lütfen iletişime geçin.', createdAt: new Date().toISOString() },
];

export const MOCK_OUTBOX: OutboxMessage[] = [];
