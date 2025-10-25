import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient();

  try {
    // Get user from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'No authorization token provided' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    if (req.method === 'GET') {
      // Get user bookmarks
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user bookmarks:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch bookmarks' });
      }

      return res.status(200).json({ success: true, data: data || [] });
    }

    if (req.method === 'POST') {
      // Add bookmark
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({ success: false, error: 'Job ID is required' });
      }

      const { error } = await supabase
        .from('user_bookmarks')
        .insert({
          user_id: user.id,
          job_id: jobId
        });

      if (error) {
        console.error('Error adding bookmark:', error);
        return res.status(500).json({ success: false, error: 'Failed to add bookmark' });
      }

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      // Remove bookmark
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({ success: false, error: 'Job ID is required' });
      }

      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('job_id', jobId);

      if (error) {
        console.error('Error removing bookmark:', error);
        return res.status(500).json({ success: false, error: 'Failed to remove bookmark' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in bookmark API:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}