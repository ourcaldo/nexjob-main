import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { wpService } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import { getCurrentDomain } from '@/lib/env';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import JobSearchPage from '@/components/pages/JobSearchPage';
import JobArchiveSkeleton from '@/components/ui/JobArchiveSkeleton';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateBreadcrumbSchema } from '@/utils/schemaUtils';
import { renderTemplate } from '@/utils/templateUtils';

interface JobsPageProps {
  settings: any;
  currentUrl: string;
}

export default function Jobs({ settings, currentUrl }: JobsPageProps) {
  const router = useRouter();

  // Show skeleton loading while page is being generated
  if (router.isFallback) {
    return (
      <>
        <Head>
          <title>Loading... - Nexjob</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <Header />
        <main>
          <JobArchiveSkeleton />
        </main>
        <Footer />
      </>
    );
  }
  const breadcrumbItems = [{ label: 'Lowongan Kerja' }];

  // Prepare template variables
  const templateVars = {
    site_title: settings?.site_title || 'Nexjob',
    lokasi: '',
    kategori: ''
  };

  // Get SEO settings with template rendering
  const pageTitle = renderTemplate(settings?.jobs_title || 'Lowongan Kerja Terbaru - {{site_title}}', templateVars);
  const pageDescription = renderTemplate(settings?.jobs_description || 'Temukan lowongan kerja terbaru dari berbagai perusahaan terpercaya. Dapatkan pekerjaan impian Anda dengan gaji terbaik.', templateVars);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="lowongan kerja, jobs, karir, pekerjaan, rekrutmen" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${currentUrl}/lowongan-kerja/`} />
        <meta property="og:image" content={settings.jobs_og_image || `${currentUrl}/og-jobs.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={settings.jobs_og_image || `${currentUrl}/og-jobs.jpg`} />
        <link rel="canonical" href={`${currentUrl}/lowongan-kerja/`} />
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
                </li>
              </ol>
            </nav>

            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {pageTitle.replace(` - ${templateVars.site_title}`, '') || 'Lowongan Kerja Terbaru'}
              </h1>
              <p className="text-xl text-primary-100 max-w-3xl mx-auto leading-relaxed">
                {pageDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Job Search Content */}
        <JobSearchPage settings={settings} />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const settings = await SupabaseAdminService.getSettingsServerSide();
  const currentUrl = getCurrentDomain();

  return {
    props: {
      settings,
      currentUrl
    },
    revalidate: 300, // 5 minutes
  };
};