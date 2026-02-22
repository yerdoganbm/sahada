/**
 * Sahada – Firestore seed script
 * Örnek verileri Firestore'a yükler. Çalıştırma: npm run seed:firestore
 *
 * Gereksinimler:
 * 1. firebase-admin yüklü (npm install firebase-admin)
 * 2. Firebase Console → Proje Ayarları → Service Accounts → "Generate new private key"
 * 3. İndirilen JSON'u proje köküne koy: service-account.json
 *
 * Firebase CLI ile: firebase use <project-id> && node scripts/seed-firestore.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

const fs = require('fs');
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, '..', 'service-account.json');
let projectId = process.env.FIREBASE_PROJECT_ID || 'sahada-16b2d';

if (fs.existsSync(credPath)) {
  const serviceAccount = require(credPath);
  projectId = serviceAccount.project_id || projectId;
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId });
} else {
  admin.initializeApp({ projectId });
  console.log('Cloud Shell / ADC ile bağlanıyor (service-account.json yok)...\n');
}

const db = admin.firestore();
const ts = () => admin.firestore.FieldValue.serverTimestamp();

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}

async function seed() {
  console.log('🌱 Firestore seed başlıyor...\n');

  // --- TEAMS (2 takım) ---
  const team1Ref = await db.collection('teams').add({
    name: 'Sahada Demo Takım',
    shortName: 'SDT',
    inviteCode: 'DEMO2025',
    primaryColor: '#10B981',
    secondaryColor: '#0B0F1A',
    createdAt: ts(),
  });
  const team2Ref = await db.collection('teams').add({
    name: 'Yeşil Sahalar FC',
    shortName: 'YSF',
    inviteCode: 'YSF2025',
    primaryColor: '#22C55E',
    secondaryColor: '#14532D',
    createdAt: ts(),
  });
  const teamId = team1Ref.id;
  const team2Id = team2Ref.id;
  console.log('✅ teams: 2 doküman');

  // --- USERS (8 kullanıcı – 6 takım1, 2 takım2) ---
  const user1Ref = await db.collection('users').add({
    name: 'Demo Admin',
    phone: '05321234567',
    email: 'admin@demo.com',
    role: 'admin',
    position: 'MID',
    rating: 7,
    reliability: 100,
    teamId,
    avatar: 'https://i.pravatar.cc/150?u=admin',
    isCaptain: true,
    tier: 'premium',
    createdAt: ts(),
  });
  const user2Ref = await db.collection('users').add({
    name: 'Mehmet Demir',
    phone: '05329876543',
    email: 'mehmet@demo.com',
    role: 'member',
    position: 'FWD',
    rating: 6.5,
    reliability: 90,
    teamId,
    avatar: 'https://i.pravatar.cc/150?u=mehmet',
    shirtNumber: 10,
    tier: 'free',
    createdAt: ts(),
  });
  const user3Ref = await db.collection('users').add({
    name: 'Caner Erkin',
    phone: '05335556677',
    email: 'caner@demo.com',
    role: 'member',
    position: 'DEF',
    rating: 7.2,
    reliability: 95,
    teamId,
    avatar: 'https://i.pravatar.cc/150?u=caner',
    shirtNumber: 3,
    tier: 'free',
    createdAt: ts(),
  });
  const user4Ref = await db.collection('users').add({
    name: 'Burak Yılmaz',
    phone: '05334445566',
    email: 'burak@demo.com',
    role: 'member',
    position: 'FWD',
    rating: 7.8,
    reliability: 92,
    teamId,
    avatar: 'https://i.pravatar.cc/150?u=burak',
    shirtNumber: 9,
    tier: 'free',
    createdAt: ts(),
  });
  const user5Ref = await db.collection('users').add({
    name: 'Ahmet Kaya',
    phone: '05337778899',
    email: 'ahmet@demo.com',
    role: 'member',
    position: 'GK',
    rating: 6.8,
    reliability: 88,
    teamId,
    avatar: 'https://i.pravatar.cc/150?u=ahmet',
    shirtNumber: 1,
    tier: 'free',
    createdAt: ts(),
  });
  const user6Ref = await db.collection('users').add({
    name: 'Emre Özkan',
    phone: '05331112233',
    email: 'emre@demo.com',
    role: 'member',
    position: 'MID',
    rating: 7.0,
    reliability: 85,
    teamId,
    avatar: 'https://i.pravatar.cc/150?u=emre',
    shirtNumber: 8,
    tier: 'free',
    createdAt: ts(),
  });
  const user7Ref = await db.collection('users').add({
    name: 'Fatih Arda',
    phone: '05336667788',
    email: 'fatih@demo.com',
    role: 'admin',
    position: 'DEF',
    rating: 7.5,
    reliability: 98,
    teamId: team2Id,
    avatar: 'https://i.pravatar.cc/150?u=fatih',
    isCaptain: true,
    tier: 'premium',
    createdAt: ts(),
  });
  const user8Ref = await db.collection('users').add({
    name: 'Kerem Aksoy',
    phone: '05332223344',
    email: 'kerem@demo.com',
    role: 'member',
    position: 'MID',
    rating: 6.9,
    reliability: 91,
    teamId: team2Id,
    avatar: 'https://i.pravatar.cc/150?u=kerem',
    shirtNumber: 7,
    tier: 'free',
    createdAt: ts(),
  });
  console.log('✅ users: 8 doküman');

  // --- VENUES (4 saha) ---
  const venue1Ref = await db.collection('venues').add({
    name: 'Olimpik Halı Saha',
    location: 'Kadıköy',
    address: 'Fenerbahçe Mah. Kalamış Cad. No:88',
    pricePerHour: 1200,
    rating: 4.8,
    primaryImageUrl: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400',
    features: ['Otopark', 'Duş', 'Kafe'],
  });
  const venue2Ref = await db.collection('venues').add({
    name: 'Merkez Arena',
    location: 'Beşiktaş',
    pricePerHour: 1000,
    rating: 4.5,
    features: ['Duş'],
  });
  const venue3Ref = await db.collection('venues').add({
    name: 'Yeşil Vadi Saha',
    location: 'Şişli',
    address: 'Mecidiyeköy Mah. Arena Cad. No:12',
    pricePerHour: 950,
    rating: 4.6,
    primaryImageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
    features: ['Otopark', 'Duş', 'Kantin'],
  });
  const venue4Ref = await db.collection('venues').add({
    name: 'Batı Stadyumu',
    location: 'Bakırköy',
    pricePerHour: 1100,
    rating: 4.7,
    features: ['Otopark', 'Duş', 'Tribün'],
  });
  console.log('✅ venues: 4 doküman');

  const today = addDays(new Date(), 0);
  const tomorrow = addDays(new Date(), 1);
  const nextWeek = addDays(new Date(), 7);
  const yesterday = addDays(new Date(), -1);
  const lastWeek = addDays(new Date(), -7);

  // --- MATCHES (6 maç) ---
  await db.collection('matches').add({
    teamId,
    venueId: venue1Ref.id,
    matchDate: tomorrow,
    matchTime: '20:00',
    date: tomorrow,
    time: '20:00',
    location: 'Kadıköy',
    venue: 'Olimpik Halı Saha',
    status: 'upcoming',
    pricePerPerson: 120,
    capacity: 14,
    attendees: [],
    createdAt: ts(),
  });
  await db.collection('matches').add({
    teamId,
    venueId: venue1Ref.id,
    matchDate: nextWeek,
    matchTime: '19:00',
    date: nextWeek,
    time: '19:00',
    location: 'Kadıköy',
    venue: 'Olimpik Halı Saha',
    status: 'upcoming',
    pricePerPerson: 120,
    capacity: 14,
    attendees: [
      { playerId: user1Ref.id, status: 'YES' },
      { playerId: user2Ref.id, status: 'YES' },
      { playerId: user3Ref.id, status: 'MAYBE' },
    ],
    createdAt: ts(),
  });
  await db.collection('matches').add({
    teamId,
    venueId: venue2Ref.id,
    matchDate: yesterday,
    matchTime: '21:00',
    date: yesterday,
    time: '21:00',
    location: 'Beşiktaş',
    venue: 'Merkez Arena',
    status: 'completed',
    score: '3-2',
    pricePerPerson: 150,
    capacity: 14,
    attendees: [
      { playerId: user1Ref.id, status: 'YES' },
      { playerId: user2Ref.id, status: 'YES' },
      { playerId: user3Ref.id, status: 'YES' },
    ],
    createdAt: ts(),
  });
  await db.collection('matches').add({
    teamId,
    venueId: venue3Ref.id,
    matchDate: lastWeek,
    matchTime: '20:30',
    date: lastWeek,
    time: '20:30',
    location: 'Şişli',
    venue: 'Yeşil Vadi Saha',
    status: 'completed',
    score: '2-2',
    pricePerPerson: 130,
    capacity: 14,
    attendees: [
      { playerId: user1Ref.id, status: 'YES' },
      { playerId: user2Ref.id, status: 'YES' },
    ],
    createdAt: ts(),
  });
  await db.collection('matches').add({
    teamId: team2Id,
    venueId: venue2Ref.id,
    matchDate: tomorrow,
    matchTime: '18:00',
    date: tomorrow,
    time: '18:00',
    location: 'Beşiktaş',
    venue: 'Merkez Arena',
    status: 'upcoming',
    pricePerPerson: 110,
    capacity: 14,
    attendees: [],
    createdAt: ts(),
  });
  await db.collection('matches').add({
    teamId: team2Id,
    venueId: venue4Ref.id,
    matchDate: addDays(new Date(), 3),
    matchTime: '19:30',
    date: addDays(new Date(), 3),
    time: '19:30',
    location: 'Bakırköy',
    venue: 'Batı Stadyumu',
    status: 'upcoming',
    pricePerPerson: 125,
    capacity: 14,
    attendees: [],
    createdAt: ts(),
  });
  console.log('✅ matches: 6 doküman');

  // --- JOIN_REQUESTS (3 istek) ---
  await db.collection('join_requests').add({
    teamId,
    name: 'Ali Veli',
    phone: '05321112233',
    position: 'MID',
    status: 'pending',
    avatar: 'https://i.pravatar.cc/150?u=ali',
    createdAt: ts(),
  });
  await db.collection('join_requests').add({
    teamId,
    name: 'Veli Kaya',
    phone: '05329998877',
    position: 'DEF',
    status: 'pending',
    createdAt: ts(),
  });
  await db.collection('join_requests').add({
    teamId: team2Id,
    name: 'Hasan Demir',
    phone: '05328887766',
    position: 'FWD',
    status: 'approved',
    createdAt: ts(),
  });
  console.log('✅ join_requests: 3 doküman');

  // --- NOTIFICATIONS (6 bildirim) ---
  await db.collection('notifications').add({
    type: 'match',
    title: 'Maç hatırlatması',
    message: 'Yarın 20:00 maçına 2 saat kaldı.',
    isRead: false,
    createdAt: ts(),
  });
  await db.collection('notifications').add({
    type: 'payment',
    title: 'Ödeme hatırlatması',
    message: 'Bu ayın aidat ödemesi bekleniyor.',
    isRead: true,
    createdAt: ts(),
  });
  await db.collection('notifications').add({
    type: 'squad',
    title: 'Kadro açıklandı',
    message: 'Ahmet Kaptan kadroyu yayınladı. Katılımını belirt.',
    isRead: false,
    createdAt: ts(),
  });
  await db.collection('notifications').add({
    type: 'match',
    title: 'Maç sonucu',
    message: 'Dünkü maç 3-2 kazandık. Tebrikler!',
    isRead: true,
    createdAt: ts(),
  });
  await db.collection('notifications').add({
    type: 'system',
    title: 'Hoş geldiniz',
    message: 'Sahada uygulamasına hoş geldiniz.',
    isRead: true,
    createdAt: ts(),
  });
  await db.collection('notifications').add({
    type: 'social',
    title: 'Yeni davet',
    message: 'Yeşil Sahalar FC takımına katılmak ister misiniz?',
    isRead: false,
    createdAt: ts(),
  });
  console.log('✅ notifications: 6 doküman');

  // --- PAYMENTS (8 kayıt) ---
  await db.collection('payments').add({
    playerId: user1Ref.id,
    playerName: 'Demo Admin',
    teamId,
    amount: 150,
    status: 'PAID',
    month: '2025-02',
    createdAt: ts(),
  });
  await db.collection('payments').add({
    playerId: user2Ref.id,
    playerName: 'Mehmet Demir',
    teamId,
    amount: 150,
    status: 'PENDING',
    month: '2025-02',
    dueDate: '2025-02-28',
    createdAt: ts(),
  });
  await db.collection('payments').add({
    playerId: user3Ref.id,
    playerName: 'Caner Erkin',
    teamId,
    amount: 150,
    status: 'PAID',
    month: '2025-02',
    createdAt: ts(),
  });
  await db.collection('payments').add({
    playerId: user4Ref.id,
    playerName: 'Burak Yılmaz',
    teamId,
    amount: 150,
    status: 'PENDING',
    month: '2025-02',
    createdAt: ts(),
  });
  await db.collection('payments').add({
    playerId: user5Ref.id,
    playerName: 'Ahmet Kaya',
    teamId,
    amount: 150,
    status: 'PAID',
    month: '2025-01',
    createdAt: ts(),
  });
  await db.collection('payments').add({
    playerId: user6Ref.id,
    playerName: 'Emre Özkan',
    teamId,
    amount: 150,
    status: 'REFUND',
    month: '2024-12',
    createdAt: ts(),
  });
  await db.collection('payments').add({
    playerId: user7Ref.id,
    playerName: 'Fatih Arda',
    teamId: team2Id,
    amount: 120,
    status: 'PAID',
    month: '2025-02',
    createdAt: ts(),
  });
  await db.collection('payments').add({
    playerId: user8Ref.id,
    playerName: 'Kerem Aksoy',
    teamId: team2Id,
    amount: 120,
    status: 'PENDING',
    month: '2025-02',
    createdAt: ts(),
  });
  console.log('✅ payments: 8 doküman');

  // --- TRANSACTIONS (8 işlem) ---
  await db.collection('transactions').add({
    teamId,
    type: 'income',
    category: 'gelir',
    amount: 2100,
    date: '2025-02-12',
    description: '14 Oyuncu Katılımı',
    createdAt: ts(),
  });
  await db.collection('transactions').add({
    teamId,
    type: 'expense',
    category: 'saha_kirasi',
    amount: -1800,
    date: '2025-02-12',
    description: 'Saha Kirası',
    createdAt: ts(),
  });
  await db.collection('transactions').add({
    teamId,
    type: 'income',
    category: 'aidat',
    amount: 600,
    date: '2025-02-10',
    description: '4 Üye Aidat',
    createdAt: ts(),
  });
  await db.collection('transactions').add({
    teamId,
    type: 'expense',
    category: 'ekipman',
    amount: -350,
    date: '2025-02-08',
    description: 'Top ve forma',
    createdAt: ts(),
  });
  await db.collection('transactions').add({
    teamId,
    type: 'income',
    category: 'gelir',
    amount: 1500,
    date: '2025-01-25',
    description: 'Ocak Aidatları',
    createdAt: ts(),
  });
  await db.collection('transactions').add({
    teamId,
    type: 'expense',
    category: 'diger',
    amount: -200,
    date: '2025-01-20',
    description: 'Hakem ücreti',
    createdAt: ts(),
  });
  await db.collection('transactions').add({
    teamId: team2Id,
    type: 'income',
    category: 'aidat',
    amount: 240,
    date: '2025-02-15',
    description: '2 Üye Aidat',
    createdAt: ts(),
  });
  await db.collection('transactions').add({
    teamId: team2Id,
    type: 'expense',
    category: 'saha_kirasi',
    amount: -1000,
    date: '2025-02-14',
    description: 'Merkez Arena Kirası',
    createdAt: ts(),
  });
  console.log('✅ transactions: 8 doküman');

  // --- POLLS (3 anket) ---
  await db.collection('polls').add({
    teamId,
    question: "Bu haftanın MVP'si kim?",
    options: [
      { id: 'o1', text: 'Ahmet', votes: 5 },
      { id: 'o2', text: 'Mehmet', votes: 2 },
      { id: 'o3', text: 'Caner', votes: 3 },
    ],
    totalVotes: 10,
    createdAt: ts(),
  });
  await db.collection('polls').add({
    teamId,
    question: 'Haftalık maç günü tercihiniz?',
    options: [
      { id: 'o1', text: 'Çarşamba', votes: 4 },
      { id: 'o2', text: 'Cumartesi', votes: 6 },
      { id: 'o3', text: 'Pazar', votes: 2 },
    ],
    totalVotes: 12,
    createdAt: ts(),
  });
  await db.collection('polls').add({
    teamId: team2Id,
    question: 'Yeni forma rengi?',
    options: [
      { id: 'o1', text: 'Yeşil-Beyaz', votes: 3 },
      { id: 'o2', text: 'Lacivert', votes: 1 },
    ],
    totalVotes: 4,
    createdAt: ts(),
  });
  console.log('✅ polls: 3 doküman');

  // --- RESERVATIONS (5 rezervasyon) ---
  await db.collection('reservations').add({
    venueId: venue1Ref.id,
    venueName: 'Olimpik Halı Saha',
    teamName: 'Sahada Demo Takım',
    date: tomorrow,
    startTime: '20:00',
    endTime: '21:30',
    duration: 90,
    price: 1800,
    status: 'confirmed',
    participants: 14,
    contactPerson: 'Demo Admin',
    contactPhone: '05321234567',
    paymentStatus: 'PAID',
    createdAt: ts(),
  });
  await db.collection('reservations').add({
    venueId: venue1Ref.id,
    venueName: 'Olimpik Halı Saha',
    date: addDays(new Date(), 2),
    startTime: '19:00',
    endTime: '20:00',
    duration: 60,
    price: 1200,
    status: 'pending',
    createdAt: ts(),
  });
  await db.collection('reservations').add({
    venueId: venue2Ref.id,
    venueName: 'Merkez Arena',
    teamName: 'Yeşil Sahalar FC',
    date: tomorrow,
    startTime: '18:00',
    endTime: '19:00',
    duration: 60,
    price: 1000,
    status: 'confirmed',
    createdAt: ts(),
  });
  await db.collection('reservations').add({
    venueId: venue2Ref.id,
    venueName: 'Merkez Arena',
    date: yesterday,
    startTime: '21:00',
    endTime: '22:30',
    duration: 90,
    price: 1500,
    status: 'completed',
    createdAt: ts(),
  });
  await db.collection('reservations').add({
    venueId: venue3Ref.id,
    venueName: 'Yeşil Vadi Saha',
    date: nextWeek,
    startTime: '20:00',
    endTime: '21:00',
    duration: 60,
    price: 950,
    status: 'pending',
    createdAt: ts(),
  });
  console.log('✅ reservations: 5 doküman');

  // --- TALENT_POOL (4 yetenek) ---
  const talent1Ref = await db.collection('talent_pool').add({
    teamId,
    name: 'Emre Kaya',
    position: 'MID',
    contactNumber: '05327778899',
    avatar: 'https://i.pravatar.cc/150?u=emrek',
    discoveredBy: user1Ref.id,
    discoveredDate: '2025-02-01',
    source: 'referral',
    status: 'in_trial',
    trialMatchesPlayed: 2,
    trialMatchesTotal: 3,
    averageScore: 7.3,
    potentialRating: 8,
  });
  await db.collection('talent_pool').add({
    teamId,
    name: 'Serkan Yıldız',
    position: 'FWD',
    contactNumber: '05325556644',
    status: 'pending_approval',
    source: 'scout',
    potentialRating: 7.5,
  });
  await db.collection('talent_pool').add({
    teamId,
    name: 'Onur Tekin',
    position: 'DEF',
    contactNumber: '05323334455',
    status: 'in_trial',
    trialMatchesPlayed: 1,
    trialMatchesTotal: 3,
    averageScore: 6.8,
  });
  await db.collection('talent_pool').add({
    teamId: team2Id,
    name: 'Mert Çelik',
    position: 'GK',
    status: 'promoted',
    source: 'referral',
    potentialRating: 7.2,
  });
  console.log('✅ talent_pool: 4 doküman');

  // --- SCOUT_REPORTS (3 rapor) ---
  await db.collection('scout_reports').add({
    playerId: talent1Ref.id,
    scoutId: user1Ref.id,
    scoutName: 'Demo Admin',
    date: '2025-02-05',
    overallScore: 7.5,
    potential: 8,
    recommendation: 'sign_now',
    strengths: ['Pas', 'Çalışkanlık', 'Pozisyon bilgisi'],
    weaknesses: ['Şut zayıf'],
    detailedNotes: 'Maçta iyi performans gösterdi. Kadroya alınabilir.',
  });
  await db.collection('scout_reports').add({
    scoutId: user1Ref.id,
    scoutName: 'Demo Admin',
    date: '2025-02-10',
    overallScore: 7.2,
    potential: 7.5,
    recommendation: 'observe',
    strengths: ['Hız', 'Dribling'],
    weaknesses: ['Defans', 'Fizik'],
  });
  await db.collection('scout_reports').add({
    playerId: user3Ref.id,
    scoutId: user1Ref.id,
    scoutName: 'Demo Admin',
    date: '2025-01-20',
    overallScore: 7.8,
    potential: 8.2,
    recommendation: 'sign_now',
    strengths: ['Deneyim', 'Liderlik'],
  });
  console.log('✅ scout_reports: 3 doküman');

  // --- TOURNAMENT_TEAMS (4 takım) ---
  const tourTeam1Ref = await db.collection('tournament_teams').add({
    name: 'Sahada Demo',
    logo: 'https://i.pravatar.cc/150?u=sahada',
    stats: { played: 3, won: 2, drawn: 1, lost: 0, gf: 7, ga: 3, points: 7 },
  });
  const tourTeam2Ref = await db.collection('tournament_teams').add({
    name: 'Yeşil Sahalar FC',
    logo: 'https://i.pravatar.cc/150?u=ysf',
    stats: { played: 3, won: 1, drawn: 1, lost: 1, gf: 4, ga: 4, points: 4 },
  });
  const tourTeam3Ref = await db.collection('tournament_teams').add({
    name: 'Kadıköy Spartak',
    stats: { played: 2, won: 1, drawn: 0, lost: 1, gf: 3, ga: 2, points: 3 },
  });
  const tourTeam4Ref = await db.collection('tournament_teams').add({
    name: 'Beşiktaş United',
    stats: { played: 2, won: 0, drawn: 0, lost: 2, gf: 1, ga: 6, points: 0 },
  });
  console.log('✅ tournament_teams: 4 doküman');

  // --- BRACKET_MATCHES (3 maç – yarı final + final) ---
  await db.collection('bracket_matches').add({
    round: 'semi',
    team1: { id: tourTeam1Ref.id, name: 'Sahada Demo' },
    team2: { id: tourTeam4Ref.id, name: 'Beşiktaş United' },
    winnerId: tourTeam1Ref.id,
    date: addDays(new Date(), 5),
    score: '3-1',
  });
  await db.collection('bracket_matches').add({
    round: 'semi',
    team1: { id: tourTeam2Ref.id, name: 'Yeşil Sahalar FC' },
    team2: { id: tourTeam3Ref.id, name: 'Kadıköy Spartak' },
    winnerId: tourTeam2Ref.id,
    date: addDays(new Date(), 5),
    score: '2-1',
  });
  await db.collection('bracket_matches').add({
    round: 'final',
    team1: { id: tourTeam1Ref.id, name: 'Sahada Demo' },
    team2: { id: tourTeam2Ref.id, name: 'Yeşil Sahalar FC' },
    date: addDays(new Date(), 12),
    status: 'upcoming',
  });
  console.log('✅ bracket_matches: 3 doküman');

  console.log('\n🎉 Seed tamamlandı!');
  console.log('Toplam: teams(2), users(8), venues(4), matches(6), join_requests(3),');
  console.log('        notifications(6), payments(8), transactions(8), polls(3),');
  console.log('        reservations(5), talent_pool(4), scout_reports(3),');
  console.log('        tournament_teams(4), bracket_matches(3)');
  console.log('\nGiriş: telefon 05321234567 veya user ID:', user1Ref.id);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
