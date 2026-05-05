'use client';

import { useState, useRef, useId, useEffect, useCallback } from 'react';
import { Globe, X } from 'lucide-react';
import { useDebounce } from '@/lib/useDebounce';
import { searchLocations, type GeoResult, type CountryFilter } from '@/lib/geocoding';

interface CountryBarProps {
  value: CountryFilter | null;
  onChange: (country: CountryFilter | null) => void;
}

function extractCountries(results: GeoResult[]): CountryFilter[] {
  const seen = new Set<string>();
  const out: CountryFilter[] = [];
  for (const r of results) {
    if (!seen.has(r.country_code)) {
      seen.add(r.country_code);
      out.push({ name: r.country, code: r.country_code });
    }
  }
  return out;
}

export default function CountryBar({ value, onChange }: CountryBarProps) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<CountryFilter[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setOptions([]);
      setIsOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchLocations(debouncedQuery, 20).then((results) => {
      if (cancelled) return;
      const countries = extractCountries(results);
      setOptions(countries);
      setIsOpen(countries.length > 0);
      setActiveIdx(-1);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const select = useCallback(
    (country: CountryFilter) => {
      onChange(country);
      setQuery(country.name);
      setIsOpen(false);
      setActiveIdx(-1);
    },
    [onChange]
  );

  const clear = () => {
    onChange(null);
    setQuery('');
    setOptions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIdx >= 0) select(options[activeIdx]);
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

  return (
    <div className="relative flex-1 min-w-0">
      <label htmlFor="country-search" className="sr-only">
        Search country
      </label>

      <div className="relative">
        <Globe
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id="country-search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIdx >= 0 ? `${listId}-opt-${activeIdx}` : undefined}
          aria-busy={loading}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-9 text-sm text-white placeholder-slate-500 backdrop-blur transition-colors focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="Country"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) onChange(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          autoComplete="off"
          spellCheck={false}
        />

        {value && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
            aria-label="Clear country filter"
            tabIndex={0}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Country suggestions"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#0d1526]/95 py-1 shadow-2xl shadow-black/60 backdrop-blur"
        >
          {options.map((c, i) => (
            <li
              key={c.code}
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
                select(c);
              }}
            >
              <Globe className="h-3.5 w-3.5 shrink-0 text-blue-400" aria-hidden="true" />
              <span>{c.name}</span>
              <span className="ml-auto text-xs font-mono text-slate-500">{c.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
