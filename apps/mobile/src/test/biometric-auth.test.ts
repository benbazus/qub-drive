import * as LocalAuthentication from 'expo-local-authentication';
import { BiometricAuthService } from '@/services/auth/biometricAuth';
import { secureStorage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/config/constants';

// Mock dependencies
jest.mock('expo-local-authentication');
jest.mock('@/utils/storage');

const mockLocalAuthentication = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;
const mockSecureStorage = secureStorage as jest.Mocked<typeof secureStorage>;

describe('BiometricAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAvailable', () => {
    it('should return true when hardware and enrollment are available', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);

      const result = await BiometricAuthService.isAvailable();

      expect(result).toBe(true);
      expect(mockLocalAuthentication.hasHardwareAsync).toHaveBeenCalled();
      expect(mockLocalAuthentication.isEnrolledAsync).toHaveBeenCalled();
    });

    it('should return false when hardware is not available', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(false);
      mockLocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);

      const result = await BiometricAuthService.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false when biometrics are not enrolled', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(false);

      const result = await BiometricAuthService.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false when an error occurs', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockRejectedValueOnce(new Error('Hardware check failed'));

      const result = await BiometricAuthService.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('getSupportedTypes', () => {
    it('should return supported authentication types', async () => {
      const mockTypes = [
        LocalAuthentication.AuthenticationType.FINGERPRINT,
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ];
      mockLocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValueOnce(mockTypes);

      const result = await BiometricAuthService.getSupportedTypes();

      expect(result).toEqual(mockTypes);
      expect(mockLocalAuthentication.supportedAuthenticationTypesAsync).toHaveBeenCalled();
    });

    it('should return empty array when an error occurs', async () => {
      mockLocalAuthentication.supportedAuthenticationTypesAsync.mockRejectedValueOnce(
        new Error('Failed to get types')
      );

      const result = await BiometricAuthService.getSupportedTypes();

      expect(result).toEqual([]);
    });
  });

  describe('authenticate', () => {
    it('should authenticate successfully when biometrics are available', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.authenticateAsync.mockResolvedValueOnce({ success: true });

      const result = await BiometricAuthService.authenticate();

      expect(result.success).toBe(true);
      expect(mockLocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: 'Authenticate to access Qub Drive',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
    });

    it('should use custom prompt message', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.authenticateAsync.mockResolvedValueOnce({ success: true });

      const customMessage = 'Custom authentication message';
      await BiometricAuthService.authenticate(customMessage);

      expect(mockLocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: customMessage,
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
    });

    it('should return error when biometrics are not available', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(false);
      mockLocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);

      const result = await BiometricAuthService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Biometric authentication is not available on this device');
      expect(mockLocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
    });

    it('should return error when authentication fails', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.authenticateAsync.mockResolvedValueOnce({ success: false });

      const result = await BiometricAuthService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });

    it('should handle authentication errors', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.authenticateAsync.mockRejectedValueOnce(new Error('Auth error'));

      const result = await BiometricAuthService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('An error occurred during authentication');
    });
  });

  describe('enableForUser', () => {
    it('should enable biometric authentication successfully', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.authenticateAsync.mockResolvedValueOnce({ success: true });
      mockSecureStorage.setItem.mockResolvedValueOnce(undefined);

      const result = await BiometricAuthService.enableForUser();

      expect(result).toBe(true);
      expect(mockLocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: 'Enable biometric authentication for Qub Drive',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
    });

    it('should return false when biometrics are not available', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(false);
      mockLocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);

      const result = await BiometricAuthService.enableForUser();

      expect(result).toBe(false);
      expect(mockSecureStorage.setItem).not.toHaveBeenCalled();
    });

    it('should return false when authentication fails', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.authenticateAsync.mockResolvedValueOnce({ success: false });

      const result = await BiometricAuthService.enableForUser();

      expect(result).toBe(false);
      expect(mockSecureStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockRejectedValueOnce(new Error('Hardware error'));

      const result = await BiometricAuthService.enableForUser();

      expect(result).toBe(false);
    });
  });

  describe('disableForUser', () => {
    it('should disable biometric authentication', async () => {
      mockSecureStorage.removeItem.mockResolvedValueOnce(undefined);

      await BiometricAuthService.disableForUser();

      expect(mockSecureStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.BIOMETRIC_ENABLED);
    });

    it('should handle errors gracefully', async () => {
      mockSecureStorage.removeItem.mockRejectedValueOnce(new Error('Storage error'));

      // Should not throw
      await expect(BiometricAuthService.disableForUser()).resolves.toBeUndefined();
    });
  });

  describe('isEnabledForUser', () => {
    it('should return true when biometric is enabled', async () => {
      mockSecureStorage.getItem.mockResolvedValueOnce('true');

      const result = await BiometricAuthService.isEnabledForUser();

      expect(result).toBe(true);
      expect(mockSecureStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.BIOMETRIC_ENABLED);
    });

    it('should return false when biometric is not enabled', async () => {
      mockSecureStorage.getItem.mockResolvedValueOnce('false');

      const result = await BiometricAuthService.isEnabledForUser();

      expect(result).toBe(false);
    });

    it('should return false when no value is stored', async () => {
      mockSecureStorage.getItem.mockResolvedValueOnce(null);

      const result = await BiometricAuthService.isEnabledForUser();

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockSecureStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await BiometricAuthService.isEnabledForUser();

      expect(result).toBe(false);
    });
  });

  describe('getAuthenticationInfo', () => {
    it('should return complete authentication info', async () => {
      const mockTypes = [LocalAuthentication.AuthenticationType.FINGERPRINT];
      
      mockLocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(true);
      mockLocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);
      mockSecureStorage.getItem.mockResolvedValueOnce('true');
      mockLocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValueOnce(mockTypes);

      const result = await BiometricAuthService.getAuthenticationInfo();

      expect(result).toEqual({
        isAvailable: true,
        isEnabled: true,
        supportedTypes: mockTypes,
      });
    });

    it('should handle mixed availability states', async () => {
      mockLocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(false);
      mockLocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(true);
      mockSecureStorage.getItem.mockResolvedValueOnce('true');
      mockLocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValueOnce([]);

      const result = await BiometricAuthService.getAuthenticationInfo();

      expect(result).toEqual({
        isAvailable: false,
        isEnabled: true,
        supportedTypes: [],
      });
    });
  });
});