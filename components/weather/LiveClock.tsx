'use client';

import { useReducer, useEffect } from 'react';
import { useLocation } from '@/lib/locationContext';

function formatClock(timezone: string): { time: string; abbr: string; date: string } {
  const now = new Date();
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);

  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(now);

  const abbr =
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value ?? timezone;

  return { time, abbr, date };
}

export default function LiveClock() {
  const { location } = useLocation();
  const [, tick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!location) return null;

  const { time, abbr, date } = formatClock(location.timezone);

  return (
    <div
      className="glass rounded-xl px-4 py-2.5 text-right"
      role="timer"
      aria-label={`Local time in ${location.name}`}
    >
      <div className="font-mono text-xl font-semibold tabular-nums text-white leading-none">
        {time}
      </div>
      <div className="mt-0.5 text-xs text-slate-400">{date}</div>
      <div className="text-xs text-slate-500">{abbr}</div>
    </div>
  );
}
