'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import SeriesCard from './SeriesCard';

interface Series {
  id: string;
  title: string;
  thumbnail: string;
  genre: string;
  totalEpisodes: number;
  featured: boolean;
}

const GENRES = ['All', 'Romance', 'Drama', 'Thriller', 'Comedy', 'Fantasy', 'Action'];

export default function HomeFeed() {
  const [series, setSeries] = useState<Series[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const tg = useTranslations('genres');
  const t = useTranslations('home');

  useEffect(() => {
    fetchSeries();
  }, [selectedGenre]);

  const fetchSeries = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGenre !== 'All') {
        params.set('genre', selectedGenre);
      }
      
      const response = await fetch(`/api/series?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSeries(data.series);
      }
    } catch (error) {
      console.error('Failed to fetch series:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Genre tabs — top-[57px] accounts for the sticky Header height */}
      <div className="sticky top-[57px] z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition ${
                selectedGenre === genre
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tg(genre)}
            </button>
          ))}
        </div>
      </div>

      {/* Series grid */}
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[9/16] bg-gray-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">{t('noSeries')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {series.map((s) => (
              <SeriesCard key={s.id} {...s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
