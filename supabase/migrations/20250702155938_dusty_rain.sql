/*
  # Update admin settings schema

  1. Schema Changes
    - Add site_tagline column
    - Add dynamic SEO template columns for location and category pages
    - Remove old separate title/description columns
    - Keep existing SEO images in the same table

  2. Data Migration
    - Preserve existing data where possible
    - Set default values for new columns

  3. Security
    - Maintain existing RLS policies
*/

-- Add new columns to admin_settings table
DO $$
BEGIN
  -- Add site_tagline if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'site_tagline'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN site_tagline text DEFAULT 'Find Your Dream Job';
  END IF;

  -- Add location page title template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'location_page_title_template'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN location_page_title_template text DEFAULT 'Lowongan Kerja di {{lokasi}} - {{site_title}}';
  END IF;

  -- Add location page description template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'location_page_description_template'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN location_page_description_template text DEFAULT 'Temukan lowongan kerja terbaru di {{lokasi}}. Dapatkan pekerjaan impian Anda dengan gaji terbaik di {{site_title}}.';
  END IF;

  -- Add category page title template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'category_page_title_template'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN category_page_title_template text DEFAULT 'Lowongan Kerja {{kategori}} - {{site_title}}';
  END IF;

  -- Add category page description template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'category_page_description_template'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN category_page_description_template text DEFAULT 'Temukan lowongan kerja {{kategori}} terbaru. Dapatkan pekerjaan impian Anda dengan gaji terbaik di {{site_title}}.';
  END IF;
END $$;

-- Remove old columns that are no longer needed (if they exist)
DO $$
BEGIN
  -- Remove home_title if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'home_title'
  ) THEN
    ALTER TABLE admin_settings DROP COLUMN home_title;
  END IF;

  -- Remove home_description if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'home_description'
  ) THEN
    ALTER TABLE admin_settings DROP COLUMN home_description;
  END IF;

  -- Remove jobs_title if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'jobs_title'
  ) THEN
    ALTER TABLE admin_settings DROP COLUMN jobs_title;
  END IF;

  -- Remove jobs_description if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'jobs_description'
  ) THEN
    ALTER TABLE admin_settings DROP COLUMN jobs_description;
  END IF;

  -- Remove articles_title if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'articles_title'
  ) THEN
    ALTER TABLE admin_settings DROP COLUMN articles_title;
  END IF;

  -- Remove articles_description if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'articles_description'
  ) THEN
    ALTER TABLE admin_settings DROP COLUMN articles_description;
  END IF;
END $$;