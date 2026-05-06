// Open-Meteo Geocoding API — no API key required

export interface CountryFilter {
  name: string;
  code: string;
}

export const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1';

export interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
  timezone: string;
  population?: number;
}

export interface GeoResponse {
  results?: GeoResult[];
}

export async function searchLocations(query: string, count = 10): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({ name: query, count: count.toString(), language: 'en' });
  const res = await fetch(`${GEOCODING_BASE}/search?${params}`);
  if (!res.ok) return [];
  const data: GeoResponse = await res.json();
  return data.results ?? [];
}

export interface ReverseGeoResult {
  name: string;
  country: string;
  timezone: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeoResult> {
  const [nominatim, meteo] = await Promise.all([
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en-US,en' } }
    ).then((r) => r.json()),
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&timezone=auto&current=temperature_2m`
    ).then((r) => r.json()),
  ]);

  const addr = nominatim?.address ?? {};
  const name =
    addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.state ?? 'Unknown location';
  const country = addr.country ?? '';
  const timezone = meteo?.timezone ?? 'UTC';

  return { name, country, timezone };
}
