'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Globe, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { LocationProvider, useLocation } from '@/lib/locationContext';
import { WeatherProvider } from '@/lib/weatherContext';
import { type CountryFilter } from '@/lib/geocoding';
import GlobeMap from '@/components/map/GlobeMap';
import CountryBar from '@/components/search/CountryBar';
import CityBar from '@/components/search/CityBar';
import WeatherCard from '@/components/weather/WeatherCard';
import LiveClock from '@/components/weather/LiveClock';
import WeatherEffects from '@/components/weather/WeatherEffects';
import HomeForecastPanel from '@/components/weather/HomeForecastPanel';
import { ErrorBoundary } from '@/components/ui/error-boundary';

function MapFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#080c14]" style={{ zIndex: 0 }}>
      <p className="text-sm text-slate-600">Map failed to load — check your network connection.</p>
    </div>
  );
}

function AuthNav() {
  const { data: session } = useSession();
  if (session?.user) {
    return (
      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-200 shadow-lg shadow-blue-900/20 backdrop-blur transition-all hover:bg-blue-500/35 hover:text-white hover:border-blue-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        aria-label="Go to dashboard"
      >
        <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
    );
  }
  return (
    <Link
      href="/login"
      className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur transition-all hover:bg-white/20 hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      Sign in
    </Link>
  );
}

function MainContent() {
  const [countryFilter, setCountryFilter] = useState<CountryFilter | null>(null);
  const { setLocation, location } = useLocation();
  const searchParams = useSearchParams();
  const hasLocation = !!location;

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const name = searchParams.get('name');
    const country = searchParams.get('country');
    const tz = searchParams.get('tz');
    const id = searchParams.get('id');
    if (lat && lng && name && tz) {
      setLocation({
        id: id ?? `${lat},${lng}`,
        name: decodeURIComponent(name),
        country: country ? decodeURIComponent(country) : '',
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        timezone: decodeURIComponent(tz),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="relative h-full w-full overflow-hidden">
      {/* Full-viewport map */}
      <ErrorBoundary fallback={<MapFallback />}>
        <GlobeMap />
      </ErrorBoundary>

      {/* ── Split-screen overlays (desktop only) ─────────────── */}
      <AnimatePresence>
        {hasLocation && (
          <>
            {/* Left half — dark panel with weather effects */}
            <motion.div
              key="split-left"
              className="pointer-events-none fixed inset-y-0 left-0 z-[5] hidden w-1/2 overflow-hidden sm:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              style={{ background: 'linear-gradient(to right, rgba(8,12,20,0.88) 0%, rgba(8,12,20,0.68) 100%)' }}
            >
              <WeatherEffects contained />
            </motion.div>

            {/* Right half — clear map, no blur, no dark overlay */}
            <motion.div
              key="split-right"
              className="pointer-events-none fixed inset-y-0 right-0 z-[5] hidden w-1/2 sm:block"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Mobile weather effects */}
      <div className="sm:hidden">
        <WeatherEffects />
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="absolute inset-x-0 top-0 z-30 px-4 py-3 sm:px-6 sm:py-4">
        {/* Glassmorphic header background */}
        <div className="absolute inset-0 border-b border-white/10 bg-[#080c14]/60 backdrop-blur-md" />

        {/* Mobile layout */}
        <div className="relative flex flex-col gap-2 sm:hidden">
          <div className="flex items-center justify-between">
            <span className="select-none text-xl font-black tracking-tight text-white drop-shadow">
              Live<span className="text-blue-400">Atlas</span>
            </span>
            <AuthNav />
          </div>
          <div className="flex gap-2">
            <CountryBar value={countryFilter} onChange={setCountryFilter} />
            <CityBar countryFilter={countryFilter} />
          </div>
        </div>

        {/* Desktop layout */}
        <div className="relative hidden sm:flex sm:items-center sm:gap-4">
          {/* Logo */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 ring-1 ring-blue-400/30">
              <Globe className="h-4 w-4 text-blue-400" aria-hidden="true" />
            </div>
            <span className="select-none text-xl font-black tracking-tight text-white drop-shadow">
              Live<span className="text-blue-400">Atlas</span>
            </span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/15" />

          {/* Search bars */}
          <div className="flex min-w-0 flex-1 gap-2">
            <CountryBar value={countryFilter} onChange={setCountryFilter} />
            <CityBar countryFilter={countryFilter} />
          </div>

          {/* Right side controls */}
          <div className="flex shrink-0 items-center gap-3">
            <LiveClock />
            <div className="h-6 w-px bg-white/15" />
            <AuthNav />
          </div>
        </div>
      </header>

      {/* ── 7-day forecast panel — top left ─────────────────── */}
      <HomeForecastPanel />

      {/* ── Weather card — bottom left ───────────────────────── */}
      <aside className="absolute bottom-0 left-0 right-0 z-30 sm:bottom-6 sm:left-6 sm:right-auto">
        <WeatherCard />
      </aside>
    </main>
  );
}

export default function HomeClient() {
  return (
    <LocationProvider>
      <WeatherProvider>
        <MainContent />
      </WeatherProvider>
    </LocationProvider>
  );
}
