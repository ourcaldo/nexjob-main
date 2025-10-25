import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import GoogleAnalytics from '@/components/Analytics/GoogleAnalytics';
import GoogleTagManager, { GoogleTagManagerNoScript } from '@/components/Analytics/GoogleTagManager';
import { ToastProvider } from '@/components/ui/ToastProvider';
import '../styles/globals.css';
import PopupAd from '@/components/Advertisement/PopupAd';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let authInitialized = false;
    
    // Initialize auth state with proper waiting
    const initializeAuth = async () => {
      try {
        if (!mounted || authInitialized) return;
        
        // Wait for Supabase to initialize (shorter wait)
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (!mounted) return;
        
        // Get current session to ensure auth state is restored
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('Session restored:', session?.user?.id || 'No session');
          authInitialized = true;
          
          // Dispatch a custom event to notify components
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('authInitialized', { 
              detail: { session } 
            }));
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initializeAuth();

    // Set up auth state change listener for the entire app
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Global auth state change:', event, session?.user?.id);
      
      // Clear auth cache on state changes
      const { clearAuthCache } = await import('@/lib/supabase');
      clearAuthCache();
      
      // Dispatch auth state change event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
          detail: { event, session } 
        }));
      }
      
      if (event === 'SIGNED_OUT') {
        // Clear any cached data and redirect to home
        router.push('/');
      } else if (event === 'SIGNED_IN' && session?.user) {
        // If on login page, redirect to home
        if (router.pathname === '/login' || router.pathname === '/login/') {
          router.push('/');
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Don't force a full page reload, just update state
        console.log('Token refreshed, updating auth state');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    // Validate environment variables after React has initialized
    const validateAndInitialize = async () => {
      try {
        // Import and validate environment only after component mount
        const { validateEnv } = await import('@/lib/env');
        validateEnv();

        // Initialize settings only for non-admin pages with better error handling
        const initializeSettings = async () => {
          try {
            // Skip initialization for admin pages to avoid unnecessary DB calls
            if (typeof window !== 'undefined' && (
              window.location.pathname.startsWith('/backend/admin') ||
              window.location.pathname.startsWith('/admin')
            )) {
              return;
            }

            const { supabaseAdminService } = await import('@/services/supabaseAdminService');

            // Use cached settings for frontend to avoid repeated DB calls
            const settings = await supabaseAdminService.getSettings(false);

            // Check if settings is defined before accessing its properties
            if (!settings) {
              console.warn('Settings not available, continuing with default configuration');
              return;
            }

            // Apply settings to wpService
            const { wpService } = await import('@/services/wpService');
            wpService.setBaseUrl(settings.api_url);
            wpService.setFiltersApiUrl(settings.filters_api_url);
            wpService.setAuthToken(settings.auth_token || '');
          } catch (error) {
            console.error('Error initializing settings:', error);
            // Continue with default settings if initialization fails
          }
        };

        await initializeSettings();
      } catch (error) {
        console.error('Environment validation failed:', error);
        // In development, we can continue with warnings
        // In production, this would prevent the app from starting with invalid config
        if (process.env.NODE_ENV === 'production') {
          // Don't throw in production to prevent app crash
          console.error('Critical: Environment validation failed in production');
        }
      }
    };

    validateAndInitialize();
  }, []);

  return (
    <ToastProvider>
      <Component {...pageProps} />
      <PopupAd />
    </ToastProvider>
  );
}