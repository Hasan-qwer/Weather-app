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
