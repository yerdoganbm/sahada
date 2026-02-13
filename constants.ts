
import { Match, Player, Payment, Venue, Transaction, Poll, TournamentTeam, BracketMatch } from './types';

export const MOCK_PLAYERS: Player[] = [
  { 
    id: '1', name: 'Ahmet Yılmaz', position: 'MID', rating: 8.5, reliability: 95, avatar: 'https://i.pravatar.cc/150?u=1', isCaptain: true, role: 'admin', tier: 'free', marketValue: '2.5M',
    attributes: { pac: 82, sho: 85, pas: 88, dri: 84, def: 60, phy: 70 }
  },
  { 
    id: '2', name: 'Mehmet Demir', position: 'FWD', rating: 9.0, reliability: 88, avatar: 'https://i.pravatar.cc/150?u=2', role: 'member', tier: 'free', marketValue: '3.0M',
    attributes: { pac: 90, sho: 92, pas: 75, dri: 88, def: 40, phy: 75 }
  },
  { 
    id: '3', name: 'Caner Erkin', position: 'DEF', rating: 7.8, reliability: 92, avatar: 'https://i.pravatar.cc/150?u=3', role: 'member', tier: 'free', marketValue: '1.2M',
    attributes: { pac: 75, sho: 60, pas: 78, dri: 70, def: 85, phy: 80 }
  },
  { 
    id: '4', name: 'Volkan Babacan', position: 'GK', rating: 8.2, reliability: 100, avatar: 'https://i.pravatar.cc/150?u=4', role: 'member', tier: 'premium', marketValue: '1.8M',
    attributes: { pac: 50, sho: 50, pas: 60, dri: 50, def: 88, phy: 85 }
  },
  { id: '5', name: 'Ozan Tufan', position: 'MID', rating: 7.5, reliability: 75, avatar: 'https://i.pravatar.cc/150?u=5', role: 'member', tier: 'free', marketValue: '900K' },
  { id: '6', name: 'Hakan Çalhanoğlu', position: 'MID', rating: 9.2, reliability: 98, avatar: 'https://i.pravatar.cc/150?u=6', role: 'admin', tier: 'partner', marketValue: '5.0M' },
  { id: '7', name: 'Burak Yılmaz', position: 'FWD', rating: 8.1, reliability: 85, avatar: 'https://i.pravatar.cc/150?u=7', role: 'member', isCaptain: true, tier: 'free' },
  { id: '8', name: 'Çağlar Söyüncü', position: 'DEF', rating: 8.8, reliability: 90, avatar: 'https://i.pravatar.cc/150?u=8', role: 'member', tier: 'premium' },
  { id: '9', name: 'Merih Demiral', position: 'DEF', rating: 8.6, reliability: 82, avatar: 'https://i.pravatar.cc/150?u=9', role: 'member', tier: 'free' },
  { id: '10', name: 'Cengiz Ünder', position: 'FWD', rating: 8.3, reliability: 78, avatar: 'https://i.pravatar.cc/150?u=10', role: 'member', tier: 'free' },
  { id: '11', name: 'Uğurcan Çakır', position: 'GK', rating: 8.4, reliability: 96, avatar: 'https://i.pravatar.cc/150?u=11', role: 'member', tier: 'premium' },
  { id: '12', name: 'İrfan Can', position: 'MID', rating: 7.9, reliability: 88, avatar: 'https://i.pravatar.cc/150?u=12', role: 'member', tier: 'free' },
  { id: '13', name: 'Mert Müldür', position: 'DEF', rating: 7.6, reliability: 91, avatar: 'https://i.pravatar.cc/150?u=13', role: 'member', tier: 'free' },
  { id: '14', name: 'Orkun Kökçü', position: 'MID', rating: 8.0, reliability: 84, avatar: 'https://i.pravatar.cc/150?u=14', role: 'member', tier: 'free' },
  { id: '15', name: 'Yusuf Yazıcı', position: 'MID', rating: 7.7, reliability: 65, avatar: 'https://i.pravatar.cc/150?u=15', role: 'member', tier: 'free' },
  { id: '16', name: 'Enes Ünal', position: 'FWD', rating: 7.5, reliability: 70, avatar: 'https://i.pravatar.cc/150?u=16', role: 'member', tier: 'free' },
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
    name: 'Şampiyon Halı Saha',
    district: 'Kadıköy',
    address: 'Fenerbahçe Mah. Kalamış Cad. No:88',
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    price: 1200,
    rating: 4.8,
    status: 'active',
    features: ['Otopark', 'Duş', 'Kafe', 'Krampon Kiralama'],
    phone: '0216 123 45 67',
    capacity: '7v7',
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
    }
  },
  {
    id: 'v3',
    name: 'Körfez Spor Tesisi',
    district: 'Üsküdar',
    address: 'Sahil Yolu Cad. No:12',
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    price: 900,
    rating: 4.2,
    status: 'price_update',
    features: ['Otopark'],
    phone: '0216 555 66 77',
    capacity: '6v6',
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
