import { act, renderHook } from '@testing-library/react-native';
import { useAuthStore } from '@/stores/auth/authStore';
import { apiClient } from '@/services/api';
import { secureStorage } from '@/utils/storage';
import { BiometricAuthService } from '@/services/auth/biometricAuth';
import { STORAGE_KEYS } from '@/config/constants';
import type { User, AuthResponse } from '@/types/auth';

// Mock dependencies
jest.mock('@/services/api');
jest.mock('@/utils/storage');
jest.mock('@/services/auth/biometricAuth');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockSecureStorage = secureStorage as jest.Mocked<typeof secureStorage>;
const mockBiometricAuthService = BiometricAuthService as jest.Mocked<typeof BiometricAuthService>;

describe('AuthStore', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const createMockAxiosResponse = <T>(data: T) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset store state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      biometricEnabled: false,
      lastAuthTime: null,
    });
  });

  describe('login', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockAuthResponse: AuthResponse = {
      user: mockUser,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    it('should login successfully with valid credentials', async () => {
      mockApiClient.post.mockResolvedValueOnce(createMockAxiosResponse(mockAuthResponse));
      mockBiometricAuthService.isEnabledForUser.mockResolvedValueOnce(false);
      mockSecureStorage.setItem.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login(mockCredentials);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', mockCredentials);
      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
        'mock-access-token'
      );
      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN,
        'mock-refresh-token'
      );
      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(mockUser)
      );

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe('mock-access-token');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle login failure', async () => {
      const mockError = new Error('Invalid credentials');
      mockApiClient.post.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login(mockCredentials);
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during login', async () => {
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockApiClient.post.mockReturnValueOnce(loginPromise);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockCredentials);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin!(createMockAxiosResponse(mockAuthResponse));
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    const mockCredentials = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const mockAuthResponse: AuthResponse = {
      user: mockUser,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    it('should register successfully with valid credentials', async () => {
      mockApiClient.post.mockResolvedValueOnce(createMockAxiosResponse(mockAuthResponse));
      mockSecureStorage.setItem.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register(mockCredentials);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', mockCredentials);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.biometricEnabled).toBe(false);
    });

    it('should handle registration failure', async () => {
      const mockError = new Error('Email already exists');
      mockApiClient.post.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.register(mockCredentials);
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: mockUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        isAuthenticated: true,
      });

      mockApiClient.post.mockResolvedValueOnce(createMockAxiosResponse({}));
      mockSecureStorage.removeItem.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockSecureStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
      expect(mockSecureStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);
      expect(mockSecureStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_DATA);

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.accessToken).toBe(null);
    });

    it('should logout even if API call fails', async () => {
      useAuthStore.setState({
        user: mockUser,
        accessToken: 'mock-access-token',
        isAuthenticated: true,
      });

      mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));
      mockSecureStorage.removeItem.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      useAuthStore.setState({
        refreshToken: 'mock-refresh-token',
      });

      const mockRefreshResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockApiClient.post.mockResolvedValueOnce(createMockAxiosResponse(mockRefreshResponse));
      mockSecureStorage.setItem.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshTokens();
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'mock-refresh-token',
      });
      expect(result.current.accessToken).toBe('new-access-token');
      expect(result.current.refreshToken).toBe('new-refresh-token');
    });

    it('should logout if refresh fails', async () => {
      useAuthStore.setState({
        refreshToken: 'mock-refresh-token',
        isAuthenticated: true,
      });

      mockApiClient.post.mockRejectedValueOnce(new Error('Invalid refresh token'));
      mockSecureStorage.removeItem.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.refreshTokens();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should throw error if no refresh token available', async () => {
      useAuthStore.setState({
        refreshToken: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.refreshTokens();
        } catch (error) {
          expect(error).toEqual(new Error('No refresh token available'));
        }
      });
    });
  });

  describe('checkAuthStatus', () => {
    it('should restore authenticated state from storage', async () => {
      mockSecureStorage.getItem
        .mockResolvedValueOnce('mock-access-token') // ACCESS_TOKEN
        .mockResolvedValueOnce('mock-refresh-token') // REFRESH_TOKEN
        .mockResolvedValueOnce(JSON.stringify(mockUser)); // USER_DATA
      
      mockBiometricAuthService.isEnabledForUser.mockResolvedValueOnce(true);
      mockApiClient.get.mockResolvedValueOnce(createMockAxiosResponse({}));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuthStatus();
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.biometricEnabled).toBe(true);
    });

    it('should clear data if token validation fails', async () => {
      mockSecureStorage.getItem
        .mockResolvedValueOnce('invalid-token')
        .mockResolvedValueOnce('mock-refresh-token')
        .mockResolvedValueOnce(JSON.stringify(mockUser));
      
      mockBiometricAuthService.isEnabledForUser.mockResolvedValueOnce(false);
      mockApiClient.get.mockRejectedValueOnce(new Error('Unauthorized'));
      mockApiClient.post.mockRejectedValueOnce(new Error('Invalid refresh token'));
      mockSecureStorage.removeItem.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuthStatus();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe('biometric authentication', () => {
    describe('enableBiometric', () => {
      it('should enable biometric authentication successfully', async () => {
        mockBiometricAuthService.enableForUser.mockResolvedValueOnce(true);

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          const success = await result.current.enableBiometric();
          expect(success).toBe(true);
        });

        expect(result.current.biometricEnabled).toBe(true);
      });

      it('should handle biometric enable failure', async () => {
        mockBiometricAuthService.enableForUser.mockResolvedValueOnce(false);

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          const success = await result.current.enableBiometric();
          expect(success).toBe(false);
        });

        expect(result.current.biometricEnabled).toBe(false);
      });
    });

    describe('disableBiometric', () => {
      it('should disable biometric authentication', async () => {
        useAuthStore.setState({ biometricEnabled: true });
        mockBiometricAuthService.disableForUser.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          await result.current.disableBiometric();
        });

        expect(result.current.biometricEnabled).toBe(false);
      });
    });

    describe('authenticateWithBiometric', () => {
      it('should authenticate with biometric successfully', async () => {
        useAuthStore.setState({ biometricEnabled: true });
        mockBiometricAuthService.authenticate.mockResolvedValueOnce({ success: true });

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          const authResult = await result.current.authenticateWithBiometric();
          expect(authResult.success).toBe(true);
        });

        expect(result.current.lastAuthTime).toBeTruthy();
      });

      it('should fail if biometric is not enabled', async () => {
        useAuthStore.setState({ biometricEnabled: false });

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          const authResult = await result.current.authenticateWithBiometric();
          expect(authResult.success).toBe(false);
          expect(authResult.error).toBe('Biometric authentication is not enabled');
        });
      });

      it('should handle biometric authentication failure', async () => {
        useAuthStore.setState({ biometricEnabled: true });
        mockBiometricAuthService.authenticate.mockResolvedValueOnce({
          success: false,
          error: 'Authentication failed',
        });

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          const authResult = await result.current.authenticateWithBiometric();
          expect(authResult.success).toBe(false);
          expect(authResult.error).toBe('Authentication failed');
        });
      });
    });
  });

  describe('utility methods', () => {
    describe('isTokenExpired', () => {
      it('should return true if no lastAuthTime', () => {
        const { result } = renderHook(() => useAuthStore());
        expect(result.current.isTokenExpired()).toBe(true);
      });

      it('should return true if token is older than 24 hours', () => {
        const oldDate = new Date();
        oldDate.setHours(oldDate.getHours() - 25);
        
        useAuthStore.setState({ lastAuthTime: oldDate });

        const { result } = renderHook(() => useAuthStore());
        expect(result.current.isTokenExpired()).toBe(true);
      });

      it('should return false if token is within 24 hours', () => {
        const recentDate = new Date();
        recentDate.setHours(recentDate.getHours() - 1);
        
        useAuthStore.setState({ lastAuthTime: recentDate });

        const { result } = renderHook(() => useAuthStore());
        expect(result.current.isTokenExpired()).toBe(false);
      });
    });

    describe('clearAuthData', () => {
      it('should clear all authentication data', async () => {
        useAuthStore.setState({
          user: mockUser,
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          isAuthenticated: true,
        });

        mockSecureStorage.removeItem.mockResolvedValue(undefined);

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          await result.current.clearAuthData();
        });

        expect(result.current.user).toBe(null);
        expect(result.current.accessToken).toBe(null);
        expect(result.current.refreshToken).toBe(null);
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });

  describe('password reset', () => {
    it('should handle password reset successfully', async () => {
      const resetCredentials = { email: 'test@example.com' };
      mockApiClient.post.mockResolvedValueOnce(createMockAxiosResponse({}));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.resetPassword(resetCredentials);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', resetCredentials);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle password reset failure', async () => {
      const resetCredentials = { email: 'test@example.com' };
      const mockError = new Error('User not found');
      mockApiClient.post.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.resetPassword(resetCredentials);
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('biometric availability check', () => {
    it('should check biometric availability', async () => {
      mockBiometricAuthService.isAvailable.mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const isAvailable = await result.current.checkBiometricAvailability();
        expect(isAvailable).toBe(true);
      });

      expect(mockBiometricAuthService.isAvailable).toHaveBeenCalled();
    });
  });
});