/**
 * Firebase Storage – Dekont/fotoğraf yükleme
 */

import storage from '@react-native-firebase/storage';

const PROOF_PREFIX = 'payment_proofs';

/**
 * Lokal dosya URI'sini Firebase Storage'a yükler, indirme URL'i döner.
 * @param paymentId – Ödeme doküman ID
 * @param localUri – react-native-image-picker'dan gelen file URI (file://... veya content://...)
 */
export async function uploadProofImage(paymentId: string, localUri: string): Promise<string> {
  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${paymentId}_${Date.now()}.${ext}`;
  const ref = storage().ref(`${PROOF_PREFIX}/${filename}`);
  await ref.putFile(localUri);
  const url = await ref.getDownloadURL();
  return url;
}
