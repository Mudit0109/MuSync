import * as FileSystem from 'expo-file-system';
import type { Song, DownloadedSong } from '../types';
import { storageService, storageKeys } from './storage';

const DOWNLOAD_DIR = `${FileSystem.documentDirectory}downloads/`;

export const downloadService = {
  async ensureDownloadDirectory(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
    }
  },

  async downloadSong(song: Song, quality: string = '320kbps'): Promise<DownloadedSong> {
    await this.ensureDownloadDirectory();

    const downloadUrl = song.downloadUrl.find((url) => url.quality === quality) || song.downloadUrl[0];
    if (!downloadUrl) {
      throw new Error('Download URL not found for specified quality');
    }

    const fileName = `${song.id}_${quality}.mp4`;
    const fileUri = `${DOWNLOAD_DIR}${fileName}`;

    // Check if already downloaded
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      return {
        ...song,
        localUri: fileUri,
        downloadedAt: Date.now(),
      };
    }

    // Download the file
    const sourceUri = downloadUrl.link || downloadUrl.url;
    if (!sourceUri) {
      throw new Error('Download URL missing');
    }

    const downloadResult = await FileSystem.downloadAsync(sourceUri, fileUri);

    const downloadedSong: DownloadedSong = {
      ...song,
      localUri: downloadResult.uri,
      downloadedAt: Date.now(),
    };

    // Save to downloaded songs list
    await this.saveDownloadedSong(downloadedSong);

    return downloadedSong;
  },

  async saveDownloadedSong(song: DownloadedSong): Promise<void> {
    const downloaded = await this.getDownloadedSongs();
    const exists = downloaded.find((s) => s.id === song.id);
    if (!exists) {
      downloaded.push(song);
      await storageService.setObject(storageKeys.DOWNLOADED_SONGS, downloaded);
    }
  },

  async getDownloadedSongs(): Promise<DownloadedSong[]> {
    return (await storageService.getObject<DownloadedSong[]>(storageKeys.DOWNLOADED_SONGS)) || [];
  },

  async deleteSong(songId: string): Promise<void> {
    const downloaded = await this.getDownloadedSongs();
    const song = downloaded.find((s) => s.id === songId);

    if (song) {
      // Delete file
      const fileInfo = await FileSystem.getInfoAsync(song.localUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(song.localUri);
      }

      // Remove from list
      const updatedList = downloaded.filter((s) => s.id !== songId);
      await storageService.setObject(storageKeys.DOWNLOADED_SONGS, updatedList);
    }
  },

  async isDownloaded(songId: string): Promise<boolean> {
    const downloaded = await this.getDownloadedSongs();
    return downloaded.some((s) => s.id === songId);
  },

  async getDownloadedSong(songId: string): Promise<DownloadedSong | undefined> {
    const downloaded = await this.getDownloadedSongs();
    return downloaded.find((s) => s.id === songId);
  },
};
