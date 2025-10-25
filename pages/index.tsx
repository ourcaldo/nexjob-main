import { GetStaticProps } from 'next';
import Head from 'next/head';
import { WordPressService, FilterData } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import { getCurrentDomain } from '@/lib/env';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import HomePage from '@/components/pages/HomePage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateWebsiteSchema, generateOrganizationSchema } from '@/utils/schemaUtils';
import { renderTemplate } from '@/utils/templateUtils';

interface HomePageProps {
  articles: any[];
  filterData: FilterData | null;
  settings: any;
}

export default function Home({ articles, filterData, settings }: HomePageProps) {
  const currentUrl = getCurrentDomain();

  // Prepare template variables
  const templateVars = {
    site_title: settings?.site_title || 'Nexjob',
    site_tagline: settings?.site_tagline || 'Find Your Dream Job',
    lokasi: '',
    kategori: ''
  };

  // Get SEO settings with template rendering
  const rawSeoTitle = settings?.site_title ? `${settings.site_title} - ${settings.site_tagline || 'Find Your Dream Job'}` : 'Nexjob - Find Your Dream Job';
  const rawSeoDescription = settings?.site_description || 'Platform pencarian kerja terpercaya di Indonesia. Temukan lowongan kerja terbaru dari berbagai perusahaan terkemuka.';

  const pageTitle = renderTemplate(rawSeoTitle, templateVars);
  const pageDescription = renderTemplate(rawSeoDescription, templateVars);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${currentUrl}/`} />
        <meta property="og:image" content={settings.home_og_image || `${currentUrl}/og-home.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={settings.home_og_image || `${currentUrl}/og-home.jpg`} />
        <link rel="canonical" href={`${currentUrl}/`} />
      </Head>

      <SchemaMarkup schema={generateWebsiteSchema(settings)} />
      <SchemaMarkup schema={generateOrganizationSchema()} />

      <Header />
      <main>
        <HomePage 
          initialArticles={articles} 
          initialFilterData={filterData}
          settings={settings}
        />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const settings = await SupabaseAdminService.getSettingsServerSide();

    // Create isolated wpService instance for this request
    const currentWpService = new WordPressService();
    currentWpService.setBaseUrl(settings.api_url);
    currentWpService.setFiltersApiUrl(settings.filters_api_url);
    currentWpService.setAuthToken(settings.auth_token || '');

    // Fetch data
    const [articles, filterData] = await Promise.all([
      currentWpService.getArticles(3),
      currentWpService.getFiltersData()
    ]);

    return {
      props: {
        articles,
        filterData,
        settings
      },
      revalidate: 86400, // ISR: Revalidate every 24 hours
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);

    return {
      props: {
        articles: [],
        filterData: null,
        settings: await SupabaseAdminService.getSettingsServerSide()
      },
      revalidate: 300, // 5 minutes
    };
  }
};