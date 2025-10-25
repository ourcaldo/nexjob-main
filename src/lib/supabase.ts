import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_KEY!
  }
});

// Auth state utilities
export const getAuthState = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    console.error('Error getting auth state:', error);
    return { session: null, error };
  }
};

export const waitForAuthInitialization = () => {
  return new Promise<void>((resolve) => {
    let resolved = false;
    
    // Set a timeout to resolve after 500ms max (shorter timeout)
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, 500);
    
    // Try to get session immediately
    supabase.auth.getSession().then(() => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve();
      }
    }).catch(() => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve();
      }
    });
  });
};

// Auth state cache to prevent unnecessary re-checks
let authStateCache: { session: any; timestamp: number } | null = null;
const CACHE_DURATION = parseInt(process.env.AUTH_CACHE_DURATION || '5000');

export const getCachedAuthState = async () => {
  const now = Date.now();
  
  // Return cached state if it's still fresh
  if (authStateCache && (now - authStateCache.timestamp) < CACHE_DURATION) {
    return { session: authStateCache.session, error: null };
  }
  
  // Get fresh auth state
  const { session, error } = await getAuthState();
  
  // Cache the result
  authStateCache = {
    session,
    timestamp: now
  };
  
  return { session, error };
};

// Clear auth cache when needed
export const clearAuthCache = () => {
  authStateCache = null;
};

// Server-side client with service role key
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  location?: string;
  photo_url?: string | null;
  bio?: string;
  role: 'user' | 'super_admin';
  created_at: string;
}

export interface UserBookmark {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
}

export interface PopupTemplate {
  id: string;
  template_key: string;
  title: string;
  content: string;
  button_text: string;
  created_at: string;
  updated_at: string;
}

// CMS Page Types
export interface NxdbPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published' | 'trash' | 'scheduled';
  author_id?: string;
  featured_image?: string;
  seo_title?: string;
  meta_description?: string;
  schema_types: string[];
  post_date: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Profile;
  categories?: NxdbPageCategory[];
  tags?: NxdbPageTag[];
}

// CMS Article Types
export interface NxdbArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published' | 'trash' | 'scheduled';
  author_id?: string;
  featured_image?: string;
  seo_title?: string;
  meta_description?: string;
  schema_types: string[];
  post_date: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Profile;
  categories?: NxdbArticleCategory[];
  tags?: NxdbArticleTag[];
}

export interface NxdbArticleCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface NxdbArticleTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

// CMS Page Types
export interface NxdbPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published' | 'trash' | 'scheduled';
  author_id?: string;
  featured_image?: string;
  seo_title?: string;
  meta_description?: string;
  schema_types: string[];
  post_date: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Profile;
  categories?: NxdbPageCategory[];
  tags?: NxdbPageTag[];
}

export interface NxdbPageCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface NxdbPageTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface NxdbMedia {
  id: string;
  user_id: string;
  url: string;
  name: string;
  path: string;
  size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export interface NxdbPageCategoryRelation {
  id: string;
  page_id: string;
  category_id: string;
  created_at: string;
}

export interface NxdbPageTagRelation {
  id: string;
  page_id: string;
  tag_id: string;
  created_at: string;
}

export interface AdminSettings {
  id?: string;
  api_url: string;
  filters_api_url: string;
  auth_token?: string;
  site_title: string;
  site_tagline: string;
  site_description: string;
  // Environment settings that can be edited from admin
  site_url?: string;
  ga_id?: string;
  gtm_id?: string;
  // Supabase Database Configuration
  database_supabase_url?: string;
  database_supabase_anon_key?: string;
  database_supabase_service_role_key?: string;
  // Supabase Storage Configuration (editable from admin)
  supabase_bucket_name?: string;
  supabase_storage_endpoint?: string;
  supabase_storage_region?: string;
  supabase_storage_access_key?: string;
  supabase_storage_secret_key?: string;
  // Storage Configuration (additional properties)
  storage_bucket_name?: string;
  storage_endpoint?: string;
  storage_region?: string;
  storage_access_key?: string;
  storage_secret_key?: string;
  // WordPress API Configuration (editable from admin)
  wp_posts_api_url: string;
  wp_jobs_api_url: string;
  wp_auth_token?: string;
  // Dynamic SEO Templates
  location_page_title_template: string;
  location_page_description_template: string;
  category_page_title_template: string;
  category_page_description_template: string;
  // Archive Page SEO Settings
  jobs_title: string;
  jobs_description: string;
  articles_title: string;
  articles_description: string;
  // Auth Pages SEO
  login_page_title: string;
  login_page_description: string;
  signup_page_title: string;
  signup_page_description: string;
  // Popup Advertisement Settings
  popup_ad_enabled?: boolean;
  popup_ad_url?: string;
  popup_ad_load_settings?: string[];
  popup_ad_max_executions?: number;
  popup_ad_device?: string;
  // Advertisement Settings
  popup_ad_code?: string;
  sidebar_archive_ad_code?: string;
  sidebar_single_ad_code?: string;
  single_top_ad_code?: string;
  single_bottom_ad_code?: string;
  single_middle_ad_code?: string;
  profile_page_title: string;
  profile_page_description: string;
  // SEO Images
  home_og_image?: string;
  jobs_og_image?: string;
  articles_og_image?: string;
  default_job_og_image?: string;
  default_article_og_image?: string;
  // Sitemap settings
  sitemap_update_interval: number;
  auto_generate_sitemap: boolean;
  last_sitemap_update: string;
  robots_txt: string;
  created_at?: string;
  updated_at?: string;
}