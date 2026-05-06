// Open-Meteo weather API — no API key required
export const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
export const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1';

export interface WeatherData {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
    is_day: number;
    precipitation: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
  timezone: string;
  timezone_abbreviation: string;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipSum: number;
}

export async function fetchDailyForecast(lat: number, lng: number): Promise<DailyForecast[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    daily: ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum'].join(','),
    timezone: 'auto',
    forecast_days: '7',
  });
  const res = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);
  if (!res.ok) throw new Error('Failed to fetch daily forecast');
  const data = await res.json();
  return (data.daily.time as string[]).map((date, i) => ({
    date,
    weatherCode: data.daily.weather_code[i] as number,
    tempMax: Math.round(data.daily.temperature_2m_max[i] as number),
    tempMin: Math.round(data.daily.temperature_2m_min[i] as number),
    precipSum: Math.round((data.daily.precipitation_sum[i] as number) * 10) / 10,
  }));
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'weather_code',
      'is_day',
      'precipitation',
    ].join(','),
    hourly: ['temperature_2m', 'precipitation_probability', 'weather_code'].join(','),
    forecast_days: '1',
    timezone: 'auto',
  });

  const res = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);
  if (!res.ok) throw new Error('Failed to fetch weather');
  return res.json() as Promise<WeatherData>;
}
