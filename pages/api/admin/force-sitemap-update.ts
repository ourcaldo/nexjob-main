import { NextApiRequest, NextApiResponse } from 'next';
import { adminService } from '@/services/adminService';
import { sitemapService } from '@/services/sitemapService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Clear all sitemap cache
    adminService.clearSitemapCache();
    sitemapService.clearAllSitemapCaches();
    
    // Update last generation timestamp
    adminService.updateLastSitemapGeneration();

    // Make requests to all sitemap endpoints to regenerate them (using new URLs)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const regeneratePromises = [
      fetch(`${baseUrl}/sitemap.xml?force=true`),
      fetch(`${baseUrl}/sitemap-pages.xml?force=true`),
      fetch(`${baseUrl}/sitemap-loker.xml?force=true`),
      fetch(`${baseUrl}/sitemap-artikel.xml?force=true`)
    ];

    // Wait for main sitemaps to regenerate first
    const results = await Promise.allSettled(regeneratePromises);
    
    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to regenerate sitemap ${index}:`, result.reason);
      }
    });

    res.status(200).json({ 
      message: 'Sitemap update forced successfully',
      timestamp: new Date().toISOString(),
      regenerated: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    });
  } catch (error) {
    console.error('Error forcing sitemap update:', error);
    res.status(500).json({ message: 'Error forcing sitemap update' });
  }
}