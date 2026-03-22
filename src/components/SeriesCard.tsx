'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Star } from 'lucide-react';

interface SeriesCardProps {
  id: string;
  title: string;
  thumbnail: string;
  genre: string;
  totalEpisodes: number;
  featured?: boolean;
}

export default function SeriesCard({
  id,
  title,
  thumbnail,
  genre,
  totalEpisodes,
  featured = false,
}: SeriesCardProps) {
  return (
    <Link href={`/series/${id}`}>
      <div className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-800 cursor-pointer">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          </div>
        </div>

        {featured && (
          <div className="absolute top-3 left-3 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Featured
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
          <h3 className="text-white font-semibold text-base mb-1 line-clamp-2">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
              {genre}
            </span>
            <span>•</span>
            <span>{totalEpisodes} Episodes</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
