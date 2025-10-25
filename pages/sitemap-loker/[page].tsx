import { GetServerSideProps } from 'next';
import { sitemapService } from '@/services/sitemapService';

const SitemapLokerPage = () => null;

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
    let jobsForPage = await sitemapService.getCachedJobChunk(pageNumber);
    
    if (!jobsForPage) {
      console.log(`No cached chunk found for page ${pageNumber}, fetching fresh data...`);
      
      // Fallback: get all data and chunk it
      const { jobs } = await sitemapService.getAllSitemapData();
      
      if (!jobs || jobs.length === 0) {
        res.statusCode = 404;
        res.end('No jobs found');
        return { props: {} };
      }
      
      // Chunk jobs and get the specific page
      const jobChunks = sitemapService.chunkArray(jobs, 100);
      jobsForPage = jobChunks[pageNumber - 1];
    }

    if (!jobsForPage || jobsForPage.length === 0) {
      res.statusCode = 404;
      res.end('Page not found');
      return { props: {} };
    }

    console.log(`Generating sitemap for loker page ${pageNumber} with ${jobsForPage.length} jobs`);

    // Generate sitemap for this page with ISR-like caching
    const sitemap = await sitemapService.generateJobsSitemap(jobsForPage, pageNumber);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'); // ISR-like caching
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error('Error generating loker sitemap:', error);
    res.statusCode = 500;
    res.end('Error generating loker sitemap');
  }

  return { props: {} };
};

export default SitemapLokerPage;