
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'PUT'].includes(req.method || '')) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient();

    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the session token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid session token' });
    }

    if (req.method === 'GET') {
      // Get user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return res.status(500).json({ error: 'Failed to fetch user profile' });
      }

      if (!profile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      // Return profile data
      res.status(200).json({
        success: true,
        data: profile
      });
    } else if (req.method === 'PUT') {
      // Update user profile
      const profileData = req.body;

      // Remove sensitive fields that shouldn't be updated through this endpoint
      const allowedFields = [
        'full_name', 'phone', 'birth_date', 'gender', 
        'location', 'photo_url', 'bio'
      ];

      const updateData: any = {};
      for (const field of allowedFields) {
        if (profileData[field] !== undefined) {
          updateData[field] = profileData[field];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        return res.status(500).json({ error: 'Failed to update user profile' });
      }

      res.status(200).json({
        success: true,
        data: updatedProfile
      });
    }

  } catch (error) {
    console.error('Error in user profile API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
