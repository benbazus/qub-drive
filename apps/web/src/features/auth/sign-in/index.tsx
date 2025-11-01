


import React, { useState } from 'react'
import { Link, useRouter, useSearch } from '@tanstack/react-router'
import authEndPoint from '@/api/endpoints/auth.endpoint'


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

interface SignInSearchParams {
  redirect?: string
}

interface ValidationErrors {
  email?: string
  password?: string
}

export default function SignIn() {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState({ email: false, password: false })



  //const { login } = useAuth()
  const router = useRouter()
  const search = useSearch({ from: '/(auth)/sign-in' }) as SignInSearchParams

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

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required'
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    return undefined
  }

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {
      email: validateEmail(email),
      password: validatePassword(password)
    }

    setValidationErrors(errors)
    return !errors.email && !errors.password
  }

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }))

    if (field === 'email') {
      setValidationErrors(prev => ({ ...prev, email: validateEmail(email) }))
    } else {
      setValidationErrors(prev => ({ ...prev, password: validatePassword(password) }))
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)

    if (touched.email) {
      setValidationErrors(prev => ({ ...prev, email: validateEmail(newEmail) }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)

    if (touched.password) {
      setValidationErrors(prev => ({ ...prev, password: validatePassword(newPassword) }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Mark all fields as touched
    setTouched({ email: true, password: true })

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await authEndPoint.login({ email, password })

      // Redirect to intended page or dashboard
      const redirectTo = search?.redirect || '/dashboard'
      await router.navigate({ to: redirectTo })
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen'>
      {/* Left Column - Branding */}
      <div className='relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 lg:flex lg:w-1/2'>
        <div className='absolute inset-0 bg-black/20'></div>

        {/* Floating Elements */}
        <div className='absolute top-20 left-20 h-32 w-32 animate-pulse rounded-full bg-white/10 blur-xl'></div>
        <div className='absolute right-20 bottom-40 h-48 w-48 animate-pulse rounded-full bg-yellow-400/20 blur-2xl delay-1000'></div>
        <div className='absolute top-1/2 left-10 h-20 w-20 animate-bounce rounded-full bg-white/5 blur-lg'></div>

        <div className='relative z-10 flex w-full flex-col items-center justify-center p-12 text-white'>
          <KingsCloudLogo />

         <h1 className='mb-6 text-center text-5xl font-bold'>Qub Drive</h1>

          <p className='mb-8 max-w-md text-center text-xl leading-8 text-blue-100'>
            Your royal gateway to seamless file sharing and collaboration
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
                  d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
              <span>Secure cloud storage</span>
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
                  d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
              <span>Real-time collaboration</span>
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
                  d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
              <span>Enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className='flex flex-1 items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-8'>
          {/* Mobile Logo */}
          <div className='flex flex-col items-center lg:hidden'>
            <KingsCloudLogo />
            <h1 className='mb-2 text-3xl font-bold text-gray-900'>
              Qub Drive
            </h1>
          </div>

          <div>
            <h2 className='text-center text-3xl font-bold text-gray-900'>
              Welcome back
            </h2>
            <p className='mt-2 text-center text-sm text-gray-600'>
              Sign in to access your royal vault
            </p>
          </div>

          <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
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

            <div className='space-y-5'>
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
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur('email')}
                  className={`relative block w-full appearance-none rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:z-10 focus:outline-none ${validationErrors.email && touched.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                    }`}
                  placeholder='Enter your email'
                />
                {validationErrors.email && touched.email && (
                  <p className='mt-1 text-sm text-red-600' role='alert'>
                    {validationErrors.email}
                  </p>
                )}
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
                  autoComplete='current-password'
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  className={`relative block w-full appearance-none rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:z-10 focus:outline-none ${validationErrors.password && touched.password
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                    }`}
                  placeholder='Enter your password'
                />
                {validationErrors.password && touched.password && (
                  <p className='mt-1 text-sm text-red-600' role='alert'>
                    {validationErrors.password}
                  </p>
                )}
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <div className='text-sm'>
                <Link
                  to='/forgot-password'
                  className='font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500'
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type='submit'
                disabled={isLoading || !email.trim() || !password}
                className='group relative flex w-full transform justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none'
              >
                {isLoading ? (
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
                ) : (
                  <svg
                    className='mr-2 h-5 w-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    aria-hidden='true'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1'
                    />
                  </svg>
                )}
                {isLoading ? 'Signing in...' : 'Sign in to Qub Drive'}
              </button>
            </div>

            <div className='text-center'>
              <p className='text-sm text-gray-600'>
                Don't have an account?{' '}
                <Link
                  to='/sign-up'
                  className='font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-500'
                >
                  Create your royal account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

