'use client';

import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import SeriesCard from '@/components/SeriesCard';

interface Series {
  id: string;
  title: string;
  thumbnail: string;
  genre: string;
  totalEpisodes: number;
  featured: boolean;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useTranslations('search');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      doSearch(query.trim());
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const doSearch = async (q: string) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({ search: q });
      const res = await fetch(`/api/series?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.series ?? []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Search bar */}
      <div className="sticky top-[57px] z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full bg-gray-800 text-white placeholder-gray-500 pl-10 pr-10 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 text-gray-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[9/16] bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <>
            <p className="text-gray-400 text-sm mb-4">
              {t('results', { count: results.length, query })}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((s) => (
                <SeriesCard key={s.id} {...s} />
              ))}
            </div>
          </>
        )}

        {/* No results */}
        {!isLoading && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-white font-semibold text-lg mb-2">{t('noResultsTitle')}</p>
            <p className="text-gray-500 text-sm">
              {t('noResultsHint')}
            </p>
          </div>
        )}

        {/* Idle state */}
        {!isLoading && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
              <SearchIcon className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-400 text-sm">{t('idle')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
