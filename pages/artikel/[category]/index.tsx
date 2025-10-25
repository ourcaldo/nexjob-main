import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { cmsArticleService } from '@/services/cmsArticleService';
import { NxdbArticle, NxdbArticleCategory } from '@/lib/supabase';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateArticleListingSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';
import { getCurrentDomain } from '@/lib/env';
import { formatDistance } from 'date-fns';
import { Calendar, User, Tag, Folder, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ArticleArchiveSkeleton from '@/components/ui/ArticleArchiveSkeleton';

interface ArticleCategoryPageProps {
  articles: NxdbArticle[];
  category: NxdbArticleCategory;
  allCategories: NxdbArticleCategory[];
  total: number;
}

export default function ArticleCategoryPage({ articles, category, allCategories, total }: ArticleCategoryPageProps) {
  const currentUrl = getCurrentDomain();
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
          <ArticleArchiveSkeleton />
        </main>
        <Footer />
      </>
    );
  }

  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Artikel', href: '/artikel' },
    { name: category.name, href: `/artikel/${category.slug}` }
  ];

  const articleListingSchema = generateArticleListingSchema(
    articles.map(article => ({
      title: { rendered: article.title },
      seo_description: article.excerpt,
      excerpt: { rendered: article.excerpt || '' },
      author_info: { display_name: article.author?.full_name || article.author?.email || 'Nexjob' },
      date: article.published_at || article.post_date,
      slug: article.slug
    }))
  );

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems.map(item => ({ 
    label: item.name, 
    href: item.href 
  })));

  return (
    <>
      <Head>
        <title>{category.name} - Artikel - Nexjob</title>
        <meta name="description" content={category.description || `Baca artikel terbaru tentang ${category.name} dan tips karir terkait.`} />
        <meta name="keywords" content={`${category.name}, artikel kerja, tips karir, berita kerja, panduan kerja`} />

        {/* Open Graph */}
        <meta property="og:title" content={`${category.name} - Artikel - Nexjob`} />
        <meta property="og:description" content={category.description || `Baca artikel terbaru tentang ${category.name} dan tips karir terkait.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${currentUrl}/artikel/${category.slug}`} />
        <meta property="og:image" content={`${currentUrl}/logo.png`} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${category.name} - Artikel - Nexjob`} />
        <meta name="twitter:description" content={category.description || `Baca artikel terbaru tentang ${category.name} dan tips karir terkait.`} />
        <meta name="twitter:image" content={`${currentUrl}/logo.png`} />

        {/* Canonical URL */}
        <link rel="canonical" href={`${currentUrl}/artikel/${category.slug}`} />
      </Head>

      <SchemaMarkup schema={[articleListingSchema, breadcrumbSchema]} />

      <Header />

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <nav className="mb-4">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                {breadcrumbItems.map((item, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && <span className="mx-2">/</span>}
                    {index === breadcrumbItems.length - 1 ? (
                      <span className="text-gray-900">{item.name}</span>
                    ) : (
                      <Link href={item.href} className="hover:text-gray-900">
                        {item.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg text-gray-600 mb-6">
                {category.description}
              </p>
            )}

            <div className="flex items-center text-sm text-gray-500">
              <span>{total} artikel dalam kategori ini</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Kategori Lainnya</h2>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/artikel"
                      className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span>Semua Artikel</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </li>
                  {allCategories.filter(cat => cat.id !== category.id).map(cat => (
                    <li key={cat.id}>
                      <Link
                        href={`/artikel/${cat.slug}`}
                        className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <span>{cat.name}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Articles */}
            <div className="lg:col-span-3">
              {articles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <Folder className="h-12 w-12 text-gray-400 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Belum ada artikel di kategori ini
                  </h3>
                  <p className="text-gray-500">
                    Artikel akan segera hadir. Kembali lagi nanti untuk membaca konten menarik.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {articles.map(article => (
                    <article
                      key={article.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-4">
                        {article.featured_image && (
                          <div className="flex-shrink-0">
                            <Image
                              src={article.featured_image}
                              alt={article.title}
                              width={128}
                              height={96}
                              className="w-32 h-24 object-cover rounded-lg"
                            />
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {article.categories?.map(category => (
                              <span
                                key={category.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                              >
                                <Folder className="h-3 w-3 mr-1" />
                                {category.name}
                              </span>
                            ))}
                          </div>

                          <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            <Link
                              href={`/artikel/${category.slug}/${article.slug}`}
                              className="hover:text-primary-600 transition-colors"
                            >
                              {article.title}
                            </Link>
                          </h2>

                          {article.excerpt && (
                            <p className="text-gray-600 mb-4 line-clamp-3">
                              {article.excerpt}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                <span>{article.author?.full_name || article.author?.email || 'Nexjob'}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>
                                  {formatDistance(new Date(article.published_at || article.post_date), new Date(), { addSuffix: true })}
                                </span>
                              </div>
                            </div>

                            <Link
                              href={`/artikel/${category.slug}/${article.slug}`}
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                            >
                              Baca Selengkapnya
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const categorySlug = params?.category as string;

  try {
    const [allCategories] = await Promise.all([
      cmsArticleService.getCategories()
    ]);

    const category = allCategories.find(cat => cat.slug === categorySlug);

    if (!category) {
      return {
        notFound: true
      };
    }

    const articlesData = await cmsArticleService.getArticlesByCategory(categorySlug, 20, 0);

    return {
      props: {
        articles: articlesData.articles,
        category,
        allCategories,
        total: articlesData.total
      },
      revalidate: 3600, // 1 hour ISR revalidation
    };
  } catch (error) {
    console.error('Error fetching articles:', error);
    return {
      notFound: true
    };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const categories = await cmsArticleService.getCategories();
    const paths = categories.map(category => ({
      params: { category: category.slug }
    }));

    return {
      paths,
      fallback: 'blocking'
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
};