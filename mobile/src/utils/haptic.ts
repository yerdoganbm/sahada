/**
 * Haptic feedback - buton ve aksiyonlarda titreşim
 */

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = { enableVibrateFallback: true };

export function hapticLight() {
  try {
    ReactNativeHapticFeedback.trigger('impactLight', options);
  } catch (_) {}
}

export function hapticSuccess() {
  try {
    ReactNativeHapticFeedback.trigger('notificationSuccess', options);
  } catch (_) {}
}
