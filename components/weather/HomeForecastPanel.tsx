'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useWeather } from '@/lib/weatherContext';
import { useLocation } from '@/lib/locationContext';
import { getWeatherCondition, type WeatherEffect } from '@/lib/weatherCodes';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ── Scene backgrounds ───────────────────────────────────── */
const SCENE_BG: Record<WeatherEffect, string> = {
  clear:   'from-amber-400 via-sky-400 to-blue-500',
  cloud:   'from-slate-400 via-slate-500 to-slate-600',
  fog:     'from-slate-300 via-slate-400 to-slate-500',
  drizzle: 'from-slate-500 via-slate-600 to-slate-700',
  rain:    'from-slate-600 via-slate-700 to-slate-800',
  snow:    'from-sky-200 via-sky-300 to-indigo-300',
  thunder: 'from-slate-700 via-slate-800 to-slate-900',
};

/* ── Rain scene ──────────────────────────────────────────── */
function RainScene({ heavy = false }: { heavy?: boolean }) {
  const drops = Array.from({ length: heavy ? 20 : 14 });
  return (
    <div className="absolute inset-0 overflow-hidden">
      {drops.map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/60"
          style={{
            left: `${(i * 73 + 7) % 100}%`,
            top: '-8px',
            width: '1.5px',
            height: `${8 + (i % 4) * 3}px`,
            animation: `scene-rain ${0.55 + (i % 5) * 0.1}s linear infinite`,
            animationDelay: `${(i * 0.13) % 0.8}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Snow scene ──────────────────────────────────────────── */
function SnowScene() {
  const flakes = Array.from({ length: 18 });
  return (
    <div className="absolute inset-0 overflow-hidden">
      {flakes.map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${(i * 67 + 5) % 100}%`,
            top: '-6px',
            width: `${3 + (i % 3)}px`,
            height: `${3 + (i % 3)}px`,
            animation: `scene-snow ${1.4 + (i % 6) * 0.25}s ease-in infinite`,
            animationDelay: `${(i * 0.17) % 1.4}s`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

/* ── Sun scene ───────────────────────────────────────────── */
function SunScene() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Rotating rays */}
      <div
        className="absolute"
        style={{ animation: 'scene-ray-spin 12s linear infinite' }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-yellow-200/40 rounded-full"
            style={{
              width: '3px',
              height: '36px',
              top: '-18px',
              left: '-1.5px',
              transform: `rotate(${i * 45}deg) translateY(-28px)`,
              transformOrigin: '1.5px 46px',
            }}
          />
        ))}
      </div>
      {/* Sun core */}
      <div
        className="relative rounded-full bg-yellow-300 shadow-[0_0_24px_8px_rgba(253,224,71,0.5)]"
        style={{
          width: '48px',
          height: '48px',
          animation: 'scene-sun-pulse 3s ease-in-out infinite',
        }}
      />
    </div>
  );
}

/* ── Cloud scene ─────────────────────────────────────────── */
function CloudScene() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div style={{ animation: 'scene-cloud-float 4s ease-in-out infinite' }}>
        <div className="relative">
          <div className="w-20 h-10 rounded-full bg-white/30 blur-sm" />
          <div className="absolute -top-4 left-4 w-12 h-10 rounded-full bg-white/25 blur-sm" />
          <div className="absolute -top-2 left-10 w-10 h-8 rounded-full bg-white/20 blur-sm" />
        </div>
      </div>
    </div>
  );
}

/* ── Thunder scene ───────────────────────────────────────── */
function ThunderScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <RainScene heavy />
      {/* Lightning bolt */}
      <div
        className="absolute inset-0 bg-yellow-200/20"
        style={{ animation: 'scene-lightning 3s ease-in-out infinite' }}
      />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-yellow-300 text-2xl select-none"
        style={{ animation: 'scene-lightning 3s ease-in-out 0.1s infinite' }}>
        ⚡
      </div>
    </div>
  );
}

/* ── Weather scene wrapper ───────────────────────────────── */
function WeatherScene({ effect, temp, label }: { effect: WeatherEffect; temp: number; label: string }) {
  return (
    <div className={`relative h-32 overflow-hidden bg-gradient-to-b ${SCENE_BG[effect]}`}>
      {effect === 'clear'                  && <SunScene />}
      {(effect === 'rain' || effect === 'drizzle') && <RainScene heavy={effect === 'rain'} />}
      {effect === 'snow'                   && <SnowScene />}
      {effect === 'thunder'               && <ThunderScene />}
      {(effect === 'cloud' || effect === 'fog') && <CloudScene />}

      {/* Temp + label overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/30 to-transparent">
        <p className="text-4xl font-bold text-white drop-shadow-lg leading-none">{temp}°</p>
        <p className="text-xs font-medium text-white/80 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Main panel ──────────────────────────────────────────── */
export default function HomeForecastPanel() {
  const { location } = useLocation();
  const { weather, daily, selectedDay, setSelectedDay, loading } = useWeather();
  const [width, setWidth] = useState(320);
  const widthRef = useRef(320);
  const dragControls = useDragControls();

  useEffect(() => { widthRef.current = width; }, [width]);

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = widthRef.current;
    const onMove = (ev: PointerEvent) => {
      setWidth(Math.min(480, Math.max(240, startW + ev.clientX - startX)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const sel = daily[selectedDay];
  const today = daily[0];
  const todayCond = today ? getWeatherCondition(today.weatherCode, true) : null;

  return (
    <AnimatePresence>
      {location && (
        <motion.aside
          key="forecast-panel"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="fixed left-4 top-20 z-30"
          style={{ width }}
          drag
          dragListener={false}
          dragControls={dragControls}
          dragMomentum={false}
          dragElastic={0.05}
          dragConstraints={{ left: -16, top: -80, right: 1100, bottom: 700 }}
          whileDrag={{ scale: 1.02 }}
        >
          <div
            className="glass rounded-2xl overflow-hidden relative"
            style={{ touchAction: 'none', cursor: 'grab' }}
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest('[data-resize]')) return;
              dragControls.start(e);
            }}
          >
            {/* Weather scene */}
            {todayCond && !loading && weather && (
              <WeatherScene
                effect={todayCond.effect}
                temp={Math.round(weather.current.temperature_2m)}
                label={todayCond.label}
              />
            )}

            <div className="p-3">
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
                  {/* 7-day strip — no scroll, all days visible */}
                  <div className="grid grid-cols-7 gap-0.5" role="tablist" aria-label="7-day forecast">
                    {daily.map((day, i) => {
                      const date = new Date(day.date + 'T12:00:00');
                      const label = i === 0 ? 'Now' : DAY_ABBR[date.getDay()];
                      const cond = getWeatherCondition(day.weatherCode, true);
                      const active = selectedDay === i;
                      return (
                        <button
                          key={day.date}
                          role="tab"
                          aria-selected={active}
                          onClick={() => setSelectedDay(i)}
                          className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
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
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
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

            {/* Resize handle */}
            <div
              data-resize="true"
              onPointerDown={startResize}
              className="absolute bottom-0 right-0 w-5 h-5 flex items-end justify-end pb-1 pr-1 opacity-0 hover:opacity-100 transition-opacity"
              style={{ cursor: 'se-resize' }}
              title="Drag to resize"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" className="text-white/30">
                <path d="M0 10 L10 0 L10 10 Z" fill="currentColor" />
              </svg>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
