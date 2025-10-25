import { GetServerSideProps } from 'next';
import { sitemapService } from '@/services/sitemapService';
import { supabaseAdminService } from '@/services/supabaseAdminService';

const SitemapXml = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    // Generate main sitemap index with ISR-like caching
    const sitemap = await sitemapService.generateMainSitemapIndex();

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'); // ISR-like caching
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error('Error generating main sitemap:', error);
    res.statusCode = 500;
    res.end('Error generating main sitemap');
  }

  return { props: {} };
};

export default SitemapXml;