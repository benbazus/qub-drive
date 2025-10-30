use serde::{Deserialize, Serialize};
use std::fmt;
use thiserror::Error;
use validator::ValidateEmail;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Email(String);

#[derive(Debug, Error)]
pub enum EmailError {
    #[error("Invalid email format: {0}")]
    InvalidFormat(String),
}

impl Email {
    pub fn new(email: String) -> Result<Self, EmailError> {
        if email.validate_email() {
            Ok(Email(email.to_lowercase()))
        } else {
            Err(EmailError::InvalidFormat(email))
        }
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for Email {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<Email> for String {
    fn from(email: Email) -> Self {
        email.0
    }
}

impl TryFrom<String> for Email {
    type Error = EmailError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        Email::new(value)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Password(String);

#[derive(Debug, Error)]
pub enum PasswordError {
    #[error("Password too short: minimum length is {min}, got {actual}")]
    TooShort { min: usize, actual: usize },
    
    #[error("Password too long: maximum length is {max}, got {actual}")]
    TooLong { max: usize, actual: usize },
    
    #[error("Password must contain at least one uppercase letter")]
    NoUppercase,
    
    #[error("Password must contain at least one lowercase letter")]
    NoLowercase,
    
    #[error("Password must contain at least one digit")]
    NoDigit,
    
    #[error("Password must contain at least one special character")]
    NoSpecialChar,
}

impl Password {
    const MIN_LENGTH: usize = 8;
    const MAX_LENGTH: usize = 128;

    pub fn new(password: String) -> Result<Self, PasswordError> {
        Self::validate(&password)?;
        Ok(Password(password))
    }

    pub fn new_weak(password: String) -> Result<Self, PasswordError> {
        if password.len() < Self::MIN_LENGTH {
            return Err(PasswordError::TooShort {
                min: Self::MIN_LENGTH,
                actual: password.len(),
            });
        }

        if password.len() > Self::MAX_LENGTH {
            return Err(PasswordError::TooLong {
                max: Self::MAX_LENGTH,
                actual: password.len(),
            });
        }

        Ok(Password(password))
    }

    fn validate(password: &str) -> Result<(), PasswordError> {
        if password.len() < Self::MIN_LENGTH {
            return Err(PasswordError::TooShort {
                min: Self::MIN_LENGTH,
                actual: password.len(),
            });
        }

        if password.len() > Self::MAX_LENGTH {
            return Err(PasswordError::TooLong {
                max: Self::MAX_LENGTH,
                actual: password.len(),
            });
        }

        if !password.chars().any(|c| c.is_uppercase()) {
            return Err(PasswordError::NoUppercase);
        }

        if !password.chars().any(|c| c.is_lowercase()) {
            return Err(PasswordError::NoLowercase);
        }

        if !password.chars().any(|c| c.is_ascii_digit()) {
            return Err(PasswordError::NoDigit);
        }

        if !password.chars().any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c)) {
            return Err(PasswordError::NoSpecialChar);
        }

        Ok(())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub fn strength(&self) -> PasswordStrength {
        let mut score = 0;

        // Length scoring
        if self.0.len() >= 12 {
            score += 2;
        } else if self.0.len() >= 8 {
            score += 1;
        }

        // Character variety scoring
        if self.0.chars().any(|c| c.is_uppercase()) {
            score += 1;
        }
        if self.0.chars().any(|c| c.is_lowercase()) {
            score += 1;
        }
        if self.0.chars().any(|c| c.is_ascii_digit()) {
            score += 1;
        }
        if self.0.chars().any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c)) {
            score += 1;
        }

        match score {
            0..=2 => PasswordStrength::Weak,
            3..=4 => PasswordStrength::Medium,
            5..=6 => PasswordStrength::Strong,
            _ => PasswordStrength::VeryStrong,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PasswordStrength {
    Weak,
    Medium,
    Strong,
    VeryStrong,
}

impl fmt::Display for Password {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[REDACTED]")
    }
}

impl From<Password> for String {
    fn from(password: Password) -> Self {
        password.0
    }
}