/*
  # Add User Bookmarks and Popup Templates

  1. New Tables
    - `user_bookmarks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `job_id` (text, job identifier)
      - `created_at` (timestamp)
    - `popup_templates`
      - `id` (uuid, primary key)
      - `template_key` (text, unique)
      - `title` (text)
      - `content` (text)
      - `button_text` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for user access to their own bookmarks
    - Add policies for admin access to popup templates

  3. Changes
    - Add default popup template for bookmark login prompt
*/

-- Create user_bookmarks table
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Create popup_templates table
CREATE TABLE IF NOT EXISTS popup_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  button_text text NOT NULL DEFAULT 'OK',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE popup_templates ENABLE ROW LEVEL SECURITY;

-- Policies for user_bookmarks
CREATE POLICY "Users can read own bookmarks"
  ON user_bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON user_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON user_bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for popup_templates
CREATE POLICY "Public can read popup templates"
  ON popup_templates
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Super admins can manage popup templates"
  ON popup_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- Insert default popup template
INSERT INTO popup_templates (template_key, title, content, button_text)
VALUES (
  'bookmark_login_prompt',
  'Daftar/Login Nexjob untuk Menyimpan Pekerjaan',
  'Untuk menyimpan lowongan kerja favorit Anda, silakan daftar atau login terlebih dahulu. Dengan akun Nexjob, Anda dapat menyimpan dan mengelola lowongan yang menarik.',
  'Daftar/Login Sekarang'
) ON CONFLICT (template_key) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_popup_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_popup_templates_updated_at
  BEFORE UPDATE ON popup_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_popup_templates_updated_at();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_job_id ON user_bookmarks(job_id);
CREATE INDEX IF NOT EXISTS idx_popup_templates_key ON popup_templates(template_key);