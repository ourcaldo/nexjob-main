import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/database';
import { validateSessionToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get user from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'No authorization token provided' });
    }

    // Validate token and get user
    const { user, error: authError } = await validateSessionToken(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    if (req.method === 'GET') {
      // Get user bookmarks
      const result = await query(
        `SELECT * FROM user_bookmarks 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [user.id]
      );

      return res.status(200).json({ success: true, data: result.rows || [] });
    }

    if (req.method === 'POST') {
      // Add bookmark
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({ success: false, error: 'Job ID is required' });
      }

      try {
        await query(
          `INSERT INTO user_bookmarks (user_id, job_id, created_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (user_id, job_id) DO NOTHING`,
          [user.id, jobId]
        );

        return res.status(200).json({ success: true });
      } catch (error: any) {
        console.error('Error adding bookmark:', error);
        return res.status(500).json({ success: false, error: 'Failed to add bookmark' });
      }
    }

    if (req.method === 'DELETE') {
      // Remove bookmark
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({ success: false, error: 'Job ID is required' });
      }

      try {
        await query(
          `DELETE FROM user_bookmarks 
           WHERE user_id = $1 AND job_id = $2`,
          [user.id, jobId]
        );

        return res.status(200).json({ success: true });
      } catch (error: any) {
        console.error('Error removing bookmark:', error);
        return res.status(500).json({ success: false, error: 'Failed to remove bookmark' });
      }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in bookmark API:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
