import { GetServerSideProps } from 'next';
import { sitemapService } from '@/services/sitemapService';

const SitemapArtikelPage = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res, query }) => {
  let { page } = query;
  
  // Handle .xml extension in the page parameter (from rewrite)
  if (typeof page === 'string' && page.endsWith('.xml')) {
    page = page.replace('.xml', '');
  }

  const pageNumber = parseInt(page as string, 10);

  if (isNaN(pageNumber) || pageNumber < 1) {
    res.statusCode = 400;
    res.end('Invalid page number');
    return { props: {} };
  }

  try {
    // Try to get cached chunk data first (ISR-like behavior)
    let articlesForPage = await sitemapService.getCachedArticleChunk(pageNumber);
    
    if (!articlesForPage) {
      console.log(`No cached chunk found for page ${pageNumber}, fetching fresh data...`);
      
      // Fallback: get all data and chunk it
      const { articles } = await sitemapService.getAllSitemapData();
      
      if (!articles || articles.length === 0) {
        res.statusCode = 404;
        res.end('No articles found');
        return { props: {} };
      }
      
      // Chunk articles and get the specific page
      const articleChunks = sitemapService.chunkArray(articles, 100);
      articlesForPage = articleChunks[pageNumber - 1];
    }

    if (!articlesForPage || articlesForPage.length === 0) {
      res.statusCode = 404;
      res.end('Page not found');
      return { props: {} };
    }

    console.log(`Generating sitemap for artikel page ${pageNumber} with ${articlesForPage.length} articles`);

    // Generate sitemap for this page with ISR-like caching
    const sitemap = await sitemapService.generateArticlesSitemap(articlesForPage, pageNumber);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'); // ISR-like caching
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error('Error generating artikel sitemap:', error);
    res.statusCode = 500;
    res.end('Error generating artikel sitemap');
  }

  return { props: {} };
};

export default SitemapArtikelPage;