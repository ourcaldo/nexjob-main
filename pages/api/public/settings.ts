import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await sql`
      SELECT 
        site_title,
        site_tagline, 
        site_description,
        site_url,
        location_page_title_template,
        location_page_description_template,
        category_page_title_template,
        category_page_description_template,
        jobs_title,
        jobs_description,
        articles_title,
        articles_description,
        login_page_title,
        login_page_description,
        signup_page_title,
        signup_page_description,
        profile_page_title,
        profile_page_description,
        home_og_image,
        jobs_og_image,
        articles_og_image,
        default_job_og_image,
        default_article_og_image,
        robots_txt,
        auto_generate_sitemap
      FROM admin_settings 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const data = result[0] || {};

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Public settings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
