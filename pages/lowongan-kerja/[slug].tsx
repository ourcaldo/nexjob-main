
import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { wpService } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import { getCurrentDomain } from '@/lib/env';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import JobDetailPage from '@/components/pages/JobDetailPage';
import JobDetailSkeleton from '@/components/ui/JobDetailSkeleton';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateJobPostingSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';
import { Job } from '@/types/job';
import { useRouter } from 'next/router';

interface JobPageProps {
  job: Job | null;
  slug: string;
  settings: any;
  currentUrl: string;
}

export default function JobPage({ job, slug, settings, currentUrl }: JobPageProps) {
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
          <JobDetailSkeleton />
        </main>
        <Footer />
      </>
    );
  }

  // Add null check for job
  if (!job) {
    return (
      <>
        <Head>
          <title>Job Not Found - Nexjob</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <Header />
        <main>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
              <p className="text-gray-600">The job you&apos;re looking for doesn&apos;t exist.</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const pageTitle = job.seo_title || `${job.title} - ${job.company_name} | Nexjob`;
  const pageDescription = job.seo_description || `Lowongan ${job.title} di ${job.company_name}, ${job.lokasi_kota}. Gaji: ${job.gaji}. Lamar sekarang!`;
  const canonicalUrl = `${currentUrl}/lowongan-kerja/${slug}/`;
  const ogImage = settings.default_job_og_image || `${currentUrl}/og-job-default.jpg`;

  const breadcrumbItems = [
    { label: 'Lowongan Kerja', href: '/lowongan-kerja/' },
    { label: job.title }
  ];

  const jobSchema = generateJobPostingSchema(job);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`${job.title}, ${job.company_name}, ${job.lokasi_kota}, ${job.kategori_pekerjaan}, lowongan kerja`} />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Nexjob" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* Additional SEO */}
        <meta name="author" content="Nexjob" />
        <meta property="article:published_time" content={job.created_at} />
        <meta property="article:modified_time" content={job.created_at} />
        <meta property="article:section" content={job.kategori_pekerjaan} />
        <meta property="article:tag" content={job.kategori_pekerjaan} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      
      <SchemaMarkup schema={[jobSchema, breadcrumbSchema]} />
      
      <Header />
      <main>
        <JobDetailPage job={job} slug={slug} settings={settings} />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  try {
    const [job, settings] = await Promise.all([
      wpService.getJobBySlug(slug),
      SupabaseAdminService.getSettingsServerSide()
    ]);

    const currentUrl = getCurrentDomain();

    if (!job) {
      return {
        notFound: true
      };
    }

    return {
      props: {
        job,
        slug,
        settings,
        currentUrl
      },
      revalidate: 300, // 5 minutes ISR for faster updates
    };
  } catch (error) {
    console.error('Error fetching job:', error);
    return {
      notFound: true
    };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // Get some popular jobs for initial static generation
    const response = await wpService.getJobs({}, 1, 50); // Get first 50 jobs
    const paths = response.jobs.map(job => ({
      params: { slug: job.slug }
    }));

    return {
      paths,
      fallback: 'blocking' // Enable ISR - generate pages on-demand
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: 'blocking' // Still enable ISR even if initial paths fail
    };
  }
};
