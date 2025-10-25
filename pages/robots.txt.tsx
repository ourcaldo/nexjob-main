import { GetServerSideProps } from 'next';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import { getCurrentDomain } from '@/lib/env';

const RobotsTxt = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    let robotsTxt = '';
    
    try {
      // Get robots.txt content from database
      const settings = await SupabaseAdminService.getSettingsServerSide();
      robotsTxt = settings.robots_txt;
      console.log('Serving robots.txt from database');
    } catch (dbError) {
      console.error('Error fetching robots.txt from database:', dbError);
      
      // Fallback to default robots.txt content
      const baseUrl = getCurrentDomain();
      robotsTxt = `User-agent: *
Allow: /

# Disallow admin panel
Disallow: /admin/
Disallow: /admin

# Disallow bookmarks (private pages)
Disallow: /bookmarks/
Disallow: /bookmarks

# Allow specific important pages
Allow: /lowongan-kerja/
Allow: /artikel/

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml`;
      console.log('Using fallback robots.txt content');
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // 1 hour cache
    res.write(robotsTxt);
    res.end();
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.statusCode = 500;
    res.end('Error generating robots.txt');
  }

  return { props: {} };
};

export default RobotsTxt;