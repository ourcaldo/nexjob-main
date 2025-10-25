# Nexjob - Neon DB Migration Guide

## Executive Summary

This document provides a comprehensive overview of all database queries and schema for migrating from Supabase to Neon DB. The application uses PostgreSQL with Row Level Security (RLS) policies.

---

## Database Connection Configuration

### Current Supabase Setup
```typescript
// src/lib/supabase.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side connection
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_KEY!
  }
});

// Server-side connection
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
```

### Migration to Neon DB
You'll need to:
1. Replace Supabase client with direct PostgreSQL connection
2. Implement authentication separately (Supabase Auth → your own or third-party)
3. Update all `supabase.from()` queries to raw SQL or use an ORM like Drizzle/Prisma
4. Migrate Row Level Security policies to application-level permissions

---

## Complete Database Schema

### 1. **profiles** (User Profiles)
```sql
-- This table is created by Supabase Auth automatically
-- Schema structure inferred from TypeScript interface:
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
```

### 2. **admin_settings** (Site Configuration)
```sql
CREATE TABLE admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Site Information
    site_title TEXT NOT NULL,
    site_tagline TEXT DEFAULT 'Find Your Dream Job',
    site_description TEXT,
    site_url TEXT,
    
    -- WordPress API Configuration
    api_url TEXT,
    filters_api_url TEXT,
    auth_token TEXT,
    wp_posts_api_url TEXT DEFAULT 'https://cms.nexjob.tech/wp-json/wp/v2/posts',
    wp_jobs_api_url TEXT DEFAULT 'https://cms.nexjob.tech/wp-json/wp/v2/lowongan-kerja',
    wp_auth_token TEXT,
    
    -- Analytics
    ga_id TEXT,
    gtm_id TEXT,
    
    -- Supabase Storage Configuration
    supabase_storage_endpoint TEXT,
    supabase_storage_region TEXT,
    supabase_storage_access_key TEXT,
    supabase_storage_secret_key TEXT,
    
    -- SEO Templates
    location_page_title_template TEXT DEFAULT 'Lowongan Kerja di {{lokasi}} - {{site_title}}',
    location_page_description_template TEXT DEFAULT 'Temukan lowongan kerja terbaru di {{lokasi}}. Dapatkan pekerjaan impian Anda dengan gaji terbaik di {{site_title}}.',
    category_page_title_template TEXT DEFAULT 'Lowongan Kerja {{kategori}} - {{site_title}}',
    category_page_description_template TEXT DEFAULT 'Temukan lowongan kerja {{kategori}} terbaru. Dapatkan pekerjaan impian Anda dengan gaji terbaik di {{site_title}}.',
    
    -- Archive Pages SEO
    jobs_title TEXT NOT NULL DEFAULT 'Lowongan Kerja Terbaru - {{site_title}}',
    jobs_description TEXT NOT NULL DEFAULT 'Temukan lowongan kerja terbaru dari berbagai perusahaan terpercaya.',
    articles_title TEXT NOT NULL DEFAULT 'Tips Karir & Panduan Kerja - {{site_title}}',
    articles_description TEXT NOT NULL DEFAULT 'Artikel dan panduan karir terbaru untuk membantu perjalanan karir Anda.',
    
    -- Auth Pages SEO
    login_page_title TEXT DEFAULT 'Login - {{site_title}}',
    login_page_description TEXT DEFAULT 'Masuk ke akun Nexjob Anda untuk mengakses fitur lengkap pencarian kerja.',
    signup_page_title TEXT DEFAULT 'Daftar Akun - {{site_title}}',
    signup_page_description TEXT DEFAULT 'Daftar akun gratis di Nexjob untuk menyimpan lowongan favorit.',
    profile_page_title TEXT DEFAULT 'Profil Saya - {{site_title}}',
    profile_page_description TEXT DEFAULT 'Kelola profil dan preferensi akun Nexjob Anda.',
    
    -- SEO Images
    home_og_image TEXT,
    jobs_og_image TEXT,
    articles_og_image TEXT,
    default_job_og_image TEXT,
    default_article_og_image TEXT,
    
    -- Other Settings
    robots_txt TEXT,
    auto_generate_sitemap BOOLEAN DEFAULT true,
    
    -- Advertisement Settings
    sidebar_archive_ad_code TEXT,
    sidebar_single_ad_code TEXT,
    single_top_ad_code TEXT,
    single_bottom_ad_code TEXT,
    single_middle_ad_code TEXT,
    popup_ad_url TEXT DEFAULT '',
    popup_ad_enabled BOOLEAN DEFAULT false,
    popup_ad_load_settings TEXT[] DEFAULT ARRAY['all_pages'],
    popup_ad_max_executions INTEGER DEFAULT 1,
    popup_ad_device TEXT DEFAULT 'all',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to admin settings"
  ON admin_settings FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated users to read admin settings"
  ON admin_settings FOR SELECT TO authenticated USING (true);
```

### 3. **user_bookmarks** (User Saved Jobs)
```sql
CREATE TABLE user_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

CREATE INDEX idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX idx_user_bookmarks_job_id ON user_bookmarks(job_id);

-- RLS Policies
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookmarks"
  ON user_bookmarks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON user_bookmarks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON user_bookmarks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

### 4. **popup_templates** (Popup Messages)
```sql
CREATE TABLE popup_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    button_text TEXT NOT NULL DEFAULT 'OK',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_popup_templates_key ON popup_templates(template_key);

-- RLS Policies
ALTER TABLE popup_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read popup templates"
  ON popup_templates FOR SELECT TO public USING (true);

CREATE POLICY "Super admins can manage popup templates"
  ON popup_templates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );
```

### 5. **nxdb_articles** (CMS Articles)
```sql
CREATE TABLE nxdb_articles (
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

CREATE INDEX idx_articles_slug ON nxdb_articles(slug);
CREATE INDEX idx_articles_status ON nxdb_articles(status);
CREATE INDEX idx_articles_author_id ON nxdb_articles(author_id);
CREATE INDEX idx_articles_published_at ON nxdb_articles(published_at);

-- RLS Policies
ALTER TABLE nxdb_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Articles are viewable by everyone for published content"
  ON nxdb_articles FOR SELECT
  USING (status = 'published' OR auth.role() = 'authenticated');

CREATE POLICY "Articles are editable by authenticated users"
  ON nxdb_articles FOR ALL
  USING (auth.role() = 'authenticated');
```

### 6. **nxdb_article_categories** (Article Categories)
```sql
CREATE TABLE nxdb_article_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_article_categories_slug ON nxdb_article_categories(slug);

-- RLS Policies
ALTER TABLE nxdb_article_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Article categories are viewable by everyone"
  ON nxdb_article_categories FOR SELECT USING (true);

CREATE POLICY "Article categories are editable by authenticated users"
  ON nxdb_article_categories FOR ALL
  USING (auth.role() = 'authenticated');
```

### 7. **nxdb_article_tags** (Article Tags)
```sql
CREATE TABLE nxdb_article_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_article_tags_slug ON nxdb_article_tags(slug);

-- RLS Policies
ALTER TABLE nxdb_article_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Article tags are viewable by everyone"
  ON nxdb_article_tags FOR SELECT USING (true);

CREATE POLICY "Article tags are editable by authenticated users"
  ON nxdb_article_tags FOR ALL
  USING (auth.role() = 'authenticated');
```

### 8. **nxdb_article_category_relations** (Article-Category Junction)
```sql
CREATE TABLE nxdb_article_category_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES nxdb_articles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES nxdb_article_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, category_id)
);

-- RLS Policies
ALTER TABLE nxdb_article_category_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Article category relations are viewable by everyone"
  ON nxdb_article_category_relations FOR SELECT USING (true);

CREATE POLICY "Article category relations are editable by authenticated users"
  ON nxdb_article_category_relations FOR ALL
  USING (auth.role() = 'authenticated');
```

### 9. **nxdb_article_tag_relations** (Article-Tag Junction)
```sql
CREATE TABLE nxdb_article_tag_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES nxdb_articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES nxdb_article_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, tag_id)
);

-- RLS Policies
ALTER TABLE nxdb_article_tag_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Article tag relations are viewable by everyone"
  ON nxdb_article_tag_relations FOR SELECT USING (true);

CREATE POLICY "Article tag relations are editable by authenticated users"
  ON nxdb_article_tag_relations FOR ALL
  USING (auth.role() = 'authenticated');
```

### 10. **nxdb_pages** (CMS Pages - Same structure as articles)
```sql
CREATE TABLE nxdb_pages (
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

-- Similar indexes, categories, tags, and relations tables as articles
CREATE TABLE nxdb_page_categories (...);
CREATE TABLE nxdb_page_tags (...);
CREATE TABLE nxdb_page_category_relations (...);
CREATE TABLE nxdb_page_tag_relations (...);
```

### 11. **nxdb_media** (Media Library)
```sql
CREATE TABLE nxdb_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX nxdb_media_user_id_idx ON nxdb_media(user_id);
CREATE INDEX nxdb_media_created_at_idx ON nxdb_media(created_at DESC);

-- RLS Policies
ALTER TABLE nxdb_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media"
  ON nxdb_media FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media"
  ON nxdb_media FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media"
  ON nxdb_media FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
  ON nxdb_media FOR DELETE USING (auth.uid() = user_id);
```

---

## All SELECT Queries (Read Operations)

### Admin Settings Queries

#### 1. Get Latest Admin Settings
```sql
-- File: pages/api/admin/settings.ts
SELECT * FROM admin_settings
ORDER BY created_at DESC
LIMIT 1;
```

#### 2. Get Public Settings (Specific Fields)
```sql
-- File: pages/api/public/settings.ts
SELECT 
    site_title,
    site_tagline, 
    site_description,
    site_url,
    location_page_title_template,
    location_page_description_template,
    category_page_title_template,
    category_page_description_template,
    jobs_title,
    jobs_description,
    articles_title,
    articles_description,
    login_page_title,
    login_page_description,
    signup_page_title,
    signup_page_description,
    profile_page_title,
    profile_page_description,
    home_og_image,
    jobs_og_image,
    articles_og_image,
    default_job_og_image,
    default_article_og_image,
    robots_txt,
    auto_generate_sitemap
FROM admin_settings
ORDER BY created_at DESC
LIMIT 1;
```

#### 3. Get Advertisement Settings
```sql
-- File: pages/api/public/advertisements.ts
SELECT 
    sidebar_archive_ad_code,
    sidebar_single_ad_code, 
    single_top_ad_code,
    single_bottom_ad_code,
    single_middle_ad_code,
    popup_ad_url,
    popup_ad_enabled,
    popup_ad_load_settings,
    popup_ad_max_executions,
    popup_ad_device
FROM admin_settings
ORDER BY created_at DESC
LIMIT 1;
```

### User Profile Queries

#### 4. Get User Profile by ID
```sql
-- File: pages/api/user/profile.ts
SELECT * FROM profiles
WHERE id = $1;  -- user.id from auth
```

#### 5. Get User Role
```sql
-- File: pages/api/user/role.ts
SELECT role FROM profiles
WHERE id = $1;  -- user.id from auth
```

#### 6. Check if User is Super Admin
```sql
-- File: src/services/adminSettingsApiService.ts
SELECT role FROM profiles
WHERE id = $1  -- user.id
LIMIT 1;
```

### User Bookmarks Queries

#### 7. Get User Bookmarks
```sql
-- File: pages/api/user/bookmarks.ts
SELECT * FROM user_bookmarks
WHERE user_id = $1  -- authenticated user id
ORDER BY created_at DESC;
```

#### 8. Check if Job is Bookmarked
```sql
-- File: src/services/userBookmarkService.ts
SELECT EXISTS(
    SELECT 1 FROM user_bookmarks
    WHERE user_id = $1 AND job_id = $2
) AS is_bookmarked;
```

#### 9. Get Bookmark Count for User
```sql
-- File: src/services/userBookmarkService.ts
SELECT COUNT(*) FROM user_bookmarks
WHERE user_id = $1;
```

### Article Queries

#### 10. Get All Articles with Filters
```sql
-- File: src/services/cmsArticleService.ts
SELECT 
    a.*,
    p.id AS author_id, p.full_name AS author_name, p.email AS author_email,
    array_agg(DISTINCT jsonb_build_object(
        'id', ac.id,
        'name', ac.name,
        'slug', ac.slug,
        'description', ac.description
    )) FILTER (WHERE ac.id IS NOT NULL) AS categories,
    array_agg(DISTINCT jsonb_build_object(
        'id', at.id,
        'name', at.name,
        'slug', at.slug
    )) FILTER (WHERE at.id IS NOT NULL) AS tags
FROM nxdb_articles a
LEFT JOIN profiles p ON a.author_id = p.id
LEFT JOIN nxdb_article_category_relations acr ON a.id = acr.article_id
LEFT JOIN nxdb_article_categories ac ON acr.category_id = ac.id
LEFT JOIN nxdb_article_tag_relations atr ON a.id = atr.article_id
LEFT JOIN nxdb_article_tags at ON atr.tag_id = at.id
WHERE 
    ($1::TEXT IS NULL OR a.status = $1)  -- status filter
    AND ($2::TEXT IS NULL OR a.title ILIKE $2 OR a.content ILIKE $2)  -- search filter
    AND ($3::UUID IS NULL OR a.author_id = $3)  -- author filter
GROUP BY a.id, p.id
ORDER BY a.updated_at DESC
LIMIT $4 OFFSET $5;  -- pagination
```

#### 11. Get Article Count
```sql
-- File: src/services/cmsArticleService.ts
SELECT COUNT(*) FROM nxdb_articles
WHERE ($1::TEXT IS NULL OR status = $1);
```

#### 12. Get Single Article by ID
```sql
-- File: src/services/cmsArticleService.ts
SELECT 
    a.*,
    p.id AS author_id, p.full_name AS author_name, p.email AS author_email,
    array_agg(DISTINCT jsonb_build_object(
        'id', ac.id,
        'name', ac.name,
        'slug', ac.slug,
        'description', ac.description
    )) FILTER (WHERE ac.id IS NOT NULL) AS categories,
    array_agg(DISTINCT jsonb_build_object(
        'id', at.id,
        'name', at.name,
        'slug', at.slug
    )) FILTER (WHERE at.id IS NOT NULL) AS tags
FROM nxdb_articles a
LEFT JOIN profiles p ON a.author_id = p.id
LEFT JOIN nxdb_article_category_relations acr ON a.id = acr.article_id
LEFT JOIN nxdb_article_categories ac ON acr.category_id = ac.id
LEFT JOIN nxdb_article_tag_relations atr ON a.id = atr.article_id
LEFT JOIN nxdb_article_tags at ON atr.tag_id = at.id
WHERE a.id = $1
GROUP BY a.id, p.id;
```

#### 13. Get Single Article by Slug
```sql
-- File: src/services/cmsArticleService.ts
SELECT 
    a.*,
    p.id AS author_id, p.full_name AS author_name, p.email AS author_email,
    array_agg(DISTINCT jsonb_build_object(
        'id', ac.id,
        'name', ac.name,
        'slug', ac.slug,
        'description', ac.description
    )) FILTER (WHERE ac.id IS NOT NULL) AS categories,
    array_agg(DISTINCT jsonb_build_object(
        'id', at.id,
        'name', at.name,
        'slug', at.slug
    )) FILTER (WHERE at.id IS NOT NULL) AS tags
FROM nxdb_articles a
LEFT JOIN profiles p ON a.author_id = p.id
LEFT JOIN nxdb_article_category_relations acr ON a.id = acr.article_id
LEFT JOIN nxdb_article_categories ac ON acr.category_id = ac.id
LEFT JOIN nxdb_article_tag_relations atr ON a.id = atr.article_id
LEFT JOIN nxdb_article_tags at ON atr.tag_id = at.id
WHERE a.slug = $1
GROUP BY a.id, p.id;
```

#### 14. Get All Article Categories
```sql
-- File: src/services/cmsArticleService.ts
SELECT * FROM nxdb_article_categories
ORDER BY name ASC;
```

#### 15. Get Article Category by Slug
```sql
-- File: src/services/cmsArticleService.ts
SELECT * FROM nxdb_article_categories
WHERE slug = $1
LIMIT 1;
```

#### 16. Get All Article Tags
```sql
-- File: src/services/cmsArticleService.ts
SELECT * FROM nxdb_article_tags
ORDER BY name ASC;
```

#### 17. Get Article Tag by Slug
```sql
-- File: src/services/cmsArticleService.ts
SELECT * FROM nxdb_article_tags
WHERE slug = $1
LIMIT 1;
```

#### 18. Get Article Statistics
```sql
-- File: src/services/cmsArticleService.ts
SELECT 
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'published') AS published,
    COUNT(*) FILTER (WHERE status = 'draft') AS draft,
    COUNT(*) FILTER (WHERE status = 'trash') AS trash,
    COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled
FROM nxdb_articles;
```

### Page Queries (Similar to Articles)

#### 19. Get All Pages with Filters
```sql
-- File: src/services/cmsPageService.ts
SELECT 
    p.*,
    pr.id AS author_id, pr.full_name AS author_name, pr.email AS author_email,
    array_agg(DISTINCT jsonb_build_object(
        'id', pc.id,
        'name', pc.name,
        'slug', pc.slug,
        'description', pc.description
    )) FILTER (WHERE pc.id IS NOT NULL) AS categories,
    array_agg(DISTINCT jsonb_build_object(
        'id', pt.id,
        'name', pt.name,
        'slug', pt.slug
    )) FILTER (WHERE pt.id IS NOT NULL) AS tags
FROM nxdb_pages p
LEFT JOIN profiles pr ON p.author_id = pr.id
LEFT JOIN nxdb_page_category_relations pcr ON p.id = pcr.page_id
LEFT JOIN nxdb_page_categories pc ON pcr.category_id = pc.id
LEFT JOIN nxdb_page_tag_relations ptr ON p.id = ptr.page_id
LEFT JOIN nxdb_page_tags pt ON ptr.tag_id = pt.id
WHERE 
    ($1::TEXT IS NULL OR p.status = $1)
    AND ($2::TEXT IS NULL OR p.title ILIKE $2 OR p.content ILIKE $2)
    AND ($3::UUID IS NULL OR p.author_id = $3)
GROUP BY p.id, pr.id
ORDER BY p.updated_at DESC
LIMIT $4 OFFSET $5;
```

#### 20-27. Similar queries for pages (by ID, by slug, categories, tags, statistics, etc.)

### Popup Template Queries

#### 28. Get Popup Template by Key
```sql
-- File: src/services/popupTemplateService.ts
SELECT * FROM popup_templates
WHERE template_key = $1
LIMIT 1;
```

#### 29. Get All Popup Templates
```sql
-- File: src/services/popupTemplateService.ts
SELECT * FROM popup_templates
ORDER BY created_at DESC;
```

### Media Queries

#### 30. Get User Media Files
```sql
-- File: src/components/admin/cms/MediaManager.tsx
SELECT * FROM nxdb_media
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

#### 31. Get Media Count for User
```sql
-- File: src/components/admin/cms/MediaManager.tsx
SELECT COUNT(*) FROM nxdb_media
WHERE user_id = $1;
```

---

## Stored Procedures / RPC Calls

### 1. Create Article with Relations
```sql
-- This is called via supabase.rpc('create_article_with_relations', {...})
-- You'll need to recreate this as a PostgreSQL function in Neon

CREATE OR REPLACE FUNCTION create_article_with_relations(
    article_data JSONB,
    category_ids UUID[],
    tag_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
    new_article_id UUID;
    cat_id UUID;
    tag_id UUID;
BEGIN
    -- Insert article
    INSERT INTO nxdb_articles (
        title, slug, content, excerpt, status, author_id,
        featured_image, seo_title, meta_description, schema_types,
        post_date, published_at
    ) VALUES (
        article_data->>'title',
        article_data->>'slug',
        article_data->>'content',
        article_data->>'excerpt',
        article_data->>'status',
        (article_data->>'author_id')::UUID,
        article_data->>'featured_image',
        article_data->>'seo_title',
        article_data->>'meta_description',
        ARRAY(SELECT jsonb_array_elements_text(article_data->'schema_types')),
        (article_data->>'post_date')::TIMESTAMPTZ,
        (article_data->>'published_at')::TIMESTAMPTZ
    )
    RETURNING id INTO new_article_id;
    
    -- Insert category relations
    IF category_ids IS NOT NULL THEN
        FOREACH cat_id IN ARRAY category_ids
        LOOP
            INSERT INTO nxdb_article_category_relations (article_id, category_id)
            VALUES (new_article_id, cat_id);
        END LOOP;
    END IF;
    
    -- Insert tag relations
    IF tag_ids IS NOT NULL THEN
        FOREACH tag_id IN ARRAY tag_ids
        LOOP
            INSERT INTO nxdb_article_tag_relations (article_id, tag_id)
            VALUES (new_article_id, tag_id);
        END LOOP;
    END IF;
    
    RETURN new_article_id;
END;
$$ LANGUAGE plpgsql;
```

### 2. Similar Function for Pages
```sql
CREATE OR REPLACE FUNCTION create_page_with_relations(
    page_data JSONB,
    category_ids UUID[],
    tag_ids UUID[]
)
RETURNS UUID AS $$
-- Similar implementation as above but for pages
$$;
```

---

## Triggers

### Auto-update `updated_at` Column
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON nxdb_articles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_categories_updated_at 
    BEFORE UPDATE ON nxdb_article_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_tags_updated_at 
    BEFORE UPDATE ON nxdb_article_tags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_popup_templates_updated_at
    BEFORE UPDATE ON popup_templates
    FOR EACH ROW EXECUTE FUNCTION update_popup_templates_updated_at();

CREATE TRIGGER handle_nxdb_media_updated_at
    BEFORE UPDATE ON nxdb_media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Repeat for all other tables with updated_at column
```

---

## Migration Checklist

### 1. **Database Migration**
- [ ] Export data from Supabase PostgreSQL
- [ ] Create Neon DB database
- [ ] Run all CREATE TABLE statements
- [ ] Run all CREATE INDEX statements
- [ ] Create all triggers and functions
- [ ] Import data from Supabase
- [ ] Verify data integrity

### 2. **Authentication Migration**
- [ ] Choose authentication provider (NextAuth.js, Auth0, Clerk, etc.)
- [ ] Migrate user data from Supabase Auth
- [ ] Update auth.uid() references in queries
- [ ] Replace RLS policies with application-level checks
- [ ] Implement role-based access control

### 3. **Code Changes**
- [ ] Replace Supabase client with PostgreSQL client (pg, Drizzle, Prisma)
- [ ] Convert all `supabase.from().select()` to SQL queries or ORM
- [ ] Update authentication checks
- [ ] Replace `auth.uid()` with your auth solution
- [ ] Update environment variables
- [ ] Test all queries

### 4. **Storage Migration**
- [ ] Choose file storage (AWS S3, Cloudflare R2, etc.)
- [ ] Migrate files from Supabase Storage
- [ ] Update file upload logic
- [ ] Update storage URLs

### 5. **Testing**
- [ ] Test all read queries
- [ ] Test authentication flows
- [ ] Test user bookmarks
- [ ] Test article CRUD operations
- [ ] Test media uploads
- [ ] Test admin settings

---

## Environment Variables for Neon DB

```env
# Replace Supabase with Neon DB
DATABASE_URL=postgresql://user:password@your-neon-project.neon.tech/dbname?sslmode=require

# Remove these Supabase variables:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY

# Add your new auth provider variables
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:5000
# ... other auth provider variables
```

---

## Summary

The application has **11 main tables** with the following relationships:
- **profiles**: User accounts
- **admin_settings**: Site configuration (1 row)
- **user_bookmarks**: User saved jobs
- **popup_templates**: Popup messages
- **nxdb_articles**: CMS articles
- **nxdb_article_categories**: Article taxonomy
- **nxdb_article_tags**: Article tags
- **nxdb_article_category_relations**: Many-to-many junction
- **nxdb_article_tag_relations**: Many-to-many junction
- **nxdb_pages**: CMS pages (similar structure to articles)
- **nxdb_media**: File uploads

**Total SELECT Queries**: ~30+ different query patterns
**Stored Procedures**: 2 (create_article_with_relations, create_page_with_relations)
**Triggers**: 10+ for auto-updating timestamps

All queries use standard PostgreSQL syntax and should work with Neon DB without modification (except for Supabase-specific features like RLS and auth.uid()).
