// ── Geo utilities ──────────────────────────────────────────────────────────────

export interface LatLng { lat: number; lng: number }

/** Haversine distance in meters between two points */
export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Human-readable distance string */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export type ServiceArea =
  | { type: 'radius'; meters: number }
  | { type: 'polygon'; points: LatLng[] };

/** Ray-casting point-in-polygon */
function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { lat: xi, lng: yi } = polygon[i];
    const { lat: xj, lng: yj } = polygon[j];
    const intersect =
      yi > point.lng !== yj > point.lng &&
      point.lat < ((xj - xi) * (point.lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isWithinArea(point: LatLng, area: ServiceArea): boolean {
  if (area.type === 'radius') {
    return haversineDistanceMeters(point, point) <= area.meters; // placeholder — caller passes center
  }
  return pointInPolygon(point, area.points);
}

export function isWithinRadius(point: LatLng, center: LatLng, radiusMeters: number): boolean {
  return haversineDistanceMeters(point, center) <= radiusMeters;
}

/** Google Maps "Haritada aç" URL */
export function googleMapsUrl(lat: number, lng: number, placeId?: string, label?: string): string {
  const base = 'https://www.google.com/maps/search/?api=1';
  const params = [`query=${lat},${lng}`];
  if (placeId) params.push(`query_place_id=${encodeURIComponent(placeId)}`);
  return `${base}&${params.join('&')}`;
}

/** Apple Maps URL (iOS fallback) */
export function appleMapsUrl(lat: number, lng: number, label?: string): string {
  const q = label ? encodeURIComponent(label) : `${lat},${lng}`;
  return `http://maps.apple.com/?ll=${lat},${lng}&q=${q}`;
}

/** Detect platform and return best maps URL */
export function bestMapsUrl(lat: number, lng: number, placeId?: string, label?: string): string {
  const ua = navigator?.userAgent ?? '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  return isIOS ? appleMapsUrl(lat, lng, label) : googleMapsUrl(lat, lng, placeId, label);
}
