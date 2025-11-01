import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import * as LocalAuthentication from 'expo-local-authentication'
import { useAuthContext } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/theme'
import { BiometricAuthService } from '@/services/auth/biometricAuth'

export default function BiometricSetupScreen() {
  const { enableBiometric, disableBiometric, biometricEnabled } = useAuthContext()
  
  const [biometricInfo, setBiometricInfo] = useState({
    isAvailable: false,
    supportedTypes: [] as LocalAuthentication.AuthenticationType[],
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkBiometricCapabilities()
  }, [])

  const checkBiometricCapabilities = async () => {
    try {
      const [isAvailable, supportedTypes] = await Promise.all([
        BiometricAuthService.isAvailable(),
        BiometricAuthService.getSupportedTypes(),
      ])

      setBiometricInfo({
        isAvailable,
        supportedTypes,
      })
    } catch (error) {
      console.error('Error checking biometric capabilities:', error)
    }
  }

  const getBiometricTypeText = () => {
    const { supportedTypes } = biometricInfo
    
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID'
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID / Fingerprint'
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Recognition'
    }
    
    return 'Biometric Authentication'
  }

  const getBiometricIcon = () => {
    const { supportedTypes } = biometricInfo
    
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return '👤'
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return '👆'
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return '👁️'
    }
    
    return '🔐'
  }

  const handleEnableBiometric = async () => {
    try {
      setIsLoading(true)
      
      const success = await enableBiometric()
      
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        
        Alert.alert(
          'Biometric Authentication Enabled',
          `${getBiometricTypeText()} has been successfully enabled for your account.`,
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        )
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        
        Alert.alert(
          'Setup Failed',
          'Failed to enable biometric authentication. Please try again.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      console.error('Enable biometric error:', error)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      
      Alert.alert(
        'Setup Failed',
        'An error occurred while setting up biometric authentication.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableBiometric = async () => {
    try {
      Alert.alert(
        'Disable Biometric Authentication',
        `Are you sure you want to disable ${getBiometricTypeText()}? You'll need to use your password to sign in.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true)
              
              try {
                await disableBiometric()
                
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                
                Alert.alert(
                  'Biometric Authentication Disabled',
                  `${getBiometricTypeText()} has been disabled for your account.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => router.back()
                    }
                  ]
                )
              } catch (error) {
                console.error('Disable biometric error:', error)
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
                
                Alert.alert(
                  'Disable Failed',
                  'An error occurred while disabling biometric authentication.',
                  [{ text: 'OK' }]
                )
              } finally {
                setIsLoading(false)
              }
            }
          }
        ]
      )
    } catch (error) {
      console.error('Disable biometric error:', error)
    }
  }

  const handleSkip = () => {
    router.back()
  }

  if (!biometricInfo.isAvailable) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.unavailableContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.unavailableIcon}>🚫</Text>
            </View>
            
            <Text style={styles.title}>Biometric Authentication Unavailable</Text>
            <Text style={styles.unavailableMessage}>
              Biometric authentication is not available on this device or no biometric data is enrolled.
            </Text>
            
            <Text style={styles.instructionText}>
              To use biometric authentication, please:
              {'\n'}• Ensure your device supports biometrics
              {'\n'}• Set up Face ID, Touch ID, or Fingerprint in device settings
              {'\n'}• Try again after setup
            </Text>

            <Button
              title="Back"
              onPress={handleSkip}
              style={styles.backButton}
            />
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.biometricIcon}>{getBiometricIcon()}</Text>
          </View>
          
          <Text style={styles.title}>
            {biometricEnabled ? 'Manage' : 'Enable'} {getBiometricTypeText()}
          </Text>
          
          <Text style={styles.description}>
            {biometricEnabled 
              ? `${getBiometricTypeText()} is currently enabled for your account. You can disable it if you prefer to use password authentication only.`
              : `Use ${getBiometricTypeText()} to quickly and securely access your Qub Drive account without entering your password.`
            }
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>⚡</Text>
              <Text style={styles.benefitText}>Quick and convenient access</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🔒</Text>
              <Text style={styles.benefitText}>Enhanced security</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🛡️</Text>
              <Text style={styles.benefitText}>Your biometric data stays on your device</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            {biometricEnabled ? (
              <Button
                title={`Disable ${getBiometricTypeText()}`}
                onPress={handleDisableBiometric}
                variant="outline"
                loading={isLoading}
                style={styles.actionButton}
              />
            ) : (
              <Button
                title={`Enable ${getBiometricTypeText()}`}
                onPress={handleEnableBiometric}
                loading={isLoading}
                style={styles.actionButton}
              />
            )}

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>
                {biometricEnabled ? 'Back' : 'Skip for Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  unavailableContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.light.tint}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  biometricIcon: {
    fontSize: 48,
  },
  unavailableIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  unavailableMessage: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'left',
    lineHeight: 20,
    marginBottom: 32,
  },
  benefitsList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  buttonContainer: {
    alignSelf: 'stretch',
  },
  actionButton: {
    marginBottom: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    fontWeight: '500',
  },
})