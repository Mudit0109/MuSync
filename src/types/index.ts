export interface Song {
  id: string;
  name: string;
  type: string;
  album: {
    id: string;
    name: string;
    url: string;
  };
  year: string;
  releaseDate: string | null;
  duration: string;
  label: string;
  primaryArtists: string;
  primaryArtistsId: string;
  featuredArtists: string;
  featuredArtistsId: string;
  explicitContent: number;
  playCount: string;
  language: string;
  hasLyrics: string;
  url: string;
  copyright: string;
  image: Array<{
    quality: string;
    link: string;
  }>;
  downloadUrl: Array<{
    quality: string;
    link?: string;
    url?: string;
  }>;
}

export interface SearchResponse {
  status: string;
  data: {
    results: Song[];
    total: number;
    start: number;
  };
}

export interface SongDetail {
  id: string;
  name: string;
  duration: number;
  language: string;
  album: {
    id: string;
    name: string;
  };
  artists: {
    primary: Array<{
      id: string;
      name: string;
    }>;
  };
  image: Array<{
    quality: string;
    url: string;
  }>;
  downloadUrl: Array<{
    quality: string;
    url?: string;
    link?: string;
  }>;
}

export interface Artist {
  id: string;
  name: string;
  image?: Array<{
    quality: string;
    link?: string;
    url?: string;
  }>;
}

export interface Album {
  id: string;
  name: string;
  year: string;
  image: Array<{
    quality: string;
    link?: string;
    url?: string;
  }>;
}

export interface Playlist {
  id: string;
  name: string;
  songCount?: number | null;
  language?: string;
  type?: string;
  image?: Array<{
    quality: string;
    link?: string;
    url?: string;
  }>;
}

export interface QueueItem extends Song {
  queueId: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  currentSong: Song | null;
  queue: QueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  volume: number;
}

export interface DownloadedSong extends Song {
  localUri: string;
  downloadedAt: number;
}
