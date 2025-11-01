
import React, { useState, useEffect } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { authEndPoint } from '@/api/endpoints/auth.endpoint'



const KingsCloudLogo = () => (
  <svg viewBox='0 0 200 200' className='mb-8 h-24 w-24'>
    <defs>
      <linearGradient id='crownGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stopColor='#fbbf24' />
        <stop offset='100%' stopColor='#f59e0b' />
      </linearGradient>
      <linearGradient id='cloudGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stopColor='#60a5fa' />
        <stop offset='100%' stopColor='#3b82f6' />
      </linearGradient>
      <filter id='shadow' x='-50%' y='-50%' width='200%' height='200%'>
        <feDropShadow
          dx='2'
          dy='4'
          stdDeviation='3'
          floodColor='#000000'
          floodOpacity='0.2'
        />
      </filter>
    </defs>

    {/* Cloud Base */}
    <circle
      cx='70'
      cy='130'
      r='25'
      fill='url(#cloudGradient)'
      filter='url(#shadow)'
    />
    <circle
      cx='100'
      cy='120'
      r='30'
      fill='url(#cloudGradient)'
      filter='url(#shadow)'
    />
    <circle
      cx='130'
      cy='130'
      r='25'
      fill='url(#cloudGradient)'
      filter='url(#shadow)'
    />
    <circle
      cx='115'
      cy='145'
      r='20'
      fill='url(#cloudGradient)'
      filter='url(#shadow)'
    />
    <circle
      cx='85'
      cy='145'
      r='20'
      fill='url(#cloudGradient)'
      filter='url(#shadow)'
    />

    {/* Crown */}
    <path
      d='M 70 60 L 80 80 L 90 65 L 100 80 L 110 65 L 120 80 L 130 60 L 125 95 L 75 95 Z'
      fill='url(#crownGradient)'
      filter='url(#shadow)'
    />

    {/* Crown Jewels */}
    <circle cx='85' cy='75' r='3' fill='#ef4444' />
    <circle cx='100' cy='70' r='4' fill='#10b981' />
    <circle cx='115' cy='75' r='3' fill='#8b5cf6' />

    {/* Crown Base */}
    <rect
      x='75'
      y='90'
      width='50'
      height='8'
      rx='4'
      fill='url(#crownGradient)'
      filter='url(#shadow)'
    />

    {/* Decorative Elements */}
    <circle cx='50' cy='100' r='4' fill='#fbbf24' opacity='0.6' />
    <circle cx='150' cy='110' r='3' fill='#60a5fa' opacity='0.6' />
    <circle cx='160' cy='90' r='2' fill='#fbbf24' opacity='0.4' />
    <circle cx='40' cy='120' r='2' fill='#60a5fa' opacity='0.4' />
  </svg>
)

const SecurityIllustration = () => (
  <svg viewBox='0 0 400 300' className='mb-6 h-64 w-full'>
    <defs>
      <linearGradient id='shieldGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stopColor='#3b82f6' />
        <stop offset='50%' stopColor='#6366f1' />
        <stop offset='100%' stopColor='#8b5cf6' />
      </linearGradient>
      <linearGradient id='keyGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stopColor='#fbbf24' />
        <stop offset='100%' stopColor='#f59e0b' />
      </linearGradient>
      <filter id='glow' x='-50%' y='-50%' width='200%' height='200%'>
        <feGaussianBlur stdDeviation='3' result='coloredBlur' />
        <feMerge>
          <feMergeNode in='coloredBlur' />
          <feMergeNode in='SourceGraphic' />
        </feMerge>
      </filter>
    </defs>

    {/* Background circles */}
    <circle cx='350' cy='50' r='20' fill='#60a5fa' opacity='0.2' />
    <circle cx='50' cy='80' r='15' fill='#fbbf24' opacity='0.3' />
    <circle cx='320' cy='250' r='12' fill='#8b5cf6' opacity='0.2' />

    {/* Shield */}
    <path
      d='M200 50 L180 60 L180 140 Q180 160 200 170 Q220 160 220 140 L220 60 Z'
      fill='url(#shieldGradient)'
      filter='url(#glow)'
    />

    {/* Shield highlight */}
    <path
      d='M200 55 L185 63 L185 90 Q185 95 190 97'
      fill='white'
      opacity='0.3'
    />

    {/* Lock in shield */}
    <rect
      x='195'
      y='95'
      width='10'
      height='12'
      rx='2'
      fill='white'
      opacity='0.9'
    />
    <path
      d='M198 95 Q198 90 202 90 Q206 90 206 95'
      stroke='white'
      strokeWidth='1.5'
      fill='none'
      opacity='0.9'
    />

    {/* Key */}
    <g transform='translate(120, 180)'>
      <circle
        cx='0'
        cy='0'
        r='12'
        fill='url(#keyGradient)'
        filter='url(#glow)'
      />
      <rect
        x='8'
        y='-2'
        width='40'
        height='4'
        rx='2'
        fill='url(#keyGradient)'
      />
      <rect x='40' y='-6' width='4' height='4' fill='url(#keyGradient)' />
      <rect x='40' y='2' width='4' height='4' fill='url(#keyGradient)' />

      {/* Key shine */}
      <circle cx='-3' cy='-3' r='4' fill='white' opacity='0.4' />
    </g>

    {/* Floating security elements */}
    <g opacity='0.6'>
      <circle cx='100' cy='120' r='3' fill='#60a5fa'>
        <animate
          attributeName='r'
          values='3;5;3'
          dur='2s'
          repeatCount='indefinite'
        />
      </circle>
      <circle cx='300' cy='160' r='4' fill='#fbbf24'>
        <animate
          attributeName='r'
          values='4;6;4'
          dur='2.5s'
          repeatCount='indefinite'
        />
      </circle>
      <circle cx='80' cy='200' r='2' fill='#8b5cf6'>
        <animate
          attributeName='r'
          values='2;4;2'
          dur='3s'
          repeatCount='indefinite'
        />
      </circle>
    </g>

    {/* Connection lines */}
    <path
      d='M160 180 Q180 160 200 150'
      stroke='#60a5fa'
      strokeWidth='2'
      opacity='0.4'
      fill='none'
      strokeDasharray='5,5'
    >
      <animate
        attributeName='stroke-dashoffset'
        values='0;10'
        dur='1s'
        repeatCount='indefinite'
      />
    </path>
  </svg>
)

type ForgotPasswordStep = 1 | 2 | 3

interface ValidationErrors {
  email?: string
  otp?: string
  newPassword?: string
  confirmPassword?: string
}

export default function ForgotPassword() {
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [successMessage, setSuccessMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState({
    email: false,
    otp: false,
    newPassword: false,
    confirmPassword: false,
  })

  const router = useRouter()

  // Timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [otpTimer])

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required!'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return undefined
  }

  const validateOtp = (otp: string): string | undefined => {
    if (!otp) {
      return 'Verification code is required'
    }
    if (otp.length !== 6) {
      return 'Verification code must be 6 digits'
    }
    if (!/^\d{6}$/.test(otp)) {
      return 'Verification code must contain only numbers'
    }
    return undefined
  }

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required'
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number'
    }
    if (!/(?=.*[\W_])/.test(password)) {
      return 'Password must contain at least one special character'
    }
    return undefined
  }

  const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
    if (!confirmPassword) {
      return 'Please confirm your password'
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match'
    }
    return undefined
  }

  const validateStep = (step: ForgotPasswordStep): boolean => {
    const errors: ValidationErrors = {}

    if (step === 1) {
      errors.email = validateEmail(email)
    } else if (step === 2) {
      errors.otp = validateOtp(otp)
    } else if (step === 3) {
      errors.newPassword = validatePassword(newPassword)
      errors.confirmPassword = validateConfirmPassword(confirmPassword, newPassword)
    }

    setValidationErrors(errors)
    return Object.values(errors).every(error => !error)
  }

  const handleBlur = (field: 'email' | 'otp' | 'newPassword' | 'confirmPassword') => {
    setTouched(prev => ({ ...prev, [field]: true }))

    let error: string | undefined
    switch (field) {
      case 'email':
        error = validateEmail(email)
        break
      case 'otp':
        error = validateOtp(otp)
        break
      case 'newPassword':
        error = validatePassword(newPassword)
        // Also re-validate confirm password if it's been touched
        if (touched.confirmPassword) {
          const confirmError = validateConfirmPassword(confirmPassword, newPassword)
          setValidationErrors(prev => ({ ...prev, confirmPassword: confirmError }))
        }
        break
      case 'confirmPassword':
        error = validateConfirmPassword(confirmPassword, newPassword)
        break
    }

    setValidationErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleInputChange = (field: 'email' | 'otp' | 'newPassword' | 'confirmPassword', value: string) => {
    let processedValue = value

    // Special handling for OTP
    if (field === 'otp') {
      processedValue = value.replace(/\D/g, '').slice(0, 6)
    }

    // Update state
    switch (field) {
      case 'email':
        setEmail(processedValue)
        break
      case 'otp':
        setOtp(processedValue)
        break
      case 'newPassword':
        setNewPassword(processedValue)
        break
      case 'confirmPassword':
        setConfirmPassword(processedValue)
        break
    }

    // Real-time validation for touched fields
    if (touched[field]) {
      let error: string | undefined
      switch (field) {
        case 'email':
          error = validateEmail(processedValue)
          break
        case 'otp':
          error = validateOtp(processedValue)
          break
        case 'newPassword':
          error = validatePassword(processedValue)
          // Also re-validate confirm password
          if (touched.confirmPassword) {
            const confirmError = validateConfirmPassword(confirmPassword, processedValue)
            setValidationErrors(prev => ({ ...prev, confirmPassword: confirmError }))
          }
          break
        case 'confirmPassword':
          error = validateConfirmPassword(processedValue, newPassword)
          break
      }
      setValidationErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  const handleStepOne = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Mark email as touched and validate
    setTouched(prev => ({ ...prev, email: true }))

    if (!validateStep(1)) {
      return
    }

    setIsLoading(true)

    try {
      await authEndPoint.requestPasswordReset({ email: email.trim() })
      setCurrentStep(2) // Move to OTP verification step
      setOtpTimer(60) // 60 seconds countdown
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStepTwo = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Mark OTP as touched and validate
    setTouched(prev => ({ ...prev, otp: true }))

    if (!validateStep(2)) {
      return
    }

    setIsLoading(true)

    try {
      await authEndPoint.verifyResetOtp(email.trim(), otp)
      setCurrentStep(3) // Move to password reset step
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStepThree = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Mark password fields as touched and validate
    setTouched(prev => ({
      ...prev,
      newPassword: true,
      confirmPassword: true
    }))

    if (!validateStep(3)) {
      return
    }

    setIsLoading(true)

    try {
      await authEndPoint.resetPasswordWithOtp({
        email: email.trim(),
        otp,
        newPassword,
        confirmPassword,
      })

      setSuccessMessage(
        'Password reset successfully! You can now login with your new password.'
      )
      setTimeout(() => {
        router.navigate({ to: '/sign-in' })
      }, 3000)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (otpTimer > 0) return

    try {
      setError('')
      await authEndPoint.resendResetOtp(email.trim())
      setOtpTimer(60)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to resend password reset code. Please try again.')
      }
    }
  }

  const renderProgressSteps = () => (
    <div className='mb-8 flex items-center justify-center'>
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${currentStep >= step
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-600'
              }`}
          >
            {currentStep > step ? (
              <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20' aria-hidden='true'>
                <path
                  fillRule='evenodd'
                  d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            ) : (
              step
            )}
          </div>
          {step < 3 && (
            <div
              className={`mx-3 h-1 w-16 rounded-full transition-all duration-300 ${currentStep > step
                ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                : 'bg-gray-200'
                }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Reset your password'
      case 2:
        return 'Enter verification code'
      case 3:
        return 'Set new password'
      default:
        return 'Reset your password'
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Enter your email address and we'll send you a verification code"
      case 2:
        return 'Check your email and enter the 6-digit code we sent you'
      case 3:
        return 'Choose a strong password for your account'
      default:
        return "Let's help you regain access to your royal vault"
    }
  }

  const renderStepOne = () => (
    <form onSubmit={handleStepOne} noValidate className='space-y-6'>
      <div>
        <label
          htmlFor='email'
          className='mb-2 block text-sm font-semibold text-gray-700'
        >
          Email address
        </label>
        <input
          id='email'
          name='email'
          type='email'
          autoComplete='email'
          required
          value={email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          className={`relative block w-full appearance-none rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:z-10 focus:outline-none ${validationErrors.email && touched.email
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500'
            : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
            }`}
          placeholder='Enter your email address'
        />
        {validationErrors.email && touched.email && (
          <p className='mt-1 text-sm text-red-600' role='alert'>
            {validationErrors.email}
          </p>
        )}
      </div>

      <button
        type='submit'
        disabled={isLoading || !email.trim()}
        className='w-full transform rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none'
      >
        {isLoading ? (
          <div className='flex items-center justify-center'>
            <svg
              className='mr-3 -ml-1 h-5 w-5 animate-spin text-white'
              fill='none'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
            Sending...
          </div>
        ) : (
          'Send Reset Code'
        )}
      </button>
    </form>
  )

  const renderStepTwo = () => (
    <form onSubmit={handleStepTwo} noValidate className='space-y-6'>
      <div className='mb-6 text-center'>
        <p className='text-sm text-gray-600'>
          We've sent a 6-digit code to{' '}
          <span className='font-semibold text-gray-900'>{email}</span>
        </p>
      </div>

      <div>
        <label
          htmlFor='otp'
          className='mb-2 block text-sm font-semibold text-gray-700'
        >
          Verification Code
        </label>
        <input
          id='otp'
          name='otp'
          type='text'
          inputMode='numeric'
          pattern='[0-9]*'
          maxLength={6}
          required
          value={otp}
          onChange={(e) => handleInputChange('otp', e.target.value)}
          onBlur={() => handleBlur('otp')}
          className={`relative block w-full appearance-none rounded-lg border px-4 py-4 text-center text-2xl tracking-widest text-gray-900 placeholder-gray-500 transition-all duration-200 focus:z-10 focus:outline-none ${validationErrors.otp && touched.otp
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
            }`}
          placeholder='000000'
        />
        {validationErrors.otp && touched.otp && (
          <p className='mt-1 text-sm text-red-600' role='alert'>
            {validationErrors.otp}
          </p>
        )}
      </div>

      <div className='text-center'>
        <button
          type='button'
          onClick={handleResendOtp}
          disabled={otpTimer > 0}
          className='text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500 disabled:cursor-not-allowed disabled:text-gray-400'
        >
          {otpTimer > 0
            ? `Resend code in ${otpTimer}s`
            : 'Resend verification code'}
        </button>
      </div>

      <div className='flex space-x-4'>
        <button
          type='button'
          onClick={() => setCurrentStep(1)}
          className='flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
        >
          Back
        </button>
        <button
          type='submit'
          disabled={isLoading || otp.length !== 6}
          className='flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </button>
      </div>
    </form>
  )

  const renderStepThree = () => (
    <form onSubmit={handleStepThree} noValidate className='space-y-6'>
      <div>
        <label
          htmlFor='newPassword'
          className='mb-2 block text-sm font-semibold text-gray-700'
        >
          New Password
        </label>
        <input
          id='newPassword'
          name='newPassword'
          type='password'
          required
          value={newPassword}
          onChange={(e) => handleInputChange('newPassword', e.target.value)}
          onBlur={() => handleBlur('newPassword')}
          className={`relative block w-full appearance-none rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:z-10 focus:outline-none ${validationErrors.newPassword && touched.newPassword
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
            }`}
          placeholder='Enter your new password'
        />
        {validationErrors.newPassword && touched.newPassword && (
          <p className='mt-1 text-sm text-red-600' role='alert'>
            {validationErrors.newPassword}
          </p>
        )}
        <div className='mt-2 space-y-1'>
          <p className='text-xs text-gray-500'>Password requirements:</p>
          <div className='grid grid-cols-2 gap-1 text-xs'>
            <div className={`flex items-center space-x-1 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'
              }`}>
              <span>{newPassword.length >= 8 ? '✓' : '○'}</span>
              <span>8+ characters</span>
            </div>
            <div className={`flex items-center space-x-1 ${/(?=.*[a-z])/.test(newPassword) ? 'text-green-600' : 'text-gray-400'
              }`}>
              <span>{/(?=.*[a-z])/.test(newPassword) ? '✓' : '○'}</span>
              <span>Lowercase letter</span>
            </div>
            <div className={`flex items-center space-x-1 ${/(?=.*[A-Z])/.test(newPassword) ? 'text-green-600' : 'text-gray-400'
              }`}>
              <span>{/(?=.*[A-Z])/.test(newPassword) ? '✓' : '○'}</span>
              <span>Uppercase letter</span>
            </div>
            <div className={`flex items-center space-x-1 ${/(?=.*\d)/.test(newPassword) ? 'text-green-600' : 'text-gray-400'
              }`}>
              <span>{/(?=.*\d)/.test(newPassword) ? '✓' : '○'}</span>
              <span>Number</span>
            </div>
            <div className={`flex items-center space-x-1 ${/(?=.*[\W_])/.test(newPassword) ? 'text-green-600' : 'text-gray-400'
              }`}>
              <span>{/(?=.*[\W_])/.test(newPassword) ? '✓' : '○'}</span>
              <span>Special character</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor='confirmPassword'
          className='mb-2 block text-sm font-semibold text-gray-700'
        >
          Confirm Password
        </label>
        <input
          id='confirmPassword'
          name='confirmPassword'
          type='password'
          required
          value={confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          className={`relative block w-full appearance-none rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:z-10 focus:outline-none ${validationErrors.confirmPassword && touched.confirmPassword
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
            }`}
          placeholder='Confirm your new password'
        />
        {validationErrors.confirmPassword && touched.confirmPassword && (
          <p className='mt-1 text-sm text-red-600' role='alert'>
            {validationErrors.confirmPassword}
          </p>
        )}
      </div>

      <div className='flex space-x-4'>
        <button
          type='button'
          onClick={() => setCurrentStep(2)}
          className='flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
        >
          Back
        </button>
        <button
          type='submit'
          disabled={isLoading || !newPassword || !confirmPassword}
          className='flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </form>
  )

  const renderSuccess = () => (
    <div className='space-y-6 text-center'>
      <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100'>
        <svg
          className='h-10 w-10 text-green-600'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M5 13l4 4L19 7'
          />
        </svg>
      </div>

      <div>
        <h2 className='mb-4 text-2xl font-bold text-gray-900'>
          Password Reset Complete
        </h2>
        <p className='mb-6 text-gray-600'>{successMessage}</p>
      </div>

      <Link
        to='/sign-in'
        className='inline-flex items-center rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none'
      >
        Continue to Login
      </Link>
    </div>
  )

  return (
    <div className='flex min-h-screen'>
      {/* Left Column - Branding */}
      <div className='relative hidden overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 lg:flex lg:w-1/2'>
        <div className='absolute inset-0 bg-black/20'></div>

        {/* Floating Elements */}
        <div className='absolute top-20 left-20 h-32 w-32 animate-pulse rounded-full bg-white/10 blur-xl'></div>
        <div className='absolute right-20 bottom-40 h-48 w-48 animate-pulse rounded-full bg-yellow-400/20 blur-2xl delay-1000'></div>
        <div className='absolute top-1/3 right-10 h-20 w-20 animate-bounce rounded-full bg-white/5 blur-lg'></div>

        <div className='relative z-10 flex w-full flex-col items-center justify-center p-12 text-white'>
          <KingsCloudLogo />

          <h1 className='mb-6 text-center text-5xl font-bold'>
            Qub Drive
          </h1>

          <SecurityIllustration />

          <h2 className='mb-4 text-center text-2xl font-semibold'>
            Secure Account Recovery
          </h2>

          <p className='mb-8 max-w-md text-center text-lg leading-7 text-blue-100'>
            Your security is our priority. We'll help you regain access to
            your royal vault safely and securely.
          </p>

          <div className='space-y-4 text-blue-100'>
            <div className='flex items-center space-x-3'>
              <svg
                className='h-6 w-6 text-yellow-400'
                fill='currentColor'
                viewBox='0 0 20 20'
                aria-hidden='true'
              >
                <path
                  fillRule='evenodd'
                  d='M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              <span>Multi-step verification</span>
            </div>
            <div className='flex items-center space-x-3'>
              <svg
                className='h-6 w-6 text-yellow-400'
                fill='currentColor'
                viewBox='0 0 20 20'
                aria-hidden='true'
              >
                <path
                  fillRule='evenodd'
                  d='M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z'
                  clipRule='evenodd'
                />
              </svg>
              <span>Encrypted password reset</span>
            </div>
            <div className='flex items-center space-x-3'>
              <svg
                className='h-6 w-6 text-yellow-400'
                fill='currentColor'
                viewBox='0 0 20 20'
                aria-hidden='true'
              >
                <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <span>Account protection guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Forgot Password Form */}
      <div className='flex flex-1 items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-8'>
          {/* Mobile Logo */}
          <div className='flex flex-col items-center lg:hidden'>
            <KingsCloudLogo />
            <h1 className='mb-2 text-3xl font-bold text-gray-900'>
              Qub Drive
            </h1>
          </div>

          <div className='text-center'>
            <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100'>
              <svg
                className='h-8 w-8 text-blue-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                />
              </svg>
            </div>

            {!successMessage && (
              <>
                <h2 className='mb-2 text-3xl font-bold text-gray-900'>
                  {getStepTitle()}
                </h2>
                <p className='mb-6 text-gray-600'>{getStepDescription()}</p>
              </>
            )}
          </div>

          {!successMessage && renderProgressSteps()}

          {error && (
            <div className='rounded-lg border border-red-200 bg-red-50 p-4' role='alert'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <svg
                    className='h-5 w-5 text-red-400'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800'>
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className='mt-8'>
            {successMessage ? (
              renderSuccess()
            ) : (
              <div className='space-y-6'>
                {currentStep === 1 && renderStepOne()}
                {currentStep === 2 && renderStepTwo()}
                {currentStep === 3 && renderStepThree()}

                {/* Common Nav Link */}
                <div className='text-center'>
                  <p className='text-sm text-gray-600'>
                    {currentStep === 1 ? "Remember your password? " : "Changed your mind? "}
                    <Link
                      to='/sign-in'
                      className='font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-500'
                    >
                      Back to sign in
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}