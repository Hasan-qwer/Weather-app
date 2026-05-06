'use client';

import { useReducer, useEffect } from 'react';

function formatNow() {
  const now = new Date();
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(now);
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }).format(now);
  const tz = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(now)
    .find((p) => p.type === 'timeZoneName')?.value ?? '';
  return { time, date, tz };
}

export default function DashboardClock() {
  const [, tick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const { time, date, tz } = formatNow();

  return (
    <div className="glass rounded-xl px-4 py-2.5 text-right" role="timer" aria-label="Local time">
      <div className="font-mono text-xl font-semibold tabular-nums text-white leading-none">{time}</div>
      <div className="mt-0.5 text-xs text-slate-400">{date}</div>
      <div className="text-xs text-slate-500">{tz}</div>
    </div>
  );
}
