/**
 * Sahada – Firestore: Telefon numarasına göre kullanıcıyı owner (role: admin) yapar.
 *
 * Kullanım:
 *   node scripts/set-owner-by-phone.cjs [telefon]
 *   npm run set-owner  [telefon]
 *
 * Varsayılan telefon: 5528804641
 *
 * Gereksinim: service-account.json (veya GOOGLE_APPLICATION_CREDENTIALS)
 * Örnek: firebase use <project-id> && node scripts/set-owner-by-phone.cjs 5528804641
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
const USERS = 'users';

function normalizePhone(phone) {
  const s = String(phone).replace(/\D/g, '');
  if (s.length < 10) return [phone];
  const variants = [s];
  if (!s.startsWith('90') && s.length >= 10) variants.push('90' + s);
  if (!s.startsWith('0')) variants.push('0' + s);
  return [...new Set(variants)];
}

async function setOwnerByPhone(phone) {
  const variants = normalizePhone(phone);
  const col = db.collection(USERS);

  for (const p of variants) {
    const snap = await col.where('phone', '==', p).limit(1).get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      await doc.ref.update({ role: 'admin' });
      const data = doc.data();
      console.log('OK: Owner atandı.');
      console.log('  userId:', doc.id);
      console.log('  phone:', data.phone);
      console.log('  name:', data.name || '(yok)');
      console.log('  role: admin');
      return doc.id;
    }
  }

  console.log('HATA: Bu numarayla kullanıcı bulunamadı:', phone);
  console.log('  Denenen formatlar:', variants.join(', '));
  console.log('  Önce bu numarayla uygulamadan kayıt olun veya users koleksiyonunda phone alanını kontrol edin.');
  process.exit(1);
}

const phone = process.argv[2] || '5528804641';
setOwnerByPhone(phone).then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
