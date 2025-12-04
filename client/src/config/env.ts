/**
 * Environment Configuration
 * Validates and exports typed environment variables for the client
 */

interface ClientConfig {
  stripePublishableKey: string;
  apiBaseUrl: string;
  mode: 'development' | 'production';
  isDevelopment: boolean;
  isProduction: boolean;
}

function validateConfig(): ClientConfig {
  const env = (import.meta as any).env;
  
  // Validate required variables
  const stripeKey = env?.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!stripeKey) {
    throw new Error('Missing required environment variable: VITE_STRIPE_PUBLISHABLE_KEY');
  }
  
  const mode = env?.MODE || 'development';
  
  return {
    stripePublishableKey: stripeKey,
    apiBaseUrl: mode === 'production' ? '' : 'http://localhost:5000',
    mode: mode as 'development' | 'production',
    isDevelopment: mode === 'development',
    isProduction: mode === 'production'
  };
}

// Export singleton config - fails fast on startup if misconfigured
export const config = validateConfig();

// Helper to check if running in development
export const isDev = config.isDevelopment;
