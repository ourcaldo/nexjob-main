-- =====================================================
-- Neon DB Setup Script for Nexjob Portal
-- Based on actual project usage analysis
-- =====================================================
-- This script creates only the tables that are actually
-- used in the codebase
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    location TEXT,
    photo_url TEXT,
    bio TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =====================================================
-- 2. ADMIN SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- WordPress API Configuration
    api_url TEXT,
    filters_api_url TEXT,
    auth_token TEXT,
    wp_posts_api_url TEXT,
    wp_jobs_api_url TEXT,
    wp_auth_token TEXT,
    
    -- Site Information
    site_title TEXT NOT NULL,
    site_tagline TEXT,
    site_description TEXT,
    site_url TEXT,
    
    -- Analytics
    ga_id TEXT,
    gtm_id TEXT,
    
    -- Storage Configuration
    supabase_bucket_name TEXT,
    supabase_storage_endpoint TEXT,
    supabase_storage_region TEXT,
    supabase_storage_access_key TEXT,
    supabase_storage_secret_key TEXT,
    storage_bucket_name TEXT,
    storage_endpoint TEXT,
    storage_region TEXT,
    storage_access_key TEXT,
    storage_secret_key TEXT,
    
    -- SEO Templates
    location_page_title_template TEXT,
    location_page_description_template TEXT,
    category_page_title_template TEXT,
    category_page_description_template TEXT,
    
    -- Archive Page SEO
    jobs_title TEXT,
    jobs_description TEXT,
    articles_title TEXT,
    articles_description TEXT,
    
    -- Auth Pages SEO
    login_page_title TEXT,
    login_page_description TEXT,
    signup_page_title TEXT,
    signup_page_description TEXT,
    profile_page_title TEXT,
    profile_page_description TEXT,
    
    -- SEO Images
    home_og_image TEXT,
    jobs_og_image TEXT,
    articles_og_image TEXT,
    default_job_og_image TEXT,
    default_article_og_image TEXT,
    
    -- Sitemap Settings
    sitemap_update_interval INTEGER,
    auto_generate_sitemap BOOLEAN DEFAULT true,
    last_sitemap_update TIMESTAMPTZ,
    robots_txt TEXT,
    
    -- Advertisement Settings
    popup_ad_code TEXT,
    popup_ad_enabled BOOLEAN DEFAULT false,
    popup_ad_url TEXT,
    popup_ad_load_settings TEXT[],
    popup_ad_max_executions INTEGER DEFAULT 1,
    popup_ad_device TEXT DEFAULT 'all',
    sidebar_archive_ad_code TEXT,
    sidebar_single_ad_code TEXT,
    single_top_ad_code TEXT,
    single_bottom_ad_code TEXT,
    single_middle_ad_code TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. USER BOOKMARKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_job_id ON user_bookmarks(job_id);

-- =====================================================
-- 4. POPUP TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS popup_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    button_text TEXT NOT NULL DEFAULT 'OK',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_popup_templates_key ON popup_templates(template_key);

-- Insert default popup template
INSERT INTO popup_templates (template_key, title, content, button_text)
VALUES (
    'bookmark_login_prompt',
    'Daftar/Login Nexjob untuk Menyimpan Pekerjaan',
    'Untuk menyimpan lowongan kerja favorit Anda, silakan daftar atau login terlebih dahulu. Dengan akun Nexjob, Anda dapat menyimpan dan mengelola lowongan yang menarik.',
    'Daftar/Login Sekarang'
) ON CONFLICT (template_key) DO NOTHING;

-- =====================================================
-- 5. CMS ARTICLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nxdb_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL DEFAULT '',
    excerpt TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'trash', 'scheduled')),
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    featured_image TEXT,
    seo_title TEXT,
    meta_description TEXT,
    schema_types TEXT[] DEFAULT ARRAY['Article'],
    post_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON nxdb_articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON nxdb_articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON nxdb_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON nxdb_articles(published_at);

-- =====================================================
-- 6. ARTICLE CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nxdb_article_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_article_categories_slug ON nxdb_article_categories(slug);

-- =====================================================
-- 7. ARTICLE TAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nxdb_article_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_article_tags_slug ON nxdb_article_tags(slug);

-- =====================================================
-- 8. ARTICLE CATEGORY RELATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nxdb_article_category_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES nxdb_articles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES nxdb_article_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, category_id)
);

-- =====================================================
-- 9. ARTICLE TAG RELATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nxdb_article_tag_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES nxdb_articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES nxdb_article_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, tag_id)
);

-- =====================================================
-- 10. CMS PAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nxdb_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL DEFAULT '',
    excerpt TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'trash', 'scheduled')),
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    featured_image TEXT,
    seo_title TEXT,
    meta_description TEXT,
    schema_types TEXT[] DEFAULT ARRAY['WebPage'],
    post_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON nxdb_pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON nxdb_pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_author_id ON nxdb_pages(author_id);

-- =====================================================
-- 11. PAGE CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nxdb_page_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_categories_slug ON nxdb_page_categories(slug);

-- =====================================================
-- 12. PAGE TAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nxdb_page_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_tags_slug ON nxdb_page_tags(slug);

-- =====================================================
-- 13. PAGE CATEGORY RELATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nxdb_page_category_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES nxdb_pages(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES nxdb_page_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(page_id, category_id)
);

-- =====================================================
-- 14. PAGE TAG RELATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nxdb_page_tag_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES nxdb_pages(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES nxdb_page_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(page_id, tag_id)
);

-- =====================================================
-- 15. MEDIA TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nxdb_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS nxdb_media_user_id_idx ON nxdb_media(user_id);
CREATE INDEX IF NOT EXISTS nxdb_media_created_at_idx ON nxdb_media(created_at DESC);

-- =====================================================
-- TRIGGERS FOR updated_at COLUMNS
-- =====================================================

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_admin_settings_updated_at 
    BEFORE UPDATE ON admin_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_popup_templates_updated_at 
    BEFORE UPDATE ON popup_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON nxdb_articles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_categories_updated_at 
    BEFORE UPDATE ON nxdb_article_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_tags_updated_at 
    BEFORE UPDATE ON nxdb_article_tags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at 
    BEFORE UPDATE ON nxdb_pages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_categories_updated_at 
    BEFORE UPDATE ON nxdb_page_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_tags_updated_at 
    BEFORE UPDATE ON nxdb_page_tags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nxdb_media_updated_at 
    BEFORE UPDATE ON nxdb_media 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- END OF SCRIPT
-- =====================================================
