/**
 * seed-firestore.ts — Mock verileri Firestore'a yükler
 *
 * Kullanım:
 *   1. serviceAccountKey.json dosyasını proje kökine koyun (repo'ya EKLEMEYİN)
 *   2. npx ts-node scripts/seed-firestore.ts
 *
 * Gereksinim: npm install -D ts-node firebase-admin @types/node
 */
import * as admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json';
import {
  MOCK_VENUES, MOCK_TEAMS, MOCK_RESERVATIONS,
  MOCK_PLAYERS, MOCK_CAPTAIN_PLANS, MOCK_MEMBER_CONTRIBUTIONS,
  MOCK_OUTBOX, MOCK_AUDIT,
} from '../constants';

admin.initializeApp({ credential: admin.credential.cert(serviceAccount as any) });
const db = admin.firestore();

async function seedCollection(colName: string, docs: any[]) {
  const batch = db.batch();
  docs.forEach(d => {
    const ref = db.collection(colName).doc(d.id ?? db.collection(colName).doc().id);
    batch.set(ref, { ...d, seededAt: admin.firestore.FieldValue.serverTimestamp() });
  });
  await batch.commit();
  console.log(`✅  ${colName}: ${docs.length} docs`);
}

async function main() {
  console.log('🌱 Seeding Firestore...\n');
  await seedCollection('venues',              MOCK_VENUES);
  await seedCollection('teams',               MOCK_TEAMS);
  await seedCollection('reservations',        MOCK_RESERVATIONS);
  await seedCollection('users',               MOCK_PLAYERS);
  await seedCollection('captainPaymentPlans', MOCK_CAPTAIN_PLANS);
  await seedCollection('memberContributions', MOCK_MEMBER_CONTRIBUTIONS);
  await seedCollection('outbox',              MOCK_OUTBOX);
  await seedCollection('audit',               MOCK_AUDIT);
  console.log('\n🎉 Seed tamamlandı!');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
