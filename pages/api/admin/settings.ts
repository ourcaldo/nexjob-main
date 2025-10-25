import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/database';
import { validateSessionToken, isSuperAdmin } from '@/lib/auth';
import type { AdminSettings } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authentication check
  const authResult = await checkAuthentication(req);
  if (!authResult.success) {
    return res.status(401).json({ error: authResult.error });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(res);
      case 'POST':
      case 'PUT':
        return handleUpdate(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin settings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(res: NextApiResponse) {
  try {
    const result = await query(
      `SELECT * FROM admin_settings 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    const data = result.rows[0] || null;

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Error in handleGet:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

async function handleUpdate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings data' });
    }

    // Get existing settings
    const existingResult = await query(
      `SELECT id FROM admin_settings 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    const existingSettings = existingResult.rows[0];

    let result;
    if (existingSettings?.id) {
      // Update existing settings
      const keys = Object.keys(settings);
      const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = Object.values(settings);

      result = await query(
        `UPDATE admin_settings 
         SET ${setClause}, updated_at = NOW() 
         WHERE id = $${keys.length + 1} 
         RETURNING *`,
        [...values, existingSettings.id]
      );
    } else {
      // Insert new settings
      const keys = Object.keys(settings);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(settings);

      result = await query(
        `INSERT INTO admin_settings (${keys.join(', ')}, created_at, updated_at)
         VALUES (${placeholders}, NOW(), NOW())
         RETURNING *`,
        values
      );
    }

    if (!result.rows[0]) {
      return res.status(500).json({ error: 'Failed to save settings' });
    }

    return res.status(200).json({ data: result.rows[0], success: true });
  } catch (error) {
    console.error('Error in handleUpdate:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
}

// Authentication check function
async function checkAuthentication(req: NextApiRequest): Promise<{ success: boolean; error?: string }> {
  // Method 1: Check for API token in headers
  const apiToken = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-api-token'];
  const validToken = process.env.API_TOKEN;

  if (apiToken && validToken && apiToken === validToken) {
    return { success: true };
  }

  // Method 2: Check for session token and verify super admin role
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (sessionToken && sessionToken !== validToken) {
    try {
      // Validate the session token
      const { user, error: authError } = await validateSessionToken(sessionToken);
      
      if (authError || !user) {
        return { success: false, error: 'Invalid session token' };
      }

      // Check if user is super admin
      const isAdmin = await isSuperAdmin(user.id);

      if (!isAdmin) {
        return { success: false, error: 'Unauthorized: Super admin access required' };
      }

      return { success: true };
    } catch (error) {
      console.error('Session validation error:', error);
      return { success: false, error: 'Session validation failed' };
    }
  }

  return { success: false, error: 'Unauthorized: Valid API token or super admin session required' };
}
