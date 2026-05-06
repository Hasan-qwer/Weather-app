'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useWeather } from '@/lib/weatherContext';
import { useLocation } from '@/lib/locationContext';
import { getWeatherCondition } from '@/lib/weatherCodes';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HomeForecastPanel() {
  const { location } = useLocation();
  const { daily, selectedDay, setSelectedDay, loading } = useWeather();

  const sel = daily[selectedDay];

  return (
    <AnimatePresence>
      {location && (
        <motion.aside
          key="forecast-panel"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="fixed left-4 top-20 z-30 w-64"
        >
          <div className="glass rounded-2xl p-4">
            {/* Location label */}
            <div className="mb-3 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-400" />
              <span className="truncate text-xs font-semibold text-white">{location.name}</span>
              <span className="truncate text-xs text-slate-400">{location.country}</span>
            </div>

            {loading ? (
              <div className="flex h-16 items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              </div>
            ) : (
              <>
                {/* 7-day strip */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="7-day forecast">
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
                        className={`relative flex min-w-[36px] flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          active ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="home-forecast-pill"
                            className="absolute inset-0 rounded-xl bg-blue-500/25 ring-1 ring-blue-500/40"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative text-[9px] font-semibold leading-none">{label}</span>
                        <span className="relative text-sm leading-none">{cond.emoji}</span>
                        <span className="relative text-[9px] font-bold leading-none">{day.tempMax}°</span>
                        <span className="relative text-[8px] leading-none text-slate-600">{day.tempMin}°</span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected day summary */}
                {sel && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                    <div>
                      <p className="text-[10px] text-slate-400">{getWeatherCondition(sel.weatherCode, true).label}</p>
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
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
