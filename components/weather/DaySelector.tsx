'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useWeather } from '@/lib/weatherContext';
import { getWeatherCondition } from '@/lib/weatherCodes';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DaySelector() {
  const { daily, selectedDay, setSelectedDay } = useWeather();
  const listRef = useRef<HTMLDivElement>(null);

  if (!daily.length) return null;

  const handleKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); setSelectedDay(Math.min(i + 1, daily.length - 1)); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setSelectedDay(Math.max(i - 1, 0)); }
  };

  return (
    <div
      ref={listRef}
      className="mt-3 flex gap-1 overflow-x-auto pb-1 scrollbar-none"
      role="tablist"
      aria-label="Select forecast day"
    >
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
            aria-label={`${label}: high ${day.tempMax}°, low ${day.tempMin}°`}
            tabIndex={active ? 0 : -1}
            onClick={() => setSelectedDay(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`relative flex min-w-[46px] flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              active ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {active && (
              <motion.div
                layoutId="day-pill"
                className="absolute inset-0 rounded-xl bg-blue-500/25 ring-1 ring-blue-500/40"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative text-[10px] font-semibold leading-none">{label}</span>
            <span className="relative text-sm leading-none" role="img" aria-hidden="true">{cond.emoji}</span>
            <span className="relative text-[10px] font-bold leading-none">{day.tempMax}°</span>
            <span className="relative text-[9px] leading-none text-slate-600">{day.tempMin}°</span>
          </button>
        );
      })}
    </div>
  );
}
