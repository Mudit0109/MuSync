import { create } from 'zustand';
import { Audio, AVPlaybackStatus } from 'expo-av';
import type { Song, QueueItem, RepeatMode } from '../types';
import { storageService, storageKeys } from '../services/storage';
import { downloadService } from '../services/download';

interface PlayerStore {
  // State
  currentSong: Song | null;
  queue: QueueItem[];
  originalQueue: QueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  volume: number;
  isLoading: boolean;
  sound: Audio.Sound | null;
  recentlyPlayed: Song[];

  // Actions
  playSong: (song: Song, queue?: Song[], index?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  addToQueue: (song: Song) => Promise<void>;
  removeFromQueue: (queueId: string) => Promise<void>;
  reorderQueue: (fromIndex: number, toIndex: number) => Promise<void>;
  clearQueue: () => Promise<void>;
  toggleShuffle: () => Promise<void>;
  setRepeatMode: (mode: RepeatMode) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  updatePlaybackStatus: (status: AVPlaybackStatus) => void;
  loadPersistedState: () => Promise<void>;
  cleanupSound: () => Promise<void>;
}

const generateQueueId = () => `${Date.now()}_${Math.random().toString(36).substring(7)}`;

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Initial state
  currentSong: null,
  queue: [],
  originalQueue: [],
  currentIndex: 0,
  isPlaying: false,
  position: 0,
  duration: 0,
  isShuffled: false,
  repeatMode: 'off',
  volume: 1.0,
  isLoading: false,
  sound: null,
  recentlyPlayed: [],

  playSong: async (song: Song, queue?: Song[], index?: number) => {
    const { sound: currentSound, cleanupSound } = get();

    try {
      set({ isLoading: true });

      // Cleanup previous sound
      await cleanupSound();

      // Prepare new queue
      let newQueue: QueueItem[];
      let newIndex: number;

      if (queue) {
        newQueue = queue.map((s) => ({ ...s, queueId: generateQueueId() }));
        newIndex = index ?? 0;
      } else {
        const existingQueue = get().queue;
        if (existingQueue.length > 0) {
          newQueue = existingQueue;
          newIndex = existingQueue.findIndex((s) => s.id === song.id);
          if (newIndex === -1) {
            newQueue.push({ ...song, queueId: generateQueueId() });
            newIndex = newQueue.length - 1;
          }
        } else {
          newQueue = [{ ...song, queueId: generateQueueId() }];
          newIndex = 0;
        }
      }

      // Check if song is downloaded
      const downloadedSong = await downloadService.getDownloadedSong(song.id);
      const primary = song.downloadUrl.find((u) => u.quality === '320kbps');
      const fallback = song.downloadUrl.find((u) => u.quality === '160kbps') || song.downloadUrl[0];
      const uri =
        downloadedSong?.localUri ||
        primary?.link ||
        primary?.url ||
        fallback?.link ||
        fallback?.url;

      if (!uri) {
        throw new Error('No playable URL found');
      }

      // Create and load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: get().volume },
        (status) => get().updatePlaybackStatus(status)
      );

      set({
        currentSong: song,
        queue: newQueue,
        originalQueue: newQueue,
        currentIndex: newIndex,
        sound: newSound,
        isPlaying: true,
        isLoading: false,
      });

      // Persist queue
      await storageService.setObject(storageKeys.QUEUE, newQueue);
      await storageService.setItem(storageKeys.CURRENT_INDEX, newIndex.toString());

      // Update recently played
      const currentRecently = get().recentlyPlayed;
      const withoutCurrent = currentRecently.filter((s) => s.id !== song.id);
      const updatedRecent = [{ ...song }, ...withoutCurrent].slice(0, 20);
      set({ recentlyPlayed: updatedRecent });
      await storageService.setObject(storageKeys.RECENTLY_PLAYED, updatedRecent);
    } catch (error) {
      console.error('Error playing song:', error);
      set({ isLoading: false });
    }
  },

  togglePlayPause: async () => {
    const { sound, isPlaying } = get();
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      set({ isPlaying: !isPlaying });
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  },

  seekTo: async (position: number) => {
    const { sound } = get();
    if (!sound) return;

    try {
      await sound.setPositionAsync(position);
      set({ position });
    } catch (error) {
      console.error('Error seeking:', error);
    }
  },

  playNext: async () => {
    const { queue, currentIndex, repeatMode, playSong } = get();
    if (queue.length === 0) return;

    let nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return;
      }
    }

    const nextSong = queue[nextIndex];
    await playSong(nextSong, queue, nextIndex);
  },

  playPrevious: async () => {
    const { queue, currentIndex, playSong, position } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds into the song, restart it
    if (position > 3000) {
      await get().seekTo(0);
      return;
    }

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    const prevSong = queue[prevIndex];
    await playSong(prevSong, queue, prevIndex);
  },

  addToQueue: async (song: Song) => {
    const { queue } = get();
    const newQueue = [...queue, { ...song, queueId: generateQueueId() }];
    set({ queue: newQueue, originalQueue: newQueue });
    await storageService.setObject(storageKeys.QUEUE, newQueue);
  },

  removeFromQueue: async (queueId: string) => {
    const { queue, currentIndex } = get();
    const indexToRemove = queue.findIndex((item) => item.queueId === queueId);

    if (indexToRemove === -1) return;

    const newQueue = queue.filter((item) => item.queueId !== queueId);
    let newIndex = currentIndex;

    if (indexToRemove < currentIndex) {
      newIndex = currentIndex - 1;
    } else if (indexToRemove === currentIndex && newQueue.length > 0) {
      newIndex = Math.min(currentIndex, newQueue.length - 1);
    }

    set({ queue: newQueue, originalQueue: newQueue, currentIndex: newIndex });
    await storageService.setObject(storageKeys.QUEUE, newQueue);
  },

  reorderQueue: async (fromIndex: number, toIndex: number) => {
    const { queue } = get();
    const newQueue = [...queue];
    const [movedItem] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedItem);

    set({ queue: newQueue, originalQueue: newQueue });
    await storageService.setObject(storageKeys.QUEUE, newQueue);
  },

  clearQueue: async () => {
    set({ queue: [], originalQueue: [], currentIndex: 0 });
    await storageService.removeItem(storageKeys.QUEUE);
  },

  toggleShuffle: async () => {
    const { isShuffled, queue, originalQueue, currentSong } = get();

    if (!isShuffled) {
      // Shuffle the queue
      const currentSongInQueue = queue.find((s) => s.id === currentSong?.id);
      const otherSongs = queue.filter((s) => s.id !== currentSong?.id);

      // Fisher-Yates shuffle
      for (let i = otherSongs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherSongs[i], otherSongs[j]] = [otherSongs[j], otherSongs[i]];
      }

      const shuffledQueue = currentSongInQueue
        ? [currentSongInQueue, ...otherSongs]
        : otherSongs;

      set({ queue: shuffledQueue, currentIndex: 0, isShuffled: true });
    } else {
      // Restore original order
      const currentSongId = currentSong?.id;
      const newIndex = originalQueue.findIndex((s) => s.id === currentSongId);

      set({
        queue: originalQueue,
        currentIndex: newIndex >= 0 ? newIndex : 0,
        isShuffled: false,
      });
    }

    await storageService.setItem(storageKeys.SHUFFLE_STATE, (!isShuffled).toString());
  },

  setRepeatMode: async (mode: RepeatMode) => {
    set({ repeatMode: mode });
    await storageService.setItem(storageKeys.REPEAT_MODE, mode);
  },

  setVolume: async (volume: number) => {
    const { sound } = get();
    const clampedVolume = Math.max(0, Math.min(1, volume));

    if (sound) {
      await sound.setVolumeAsync(clampedVolume);
    }

    set({ volume: clampedVolume });
    await storageService.setItem(storageKeys.VOLUME, clampedVolume.toString());
  },

  updatePlaybackStatus: (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    const { position, duration, isPlaying: wasPlaying, repeatMode } = get();

    set({
      position: status.positionMillis,
      duration: status.durationMillis || duration,
      isPlaying: status.isPlaying,
    });

    // Auto play next when song ends
    if (status.didJustFinish) {
      if (repeatMode === 'one') {
        get().seekTo(0);
        get().sound?.playAsync();
      } else {
        get().playNext();
      }
    }
  },

  loadPersistedState: async () => {
    const queue = (await storageService.getObject<QueueItem[]>(storageKeys.QUEUE)) || [];
    const currentIndex = parseInt((await storageService.getItem(storageKeys.CURRENT_INDEX)) || '0');
    const isShuffled = (await storageService.getItem(storageKeys.SHUFFLE_STATE)) === 'true';
    const repeatMode = ((await storageService.getItem(storageKeys.REPEAT_MODE)) as RepeatMode) || 'off';
    const volume = parseFloat((await storageService.getItem(storageKeys.VOLUME)) || '1.0');
    const recentlyPlayed = (await storageService.getObject<Song[]>(storageKeys.RECENTLY_PLAYED)) || [];

    set({
      queue,
      originalQueue: queue,
      currentIndex,
      isShuffled,
      repeatMode,
      volume,
      recentlyPlayed,
    });
  },

  cleanupSound: async () => {
    const { sound } = get();
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error cleaning up sound:', error);
      }
    }
    set({ sound: null });
  },
}));

// Initialize audio mode
Audio.setAudioModeAsync({
  staysActiveInBackground: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
});
