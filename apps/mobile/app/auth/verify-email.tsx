import React, { useState, useEffect } from 'react'
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
import { router, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useAuthContext } from '@/providers/AuthProvider'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/theme'
import { validateEmail } from '@/utils/validation'

export default function VerifyEmailScreen() {
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>()
  const { isLoading } = useAuthContext()
  
  const [email] = useState(paramEmail || '')
  const [verificationCode, setVerificationCode] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Cooldown timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendCooldown])

  const handleVerifyEmail = async () => {
    try {
      if (!verificationCode.trim()) {
        Alert.alert('Verification Required', 'Please enter the verification code sent to your email.')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return
      }

      if (verificationCode.length !== 6) {
        Alert.alert('Invalid Code', 'Verification code must be 6 digits.')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return
      }

      // TODO: Implement actual email verification API call
      // await verifyEmail(email, verificationCode)
      
      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      
      Alert.alert(
        'Email Verified',
        'Your email has been successfully verified. You can now access all features.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      )
    } catch (error: unknown) {
      console.error('Email verification error:', error)
      
      // Error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      
      Alert.alert(
        'Verification Failed',
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid verification code. Please try again.',
        [{ text: 'OK' }]
      )
    }
  }

  const handleResendCode = async () => {
    try {
      if (!validateEmail(email)) {
        Alert.alert('Invalid Email', 'Please provide a valid email address.')
        return
      }

      setIsResending(true)
      
      // TODO: Implement actual resend verification code API call
      // await resendVerificationCode(email)
      
      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      
      Alert.alert(
        'Code Sent',
        'A new verification code has been sent to your email.',
        [{ text: 'OK' }]
      )
      
      // Start cooldown
      setResendCooldown(60)
    } catch (error: unknown) {
      console.error('Resend verification error:', error)
      
      // Error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      
      Alert.alert(
        'Resend Failed',
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to resend verification code. Please try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsResending(false)
    }
  }

  const navigateToLogin = () => {
    router.push('/auth/login')
  }

  const formatVerificationCode = (code: string) => {
    // Remove non-numeric characters and limit to 6 digits
    const numericCode = code.replace(/[^0-9]/g, '').slice(0, 6)
    return numericCode
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
          <View style={styles.emailIcon}>
            <Text style={styles.emailIconText}>✉️</Text>
          </View>
          
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We&apos;ve sent a 6-digit verification code to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Verification Code"
            value={verificationCode}
            onChangeText={(value) => setVerificationCode(formatVerificationCode(value))}
            placeholder="Enter 6-digit code"
            keyboardType="numeric"
            maxLength={6}
            returnKeyType="done"
            onSubmitEditing={handleVerifyEmail}
            style={styles.codeInput}
            accessibilityLabel="Verification code input"
            accessibilityHint="Enter the 6-digit code sent to your email"
          />

          <Button
            title="Verify Email"
            onPress={handleVerifyEmail}
            loading={isLoading}
            style={styles.verifyButton}
            accessibilityLabel="Verify email button"
          />

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn&apos;t receive the code? </Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={isResending || resendCooldown > 0}
              style={styles.resendButton}
              accessibilityLabel="Resend verification code"
              accessibilityRole="button"
            >
              <Text style={[
                styles.resendLink,
                (isResending || resendCooldown > 0) && styles.resendDisabled
              ]}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Wrong email address? </Text>
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
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emailIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.light.tint}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emailIconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    color: Colors.light.text,
  },
  form: {
    marginBottom: 32,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 4,
    fontWeight: '600',
  },
  verifyButton: {
    marginTop: 8,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  resendButton: {
    padding: 4,
  },
  resendLink: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  resendDisabled: {
    color: Colors.light.tabIconDefault,
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
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
})