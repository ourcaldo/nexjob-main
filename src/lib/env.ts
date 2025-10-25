// Environment variables helper for production deployment
export const env = {
  // Site Configuration
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://nexjob.tech',
  
  // WordPress API
  WP_API_URL: process.env.NEXT_PUBLIC_WP_API_URL || 'https://cms.nexjob.tech/wp-json/wp/v2',
  WP_FILTERS_API_URL: process.env.NEXT_PUBLIC_WP_FILTERS_API_URL || 'https://cms.nexjob.tech/wp-json/nex/v1/filters-data',
  WP_AUTH_TOKEN: process.env.NEXT_PUBLIC_WP_AUTH_TOKEN || '',
  
  // Supabase
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // SEO (now handled by database settings)
  SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME || '',
  SITE_DESCRIPTION: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '',
  
  // Analytics
  GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;

// Validate required environment variables
export const validateEnv = () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ] as const;
  
  const missing: string[] = [];
  
  for (const key of required) {
    const envKey = key.replace('NEXT_PUBLIC_', '') as keyof typeof env;
    if (!env[envKey]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    console.error(errorMessage);
    
    // In development, provide helpful guidance
    if (env.IS_DEVELOPMENT) {
      console.error('Please check your .env.local file and ensure all required variables are set.');
      console.error('Required variables:', missing);
      console.error('Copy .env.example to .env.local and fill in the required values.');
    }
    
    // Don't throw error to prevent React initialization issues
    // Instead, log the error and continue with fallback values
    return false;
  }
  
  // Validate Supabase URL format
  if (env.SUPABASE_URL && !env.SUPABASE_URL.startsWith('https://')) {
    console.error('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL');
    return false;
  }
  
  // Validate Supabase keys are not empty
  if (env.SUPABASE_ANON_KEY && env.SUPABASE_ANON_KEY.length < 10) {
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
    return false;
  }
  
  return true;
};

// Get current domain dynamically - enhanced for production
export const getCurrentDomain = () => {
  // For server-side rendering, always use environment variable in production
  if (typeof window === 'undefined') {
    return env.SITE_URL;
  }
  
  // For client-side, use current origin in development, env var in production
  if (env.IS_PRODUCTION) {
    return env.SITE_URL;
  }
  
  return window.location.origin;
};