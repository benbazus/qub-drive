import {
  validateEmail,
  validatePassword,
  validateName,
  validatePasswordMatch,
  validateLoginForm,
  validateRegisterForm,
  validateResetPasswordForm,
  getPasswordStrength,
} from '../utils/validation'

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('user+tag@example.org')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test.example.com')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('Password123')).toBe(true)
      expect(validatePassword('MySecure123')).toBe(true)
      expect(validatePassword('Complex@Pass1')).toBe(true)
    })

    it('should reject weak passwords', () => {
      expect(validatePassword('password')).toBe(false) // no uppercase or number
      expect(validatePassword('PASSWORD')).toBe(false) // no lowercase or number
      expect(validatePassword('123456')).toBe(false) // no letters
      expect(validatePassword('Pass1')).toBe(false) // too short
    })
  })

  describe('validateName', () => {
    it('should validate proper names', () => {
      expect(validateName('John Doe')).toBe(true)
      expect(validateName('Jane')).toBe(true)
      expect(validateName('Mary-Jane Smith')).toBe(true)
    })

    it('should reject invalid names', () => {
      expect(validateName('')).toBe(false)
      expect(validateName(' ')).toBe(false)
      expect(validateName('A')).toBe(false)
    })
  })

  describe('validatePasswordMatch', () => {
    it('should validate matching passwords', () => {
      expect(validatePasswordMatch('password123', 'password123')).toBe(true)
    })

    it('should reject non-matching passwords', () => {
      expect(validatePasswordMatch('password123', 'different123')).toBe(false)
    })
  })

  describe('validateLoginForm', () => {
    it('should validate correct login form', () => {
      const errors = validateLoginForm('test@example.com', 'password123')
      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('should return errors for invalid login form', () => {
      const errors = validateLoginForm('', '')
      expect(errors.email).toBe('Email is required')
      expect(errors.password).toBe('Password is required')
    })

    it('should return error for invalid email', () => {
      const errors = validateLoginForm('invalid-email', 'password123')
      expect(errors.email).toBe('Please enter a valid email address')
    })
  })

  describe('validateRegisterForm', () => {
    it('should validate correct registration form', () => {
      const errors = validateRegisterForm(
        'test@example.com',
        'Password123',
        'John Doe',
        'Password123'
      )
      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('should return errors for invalid registration form', () => {
      const errors = validateRegisterForm('', '', '', '')
      expect(errors.name).toBe('Name is required')
      expect(errors.email).toBe('Email is required')
      expect(errors.password).toBe('Password is required')
      expect(errors.confirmPassword).toBe('Please confirm your password')
    })

    it('should return error for password mismatch', () => {
      const errors = validateRegisterForm(
        'test@example.com',
        'Password123',
        'John Doe',
        'DifferentPassword'
      )
      expect(errors.confirmPassword).toBe('Passwords do not match')
    })
  })

  describe('validateResetPasswordForm', () => {
    it('should validate correct reset password form', () => {
      const errors = validateResetPasswordForm('test@example.com')
      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('should return error for empty email', () => {
      const errors = validateResetPasswordForm('')
      expect(errors.email).toBe('Email is required')
    })

    it('should return error for invalid email', () => {
      const errors = validateResetPasswordForm('invalid-email')
      expect(errors.email).toBe('Please enter a valid email address')
    })
  })

  describe('getPasswordStrength', () => {
    it('should return weak for short passwords', () => {
      const result = getPasswordStrength('pass')
      expect(result.strength).toBe('weak')
      expect(result.message).toBe('Password must be at least 8 characters')
    })

    it('should return weak for passwords missing criteria', () => {
      const result = getPasswordStrength('password')
      expect(result.strength).toBe('weak')
      expect(result.message).toBe('Include uppercase, lowercase, and numbers')
    })

    it('should return medium for passwords with 3 criteria', () => {
      const result = getPasswordStrength('Password1')
      expect(result.strength).toBe('medium')
      expect(result.message).toBe('Good password strength')
    })

    it('should return strong for passwords with all criteria', () => {
      const result = getPasswordStrength('Password1!')
      expect(result.strength).toBe('strong')
      expect(result.message).toBe('Strong password')
    })
  })
})