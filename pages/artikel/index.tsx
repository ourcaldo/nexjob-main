import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { cmsArticleService } from '@/services/cmsArticleService';
import { supabaseAdminService } from '@/services/supabaseAdminService';
import { NxdbArticle, NxdbArticleCategory } from '@/lib/supabase';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateArticleListingSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';
import { getCurrentDomain } from '@/lib/env';
import { formatDistance } from 'date-fns';
import { Calendar, User, Tag, Folder, ArrowRight, Clock, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import AdDisplay from '@/components/Advertisement/AdDisplay';
import { renderTemplate } from '@/utils/templateUtils';
import { useRouter } from 'next/router';
import { wpService } from '@/services/wpService';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import ArticleArchiveSkeleton from '@/components/ui/ArticleArchiveSkeleton';

interface ArticlePageProps {
  articles: NxdbArticle[];
  categories: NxdbArticleCategory[];
  featuredArticle: NxdbArticle | null;
  latestArticles: NxdbArticle[];
  tags: string[];
  seoSettings: any;
}

// Generate random colors for categories
const categoryColors = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-red-100 text-red-800',
  'bg-yellow-100 text-yellow-800',
  'bg-indigo-100 text-indigo-800',
  'bg-pink-100 text-pink-800',
  'bg-teal-100 text-teal-800',
  'bg-orange-100 text-orange-800',
  'bg-cyan-100 text-cyan-800',
];

export default function ArticlePage({ 
  articles: initialArticles, 
  categories, 
  featuredArticle, 
  latestArticles, 
  tags,
  seoSettings
}: ArticlePageProps) {
  const [articles, setArticles] = useState<NxdbArticle[]>(initialArticles);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const currentUrl = getCurrentDomain();
  const router = useRouter();

  // Handle category filter
  const handleCategoryChange = async (categorySlug: string) => {
    setLoading(true);
    setSelectedCategory(categorySlug);

    try {
      if (categorySlug === 'all') {
        const articlesData = await cmsArticleService.getPublishedArticles(20, 0);
        setArticles(articlesData.articles);
      } else {
        // Filter articles client-side to ensure proper category matching
        const articlesData = await cmsArticleService.getPublishedArticles(100, 0); // Get more articles to filter
        const filteredArticles = articlesData.articles.filter(article => 
          article.categories && 
          article.categories.length > 0 && 
          article.categories.some(cat => cat.slug === categorySlug)
        );
        setArticles(filteredArticles);
      }
    } catch (error) {
      console.error('Error filtering articles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get category color
  const getCategoryColor = (index: number) => {
    return categoryColors[index % categoryColors.length];
  };

  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Artikel', href: '/artikel' }
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

  // Prepare template variables
  const templateVars = {
    site_title: seoSettings?.site_title || 'Nexjob',
    lokasi: '',
    kategori: ''
  };

  // Get SEO title and description with template rendering
  const rawSeoTitle = seoSettings?.articles_title || 'Artikel - Tips Karir dan Berita Kerja Terbaru - {{site_title}}';
  const rawSeoDescription = seoSettings?.articles_description || 'Baca artikel terbaru seputar tips karir, berita kerja, dan panduan mencari pekerjaan di Indonesia. Dapatkan insight berharga untuk mengembangkan karir Anda.';

  const seoTitle = renderTemplate(rawSeoTitle, templateVars);
  const seoDescription = renderTemplate(rawSeoDescription, templateVars);

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

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content="artikel kerja, tips karir, berita kerja, panduan kerja, lowongan kerja, karir indonesia" />

        {/* Open Graph */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${currentUrl}/artikel`} />
        <meta property="og:image" content={`${currentUrl}/logo.png`} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={`${currentUrl}/logo.png`} />

        {/* Canonical URL */}
        <link rel="canonical" href={`${currentUrl}/artikel`} />
      </Head>

      <SchemaMarkup schema={[articleListingSchema, breadcrumbSchema]} />

      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <nav className="mb-8 flex justify-center">
              <ol className="flex items-center space-x-2 text-sm text-primary-100">
                {breadcrumbItems.map((item, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && <span className="mx-2">/</span>}
                    {index === breadcrumbItems.length - 1 ? (
                      <span className="text-white">{item.name}</span>
                    ) : (
                      <Link href={item.href} className="hover:text-white transition-colors">
                        {item.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {renderTemplate(seoSettings?.articles_title || 'Artikel & Tips Karir - {{site_title}}', templateVars).replace(` - ${templateVars.site_title}`, '') || 'Artikel & Tips Karir'}
              </h1>
              <p className="text-xl text-primary-100 max-w-3xl mx-auto leading-relaxed">
                {seoDescription}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Category Filter */}
          <div className="mb-12">
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200'
                }`}
              >
                Semua Artikel
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                    selectedCategory === category.slug
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                      <div className="aspect-video bg-gray-200"></div>
                      <div className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-4"></div>
                        <div className="h-6 bg-gray-200 rounded mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Folder className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    Belum ada artikel tersedia
                  </h3>
                  <p className="text-gray-600 text-lg">
                    Artikel akan segera hadir. Kembali lagi nanti untuk membaca konten menarik.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {articles.map((article, index) => (
                    <article
                      key={article.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                    >
                      <Link href={`/artikel/${article.categories && article.categories.length > 0 && article.categories[0] && article.categories[0].slug ? article.categories[0].slug : 'uncategorized'}/${article.slug}`}>
                        <div className="aspect-video relative overflow-hidden">
                          {article.featured_image ? (
                            <Image
                              src={article.featured_image}
                              alt={article.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <Folder className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="p-6">
                          {/* Category */}
                          {article.categories && article.categories.length > 0 && article.categories[0] && article.categories[0].name && (
                            <div className="mb-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(index)}`}>
                                <Folder className="h-3 w-3 mr-1" />
                                {article.categories[0].name}
                              </span>
                            </div>
                          )}

                          <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                            {article.title}
                          </h2>

                          {article.excerpt && (
                            <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                              {article.excerpt}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                <span>{article.author?.full_name || article.author?.email || 'Nexjob'}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{formatDistance(new Date(article.published_at || article.post_date), new Date(), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-8">
                {/* Featured Article */}
                {featuredArticle && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-primary-600" />
                      Artikel Unggulan
                    </h3>
                    <Link href={`/artikel/${featuredArticle.categories && featuredArticle.categories.length > 0 && featuredArticle.categories[0] && featuredArticle.categories[0].slug ? featuredArticle.categories[0].slug : 'uncategorized'}/${featuredArticle.slug}`}>
                      <div className="group">
                        {featuredArticle.featured_image && (
                          <div className="aspect-video relative overflow-hidden rounded-lg mb-4">
                            <Image
                              src={featuredArticle.featured_image}
                              alt={featuredArticle.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, 300px"
                            />
                          </div>
                        )}
                        <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                          {featuredArticle.title}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {featuredArticle.excerpt}
                        </p>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Latest Articles */}
                {latestArticles.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-primary-600" />
                      Artikel Terbaru
                    </h3>
                    <div className="space-y-4">
                      {latestArticles.map(article => (
                        <Link
                          key={article.id}
                          href={`/artikel/${article.categories && article.categories.length > 0 && article.categories[0] && article.categories[0].slug ? article.categories[0].slug : 'uncategorized'}/${article.slug}`}
                          className="block group"
                        >
                          <div className="flex space-x-3">
                            {article.featured_image && (
                              <div className="flex-shrink-0 w-16 h-16 relative overflow-hidden rounded-lg">
                                <Image
                                  src={article.featured_image}
                                  alt={article.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  sizes="64px"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 text-sm">
                                {article.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistance(new Date(article.published_at || article.post_date), new Date(), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags Cloud */}
                {tags.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Tag className="h-5 w-5 mr-2 text-primary-600" />
                      Tag Populer
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advertisement */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <AdDisplay position="sidebar_archive_ad_code" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const [articlesData, categories, seoSettings] = await Promise.all([
      cmsArticleService.getPublishedArticles(20, 0),
      cmsArticleService.getCategories(),
      supabaseAdminService.getSettings()
    ]);

    // Get featured article (first article or most recent)
    const featuredArticle = articlesData.articles.length > 0 ? articlesData.articles[0] : null;

    // Get latest articles (excluding featured)
    const latestArticles = articlesData.articles
      .filter(article => article.id !== featuredArticle?.id)
      .slice(0, 3);

    // Extract tags from articles
    const tagsSet = new Set<string>();
    articlesData.articles.forEach(article => {
      if (article.tags) {
        article.tags.forEach(tag => tagsSet.add(tag.name));
      }
    });
    const tags = Array.from(tagsSet).slice(0, 12); // Limit to 12 tags

    return {
      props: {
        articles: articlesData.articles,
        categories,
        featuredArticle,
        latestArticles,
        tags,
        seoSettings
      },
      revalidate: 300, // 5 minutes
    };
  } catch (error) {
    console.error('Error fetching articles:', error);
    return {
      props: {
        articles: [],
        categories: [],
        featuredArticle: null,
        latestArticles: [],
        tags: [],
        seoSettings: null
      },
      revalidate: 300,
    };
  }
};