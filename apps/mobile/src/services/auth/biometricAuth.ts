import * as LocalAuthentication from 'expo-local-authentication'
import { BiometricAuthResult } from '@/types/auth'
import { secureStorage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/constants'

export class BiometricAuthService {
  /**
   * Check if biometric authentication is available on the device
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      return hasHardware && isEnrolled
    } catch (error) {
      console.error('Error checking biometric availability:', error)
      return false
    }
  }

  /**
   * Get available biometric types
   */
  static async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync()
    } catch (error) {
      console.error('Error getting supported biometric types:', error)
      return []
    }
  }

  /**
   * Authenticate using biometrics
   */
  static async authenticate(promptMessage?: string): Promise<BiometricAuthResult> {
    try {
      const isAvailable = await this.isAvailable()
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device'
        }
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Authenticate to access Qub Drive',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      })

      if (result.success) {
        return { success: true }
      } else {
        return {
          success: false,
          error: 'Authentication failed'
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error)
      return {
        success: false,
        error: 'An error occurred during authentication'
      }
    }
  }

  /**
   * Enable biometric authentication for the user
   */
  static async enableForUser(): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable()
      if (!isAvailable) {
        return false
      }

      // Test authentication first
      const authResult = await this.authenticate('Enable biometric authentication for Qub Drive')
      if (authResult.success) {
        await secureStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true')
        return true
      }
      return false
    } catch (error) {
      console.error('Error enabling biometric auth:', error)
      return false
    }
  }

  /**
   * Disable biometric authentication for the user
   */
  static async disableForUser(): Promise<void> {
    try {
      await secureStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED)
    } catch (error) {
      console.error('Error disabling biometric auth:', error)
    }
  }

  /**
   * Check if biometric authentication is enabled for the user
   */
  static async isEnabledForUser(): Promise<boolean> {
    try {
      const enabled = await secureStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED)
      return enabled === 'true'
    } catch (error) {
      console.error('Error checking biometric enabled status:', error)
      return false
    }
  }

  /**
   * Get biometric authentication info
   */
  static async getAuthenticationInfo(): Promise<{
    isAvailable: boolean
    isEnabled: boolean
    supportedTypes: LocalAuthentication.AuthenticationType[]
  }> {
    const [isAvailable, isEnabled, supportedTypes] = await Promise.all([
      this.isAvailable(),
      this.isEnabledForUser(),
      this.getSupportedTypes()
    ])

    return {
      isAvailable,
      isEnabled,
      supportedTypes
    }
  }
}