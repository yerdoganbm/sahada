/**
 * subscription_plans koleksiyonuna SADECE örnek planları ekler.
 * Mevcut veritabanı ve diğer koleksiyonlara DOKUNMAZ.
 *
 * Çalıştırma: npm run seed:subscription-plans
 *
 * Gereksinimler:
 * - service-account.json (veya GOOGLE_APPLICATION_CREDENTIALS)
 * - firebase-admin yüklü
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, '..', 'service-account.json');
const projectId = process.env.FIREBASE_PROJECT_ID || 'sahada-16b2d';

if (fs.existsSync(credPath)) {
  const serviceAccount = require(credPath);
  const pid = serviceAccount.project_id || projectId;
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: pid });
  }
} else {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId });
  }
}

const db = admin.firestore();
const ts = () => admin.firestore.FieldValue.serverTimestamp();

const PLANS = [
  {
    name: 'Ücretsiz',
    tier: 'free',
    price: 0,
    description: 'Temel takım yönetimi',
    features: ['Maç takvimi', 'Kadro listesi', 'Temel istatistikler'],
  },
  {
    name: 'Premium',
    tier: 'premium',
    price: 49,
    description: 'Gelişmiş özellikler',
    features: ['Tüm Ücretsiz özellikler', 'WhatsApp bildirimleri', 'Ödeme takibi', 'Rezervasyon yönetimi'],
  },
  {
    name: 'Partner',
    tier: 'partner',
    price: 149,
    description: 'Saha sahipleri için',
    features: ['Tüm Premium özellikler', 'Çoklu saha', 'Finansal raporlar', 'Öncelikli destek'],
  },
];

async function seedSubscriptionPlans() {
  console.log('🌱 subscription_plans koleksiyonuna planlar ekleniyor...\n');

  const col = db.collection('subscription_plans');

  for (const plan of PLANS) {
    await col.add({
      ...plan,
      createdAt: ts(),
    });
  }

  console.log('✅ subscription_plans: 3 doküman eklendi');
  console.log('   - Ücretsiz (0₺)');
  console.log('   - Premium (49₺/ay)');
  console.log('   - Partner (149₺/ay)');
  console.log('\nMevcut veritabanı ve diğer koleksiyonlar değiştirilmedi.');
  process.exit(0);
}

seedSubscriptionPlans().catch((err) => {
  console.error('Hata:', err);
  process.exit(1);
});
