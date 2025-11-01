

import { JWT_ACCESS_TOKEN_EXPIRATION, JWT_AUDIENCE, JWT_ISSUER, JWT_REFRESH_SECRET, JWT_REFRESH_TOKEN_EXPIRATION, JWT_SECRET } from "../config/auth.config";
import jwt, { JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken";


// Custom error classes for better error handling
export class JWTError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'JWTError';
  }
}

export class TokenExpiredError extends JWTError {
  constructor(message: string = 'Token has expired') {
    super(message, 'TOKEN_EXPIRED');
  }
}

export class InvalidTokenError extends JWTError {
  constructor(message: string = 'Invalid token') {
    super(message, 'INVALID_TOKEN');
  }
}

// Enhanced payload interface
export interface CustomJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
}

// Token response interface
export interface TokenResponse {
  token: string;
  expiresAt: Date;
  expiresIn: number;
}

// Token verification result
export interface TokenVerificationResult {
  payload: CustomJwtPayload;
  isValid: boolean;
  error?: string;
}

// Token pair for authentication
export interface TokenPair {
  accessToken: TokenResponse;
  refreshToken: TokenResponse;
}

// Utility function to parse expiration time
const parseExpirationTime = (expiration: string | number): number => {
  if (typeof expiration === 'number') {
    return expiration;
  }

  const units: Record<string, number> = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
  };

  const match = expiration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new JWTError('Invalid expiration format', 'INVALID_EXPIRATION');
  }

  const [, value, unit] = match;
  return parseInt(value) * units[unit];
};

// Enhanced access token generation
export const generateAccessToken = (payload: Partial<CustomJwtPayload>): TokenResponse => {
  try {
    if (!payload.userId) {
      throw new JWTError('User ID is required for access token', 'MISSING_USER_ID');
    }

    const expirationMs = parseExpirationTime(JWT_ACCESS_TOKEN_EXPIRATION);
    const expiresAt = new Date(Date.now() + expirationMs);

    const tokenPayload = {
      ...payload,
      type: 'access',
    };



    const signOptions: SignOptions = {
      algorithm: 'HS256',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: Math.floor(expirationMs / 1000), // Convert to seconds
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, signOptions);

    return {
      token,
      expiresAt,
      expiresIn: expirationMs,
    };
  } catch (error) {
    if (error instanceof JWTError) {
      throw error;
    }
    const err = error as Error;
    throw new JWTError(`Failed to generate access token: ${err.message}`, 'TOKEN_GENERATION_FAILED');
  }
};

// Enhanced refresh token generation
export const generateRefreshToken = (payload: Partial<CustomJwtPayload>): TokenResponse => {
  try {
    if (!payload.userId) {
      throw new JWTError('User ID is required for refresh token', 'MISSING_USER_ID');
    }

    const expirationMs = parseExpirationTime(JWT_REFRESH_TOKEN_EXPIRATION);
    const expiresAt = new Date(Date.now() + expirationMs);

    const tokenPayload = {
      userId: payload.userId,
      sessionId: payload.sessionId,
      type: 'refresh',

    };

    const signOptions: SignOptions = {
      algorithm: 'HS256',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: Math.floor(expirationMs / 1000), // Convert to seconds
    };

    // Use separate secret for refresh tokens if available
    const secret = JWT_REFRESH_SECRET || JWT_SECRET;
    const token = jwt.sign(tokenPayload, secret, signOptions);

    return {
      token,
      expiresAt,
      expiresIn: expirationMs,
    };
  } catch (error) {
    if (error instanceof JWTError) {
      throw error;
    }
    const err = error as Error;
    throw new JWTError(`Failed to generate refresh token: ${err.message}`, 'TOKEN_GENERATION_FAILED');
  }
};

// Generate token pair
export const generateTokenPair = (payload: Partial<CustomJwtPayload>): TokenPair => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
  };
};

// Enhanced token verification with proper error handling
export const verifyAccessToken = (token: string): TokenVerificationResult => {
  try {
    if (!token) {
      throw new InvalidTokenError('Token is required');
    }

    const verifyOptions: VerifyOptions = {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    };

    const decoded = jwt.verify(token, JWT_SECRET, verifyOptions) as CustomJwtPayload;

    // Additional validation
    if (decoded.type !== 'access') {
      throw new InvalidTokenError('Invalid token type');
    }

    return {
      payload: decoded,
      isValid: true,
    };
  } catch (error) {
    const err = error as Error;
    if (err.name === 'TokenExpiredError') {
      return {
        payload: {} as CustomJwtPayload,
        isValid: false,
        error: 'Token has expired',
      };
    }

    if (err.name === 'JsonWebTokenError') {
      return {
        payload: {} as CustomJwtPayload,
        isValid: false,
        error: 'Invalid token',
      };
    }

    return {
      payload: {} as CustomJwtPayload,
      isValid: false,
      error: err.message,
    };
  }
};

// Enhanced refresh token verification
export const verifyRefreshToken = (token: string): TokenVerificationResult => {
  try {
    if (!token) {
      throw new InvalidTokenError('Token is required');
    }

    const verifyOptions: VerifyOptions = {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    };

    // Use separate secret for refresh tokens if available
    const secret = JWT_REFRESH_SECRET || JWT_SECRET;
    const decoded = jwt.verify(token, secret, verifyOptions) as CustomJwtPayload;

    // Additional validation
    if (decoded.type !== 'refresh') {
      throw new InvalidTokenError('Invalid token type');
    }

    return {
      payload: decoded,
      isValid: true,
    };
  } catch (error) {
    const err = error as Error;
    if (err.name === 'TokenExpiredError') {
      return {
        payload: {} as CustomJwtPayload,
        isValid: false,
        error: 'Token has expired',
      };
    }

    if (err.name === 'JsonWebTokenError') {
      return {
        payload: {} as CustomJwtPayload,
        isValid: false,
        error: 'Invalid token',
      };
    }

    return {
      payload: {} as CustomJwtPayload,
      isValid: false,
      error: err.message,
    };
  }
};

// Refresh access token using refresh token
export const refreshAccessToken = (refreshToken: string): TokenResponse => {
  const verification = verifyRefreshToken(refreshToken);

  if (!verification.isValid) {
    throw new InvalidTokenError(verification.error || 'Invalid refresh token');
  }

  // Generate new access token with the same user data
  return generateAccessToken({
    userId: verification.payload.userId,
    email: verification.payload.email,
    roles: verification.payload.roles,
    permissions: verification.payload.permissions,
    sessionId: verification.payload.sessionId,
    deviceId: verification.payload.deviceId,
    ipAddress: verification.payload.ipAddress,
  });
};

// Decode token without verification (for debugging)
export const decodeToken = (token: string): CustomJwtPayload | null => {
  try {
    return jwt.decode(token) as CustomJwtPayload;
  } catch (error) {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};

// Get token expiration time
export const getTokenExpirationTime = (token: string): Date | null => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

// Validate token structure and claims
export const validateTokenStructure = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded) {
      return false;
    }

    // Check required fields
    const requiredFields = ['userId', 'iat', 'exp', 'type'];
    return requiredFields.every(field => decoded[field] !== undefined);
  } catch (error) {
    return false;
  }
};

// Token blacklist management (for logout functionality)
const tokenBlacklist = new Set<string>();

export const blacklistToken = (token: string): void => {
  tokenBlacklist.add(token);
};

export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

export const clearTokenBlacklist = (): void => {
  tokenBlacklist.clear();
};

// Enhanced verification with blacklist check
export const verifyTokenWithBlacklist = (token: string, tokenType: 'access' | 'refresh' = 'access'): TokenVerificationResult => {
  if (isTokenBlacklisted(token)) {
    return {
      payload: {} as CustomJwtPayload,
      isValid: false,
      error: 'Token has been blacklisted',
    };
  }

  return tokenType === 'access' ? verifyAccessToken(token) : verifyRefreshToken(token);
};


// import jwt, { JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken";
// import {
//   JWT_ACCESS_TOKEN_EXPIRATION,
//   JWT_REFRESH_TOKEN_EXPIRATION,
//   JWT_SECRET,
//   JWT_REFRESH_SECRET,
//   JWT_ISSUER,
//   JWT_AUDIENCE
// } from "../config";
// import { nullable } from "zod";

// // Custom error classes for better error handling
// export class JWTError extends Error {
//   constructor(message: string, public code: string) {
//     super(message);
//     this.name = 'JWTError';
//   }
// }

// export class TokenExpiredError extends JWTError {
//   constructor(message: string = 'Token has expired') {
//     super(message, 'TOKEN_EXPIRED');
//   }
// }

// export class InvalidTokenError extends JWTError {
//   constructor(message: string = 'Invalid token') {
//     super(message, 'INVALID_TOKEN');
//   }
// }

// // Enhanced payload interface
// export interface CustomJwtPayload extends JwtPayload {
//   userId: string;
//   email: string;
//   roles: string[];
//   permissions: string[];
//   sessionId?: string;
//   deviceId?: string;
//   ipAddress?: string;
// }

// // Token response interface
// export interface TokenResponse {
//   token: string;
//   expiresAt: Date;
//   expiresIn: number;
// }

// // Token verification result
// export interface TokenVerificationResult {
//   payload: CustomJwtPayload;
//   isValid: boolean;
//   error?: string;
// }

// // Token pair for authentication
// export interface TokenPair {
//   accessToken: TokenResponse;
//   refreshToken: TokenResponse;
// }

// // Utility function to parse expiration time
// const parseExpirationTime = (expiration: string | number): number => {
//   if (typeof expiration === 'number') {
//     return expiration;
//   }

//   const units: Record<string, number> = {
//     's': 1000,
//     'm': 60 * 1000,
//     'h': 60 * 60 * 1000,
//     'd': 24 * 60 * 60 * 1000,
//   };

//   const match = expiration.match(/^(\d+)([smhd])$/);
//   if (!match) {
//     throw new JWTError('Invalid expiration format', 'INVALID_EXPIRATION');
//   }

//   const [, value, unit] = match;
//   return parseInt(value) * units[unit];
// };

// // Enhanced access token generation
// export const generateAccessToken = (payload: Partial<CustomJwtPayload>): TokenResponse => {
//   try {
//     if (!payload.userId) {
//       throw new JWTError('User ID is required for access token', 'MISSING_USER_ID');
//     }

//     const expirationMs = parseExpirationTime(JWT_ACCESS_TOKEN_EXPIRATION);
//     const expiresAt = new Date(Date.now() + expirationMs);

//     // const tokenPayload = {
//     //   ...payload,
//     //   type: 'access',
//     //   iat: Math.floor(Date.now() / 1000),
//     //   exp: Math.floor(expiresAt.getTime() / 1000),
//     // };

//     const tokenPayload = {
//       ...payload,
//       type: 'access',
//     };

//     const signOptions: SignOptions = {
//       algorithm: 'HS256',
//       issuer: JWT_ISSUER,
//       audience: JWT_AUDIENCE,
//       expiresIn: Math.floor(expirationMs / 1000), // Convert to seconds
//     };

//     const token = jwt.sign(tokenPayload, JWT_SECRET, signOptions);

//     return {
//       token,
//       expiresAt,
//       expiresIn: expirationMs,
//     };
//   } catch (error) {
//     if (error instanceof JWTError) {
//       throw error;
//     }
//     const err = error as Error;
//     throw new JWTError(`Failed to generate access token: ${err.message}`, 'TOKEN_GENERATION_FAILED');
//   }
// };

// // Enhanced refresh token generation
// export const generateRefreshToken = (payload: Partial<CustomJwtPayload>): TokenResponse => {
//   try {
//     if (!payload.userId) {
//       throw new JWTError('User ID is required for refresh token', 'MISSING_USER_ID');
//     }

//     const expirationMs = parseExpirationTime(JWT_REFRESH_TOKEN_EXPIRATION);
//     const expiresAt = new Date(Date.now() + expirationMs);

//     const tokenPayload = {
//       userId: payload.userId,
//       sessionId: payload.sessionId,
//       type: 'refresh',
//       iat: Math.floor(Date.now() / 1000),
//       exp: Math.floor(expiresAt.getTime() / 1000),
//     };

//     const signOptions: SignOptions = {
//       algorithm: 'HS256',
//       issuer: JWT_ISSUER,
//       audience: JWT_AUDIENCE,
//       expiresIn: Math.floor(expirationMs / 1000), // Convert to seconds
//     };

//     // Use separate secret for refresh tokens if available
//     const secret = JWT_REFRESH_SECRET || JWT_SECRET;
//     const token = jwt.sign(tokenPayload, secret, signOptions);

//     return {
//       token,
//       expiresAt,
//       expiresIn: expirationMs,
//     };
//   } catch (error) {
//     if (error instanceof JWTError) {
//       throw error;
//     }
//     const err = error as Error;
//     throw new JWTError(`Failed to generate refresh token: ${err.message}`, 'TOKEN_GENERATION_FAILED');
//   }
// };

// // Generate token pair
// export const generateTokenPair = (payload: Partial<CustomJwtPayload>): TokenPair => {
//   const accessToken = generateAccessToken(payload);
//   const refreshToken = generateRefreshToken(payload);

//   return {
//     accessToken,
//     refreshToken,
//   };
// };

// // Enhanced token verification with proper error handling
// export const verifyAccessToken = (token: string): TokenVerificationResult => {
//   try {
//     if (!token) {
//       throw new InvalidTokenError('Token is required');
//     }

//     const verifyOptions: VerifyOptions = {
//       algorithms: ['HS256'],
//       issuer: JWT_ISSUER,
//       audience: JWT_AUDIENCE,
//     };

//     const decoded = jwt.verify(token, JWT_SECRET, verifyOptions) as CustomJwtPayload;

//     // Additional validation
//     if (decoded.type !== 'access') {
//       throw new InvalidTokenError('Invalid token type');
//     }

//     return {
//       payload: decoded,
//       isValid: true,
//     };
//   } catch (error) {
//     const err = error as Error;
//     if (err.name === 'TokenExpiredError') {
//       return {
//         payload: {} as CustomJwtPayload,
//         isValid: false,
//         error: 'Token has expired',
//       };
//     }

//     if (err.name === 'JsonWebTokenError') {
//       return {
//         payload: {} as CustomJwtPayload,
//         isValid: false,
//         error: 'Invalid token',
//       };
//     }

//     return {
//       payload: {} as CustomJwtPayload,
//       isValid: false,
//       error: err.message,
//     };
//   }
// };

// // Enhanced refresh token verification
// export const verifyRefreshToken = (token: string): TokenVerificationResult => {
//   try {
//     if (!token) {
//       throw new InvalidTokenError('Token is required');
//     }

//     const verifyOptions: VerifyOptions = {
//       algorithms: ['HS256'],
//       issuer: JWT_ISSUER,
//       audience: JWT_AUDIENCE,
//     };

//     // Use separate secret for refresh tokens if available
//     const secret = JWT_REFRESH_SECRET || JWT_SECRET;
//     const decoded = jwt.verify(token, secret, verifyOptions) as CustomJwtPayload;

//     // Additional validation
//     if (decoded.type !== 'refresh') {
//       throw new InvalidTokenError('Invalid token type');
//     }

//     return {
//       payload: decoded,
//       isValid: true,
//     };
//   } catch (error) {
//     const err = error as Error;
//     if (err.name === 'TokenExpiredError') {
//       return {
//         payload: {} as CustomJwtPayload,
//         isValid: false,
//         error: 'Token has expired',
//       };
//     }

//     if (err.name === 'JsonWebTokenError') {
//       return {
//         payload: {} as CustomJwtPayload,
//         isValid: false,
//         error: 'Invalid token',
//       };
//     }

//     return {
//       payload: {} as CustomJwtPayload,
//       isValid: false,
//       error: err.message,
//     };
//   }
// };

// // Refresh access token using refresh token
// export const refreshAccessToken = (refreshToken: string): TokenResponse => {
//   const verification = verifyRefreshToken(refreshToken);

//   if (!verification.isValid) {
//     throw new InvalidTokenError(verification.error || 'Invalid refresh token');
//   }

//   // Generate new access token with the same user data
//   return generateAccessToken({
//     userId: verification.payload.userId,
//     email: verification.payload.email,
//     roles: verification.payload.roles,
//     permissions: verification.payload.permissions,
//     sessionId: verification.payload.sessionId,
//     deviceId: verification.payload.deviceId,
//     ipAddress: verification.payload.ipAddress,
//   });
// };

// // Decode token without verification (for debugging)
// export const decodeToken = (token: string): CustomJwtPayload | null => {
//   try {
//     return jwt.decode(token) as CustomJwtPayload;
//   } catch (error) {
//     return null;
//   }
// };

// // Check if token is expired
// export const isTokenExpired = (token: string): boolean => {
//   try {
//     const decoded = decodeToken(token);
//     if (!decoded || !decoded.exp) {
//       return true;
//     }

//     return Date.now() >= decoded.exp * 1000;
//   } catch (error) {
//     return true;
//   }
// };

// // Get token expiration time
// export const getTokenExpirationTime = (token: string): Date | null => {
//   try {
//     const decoded = decodeToken(token);
//     if (!decoded || !decoded.exp) {
//       return null;
//     }

//     return new Date(decoded.exp * 1000);
//   } catch (error) {
//     return null;
//   }
// };

// // Validate token structure and claims
// export const validateTokenStructure = (token: string): boolean => {
//   try {
//     const decoded = decodeToken(token);
//     if (!decoded) {
//       return false;
//     }

//     // Check required fields
//     const requiredFields = ['userId', 'iat', 'exp', 'type'];
//     return requiredFields.every(field => decoded[field] !== undefined);
//   } catch (error) {
//     return false;
//   }
// };

// // Token blacklist management (for logout functionality)
// const tokenBlacklist = new Set<string>();

// export const blacklistToken = (token: string): void => {
//   tokenBlacklist.add(token);
// };

// export const isTokenBlacklisted = (token: string): boolean => {
//   return tokenBlacklist.has(token);
// };

// export const clearTokenBlacklist = (): void => {
//   tokenBlacklist.clear();
// };

// // Enhanced verification with blacklist check
// export const verifyTokenWithBlacklist = (token: string, tokenType: 'access' | 'refresh' = 'access'): TokenVerificationResult => {
//   if (isTokenBlacklisted(token)) {
//     return {
//       payload: {} as CustomJwtPayload,
//       isValid: false,
//       error: 'Token has been blacklisted',
//     };
//   }

//   return tokenType === 'access' ? verifyAccessToken(token) : verifyRefreshToken(token);
// };