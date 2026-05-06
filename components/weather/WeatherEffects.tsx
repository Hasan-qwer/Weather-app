'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeather } from '@/lib/weatherContext';
import { useLocation } from '@/lib/locationContext';
import { getWeatherCondition, type WeatherEffect } from '@/lib/weatherCodes';

const RAIN_DROPS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${((i * 2.5 + (i % 7) * 3.7) % 100).toFixed(1)}%`,
  top: `${((i * 2.3) % 25).toFixed(1)}%`,
  delay: `${((i * 0.11) % 2).toFixed(2)}s`,
  duration: `${(0.45 + (i % 6) * 0.1).toFixed(2)}s`,
  opacity: 0.55 + (i % 4) * 0.12,
  height: `${80 + (i % 5) * 28}px`,
  width: i % 3 === 0 ? '1.5px' : '1px',
}));

const SNOW_FLAKES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${((i * 4.3 + (i % 4) * 5.1) % 100).toFixed(1)}%`,
  delay: `${((i * 0.38) % 5).toFixed(2)}s`,
  duration: `${(3.2 + (i % 5) * 0.7).toFixed(1)}s`,
  size: 4 + (i % 4) * 2,
  opacity: 0.65 + (i % 3) * 0.15,
}));

const CLOUD_WISPS = [
  { left: '5%',  top: '8%',  w: 220, h: 60,  delay: '0s',    dur: '22s', op: 0.18 },
  { left: '35%', top: '3%',  w: 160, h: 44,  delay: '4s',    dur: '28s', op: 0.14 },
  { left: '65%', top: '12%', w: 190, h: 52,  delay: '9s',    dur: '20s', op: 0.16 },
  { left: '20%', top: '22%', w: 140, h: 36,  delay: '14s',   dur: '32s', op: 0.10 },
  { left: '80%', top: '18%', w: 170, h: 46,  delay: '2s',    dur: '25s', op: 0.13 },
];

function RainEffect({ intensity = 1, pos }: { intensity?: number; pos: string }) {
  return (
    <div className={`pointer-events-none ${pos} inset-0 z-20 overflow-hidden`} aria-hidden="true">
      {RAIN_DROPS.map((d) => (
        <div
          key={d.id}
          className="absolute rounded-full"
          style={{
            left: d.left,
            top: d.top,
            height: d.height,
            width: d.width,
            opacity: d.opacity * intensity,
            background: 'linear-gradient(to bottom, transparent, rgba(147,197,253,0.85))',
            animation: `rain-fall ${d.duration} linear ${d.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

function SnowEffect({ pos }: { pos: string }) {
  return (
    <div className={`pointer-events-none ${pos} inset-0 z-20 overflow-hidden`} aria-hidden="true">
      {SNOW_FLAKES.map((f) => (
        <div
          key={f.id}
          className="absolute rounded-full bg-white"
          style={{
            left: f.left,
            top: '-8px',
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animation: `snow-drift ${f.duration} ease-in-out ${f.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

function SunEffect({ pos }: { pos: string }) {
  return (
    <div className={`pointer-events-none ${pos} inset-0 z-20 overflow-hidden`} aria-hidden="true">
      <div
        className="absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.28) 0%, rgba(251,191,36,0.10) 45%, transparent 70%)',
          animation: 'sun-glow 4s ease-in-out infinite',
        }}
      />
    </div>
  );
}

function CloudEffect({ fog = false, pos }: { fog?: boolean; pos: string }) {
  return (
    <div className={`pointer-events-none ${pos} inset-0 z-20 overflow-hidden`} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: fog
            ? 'linear-gradient(to bottom, rgba(148,163,184,0.22) 0%, rgba(148,163,184,0.10) 50%, transparent 100%)'
            : 'linear-gradient(to bottom, rgba(100,116,139,0.18) 0%, rgba(100,116,139,0.08) 60%, transparent 100%)',
        }}
      />
      {CLOUD_WISPS.map((w, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: w.left,
            top: w.top,
            width: w.w,
            height: w.h,
            opacity: w.op,
            background: 'radial-gradient(ellipse, rgba(203,213,225,0.9) 0%, transparent 70%)',
            animation: `cloud-drift ${w.dur} linear ${w.delay} infinite`,
            filter: 'blur(12px)',
          }}
        />
      ))}
    </div>
  );
}

function ThunderEffect({ pos }: { pos: string }) {
  return (
    <>
      <RainEffect intensity={1.4} pos={pos} />
      <div className={`pointer-events-none ${pos} inset-0 z-20 overflow-hidden`} aria-hidden="true">
        <div
          className="absolute inset-0 bg-white"
          style={{ animation: 'thunder-flash 9s ease-in-out 1.5s infinite' }}
        />
      </div>
    </>
  );
}

function EffectLayer({ effect, pos }: { effect: WeatherEffect; pos: string }) {
  switch (effect) {
    case 'rain':    return <RainEffect pos={pos} />;
    case 'drizzle': return <RainEffect intensity={0.55} pos={pos} />;
    case 'snow':    return <SnowEffect pos={pos} />;
    case 'thunder': return <ThunderEffect pos={pos} />;
    case 'clear':   return <SunEffect pos={pos} />;
    case 'fog':     return <CloudEffect fog pos={pos} />;
    case 'cloud':   return <CloudEffect pos={pos} />;
  }
}

export default function WeatherEffects({ contained = false }: { contained?: boolean }) {
  const { location } = useLocation();
  const { weather } = useWeather();
  const pos = contained ? 'absolute' : 'fixed';

  const effect = useMemo<WeatherEffect | null>(() => {
    if (!weather) return null;
    return getWeatherCondition(weather.current.weather_code, weather.current.is_day === 1).effect;
  }, [weather]);

  if (!location || !effect) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={effect}
        className={contained ? 'absolute inset-0 overflow-hidden' : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2 }}
      >
        <EffectLayer effect={effect} pos={pos} />
      </motion.div>
    </AnimatePresence>
  );
}
