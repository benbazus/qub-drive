import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import * as LocalAuthentication from 'expo-local-authentication'
import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/theme'
import { BiometricAuthService } from '@/services/auth/biometricAuth'

interface BiometricPromptProps {
  visible: boolean
  onSuccess: () => void
  onCancel: () => void
  onFallback?: () => void
  title?: string
  subtitle?: string
  fallbackTitle?: string
}

export const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  visible,
  onSuccess,
  onCancel,
  onFallback,
  title = 'Authenticate',
  subtitle = 'Use your biometric to authenticate',
  fallbackTitle = 'Use Password',
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [biometricType, setBiometricType] = useState<string>('Biometric')

  const handleBiometricAuth = useCallback(async () => {
    try {
      setIsAuthenticating(true)
      
      const result = await BiometricAuthService.authenticate(title)
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        onSuccess()
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        
        // Show error if it's not a user cancellation
        if (result.error && !result.error.includes('cancel')) {
          Alert.alert(
            'Authentication Failed',
            result.error,
            [
              { text: 'Try Again', onPress: handleBiometricAuth },
              { text: 'Cancel', onPress: onCancel, style: 'cancel' }
            ]
          )
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      
      Alert.alert(
        'Authentication Error',
        'An error occurred during authentication. Please try again.',
        [
          { text: 'Try Again', onPress: handleBiometricAuth },
          { text: 'Cancel', onPress: onCancel, style: 'cancel' }
        ]
      )
    } finally {
      setIsAuthenticating(false)
    }
  }, [title, onSuccess, onCancel])

  useEffect(() => {
    if (visible) {
      getBiometricType()
      // Auto-trigger biometric authentication when modal becomes visible
      setTimeout(() => {
        handleBiometricAuth()
      }, 500)
    }
  }, [visible, handleBiometricAuth])

  const getBiometricType = async () => {
    try {
      const supportedTypes = await BiometricAuthService.getSupportedTypes()
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID')
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID')
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('Iris')
      } else {
        setBiometricType('Biometric')
      }
    } catch (error) {
      console.error('Error getting biometric type:', error)
    }
  }

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'Face ID':
        return '👤'
      case 'Touch ID':
        return '👆'
      case 'Iris':
        return '👁️'
      default:
        return '🔐'
    }
  }



  const handleFallback = () => {
    if (onFallback) {
      onFallback()
    } else {
      onCancel()
    }
  }

  if (!visible) {
    return null
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{getBiometricIcon()}</Text>
            </View>
            
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                {biometricType === 'Face ID' 
                  ? 'Look at your device to authenticate'
                  : biometricType === 'Touch ID'
                  ? 'Place your finger on the sensor'
                  : 'Use your biometric to authenticate'
                }
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Try Again"
                onPress={handleBiometricAuth}
                loading={isAuthenticating}
                style={styles.tryAgainButton}
              />
              
              {onFallback && (
                <Button
                  title={fallbackTitle}
                  onPress={handleFallback}
                  variant="outline"
                  style={styles.fallbackButton}
                />
              )}
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    margin: 24,
    maxWidth: 320,
    width: '100%',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.light.tint}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionContainer: {
    backgroundColor: `${Colors.light.tint}10`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    alignSelf: 'stretch',
  },
  instructionText: {
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
  },
  buttonContainer: {
    alignSelf: 'stretch',
  },
  tryAgainButton: {
    marginBottom: 12,
  },
  fallbackButton: {
    marginBottom: 12,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    fontWeight: '500',
  },
})