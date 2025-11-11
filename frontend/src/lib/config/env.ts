/**
 * Environment configuration with validation
 */

interface EnvConfig {
  API_URL: string;
  APP_NAME: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

const requiredEnvVars = {
  VITE_API_URL: 'http://localhost:3000',
  VITE_APP_NAME: 'Intersul',
} as const;

function getEnvVar(key: keyof typeof requiredEnvVars, defaultValue?: string): string {
  const value = import.meta.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function validateEnv(): EnvConfig {
  const apiUrl = getEnvVar('VITE_API_URL', 'http://localhost:3000');
  const appName = getEnvVar('VITE_APP_NAME', 'Intersul');
  const nodeEnv = (import.meta.env.MODE as EnvConfig['NODE_ENV']) || 'development';

  // Validate API URL format
  try {
    new URL(apiUrl);
  } catch {
    throw new Error(`Invalid API URL format: ${apiUrl}`);
  }

  return {
    API_URL: apiUrl,
    APP_NAME: appName,
    NODE_ENV: nodeEnv,
  };
}

export const env = validateEnv();

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
