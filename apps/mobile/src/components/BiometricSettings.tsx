import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import * as LocalAuthentication from 'expo-local-authentication'
import { useAuthContext } from '@/providers/AuthProvider'
import { BiometricAuthService } from '@/services/auth/biometricAuth'
import { Colors } from '@/constants/theme'

interface BiometricSettingsProps {
  onSettingsChange?: (enabled: boolean) => void
}

export const BiometricSettings: React.FC<BiometricSettingsProps> = ({
  onSettingsChange
}) => {
  const { biometricEnabled, enableBiometric, disableBiometric } = useAuthContext()
  
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

  const handleToggleBiometric = async (enabled: boolean) => {
    if (!biometricInfo.isAvailable) {
      Alert.alert(
        'Not Available',
        'Biometric authentication is not available on this device.',
        [{ text: 'OK' }]
      )
      return
    }

    try {
      setIsLoading(true)
      
      if (enabled) {
        const success = await enableBiometric()
        
        if (success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          onSettingsChange?.(true)
          
          Alert.alert(
            'Biometric Authentication Enabled',
            `${getBiometricTypeText()} has been successfully enabled for your account.`,
            [{ text: 'OK' }]
          )
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          
          Alert.alert(
            'Setup Failed',
            'Failed to enable biometric authentication. Please try again.',
            [{ text: 'OK' }]
          )
        }
      } else {
        Alert.alert(
          'Disable Biometric Authentication',
          `Are you sure you want to disable ${getBiometricTypeText()}? You'll need to use your password to sign in.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                try {
                  await disableBiometric()
                  
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                  onSettingsChange?.(false)
                  
                  Alert.alert(
                    'Biometric Authentication Disabled',
                    `${getBiometricTypeText()} has been disabled for your account.`,
                    [{ text: 'OK' }]
                  )
                } catch (error) {
                  console.error('Disable biometric error:', error)
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
                  
                  Alert.alert(
                    'Disable Failed',
                    'An error occurred while disabling biometric authentication.',
                    [{ text: 'OK' }]
                  )
                }
              }
            }
          ]
        )
      }
    } catch (error) {
      console.error('Toggle biometric error:', error)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      
      Alert.alert(
        'Error',
        'An error occurred while updating biometric settings.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestBiometric = async () => {
    if (!biometricEnabled) {
      Alert.alert(
        'Not Enabled',
        'Please enable biometric authentication first.',
        [{ text: 'OK' }]
      )
      return
    }

    try {
      const result = await BiometricAuthService.authenticate('Test biometric authentication')
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        Alert.alert(
          'Success',
          'Biometric authentication test completed successfully!',
          [{ text: 'OK' }]
        )
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        Alert.alert(
          'Test Failed',
          result.error || 'Biometric authentication test failed.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      console.error('Test biometric error:', error)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      
      Alert.alert(
        'Test Failed',
        'An error occurred during the biometric test.',
        [{ text: 'OK' }]
      )
    }
  }

  if (!biometricInfo.isAvailable) {
    return (
      <View style={styles.container}>
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
            {'\n'}• Restart the app after setup
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.biometricIcon}>{getBiometricIcon()}</Text>
        </View>
        
        <Text style={styles.title}>{getBiometricTypeText()}</Text>
        
        <Text style={styles.description}>
          {biometricEnabled 
            ? `${getBiometricTypeText()} is currently enabled for your account. You can disable it or test the functionality below.`
            : `Use ${getBiometricTypeText()} to quickly and securely access your Qub Drive account without entering your password.`
          }
        </Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Enable {getBiometricTypeText()}</Text>
            <Text style={styles.settingSubtitle}>
              {biometricEnabled ? 'Authentication is enabled' : 'Authentication is disabled'}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleToggleBiometric}
            disabled={isLoading}
            trackColor={{ false: Colors.light.tabIconDefault, true: Colors.light.tint }}
            thumbColor={biometricEnabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        {biometricEnabled && (
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestBiometric}
          >
            <Text style={styles.testButtonText}>Test {getBiometricTypeText()}</Text>
          </TouchableOpacity>
        )}

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
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  unavailableContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.light.tabIconDefault}20`,
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  testButton: {
    alignSelf: 'stretch',
    padding: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  benefitsList: {
    alignSelf: 'stretch',
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
})