import { secureStorage } from '@/utils/storage';

describe('secureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get item from storage', async () => {
    const result = await secureStorage.getItem('test-key');
    expect(result).toBeNull();
  });

  it('should set item in storage', async () => {
    await expect(secureStorage.setItem('test-key', 'test-value')).resolves.toBeUndefined();
  });

  it('should remove item from storage', async () => {
    await expect(secureStorage.removeItem('test-key')).resolves.toBeUndefined();
  });

  it('should clear storage', async () => {
    await expect(secureStorage.clear()).resolves.toBeUndefined();
  });

  it('should handle errors gracefully', async () => {
    // Mock AsyncStorage to throw an error
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));
    
    const result = await secureStorage.getItem('test-key');
    expect(result).toBeNull();
  });
});