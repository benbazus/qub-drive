import { useCallback } from 'react'
import { useAuthStore } from '@/stores/auth/authStore'
import { LoginCredentials, RegisterCredentials, ResetPasswordCredentials } from '@/types/auth'

/**
 * Custom hook for authentication operations
 */
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    biometricEnabled,
    lastAuthTime,
    login,
    register,
    logout,
    resetPassword,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
    checkBiometricAvailability,
    checkAuthStatus,
    setLoading,
    updateLastAuthTime,
    isTokenExpired,
  } = useAuthStore()

  // Memoized login function
  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    try {
      await login(credentials)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }, [login])

  // Memoized register function
  const handleRegister = useCallback(async (credentials: RegisterCredentials) => {
    try {
      await register(credentials)
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }, [register])

  // Memoized logout function
  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }, [logout])

  // Memoized password reset function
  const handleResetPassword = useCallback(async (credentials: ResetPasswordCredentials) => {
    try {
      await resetPassword(credentials)
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }, [resetPassword])

  // Memoized biometric enable function
  const handleEnableBiometric = useCallback(async () => {
    try {
      const success = await enableBiometric()
      return success
    } catch (error) {
      console.error('Enable biometric error:', error)
      return false
    }
  }, [enableBiometric])

  // Memoized biometric disable function
  const handleDisableBiometric = useCallback(async () => {
    try {
      await disableBiometric()
    } catch (error) {
      console.error('Disable biometric error:', error)
      throw error
    }
  }, [disableBiometric])

  // Memoized biometric authentication function
  const handleBiometricAuth = useCallback(async () => {
    try {
      const result = await authenticateWithBiometric()
      return result
    } catch (error) {
      console.error('Biometric authentication error:', error)
      return { success: false, error: 'Authentication failed' }
    }
  }, [authenticateWithBiometric])

  // Check if user needs to re-authenticate
  const needsReauth = useCallback(() => {
    return isTokenExpired() || !isAuthenticated
  }, [isTokenExpired, isAuthenticated])

  // Initialize authentication on app start
  const initializeAuth = useCallback(async () => {
    try {
      await checkAuthStatus()
    } catch (error) {
      console.error('Auth initialization error:', error)
    }
  }, [checkAuthStatus])

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    biometricEnabled,
    lastAuthTime,
    
    // Actions
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    enableBiometric: handleEnableBiometric,
    disableBiometric: handleDisableBiometric,
    authenticateWithBiometric: handleBiometricAuth,
    checkBiometricAvailability,
    initializeAuth,
    
    // Utilities
    needsReauth,
    setLoading,
    updateLastAuthTime,
  }
}