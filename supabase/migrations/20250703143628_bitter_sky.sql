/*
  # Create Storage Policies for Profile Images

  1. Storage Policies
    - Allow authenticated users to upload profile images to their own folder
    - Allow authenticated users to view their own profile images
    - Allow public read access to profile images
    - Allow users to delete their own profile images

  2. Bucket Configuration
    - Ensure nexjob bucket exists with proper settings
*/

-- Create storage policies for the nexjob bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nexjob',
  'nexjob',
  true,
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policy: Allow authenticated users to upload files to their own profile folder
CREATE POLICY "Users can upload profile images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'nexjob' AND 
    (storage.foldername(name))[1] = 'profile' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policy: Allow users to view their own profile images
CREATE POLICY "Users can view own profile images" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'nexjob' AND 
    (storage.foldername(name))[1] = 'profile' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policy: Allow public read access to profile images (for displaying on site)
CREATE POLICY "Public can view profile images" ON storage.objects
  FOR SELECT TO public
  USING (
    bucket_id = 'nexjob' AND 
    (storage.foldername(name))[1] = 'profile'
  );

-- Policy: Allow users to update their own profile images
CREATE POLICY "Users can update own profile images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'nexjob' AND 
    (storage.foldername(name))[1] = 'profile' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policy: Allow users to delete their own profile images
CREATE POLICY "Users can delete own profile images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'nexjob' AND 
    (storage.foldername(name))[1] = 'profile' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );