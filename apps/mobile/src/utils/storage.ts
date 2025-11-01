import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if we're in a test environment
const isTestEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
};

// Type guard to check if SecureStore is properly available
const isSecureStoreAvailable = (): boolean => {
  // In test environment, always use mocked storage
  if (isTestEnvironment()) {
    return false;
  }
  
  return (
    SecureStore &&
    typeof SecureStore.getItemAsync === 'function' &&
    typeof SecureStore.setItemAsync === 'function' &&
    typeof SecureStore.deleteItemAsync === 'function'
  );
};

// Type guard to check if AsyncStorage is available
const isAsyncStorageAvailable = (): boolean => {
  try {
    return (
      AsyncStorage &&
      typeof AsyncStorage.getItem === 'function' &&
      typeof AsyncStorage.setItem === 'function' &&
      typeof AsyncStorage.removeItem === 'function'
    );
  } catch {
    return false;
  }
};

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (!isSecureStoreAvailable()) {
        if (isAsyncStorageAvailable()) {
          if (!isTestEnvironment()) {
            console.warn('SecureStore is not available, falling back to AsyncStorage');
          }
          return await AsyncStorage.getItem(key);
        } else {
          console.warn('Neither SecureStore nor AsyncStorage is available');
          return null;
        }
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting item from secure storage:', error);
      // Fallback to AsyncStorage if SecureStore fails
      try {
        if (isAsyncStorageAvailable()) {
          return await AsyncStorage.getItem(key);
        }
        return null;
      } catch (fallbackError) {
        console.error('Fallback AsyncStorage also failed:', fallbackError);
        return null;
      }
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (!isSecureStoreAvailable()) {
        if (isAsyncStorageAvailable()) {
          if (!isTestEnvironment()) {
            console.warn('SecureStore is not available, falling back to AsyncStorage');
          }
          await AsyncStorage.setItem(key, value);
          return;
        } else {
          console.warn('Neither SecureStore nor AsyncStorage is available');
          return;
        }
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error setting item in secure storage:', error);
      // Fallback to AsyncStorage if SecureStore fails
      try {
        if (isAsyncStorageAvailable()) {
          await AsyncStorage.setItem(key, value);
        }
      } catch (fallbackError) {
        console.error('Fallback AsyncStorage also failed:', fallbackError);
        throw fallbackError;
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (!isSecureStoreAvailable()) {
        if (isAsyncStorageAvailable()) {
          if (!isTestEnvironment()) {
            console.warn('SecureStore is not available, falling back to AsyncStorage');
          }
          await AsyncStorage.removeItem(key);
          return;
        } else {
          console.warn('Neither SecureStore nor AsyncStorage is available');
          return;
        }
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing item from secure storage:', error);
      // Fallback to AsyncStorage if SecureStore fails
      try {
        if (isAsyncStorageAvailable()) {
          await AsyncStorage.removeItem(key);
        }
      } catch (fallbackError) {
        console.error('Fallback AsyncStorage also failed:', fallbackError);
        throw fallbackError;
      }
    }
  },

  async clear(): Promise<void> {
    try {
      if (isAsyncStorageAvailable()) {
        await AsyncStorage.clear();
      } else {
        console.warn('AsyncStorage is not available for clearing');
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
};