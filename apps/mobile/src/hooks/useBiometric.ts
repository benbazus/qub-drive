import { useState, useEffect, useCallback } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import { BiometricAuthService } from '@/services/auth/biometricAuth'
import { BiometricAuthResult } from '@/types/auth'

interface BiometricInfo {
  isAvailable: boolean
  isEnabled: boolean
  supportedTypes: LocalAuthentication.AuthenticationType[]
}

export const useBiometric = () => {
  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo>({
    isAvailable: false,
    isEnabled: false,
    supportedTypes: [],
  })
  const [isLoading, setIsLoading] = useState(false)

  const checkBiometricInfo = useCallback(async () => {
    try {
      setIsLoading(true)
      const info = await BiometricAuthService.getAuthenticationInfo()
      setBiometricInfo(info)
    } catch (error) {
      console.error('Error checking biometric info:', error)
      setBiometricInfo({
        isAvailable: false,
        isEnabled: false,
        supportedTypes: [],
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check biometric capabilities on mount
  useEffect(() => {
    checkBiometricInfo()
  }, [checkBiometricInfo])

  const authenticate = useCallback(async (promptMessage?: string): Promise<BiometricAuthResult> => {
    try {
      setIsLoading(true)
      const result = await BiometricAuthService.authenticate(promptMessage)
      return result
    } catch (error) {
      console.error('Biometric authentication error:', error)
      return {
        success: false,
        error: 'Authentication failed'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const enableBiometric = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      const success = await BiometricAuthService.enableForUser()
      if (success) {
        // Refresh biometric info
        await checkBiometricInfo()
      }
      return success
    } catch (error) {
      console.error('Error enabling biometric:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [checkBiometricInfo])

  const disableBiometric = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      await BiometricAuthService.disableForUser()
      // Refresh biometric info
      await checkBiometricInfo()
    } catch (error) {
      console.error('Error disabling biometric:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [checkBiometricInfo])

  const getBiometricTypeText = useCallback((): string => {
    const { supportedTypes } = biometricInfo
    
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID'
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID'
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Recognition'
    }
    
    return 'Biometric Authentication'
  }, [biometricInfo])

  const getBiometricIcon = useCallback((): string => {
    const { supportedTypes } = biometricInfo
    
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return '👤'
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return '👆'
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return '👁️'
    }
    
    return '🔐'
  }, [biometricInfo])

  return {
    // State
    biometricInfo,
    isLoading,
    
    // Actions
    authenticate,
    enableBiometric,
    disableBiometric,
    checkBiometricInfo,
    
    // Utilities
    getBiometricTypeText,
    getBiometricIcon,
  }
}