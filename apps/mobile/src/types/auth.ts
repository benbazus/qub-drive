// Authentication related type definitions
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
  confirmPassword: string
}

export interface ResetPasswordCredentials {
  email: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  biometricEnabled: boolean
  lastAuthTime: Date | null
}

export interface BiometricAuthResult {
  success: boolean
  error?: string
}

export interface DeviceInfo {
  deviceId: string
  platform: 'ios' | 'android'
  version: string
  pushToken?: string
}