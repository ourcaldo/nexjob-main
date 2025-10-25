import { supabaseAdminService } from './supabaseAdminService';

// Legacy compatibility layer for existing code
class LegacyAdminService {
  // Redirect all methods to Supabase service
  async getSettings() {
    return await supabaseAdminService.getSettings();
  }

  async saveSettings(settings: any) {
    const result = await supabaseAdminService.saveSettings(settings);
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  async isAuthenticated() {
    return await supabaseAdminService.isAuthenticated();
  }

  async isSuperAdmin() {
    return await supabaseAdminService.isSuperAdmin();
  }

  async updateLastSitemapGeneration() {
    return await supabaseAdminService.updateLastSitemapGeneration();
  }

  // Legacy methods that are no longer needed but kept for compatibility
  authenticate(email: string, password: string): boolean {
    console.warn('Legacy authenticate method called. Use supabaseAdminService.signInWithEmail instead.');
    return false;
  }

  logout(): void {
    console.warn('Legacy logout method called. Use supabaseAdminService.signOut instead.');
  }

  // Cache methods - these will be handled differently now
  setSitemapCache(key: string, data: any, ttl: number = 300000): void {
    // For now, keep using localStorage for sitemap cache
    // TODO: Move to Supabase or Redis in the future
    try {
      if (typeof window === 'undefined') return;
      
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      localStorage.setItem(`nexjob_sitemap_cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting sitemap cache:', error);
    }
  }

  getSitemapCache(key: string): any | null {
    try {
      if (typeof window === 'undefined') return null;
      
      const cached = localStorage.getItem(`nexjob_sitemap_cache_${key}`);
      if (!cached) return null;
      
      const { data, timestamp, ttl } = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp > ttl) {
        // Cache expired
        localStorage.removeItem(`nexjob_sitemap_cache_${key}`);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting sitemap cache:', error);
      return null;
    }
  }

  clearSitemapCache(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('nexjob_sitemap_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing sitemap cache:', error);
    }
  }
}

export const adminService = new LegacyAdminService();