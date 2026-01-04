import axios from 'axios';
import type { SearchResponse, SongDetail, Song, Artist, Album, Playlist } from '../types';

const BASE_URL = 'https://saavn.sumit.co';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const musicApi = {
  // Search APIs
  async searchSongs(query: string, page: number = 0, limit: number = 20): Promise<{ success?: boolean; status?: string; data: { results: Song[] } }> {
    const response = await api.get('/api/search/songs', {
      params: { query, page, limit },
    });
    return response.data;
  },

  async searchAlbums(query: string, page: number = 0, limit: number = 20): Promise<{ success?: boolean; data: { results: Album[] } }> {
    const response = await api.get('/api/search/albums', {
      params: { query, page, limit },
    });
    return response.data;
  },

  async searchArtists(query: string, page: number = 0, limit: number = 20): Promise<{ success?: boolean; data: { results: Artist[] } }> {
    const response = await api.get('/api/search/artists', {
      params: { query, page, limit },
    });
    return response.data;
  },

  async searchPlaylists(query: string, page: number = 0, limit: number = 20): Promise<{ success?: boolean; data: { results: Playlist[] } }> {
    const response = await api.get('/api/search/playlists', {
      params: { query, page, limit },
    });
    return response.data;
  },

  // Songs APIs
  async getSongById(id: string): Promise<{ success: boolean; data: SongDetail[] }> {
    const response = await api.get(`/api/songs/${id}`);
    return response.data;
  },

  async getSongSuggestions(id: string): Promise<{ success: boolean; data: Song[] }> {
    const response = await api.get(`/api/songs/${id}/suggestions`);
    return response.data;
  },

  // Artists APIs
  async getArtistById(id: string) {
    const response = await api.get(`/api/artists/${id}`);
    return response.data;
  },

  async getArtistSongs(id: string) {
    const response = await api.get(`/api/artists/${id}/songs`);
    return response.data;
  },

  async getArtistAlbums(id: string) {
    const response = await api.get(`/api/artists/${id}/albums`);
    return response.data;
  },

  async getPlaylist(id: string, page: number = 0, limit: number = 30) {
    const response = await api.get('/api/playlists', {
      params: { id, page, limit },
    });
    return response.data;
  },
};
