export interface PublicSettings {
  site_title?: string;
  site_tagline?: string;
  site_description?: string;
  site_url?: string;
  // SEO Templates
  location_page_title_template?: string;
  location_page_description_template?: string;
  category_page_title_template?: string;
  category_page_description_template?: string;
  // Archive Page SEO
  jobs_title?: string;
  jobs_description?: string;
  articles_title?: string;
  articles_description?: string;
  // Auth Pages SEO
  login_page_title?: string;
  login_page_description?: string;
  signup_page_title?: string;
  signup_page_description?: string;
  profile_page_title?: string;
  profile_page_description?: string;
  // SEO Images
  home_og_image?: string;
  jobs_og_image?: string;
  articles_og_image?: string;
  default_job_og_image?: string;
  default_article_og_image?: string;
  // Public sitemap settings only
  auto_generate_sitemap?: boolean;
  robots_txt?: string;
}

class PublicSettingsApiService {
  private baseUrl = '/api/public';
  private cache: { data: PublicSettings | null; timestamp: number } | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes for public settings

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp < this.CACHE_TTL;
  }

  async getSettings(forceRefresh: boolean = false): Promise<PublicSettings | null> {
    try {
      // Use cache if valid and not forcing refresh
      if (!forceRefresh && this.isCacheValid() && this.cache) {
        console.log('Using cached public settings');
        return this.cache.data;
      }

      console.log('Fetching fresh public settings from API');

      const response = await fetch(`${this.baseUrl}/settings/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch public settings:', response.status, response.statusText);
        return null;
      }

      const result = await response.json();

      // Update cache
      this.cache = {
        data: result.data,
        timestamp: Date.now()
      };

      return result.data;
    } catch (error) {
      console.error('Error fetching public settings:', error);
      return null;
    }
  }

  // Clear cache (useful after admin updates)
  clearCache(): void {
    this.cache = null;
    console.log('Public settings cache cleared');
  }
}

export const publicSettingsApiService = new PublicSettingsApiService();