
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

const OnboardingIllustration = () => (
  <svg viewBox='0 0 400 300' className='mb-6 h-64 w-full'>
    <defs>
      <linearGradient id='userGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stopColor='#8b5cf6' />
        <stop offset='100%' stopColor='#6366f1' />
      </linearGradient>
      <linearGradient id='filesGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stopColor='#3b82f6' />
        <stop offset='100%' stopColor='#1d4ed8' />
      </linearGradient>
      <linearGradient id='cloudGradient2' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stopColor='#60a5fa' />
        <stop offset='100%' stopColor='#3b82f6' />
      </linearGradient>
      <filter id='glow' x='-50%' y='-50%' width='200%' height='200%'>
        <feGaussianBlur stdDeviation='3' result='coloredBlur' />
        <feMerge>
          <feMergeNode in='coloredBlur' />
          <feMergeNode in='SourceGraphic' />
        </feMerge>
      </filter>
    </defs>

    {/* Background elements */}
    <circle cx='50' cy='50' r='15' fill='#60a5fa' opacity='0.2' />
    <circle cx='350' cy='80' r='20' fill='#fbbf24' opacity='0.3' />
    <circle cx='320' cy='250' r='12' fill='#8b5cf6' opacity='0.2' />
    <circle cx='80' cy='200' r='8' fill='#10b981' opacity='0.3' />

    {/* Central Cloud */}
    <g transform='translate(200, 150)'>
      <circle
        cx='-30'
        cy='0'
        r='20'
        fill='url(#cloudGradient2)'
        filter='url(#glow)'
      />
      <circle
        cx='0'
        cy='-10'
        r='25'
        fill='url(#cloudGradient2)'
        filter='url(#glow)'
      />
      <circle
        cx='30'
        cy='0'
        r='20'
        fill='url(#cloudGradient2)'
        filter='url(#glow)'
      />
      <circle
        cx='15'
        cy='15'
        r='15'
        fill='url(#cloudGradient2)'
        filter='url(#glow)'
      />
      <circle
        cx='-15'
        cy='15'
        r='15'
        fill='url(#cloudGradient2)'
        filter='url(#glow)'
      />
    </g>

    {/* User Avatar */}
    <g transform='translate(100, 100)'>
      <circle
        cx='0'
        cy='0'
        r='25'
        fill='url(#userGradient)'
        filter='url(#glow)'
      />
      <circle cx='0' cy='-8' r='8' fill='white' opacity='0.9' />
      <path
        d='M-12 8 Q-12 0 0 0 Q12 0 12 8 Q12 16 0 16 Q-12 16 -12 8'
        fill='white'
        opacity='0.9'
      />

      {/* Crown on user */}
      <path
        d='M-8 -20 L-5 -12 L-2 -16 L0 -12 L2 -16 L5 -12 L8 -20 L6 -8 L-6 -8 Z'
        fill='#fbbf24'
        opacity='0.8'
      />
    </g>

    {/* Files floating around */}
    <g opacity='0.8'>
      {/* File 1 */}
      <g transform='translate(120, 200)'>
        <rect
          x='0'
          y='0'
          width='20'
          height='24'
          rx='2'
          fill='url(#filesGradient)'
        />
        <path d='M14 0 L14 6 L20 6' fill='white' opacity='0.3' />
        <rect x='3' y='10' width='10' height='1' fill='white' opacity='0.6' />
        <rect x='3' y='13' width='8' height='1' fill='white' opacity='0.6' />
        <rect x='3' y='16' width='12' height='1' fill='white' opacity='0.6' />
        <animateTransform
          attributeName='transform'
          type='translate'
          values='120,200; 125,195; 120,200'
          dur='3s'
          repeatCount='indefinite'
        />
      </g>

      {/* File 2 */}
      <g transform='translate(280, 180)'>
        <rect x='0' y='0' width='20' height='24' rx='2' fill='#10b981' />
        <path d='M14 0 L14 6 L20 6' fill='white' opacity='0.3' />
        <rect x='3' y='10' width='10' height='1' fill='white' opacity='0.6' />
        <rect x='3' y='13' width='8' height='1' fill='white' opacity='0.6' />
        <animateTransform
          attributeName='transform'
          type='translate'
          values='280,180; 275,175; 280,180'
          dur='4s'
          repeatCount='indefinite'
        />
      </g>

      {/* File 3 */}
      <g transform='translate(300, 120)'>
        <rect x='0' y='0' width='20' height='24' rx='2' fill='#f59e0b' />
        <path d='M14 0 L14 6 L20 6' fill='white' opacity='0.3' />
        <rect x='3' y='10' width='10' height='1' fill='white' opacity='0.6' />
        <rect x='3' y='13' width='8' height='1' fill='white' opacity='0.6' />
        <animateTransform
          attributeName='transform'
          type='translate'
          values='300,120; 305,115; 300,120'
          dur='3.5s'
          repeatCount='indefinite'
        />
      </g>
    </g>

    {/* Upload arrows */}
    <g opacity='0.7'>
      <path
        d='M140 160 Q160 140 180 150'
        stroke='#60a5fa'
        strokeWidth='2'
        fill='none'
        strokeDasharray='4,4'
      >
        <animate
          attributeName='stroke-dashoffset'
          values='0;8'
          dur='1s'
          repeatCount='indefinite'
        />
      </path>
      <path
        d='M260 160 Q240 140 220 150'
        stroke='#10b981'
        strokeWidth='2'
        fill='none'
        strokeDasharray='4,4'
      >
        <animate
          attributeName='stroke-dashoffset'
          values='0;8'
          dur='1.2s'
          repeatCount='indefinite'
        />
      </path>
    </g>

    {/* Welcome text effect */}
    <g transform='translate(200, 50)' opacity='0.8'>
      <text
        x='0'
        y='0'
        textAnchor='middle'
        fill='#6366f1'
        fontSize='14'
        fontWeight='bold'
      >
        Welcome to Qub Drive
        <animate
          attributeName='opacity'
          values='0.8;1;0.8'
          dur='2s'
          repeatCount='indefinite'
        />
      </text>
    </g>
  </svg>
)

type RegistrationStep = 1 | 2 | 3

interface FormData {
  email: string
  otp: string
  firstName: string
  lastName: string
  password: string
  confirmPassword: string
}

interface ValidationErrors {
  email?: string
  otp?: string
  firstName?: string
  lastName?: string
  password?: string
  confirmPassword?: string
}

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    otp: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState({
    email: false,
    otp: false,
    firstName: false,
    lastName: false,
    password: false,
    confirmPassword: false,
  })

  const router = useRouter()

  // Timer for OTP resend countdown
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
      return 'Email is required'
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

  const validateName = (name: string, fieldName: string): string | undefined => {
    if (!name.trim()) {
      return `${fieldName} is required`
    }
    if (name.trim().length < 2) {
      return `${fieldName} must be at least 2 characters`
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
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

  const validateStep = (step: RegistrationStep): boolean => {
    const errors: ValidationErrors = {}

    if (step === 1) {
      errors.email = validateEmail(formData.email)
    } else if (step === 2) {
      errors.otp = validateOtp(formData.otp)
    } else if (step === 3) {
      errors.firstName = validateName(formData.firstName, 'First name')
      errors.lastName = validateName(formData.lastName, 'Last name')
      errors.password = validatePassword(formData.password)
      errors.confirmPassword = validateConfirmPassword(formData.confirmPassword, formData.password)
    }

    setValidationErrors(errors)
    return Object.values(errors).every(error => !error)
  }

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }))

    let error: string | undefined
    switch (field) {
      case 'email':
        error = validateEmail(formData.email)
        break
      case 'otp':
        error = validateOtp(formData.otp)
        break
      case 'firstName':
        error = validateName(formData.firstName, 'First name')
        break
      case 'lastName':
        error = validateName(formData.lastName, 'Last name')
        break
      case 'password':
        error = validatePassword(formData.password)
        // Also re-validate confirm password if it's been touched
        if (touched.confirmPassword) {
          const confirmError = validateConfirmPassword(formData.confirmPassword, formData.password)
          setValidationErrors(prev => ({ ...prev, confirmPassword: confirmError }))
        }
        break
      case 'confirmPassword':
        error = validateConfirmPassword(formData.confirmPassword, formData.password)
        break
    }

    setValidationErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleFormDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let processedValue = value

    // Special handling for different field types
    if (name === 'otp') {
      processedValue = value.replace(/\D/g, '').slice(0, 6)
    } else if (name === 'firstName' || name === 'lastName') {
      // Allow only letters, spaces, hyphens, and apostrophes
      processedValue = value.replace(/[^a-zA-Z\s'-]/g, '')
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }))

    // Real-time validation for touched fields
    if (touched[name as keyof FormData]) {
      let error: string | undefined
      switch (name) {
        case 'email':
          error = validateEmail(processedValue)
          break
        case 'otp':
          error = validateOtp(processedValue)
          break
        case 'firstName':
          error = validateName(processedValue, 'First name')
          break
        case 'lastName':
          error = validateName(processedValue, 'Last name')
          break
        case 'password':
          error = validatePassword(processedValue)
          // Also re-validate confirm password
          if (touched.confirmPassword) {
            const confirmError = validateConfirmPassword(formData.confirmPassword, processedValue)
            setValidationErrors(prev => ({ ...prev, confirmPassword: confirmError }))
          }
          break
        case 'confirmPassword':
          error = validateConfirmPassword(processedValue, formData.password)
          break
      }
      setValidationErrors(prev => ({ ...prev, [name]: error }))
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
      await authEndPoint.startRegistration({ email: formData.email.trim() })

      // console.log(" +++++++++++++++++++++++++++++++++ ");
      // console.log("Registration started, moving to step 2");
      // console.log(" +++++++++++++++++++++++++++++++++ ");

      setCurrentStep(2) // Move to OTP verification step
      setOtpTimer(60) // Start 60-second countdown
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
      await authEndPoint.verifyRegistrationEmail({
        email: formData.email.trim(),
        otp: formData.otp,
      })
      setCurrentStep(3) // Move to profile completion step
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

    // Mark all step 3 fields as touched
    setTouched(prev => ({
      ...prev,
      firstName: true,
      lastName: true,
      password: true,
      confirmPassword: true
    }))

    if (!validateStep(3)) {
      return
    }

    setIsLoading(true)

    try {
      await authEndPoint.completeRegistration({
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: true, // Assuming terms are accepted
      })
      await router.navigate({ to: '/dashboard' })
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

    setError('')
    setIsLoading(true)

    try {
      await authEndPoint.resendRegistrationOtp(formData.email.trim())
      setOtpTimer(60)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to resend OTP. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const LoadingSpinner = () => (
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
  )

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
        return 'Enter your email'
      case 2:
        return 'Verify your email'
      case 3:
        return 'Complete your profile'
      default:
        return 'Create your account'
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "We'll send a verification code to confirm your email address"
      case 2:
        return `We sent a 6-digit code to ${formData.email}`
      case 3:
        return 'Just a few more details to create your royal account'
      default:
        return 'Join the kingdom of secure file sharing'
    }
  }

  const renderStepOne = () => (
    <div className='space-y-6'>
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
          value={formData.email}
          onChange={handleFormDataChange}
          onBlur={() => handleBlur('email')}
          className={`block w-full rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none ${validationErrors.email && touched.email
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500'
            : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
            }`}
          placeholder='you@example.com'
        />
        {validationErrors.email && touched.email && (
          <p className='mt-1 text-sm text-red-600' role='alert'>
            {validationErrors.email}
          </p>
        )}
      </div>

      <button
        type='button'
        onClick={handleStepOne}
        disabled={isLoading || !formData.email.trim()}
        className='w-full transform rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none'
      >
        <div className='flex items-center justify-center'>
          {isLoading && <LoadingSpinner />}
          {isLoading ? 'Sending...' : 'Send Verification Code'}
        </div>
      </button>
    </div>
  )

  const renderStepTwo = () => (
    <div className='space-y-6'>
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
          value={formData.otp}
          onChange={handleFormDataChange}
          onBlur={() => handleBlur('otp')}
          className={`block w-full rounded-lg border px-4 py-4 text-center text-2xl tracking-widest text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none ${validationErrors.otp && touched.otp
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
          disabled={otpTimer > 0 || isLoading}
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
          type='button'
          onClick={handleStepTwo}
          disabled={isLoading || formData.otp.length !== 6}
          className='flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          <div className='flex items-center justify-center'>
            {isLoading && <LoadingSpinner />}
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </div>
        </button>
      </div>
    </div>
  )

  const renderStepThree = () => (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label
            htmlFor='firstName'
            className='mb-2 block text-sm font-semibold text-gray-700'
          >
            First name
          </label>
          <input
            id='firstName'
            name='firstName'
            type='text'
            required
            value={formData.firstName}
            onChange={handleFormDataChange}
            onBlur={() => handleBlur('firstName')}
            className={`block w-full rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none ${validationErrors.firstName && touched.firstName
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
              }`}
            placeholder='First name'
          />
          {validationErrors.firstName && touched.firstName && (
            <p className='mt-1 text-sm text-red-600' role='alert'>
              {validationErrors.firstName}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor='lastName'
            className='mb-2 block text-sm font-semibold text-gray-700'
          >
            Last name
          </label>
          <input
            id='lastName'
            name='lastName'
            type='text'
            required
            value={formData.lastName}
            onChange={handleFormDataChange}
            onBlur={() => handleBlur('lastName')}
            className={`block w-full rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none ${validationErrors.lastName && touched.lastName
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
              }`}
            placeholder='Last name'
          />
          {validationErrors.lastName && touched.lastName && (
            <p className='mt-1 text-sm text-red-600' role='alert'>
              {validationErrors.lastName}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor='password'
          className='mb-2 block text-sm font-semibold text-gray-700'
        >
          Password
        </label>
        <input
          id='password'
          name='password'
          type='password'
          required
          value={formData.password}
          onChange={handleFormDataChange}
          onBlur={() => handleBlur('password')}
          className={`block w-full rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none ${validationErrors.password && touched.password
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
            }`}
          placeholder='Enter your password'
        />
        {validationErrors.password && touched.password && (
          <p className='mt-1 text-sm text-red-600' role='alert'>
            {validationErrors.password}
          </p>
        )}
        <div className='mt-2 space-y-1'>
          <p className='text-xs text-gray-500'>Password requirements:</p>
          <div className='grid grid-cols-2 gap-1 text-xs'>
            <div className={`flex items-center space-x-1 ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'
              }`}>
              <span>{formData.password.length >= 8 ? '✓' : '○'}</span>
              <span>8+ characters</span>
            </div>
            <div className={`flex items-center space-x-1 ${/(?=.*[a-z])/.test(formData.password) ? 'text-green-600' : 'text-gray-400'
              }`}>
              <span>{/(?=.*[a-z])/.test(formData.password) ? '✓' : '○'}</span>
              <span>Lowercase letter</span>
            </div>
            <div className={`flex items-center space-x-1 ${/(?=.*[A-Z])/.test(formData.password) ? 'text-green-600' : 'text-gray-400'
              }`}>
              <span>{/(?=.*[A-Z])/.test(formData.password) ? '✓' : '○'}</span>
              <span>Uppercase letter</span>
            </div>
            <div className={`flex items-center space-x-1 ${/(?=.*\d)/.test(formData.password) ? 'text-green-600' : 'text-gray-400'
              }`}>
              <span>{/(?=.*\d)/.test(formData.password) ? '✓' : '○'}</span>
              <span>Number</span>
            </div>
            <div className={`flex items-center space-x-1 ${/(?=.*[\W_])/.test(formData.password) ? 'text-green-600' : 'text-gray-400'
              }`}>
              <span>{/(?=.*[\W_])/.test(formData.password) ? '✓' : '○'}</span>
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
          Confirm password
        </label>
        <input
          id='confirmPassword'
          name='confirmPassword'
          type='password'
          required
          value={formData.confirmPassword}
          onChange={handleFormDataChange}
          onBlur={() => handleBlur('confirmPassword')}
          className={`block w-full rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none ${validationErrors.confirmPassword && touched.confirmPassword
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
            }`}
          placeholder='Confirm your password'
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
          type='button'
          onClick={handleStepThree}
          disabled={isLoading || !formData.firstName.trim() || !formData.lastName.trim() || !formData.password || !formData.confirmPassword}
          className='flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          <div className='flex items-center justify-center'>
            {isLoading && <LoadingSpinner />}
            {isLoading ? 'Creating account...' : 'Create Account'}
          </div>
        </button>
      </div>
    </div>
  )

  return (
    <div className='flex min-h-screen'>
      {/* Left Column - Branding */}
      <div className='relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 lg:flex lg:w-1/2'>
        <div className='absolute inset-0 bg-black/20'></div>

        {/* Floating Elements */}
        <div className='absolute top-20 left-20 h-32 w-32 animate-pulse rounded-full bg-white/10 blur-xl'></div>
        <div className='absolute right-20 bottom-40 h-48 w-48 animate-pulse rounded-full bg-yellow-400/20 blur-2xl delay-1000'></div>
        <div className='absolute top-1/3 right-10 h-20 w-20 animate-bounce rounded-full bg-white/5 blur-lg'></div>
        <div className='absolute bottom-20 left-10 h-24 w-24 animate-pulse rounded-full bg-blue-400/10 blur-lg delay-500'></div>

        <div className='relative z-10 flex w-full flex-col items-center justify-center p-12 text-white'>
          <KingsCloudLogo />

          <h1 className='mb-6 text-center text-5xl font-bold'>Qub Drive</h1>

          <OnboardingIllustration />

          <h2 className='mb-4 text-center text-2xl font-semibold'>
            Join the Royal Kingdom
          </h2>

          <p className='mb-8 max-w-md text-center text-lg leading-7 text-purple-100'>
            Create your account and become a member of the most secure
            file-sharing kingdom in the cloud.
          </p>

          <div className='space-y-4 text-purple-100'>
            <div className='flex items-center space-x-3'>
              <svg
                className='h-6 w-6 text-yellow-400'
                fill='currentColor'
                viewBox='0 0 20 20'
                aria-hidden='true'
              >
                <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <span>Unlimited storage space</span>
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
                  d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 002.287.947c1.561.379 2.6-1.561 2.978 0s2.6 1.561 2.978 0a1.532 1.532 0 002.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'
                  clipRule='evenodd'
                />
              </svg>
              <span>Premium collaboration tools</span>
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
                  d='M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              <span>Bank-level security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Registration Form */}
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
            <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-100 to-purple-100'>
              <svg
                className='h-8 w-8 text-indigo-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
                />
              </svg>
            </div>

            <h2 className='mb-2 text-3xl font-bold text-gray-900'>
              {getStepTitle()}
            </h2>
            <p className='mb-6 text-gray-600'>{getStepDescription()}</p>
          </div>

          {renderProgressSteps()}

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
                  <h3 className='text-sm font-medium text-red-800'>{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className='mt-8'>
            {currentStep === 1 && renderStepOne()}
            {currentStep === 2 && renderStepTwo()}
            {currentStep === 3 && renderStepThree()}
          </div>

          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              Already have an account?{' '}
              <Link
                to='/sign-in'
                className='font-semibold text-indigo-600 transition-colors duration-200 hover:text-indigo-500'
              >
                Sign in to your kingdom
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}