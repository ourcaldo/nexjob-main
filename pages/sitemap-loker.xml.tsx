import { GetServerSideProps } from 'next';
import { sitemapService } from '@/services/sitemapService';

const SitemapLokerXml = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res, query }) => {
  try {
    // Generate loker directory sitemap with ISR-like caching
    const sitemap = await sitemapService.generateLokerDirectorySitemap();

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'); // ISR-like caching
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error('Error generating loker directory sitemap:', error);
    res.statusCode = 500;
    res.end('Error generating loker directory sitemap');
  }

  return { props: {} };
};

export default SitemapLokerXml;