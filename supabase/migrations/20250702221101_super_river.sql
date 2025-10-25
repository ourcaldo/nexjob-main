/*
  # Add Public Read Access to Admin Settings

  1. Security Changes
    - Add RLS policy to allow public read access to admin_settings table
    - This enables public users to fetch site configuration (title, description, etc.)
    - Maintains security by only allowing read operations for public users
    - Write operations still require super admin authentication

  2. Important Notes
    - Public users can only SELECT from admin_settings
    - INSERT, UPDATE, DELETE still require super admin privileges
    - This fixes the 406 error when fetching site settings on frontend
*/

-- Add policy to allow public read access to admin_settings
CREATE POLICY "Allow public read access to admin settings"
  ON admin_settings
  FOR SELECT
  TO anon
  USING (true);

-- Also allow authenticated users (non-super-admins) to read settings
CREATE POLICY "Allow authenticated users to read admin settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (true);