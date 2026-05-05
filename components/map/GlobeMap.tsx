'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useLocation } from '@/lib/locationContext';
import PulsingMarker from './PulsingMarker';

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function GlobeMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const { location } = useLocation();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: [15, 25],
      zoom: 1.8,
      attributionControl: false,
    });

    map.on('load', () => console.log('[Map] loaded'));
    map.on('error', (e) => console.error('[Map] error', e));

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!location || !mapRef.current) return;

    mapRef.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 9,
      duration: 3000,
      essential: true,
    });

    markerRef.current?.remove();
    const el = document.createElement('div');
    el.className = 'pulsing-marker';

    markerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([location.longitude, location.latitude])
      .addTo(mapRef.current);
  }, [location]);

  return <div ref={containerRef} className="fixed inset-0 -z-10" />;
}
