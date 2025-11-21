/**
 * Environment Configuration
 * Centralized environment variable access for the mobile app
 */

type Environment = 'development' | 'staging' | 'production';

export const ENV = {
  /**
   * API Base URL - Backend API endpoint
   */
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000',

  /**
   * Supabase Project URL
   */
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',

  /**
   * Supabase Anonymous Public Key (safe to expose in mobile app)
   */
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

  /**
   * Current environment (development | staging | production)
   */
  environment: (process.env.EXPO_PUBLIC_ENVIRONMENT as Environment) || 'development',

  /**
   * Check if running in development environment
   */
  isDevelopment: process.env.EXPO_PUBLIC_ENVIRONMENT === 'development',

  /**
   * Check if running in staging environment
   */
  isStaging: process.env.EXPO_PUBLIC_ENVIRONMENT === 'staging',

  /**
   * Check if running in production environment
   */
  isProduction: process.env.EXPO_PUBLIC_ENVIRONMENT === 'production',
};

/**
 * Get environment display name for UI
 */
export const getEnvironmentDisplayName = (): string => {
  switch (ENV.environment) {
    case 'development':
      return 'DEV';
    case 'staging':
      return 'STAGING';
    case 'production':
      return 'PROD';
    default:
      return 'UNKNOWN';
  }
};

/**
 * Get environment badge color
 */
export const getEnvironmentBadgeColor = (): string => {
  switch (ENV.environment) {
    case 'development':
      return '#10B981'; // green
    case 'staging':
      return '#F59E0B'; // amber
    case 'production':
      return '#EF4444'; // red
    default:
      return '#6B7280'; // gray
  }
};
