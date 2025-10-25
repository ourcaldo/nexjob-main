import { Job } from '@/types/job';
import { supabaseAdminService } from './supabaseAdminService';
import { env } from '@/lib/env';

interface FilterData {
  nexjob_lokasi_provinsi: Record<string, string[]>;
  nexjob_kategori_pekerjaan: string[];
  nexjob_tipe_pekerjaan: string[];
  nexjob_pengalaman_kerja: string[];
  nexjob_pendidikan: string[];
  nexjob_kebijakan_kerja: string[];
  nexjob_industri: string[];
  nexjob_gaji: string[];
}

interface JobsResponse {
  jobs: Job[];
  totalPages: number;
  currentPage: number;
  totalJobs: number;
  hasMore: boolean;
}

class WordPressService {
  private baseUrl: string;
  private filtersApiUrl: string;
  private authToken: string;

  // Cache for filter data with ISR-like behavior (1 hour cache)
  private filterDataCache: { data: FilterData; timestamp: number } | null = null;
  private readonly FILTER_CACHE_TTL = parseInt(process.env.FILTER_CACHE_TTL || '3600000'); // 1 hour cache (as requested)

  constructor() {
    // Initialize with environment variables as fallback
    this.baseUrl = env.WP_API_URL;
    this.filtersApiUrl = env.WP_FILTERS_API_URL;
    this.authToken = env.WP_AUTH_TOKEN;

    // Try to get settings from admin service (browser only)
    if (typeof window !== 'undefined') {
      this.updateFromAdminSettings();
    }
  }

  private async updateFromAdminSettings() {
    try {
      const settings = await supabaseAdminService.getSettings();

      // Check if settings is defined before accessing its properties
      if (!settings) {
        console.warn('Settings not available, using environment variables');
        return;
      }

      this.baseUrl = settings.api_url || env.WP_API_URL;
      this.filtersApiUrl = settings.filters_api_url || env.WP_FILTERS_API_URL;
      this.authToken = settings.auth_token || env.WP_AUTH_TOKEN;
    } catch (error) {
      console.warn('Could not load admin settings, using environment variables');
    }
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  setFiltersApiUrl(url: string) {
    this.filtersApiUrl = url;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  // Get current settings (for server-side usage)
  getCurrentSettings() {
    return {
      baseUrl: this.baseUrl,
      filtersApiUrl: this.filtersApiUrl,
      authToken: this.authToken
    };
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private decodeHtmlEntities(text: string): string {
    if (typeof document === 'undefined') {
      // Server-side fallback
      return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }

    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  private stripHtmlTags(html: string): string {
    if (typeof document === 'undefined') {
      // Server-side fallback
      return html.replace(/<[^>]*>/g, '');
    }

    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  private getPreferredDescription(excerptRendered: string, rankMathDescription: string): string {
    // First try rank_math_description if it exists and is not empty
    if (rankMathDescription && rankMathDescription.trim() !== '') {
      return this.stripHtmlTags(this.decodeHtmlEntities(rankMathDescription));
    }

    // Fall back to excerpt if available
    if (excerptRendered && excerptRendered.trim() !== '') {
      return this.stripHtmlTags(this.decodeHtmlEntities(excerptRendered));
    }

    return '';
  }

  // Get featured image URL from WordPress _embed data
  private getFeaturedImageUrl(embedData: any): string | null {
    try {
      const featuredMedia = embedData?.['wp:featuredmedia']?.[0];
      if (!featuredMedia) return null;

      // Try to get the 'full' size first, then fallback to source_url
      const fullSize = featuredMedia.media_details?.sizes?.full?.source_url;
      if (fullSize) return fullSize;

      // Fallback to the main source_url
      return featuredMedia.source_url || null;
    } catch (error) {
      console.error('Error extracting featured image URL:', error);
      return null;
    }
  }

  private async fetchWithFallback(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error);
      throw error;
    }
  }

  private buildJobsUrl(filters: any = {}, page: number = 1, perPage: number = 24): string {
    const params = new URLSearchParams();

    // Basic parameters
    params.set('per_page', perPage.toString());
    params.set('page', page.toString());
    params.set('_embed', '');

    // Search parameter (WordPress built-in search)
    if (filters.search && filters.search.trim()) {
      params.set('search', filters.search.trim());
    }

    // Location filters
    if (filters.location && filters.location.trim()) {
      params.set('nexjob_lokasi_provinsi', filters.location.trim());
    }

    // City filters (multiple cities)
    if (filters.cities && filters.cities.length > 0) {
      // For multiple cities, we'll use the first one for now
      // WordPress might need custom handling for multiple values
      params.set('nexjob_lokasi_kota', filters.cities[0]);
    }

    // Category filters (multiple categories)
    if (filters.categories && filters.categories.length > 0) {
      params.set('nexjob_kategori_pekerjaan', filters.categories[0]);
    }

    // Job type filters (multiple job types)
    if (filters.jobTypes && filters.jobTypes.length > 0) {
      params.set('nexjob_tipe_pekerjaan', filters.jobTypes[0]);
    }

    // Experience filters (multiple experiences)
    if (filters.experiences && filters.experiences.length > 0) {
      params.set('nexjob_pengalaman_kerja', filters.experiences[0]);
    }

    // Education filters (multiple educations)
    if (filters.educations && filters.educations.length > 0) {
      params.set('nexjob_pendidikan', filters.educations[0]);
    }

    // Industry filters (multiple industries)
    if (filters.industries && filters.industries.length > 0) {
      params.set('nexjob_industri', filters.industries[0]);
    }

    // Work policy filters (multiple work policies)
    if (filters.workPolicies && filters.workPolicies.length > 0) {
      params.set('nexjob_kebijakan_kerja', filters.workPolicies[0]);
    }

    // Salary filters (multiple salary ranges)
    if (filters.salaries && filters.salaries.length > 0) {
      params.set('nexjob_gaji', filters.salaries[0]);
    }

    // Legacy single filters for backward compatibility
    if (filters.jobType) {
      params.set('nexjob_tipe_pekerjaan', filters.jobType);
    }

    if (filters.experience) {
      params.set('nexjob_pengalaman_kerja', filters.experience);
    }

    if (filters.education) {
      params.set('nexjob_pendidikan', filters.education);
    }

    if (filters.industry) {
      params.set('nexjob_industri', filters.industry);
    }

    if (filters.category) {
      params.set('nexjob_kategori_pekerjaan', filters.category);
    }

    if (filters.workPolicy) {
      params.set('nexjob_kebijakan_kerja', filters.workPolicy);
    }

    if (filters.salary) {
      params.set('nexjob_gaji', filters.salary);
    }

    // Sorting (WordPress orderby)
    if (filters.sortBy === 'newest') {
      params.set('orderby', 'date');
      params.set('order', 'desc');
    }

    return `${this.baseUrl}/lowongan-kerja?${params.toString()}`;
  }

  // Check if filter cache is valid (ISR-like behavior with 1 hour cache)
  private isFilterCacheValid(): boolean {
    if (!this.filterDataCache) return false;
    return Date.now() - this.filterDataCache.timestamp < this.FILTER_CACHE_TTL;
  }

  // Get filter data with ISR-like caching (1 hour revalidation)
  async getFiltersData(): Promise<FilterData> {
    try {
      // Use cache if valid (ISR-like behavior with 1 hour cache)
      if (this.isFilterCacheValid() && this.filterDataCache) {
        console.log('Using cached filter data (ISR-like, 1 hour cache)');
        return this.filterDataCache.data;
      }

      console.log('Fetching fresh filter data (cache expired or not found)');
      const response = await this.fetchWithFallback(this.filtersApiUrl);
      const data = await response.json();

      // Decode HTML entities in filter data
      const decodedData: FilterData = {
        nexjob_lokasi_provinsi: {},
        nexjob_kategori_pekerjaan: [],
        nexjob_tipe_pekerjaan: [],
        nexjob_pengalaman_kerja: [],
        nexjob_pendidikan: [],
        nexjob_kebijakan_kerja: [],
        nexjob_industri: [],
        nexjob_gaji: []
      };

      // Decode location data
      if (data.nexjob_lokasi_provinsi) {
        Object.keys(data.nexjob_lokasi_provinsi).forEach(province => {
          const decodedProvince = this.decodeHtmlEntities(province);
          decodedData.nexjob_lokasi_provinsi[decodedProvince] = 
            data.nexjob_lokasi_provinsi[province].map((city: string) => this.decodeHtmlEntities(city));
        });
      }

      // Decode other filter arrays
      const filterKeys: (keyof Omit<FilterData, 'nexjob_lokasi_provinsi'>)[] = [
        'nexjob_kategori_pekerjaan',
        'nexjob_tipe_pekerjaan', 
        'nexjob_pengalaman_kerja',
        'nexjob_pendidikan',
        'nexjob_kebijakan_kerja',
        'nexjob_industri',
        'nexjob_gaji'
      ];

      filterKeys.forEach(key => {
        if (data[key] && Array.isArray(data[key])) {
          decodedData[key] = data[key].map((item: string) => this.decodeHtmlEntities(item));
        }
      });

      // Update cache with 1 hour TTL
      this.filterDataCache = {
        data: decodedData,
        timestamp: Date.now()
      };

      console.log('Filter data cached for 1 hour (ISR-like behavior)');
      return decodedData;
    } catch (error) {
      console.error('Error fetching filters data:', error);

      // Return cached data if available, otherwise fallback
      if (this.filterDataCache) {
        console.log('Returning cached filter data due to error');
        return this.filterDataCache.data;
      }

      // Return fallback data
      return this.getFallbackFiltersData();
    }
  }

  // Clear filter cache
  clearFilterCache(): void {
    this.filterDataCache = null;
    console.log('Filter cache cleared');
  }

  private getFallbackFiltersData(): FilterData {
    return {
      nexjob_lokasi_provinsi: {
        'DKI Jakarta': ['Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Utara', 'Jakarta Timur'],
        'Jawa Barat': ['Bandung', 'Bekasi', 'Bogor', 'Depok', 'Tangerang'],
        'Jawa Timur': ['Surabaya', 'Malang', 'Kediri', 'Sidoarjo'],
        'Jawa Tengah': ['Semarang', 'Solo', 'Yogyakarta'],
        'Bali': ['Denpasar', 'Ubud', 'Sanur'],
        'Sumatera Utara': ['Medan', 'Binjai']
      },
      nexjob_kategori_pekerjaan: [
        'Teknologi Informasi',
        'Digital Marketing',
        'Customer Service',
        'Human Resources',
        'Sales',
        'Akuntansi',
        'Healthcare',
        'Pendidikan',
        'Logistik'
      ],
      nexjob_tipe_pekerjaan: [
        'Full Time',
        'Part Time',
        'Contract',
        'Freelance',
        'Internship'
      ],
      nexjob_pengalaman_kerja: [
        'Fresh Graduate',
        '1-2 Tahun',
        '2-3 Tahun',
        '3-5 Tahun',
        '5+ Tahun'
      ],
      nexjob_pendidikan: [
        'SMA/SMK',
        'D3',
        'S1',
        'S2'
      ],
      nexjob_kebijakan_kerja: [
        'On-site Working',
        'Remote Working',
        'Hybrid Working'
      ],
      nexjob_industri: [
        'Teknologi Informasi',
        'Perbankan',
        'Healthcare',
        'Pendidikan',
        'E-commerce',
        'Otomotif',
        'Digital Marketing',
        'Human Resources',
        'Customer Service',
        'Sales',
        'Logistik',
        'Akuntansi'
      ],
      nexjob_gaji: [
        'Di bawah 5 Juta',
        '5-10 Juta',
        '10-15 Juta',
        '15-20 Juta',
        'Di atas 20 Juta'
      ]
    };
  }

  async testConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.fetchWithFallback(`${this.baseUrl}/lowongan-kerja?per_page=1`);
      const data = await response.json();
      return { success: true, data: data[0] || null };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async testFiltersConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.fetchWithFallback(this.filtersApiUrl);
      const data = await response.json();
      return { success: true, data: data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getJobsByIds(jobIds: string[]): Promise<Job[]> {
    if (jobIds.length === 0) return [];

    try {
      const settings = await supabaseAdminService.getSettings();
      if (!settings) {
        throw new Error('Settings not available');
      }

      const promises = jobIds.map(async (jobId) => {
        const response = await fetch(`${settings.api_url}/lowongan-kerja/${jobId}?_embed`, {
          headers: {
            'Authorization': `Bearer ${settings.auth_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn(`Failed to fetch job ${jobId}: ${response.status}`);
          return null;
        }

        const data = await response.json();
        return this.transformJobData(data);
      });

      const results = await Promise.allSettled(promises);
      return results
        .filter((result): result is PromiseFulfilledResult<Job> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);
    } catch (error) {
      console.error('Error fetching jobs by IDs:', error);
      return [];
    }
  }

  private async transformJobData(wpJob: any): Promise<Job> {
        const meta = wpJob.meta || {};

        return {
          id: wpJob.id.toString(),
          slug: wpJob.slug,
          title: this.decodeHtmlEntities(wpJob.title.rendered),
          content: wpJob.content.rendered,
          company_name: this.decodeHtmlEntities(meta.nexjob_nama_perusahaan || 'Perusahaan'),
          kategori_pekerjaan: this.decodeHtmlEntities(meta.nexjob_kategori_pekerjaan || ''),
          lokasi_provinsi: this.decodeHtmlEntities(meta.nexjob_lokasi_provinsi || ''),
          lokasi_kota: this.decodeHtmlEntities(meta.nexjob_lokasi_kota || ''),
          tipe_pekerjaan: this.decodeHtmlEntities(meta.nexjob_tipe_pekerjaan || 'Full Time'),
          pendidikan: this.decodeHtmlEntities(meta.nexjob_pendidikan || ''),
          industry: this.decodeHtmlEntities(meta.nexjob_industri || ''),
          pengalaman: this.decodeHtmlEntities(meta.nexjob_pengalaman_kerja || ''),
          tag: this.decodeHtmlEntities(meta.nexjob_tag_loker || ''),
          gender: this.decodeHtmlEntities(meta.nexjob_gender || ''),
          gaji: this.decodeHtmlEntities(meta.nexjob_gaji || 'Negosiasi'),
          kebijakan_kerja: this.decodeHtmlEntities(meta.nexjob_kebijakan_kerja || ''),
          link: meta.nexjob_link_loker || wpJob.link,
          sumber_lowongan: this.decodeHtmlEntities(meta.nexjob_sumber_loker || 'Nexjob'),
          created_at: wpJob.date,
          seo_title: this.decodeHtmlEntities(meta.rank_math_title || wpJob.title.rendered),
          seo_description: this.getPreferredDescription(wpJob.excerpt?.rendered || '', meta.rank_math_description || ''),
          _id: { $oid: wpJob.id.toString() },
          id_obj: { $numberInt: wpJob.id.toString() }
        };
  }

  async getJobs(filters?: any, page: number = 1, perPage: number = 24): Promise<JobsResponse> {
    try {
      const url = this.buildJobsUrl(filters, page, perPage);
      console.log('Fetching jobs from URL:', url); // Debug log

      const response = await this.fetchWithFallback(url);
      const wpJobs = await response.json();

      // Get total pages and total jobs from headers (these are now filtered totals)
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
      const totalJobs = parseInt(response.headers.get('X-WP-Total') || '0');

      // Transform WordPress data to our Job interface
      const jobs: Job[] = wpJobs.map((wpJob: any) => {
        // Extract meta fields with nexjob_ prefix
        const meta = wpJob.meta || {};

        return {
          id: wpJob.id.toString(),
          slug: wpJob.slug,
          title: this.decodeHtmlEntities(wpJob.title.rendered),
          content: wpJob.content.rendered,
          company_name: this.decodeHtmlEntities(meta.nexjob_nama_perusahaan || 'Perusahaan'),
          kategori_pekerjaan: this.decodeHtmlEntities(meta.nexjob_kategori_pekerjaan || ''),
          lokasi_provinsi: this.decodeHtmlEntities(meta.nexjob_lokasi_provinsi || ''),
          lokasi_kota: this.decodeHtmlEntities(meta.nexjob_lokasi_kota || ''),
          tipe_pekerjaan: this.decodeHtmlEntities(meta.nexjob_tipe_pekerjaan || 'Full Time'),
          pendidikan: this.decodeHtmlEntities(meta.nexjob_pendidikan || ''),
          industry: this.decodeHtmlEntities(meta.nexjob_industri || ''),
          pengalaman: this.decodeHtmlEntities(meta.nexjob_pengalaman_kerja || ''),
          tag: this.decodeHtmlEntities(meta.nexjob_tag_loker || ''),
          gender: this.decodeHtmlEntities(meta.nexjob_gender || ''),
          gaji: this.decodeHtmlEntities(meta.nexjob_gaji || 'Negosiasi'),
          kebijakan_kerja: this.decodeHtmlEntities(meta.nexjob_kebijakan_kerja || ''),
          link: meta.nexjob_link_loker || wpJob.link,
          sumber_lowongan: this.decodeHtmlEntities(meta.nexjob_sumber_loker || 'Nexjob'),
          created_at: wpJob.date,
          seo_title: this.decodeHtmlEntities(meta.rank_math_title || wpJob.title.rendered),
          seo_description: this.getPreferredDescription(wpJob.excerpt?.rendered || '', meta.rank_math_description || ''),
          _id: { $oid: wpJob.id.toString() },
          id_obj: { $numberInt: wpJob.id.toString() }
        };
      });

      return {
        jobs,
        totalPages,
        currentPage: page,
        totalJobs, // This is now the filtered total from WordPress
        hasMore: page < totalPages
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Return mock data as fallback
      const mockJobs = this.getMockJobs(filters);
      return {
        jobs: mockJobs,
        totalPages: 1,
        currentPage: 1,
        totalJobs: mockJobs.length,
        hasMore: false
      };
    }
  }

  // Legacy method for backward compatibility
  async getAllJobs(filters?: any): Promise<Job[]> {
    const response = await this.getJobs(filters, 1, 100);
    return response.jobs;
  }

  // Method to get ALL jobs for sitemap generation with proper error handling
  async getAllJobsForSitemap(): Promise<Job[]> {
    try {
      const allJobs: Job[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        try {
          const response = await this.getJobs({}, page, 100);

          if (response.jobs.length === 0) {
            hasMore = false;
          } else {
            allJobs.push(...response.jobs);
            hasMore = response.hasMore && page < response.totalPages;
            page++;
          }
        } catch (error) {
          console.error(`Error fetching jobs page ${page}:`, error);
          // Stop pagination on error to prevent infinite loops
          hasMore = false;
        }
      }

      return allJobs;
    } catch (error) {
      console.error('Error fetching all jobs for sitemap:', error);
      return [];
    }
  }

  async getJobBySlug(slug: string): Promise<Job | null> {
    try {
      const response = await this.fetchWithFallback(`${this.baseUrl}/lowongan-kerja?slug=${slug}&_embed`);
      const wpJobs = await response.json();

      if (!wpJobs || wpJobs.length === 0) {
        return null;
      }

      const wpJob = wpJobs[0];
      const meta = wpJob.meta || {};

      return {
        id: wpJob.id.toString(),
        slug: wpJob.slug,
        title: this.decodeHtmlEntities(wpJob.title.rendered),
        content: wpJob.content.rendered,
        company_name: this.decodeHtmlEntities(meta.nexjob_nama_perusahaan || 'Perusahaan'),
        kategori_pekerjaan: this.decodeHtmlEntities(meta.nexjob_kategori_pekerjaan || ''),
        lokasi_provinsi: this.decodeHtmlEntities(meta.nexjob_lokasi_provinsi || ''),
        lokasi_kota: this.decodeHtmlEntities(meta.nexjob_lokasi_kota || ''),
        tipe_pekerjaan: this.decodeHtmlEntities(meta.nexjob_tipe_pekerjaan || 'Full Time'),
        pendidikan: this.decodeHtmlEntities(meta.nexjob_pendidikan || ''),
        industry: this.decodeHtmlEntities(meta.nexjob_industri || ''),
        pengalaman: this.decodeHtmlEntities(meta.nexjob_pengalaman_kerja || ''),
        tag: this.decodeHtmlEntities(meta.nexjob_tag_loker || ''),
        gender: this.decodeHtmlEntities(meta.nexjob_gender || ''),
        gaji: this.decodeHtmlEntities(meta.nexjob_gaji || 'Negosiasi'),
        kebijakan_kerja: this.decodeHtmlEntities(meta.nexjob_kebijakan_kerja || ''),
        link: meta.nexjob_link_loker || wpJob.link,
        sumber_lowongan: this.decodeHtmlEntities(meta.nexjob_sumber_loker || 'Nexjob'),
        created_at: wpJob.date,
        seo_title: this.decodeHtmlEntities(meta.rank_math_title || wpJob.title.rendered),
        seo_description: this.getPreferredDescription(wpJob.excerpt?.rendered || '', meta.rank_math_description || ''),
        _id: { $oid: wpJob.id.toString() },
        id_obj: { $numberInt: wpJob.id.toString() }
      };
    } catch (error) {
      console.error('Error fetching job:', error);
      return null;
    }
  }

  async getJobById(id: string): Promise<Job | null> {
    try {
      const response = await this.fetchWithFallback(`${this.baseUrl}/lowongan-kerja/${id}?_embed`);
      const wpJob = await response.json();
      const meta = wpJob.meta || {};

      return {
        id: wpJob.id.toString(),
        slug: wpJob.slug,
        title: this.decodeHtmlEntities(wpJob.title.rendered),
        content: wpJob.content.rendered,
        company_name: this.decodeHtmlEntities(meta.nexjob_nama_perusahaan || 'Perusahaan'),
        kategori_pekerjaan: this.decodeHtmlEntities(meta.nexjob_kategori_pekerjaan || ''),
        lokasi_provinsi: this.decodeHtmlEntities(meta.nexjob_lokasi_provinsi || ''),
        lokasi_kota: this.decodeHtmlEntities(meta.nexjob_lokasi_kota || ''),
        tipe_pekerjaan: this.decodeHtmlEntities(meta.nexjob_tipe_pekerjaan || 'Full Time'),
        pendidikan: this.decodeHtmlEntities(meta.nexjob_pendidikan || ''),
        industry: this.decodeHtmlEntities(meta.nexjob_industri || ''),
        pengalaman: this.decodeHtmlEntities(meta.nexjob_pengalaman_kerja || ''),
        tag: this.decodeHtmlEntities(meta.nexjob_tag_loker || ''),
        gender: this.decodeHtmlEntities(meta.nexjob_gender || ''),
        gaji: this.decodeHtmlEntities(meta.nexjob_gaji || 'Negosiasi'),
        kebijakan_kerja: this.decodeHtmlEntities(meta.nexjob_kebijakan_kerja || ''),
        link: meta.nexjob_link_loker || wpJob.link,
        sumber_lowongan: this.decodeHtmlEntities(meta.nexjob_sumber_loker || 'Nexjob'),
        created_at: wpJob.date,
        seo_title: this.decodeHtmlEntities(meta.rank_math_title || wpJob.title.rendered),
        seo_description: this.getPreferredDescription(wpJob.excerpt?.rendered || '', meta.rank_math_description || ''),
        _id: { $oid: wpJob.id.toString() },
        id_obj: { $numberInt: wpJob.id.toString() }
      };
    } catch (error) {
      console.error('Error fetching job:', error);
      return null;
    }
  }

  async getRelatedJobs(currentJobId: string, category: string, limit: number = 4): Promise<Job[]> {
    try {
      // Use WordPress filtering for related jobs
      const filters = {
        categories: [category]
      };
      const response = await this.getJobs(filters, 1, limit + 5); // Get a few extra to filter out current job
      return response.jobs
        .filter(job => job.id !== currentJobId)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching related jobs:', error);
      return [];
    }
  }

  async getArticles(limit?: number): Promise<any[]> {
    try {
      let url = `${this.baseUrl}/posts?_embed`;
      if (limit) {
        url += `&per_page=${limit}`;
      }

      const response = await this.fetchWithFallback(url);
      const articles = await response.json();

      // Add featured image URL and author info if available
      return articles.map((article: any) => ({
        ...article,
        title: {
          ...article.title,
          rendered: this.decodeHtmlEntities(article.title.rendered)
        },
        excerpt: {
          ...article.excerpt,
          rendered: this.decodeHtmlEntities(article.excerpt.rendered)
        },
        featured_media_url: this.getFeaturedImageUrl(article._embedded),
        author_info: article._embedded?.author?.[0] || null,
        categories_info: article._embedded?.['wp:term']?.[0]?.map((cat: any) => ({
          ...cat,
          name: this.decodeHtmlEntities(cat.name)
        })) || [],
        tags_info: article._embedded?.['wp:term']?.[1]?.map((tag: any) => ({
          ...tag,
          name: this.decodeHtmlEntities(tag.name)
        })) || [],
        seo_title: this.decodeHtmlEntities(article.meta?.rank_math_title || article.title.rendered),
        seo_description: this.getPreferredDescription(article.excerpt?.rendered || '', article.meta?.rank_math_description || '')
      }));
    } catch (error) {
      console.error('Error fetching articles:', error);
      return this.getMockArticles();
    }
  }

  // Method to get ALL articles for sitemap generation with proper error handling
  async getAllArticlesForSitemap(): Promise<any[]> {
    try {
      const allArticles: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        try {
          const url = `${this.baseUrl}/posts?_embed&per_page=100&page=${page}`;
          const response = await this.fetchWithFallback(url);
          const articles = await response.json();

          if (!articles || articles.length === 0) {
            hasMore = false;
          } else {
            const processedArticles = articles.map((article: any) => ({
              ...article,
              title: {
                ...article.title,
                rendered: this.decodeHtmlEntities(article.title.rendered)
              },
              excerpt: {
                ...article.excerpt,
                rendered: this.decodeHtmlEntities(article.excerpt.rendered)
              },
              featured_media_url: this.getFeaturedImageUrl(article._embedded),
              author_info: article._embedded?.author?.[0] || null,
              categories_info: article._embedded?.['wp:term']?.[0]?.map((cat: any) => ({
                ...cat,
                name: this.decodeHtmlEntities(cat.name)
              })) || [],
              tags_info: article._embedded?.['wp:term']?.[1]?.map((tag: any) => ({
                ...tag,
                name: this.decodeHtmlEntities(tag.name)
              })) || [],
              seo_title: this.decodeHtmlEntities(article.meta?.rank_math_title || article.title.rendered),
              seo_description: this.getPreferredDescription(article.excerpt?.rendered || '', article.meta?.rank_math_description || '')
            }));

            allArticles.push(...processedArticles);

            // Check if we got less than requested, which means we're at the end
            if (articles.length < 100) {
              hasMore = false;
            } else {
              page++;
            }
          }
        } catch (error) {
          console.error(`Error fetching articles page ${page}:`, error);
          // Stop pagination on error to prevent infinite loops
          hasMore = false;
        }
      }

      return allArticles;
    } catch (error) {
      console.error('Error fetching all articles for sitemap:', error);
      return [];
    }
  }

  async getArticleBySlug(slug: string): Promise<any | null> {
    try {
      const response = await this.fetchWithFallback(`${this.baseUrl}/posts?slug=${slug}&_embed`);
      const articles = await response.json();

      if (!articles || articles.length === 0) {
        return null;
      }

      const article = articles[0];
      return {
        ...article,
        title: {
          ...article.title,
          rendered: this.decodeHtmlEntities(article.title.rendered)
        },
        excerpt: {
          ...article.excerpt,
          rendered: this.decodeHtmlEntities(article.excerpt.rendered)
        },
        featured_media_url: this.getFeaturedImageUrl(article._embedded),
        author_info: article._embedded?.author?.[0] || null,
        categories_info: article._embedded?.['wp:term']?.[0]?.map((cat: any) => ({
          ...cat,
          name: this.decodeHtmlEntities(cat.name)
        })) || [],
        tags_info: article._embedded?.['wp:term']?.[1]?.map((tag: any) => ({
          ...tag,
          name: this.decodeHtmlEntities(tag.name)
        })) || [],
        seo_title: this.decodeHtmlEntities(article.meta?.rank_math_title || article.title.rendered),
        seo_description: this.getPreferredDescription(article.excerpt?.rendered || '', article.meta.rank_math_description || '')
      };
    } catch (error) {
      console.error('Error fetching article:', error);
      return null;
    }
  }

  async getArticleById(id: string): Promise<any | null> {
    try {
      const response = await this.fetchWithFallback(`${this.baseUrl}/posts/${id}?_embed`);
      const article = await response.json();

      return {
        ...article,
        title: {
          ...article.title,
          rendered: this.decodeHtmlEntities(article.title.rendered)
        },
        excerpt: {
          ...article.excerpt,
          rendered: this.decodeHtmlEntities(article.excerpt.rendered)
        },
        featured_media_url: this.getFeaturedImageUrl(article._embedded),
        author_info: article._embedded?.author?.[0] || null,
        categories_info: article._embedded?.['wp:term']?.[0]?.map((cat: any) => ({
          ...cat,
          name: this.decodeHtmlEntities(cat.name)
        })) || [],
        tags_info: article._embedded?.['wp:term']?.[1]?.map((tag: any) => ({
          ...tag,
          name: this.decodeHtmlEntities(tag.name)
        })) || [],
        seo_title: this.decodeHtmlEntities(article.meta?.rank_math_title || article.title.rendered),
        seo_description: this.getPreferredDescription(article.excerpt?.rendered || '', article.meta?.rank_math_description || '')
      };
    } catch (error) {
      console.error('Error fetching article:', error);
      return null;
    }
  }

  async getRelatedArticles(currentArticleId: string, limit: number = 3): Promise<any[]> {
    try {
      const articles = await this.getArticles();
      return articles
        .filter(article => article.id.toString() !== currentArticleId)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching related articles:', error);
      return [];
    }
  }

  private getMockJobs(filters?: any): Job[] {
    // Fallback mock data
    const mockJobs: Job[] = [
      {
        id: '1',
        slug: 'frontend-developer-react-js',
        title: 'Frontend Developer React.js',
        content: '<p>Kami mencari Frontend Developer yang berpengalaman dengan React.js</p>',
        company_name: 'PT. Teknologi Digital Indonesia',
        kategori_pekerjaan: 'Software Engineer',
        lokasi_provinsi: 'DKI Jakarta',
        lokasi_kota: 'Jakarta Selatan',
        tipe_pekerjaan: 'Full Time',
        pendidikan: 'S1',
        industry: 'Teknologi Informasi',
        pengalaman: '2-4 Tahun',
        tag: 'React.js, Frontend Developer, JavaScript, TypeScript',
        gender: 'Laki-Laki atau Perempuan',
        gaji: 'Rp 8-12 Juta',
        kebijakan_kerja: 'Hybrid Working',
        link: '#',
        sumber_lowongan: 'Nexjob',
        created_at: new Date().toISOString(),
        seo_title: 'Frontend Developer React.js',
        seo_description: 'Lowongan Frontend Developer React.js di Jakarta',
        _id: { $oid: '1' },
        id_obj: { $numberInt: '1' }
      }
    ];

    return mockJobs;
  }

  private getMockArticles(): any[] {
    return [
      {
        id: 1,
        slug: 'tips-interview-kerja',
        title: {
          rendered: 'Tips Sukses Interview Kerja'
        },
        excerpt: {
          rendered: 'Panduan lengkap untuk mempersiapkan diri menghadapi interview kerja dan meningkatkan peluang diterima.'
        },
        content: {
          rendered: '<p>Artikel lengkap tentang tips interview kerja...</p>'
        },
        date: new Date().toISOString(),
        featured_media_url: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg',
        author_info: {
          name: 'Admin Nexjob',
          display_name: 'Admin Nexjob'
        },
        categories_info: [
          { name: 'Tips Karir' }
        ],
        tags_info: [
          { name: 'Interview' },
          { name: 'Karir' }
        ],
        seo_title: 'Tips Sukses Interview Kerja',
        seo_description: 'Panduan lengkap untuk mempersiapkan diri menghadapi interview kerja dan meningkatkan peluang diterima.'
      }
    ];
  }
}

// Export both the class and a singleton instance
export { WordPressService };
export const wpService = new WordPressService();
export type { FilterData, JobsResponse };