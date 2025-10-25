import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { WordPressService, FilterData } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import JobSearchPage from '@/components/pages/JobSearchPage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateBreadcrumbSchema } from '@/utils/schemaUtils';
import { getCurrentDomain } from '@/lib/env';
import { wpLocationMappings } from '@/utils/urlUtils';
import { renderTemplate } from '@/utils/templateUtils';

interface JobLocationPageProps {
  slug: string;
  location: string;
  category: string;
  locationType: string;
  settings: any;
  currentUrl: string;
}

export default function JobLocationPage({ slug, location, category, locationType, settings, currentUrl }: JobLocationPageProps) {
  const breadcrumbItems = [
    { label: 'Lowongan Kerja', href: '/lowongan-kerja/' },
    { label: `Lokasi: ${location}` }
  ];

  // Prepare template variables
  const templateVars = {
    site_title: settings?.site_title || 'Nexjob',
    lokasi: location,
    kategori: category
  };

  // Get SEO settings with template rendering
  const pageTitle = renderTemplate(settings?.job_location_title || 'Lowongan Kerja di {{lokasi}} - {{site_title}}', templateVars);
  const pageDescription = renderTemplate(settings?.job_location_description || 'Temukan lowongan kerja terbaru di {{lokasi}} dari berbagai perusahaan terpercaya. Dapatkan pekerjaan impian Anda di {{lokasi}}.', templateVars);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`lowongan kerja ${location}, jobs ${location}, karir ${location}, pekerjaan ${location}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${currentUrl}/lowongan-kerja/lokasi/${slug}/`} />
        <meta property="og:image" content={settings.jobs_og_image || `${currentUrl}/og-jobs.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={settings.jobs_og_image || `${currentUrl}/og-jobs.jpg`} />
        <link rel="canonical" href={`${currentUrl}/lowongan-kerja/lokasi/${slug}/`} />
      </Head>

      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />

      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <nav className="mb-8">
              <ol className="flex items-center justify-center space-x-2 text-sm text-primary-100">
                <li className="flex items-center">
                  <span className="text-white">Home</span>
                  <span className="mx-2">/</span>
                  <span className="text-white">Lowongan Kerja</span>
                  <span className="mx-2">/</span>
                  <span className="text-white">Lokasi: {location}</span>
                </li>
              </ol>
            </nav>

            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {pageTitle.replace(` - ${templateVars.site_title}`, '') || `Lowongan Kerja di ${location}`}
              </h1>
              <p className="text-xl text-primary-100 max-w-3xl mx-auto leading-relaxed">
                {pageDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Job Search Content */}
        <JobSearchPage 
          settings={settings} 
          initialLocation={location}
          initialCategory={category}
          locationType={locationType as 'province' | 'city'}
        />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const location = wpLocationMappings[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
  const category = '';
  const locationType: 'province' | 'city' = 'city';

  const settings = await SupabaseAdminService.getSettingsServerSide();
  const currentUrl = getCurrentDomain();

  return {
    props: {
      slug,
      location,
      category,
      locationType,
      settings,
      currentUrl
    },
    revalidate: 300, // 5 minutes
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Generate paths for common locations
  const commonLocations = Object.keys(wpLocationMappings);
  const paths = commonLocations.map(slug => ({
    params: { slug }
  }));

  return {
    paths,
    fallback: 'blocking'
  };
};