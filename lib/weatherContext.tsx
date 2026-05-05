'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLocation } from '@/lib/locationContext';
import { fetchWeather, type WeatherData } from '@/lib/openMeteo';

interface WeatherContextValue {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
}

const WeatherContext = createContext<WeatherContextValue | null>(null);

export function WeatherProvider({ children }: { children: ReactNode }) {
  const { location } = useLocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchWeather(location.latitude, location.longitude)
      .then((data) => {
        if (!cancelled) {
          setWeather(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to load weather data.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [location?.latitude, location?.longitude]);

  return (
    <WeatherContext.Provider value={{ weather, loading, error }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather(): WeatherContextValue {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within <WeatherProvider>');
  return ctx;
}
