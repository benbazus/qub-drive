// API configuration
const ENV = {
  dev: {
    apiUrl: 'http://localhost:5001/api',
    wsUrl: 'ws://localhost:5001',
  },
  staging: {
    apiUrl: 'https://staging-api.qubdrive.com',
    wsUrl: 'wss://staging-api.qubdrive.com',
  },
  prod: {
    apiUrl: 'https://api.qubdrive.com',
    wsUrl: 'wss://api.qubdrive.com',
  },
}

const getEnvVars = () => {
  if (process.env.NODE_ENV === 'development') {
    return ENV.dev
  }
  // Add logic to determine staging vs prod
  return ENV.prod
}

export const API_CONFIG = {
  ...getEnvVars(),
  BASE_URL: getEnvVars().apiUrl,
  WS_BASE_URL: getEnvVars().wsUrl,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}