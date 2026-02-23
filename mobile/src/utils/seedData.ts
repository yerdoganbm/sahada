/**
 * Seed Data – Tüm roller için örnek veriler
 * 
 * Kullanım: Firestore Console'da veya Admin SDK ile kullanılabilir.
 * Bu dosya Firestore'a örnek data eklemek için rehber niteliğindedir.
 * 
 * Test Kullanıcıları (phone ile giriş):
 *   Admin:       0532 000 0001
 *   Kaptan:      0532 000 0002
 *   Üye:         0532 000 0003
 *   Üye 2:       0532 000 0004
 *   Venue Owner: 0532 000 0005
 *   Scout:       0532 000 0006
 */

export const SAMPLE_TEAM = {
  name: 'Kuzey Yıldızları FC',
  shortName: 'KYF',
  inviteCode: 'KYF-2024',
  primaryColor: '#10B981',
  secondaryColor: '#0B0F1A',
  createdAt: new Date().toISOString(),
};

export const SAMPLE_USERS = [
  {
    name: 'Ali Yönetici',
    phone: '05320000001',
    email: 'admin@sahada.app',
    role: 'admin',
    isCaptain: true,
    position: 'MID',
    rating: 8,
    reliability: 98,
    tier: 'partner',
    avatar: 'https://i.pravatar.cc/150?u=admin1',
    shirtNumber: 10,
    whatsappEnabled: true,
  },
  {
    name: 'Mehmet Kaptan',
    phone: '05320000002',
    email: 'kaptan@sahada.app',
    role: 'member',
    isCaptain: true,
    position: 'DEF',
    rating: 7.5,
    reliability: 95,
    tier: 'premium',
    avatar: 'https://i.pravatar.cc/150?u=kaptan2',
    shirtNumber: 5,
    whatsappEnabled: true,
  },
  {
    name: 'Ahmet Üye',
    phone: '05320000003',
    email: 'uye1@sahada.app',
    role: 'member',
    isCaptain: false,
    position: 'FWD',
    rating: 7.0,
    reliability: 90,
    tier: 'free',
    avatar: 'https://i.pravatar.cc/150?u=uye3',
    shirtNumber: 9,
    whatsappEnabled: false,
  },
  {
    name: 'Can Orta Saha',
    phone: '05320000004',
    email: 'uye2@sahada.app',
    role: 'member',
    isCaptain: false,
    position: 'MID',
    rating: 6.5,
    reliability: 85,
    tier: 'free',
    avatar: 'https://i.pravatar.cc/150?u=uye4',
    shirtNumber: 8,
    whatsappEnabled: true,
  },
  {
    name: 'Kerim Kaleci',
    phone: '05320000005',
    email: 'gk@sahada.app',
    role: 'member',
    isCaptain: false,
    position: 'GK',
    rating: 8.5,
    reliability: 100,
    tier: 'premium',
    avatar: 'https://i.pravatar.cc/150?u=gk5',
    shirtNumber: 1,
    whatsappEnabled: true,
  },
  {
    name: 'Emre Defans',
    phone: '05320000006',
    email: 'def@sahada.app',
    role: 'member',
    isCaptain: false,
    position: 'DEF',
    rating: 6.0,
    reliability: 75,
    tier: 'free',
    avatar: 'https://i.pravatar.cc/150?u=def6',
    shirtNumber: 4,
    whatsappEnabled: false,
  },
  {
    name: 'Burak Forvet',
    phone: '05320000007',
    email: 'fwd@sahada.app',
    role: 'member',
    isCaptain: false,
    position: 'FWD',
    rating: 7.8,
    reliability: 88,
    tier: 'free',
    avatar: 'https://i.pravatar.cc/150?u=fwd7',
    shirtNumber: 11,
    whatsappEnabled: false,
  },
  {
    name: 'Saha Sahibi',
    phone: '05320000008',
    email: 'venue@sahada.app',
    role: 'venue_owner',
    isCaptain: false,
    position: 'MID',
    rating: 5,
    reliability: 100,
    tier: 'partner',
    avatar: 'https://i.pravatar.cc/150?u=venue8',
    shirtNumber: null,
    whatsappEnabled: true,
  },
];

export const SAMPLE_VENUES = [
  {
    name: 'Kuzey Spor Tesisi',
    location: 'Beşiktaş, İstanbul',
    address: 'Barbaros Bulvarı No:45, Beşiktaş',
    pricePerHour: 1200,
    rating: 4.8,
    features: ['Halı saha', 'Aydınlatma', 'Duş', 'Otopark', 'Kafeterya'],
    primaryImageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
  },
  {
    name: 'Anadolu Futbol Merkezi',
    location: 'Kadıköy, İstanbul',
    address: 'Moda Caddesi No:12, Kadıköy',
    pricePerHour: 900,
    rating: 4.5,
    features: ['Halı saha', 'Aydınlatma', 'Duş'],
    primaryImageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
  },
  {
    name: 'Europol Spor Kompleksi',
    location: 'Ataşehir, İstanbul',
    address: 'Ataşehir Bulvarı No:78',
    pricePerHour: 1500,
    rating: 4.9,
    features: ['Halı saha', 'Aydınlatma', 'Duş', 'Otopark', 'Soyunma Odası', 'Kafeterya', 'Tribün'],
    primaryImageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
  },
];

export const SAMPLE_MATCHES = [
  {
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    time: '20:00',
    venue: 'Kuzey Spor Tesisi',
    location: 'Beşiktaş, İstanbul',
    status: 'upcoming',
    capacity: 14,
    pricePerPerson: 120,
    attendees: [
      { playerId: 'ADMIN_ID', status: 'YES' },
      { playerId: 'KAPTAN_ID', status: 'YES' },
      { playerId: 'UYE1_ID', status: 'YES' },
      { playerId: 'UYE2_ID', status: 'MAYBE' },
    ],
  },
  {
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    time: '19:30',
    venue: 'Anadolu Futbol Merkezi',
    location: 'Kadıköy, İstanbul',
    status: 'upcoming',
    capacity: 12,
    pricePerPerson: 100,
    attendees: [],
  },
  {
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    time: '20:00',
    venue: 'Europol Spor Kompleksi',
    location: 'Ataşehir, İstanbul',
    status: 'completed',
    score: '6-4',
    capacity: 14,
    pricePerPerson: 150,
    attendees: [],
    mvpWinner: 'ADMIN_ID',
  },
];

export const SAMPLE_PAYMENTS = [
  { playerName: 'Ali Yönetici', amount: 120, status: 'PAID', month: '2025-01' },
  { playerName: 'Mehmet Kaptan', amount: 120, status: 'PAID', month: '2025-01' },
  { playerName: 'Ahmet Üye', amount: 120, status: 'PENDING', month: '2025-01' },
  { playerName: 'Can Orta Saha', amount: 120, status: 'PENDING', month: '2025-01' },
  { playerName: 'Ali Yönetici', amount: 120, status: 'PAID', month: '2024-12' },
  { playerName: 'Mehmet Kaptan', amount: 120, status: 'PAID', month: '2024-12' },
];

export const SAMPLE_TRANSACTIONS = [
  { type: 'income', category: 'aidat', amount: 960, date: '2025-01-15', description: 'Ocak 2025 aidatları (8 oyuncu)' },
  { type: 'expense', category: 'saha_kirasi', amount: -1200, date: '2025-01-10', description: 'Kuzey Spor Tesisi kirasıI' },
  { type: 'expense', category: 'ekipman', amount: -350, date: '2025-01-05', description: 'Forma seti (7 adet)' },
  { type: 'income', category: 'gelir', amount: 500, date: '2024-12-20', description: 'Turnuva ödülü' },
  { type: 'expense', category: 'saha_kirasi', amount: -1200, date: '2024-12-15', description: 'Aralık saha kirası' },
];

export const SAMPLE_POLLS = [
  {
    question: 'Bir sonraki maç hangi saatte olsun?',
    options: [
      { id: '1', text: '19:00', votes: 3 },
      { id: '2', text: '20:00', votes: 5 },
      { id: '3', text: '21:00', votes: 2 },
    ],
    totalVotes: 10,
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    voters: [],
  },
  {
    question: 'Yeni forma rengi ne olsun?',
    options: [
      { id: '1', text: 'Yeşil-Siyah', votes: 6 },
      { id: '2', text: 'Kırmızı-Beyaz', votes: 4 },
      { id: '3', text: 'Lacivert-Sarı', votes: 2 },
    ],
    totalVotes: 12,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    voters: [],
  },
];

export const SAMPLE_SUBSCRIPTION_PLANS = [
  {
    name: 'Starter',
    tier: 'free',
    price: 0,
    description: 'Temel futbol yönetim özellikleri ücretsiz.',
    features: [
      'Maç takibi (aylık 5)',
      'Profil & istatistikler',
      'RSVP katılım',
      'Kadro görüntüleme',
    ],
  },
  {
    name: 'Pro Baller',
    tier: 'premium',
    price: 149,
    description: 'Ciddi takımlar için. Sınırsız maç ve gelişmiş özellikler.',
    features: [
      'Sınırsız maç takibi',
      'Gelişmiş istatistikler',
      'Kadro yönetimi & paylaşım',
      'Saha rezervasyonu',
      'Takım sohbeti',
      'Turnuva modülü',
    ],
  },
  {
    name: 'Saha Partner',
    tier: 'partner',
    price: 499,
    description: 'Tesis sahipleri ve büyük kulüpler için tam paket.',
    features: [
      'Tüm Pro özellikler',
      'Tesis yönetim paneli',
      'Rezervasyon yönetimi',
      'Gelir/gider raporları',
      'WhatsApp entegrasyonu',
      'Müşteri yönetimi CRM',
      'Öncelikli destek',
    ],
  },
];

export const SAMPLE_NOTIFICATIONS = [
  { type: 'match', title: 'Maç Hatırlatması', message: 'Yarın saat 20:00\'de maçınız var. Kuzey Spor Tesisi.', read: false },
  { type: 'payment', title: 'Aidat Hatırlatması', message: 'Ocak ayı aidatınız henüz ödenmedi. Lütfen en geç 15 Ocak\'a kadar yatırın.', read: false },
  { type: 'squad', title: 'Kadro Açıklandı', message: 'Yarınki maç için kadro güncellendi. Dizilişi kontrol edin.', read: true },
  { type: 'social', title: 'Yeni Katılım İsteği', message: 'Mert Demir takıma katılmak için başvurdu.', read: false },
  { type: 'system', title: 'Sahada\'ya Hoş Geldiniz!', message: 'Takımınızı yöneterek sahada farkı yaratın.', read: true },
];
