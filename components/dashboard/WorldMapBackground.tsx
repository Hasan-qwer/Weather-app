'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const CITIES = [
  { lng: -74.0,  lat: 40.7  },
  { lng:  -0.1,  lat: 51.5  },
  { lng: 139.7,  lat: 35.7  },
  { lng: 151.2,  lat: -33.9 },
  { lng:  55.3,  lat: 25.2  },
  { lng:  72.9,  lat: 19.1  },
  { lng: -46.6,  lat: -23.5 },
  { lng:  31.2,  lat: 30.1  },
  { lng: 116.4,  lat: 39.9  },
  { lng:   3.4,  lat:  6.5  },
  { lng: -99.1,  lat: 19.4  },
  { lng:   2.3,  lat: 48.9  },
];

interface Props {
  onMapClick?: (lat: number, lng: number) => void;
}

export default function WorldMapBackground({ onMapClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let map: import('leaflet').Map | null = null;
    let animId: number;
    let cancelled = false;

    import('leaflet').then((mod) => {
      if (cancelled || !containerRef.current) return;
      const L = mod.default ?? mod;
      map = L.map(containerRef.current, {
        center: [20, 20],
        zoom: 1.5,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        keyboard: false,
        touchZoom: false,
        boxZoom: false,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 19 }
      ).addTo(map);

      if (onMapClick) {
        map.on('click', (e) => onMapClick(e.latlng.lat, e.latlng.lng));
      }

      CITIES.forEach((city, i) => {
        const icon = L.divIcon({
          className: '',
          html: `<div class="city-dot" style="animation-delay:${(i * 0.4) % 3}s" aria-hidden="true"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        L.marker([city.lat, city.lng], { icon }).addTo(map!);
      });

      const pan = () => {
        map?.panBy([0.5, 0], { animate: false });
        animId = requestAnimationFrame(pan);
      };
      animId = requestAnimationFrame(pan);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      map?.remove();
    };
  }, []);

  return (
    <div className="fixed inset-0" style={{ zIndex: 0 }} aria-hidden="true">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#080c14]/50 via-transparent to-[#080c14]/50 pointer-events-none" />
    </div>
  );
}
