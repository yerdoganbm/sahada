/**
 * Push token: FCM/APNs token'ı backend'e kaydeder.
 * registerPushTokenIfAvailable() giriş sonrası AuthContext'ten cagrilir.
 */

import { Platform } from 'react-native';
import api from './api';

export async function registerPushToken(token: string): Promise<void> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  await api.post('/push-tokens', { token, platform });
}

/**
 * Firebase varsa FCM token alir ve API'ye kaydeder. Firebase yoksa sessizce atlanir.
 * Giriş yaptiktan sonra AuthContext'te cagirin.
 */
export async function registerPushTokenIfAvailable(): Promise<void> {
  try {
    const messaging = (await import('@react-native-firebase/messaging')).default;
    const authStatus = await messaging().requestPermission();
    // AUTHORIZED = 2, PROVISIONAL = 3 (iOS)
    if (authStatus !== 2 && authStatus !== 3) return;
    const token = await messaging().getToken();
    if (token) await registerPushToken(token);
  } catch {
    // Firebase kurulu degil veya izin verilmedi
  }
}
