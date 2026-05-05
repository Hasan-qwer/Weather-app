'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeather } from '@/lib/weatherContext';
import { useLocation } from '@/lib/locationContext';
import { getWeatherCondition, type WeatherEffect } from '@/lib/weatherCodes';

// Deterministic particle arrays — no Math.random() to avoid hydration mismatch
const RAIN_DROPS = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: `${((i * 4.71 + (i % 5) * 3.2) % 100).toFixed(1)}%`,
  top: `${((i * 3.13) % 30).toFixed(1)}%`,
  delay: `${((i * 0.19) % 2).toFixed(2)}s`,
  duration: `${(0.55 + (i % 6) * 0.12).toFixed(2)}s`,
  opacity: 0.35 + (i % 4) * 0.08,
  height: `${70 + (i % 5) * 22}px`,
}));

const SNOW_FLAKES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${((i * 5.83 + (i % 4) * 4.1) % 100).toFixed(1)}%`,
  delay: `${((i * 0.38) % 5).toFixed(2)}s`,
  duration: `${(3.2 + (i % 5) * 0.7).toFixed(1)}s`,
  size: 4 + (i % 3) * 2,
  opacity: 0.5 + (i % 3) * 0.15,
}));

// ── Effect overlays ───────────────────────────────────────

function RainEffect({ intensity = 1 }: { intensity?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden" aria-hidden="true">
      {RAIN_DROPS.map((d) => (
        <div
          key={d.id}
          className="absolute w-px rounded-full"
          style={{
            left: d.left,
            top: d.top,
            height: d.height,
            opacity: d.opacity * intensity,
            background: 'linear-gradient(to bottom, transparent, rgba(147,197,253,0.7))',
            animation: `rain-fall ${d.duration} linear ${d.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

function SnowEffect() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden" aria-hidden="true">
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

function SunEffect() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.06) 50%, transparent 75%)',
          animation: 'sun-glow 4s ease-in-out infinite',
        }}
      />
    </div>
  );
}

function CloudEffect({ fog = false }: { fog?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: fog
            ? 'linear-gradient(to bottom, rgba(148,163,184,0.06) 0%, rgba(148,163,184,0.03) 50%, transparent 100%)'
            : 'linear-gradient(to bottom, rgba(71,85,105,0.04) 0%, transparent 60%)',
        }}
      />
    </div>
  );
}

function ThunderEffect() {
  return (
    <>
      <RainEffect intensity={1.3} />
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 bg-white"
          style={{ animation: 'thunder-flash 9s ease-in-out 1.5s infinite' }}
        />
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────

function effectKey(effect: WeatherEffect): string {
  return effect;
}

function EffectLayer({ effect }: { effect: WeatherEffect }) {
  switch (effect) {
    case 'rain':      return <RainEffect />;
    case 'drizzle':   return <RainEffect intensity={0.5} />;
    case 'snow':      return <SnowEffect />;
    case 'thunder':   return <ThunderEffect />;
    case 'clear':     return <SunEffect />;
    case 'fog':       return <CloudEffect fog />;
    case 'cloud':     return <CloudEffect />;
  }
}

export default function WeatherEffects() {
  const { location } = useLocation();
  const { weather } = useWeather();

  const effect = useMemo<WeatherEffect | null>(() => {
    if (!weather) return null;
    return getWeatherCondition(weather.current.weather_code, weather.current.is_day === 1).effect;
  }, [weather]);

  if (!location || !effect) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={effectKey(effect)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2 }}
      >
        <EffectLayer effect={effect} />
      </motion.div>
    </AnimatePresence>
  );
}
