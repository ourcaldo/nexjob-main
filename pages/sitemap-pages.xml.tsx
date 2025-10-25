import { GetServerSideProps } from 'next';
import { sitemapService } from '@/services/sitemapService';

const SitemapPagesXml = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    // Generate pages sitemap with ISR-like caching
    const sitemap = await sitemapService.generatePagesSitemap();

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'); // ISR-like caching
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error('Error generating pages sitemap:', error);
    res.statusCode = 500;
    res.end('Error generating pages sitemap');
  }

  return { props: {} };
};

export default SitemapPagesXml;