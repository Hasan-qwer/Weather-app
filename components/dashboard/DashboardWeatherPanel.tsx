'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2 } from 'lucide-react';
import { fetchDailyForecast, type DailyForecast } from '@/lib/openMeteo';
import { reverseGeocode } from '@/lib/geocoding';
import { getWeatherCondition } from '@/lib/weatherCodes';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  clickedLatLng: { lat: number; lng: number } | null;
}

export default function DashboardWeatherPanel({ clickedLatLng }: Props) {
  const [locationName, setLocationName] = useState<string | null>(null);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clickedLatLng) return;
    let cancelled = false;

    setLoading(true);
    setLocationName(null);
    setDaily([]);
    setSelectedDay(0);

    Promise.all([
      reverseGeocode(clickedLatLng.lat, clickedLatLng.lng),
      fetchDailyForecast(clickedLatLng.lat, clickedLatLng.lng),
    ]).then(([geo, forecast]) => {
      if (cancelled) return;
      setLocationName(`${geo.name}${geo.country ? `, ${geo.country}` : ''}`);
      setDaily(forecast);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [clickedLatLng]);

  const sel = daily[selectedDay];

  return (
    <AnimatePresence>
      {(loading || daily.length > 0 || !clickedLatLng) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="glass w-72 rounded-2xl p-4"
        >
          {!clickedLatLng ? (
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <MapPin className="h-5 w-5 text-slate-500" />
              <p className="text-xs text-slate-400">Click anywhere on the map<br />to see the 7-day forecast</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <span className="text-xs text-slate-400">Loading forecast…</span>
            </div>
          ) : (
            <>
              {/* Location label */}
              <div className="mb-3 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                <span className="truncate text-xs font-medium text-slate-300">{locationName}</span>
              </div>

              {/* 7-day pill row */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none" role="tablist">
                {daily.map((day, i) => {
                  const date = new Date(day.date + 'T12:00:00');
                  const label = i === 0 ? 'Today' : DAY_ABBR[date.getDay()];
                  const cond = getWeatherCondition(day.weatherCode, true);
                  const active = selectedDay === i;
                  return (
                    <button
                      key={day.date}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedDay(i)}
                      className={`relative flex min-w-[38px] flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        active ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="dash-day-pill"
                          className="absolute inset-0 rounded-xl bg-blue-500/25 ring-1 ring-blue-500/40"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative text-[9px] font-semibold leading-none">{label}</span>
                      <span className="relative text-xs leading-none">{cond.emoji}</span>
                      <span className="relative text-[9px] font-bold leading-none">{day.tempMax}°</span>
                      <span className="relative text-[8px] leading-none text-slate-600">{day.tempMin}°</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected day details */}
              {sel && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <div>
                    <p className="text-xs text-slate-400">{getWeatherCondition(sel.weatherCode, true).label}</p>
                    <p className="text-sm font-bold text-white">{sel.tempMax}° / {sel.tempMin}°</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">Precip.</p>
                    <p className="text-xs font-semibold text-blue-300">{sel.precipSum} mm</p>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
