import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '../components/Icon';
import { VenueLocation, LatLng, ServiceArea } from '../types';
import { haversineDistanceMeters, formatDistance, googleMapsUrl, appleMapsUrl } from '../utils/geo';

const MAPS_KEY = (window as any).__VITE_GMAPS_KEY__ ?? '';

interface Props {
  venueId: string;
  venueName: string;
  initialLocation?: VenueLocation;
  onSave: (location: VenueLocation) => void;
  readOnly?: boolean;
}

type PinMode = 'main' | 'entrance' | 'parking' | 'meetup' | 'polygon';

const PIN_META: Record<PinMode, { label: string; icon: string; color: string }> = {
  main:     { label: 'Ana Konum',   icon: 'stadium',     color: '#10B981' },
  entrance: { label: 'Giriş',       icon: 'door_front',  color: '#3B82F6' },
  parking:  { label: 'Otopark',     icon: 'local_parking', color: '#F59E0B' },
  meetup:   { label: 'Toplanma',    icon: 'groups',      color: '#8B5CF6' },
  polygon:  { label: 'Polygon',     icon: 'polyline',    color: '#EF4444' },
};

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
    __VITE_GMAPS_KEY__: string;
  }
}

// Load Google Maps JS SDK lazily
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.querySelector('#gm-script')) {
      window.initGoogleMaps = resolve;
      return;
    }
    window.initGoogleMaps = resolve;
    const s = document.createElement('script');
    s.id = 'gm-script';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    s.async = true;
    s.defer = true;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export const VenueLocationEditor: React.FC<Props> = ({
  venueId, venueName, initialLocation, onSave, readOnly = false,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapObj, setMapObj] = useState<any>(null);
  const [markers, setMarkers] = useState<Record<string, any>>({});
  const [circleObj, setCircleObj] = useState<any>(null);
  const [polygonObj, setPolygonObj] = useState<any>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(false);
  const [pinMode, setPinMode] = useState<PinMode>('main');
  const [polygonPoints, setPolygonPoints] = useState<LatLng[]>([]);
  const [location, setLocation] = useState<VenueLocation>(initialLocation ?? {});
  const [radius, setRadius] = useState<number>(
    initialLocation?.serviceArea?.type === 'radius' ? initialLocation.serviceArea.meters : 120
  );
  const [areaMode, setAreaMode] = useState<'radius' | 'polygon'>(
    initialLocation?.serviceArea?.type ?? 'radius'
  );
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [saved, setSaved] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // --- INIT GOOGLE MAPS ---
  useEffect(() => {
    const key = (window as any).__VITE_GMAPS_KEY__ || import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';
    if (!key) { setMapsError(true); return; }
    loadGoogleMaps(key).then(() => setMapsLoaded(true)).catch(() => setMapsError(true));
  }, []);

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return;
    const center = location.latLng ?? { lat: 41.015, lng: 28.980 };
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: center.lat, lng: center.lng },
      zoom: 16,
      styles: DARK_MAP_STYLES,
      disableDefaultUI: true,
      zoomControl: true,
    });
    setMapObj(map);

    // Autocomplete
    if (searchRef.current && !readOnly) {
      const ac = new window.google.maps.places.Autocomplete(searchRef.current, {
        componentRestrictions: { country: 'tr' },
        fields: ['place_id', 'formatted_address', 'geometry', 'address_components'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.geometry) return;
        const ll: LatLng = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        const components = place.address_components || [];
        const getComp = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name ?? '';
        setLocation(prev => ({
          ...prev,
          placeId: place.place_id,
          formattedAddress: place.formatted_address,
          latLng: ll,
          source: 'places_autocomplete',
          addressComponents: {
            city: getComp('administrative_area_level_1'),
            district: getComp('administrative_area_level_2'),
            neighborhood: getComp('sublocality_level_1'),
            postalCode: getComp('postal_code'),
          },
        }));
        map.panTo({ lat: ll.lat, lng: ll.lng });
        map.setZoom(17);
      });
      autocompleteRef.current = ac;
    }

    // Map click → set pin based on mode
    if (!readOnly) {
      map.addListener('click', (e: any) => {
        const ll: LatLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setPinMode(cur => {
          if (cur === 'polygon') {
            setPolygonPoints(prev => [...prev, ll]);
          } else {
            setLocation(prev => ({ ...prev, [cur === 'main' ? 'latLng' : cur]: ll, source: cur === 'main' ? 'manual_pin' : prev.source }));
          }
          return cur;
        });
      });
    }

    return () => { window.google?.maps.event.clearInstanceListeners(map); };
  }, [mapsLoaded, readOnly]); // eslint-disable-line

  // --- SYNC MARKERS TO MAP ---
  useEffect(() => {
    if (!mapObj) return;
    const pinDefs: Partial<Record<PinMode, LatLng | undefined>> = {
      main: location.latLng,
      entrance: location.entrance,
      parking: location.parking,
      meetup: location.meetup,
    };
    Object.entries(pinDefs).forEach(([mode, ll]) => {
      if (!ll) { markers[mode]?.setMap(null); return; }
      const meta = PIN_META[mode as PinMode];
      if (markers[mode]) {
        markers[mode].setPosition({ lat: ll.lat, lng: ll.lng });
      } else {
        const m = new window.google.maps.Marker({
          position: { lat: ll.lat, lng: ll.lng },
          map: mapObj,
          title: meta.label,
          draggable: !readOnly && mode === 'main',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: mode === 'main' ? 10 : 7,
            fillColor: meta.color,
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        });
        if (!readOnly && mode === 'main') {
          m.addListener('dragend', (e: any) => {
            setLocation(prev => ({ ...prev, latLng: { lat: e.latLng.lat(), lng: e.latLng.lng() }, source: 'manual_pin' }));
          });
        }
        setMarkers(prev => ({ ...prev, [mode]: m }));
      }
    });
  }, [mapObj, location.latLng, location.entrance, location.parking, location.meetup]); // eslint-disable-line

  // --- CIRCLE OVERLAY ---
  useEffect(() => {
    if (!mapObj || !location.latLng || areaMode !== 'radius') return;
    if (circleObj) {
      circleObj.setRadius(radius);
      circleObj.setCenter({ lat: location.latLng.lat, lng: location.latLng.lng });
    } else {
      const c = new window.google.maps.Circle({
        center: { lat: location.latLng.lat, lng: location.latLng.lng },
        radius,
        map: mapObj,
        fillColor: '#10B981',
        fillOpacity: 0.08,
        strokeColor: '#10B981',
        strokeWeight: 1.5,
        strokeOpacity: 0.5,
      });
      setCircleObj(c);
    }
    return () => { circleObj?.setMap(null); };
  }, [mapObj, location.latLng, radius, areaMode]); // eslint-disable-line

  // --- POLYGON OVERLAY ---
  useEffect(() => {
    if (!mapObj || areaMode !== 'polygon' || polygonPoints.length < 3) return;
    polygonObj?.setMap(null);
    const p = new window.google.maps.Polygon({
      paths: polygonPoints.map(p => ({ lat: p.lat, lng: p.lng })),
      map: mapObj,
      fillColor: '#EF4444',
      fillOpacity: 0.12,
      strokeColor: '#EF4444',
      strokeWeight: 2,
    });
    setPolygonObj(p);
    return () => p.setMap(null);
  }, [mapObj, polygonPoints, areaMode]); // eslint-disable-line

  const handleSave = () => {
    const serviceArea: ServiceArea = areaMode === 'radius'
      ? { type: 'radius', meters: radius }
      : { type: 'polygon', points: polygonPoints };
    const final: VenueLocation = { ...location, serviceArea };
    setLocation(final);
    onSave(final);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleVerify = () => {
    if (!location.latLng) { setVerifyMsg('Önce bir konum seçin.'); setVerifyStatus('fail'); return; }
    setVerifyStatus('loading');
    setVerifyMsg('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const userLL: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const dist = haversineDistanceMeters(userLL, location.latLng!);
        const tolerance = (location.serviceArea?.type === 'radius' ? location.serviceArea.meters : 120) + 30;
        if (dist <= tolerance) {
          setVerifyStatus('ok');
          setVerifyMsg(`✓ Doğrulandı. Mesafe: ${formatDistance(dist)}`);
          setLocation(prev => ({ ...prev, verifiedAt: new Date().toISOString(), verifiedBy: 'gps_owner_check' }));
        } else {
          setVerifyStatus('fail');
          setVerifyMsg(`✗ Doğrulanamadı. Şu an ${formatDistance(dist)} uzaktasın.`);
        }
      },
      () => { setVerifyStatus('fail'); setVerifyMsg('Konum izni reddedildi.'); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  if (mapsError || !MAPS_KEY) {
    return <NomapFallback location={location} onSave={onSave} readOnly={readOnly} />;
  }

  if (!mapsLoaded) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface rounded-2xl border border-white/8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Harita yükleniyor…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Address search */}
      {!readOnly && (
        <div className="relative">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Adres veya yer ara…"
            className="w-full bg-surface border border-white/10 rounded-2xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
          />
        </div>
      )}

      {/* Selected address display */}
      {location.formattedAddress && (
        <div className="flex items-start gap-2 p-3 bg-surface rounded-2xl border border-white/8">
          <Icon name="place" size={14} className="text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate">{location.formattedAddress}</p>
            {location.latLng && (
              <p className="text-[10px] text-slate-500">{location.latLng.lat.toFixed(5)}, {location.latLng.lng.toFixed(5)}</p>
            )}
          </div>
          {location.verifiedAt && <Icon name="verified" size={14} className="text-green-400 flex-shrink-0" />}
        </div>
      )}

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10" style={{ height: 280 }}>
        <div ref={mapRef} className="w-full h-full" />
        {/* Pin mode overlay */}
        {!readOnly && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-slate-900/90 backdrop-blur-sm rounded-2xl p-1.5 border border-white/10">
            {(Object.keys(PIN_META) as PinMode[]).filter(m => m !== 'polygon').map(mode => (
              <button key={mode} onClick={() => setPinMode(mode)}
                className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-[9px] font-black transition-all ${pinMode === mode ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-white'}`}>
                <Icon name={PIN_META[mode].icon} size={10} />
                <span className="hidden sm:inline">{PIN_META[mode].label}</span>
              </button>
            ))}
          </div>
        )}
        {/* Current mode indicator */}
        {!readOnly && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-white/10">
            <p className="text-[9px] font-black text-white">
              {pinMode === 'main' ? '📍 Haritaya tıkla = Ana konum' : `📍 Tıkla = ${PIN_META[pinMode].label}`}
            </p>
          </div>
        )}
      </div>

      {/* Service area */}
      {!readOnly && (
        <div className="bg-surface rounded-2xl border border-white/8 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">Servis Alanı</p>
            <div className="flex gap-2">
              {(['radius', 'polygon'] as const).map(m => (
                <button key={m} onClick={() => setAreaMode(m)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black border transition-all ${areaMode === m ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-slate-500'}`}>
                  {m === 'radius' ? 'Yarıçap' : 'Polygon'}
                </button>
              ))}
            </div>
          </div>

          {areaMode === 'radius' && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[10px] text-slate-400">Yarıçap</span>
                <span className="text-[10px] font-bold text-primary">{radius} m</span>
              </div>
              <input type="range" min={50} max={500} step={10} value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="w-full accent-primary" />
            </div>
          )}

          {areaMode === 'polygon' && (
            <div>
              <p className="text-[10px] text-slate-400 mb-2">
                Haritaya tıklayarak {polygonPoints.length} nokta eklendi
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPolygonPoints(prev => prev.slice(0, -1))}
                  disabled={polygonPoints.length === 0}
                  className="flex-1 py-1.5 rounded-xl bg-secondary border border-white/10 text-slate-400 text-xs font-bold disabled:opacity-40">
                  Geri Al
                </button>
                <button onClick={() => setPolygonPoints([])}
                  className="flex-1 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                  Temizle
                </button>
                <button onClick={() => setPinMode('polygon')}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all ${pinMode === 'polygon' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-secondary border-white/10 text-slate-400'}`}>
                  {pinMode === 'polygon' ? 'Çizim Aktif' : 'Polygon Çiz'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation links (read mode) */}
      {readOnly && location.latLng && (
        <div className="grid grid-cols-2 gap-2">
          <a href={googleMapsUrl(location.latLng.lat, location.latLng.lng, location.placeId, venueName)}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-sm">
            <Icon name="map" size={16} />
            Google Harita
          </a>
          {location.entrance && (
            <a href={googleMapsUrl(location.entrance.lat, location.entrance.lng, undefined, 'Giriş')}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-sm">
              <Icon name="door_front" size={16} />
              Girişe Git
            </a>
          )}
          {location.parking && (
            <a href={googleMapsUrl(location.parking.lat, location.parking.lng, undefined, 'Otopark')}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold text-sm">
              <Icon name="local_parking" size={16} />
              Otoparka Git
            </a>
          )}
        </div>
      )}

      {/* Verify + Save (edit mode) */}
      {!readOnly && (
        <div className="space-y-2">
          <button onClick={handleVerify}
            disabled={!location.latLng || verifyStatus === 'loading'}
            className={`w-full py-3 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              verifyStatus === 'ok' ? 'bg-green-500/15 border-green-500/25 text-green-400' :
              verifyStatus === 'fail' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
            }`}>
            {verifyStatus === 'loading'
              ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Konum alınıyor…</>
              : <><Icon name="my_location" size={15} /> Konumu Doğrula (Buradayım)</>
            }
          </button>
          {verifyMsg && <p className={`text-xs text-center font-medium ${verifyStatus === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{verifyMsg}</p>}
          <p className="text-[9px] text-slate-600 text-center">
            Konum, saha konumunu doğrulamak için kullanılır. Arka planda izlenmez.
          </p>
          <button onClick={handleSave}
            disabled={!location.latLng}
            className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-glow transition-all disabled:opacity-40 ${saved ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-primary text-secondary'}`}>
            {saved ? '✓ Kaydedildi' : 'Konumu Kaydet'}
          </button>
        </div>
      )}
    </div>
  );
};

// Fallback when no API key
const NomapFallback: React.FC<{
  location: VenueLocation;
  onSave: (l: VenueLocation) => void;
  readOnly: boolean;
}> = ({ location, onSave, readOnly }) => {
  const [addr, setAddr] = useState(location.formattedAddress ?? '');
  const [lat, setLat] = useState(location.latLng?.lat.toString() ?? '');
  const [lng, setLng] = useState(location.latLng?.lng.toString() ?? '');
  const handleSave = () => {
    const ll = lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined;
    onSave({ ...location, formattedAddress: addr || undefined, latLng: ll, source: 'manual_pin' });
  };
  return (
    <div className="bg-surface rounded-2xl border border-white/8 p-4 space-y-3">
      <div className="flex items-center gap-2 p-2 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
        <Icon name="info" size={13} className="text-yellow-400" />
        <p className="text-[10px] text-yellow-300">
          Google Maps API anahtarı bulunamadı. <code>VITE_GOOGLE_MAPS_API_KEY</code> env değişkenini tanımlayın.
        </p>
      </div>
      {!readOnly && (
        <>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Adres</label>
            <input value={addr} onChange={e => setAddr(e.target.value)} placeholder="Tam adres"
              className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Enlem</label>
              <input value={lat} onChange={e => setLat(e.target.value)} placeholder="41.015" type="number" step="0.00001"
                className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Boylam</label>
              <input value={lng} onChange={e => setLng(e.target.value)} placeholder="28.980" type="number" step="0.00001"
                className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none" />
            </div>
          </div>
          <button onClick={handleSave} className="w-full py-3 rounded-2xl bg-primary text-secondary font-black">Kaydet</button>
        </>
      )}
      {location.latLng && (
        <a href={`https://www.google.com/maps?q=${location.latLng.lat},${location.latLng.lng}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold">
          <Icon name="open_in_new" size={14} />
          Google Haritada Aç
        </a>
      )}
    </div>
  );
};

// Minimal dark map style
const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#475569' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0369a1' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
