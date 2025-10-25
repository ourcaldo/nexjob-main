export interface AdvertisementConfig {
  // Other ad types remain the same
  sidebar_archive_ad_code?: string;
  sidebar_single_ad_code?: string;
  single_top_ad_code?: string;
  single_bottom_ad_code?: string;
  single_middle_ad_code?: string;

  // New popup ad configuration
  popup_ad_url?: string;
  popup_ad_enabled?: boolean;
  popup_ad_load_settings?: string[];
  popup_ad_max_executions?: number;
  popup_ad_device?: string;
}

class AdvertisementService {
  private adConfig: AdvertisementConfig | null = null;
  private configLoaded = false;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
  private cacheTimestamp = 0;

  private isCacheValid(): boolean {
    return this.configLoaded && this.adConfig !== null && (Date.now() - this.cacheTimestamp < this.CACHE_TTL);
  }

  async loadAdConfig(): Promise<AdvertisementConfig> {
    if (this.isCacheValid()) {
      return this.adConfig!;
    }

    try {
      console.log('Fetching advertisement config from public API');
      
      const response = await fetch('/api/public/advertisements/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch advertisement config:', response.status);
        return {};
      }

      const result = await response.json();
      const settings = result.data || {};

      this.adConfig = {
        sidebar_archive_ad_code: settings?.sidebar_archive_ad_code || '',
        sidebar_single_ad_code: settings?.sidebar_single_ad_code || '',
        single_top_ad_code: settings?.single_top_ad_code || '',
        single_bottom_ad_code: settings?.single_bottom_ad_code || '',
        single_middle_ad_code: settings?.single_middle_ad_code || '',

        // New popup ad settings
        popup_ad_url: settings?.popup_ad_url || '',
        popup_ad_enabled: settings?.popup_ad_enabled || false,
        popup_ad_load_settings: settings?.popup_ad_load_settings || ['all_pages'],
        popup_ad_max_executions: settings?.popup_ad_max_executions || 1,
        popup_ad_device: settings?.popup_ad_device || 'all'
      };
      
      this.configLoaded = true;
      this.cacheTimestamp = Date.now();
      return this.adConfig;
    } catch (error) {
      console.error('Error loading advertisement config:', error);
      return {};
    }
  }

  async getAdCode(position: 'sidebar_archive_ad_code' | 'sidebar_single_ad_code' | 'single_top_ad_code' | 'single_bottom_ad_code' | 'single_middle_ad_code'): Promise<string> {
    const config = await this.loadAdConfig();
    return config[position] || '';
  }

  async getPopupAdConfig(): Promise<{
    url: string;
    enabled: boolean;
    loadSettings: string[];
    maxExecutions: number;
    device: string;
  }> {
    const config = await this.loadAdConfig();
    return {
      url: config.popup_ad_url || '',
      enabled: config.popup_ad_enabled || false,
      loadSettings: config.popup_ad_load_settings || ['all_pages'],
      maxExecutions: config.popup_ad_max_executions || 1,
      device: config.popup_ad_device || 'all'
    };
  }

  // Clear cache when settings are updated
  clearCache(): void {
    this.adConfig = null;
    this.configLoaded = false;
  }

  // Force refresh of ad config
  async refreshConfig(): Promise<AdvertisementConfig> {
    this.clearCache();
    return await this.loadAdConfig();
  }

  // Insert ad in content at H2 tags (for middle ads)
  insertMiddleAd(content: string, adCode: string): string {
    if (!adCode || !content) return content;

    // Find H2 tags in content
    const h2Regex = /<h2[^>]*>/gi;
    const matches = [...content.matchAll(h2Regex)];

    if (matches.length === 0) return content;

    // Insert ad before the middle H2 tag
    const middleIndex = Math.floor(matches.length / 2);
    const middleH2Match = matches[middleIndex];

    if (middleH2Match && middleH2Match.index !== undefined) {
      const beforeMiddleH2 = content.substring(0, middleH2Match.index);
      const afterMiddleH2 = content.substring(middleH2Match.index);

      const adHtml = `
        <div class="advertisement-middle my-6">
          <div class="text-xs text-gray-500 mb-2 text-center">Advertisement</div>
          ${adCode}
        </div>
      `;

      return beforeMiddleH2 + adHtml + afterMiddleH2;
    }

    return content;
  }
}

export const advertisementService = new AdvertisementService();