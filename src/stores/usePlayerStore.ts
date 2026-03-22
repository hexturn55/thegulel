import { create } from 'zustand';

interface Episode {
  id: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  videoId: string;
  isFree: boolean;
  duration: number;
}

interface PlayerState {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  subtitlesEnabled: boolean;
  currentSubtitleLang: string;
  setCurrentEpisode: (episode: Episode | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  toggleSubtitles: () => void;
  setSubtitleLang: (lang: string) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentEpisode: null,
  isPlaying: false,
  currentTime: 0,
  subtitlesEnabled: false,
  currentSubtitleLang: 'en',
  setCurrentEpisode: (episode) => set({ currentEpisode: episode }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  toggleSubtitles: () =>
    set((state) => ({ subtitlesEnabled: !state.subtitlesEnabled })),
  setSubtitleLang: (lang) => set({ currentSubtitleLang: lang }),
}));
