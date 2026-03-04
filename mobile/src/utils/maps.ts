import { Platform, Linking } from 'react-native';

/**
 * Haritada aç — iOS: Apple Maps, Android: Google Maps / geo: intent
 */
export function openInMaps(lat: number, lng: number, name?: string): void {
  const label = encodeURIComponent(name ?? 'Saha');
  if (Platform.OS === 'ios') {
    Linking.openURL(`http://maps.apple.com/?ll=${lat},${lng}&q=${label}`);
  } else {
    Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}(${label})`);
  }
}

/** Google Maps query link (universal) */
export function googleMapsUrl(lat: number, lng: number, placeId?: string): string {
  if (placeId) return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
