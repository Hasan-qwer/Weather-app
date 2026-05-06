'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Wind, MapPin, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useLocation, type LocationData } from '@/lib/locationContext';
import { useWeather } from '@/lib/weatherContext';
import { getWeatherCondition, getWindDirection } from '@/lib/weatherCodes';
import DaySelector from './DaySelector';

interface ChartPoint { time: string; temp: number; }
interface FavRecord { id: string; latitude: number; longitude: number; }

function SaveButton({ location }: { location: LocationData }) {
  const { status } = useSession();
  const [saved, setSaved] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/favorites')
      .then((r) => r.json())
      .then((favs: FavRecord[]) => {
        if (cancelled) return;
        const match = favs.find(
          (f) => Math.abs(f.latitude - location.latitude) < 0.01 &&
                 Math.abs(f.longitude - location.longitude) < 0.01
        );
        setSaved(!!match);
        setFavoriteId(match?.id ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [status, location.latitude, location.longitude]);

  if (status !== 'authenticated') return null;

  const toggle = async () => {
    setBusy(true);
    try {
      if (saved && favoriteId) {
        await fetch(`/api/favorites/${favoriteId}`, { method: 'DELETE' });
        setSaved(false); setFavoriteId(null);
        toast.success('Removed from favourites');
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: location.name, country: location.country,
            latitude: location.latitude, longitude: location.longitude, timezone: location.timezone }),
        });
        if (!res.ok) throw new Error('Failed');
        const fav: FavRecord = await res.json();
        setSaved(true); setFavoriteId(fav.id);
        toast.success('Saved to favourites!');
      }
    } catch { toast.error('Something went wrong. Please try again.'); }
    setBusy(false);
  };

  return (
    <button onClick={toggle} disabled={busy}
      aria-label={saved ? 'Remove from favourites' : 'Save to favourites'}
      className="ml-auto shrink-0 rounded-lg p-1 transition-colors hover:bg-white/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <Star className={`h-4 w-4 transition-colors ${saved ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400 hover:text-slate-200'}`} />
    </button>
  );
}

export default function WeatherCard() {
  const { location } = useLocation();
  const { weather, daily, selectedDay, loading, error } = useWeather();
  const [width, setWidth] = useState(320);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(320);

  const onResizeStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    e.preventDefault();
    resizing.current = true;
    startX.current = e.clientX;
    startW.current = width;
    const onMove = (ev: PointerEvent) => {
      if (!resizing.current) return;
      setWidth(Math.min(520, Math.max(260, startW.current + ev.clientX - startX.current)));
    };
    const onUp = () => {
      resizing.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [width]);

  const currentCondition = useMemo(() => {
    if (!weather) return null;
    return getWeatherCondition(weather.current.weather_code, weather.current.is_day === 1);
  }, [weather]);

  const dayCondition = useMemo(() => {
    if (!daily[selectedDay]) return null;
    return getWeatherCondition(daily[selectedDay].weatherCode, true);
  }, [daily, selectedDay]);

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!weather) return [];
    return weather.hourly.time.map((t, i) => ({
      time: t.slice(11, 16),
      temp: Math.round(weather.hourly.temperature_2m[i]),
    }));
  }, [weather]);

  if (!location) return null;

  const showDaily = selectedDay > 0 && daily[selectedDay] && dayCondition;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.id + '-wrapper'}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="fixed bottom-6 left-6 z-30"
        style={{ width, cursor: 'grab' }}
        drag
        dragMomentum={false}
        dragElastic={0.05}
        dragConstraints={{ left: -24, top: -800, right: 1100, bottom: 24 }}
        whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
      >
      <div
        className="glass rounded-2xl p-5 text-white shadow-2xl shadow-black/50 relative"
        role="region" aria-label={`Weather for ${location.name}`}>

        {/* Location header */}
        <div className="mb-4 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-400" aria-hidden="true" />
          <span className="truncate text-sm font-medium text-slate-300">
            {location.name}, {location.country}
          </span>
          <SaveButton location={location} />
        </div>

        {loading && (
          <div className="animate-pulse space-y-3" aria-label="Loading weather data">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-8 w-24 rounded-lg bg-white/10" />
                <div className="h-3 w-20 rounded bg-white/10" />
              </div>
              <div className="h-10 w-14 rounded-lg bg-white/10" />
            </div>
            <div className="h-10 rounded-xl bg-white/10" />
            <div className="h-20 rounded-lg bg-white/10" />
          </div>
        )}

        {!loading && error && <p className="py-6 text-center text-sm text-red-400">{error}</p>}

        {!loading && weather && currentCondition && (
          <>
            {/* Day selector */}
            <DaySelector />

            <AnimatePresence mode="wait">
              {showDaily ? (
                /* Future day view */
                <motion.div key={`day-${selectedDay}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="mt-4">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="text-5xl leading-none" role="img" aria-label={dayCondition!.label}>
                      {dayCondition!.emoji}
                    </span>
                    <div className="flex-1">
                      <div className="text-4xl font-bold leading-none tracking-tight">
                        {daily[selectedDay].tempMax}°C
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{dayCondition!.label}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs text-slate-400">Low</div>
                      <div className="text-xl font-semibold">{daily[selectedDay].tempMin}°</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 px-3 py-3 text-center">
                    <p className="text-sm text-slate-300">
                      🌧 {daily[selectedDay].precipSum} mm precipitation
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Today view */
                <motion.div key="today"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="mt-4">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="text-5xl leading-none" role="img" aria-label={currentCondition.label}>
                      {currentCondition.emoji}
                    </span>
                    <div className="flex-1">
                      <div className="text-4xl font-bold leading-none tracking-tight">
                        {Math.round(weather.current.temperature_2m)}°C
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{currentCondition.label}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs text-slate-400">Feels like</div>
                      <div className="text-xl font-semibold">
                        {Math.round(weather.current.apparent_temperature)}°
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 flex gap-4 rounded-xl bg-white/5 px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Droplets className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                      <span className="text-sm text-slate-300">{weather.current.relative_humidity_2m}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wind className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                      <span className="text-sm text-slate-300">
                        {Math.round(weather.current.wind_speed_10m)}{' '}
                        <span className="text-slate-500">km/h</span>{' '}
                        {getWindDirection(weather.current.wind_direction_10m)}
                      </span>
                    </div>
                  </div>
                  <div aria-hidden="true">
                    <p className="mb-1 text-xs text-slate-500">24-hour forecast</p>
                    <div className="h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                          <defs>
                            <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 9 }}
                            tickLine={false} axisLine={false} interval={5} />
                          <Tooltip contentStyle={{ background: 'rgba(13,21,38,0.92)',
                            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                            color: '#e2e8f0', fontSize: 12, padding: '6px 10px' }}
                            itemStyle={{ color: '#93c5fd' }} labelStyle={{ color: '#64748b', fontSize: 10 }}
                            formatter={(val) => (val != null ? [`${val}°C`, 'Temp'] : ['-', 'Temp'])}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                          <Area type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={1.5}
                            fill="url(#tempFill)" dot={false}
                            activeDot={{ r: 3, fill: '#60a5fa', strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
          {/* Resize handle */}
          <div
            onPointerDown={onResizeStart}
            className="absolute bottom-0 right-0 w-5 h-5 flex items-end justify-end pb-1 pr-1 opacity-0 hover:opacity-100 transition-opacity"
            style={{ cursor: 'se-resize' }}
            title="Drag to resize"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-white/30">
              <path d="M0 10 L10 0 L10 10 Z" fill="currentColor" />
            </svg>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
