/*
  # Add Missing SEO Columns to Admin Settings

  1. New Columns
    - `jobs_title` (text) - SEO title for jobs archive page
    - `jobs_description` (text) - SEO description for jobs archive page  
    - `articles_title` (text) - SEO title for articles archive page
    - `articles_description` (text) - SEO description for articles archive page

  2. Default Values
    - Set appropriate default values for existing records
    - Use template variables for dynamic content

  3. Update Existing Records
    - Add the missing columns to existing admin_settings records
*/

-- Add missing SEO columns for archive pages
DO $$
BEGIN
  -- Add jobs_title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'jobs_title'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN jobs_title text NOT NULL DEFAULT 'Lowongan Kerja Terbaru - {{site_title}}';
  END IF;

  -- Add jobs_description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'jobs_description'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN jobs_description text NOT NULL DEFAULT 'Temukan lowongan kerja terbaru dari berbagai perusahaan terpercaya. Dapatkan pekerjaan impian Anda dengan gaji terbaik.';
  END IF;

  -- Add articles_title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'articles_title'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN articles_title text NOT NULL DEFAULT 'Tips Karir & Panduan Kerja - {{site_title}}';
  END IF;

  -- Add articles_description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'articles_description'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN articles_description text NOT NULL DEFAULT 'Artikel dan panduan karir terbaru untuk membantu perjalanan karir Anda. Tips interview, CV, dan pengembangan karir.';
  END IF;
END $$;

-- Update existing records with proper values if they have default values
UPDATE admin_settings 
SET 
  jobs_title = CASE 
    WHEN jobs_title = 'Lowongan Kerja Terbaru - {{site_title}}' THEN 'Lowongan Kerja Terbaru - ' || site_title
    ELSE jobs_title 
  END,
  jobs_description = CASE 
    WHEN jobs_description = 'Temukan lowongan kerja terbaru dari berbagai perusahaan terpercaya. Dapatkan pekerjaan impian Anda dengan gaji terbaik.' THEN 'Temukan lowongan kerja terbaru dari berbagai perusahaan terpercaya. Dapatkan pekerjaan impian Anda dengan gaji terbaik di ' || site_title || '.'
    ELSE jobs_description 
  END,
  articles_title = CASE 
    WHEN articles_title = 'Tips Karir & Panduan Kerja - {{site_title}}' THEN 'Tips Karir & Panduan Kerja - ' || site_title
    ELSE articles_title 
  END,
  articles_description = CASE 
    WHEN articles_description = 'Artikel dan panduan karir terbaru untuk membantu perjalanan karir Anda. Tips interview, CV, dan pengembangan karir.' THEN 'Artikel dan panduan karir terbaru untuk membantu perjalanan karir Anda. Tips interview, CV, dan pengembangan karir dari ' || site_title || '.'
    ELSE articles_description 
  END,
  updated_at = now()
WHERE id IS NOT NULL;