import { GetServerSideProps } from 'next';
import { sitemapService } from '@/services/sitemapService';

const SitemapArtikelXml = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    // Generate artikel directory sitemap with ISR-like caching
    const sitemap = await sitemapService.generateArtikelDirectorySitemap();

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'); // ISR-like caching
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error('Error generating artikel directory sitemap:', error);
    res.statusCode = 500;
    res.end('Error generating artikel directory sitemap');
  }

  return { props: {} };
};

export default SitemapArtikelXml;