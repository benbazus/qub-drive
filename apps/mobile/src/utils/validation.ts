// Validation utility functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

export const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong', message: string } => {
  if (password.length < 8) {
    return { strength: 'weak', message: 'Password must be at least 8 characters' }
  }
  
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[@$!%*?&]/.test(password)
  
  const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length
  
  if (criteriaCount < 3) {
    return { strength: 'weak', message: 'Include uppercase, lowercase, and numbers' }
  } else if (criteriaCount === 3) {
    return { strength: 'medium', message: 'Good password strength' }
  } else {
    return { strength: 'strong', message: 'Strong password' }
  }
}

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2
}

export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword
}

export interface ValidationErrors {
  email?: string | undefined
  password?: string | undefined
  name?: string | undefined
  confirmPassword?: string | undefined
}

export const validateLoginForm = (email: string, password: string): ValidationErrors => {
  const errors: ValidationErrors = {}

  if (!email.trim()) {
    errors.email = 'Email is required'
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!password) {
    errors.password = 'Password is required'
  }

  return errors
}

export const validateRegisterForm = (
  email: string,
  password: string,
  name: string,
  confirmPassword: string
): ValidationErrors => {
  const errors: ValidationErrors = {}

  if (!name.trim()) {
    errors.name = 'Name is required'
  } else if (!validateName(name)) {
    errors.name = 'Name must be at least 2 characters long'
  }

  if (!email.trim()) {
    errors.email = 'Email is required'
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!password) {
    errors.password = 'Password is required'
  } else if (!validatePassword(password)) {
    errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (!validatePasswordMatch(password, confirmPassword)) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}

export const validateResetPasswordForm = (email: string): ValidationErrors => {
  const errors: ValidationErrors = {}

  if (!email.trim()) {
    errors.email = 'Email is required'
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address'
  }

  return errors
}