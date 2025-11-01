import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useAuthContext } from '@/providers/AuthProvider'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/theme'
import { validateResetPasswordForm, ValidationErrors } from '@/utils/validation'

export default function ForgotPasswordScreen() {
  const { resetPassword, isLoading } = useAuthContext()
  
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [emailSent, setEmailSent] = useState(false)

  const handleInputChange = (value: string) => {
    setEmail(value)
    // Clear error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined as string | undefined }))
    }
  }

  const handleResetPassword = async () => {
    try {
      // Validate form
      const validationErrors = validateResetPasswordForm(email)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return
      }

      await resetPassword(email)
      
      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      
      setEmailSent(true)
    } catch (error: unknown) {
      console.error('Reset password error:', error)
      
      // Error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      
      Alert.alert(
        'Reset Failed',
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'An error occurred while sending the reset email. Please try again.',
        [{ text: 'OK' }]
      )
    }
  }

  const navigateToLogin = () => {
    router.push('/auth/login')
  }

  const handleResendEmail = () => {
    setEmailSent(false)
    handleResetPassword()
  }

  if (emailSent) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successMessage}>
              We&apos;ve sent a password reset link to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
            
            <Text style={styles.instructionText}>
              Click the link in the email to reset your password. If you don&apos;t see the email, check your spam folder.
            </Text>

            <Button
              title="Resend Email"
              onPress={handleResendEmail}
              variant="outline"
              style={styles.resendButton}
            />

            <Button
              title="Back to Sign In"
              onPress={navigateToLogin}
              style={styles.backButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={handleInputChange}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleResetPassword}
            error={errors.email}
          />

          <Button
            title="Send Reset Link"
            onPress={handleResetPassword}
            loading={isLoading}
            style={styles.resetButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  resetButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  footerLink: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 32,
    color: Colors.light.background,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    color: Colors.light.text,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  resendButton: {
    marginBottom: 16,
  },
  backButton: {
    marginBottom: 16,
  },
})