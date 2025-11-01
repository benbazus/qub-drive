import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { Alert } from 'react-native'
import LoginScreen from '../../app/auth/login'
import RegisterScreen from '../../app/auth/register'
import ForgotPasswordScreen from '../../app/auth/forgot-password'
import VerifyEmailScreen from '../../app/auth/verify-email'
import { AuthProvider } from '../providers/AuthProvider'
import { QueryProvider } from '../providers'

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: () => ({ email: 'test@example.com' }),
}))

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
    Error: 'error',
  },
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}))

// Mock Alert
jest.spyOn(Alert, 'alert')

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </QueryProvider>
)

describe('Authentication Screens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('LoginScreen', () => {
    it('renders login form correctly', () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      )

      expect(screen.getByText('Welcome Back')).toBeTruthy()
      expect(screen.getByText('Sign in to your Qub Drive account')).toBeTruthy()
      expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy()
      expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy()
      expect(screen.getByText('Sign In')).toBeTruthy()
    })

    it('validates email input', async () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const signInButton = screen.getByText('Sign In')

      fireEvent.changeText(emailInput, 'invalid-email')
      fireEvent.press(signInButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeTruthy()
      })
    })

    it('validates password input', async () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const signInButton = screen.getByText('Sign In')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.press(signInButton)

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeTruthy()
      })
    })

    it('shows forgot password link', () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      )

      expect(screen.getByText('Forgot Password?')).toBeTruthy()
    })

    it('shows sign up link', () => {
      render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      )

      expect(screen.getByText('Sign Up')).toBeTruthy()
    })
  })

  describe('RegisterScreen', () => {
    it('renders registration form correctly', () => {
      render(
        <TestWrapper>
          <RegisterScreen />
        </TestWrapper>
      )

      expect(screen.getByText('Create Account')).toBeTruthy()
      expect(screen.getByText('Join Qub Drive and start sharing files securely')).toBeTruthy()
      expect(screen.getByPlaceholderText('Enter your full name')).toBeTruthy()
      expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy()
      expect(screen.getByPlaceholderText('Create a strong password')).toBeTruthy()
      expect(screen.getByPlaceholderText('Confirm your password')).toBeTruthy()
    })

    it('validates name input', async () => {
      render(
        <TestWrapper>
          <RegisterScreen />
        </TestWrapper>
      )

      const nameInput = screen.getByPlaceholderText('Enter your full name')
      const createButton = screen.getByText('Create Account')

      fireEvent.changeText(nameInput, 'A')
      fireEvent.press(createButton)

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters long')).toBeTruthy()
      })
    })

    it('validates password confirmation', async () => {
      render(
        <TestWrapper>
          <RegisterScreen />
        </TestWrapper>
      )

      const nameInput = screen.getByPlaceholderText('Enter your full name')
      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInput = screen.getByPlaceholderText('Create a strong password')
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
      const createButton = screen.getByText('Create Account')

      fireEvent.changeText(nameInput, 'John Doe')
      fireEvent.changeText(emailInput, 'john@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmPasswordInput, 'DifferentPassword')
      fireEvent.press(createButton)

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeTruthy()
      })
    })

    it('requires terms acceptance', async () => {
      render(
        <TestWrapper>
          <RegisterScreen />
        </TestWrapper>
      )

      const nameInput = screen.getByPlaceholderText('Enter your full name')
      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInput = screen.getByPlaceholderText('Create a strong password')
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
      const createButton = screen.getByText('Create Account')

      fireEvent.changeText(nameInput, 'John Doe')
      fireEvent.changeText(emailInput, 'john@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmPasswordInput, 'Password123')
      fireEvent.press(createButton)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Terms Required',
          'Please accept the Terms of Service and Privacy Policy to continue.',
          [{ text: 'OK' }]
        )
      })
    })
  })

  describe('ForgotPasswordScreen', () => {
    it('renders forgot password form correctly', () => {
      render(
        <TestWrapper>
          <ForgotPasswordScreen />
        </TestWrapper>
      )

      expect(screen.getByText('Forgot Password?')).toBeTruthy()
      expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy()
      expect(screen.getByText('Send Reset Link')).toBeTruthy()
    })

    it('validates email input', async () => {
      render(
        <TestWrapper>
          <ForgotPasswordScreen />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const sendButton = screen.getByText('Send Reset Link')

      fireEvent.changeText(emailInput, 'invalid-email')
      fireEvent.press(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeTruthy()
      })
    })
  })

  describe('VerifyEmailScreen', () => {
    it('renders email verification form correctly', () => {
      render(
        <TestWrapper>
          <VerifyEmailScreen />
        </TestWrapper>
      )

      expect(screen.getByText('Verify Your Email')).toBeTruthy()
      expect(screen.getByPlaceholderText('Enter 6-digit code')).toBeTruthy()
      expect(screen.getByText('Verify Email')).toBeTruthy()
      expect(screen.getByText('Resend Code')).toBeTruthy()
    })

    it('formats verification code input', () => {
      render(
        <TestWrapper>
          <VerifyEmailScreen />
        </TestWrapper>
      )

      const codeInput = screen.getByPlaceholderText('Enter 6-digit code')

      fireEvent.changeText(codeInput, 'abc123def')
      
      // Should only contain numbers and be limited to 6 digits
      expect(codeInput.props.value).toBe('123')
    })

    it('validates verification code length', async () => {
      render(
        <TestWrapper>
          <VerifyEmailScreen />
        </TestWrapper>
      )

      const codeInput = screen.getByPlaceholderText('Enter 6-digit code')
      const verifyButton = screen.getByText('Verify Email')

      fireEvent.changeText(codeInput, '123')
      fireEvent.press(verifyButton)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Invalid Code',
          'Verification code must be 6 digits.'
        )
      })
    })
  })
})