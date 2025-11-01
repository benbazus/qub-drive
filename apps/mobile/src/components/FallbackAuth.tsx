import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { useAuthContext } from '@/providers/AuthProvider'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/theme'
import { validateLoginForm, ValidationErrors } from '@/utils/validation'

interface FallbackAuthProps {
  visible: boolean
  onSuccess: () => void
  onCancel: () => void
  title?: string
  subtitle?: string
}

export const FallbackAuth: React.FC<FallbackAuthProps> = ({
  visible,
  onSuccess,
  onCancel,
  title = 'Enter Password',
  subtitle = 'Please enter your password to continue',
}) => {
  const { user, login, isLoading } = useAuthContext()
  
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<ValidationErrors>({})

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    // Clear error when user starts typing
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined as string | undefined }))
    }
  }

  const handleAuthenticate = async () => {
    try {
      if (!user?.email) {
        Alert.alert('Error', 'User email not found. Please log in again.')
        return
      }

      // Validate password
      const validationErrors = validateLoginForm(user.email, password)
      if (validationErrors.password) {
        setErrors(validationErrors)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return
      }

      await login(user.email, password)
      
      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      
      // Clear password and close modal
      setPassword('')
      setErrors({})
      onSuccess()
    } catch (error: unknown) {
      console.error('Fallback authentication error:', error)
      
      // Error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid password. Please try again.'
      setErrors({
        password: errorMessage
      })
    }
  }

  const handleCancel = () => {
    setPassword('')
    setErrors({})
    onCancel()
  }

  if (!visible) {
    return null
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔑</Text>
            </View>
            
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            
            {user?.email && (
              <View style={styles.userInfo}>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            )}

            <View style={styles.form}>
              <Input
                label="Password"
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Enter your password"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleAuthenticate}
                error={errors.password}
                autoFocus
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Authenticate"
                onPress={handleAuthenticate}
                loading={isLoading}
                style={styles.authButton}
              />
              
              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="outline"
                style={styles.cancelButton}
              />
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
  userInfo: {
    backgroundColor: `${Colors.light.tint}10`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  userEmail: {
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  buttonContainer: {
    alignSelf: 'stretch',
  },
  authButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 0,
  },
})