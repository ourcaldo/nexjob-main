import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { AdminSettings } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient();

  // Authentication check
  const authResult = await checkAuthentication(req, supabase);
  if (!authResult.success) {
    return res.status(401).json({ error: authResult.error });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(supabase, res);
      case 'POST':
      case 'PUT':
        return handleUpdate(supabase, req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin settings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(supabase: any, res: NextApiResponse) {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching admin settings:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }

    // If no settings found, return null (client will use defaults)
    if (!data || error?.code === 'PGRST116') {
      return res.status(200).json({ data: null });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Error in handleGet:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

async function handleUpdate(supabase: any, req: NextApiRequest, res: NextApiResponse) {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings data' });
    }

    // Get existing settings
    const { data: existingSettings } = await supabase
      .from('admin_settings')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let result;
    if (existingSettings?.id) {
      // Update existing settings
      result = await supabase
        .from('admin_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id)
        .select()
        .single();
    } else {
      // Insert new settings
      result = await supabase
        .from('admin_settings')
        .insert({
          ...settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving admin settings:', result.error);
      return res.status(500).json({ error: 'Failed to save settings' });
    }

    return res.status(200).json({ data: result.data, success: true });
  } catch (error) {
    console.error('Error in handleUpdate:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
}

// Authentication check function
async function checkAuthentication(req: NextApiRequest, supabase: any): Promise<{ success: boolean; error?: string }> {
  // Method 1: Check for API token in headers
  const apiToken = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-api-token'];
  const validToken = process.env.API_TOKEN;

  if (apiToken && validToken && apiToken === validToken) {
    return { success: true };
  }

  // Method 2: Check for Supabase session token and verify super admin role
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (sessionToken && sessionToken !== validToken) {
    try {
      // Verify the session token with Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken);
      
      if (authError || !user) {
        return { success: false, error: 'Invalid session token' };
      }

      // Check if user is super admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || profile.role !== 'super_admin') {
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