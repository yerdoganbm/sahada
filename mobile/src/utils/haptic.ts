/**
 * Haptic feedback - buton ve aksiyonlarda titreşim (native'de; web'de no-op)
 */

import { Platform } from 'react-native';

const getHaptic = () =>
  Platform.OS === 'web' ? null : require('react-native-haptic-feedback').default;

const options = { enableVibrateFallback: true };

export function hapticLight() {
  try {
    const Haptic = getHaptic();
    if (Haptic) Haptic.trigger('impactLight', options);
  } catch (_) {}
}

export function hapticSuccess() {
  try {
    const Haptic = getHaptic();
    if (Haptic) Haptic.trigger('notificationSuccess', options);
  } catch (_) {}
}
