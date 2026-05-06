'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLocation } from '@/lib/locationContext';
import { fetchWeather, fetchDailyForecast, type WeatherData, type DailyForecast } from '@/lib/openMeteo';

interface WeatherContextValue {
  weather: WeatherData | null;
  daily: DailyForecast[];
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  loading: boolean;
  error: string | null;
}

const WeatherContext = createContext<WeatherContextValue | null>(null);

export function WeatherProvider({ children }: { children: ReactNode }) {
  const { location } = useLocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedDay(0);

    Promise.all([
      fetchWeather(location.latitude, location.longitude),
      fetchDailyForecast(location.latitude, location.longitude),
    ])
      .then(([weatherData, dailyData]) => {
        if (!cancelled) {
          setWeather(weatherData);
          setDaily(dailyData);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to load weather data.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [location?.latitude, location?.longitude]);

  return (
    <WeatherContext.Provider value={{ weather, daily, selectedDay, setSelectedDay, loading, error }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather(): WeatherContextValue {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within <WeatherProvider>');
  return ctx;
}
