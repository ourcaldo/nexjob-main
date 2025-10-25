/*
  # Update Admin Settings for Enhanced SEO

  1. Changes
    - Add SEO settings for auth pages (login, signup, profile)
    - Add API endpoint settings with full URLs
    - Update existing admin_settings table structure

  2. New Fields
    - login_page_title
    - login_page_description
    - signup_page_title
    - signup_page_description
    - profile_page_title
    - profile_page_description
    - wp_posts_api_url
    - wp_jobs_api_url
*/

-- Add new SEO fields for auth pages
DO $$
BEGIN
  -- Login page SEO
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'login_page_title'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN login_page_title text DEFAULT 'Login - {{site_title}}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'login_page_description'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN login_page_description text DEFAULT 'Masuk ke akun Nexjob Anda untuk mengakses fitur lengkap pencarian kerja dan menyimpan lowongan favorit.';
  END IF;

  -- Signup page SEO
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'signup_page_title'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN signup_page_title text DEFAULT 'Daftar Akun - {{site_title}}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'signup_page_description'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN signup_page_description text DEFAULT 'Daftar akun gratis di Nexjob untuk menyimpan lowongan favorit dan mendapatkan notifikasi pekerjaan terbaru.';
  END IF;

  -- Profile page SEO
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'profile_page_title'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN profile_page_title text DEFAULT 'Profil Saya - {{site_title}}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'profile_page_description'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN profile_page_description text DEFAULT 'Kelola profil dan preferensi akun Nexjob Anda.';
  END IF;

  -- API endpoint URLs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'wp_posts_api_url'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN wp_posts_api_url text DEFAULT 'https://cms.nexjob.tech/wp-json/wp/v2/posts';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'wp_jobs_api_url'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN wp_jobs_api_url text DEFAULT 'https://cms.nexjob.tech/wp-json/wp/v2/lowongan-kerja';
  END IF;
END $$;