import { supabase } from '@/lib/supabase';
import type { AdminSettings } from '@/lib/supabase';

export class AdminSettingsApiService {
  private baseUrl = '/api/admin/settings/';

  // Cache for settings to avoid unnecessary API calls
  private settingsCache: { data: AdminSettings | null; timestamp: number } | null = null;
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

  private async getAuthToken(): Promise<string | null> {
    try {
      // For admin panel access, try Supabase session token first (for authenticated super admin)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        // Verify this is a super admin session
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profile?.role === 'super_admin') {
            return session.access_token;
          }
        }
      }

      // Fallback to API token from environment for external API access
      const apiToken = process.env.API_TOKEN;
      if (apiToken) {
        return apiToken;
      }

      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      // Fallback to API token if session check fails
      return process.env.API_TOKEN || null;
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAuthToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch('/api/admin/settings/', {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private isCacheValid(): boolean {
    if (!this.settingsCache) return false;
    return Date.now() - this.settingsCache.timestamp < this.CACHE_TTL;
  }

  async getSettings(forceRefresh: boolean = false): Promise<AdminSettings | null> {
    try {
      // Use cache if valid and not forcing refresh
      if (!forceRefresh && this.isCacheValid() && this.settingsCache) {
        console.log('Using cached admin settings');
        return this.settingsCache.data;
      }

      console.log('Fetching admin settings from API');

      const result = await this.makeRequest<{ data: AdminSettings }>(this.baseUrl);

      // Update cache
      this.settingsCache = {
        data: result.data,
        timestamp: Date.now()
      };

      return result.data;
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      return null;
    }
  }

  async saveSettings(settings: Partial<AdminSettings>): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.makeRequest<{ success: boolean; error?: string }>('/api/admin/settings/', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      if (result.success) {
        // Clear cache after successful save
        this.clearCache();
      }

      return result;
    } catch (error) {
      console.error('Error saving admin settings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  clearCache(): void {
    this.settingsCache = null;
    console.log('Admin settings cache cleared');
  }
}

export const adminSettingsApiService = new AdminSettingsApiService();