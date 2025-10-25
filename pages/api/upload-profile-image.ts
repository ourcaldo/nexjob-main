import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase';
import { supabaseStorageService } from '@/services/supabaseStorageService';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient();
    
    // Get user from request
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse form data
    const form = formidable({
      maxFileSize: 1 * 1024 * 1024, // 1MB
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read file
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // Create File object
    const uploadFile = new File([fileBuffer], file.originalFilename || 'profile.jpg', {
      type: file.mimetype || 'image/jpeg',
    });

    // Upload to Supabase Storage
    const result = await supabaseStorageService.uploadProfileImage(user.id, uploadFile);
    
    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photo_url: result.url })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ message: 'Failed to update profile' });
    }

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    res.status(200).json({ 
      success: true, 
      url: result.url 
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Upload failed' 
    });
  }
}