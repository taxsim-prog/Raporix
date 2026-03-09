import AsyncStorage from '@react-native-async-storage/async-storage';

const StorageService = {
  async setItem(key: string, value: any) {
    try {
      const v = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, v);
    } catch (e) {
      console.warn('StorageService.setItem', e);
    }
  },

  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      const v = await AsyncStorage.getItem(key);
      if (v == null) return null;
      try {
        return JSON.parse(v) as T;
      } catch {
        return (v as unknown) as T;
      }
    } catch (e) {
      console.warn('StorageService.getItem', e);
      return null;
    }
  },

  async removeItem(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('StorageService.removeItem', e);
    }
  },
};

export default StorageService;