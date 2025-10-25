import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/database';
import { validateSessionToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Validate the session token
    const { user, error: authError } = await validateSessionToken(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid session token' });
    }

    // Get user role from database
    const result = await query(
      'SELECT role FROM profiles WHERE id = $1',
      [user.id]
    );

    const profile = result.rows[0];

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        role: profile.role,
        is_super_admin: profile.role === 'super_admin'
      }
    });
  } catch (error) {
    console.error('Error in user role API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
