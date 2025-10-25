import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await sql`
      SELECT 
        sidebar_archive_ad_code,
        sidebar_single_ad_code, 
        single_top_ad_code,
        single_bottom_ad_code,
        single_middle_ad_code,
        popup_ad_url,
        popup_ad_enabled,
        popup_ad_load_settings,
        popup_ad_max_executions,
        popup_ad_device
      FROM admin_settings 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const data = result[0] || {};

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Public advertisements API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
