import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { User, BiometricAuthResult } from '@/types/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  biometricEnabled: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, confirmPassword: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  enableBiometric: () => Promise<boolean>
  disableBiometric: () => Promise<void>
  authenticateWithBiometric: () => Promise<BiometricAuthResult>
  checkBiometricAvailability: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    biometricEnabled,
    login: authLogin,
    register: authRegister,
    logout: authLogout,
    resetPassword: authResetPassword,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
    checkBiometricAvailability,
    initializeAuth,
  } = useAuth()

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Wrapper functions to match context interface
  const login = async (email: string, password: string) => {
    await authLogin({ email, password })
  }

  const register = async (email: string, password: string, name: string, confirmPassword: string) => {
    await authRegister({ email, password, name, confirmPassword })
  }

  const logout = async () => {
    await authLogout()
  }

  const resetPassword = async (email: string) => {
    await authResetPassword({ email })
  }

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    biometricEnabled,
    login,
    register,
    logout,
    resetPassword,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
    checkBiometricAvailability,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to use the authentication context
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}