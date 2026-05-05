'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Globe } from 'lucide-react';
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
import { ErrorBoundary } from '@/components/ui/error-boundary';

function MapFallback() {
  return (
    <div className="fixed inset-0 -z-10 flex items-center justify-center bg-[#080c14]">
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
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Go to dashboard"
      >
        <User className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
    );
  }
  return (
    <Link
      href="/login"
      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      Sign in
    </Link>
  );
}

function MainContent() {
  const [countryFilter, setCountryFilter] = useState<CountryFilter | null>(null);
  const { setLocation } = useLocation();
  const searchParams = useSearchParams();

  // Fly to a favourite when navigated from the dashboard
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

      <WeatherEffects />

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="absolute inset-x-0 top-0 z-20 p-3 sm:p-5">
        {/*
          Mobile  : row-1 = Logo + Auth, row-2 = Search bars
          Desktop : single row = Logo + Search bars + Clock + Auth
        */}

        {/* Mobile row 1 */}
        <div className="mb-2 flex items-center justify-between sm:hidden">
          <span className="select-none text-lg font-bold tracking-tight text-white">
            Live<span className="text-blue-400">Atlas</span>
          </span>
          <AuthNav />
        </div>

        {/* Mobile row 2 */}
        <div className="flex gap-2 sm:hidden">
          <CountryBar value={countryFilter} onChange={setCountryFilter} />
          <CityBar countryFilter={countryFilter} />
        </div>

        {/* Desktop single row */}
        <div className="hidden sm:flex sm:items-center sm:gap-3">
          <span className="shrink-0 select-none text-lg font-bold tracking-tight text-white">
            <Globe className="mr-1 inline h-4 w-4 text-blue-400" aria-hidden="true" />
            Live<span className="text-blue-400">Atlas</span>
          </span>

          <div className="flex min-w-0 flex-1 gap-2">
            <CountryBar value={countryFilter} onChange={setCountryFilter} />
            <CityBar countryFilter={countryFilter} />
          </div>

          <LiveClock />
          <AuthNav />
        </div>
      </header>

      {/* ── Weather card ─────────────────────────────────────── */}
      {/*
        Mobile  : full-width strip pinned to bottom (bottom-sheet style)
        Desktop : 320px card, bottom-left
      */}
      <aside className="absolute bottom-0 left-0 right-0 z-20 sm:bottom-6 sm:left-6 sm:right-auto">
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
