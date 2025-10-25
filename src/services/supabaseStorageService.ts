import { supabase } from '@/lib/supabase';

export interface UploadResponse {
  success: boolean;
  url?: string | null;
  error?: string;
}

class SupabaseStorageService {
  private bucketName = 'nexjob';

  // Upload file to Supabase Storage
  async uploadFile(
    file: File | Buffer, 
    path: string, 
    contentType?: string
  ): Promise<{ success: boolean; url?: string | null; error?: string }> {
    try {
      const buffer = file instanceof File ? await file.arrayBuffer() : file;
      const finalContentType = contentType || (file instanceof File ? file.type : 'application/octet-stream');

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(path, buffer, {
          contentType: finalContentType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading to Supabase Storage:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      return {
        success: true,
        url: publicUrlData.publicUrl
      };
    } catch (error) {
      console.error('Error uploading to Supabase Storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  // Delete file from Supabase Storage
  async deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        console.error('Error deleting from Supabase Storage:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting from Supabase Storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  // Upload user profile image
  async uploadProfileImage(
    userId: string, 
    file: File
  ): Promise<{ success: boolean; url?: string | null; error?: string }> {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
        };
      }

      // Validate file size (max 1MB)
      const maxSize = 1 * 1024 * 1024; // 1MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File size too large. Maximum size is 1MB.'
        };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const path = `profile/${userId}/${timestamp}.${extension}`;

      return await this.uploadFile(file, path, file.type);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  // Delete user profile image
  async deleteProfileImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Extract path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === this.bucketName);

      if (bucketIndex === -1) {
        return {
          success: false,
          error: 'Invalid image URL format'
        };
      }

      const path = pathParts.slice(bucketIndex + 1).join('/');
      return await this.deleteFile(path);
    } catch (error) {
      console.error('Error deleting profile image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  // Get public URL for a path
  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // Extract path from Supabase storage URL
  extractPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === this.bucketName);

      if (bucketIndex === -1) {
        return null;
      }

      return pathParts.slice(bucketIndex + 1).join('/');
    } catch (error) {
      console.error('Error extracting path from URL:', error);
      return null;
    }
  }
}

export const supabaseStorageService = new SupabaseStorageService();