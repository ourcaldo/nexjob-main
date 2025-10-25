import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { advertisementService } from '@/services/advertisementService';

const PopupAd: React.FC = () => {
  const router = useRouter();
  const [popupConfig, setPopupConfig] = useState({
    url: '',
    enabled: false,
    loadSettings: ['all_pages'],
    maxExecutions: 1,
    device: 'all'
  });
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // Device detection
  const getDeviceType = (): 'mobile' | 'desktop' => {
    if (typeof window === 'undefined') return 'desktop';
    return window.innerWidth <= 768 ? 'mobile' : 'desktop';
  };

  // Check if current page should trigger popup
  const shouldTriggerOnPage = useCallback((loadSettings: string[]): boolean => {
    const currentPath = router.asPath;

    if (loadSettings.includes('all_pages')) {
      return true;
    }

    if (loadSettings.includes('single_articles')) {
      // Check if current page is a single article page
      return currentPath.startsWith('/artikel/') && !currentPath.endsWith('/artikel/');
    }

    return false;
  }, [router.asPath]);

  /**
   * Generate a random alphanumeric string.
   */
  const generateRandomString = useCallback((length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  /**
   * Generate a session ID with timestamp and random string.
   */
  const generateSessionId = useCallback((): string => {
    return 'session_' + Date.now() + '_' + generateRandomString(8);
  }, [generateRandomString]);

  /**
   * Generate a page-unique key for session tracking.
   */
  const getPageKey = useCallback((): string => {
    return router.pathname;
  }, [router.pathname]);

  /**
   * Clear sessionStorage from other pages to ensure only current page has session
   */
  const clearOtherPagesSessions = useCallback((): void => {
    const currentPageKey = getPageKey();
    const allKeys = Object.keys(sessionStorage);

    // Find all sessionID_ and tabOpened_ keys that are NOT for current page
    const keysToRemove = allKeys.filter(key => {
      if (key.startsWith('sessionID_') || key.startsWith('tabOpened_')) {
        const pageFromKey = key.replace('sessionID_', '').replace('tabOpened_', '');
        return pageFromKey !== currentPageKey;
      }
      return false;
    });

    // Remove cookies from other pages
    keysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      console.log('[DEBUG] PopupAd: Removed sessionStorage from other page:', key);
    });

    if (keysToRemove.length > 0) {
      console.log('[DEBUG] PopupAd: Cleared', keysToRemove.length, 'sessionStorage entries from other pages');
    }
  }, [getPageKey]);

  /**
   * Initialize session ID, once per page session.
   */
  const initSession = useCallback((): void => {
    const sessionKey = 'sessionID_' + getPageKey();
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, generateSessionId());
      console.log('[DEBUG] PopupAd: Session initialized:', sessionKey);
    }
  }, [getPageKey, generateSessionId]);

  /**
   * Open the target URL in a new tab, only once per page session.
   */
  const openTabOnce = useCallback((): void => {
    const tabKey = 'tabOpened_' + getPageKey();
    if (!sessionStorage.getItem(tabKey)) {
      console.log('[DEBUG] PopupAd: Opening new tab - no previous session found');
      window.open(popupConfig.url, '_blank');
      sessionStorage.setItem(tabKey, 'true');
      console.log('[DEBUG] PopupAd: Tab opened and marked in sessionStorage:', tabKey);
    } else {
      console.log('[DEBUG] PopupAd: Tab already opened in this session - BLOCKED');
    }
  }, [popupConfig.url, getPageKey]);

  /**
   * Main handler to be triggered by user interaction.
   * EXACTLY like reference - init session and open tab ONLY on user click
   */
  const handleUserEventTrigger = useCallback((): void => {
    console.log('[DEBUG] PopupAd: User click detected');
    initSession();
    openTabOnce();
  }, [initSession, openTabOnce]);

  // Load popup configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('[DEBUG] PopupAd: Loading popup configuration...');
        const config = await advertisementService.getPopupAdConfig();
        setPopupConfig(config);
        setIsConfigLoaded(true);
        console.log('[DEBUG] PopupAd: Configuration loaded:', config);
      } catch (error) {
        console.error('[DEBUG] PopupAd: Error loading popup config:', error);
        setIsConfigLoaded(true);
      }
    };

    loadConfig();
  }, []);

  // Set up click event listener and cleanup sessionStorage when page changes
  useEffect(() => {
    if (!isConfigLoaded || !popupConfig.enabled || !popupConfig.url) {
      console.log('[DEBUG] PopupAd: Popup disabled or no URL configured');
      return;
    }

    // Check if should trigger on this page
    if (!shouldTriggerOnPage(popupConfig.loadSettings)) {
      console.log('[DEBUG] PopupAd: Page not eligible for popup based on load settings');
      return;
    }

    // Check device compatibility
    const currentDevice = getDeviceType();
    if (popupConfig.device !== 'all' && popupConfig.device !== currentDevice) {
      console.log('[DEBUG] PopupAd: Device not compatible:', { current: currentDevice, required: popupConfig.device });
      return;
    }

    console.log('[DEBUG] PopupAd: Setting up click listener for page:', getPageKey());

    // CLEAR sessionStorage dari page lain saat mount component
    clearOtherPagesSessions();

    const handleClick = (event: MouseEvent) => {
      handleUserEventTrigger();
    };

    // Add click listener to document
    document.addEventListener('click', handleClick, { passive: true });

    // Cleanup function - HAPUS sessionStorage dari halaman sebelumnya
    return () => {
      console.log('[DEBUG] PopupAd: Removing click listener');
      document.removeEventListener('click', handleClick);

      // HAPUS sessionStorage untuk halaman ini saat pindah halaman
      const currentPageKey = getPageKey();
      const sessionKey = 'sessionID_' + currentPageKey;
      const tabKey = 'tabOpened_' + currentPageKey;

      if (sessionStorage.getItem(sessionKey) || sessionStorage.getItem(tabKey)) {
        sessionStorage.removeItem(sessionKey);
        sessionStorage.removeItem(tabKey);
        console.log('[DEBUG] PopupAd: Cleared sessionStorage on page leave:', { 
          sessionKey, 
          tabKey 
        });
      }
    };
  }, [isConfigLoaded, popupConfig, router.pathname, shouldTriggerOnPage, getPageKey, clearOtherPagesSessions, handleUserEventTrigger]);

  // Component renders nothing (invisible)
  return null;
};

export default PopupAd;