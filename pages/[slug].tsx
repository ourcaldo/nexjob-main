import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { cmsPageService } from '@/services/cmsPageService';
import { NxdbPage } from '@/lib/supabase';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generatePageSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';
import { getCurrentDomain } from '@/lib/env';
import CMSContent from '@/components/CMSContent';

interface PageProps {
  page: NxdbPage;
}

export default function DynamicPage({ page }: PageProps) {
  const currentUrl = getCurrentDomain();
  const pageTitle = page.seo_title || page.title;
  const pageDescription = page.meta_description || page.excerpt;
  const canonicalUrl = `${currentUrl}/${page.slug}/`;
  const ogImage = page.featured_image || `${currentUrl}/og-page-default.jpg`;

  const breadcrumbItems = [
    { label: page.title }
  ];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      {/* Schema Markup */}
      <SchemaMarkup schema={generatePageSchema(page)} />
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />

      <Header />

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Featured Image */}
          {page.featured_image && (
            <div className="mb-8">
              <Image
                src={page.featured_image}
                alt={page.title}
                width={800}
                height={256}
                className="w-full h-64 md:h-96 object-cover rounded-xl shadow-sm"
              />
            </div>
          )}

          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {page.title}
            </h1>

            {page.excerpt && (
              <div className="text-xl text-gray-600 mb-6">
                {page.excerpt}
              </div>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-4">
              <div className="flex items-center">
                <span>Published: {new Date(page.post_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>

              {page.author && (
                <div className="flex items-center">
                  <span>By: {page.author.full_name || page.author.email}</span>
                </div>
              )}

              {page.categories && page.categories.length > 0 && (
                <div className="flex items-center">
                  <span>Categories: {page.categories.map(cat => cat.name).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Page Content with Rich Text Styling */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <CMSContent
              content={page.content}
              className="rich-text-content max-w-none"
            />
          </div>

          {/* Tags */}
          {page.tags && page.tags.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {page.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // Get all published pages for static generation
    const { pages } = await cmsPageService.getPages({ status: 'published' });

    const paths = pages.map((page) => ({
      params: { slug: page.slug }
    }));

    return {
      paths,
      fallback: 'blocking' // Enable ISR for new pages
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      notFound: true
    };
  }

  try {
    const page = await cmsPageService.getPageBySlug(slug);

    if (!page) {
      return {
        notFound: true
      };
    }

    return {
      props: {
        page
      },
      revalidate: 86400 // ISR: Revalidate every 24 hours
    };
  } catch (error) {
    console.error('Error fetching page:', error);
    return {
      notFound: true
    };
  }
};