import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useAuthContext } from '@/providers/AuthProvider'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/theme'
import { validateRegisterForm, ValidationErrors } from '@/utils/validation'

export default function RegisterScreen() {
  const { register, isLoading } = useAuthContext()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [showPassword] = useState(false)
  const [showConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  
  const emailRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const confirmPasswordRef = useRef<TextInput>(null)

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleRegister = async () => {
    try {
      // Validate form
      const validationErrors = validateRegisterForm(
        formData.email,
        formData.password,
        formData.name,
        formData.confirmPassword
      )
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return
      }

      if (!acceptedTerms) {
        Alert.alert(
          'Terms Required',
          'Please accept the Terms of Service and Privacy Policy to continue.',
          [{ text: 'OK' }]
        )
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return
      }

      await register(formData.email, formData.password, formData.name, formData.confirmPassword)
      
      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      
      // Navigate to email verification
      router.push({
        pathname: '/auth/verify-email',
        params: { email: formData.email }
      })
    } catch (error: unknown) {
      console.error('Registration error:', error)
      
      // Error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      
      Alert.alert(
        'Registration Failed',
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'An error occurred during registration. Please try again.',
        [{ text: 'OK' }]
      )
    }
  }

  const navigateToLogin = () => {
    router.push('/auth/login')
  }

  const toggleTermsAcceptance = () => {
    setAcceptedTerms(!acceptedTerms)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Qub Drive and start sharing files securely</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="Enter your full name"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            error={errors.name}
            accessibilityLabel="Full name input"
            accessibilityHint="Enter your full name for account registration"
          />

          <Input
            ref={emailRef}
            label="Email"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={errors.email}
            accessibilityLabel="Email address input"
            accessibilityHint="Enter your email address for account registration"
          />

          <Input
            ref={passwordRef}
            label="Password"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            placeholder="Create a strong password"
            secureTextEntry={!showPassword}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            error={errors.password}
            accessibilityLabel="Password input"
            accessibilityHint="Create a strong password with at least 8 characters, including uppercase, lowercase, and numbers"
          />

          <Input
            ref={confirmPasswordRef}
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            placeholder="Confirm your password"
            secureTextEntry={!showConfirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            error={errors.confirmPassword}
            accessibilityLabel="Confirm password input"
            accessibilityHint="Re-enter your password to confirm it matches"
          />

          <TouchableOpacity
            style={styles.termsContainer}
            onPress={toggleTermsAcceptance}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
            accessibilityLabel="Terms and conditions agreement"
            accessibilityHint="Tap to accept the Terms of Service and Privacy Policy"
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.registerButton}
            accessibilityLabel="Create account button"
            accessibilityHint="Tap to create your new account"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
const isTablet = screenWidth >= 768
const isSmallScreen = screenHeight < 700

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: isSmallScreen ? 'flex-start' : 'center',
    padding: isTablet ? 48 : 24,
    paddingTop: isSmallScreen ? 40 : 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 20 : 32,
    maxWidth: isTablet ? 400 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: isTablet ? 32 : isSmallScreen ? 24 : 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isTablet ? 18 : 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    lineHeight: isTablet ? 24 : 22,
  },
  form: {
    marginBottom: isSmallScreen ? 20 : 32,
    maxWidth: isTablet ? 400 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.light.tabIconDefault,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  checkmark: {
    color: Colors.light.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  registerButton: {
    marginBottom: 16,
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
})