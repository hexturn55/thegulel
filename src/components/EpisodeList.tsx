'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Lock, Check, Play } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  thumbnail: string;
  duration: number;
  isFree: boolean;
  isUnlocked: boolean;
  watchProgress?: number;
}

interface EpisodeListProps {
  episodes: Episode[];
  seriesId: string;
}

export default function EpisodeList({ episodes, seriesId }: EpisodeListProps) {
  return (
    <div className="space-y-3">
      {episodes.map((episode) => (
        <Link key={episode.id} href={`/watch/${episode.id}`}>
          <div className="group bg-gray-900 rounded-xl overflow-hidden flex gap-3 hover:bg-gray-800 transition cursor-pointer">
            <div className="relative w-32 aspect-[9/16] flex-shrink-0">
              <Image
                src={episode.thumbnail}
                alt={episode.title}
                fill
                className="object-cover"
                sizes="128px"
              />
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>

              {/* Duration */}
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-white text-xs font-medium">
                {formatDuration(episode.duration)}
              </div>

              {/* Progress bar */}
              {episode.watchProgress && episode.watchProgress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${(episode.watchProgress / episode.duration) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 py-3 pr-4 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-400 text-sm font-medium">
                    Episode {episode.episodeNumber}
                  </span>
                  
                  {episode.isFree ? (
                    <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-medium">
                      Free
                    </span>
                  ) : episode.isUnlocked ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                
                <h4 className="text-white font-medium text-sm line-clamp-2">
                  {episode.title}
                </h4>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
