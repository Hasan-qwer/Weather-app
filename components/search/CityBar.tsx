'use client';

import { useState, useRef, useId, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { useDebounce } from '@/lib/useDebounce';
import { searchLocations, type GeoResult, type CountryFilter } from '@/lib/geocoding';
import { useLocation, type LocationData } from '@/lib/locationContext';

interface CityBarProps {
  countryFilter: CountryFilter | null;
}

export default function CityBar({ countryFilter }: CityBarProps) {
  const { setLocation } = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchLocations(debouncedQuery, 20).then((raw) => {
      if (cancelled) return;
      const filtered = countryFilter
        ? raw.filter((r) => r.country_code === countryFilter.code)
        : raw;
      const sliced = filtered.slice(0, 8);
      setResults(sliced);
      setIsOpen(sliced.length > 0);
      setActiveIdx(-1);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, countryFilter]);

  const select = useCallback(
    (r: GeoResult) => {
      const loc: LocationData = {
        id: String(r.id),
        name: r.name,
        country: r.country,
        latitude: r.latitude,
        longitude: r.longitude,
        timezone: r.timezone,
      };
      setLocation(loc);
      setQuery(r.admin1 ? `${r.name}, ${r.admin1}` : r.name);
      setIsOpen(false);
      setActiveIdx(-1);
    },
    [setLocation]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIdx >= 0) select(results[activeIdx]);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const placeholder = countryFilter ? `City in ${countryFilter.name}` : 'City';

  return (
    <div className="relative flex-1 min-w-0">
      <label htmlFor="city-search" className="sr-only">
        Search city
      </label>

      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id="city-search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIdx >= 0 ? `${listId}-opt-${activeIdx}` : undefined}
          aria-busy={loading}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 backdrop-blur transition-colors focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {isOpen && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="City suggestions"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#0d1526]/95 py-1 shadow-2xl shadow-black/60 backdrop-blur"
        >
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={activeIdx === i}
              className={`flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                activeIdx === i
                  ? 'bg-blue-500/20 text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                select(r);
              }}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-400" aria-hidden="true" />
              <span className="font-medium text-white">{r.name}</span>
              {r.admin1 && <span className="text-slate-400">{r.admin1}</span>}
              <span className="ml-auto shrink-0 text-xs text-slate-500">{r.country}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
