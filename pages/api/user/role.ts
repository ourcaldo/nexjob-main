
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // Get user role only
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user role:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user role' });
    }

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Return role data
    res.status(200).json({
      success: true,
      data: {
        role: profile.role,
        is_super_admin: profile.role === 'super_admin'
      }
    });

  } catch (error) {
    console.error('Error in user role API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
