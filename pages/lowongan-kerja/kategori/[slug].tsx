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
import { wpCategoryMappings } from '@/utils/urlUtils';
import { renderTemplate } from '@/utils/templateUtils';

interface JobCategoryPageProps {
  slug: string;
  category: string;
  location: string;
  settings: any;
  currentUrl: string;
}

export default function JobCategoryPage({ slug, category, location, settings, currentUrl }: JobCategoryPageProps) {
  const breadcrumbItems = [
    { label: 'Lowongan Kerja', href: '/lowongan-kerja/' },
    { label: `Kategori: ${category}` }
  ];

  // Prepare template variables
  const templateVars = {
    site_title: settings?.site_title || 'Nexjob',
    lokasi: location,
    kategori: category
  };

  // Get SEO settings with template rendering
  const pageTitle = renderTemplate(settings?.job_category_title || 'Lowongan Kerja {{kategori}} - {{site_title}}', templateVars);
  const pageDescription = renderTemplate(settings?.job_category_description || 'Temukan lowongan kerja {{kategori}} terbaru dari berbagai perusahaan terpercaya. Dapatkan pekerjaan impian Anda di bidang {{kategori}}.', templateVars);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`lowongan kerja ${category}, jobs ${category}, karir ${category}, pekerjaan ${category}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${currentUrl}/lowongan-kerja/kategori/${slug}/`} />
        <meta property="og:image" content={settings.jobs_og_image || `${currentUrl}/og-jobs.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={settings.jobs_og_image || `${currentUrl}/og-jobs.jpg`} />
        <link rel="canonical" href={`${currentUrl}/lowongan-kerja/kategori/${slug}/`} />
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
                  <span className="text-white">Kategori: {category}</span>
                </li>
              </ol>
            </nav>

            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {pageTitle.replace(` - ${templateVars.site_title}`, '') || `Lowongan Kerja ${category}`}
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
          initialCategory={category}
          initialLocation={location}
        />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const category = wpCategoryMappings[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
  const location = '';

  const settings = await SupabaseAdminService.getSettingsServerSide();
  const currentUrl = getCurrentDomain();

  return {
    props: {
      slug,
      category,
      location,
      settings,
      currentUrl
    },
    revalidate: 300, // 5 minutes
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Generate paths for common job categories
  const commonCategories = Object.keys(wpCategoryMappings);
  const paths = commonCategories.map(slug => ({
    params: { slug }
  }));

  return {
    paths,
    fallback: 'blocking'
  };
};