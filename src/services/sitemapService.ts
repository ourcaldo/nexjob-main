import { supabaseAdminService } from './supabaseAdminService';
import { wpService } from './wpService';
import { cmsArticleService } from './cmsArticleService';
import { Job } from '@/types/job';
import { getCurrentDomain } from '@/lib/env';

interface SitemapItem {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

interface CachedSitemapData {
  jobs: Job[];
  articles: any[];
  jobPages: number;
  articlePages: number;
  timestamp: number;
}

class SitemapService {
  private readonly ITEMS_PER_SITEMAP = 100;
  private readonly CACHE_KEY_DATA = 'sitemap_all_data';

  // ISR-like cache for sitemap data
  private sitemapDataCache: CachedSitemapData | null = null;
  private sitemapXmlCache: Map<string, { xml: string; timestamp: number }> = new Map();

  // Check if sitemap data cache is valid based on admin settings
  private async isSitemapDataCacheValid(): Promise<boolean> {
    if (!this.sitemapDataCache) return false;

    try {
      const settings = await supabaseAdminService.getSettings();

      // Check if settings is defined before accessing its properties
      if (!settings) {
        console.warn('Settings not available for cache validation, assuming cache is invalid');
        return false;
      }

      const cacheAge = Date.now() - this.sitemapDataCache.timestamp;
      const maxAge = settings.sitemap_update_interval * 60 * 1000; // Convert minutes to milliseconds

      return cacheAge < maxAge;
    } catch (error) {
      console.error('Error checking sitemap cache validity:', error);
      return false;
    }
  }

  // Check if XML cache is valid
  private async isXmlCacheValid(key: string): Promise<boolean> {
    const cached = this.sitemapXmlCache.get(key);
    if (!cached) return false;

    try {
      const settings = await supabaseAdminService.getSettings();

      // Check if settings is defined before accessing its properties
      if (!settings) {
        console.warn('Settings not available for XML cache validation, assuming cache is invalid');
        return false;
      }

      const cacheAge = Date.now() - cached.timestamp;
      const maxAge = settings.sitemap_update_interval * 60 * 1000;

      return cacheAge < maxAge;
    } catch (error) {
      console.error('Error checking XML cache validity:', error);
      return false;
    }
  }

  // Generate main sitemap index with ISR-like caching
  async generateMainSitemapIndex(): Promise<string> {
    const cacheKey = 'main_index';

    // Check XML cache first
    if (await this.isXmlCacheValid(cacheKey)) {
      const cached = this.sitemapXmlCache.get(cacheKey);
      if (cached) {
        console.log('Using cached main sitemap index (ISR-like)');
        return cached.xml;
      }
    }

    console.log('Generating fresh main sitemap index');
    const baseUrl = getCurrentDomain();
    const lastmod = new Date().toISOString();

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-loker.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-artikel.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>`;

    // Cache the XML
    this.sitemapXmlCache.set(cacheKey, {
      xml: sitemapIndex,
      timestamp: Date.now()
    });

    return sitemapIndex;
  }

  // Generate loker directory sitemap with ISR-like caching
  async generateLokerDirectorySitemap(): Promise<string> {
    const cacheKey = 'loker_directory';

    // Check XML cache first
    if (await this.isXmlCacheValid(cacheKey)) {
      const cached = this.sitemapXmlCache.get(cacheKey);
      if (cached) {
        console.log('Using cached loker directory sitemap (ISR-like)');
        return cached.xml;
      }
    }

    console.log('Generating fresh loker directory sitemap');
    const baseUrl = getCurrentDomain();
    const lastmod = new Date().toISOString();

    // Get all data and cache it
    const { jobPages } = await this.getAllSitemapData();

    let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add individual loker sitemaps
    for (let i = 1; i <= jobPages; i++) {
      sitemapIndex += `
  <sitemap>
    <loc>${baseUrl}/sitemap-loker-${i}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`;
    }

    sitemapIndex += `
</sitemapindex>`;

    // Cache the XML
    this.sitemapXmlCache.set(cacheKey, {
      xml: sitemapIndex,
      timestamp: Date.now()
    });

    return sitemapIndex;
  }

  // Generate artikel directory sitemap with ISR-like caching
  async generateArtikelDirectorySitemap(): Promise<string> {
    const cacheKey = 'artikel_directory';

    // Check XML cache first
    if (await this.isXmlCacheValid(cacheKey)) {
      const cached = this.sitemapXmlCache.get(cacheKey);
      if (cached) {
        console.log('Using cached artikel directory sitemap (ISR-like)');
        return cached.xml;
      }
    }

    console.log('Generating fresh artikel directory sitemap');
    const baseUrl = getCurrentDomain();
    const lastmod = new Date().toISOString();

    // Get all data and cache it
    const { articlePages } = await this.getAllSitemapData();

    let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add individual artikel sitemaps
    for (let i = 1; i <= articlePages; i++) {
      sitemapIndex += `
  <sitemap>
    <loc>${baseUrl}/sitemap-artikel-${i}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`;
    }

    sitemapIndex += `
</sitemapindex>`;

    // Cache the XML
    this.sitemapXmlCache.set(cacheKey, {
      xml: sitemapIndex,
      timestamp: Date.now()
    });

    return sitemapIndex;
  }

  // Generate pages sitemap with ISR-like caching
  async generatePagesSitemap(): Promise<string> {
    const cacheKey = 'pages';

    // Check XML cache first
    if (await this.isXmlCacheValid(cacheKey)) {
      const cached = this.sitemapXmlCache.get(cacheKey);
      if (cached) {
        console.log('Using cached pages sitemap (ISR-like)');
        return cached.xml;
      }
    }

    console.log('Generating fresh pages sitemap');
    const baseUrl = getCurrentDomain();
    const lastmod = new Date().toISOString();

    // Static pages
    const pages: SitemapItem[] = [
      {
        url: `${baseUrl}/`,
        lastmod,
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        url: `${baseUrl}/lowongan-kerja/`,
        lastmod,
        changefreq: 'hourly',
        priority: '0.9'
      },
      {
        url: `${baseUrl}/artikel/`,
        lastmod,
        changefreq: 'daily',
        priority: '0.8'
      }
    ];

    // Add CMS pages
    try {
      const { pages: cmsPages } = await this.getCmsPages();
      
      // Add published CMS pages to sitemap
      cmsPages.forEach(page => {
        pages.push({
          url: `${baseUrl}/${page.slug}/`,
          lastmod: this.formatDateForSitemap(page.updated_at || page.post_date || new Date().toISOString()),
          changefreq: 'weekly',
          priority: '0.7'
        });
      });

      console.log(`Added ${cmsPages.length} CMS pages to sitemap`);
    } catch (error) {
      console.error('Error fetching CMS pages for sitemap:', error);
    }

    const xml = this.generateSitemapXml(pages);

    // Cache the XML
    this.sitemapXmlCache.set(cacheKey, {
      xml,
      timestamp: Date.now()
    });

    return xml;
  }

  // Generate jobs sitemap for specific page with ISR-like caching
  async generateJobsSitemap(jobs: Job[], page: number): Promise<string> {
    const cacheKey = `loker_${page}`;

    // Check XML cache first
    if (await this.isXmlCacheValid(cacheKey)) {
      const cached = this.sitemapXmlCache.get(cacheKey);
      if (cached) {
        console.log(`Using cached jobs sitemap page ${page} (ISR-like)`);
        return cached.xml;
      }
    }

    console.log(`Generating fresh jobs sitemap for page ${page}`);
    const baseUrl = getCurrentDomain();

    const sitemapItems: SitemapItem[] = jobs.map(job => ({
      url: `${baseUrl}/lowongan-kerja/${job.slug}/`,
      lastmod: this.formatDateForSitemap(job.created_at || new Date().toISOString()),
      changefreq: 'weekly',
      priority: '0.7'
    }));

    const xml = this.generateSitemapXml(sitemapItems);

    // Cache the XML
    this.sitemapXmlCache.set(cacheKey, {
      xml,
      timestamp: Date.now()
    });

    return xml;
  }

  // Generate articles sitemap for specific page with ISR-like caching
  async generateArticlesSitemap(articles: any[], page: number): Promise<string> {
    const cacheKey = `artikel_${page}`;

    // Check XML cache first
    if (await this.isXmlCacheValid(cacheKey)) {
      const cached = this.sitemapXmlCache.get(cacheKey);
      if (cached) {
        console.log(`Using cached articles sitemap page ${page} (ISR-like)`);
        return cached.xml;
      }
    }

    console.log(`Generating fresh articles sitemap for page ${page}`);
    const baseUrl = getCurrentDomain();

    const sitemapItems: SitemapItem[] = articles.map(article => {
      const categorySlug = article.category || 'uncategorized';
      return {
        url: `${baseUrl}/artikel/${categorySlug}/${article.slug}/`,
        lastmod: this.formatDateForSitemap(article.modified || article.date || new Date().toISOString()),
        changefreq: 'monthly',
        priority: '0.6'
      };
    });

    const xml = this.generateSitemapXml(sitemapItems);

    // Cache the XML
    this.sitemapXmlCache.set(cacheKey, {
      xml,
      timestamp: Date.now()
    });

    return xml;
  }

  // Get cached chunk data for jobs with ISR-like behavior
  async getCachedJobChunk(pageNumber: number): Promise<Job[] | null> {
    try {
      // First check if we have cached data
      if (await this.isSitemapDataCacheValid() && this.sitemapDataCache) {
        const chunks = this.chunkArray(this.sitemapDataCache.jobs, this.ITEMS_PER_SITEMAP);
        const chunk = chunks[pageNumber - 1];
        if (chunk) {
          console.log(`Using cached job chunk for page ${pageNumber} (ISR-like)`);
          return chunk;
        }
      }

      console.log(`No cached job chunk found for page ${pageNumber}`);
      return null;
    } catch (error) {
      console.error('Error getting cached job chunk:', error);
      return null;
    }
  }

  // Get cached chunk data for articles with ISR-like behavior
  async getCachedArticleChunk(pageNumber: number): Promise<any[] | null> {
    try {
      // First check if we have cached data
      if (await this.isSitemapDataCacheValid() && this.sitemapDataCache) {
        const chunks = this.chunkArray(this.sitemapDataCache.articles, this.ITEMS_PER_SITEMAP);
        const chunk = chunks[pageNumber - 1];
        if (chunk) {
          console.log(`Using cached article chunk for page ${pageNumber} (ISR-like)`);
          return chunk;
        }
      }

      console.log(`No cached article chunk found for page ${pageNumber}`);
      return null;
    } catch (error) {
      console.error('Error getting cached article chunk:', error);
      return null;
    }
  }

  // Format date for sitemap (fix for invalid date error)
  private formatDateForSitemap(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If date is invalid, use current date
        return new Date().toISOString();
      }
      // Return ISO string which includes timezone
      return date.toISOString();
    } catch (error) {
      console.error('Error formatting date for sitemap:', error);
      return new Date().toISOString();
    }
  }

  // Generate sitemap XML from items array
  private generateSitemapXml(items: SitemapItem[]): string {
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    items.forEach(item => {
      sitemap += `
  <url>
    <loc>${this.escapeXml(item.url)}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    return sitemap;
  }

  // Escape XML special characters
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Get cached sitemap data or fetch fresh with ISR-like behavior
  async getAllSitemapData(): Promise<{
    jobs: Job[];
    articles: any[];
    jobPages: number;
    articlePages: number;
  }> {
    try {
      // Check if cached data is still valid
      if (await this.isSitemapDataCacheValid() && this.sitemapDataCache) {
        console.log(`Using cached sitemap data (ISR-like): ${this.sitemapDataCache.jobs.length} jobs, ${this.sitemapDataCache.articles.length} articles`);
        return {
          jobs: this.sitemapDataCache.jobs,
          articles: this.sitemapDataCache.articles,
          jobPages: this.sitemapDataCache.jobPages,
          articlePages: this.sitemapDataCache.articlePages
        };
      }

      // If no cache or cache expired, fetch fresh data
      console.log('Fetching fresh sitemap data (cache expired or not found)...');

      // Initialize wpService with current admin settings
      const settings = await supabaseAdminService.getSettings();

      // Check if settings is defined before accessing its properties
      if (!settings) {
        console.warn('Settings not available for sitemap data, using fallback configuration');
        // Return empty data as fallback
        return {
          jobs: [],
          articles: [],
          jobPages: 1,
          articlePages: 1
        };
      }

      wpService.setBaseUrl(settings.api_url);
      wpService.setFiltersApiUrl(settings.filters_api_url);
      wpService.setAuthToken(settings.auth_token || '');

      // Fetch data with better error handling and retries
      const [jobsResult, articlesResult] = await Promise.allSettled([
        this.fetchJobsWithRetry(),
        this.fetchArticlesWithRetry()
      ]);

      // Handle jobs result
      let finalJobs: Job[] = [];
      if (jobsResult.status === 'fulfilled') {
        finalJobs = jobsResult.value || [];
      } else {
        console.error('Error fetching jobs for sitemap:', jobsResult.reason);
        finalJobs = [];
      }

      // Handle articles result
      let finalArticles: any[] = [];
      if (articlesResult.status === 'fulfilled') {
        finalArticles = articlesResult.value || [];
      } else {
        console.error('Error fetching articles for sitemap:', articlesResult.reason);
        finalArticles = [];
      }

      // Calculate number of pages needed
      const jobPages = Math.max(1, Math.ceil(finalJobs.length / this.ITEMS_PER_SITEMAP));
      const articlePages = Math.max(1, Math.ceil(finalArticles.length / this.ITEMS_PER_SITEMAP));

      console.log(`Sitemap data: ${finalJobs.length} jobs (${jobPages} pages), ${finalArticles.length} articles (${articlePages} pages)`);

      // Cache the complete data with ISR-like behavior
      this.sitemapDataCache = {
        jobs: finalJobs,
        articles: finalArticles,
        jobPages,
        articlePages,
        timestamp: Date.now()
      };

      console.log('Sitemap data cached with ISR-like behavior');

      return {
        jobs: finalJobs,
        articles: finalArticles,
        jobPages,
        articlePages
      };
    } catch (error) {
      console.error('Error getting sitemap data:', error);
      return {
        jobs: [],
        articles: [],
        jobPages: 1,
        articlePages: 1
      };
    }
  }

  // Fetch jobs with retry logic for production reliability
  private async fetchJobsWithRetry(maxRetries: number = 3): Promise<Job[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const jobs = await wpService.getAllJobsForSitemap();
        return jobs;
      } catch (error) {
        console.error(`Attempt ${attempt} to fetch jobs failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return [];
  }

  // Fetch articles with retry logic for production reliability
  private async fetchArticlesWithRetry(maxRetries: number = 3): Promise<any[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { articles } = await this.getCmsArticles();
        return articles;
      } catch (error) {
        console.error(`Attempt ${attempt} to fetch articles failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return [];
  }

  // Clear all sitemap caches
  clearAllSitemapCaches(): void {
    try {
      this.sitemapDataCache = null;
      this.sitemapXmlCache.clear();
      console.log('Cleared all sitemap caches (ISR-like)');
    } catch (error) {
      console.error('Error clearing sitemap caches:', error);
    }
  }

  // Chunk array into smaller arrays
  chunkArray<T>(array: T[], chunkSize: number): T[][] {
    if (!array || array.length === 0) {
      return [];
    }

    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Check if sitemap should be regenerated based on settings
  async shouldRegenerateSitemap(): Promise<boolean> {
    try {
      const settings = await supabaseAdminService.getSettings();

      // Check if settings is defined before accessing its properties
      if (!settings) {
        console.warn('Settings not available for sitemap regeneration check, defaulting to regenerate');
        return true;
      }

      if (!settings.auto_generate_sitemap) {
        return false;
      }

      const lastUpdate = new Date(settings.last_sitemap_update);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

      return diffMinutes >= settings.sitemap_update_interval;
    } catch (error) {
      console.error('Error checking sitemap regeneration:', error);
      return true; // Default to regenerate on error
    }
  }

  // Legacy method for backward compatibility
  generateMainSitemap(jobSitemapCount: number, articleSitemapCount: number): string {
    // This is now async, but keeping for compatibility
    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${getCurrentDomain()}/sitemap-pages.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${getCurrentDomain()}/sitemap-loker.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${getCurrentDomain()}/sitemap-artikel.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;
  }

  // Get CMS articles for sitemap
  async getCmsArticles(): Promise<{ articles: any[] }> {
    try {
      const { articles } = await cmsArticleService.getPublishedArticles(10000, 0);

      return {
        articles: articles.map(article => ({
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          date: article.published_at || article.post_date,
          modified: article.updated_at,
          categories: article.categories || [],
          category: article.categories?.[0]?.slug || 'uncategorized'
        }))
      };
    } catch (error) {
      console.error('Error fetching CMS articles for sitemap:', error);
      return { articles: [] };
    }
  }

  // Get CMS pages for sitemap
  async getCmsPages(): Promise<{ pages: any[] }> {
    try {
      const { cmsPageService } = await import('./cmsPageService');
      const { pages } = await cmsPageService.getPages({
        status: 'published',
        limit: 10000,
        offset: 0
      });

      return {
        pages: pages.map(page => ({
          slug: page.slug,
          title: page.title,
          excerpt: page.excerpt,
          post_date: page.post_date,
          updated_at: page.updated_at,
          published_at: page.published_at
        }))
      };
    } catch (error) {
      console.error('Error fetching CMS pages for sitemap:', error);
      return { pages: [] };
    }
  }
}

export const sitemapService = new SitemapService();