/**
 * Sahada – Firestore seed script
 * Örnek verileri Firestore'a yükler. Çalıştırma: npm run seed:firestore
 *
 * Gereksinimler:
 * 1. firebase-admin yüklü (npm install firebase-admin)
 * 2. Firebase Console → Proje Ayarları → Service Accounts → "Generate new private key"
 * 3. İndirilen JSON'u proje köküne koy: service-account.json
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

async function seed() {
  console.log('🌱 Firestore seed başlıyor...\n');

  const teamRef = await db.collection('teams').add({
    name: 'Sahada Demo Takım',
    shortName: 'SDT',
    inviteCode: 'DEMO2025',
    primaryColor: '#10B981',
    secondaryColor: '#0B0F1A',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const teamId = teamRef.id;
  console.log('✅ teams:', teamId);

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
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✅ users:', user1Ref.id, user2Ref.id, user3Ref.id);

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
  console.log('✅ venues:', venue1Ref.id, venue2Ref.id);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const matchDate = tomorrow.toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const pastDate = yesterday.toISOString().slice(0, 10);

  await db.collection('matches').add({
    teamId,
    venueId: venue1Ref.id,
    matchDate,
    matchTime: '20:00',
    date: matchDate,
    time: '20:00',
    location: 'Kadıköy',
    venue: 'Olimpik Halı Saha',
    status: 'upcoming',
    pricePerPerson: 120,
    capacity: 14,
    attendees: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await db.collection('matches').add({
    teamId,
    venueId: venue2Ref.id,
    matchDate: pastDate,
    matchTime: '21:00',
    date: pastDate,
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
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✅ matches: 2 doküman');

  await db.collection('join_requests').add({
    teamId,
    name: 'Ali Veli',
    phone: '05321112233',
    position: 'MID',
    status: 'pending',
    avatar: 'https://i.pravatar.cc/150?u=ali',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✅ join_requests: 1 doküman');

  await db.collection('notifications').add({
    type: 'match',
    title: 'Maç hatırlatması',
    message: 'Yarın 20:00 maçına 2 saat kaldı.',
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await db.collection('notifications').add({
    type: 'payment',
    title: 'Ödeme hatırlatması',
    message: 'Bu ayın aidat ödemesi bekleniyor.',
    isRead: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✅ notifications: 2 doküman');

  await db.collection('payments').add({
    playerId: user1Ref.id,
    playerName: 'Demo Admin',
    teamId,
    amount: 150,
    status: 'PAID',
    month: '2025-02',
  });
  await db.collection('payments').add({
    playerId: user2Ref.id,
    playerName: 'Mehmet Demir',
    teamId,
    amount: 150,
    status: 'PENDING',
    month: '2025-02',
  });
  console.log('✅ payments: 2 doküman');

  await db.collection('transactions').add({
    teamId,
    type: 'income',
    category: 'gelir',
    amount: 2100,
    date: '2025-02-12',
    description: '14 Oyuncu Katılımı',
  });
  await db.collection('transactions').add({
    teamId,
    type: 'expense',
    category: 'saha_kirasi',
    amount: -1800,
    date: '2025-02-12',
    description: 'Saha Kirası',
  });
  console.log('✅ transactions: 2 doküman');

  await db.collection('polls').add({
    teamId,
    question: "Bu haftanın MVP'si kim?",
    options: [
      { id: 'o1', text: 'Ahmet', votes: 5 },
      { id: 'o2', text: 'Mehmet', votes: 2 },
    ],
    totalVotes: 7,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✅ polls: 1 doküman');

  console.log('\n🎉 Seed tamamlandı!');
  console.log('Giriş: telefon 05321234567 veya user ID:', user1Ref.id);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
