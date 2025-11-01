import React, { useState, useEffect } from 'react'
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native'
import { useAuthContext } from '@/providers/AuthProvider'
import { BiometricPrompt } from '@/components/BiometricPrompt'
import { Colors } from '@/constants/theme'

interface BiometricGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  onAuthRequired?: () => void
}

export const BiometricGuard: React.FC<BiometricGuardProps> = ({
  children,
  requireAuth = true,
  onAuthRequired,
}) => {
  const { 
    isAuthenticated, 
    biometricEnabled,
  } = useAuthContext()
  
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false)
  const [isAppActive, setIsAppActive] = useState(true)
  const [lastBackgroundTime, setLastBackgroundTime] = useState<Date | null>(null)

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        setIsAppActive(true)
        
        // Check if app was in background for more than 5 minutes
        if (lastBackgroundTime) {
          const timeDiff = new Date().getTime() - lastBackgroundTime.getTime()
          const minutesDiff = timeDiff / (1000 * 60)
          
          if (minutesDiff > 5 && biometricEnabled && isAuthenticated && requireAuth) {
            setShowBiometricPrompt(true)
          }
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsAppActive(false)
        setLastBackgroundTime(new Date())
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    
    return () => {
      subscription?.remove()
    }
  }, [biometricEnabled, isAuthenticated, requireAuth, lastBackgroundTime])

  // Show biometric prompt on app launch if biometric is enabled
  useEffect(() => {
    if (isAuthenticated && biometricEnabled && requireAuth && isAppActive) {
      // Small delay to ensure app is fully loaded
      const timer = setTimeout(() => {
        setShowBiometricPrompt(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isAuthenticated, biometricEnabled, requireAuth, isAppActive])

  const handleBiometricSuccess = () => {
    setShowBiometricPrompt(false)
    // Update last auth time through the auth store directly
  }

  const handleBiometricCancel = () => {
    setShowBiometricPrompt(false)
    
    if (onAuthRequired) {
      onAuthRequired()
    }
  }

  const handleBiometricFallback = () => {
    setShowBiometricPrompt(false)
    
    if (onAuthRequired) {
      onAuthRequired()
    }
  }

  // If not authenticated or biometric not enabled, show children normally
  if (!isAuthenticated || !biometricEnabled || !requireAuth) {
    return <>{children}</>
  }

  return (
    <View style={styles.container}>
      {children}
      
      <BiometricPrompt
        visible={showBiometricPrompt}
        onSuccess={handleBiometricSuccess}
        onCancel={handleBiometricCancel}
        onFallback={handleBiometricFallback}
        title="Authenticate to Continue"
        subtitle="Use your biometric to access Qub Drive"
        fallbackTitle="Use Password"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
})