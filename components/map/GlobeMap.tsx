'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { useLocation } from '@/lib/locationContext';
import { reverseGeocode } from '@/lib/geocoding';

export default function GlobeMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);
  const loadingMarkerRef = useRef<import('leaflet').Marker | null>(null);
  const { location, setLocation } = useLocation();
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    import('leaflet').then((mod) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const L = mod.default ?? mod;

      const map = L.map(containerRef.current, {
        center: [25, 15],
        zoom: 2,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 19 }
      ).addTo(map);

      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;

        // Show a pulsing "loading" marker while we reverse geocode
        loadingMarkerRef.current?.remove();
        const loadingIcon = L.divIcon({
          className: '',
          html: `<div style="width:16px;height:16px;border-radius:50%;background:rgba(59,130,246,0.5);border:2px solid #3b82f6;animation:ping-slow 1s ease-in-out infinite"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        loadingMarkerRef.current = L.marker([lat, lng], { icon: loadingIcon }).addTo(map);

        setResolving(true);
        try {
          const result = await reverseGeocode(lat, lng);
          if (!cancelled) {
            setLocation({
              id: `${lat.toFixed(4)},${lng.toFixed(4)}`,
              name: result.name,
              country: result.country,
              latitude: lat,
              longitude: lng,
              timezone: result.timezone,
            });
          }
        } catch {
          // silently ignore network errors
        } finally {
          loadingMarkerRef.current?.remove();
          loadingMarkerRef.current = null;
          setResolving(false);
        }
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [setLocation]);

  useEffect(() => {
    if (!location || !mapRef.current) return;

    mapRef.current.flyTo(
      [location.latitude, location.longitude],
      9,
      { duration: 1.5 }
    );

    import('leaflet').then((mod) => {
      const L = mod.default ?? mod;
      markerRef.current?.remove();

      const icon = L.divIcon({
        className: '',
        html: `<div class="location-pin" aria-label="Marker for ${location.name}">
          <div class="location-pin-glow"></div>
          <div class="location-pin-dot"></div>
          <div class="location-pin-ring"></div>
          <div class="location-pin-ring-2"></div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      markerRef.current = L.marker([location.latitude, location.longitude], { icon })
        .addTo(mapRef.current!);
    });
  }, [location]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="fixed inset-0" style={{ zIndex: 0 }} />
      {resolving && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-blue-400/30 bg-[#080c14]/80 px-4 py-2 text-sm text-blue-300 backdrop-blur">
          Finding location…
        </div>
      )}
    </div>
  );
}
