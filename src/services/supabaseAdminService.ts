import { supabase, createServerSupabaseClient, AdminSettings, Profile } from '@/lib/supabase';
import { env } from '@/lib/env';

export class SupabaseAdminService {
  private defaultSettings: Omit<AdminSettings, 'id' | 'created_at' | 'updated_at'> = {
    api_url: env.WP_API_URL,
    filters_api_url: env.WP_FILTERS_API_URL,
    auth_token: env.WP_AUTH_TOKEN,
    site_title: env.SITE_NAME,
    site_tagline: 'Find Your Dream Job',
    site_description: env.SITE_DESCRIPTION,
    site_url: env.SITE_URL,
    ga_id: env.GA_ID || '',
    gtm_id: env.GTM_ID || '',
    // Supabase Storage Configuration
    supabase_storage_endpoint: 'https://uzlzyosmbxgghhmafidk.supabase.co/storage/v1/s3',
    supabase_storage_region: 'ap-southeast-1',
    supabase_storage_access_key: '642928fa32b65d648ce65ea04c64100e',
    supabase_storage_secret_key: '082c3ce06c08ba1b347af99f16ff634fd12b4949a6cdda16df30dcc5741609dc',
    // WordPress API Configuration
    wp_posts_api_url: 'https://cms.nexjob.tech/wp-json/wp/v2/posts',
    wp_jobs_api_url: 'https://cms.nexjob.tech/wp-json/wp/v2/lowongan-kerja',
    wp_auth_token: env.WP_AUTH_TOKEN,
    // Dynamic SEO Templates
    location_page_title_template: 'Lowongan Kerja di {{lokasi}} - {{site_title}}',
    location_page_description_template: 'Temukan lowongan kerja terbaru di {{lokasi}}. Dapatkan pekerjaan impian Anda dengan gaji terbaik di {{site_title}}.',
    category_page_title_template: 'Lowongan Kerja {{kategori}} - {{site_title}}',
    category_page_description_template: 'Temukan lowongan kerja {{kategori}} terbaru. Dapatkan pekerjaan impian Anda dengan gaji terbaik di {{site_title}}.',
    // Archive Page SEO Settings
    jobs_title: 'Lowongan Kerja Terbaru - {{site_title}}',
    jobs_description: 'Temukan lowongan kerja terbaru dari berbagai perusahaan terpercaya. Dapatkan pekerjaan impian Anda dengan gaji terbaik.',
    articles_title: 'Tips Karir & Panduan Kerja - {{site_title}}',
    articles_description: 'Artikel dan panduan karir terbaru untuk membantu perjalanan karir Anda. Tips interview, CV, dan pengembangan karir.',
    // Auth Pages SEO
    login_page_title: 'Login - {{site_title}}',
    login_page_description: 'Masuk ke akun Nexjob Anda untuk mengakses fitur lengkap pencarian kerja dan menyimpan lowongan favorit.',
    signup_page_title: 'Daftar Akun - {{site_title}}',
    signup_page_description: 'Daftar akun gratis di Nexjob untuk menyimpan lowongan favorit dan mendapatkan notifikasi pekerjaan terbaru.',
    profile_page_title: 'Profil Saya - {{site_title}}',
    profile_page_description: 'Kelola profil dan preferensi akun Nexjob Anda.',
    // SEO Images
    home_og_image: `${env.SITE_URL}/og-home.jpg`,
    jobs_og_image: `${env.SITE_URL}/og-jobs.jpg`,
    articles_og_image: `${env.SITE_URL}/og-articles.jpg`,
    default_job_og_image: `${env.SITE_URL}/og-job-default.jpg`,
    default_article_og_image: `${env.SITE_URL}/og-article-default.jpg`,
    sitemap_update_interval: 300,
    auto_generate_sitemap: true,
    last_sitemap_update: new Date().toISOString(),
    robots_txt: `User-agent: *
Allow: /

# Disallow admin panel
Disallow: /admin/
Disallow: /admin

# Disallow bookmarks (private pages)
Disallow: /bookmarks/
Disallow: /bookmarks

# Allow specific important pages
Allow: /lowongan-kerja/
Allow: /artikel/

# Sitemaps
Sitemap: ${env.SITE_URL}/sitemap.xml`,
    // Advertisement Settings
    popup_ad_url: '',
    popup_ad_enabled: false,
    popup_ad_load_settings: [],
    popup_ad_max_executions: 0,
    popup_ad_device: 'All',
    sidebar_archive_ad_code: '',
    sidebar_single_ad_code: '',
    single_top_ad_code: '',
    single_bottom_ad_code: '',
    single_middle_ad_code: ''
  };

  // Cache for settings to avoid unnecessary DB calls
  private settingsCache: { data: AdminSettings; timestamp: number } | null = null;
  private readonly CACHE_TTL = 2 * 60 * 1000; // Reduced to 2 minutes for admin context

  // Authentication state management for production issues
  private authRetryCount = 0;
  private readonly MAX_AUTH_RETRIES = 3;
  private authTimeout: NodeJS.Timeout | null = null;

  // Get current user profile using API layer
  async getCurrentProfile(): Promise<Profile | null> {
    try {
      // Check if we're on server side
      if (typeof window === 'undefined') {
        // Server-side: use direct database access (for API routes)
        return await this.getCurrentProfileServerSide();
      }

      // Client-side: Only allow profile fetching in specific contexts to prevent spam
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      if (!pathname.includes('/profile') && !pathname.includes('/admin') && !pathname.includes('/backend')) {
        // For other pages, return minimal session data to avoid direct profile queries
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Return a minimal profile object from session data
          return {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || undefined,
            role: 'user', // Default role, don't query database
            created_at: session.user.created_at || new Date().toISOString(),
            phone: undefined,
            birth_date: undefined,
            gender: undefined,
            location: undefined,
            photo_url: undefined,
            bio: undefined
          } as Profile;
        }
        return null;
      }

      // Only for profile/admin pages: use API layer to get full profile
      const { userProfileApiService } = await import('./userProfileApiService');
      const result = await userProfileApiService.getCurrentUserProfile();

      if (!result.success) {
        console.error('Error getting current profile via API:', result.error);
        return null;
      }

      // Reset retry count on success
      this.authRetryCount = 0;
      return result.data || null;
    } catch (error) {
      console.error('Error getting current profile:', error);

      // Implement retry logic for production issues
      if (this.authRetryCount < this.MAX_AUTH_RETRIES) {
        this.authRetryCount++;
        console.log(`Retrying authentication (attempt ${this.authRetryCount}/${this.MAX_AUTH_RETRIES})`);

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, this.authRetryCount) * 1000));
        return this.getCurrentProfile();
      }

      return null;
    }
  }

  // Server-side method for direct database access (used in API routes)
  private async getCurrentProfileServerSide(): Promise<Profile | null> {
    try {
      // Add timeout for production issues
      const timeoutPromise = new Promise<never>((_, reject) => {
        this.authTimeout = setTimeout(() => {
          reject(new Error('Authentication timeout'));
        }, 10000); // 10 second timeout
      });

      const authPromise = supabase.auth.getUser();

      const { data: { user } } = await Promise.race([authPromise, timeoutPromise]);

      if (this.authTimeout) {
        clearTimeout(this.authTimeout);
        this.authTimeout = null;
      }

      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile server-side:', error);
        return null;
      }

      return data;
    } catch (error) {
      if (this.authTimeout) {
        clearTimeout(this.authTimeout);
        this.authTimeout = null;
      }

      console.error('Error getting current profile server-side:', error);
      return null;
    }
  }

  // Check if current user is super admin using API layer
  async isSuperAdmin(): Promise<boolean> {
    try {
      // Check if we're on server side
      if (typeof window === 'undefined') {
        // Server-side: use direct database access
        return await this.isSuperAdminServerSide();
      }

      // Client-side: NEVER do role checks for regular users to avoid direct queries
      // Only check if explicitly needed in admin contexts
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      if (!pathname.includes('/admin') && !pathname.includes('/backend')) {
        // For non-admin pages, always return false to avoid unnecessary API calls
        return false;
      }

      // For admin pages only, use API layer
      const token = await this.getAuthToken();
      if (!token) {
        return false;
      }

      const response = await fetch('/api/user/role/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success && data.data?.role === 'super_admin';
    } catch (error) {
      return false;
    }
  }

  // Server-side method for direct database access (used in API routes)
  private async isSuperAdminServerSide(): Promise<boolean> {
    try {
      const supabaseServer = createServerSupabaseClient();
      
      const { data: { user } } = await supabaseServer.auth.getUser();
      if (!user) return false;

      const { data: profile, error } = await supabaseServer
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking super admin status server-side:', error);
        return false;
      }

      return profile?.role === 'super_admin';
    } catch (error) {
      console.error('Error checking super admin status server-side:', error);
      return false;
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Check if cache is valid (reduced TTL for admin context)
  private isCacheValid(): boolean {
    if (!this.settingsCache) return false;
    return Date.now() - this.settingsCache.timestamp < this.CACHE_TTL;
  }

  // Get admin settings using API layer (for client-side) or direct DB (for server-side)
  async getSettings(forceRefresh: boolean = false): Promise<AdminSettings | undefined> {
    try {
      // Check if we're on the server side
      if (typeof window === 'undefined') {
        // Server-side: use direct database access
        return await this.getSettingsServerSide();
      }

      // Client-side: Check if user is super admin
      const isAdmin = await this.isSuperAdmin();

      if (isAdmin) {
        // For super admin: use admin API (full settings with sensitive data)
        const { adminSettingsApiService } = await import('./adminSettingsApiService');
        const settings = await adminSettingsApiService.getSettings(forceRefresh);

        if (settings) {
          return settings;
        }
      } else {
        // For public/regular users: use public API (safe settings only)
        const { publicSettingsApiService } = await import('./publicSettingsApiService');
        const publicSettings = await publicSettingsApiService.getSettings(forceRefresh);

        if (publicSettings) {
          // Merge public settings with defaults for any missing fields
          return {
            ...this.defaultSettings,
            ...publicSettings
          } as AdminSettings;
        }
      }

      // Fallback to defaults if no settings found
      return this.defaultSettings as AdminSettings;
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      return this.defaultSettings as AdminSettings;
    }
  }

  // Server-side method for direct database access
  private async getSettingsServerSide(): Promise<AdminSettings> {
    try {
      // For admin panel, always force refresh to avoid stale data issues
      const isAdminContext = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

      // Use cache if valid and not in admin context
      if (!isAdminContext && this.isCacheValid() && this.settingsCache) {
        console.log('Using cached settings');
        return this.settingsCache.data;
      }

      console.log('Fetching fresh settings from database');

      const supabaseServer = createServerSupabaseClient();

      const { data, error } = await supabaseServer
        .from('admin_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let settings: AdminSettings;

      if (error) {
        console.warn('Error fetching admin settings server-side:', error.message);
        if (error.code === 'PGRST116') {
          // No settings found, use defaults
          settings = this.defaultSettings as AdminSettings;
        } else {
          // Other error, try fallback approaches
          settings = this.defaultSettings as AdminSettings;
        }
      } else if (!data) {
        console.warn('No admin settings found, using defaults');
        settings = this.defaultSettings as AdminSettings;
      } else {
        settings = data;
      }

      // Update cache only if we got valid data and not in admin context
      if (settings && !isAdminContext) {
        this.settingsCache = {
          data: settings,
          timestamp: Date.now()
        };
      }

      return settings;
    } catch (error) {
      console.error('Error fetching admin settings server-side:', error);
      return this.defaultSettings as AdminSettings;
    }
  }

  // Clear settings cache
  clearSettingsCache(): void {
    this.settingsCache = null;
    console.log('Settings cache cleared');
  }

  // Save admin settings using API layer (for client-side) or direct DB (for server-side)
  async saveSettings(settings: Partial<AdminSettings>): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we're on the server side
      if (typeof window === 'undefined') {
        // Server-side: use direct database access
        return await this.saveSettingsServerSide(settings);
      }

      // Client-side: use API layer
      const { adminSettingsApiService } = await import('./adminSettingsApiService');
      const result = await adminSettingsApiService.saveSettings(settings);

      if (result.success) {
        // Clear both admin and public caches after successful save
        this.clearSettingsCache();

        // Also clear public cache
        try {
          const { publicSettingsApiService } = await import('./publicSettingsApiService');
          publicSettingsApiService.clearCache();
        } catch (error) {
          console.log('Could not clear public cache:', error);
        }
      }

      return result;
    } catch (error) {
      console.error('Error saving admin settings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Server-side method for direct database access
  private async saveSettingsServerSide(settings: Partial<AdminSettings>): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user is super admin
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        return { success: false, error: 'Unauthorized: Super admin access required' };
      }

      const supabaseServer = createServerSupabaseClient();

      // Get existing settings
      const { data: existingSettings } = await supabaseServer
        .from('admin_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let result;
      if (existingSettings?.id) {
        // Update existing settings
        result = await supabaseServer
          .from('admin_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id)
          .select()
          .single();
      } else {
        // Insert new settings
        result = await supabaseServer
          .from('admin_settings')
          .insert({
            ...this.defaultSettings,
            ...settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error saving admin settings server-side:', result.error);
        return { success: false, error: result.error.message };
      }

      // Clear cache after successful save
      this.clearSettingsCache();

      return { success: true };
    } catch (error) {
      console.error('Error saving admin settings server-side:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Update last sitemap generation timestamp with better error handling
  async updateLastSitemapGeneration(): Promise<void> {
    try {
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) return;

      const { data: existingSettings } = await supabase
        .from('admin_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingSettings?.id) {
        await supabase
          .from('admin_settings')
          .update({
            last_sitemap_update: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id);

        // Clear cache after update
        this.clearSettingsCache();
      }
    } catch (error) {
      console.error('Error updating sitemap timestamp:', error);
    }
  }

  // Authentication methods with enhanced error handling for production
  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Add timeout for production issues
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Sign in timeout - please try again'));
        }, 15000);
      });

      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password
      });

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]);

      if (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
      }

      // Clear cache on successful login to ensure fresh data
      this.clearSettingsCache();
      this.authRetryCount = 0; // Reset retry count

      console.log('Sign in successful');
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);

      let errorMessage = 'Sign in failed';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Sign in timeout - please check your connection and try again';
        } else {
          errorMessage = error.message;
        }
      }

      return { success: false, error: errorMessage };
    }
  }

  async signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Magic link timeout'));
        }, 10000);
      });

      const magicLinkPromise = supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`
        }
      });

      const { error } = await Promise.race([magicLinkPromise, timeoutPromise]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Magic link error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Magic link failed' };
    }
  }

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      // Clear cache on logout
      this.clearSettingsCache();
      this.authRetryCount = 0; // Reset retry count
      console.log('Sign out successful');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  // Check if user is authenticated with better error handling
  async isAuthenticated(): Promise<boolean> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Authentication check timeout'));
        }, 8000);
      });

      const authPromise = supabase.auth.getUser();
      const { data: { user } } = await Promise.race([authPromise, timeoutPromise]);

      return !!user;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Server-side methods for API routes with better error handling
  static async getSettingsServerSide(): Promise<AdminSettings> {
    try {
      const supabaseServer = createServerSupabaseClient();

      const { data, error } = await supabaseServer
        .from('admin_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.warn('Error fetching admin settings server-side:', error.message);

        // Try with public/anon access if auth fails
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const publicClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );

          const { data: publicData, error: publicError } = await publicClient
            .from('admin_settings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (publicError || !publicData) {
            console.warn('Public access also failed, using defaults');
            return SupabaseAdminService.getDefaultSettings();
          }

          return publicData;
        } catch (publicErr) {
          console.error('Public retry failed:', publicErr);
          return SupabaseAdminService.getDefaultSettings();
        }
      }

      if (!data) {
        console.warn('No admin settings found on server, using defaults');
        return SupabaseAdminService.getDefaultSettings();
      }

      return data;
    } catch (error) {
      console.error('Error fetching admin settings server-side:', error);
      return SupabaseAdminService.getDefaultSettings();
    }
  }

  // Get default settings as a static method
  static getDefaultSettings(): AdminSettings {
    return {
      api_url: env.WP_API_URL,
      filters_api_url: env.WP_FILTERS_API_URL,
      auth_token: env.WP_AUTH_TOKEN,
      site_title: env.SITE_NAME,
      site_tagline: 'Find Your Dream Job',
      site_description: env.SITE_DESCRIPTION,
      site_url: env.SITE_URL,
      ga_id: env.GA_ID || '',
      gtm_id: env.GTM_ID || '',
      // Supabase Storage Configuration
      supabase_storage_endpoint: 'https://uzlzyosmbxgghhmafidk.supabase.co/storage/v1/s3',
      supabase_storage_region: 'ap-southeast-1',
      supabase_storage_access_key: '642928fa32b65d648ce65ea04c64100e',
      supabase_storage_secret_key: '082c3ce06c08ba1b347af99f16ff634fd12b4949a6cdda16df30dcc5741609dc',
      // WordPress API Configuration
      wp_posts_api_url: 'https://cms.nexjob.tech/wp-json/wp/v2/posts',
      wp_jobs_api_url: 'https://cms.nexjob.tech/wp-json/wp/v2/lowongan-kerja',
      wp_auth_token: env.WP_AUTH_TOKEN,
      // Dynamic SEO Templates
      location_page_title_template: 'Lowongan Kerja di {{lokasi}} - {{site_title}}',
      location_page_description_template: 'Temukan lowongan kerja terbaru di {{lokasi}}. Dapatkan pekerjaan impian Anda dengan gaji terbaik di {{site_title}}.',
      category_page_title_template: 'Lowongan Kerja {{kategori}} - {{site_title}}',
      category_page_description_template: 'Temukan lowongan kerja {{kategori}} terbaru. Dapatkan pekerjaan impian Anda dengan gaji terbaik di {{site_title}}.',
      // Archive Page SEO Settings
      jobs_title: 'Lowongan Kerja Terbaru - {{site_title}}',
      jobs_description: 'Temukan lowongan kerja terbaru dari berbagai perusahaan terpercaya. Dapatkan pekerjaan impian Anda dengan gaji terbaik.',
      articles_title: 'Tips Karir & Panduan Kerja - {{site_title}}',
      articles_description: 'Artikel dan panduan karir terbaru untuk membantu perjalanan karir Anda. Tips interview, CV, dan pengembangan karir.',
      // Auth Pages SEO
      login_page_title: 'Login - {{site_title}}',
      login_page_description: 'Masuk ke akun Nexjob Anda untuk mengakses fitur lengkap pencarian kerja dan menyimpan lowongan favorit.',
      signup_page_title: 'Daftar Akun - {{site_title}}',
      signup_page_description: 'Daftar akun gratis di Nexjob untuk menyimpan lowongan favorit dan mendapatkan notifikasi pekerjaan terbaru.',
      profile_page_title: 'Profil Saya - {{site_title}}',
      profile_page_description: 'Kelola profil dan preferensi akun Nexjob Anda.',
      // SEO Images
      home_og_image: `${env.SITE_URL}/og-home.jpg`,
      jobs_og_image: `${env.SITE_URL}/og-jobs.jpg`,
      articles_og_image: `${env.SITE_URL}/og-articles.jpg`,
      default_job_og_image: `${env.SITE_URL}/og-job-default.jpg`,
      default_article_og_image: `${env.SITE_URL}/og-article-default.jpg`,
      sitemap_update_interval: 300,
      auto_generate_sitemap: true,
      last_sitemap_update: new Date().toISOString(),
      robots_txt: `User-agent: *
Allow: /

# Disallow admin panel
Disallow: /admin/
Disallow: /admin

# Disallow bookmarks (private pages)
Disallow: /bookmarks/
Disallow: /bookmarks

# Allow specific important pages
Allow: /lowongan-kerja/
Allow: /artikel/

# Sitemaps
Sitemap: ${env.SITE_URL}/sitemap.xml`,
    // Advertisement Settings
    popup_ad_url: '',
    popup_ad_enabled: false,
    popup_ad_load_settings: [],
    popup_ad_max_executions: 0,
    popup_ad_device: 'All',
    sidebar_archive_ad_code: '',
    sidebar_single_ad_code: '',
    single_top_ad_code: '',
    single_bottom_ad_code: '',
    single_middle_ad_code: ''
    } as AdminSettings;
  }

  static async getCurrentProfileServerSide(context: any): Promise<Profile | null> {
    try {
      const supabaseServer = createServerSupabaseClient();

      // Get user from request cookies/headers
      const { req } = context;
      const token = req.cookies['sb-access-token'] || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return null;
      }

      // Get user from token
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

      if (authError || !user) {
        console.warn('Auth error in server-side profile check:', authError);
        return null;
      }

      // Get profile
      const { data: profile, error: profileError } = await supabaseServer
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Profile error in server-side check:', profileError);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error getting current profile server-side:', error);
      return null;
    }
  }

  static async updateSettingsServerSide(settings: Partial<AdminSettings>): Promise<{ success: boolean; error?: string }> {
    try {
      const supabaseServer = createServerSupabaseClient();

      // Get existing settings
      const { data: existingSettings } = await supabaseServer
        .from('admin_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let result;
      if (existingSettings?.id) {
        // Update existing settings
        result = await supabaseServer
          .from('admin_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id)
          .select()
          .single();
      } else {
        // Insert new settings
        result = await supabaseServer
          .from('admin_settings')
          .insert(settings)
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error saving admin settings server-side:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving admin settings server-side:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const supabaseAdminService = new SupabaseAdminService();