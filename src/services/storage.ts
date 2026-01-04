import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageKeys = {
  QUEUE: 'queue',
  CURRENT_INDEX: 'current_index',
  SHUFFLE_STATE: 'shuffle_state',
  REPEAT_MODE: 'repeat_mode',
  DOWNLOADED_SONGS: 'downloaded_songs',
  VOLUME: 'volume',
  RECENTLY_PLAYED: 'recently_played',
};

export const storageService = {
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  async setObject<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async getObject<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    }
    return null;
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },
};
