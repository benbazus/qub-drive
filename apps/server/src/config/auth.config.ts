import { AuthServiceConfig, RateLimitConfig } from '../types/auth.types';

export const PORT = process.env.PORT || 3000;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "supersecretjwtkey";
export const JWT_ISSUER = process.env.JWT_ISSUER || "benhost.com"; // 15 minutes
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "benhost"; // 7 days
export const NODE_ENV = process.env.NODE_ENV || "development";


export const JWT_SECRET: string = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here';
export const JWT_ACCESS_TOKEN_EXPIRATION: string = process.env.JWT_ACCESS_TOKEN_EXPIRATION || "1h"; // Default to 1 hour
export const JWT_REFRESH_TOKEN_EXPIRATION: string = process.env.JWT_REFRESH_TOKEN_EXPIRATION || "7d"; // Default to 7 days

export const authConfig: AuthServiceConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secure-refresh-secret-key-here',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000'), // 15 minutes
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400000') // 24 hours
};

export const rateLimitConfig: RateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  maxAttempts: parseInt(process.env.RATE_LIMIT_MAX || '5'),
  skipSuccessfulRequests: false,
  skipFailedRequests: false
};

export const corsConfig = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5176', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

export const serverConfig = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || 'localhost',
  environment: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1'
};

export const validateEnvironment = (): void => {
  const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Using default values for development. Please set these in production!');
  }

  if (process.env.NODE_ENV === 'production') {
    if (authConfig.jwtSecret.includes('your-super-secure')) {
      throw new Error('❌ JWT_SECRET must be set to a secure value in production');
    }
    if (authConfig.jwtRefreshSecret.includes('your-super-secure')) {
      throw new Error('❌ JWT_REFRESH_SECRET must be set to a secure value in production');
    }
  }
};