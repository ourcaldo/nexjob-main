export interface Job {
  id: string;
  slug: string;
  title: string;
  content: string;
  company_name: string;
  kategori_pekerjaan: string;
  lokasi_provinsi: string;
  lokasi_kota: string;
  tipe_pekerjaan: string;
  pendidikan: string;
  industry: string;
  pengalaman: string;
  tag: string;
  gender: string;
  gaji: string;
  kebijakan_kerja: string;
  link: string;
  sumber_lowongan: string;
  created_at?: string;
  seo_title?: string;
  seo_description?: string;
  _id: {
    $oid: string;
  };
  id_obj: {
    $numberInt: string;
  };
}

export interface JobFilters {
  search: string;
  location: string;
  jobType: string;
  experience: string;
  salary: string;
  education: string;
  industry: string;
}

export interface AdminSettings {
  id?: string;
  apiUrl?: string;
  api_url?: string;
  filtersApiUrl?: string;
  filters_api_url?: string;
  authToken?: string;
  auth_token?: string;
  siteTitle?: string;
  site_title?: string;
  siteDescription?: string;
  site_description?: string;
  site_tagline?: string;
  homeTitle?: string;
  homeDescription?: string;
  jobsTitle?: string;
  jobs_title?: string;
  jobsDescription?: string;
  jobs_description?: string;
  articlesTitle?: string;
  articles_title?: string;
  articlesDescription?: string;
  articles_description?: string;
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
  // WordPress API Configuration (editable from admin)
  wp_posts_api_url?: string;
  wp_jobs_api_url?: string;
  wp_auth_token?: string;
  // Dynamic SEO Templates
  location_page_title_template?: string;
  location_page_description_template?: string;
  category_page_title_template?: string;
  category_page_description_template?: string;
  // Auth Pages SEO
  login_page_title?: string;
  login_page_description?: string;
  signup_page_title?: string;
  signup_page_description?: string;
  profile_page_title?: string;
  profile_page_description?: string;
  // Advertisement Settings
  popup_ad_code?: string;
  sidebar_archive_ad_code?: string;
  sidebar_single_ad_code?: string;
  single_top_ad_code?: string;
  single_bottom_ad_code?: string;
  single_middle_ad_code?: string;
  // SEO Images
  home_og_image?: string;
  jobs_og_image?: string;
  articles_og_image?: string;
  default_job_og_image?: string;
  default_article_og_image?: string;
  // Sitemap settings
  sitemapUpdateInterval?: number; // in minutes
  sitemap_update_interval?: number;
  autoGenerateSitemap?: boolean;
  auto_generate_sitemap?: boolean;
  lastSitemapUpdate?: string;
  last_sitemap_update?: string;
  // Robots.txt settings
  robotsTxt?: string;
  robots_txt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SitemapSettings {
  updateInterval: number; // in minutes
  autoGenerate: boolean;
  lastUpdate: string;
  itemsPerPage: number;
}