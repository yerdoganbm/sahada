/**
 * Firestore'dan belirtilen koleksiyonları siler.
 * Sadece verilen koleksiyonlardaki tüm dokümanları siler, diğerlerine dokunmaz.
 *
 * Kullanım:
 *   node scripts/delete-collections.cjs matches
 *   node scripts/delete-collections.cjs matches notifications
 *   npm run delete:collections -- matches notifications
 *
 * Gereksinim: service-account.json veya GOOGLE_APPLICATION_CREDENTIALS
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

async function deleteCollection(colName) {
  const col = db.collection(colName);
  let deleted = 0;
  const BATCH_SIZE = 500;
  let snap = await col.limit(BATCH_SIZE).get();
  while (!snap.empty) {
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snap.docs.length;
    snap = await col.limit(BATCH_SIZE).get();
  }
  return deleted;
}

async function main() {
  // process.argv: [node, script.js, col1, col2, ...]
  const collections = process.argv.slice(2).filter(Boolean);

  if (collections.length === 0) {
    console.log('Kullanım: node scripts/delete-collections.cjs <koleksiyon1> [koleksiyon2] ...');
    console.log('Örnek: node scripts/delete-collections.cjs matches notifications');
    console.log('       npm run delete:collections -- matches');
    process.exit(1);
  }

  console.log('🗑️  Silinecek koleksiyonlar:', collections.join(', '));
  console.log('');

  let total = 0;
  for (const name of collections) {
    const n = await deleteCollection(name);
    console.log(`   ${name}: ${n} doküman silindi`);
    total += n;
  }

  console.log('');
  console.log(`✅ Toplam ${total} doküman silindi.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Hata:', err);
  process.exit(1);
});
