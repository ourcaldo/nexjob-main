
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { Calendar, User, ArrowRight, Loader2, AlertCircle, Tag, Folder } from 'lucide-react';
import { wpService } from '@/services/wpService';
import { useAnalytics } from '@/hooks/useAnalytics';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateArticleSchema, generateBreadcrumbSchema, generateAuthorSchema } from '@/utils/schemaUtils';
import ArticleSidebar from '@/components/ArticleSidebar';
import AdDisplay from '@/components/Advertisement/AdDisplay';
import { advertisementService } from '@/services/advertisementService';

interface ArticleDetailPageProps {
  slug: string;
  settings: any;
}

const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({ slug, settings }) => {
  const router = useRouter();
  const { trackPageView, trackArticleRead } = useAnalytics();

  // Refs to prevent infinite loops
  const initialDataLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const currentSlugRef = useRef<string>('');

  // State
  const [article, setArticle] = useState<any>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedContent, setProcessedContent] = useState('');

  // Dynamic page metadata
  const getPageTitle = () => {
    if (loading) return 'Memuat Artikel... - Nexjob';
    if (error) return 'Artikel Tidak Ditemukan - Nexjob';
    if (article) return article.seo_title || `${article.title.rendered} - Nexjob`;
    return 'Artikel - Nexjob';
  };

  const getPageDescription = () => {
    if (loading) return 'Sedang memuat konten artikel...';
    if (error) return 'Artikel yang Anda cari tidak tersedia.';
    if (article) return article.seo_description || '';
    return 'Artikel tips karir dari Nexjob';
  };

  const getCurrentUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return settings.siteUrl || 'https://nexjob.tech';
  };

  const getCanonicalUrl = () => {
    return `${getCurrentUrl()}/artikel/${slug}/`;
  };

  const getRobotsContent = () => {
    if (loading || error) return 'noindex, nofollow';
    return 'index, follow';
  };

  const getOGImage = () => {
    if (article?.featured_media_url) {
      return article.featured_media_url;
    }
    return settings.default_article_og_image || `${getCurrentUrl()}/og-article-default.jpg`;
  };

  // Load article data
  const loadArticle = useCallback(async () => {
    // Prevent duplicate loading
    if (isLoadingRef.current || currentSlugRef.current === slug) return;

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const articleData = await wpService.getArticleBySlug(slug);

      if (!articleData) {
        setError('Artikel tidak ditemukan');
        return;
      }

      setArticle(articleData);
      currentSlugRef.current = slug;

      // Load related articles
      const relatedData = await wpService.getRelatedArticles(articleData.id.toString(), 3);
      setRelatedArticles(relatedData);

      // Track page view and article read
      const category = articleData.categories_info?.[0]?.name || '';
      trackPageView({
        page_title: articleData.title.rendered,
        content_group1: 'article_detail',
        content_group2: category,
      });

      trackArticleRead(articleData.title.rendered, articleData.id.toString(), category);

      initialDataLoadedRef.current = true;
    } catch (err) {
      setError('Gagal memuat artikel. Silakan coba lagi.');
      console.error('Error loading article:', err);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [slug, trackPageView, trackArticleRead]);

  // Initialize component - only run once per slug change
  useEffect(() => {
    if (slug && slug !== currentSlugRef.current) {
      initialDataLoadedRef.current = false;
      currentSlugRef.current = '';
      loadArticle();
    }
  }, [slug, loadArticle]);

  // Process content with middle ads
  const processContentWithAds = async (content: string) => {
    try {
      const middleAdCode = await advertisementService.getAdCode('single_middle_ad_code');
      if (middleAdCode) {
        return advertisementService.insertMiddleAd(content, middleAdCode);
      }
      return content;
    } catch (error) {
      console.error('Error processing content with ads:', error);
      return content;
    }
  };

  useEffect(() => {
    const processContent = async () => {
      if (article?.content) {
        const processed = await processContentWithAds(article.content);
        setProcessedContent(processed);
      }
    };
    processContent();
  }, [article?.content]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const parseContent = (content: string) => {
    return content
      .replace(/<h2>/g, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">')
      .replace(/<h3>/g, '<h3 class="text-xl font-semibold text-gray-900 mt-6 mb-3">')
      .replace(/<p>/g, '<p class="text-gray-700 mb-4 leading-relaxed">')
      .replace(/<ol>/g, '<ol class="list-decimal list-inside space-y-2 mb-4 text-gray-700 ml-4">')
      .replace(/<ul>/g, '<ul class="list-disc list-inside space-y-2 mb-4 text-gray-700 ml-4">')
      .replace(/<li>/g, '<li class="pl-2">');
  };

  const handleRelatedArticleClick = (articleSlug: string) => {
    router.push(`/artikel/${articleSlug}/`);
  };

  const breadcrumbItems = [
    { label: 'Tips Karir', href: '/artikel/' },
    { label: loading ? 'Memuat...' : (article?.title.rendered || 'Artikel') }
  ];

  return (
    <>
      {/* Dynamic Head */}
      <Head>
        <title>{getPageTitle()}</title>
        <meta name="description" content={getPageDescription()} />
        <meta name="robots" content={getRobotsContent()} />
        <meta property="og:title" content={getPageTitle()} />
        <meta property="og:description" content={getPageDescription()} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={getCanonicalUrl()} />
        <meta property="og:image" content={getOGImage()} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getPageTitle()} />
        <meta name="twitter:description" content={getPageDescription()} />
        <meta name="twitter:image" content={getOGImage()} />
        <link rel="canonical" href={getCanonicalUrl()} />
      </Head>

      {/* Schema Markup */}
      {article && (
        <>
          <SchemaMarkup schema={generateArticleSchema(article)} />
          <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />
          {article.author_info && (
            <SchemaMarkup schema={generateAuthorSchema(article.author_info)} />
          )}
        </>
      )}

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} />

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Memuat Artikel</h2>
                <p className="text-gray-600">Sedang mengambil konten artikel...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-12 w-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Artikel Tidak Ditemukan</h2>
                <p className="text-gray-600 mb-6">Artikel yang Anda cari tidak tersedia</p>
                <Link 
                  href="/artikel/"
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Kembali ke Artikel
                </Link>
              </div>
            </div>
          )}

          {/* Article Content */}
          {!loading && !error && article && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                  {article.featured_media_url && (
                    <div className="aspect-video overflow-hidden relative">
                      <Image
                        src={article.featured_media_url}
                        alt={article.title.rendered}
                        className="w-full h-full object-cover"
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                      />
                    </div>
                  )}

                  <div className="p-8">
                    {/* Article Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(article.date)}
                      </div>

                      {article.author_info && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {article.author_info.display_name || article.author_info.name}
                        </div>
                      )}

                      {article.categories_info && article.categories_info.length > 0 && (
                        <div className="flex items-center">
                          <Folder className="h-4 w-4 mr-2" />
                          {article.categories_info.map((cat: any, index: number) => (
                            <span key={cat.id}>
                              {cat.name}
                              {index < article.categories_info.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                      {article.title.rendered}
                    </h1>

                    {/* Article Description */}
                    {article.seo_description && (
                      <div className="bg-gray-50 border-l-4 border-primary-500 p-4 mb-6">
                        <p className="text-gray-700 text-lg leading-relaxed">
                          {article.seo_description}
                        </p>
                      </div>
                    )}

                     {/* Top Advertisement */}
                    <div className="mb-8">
                      <AdDisplay position="single_top_ad_code" className="mb-6" />
                    </div>

                    {/* Tags */}
                    {article.tags_info && article.tags_info.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {article.tags_info.map((tag: any) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: parseContent(processedContent) }}
                    />

                    {/* Bottom Advertisement */}
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <AdDisplay position="single_bottom_ad_code" />
                    </div>
                  </div>
                </article>

                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Artikel Terkait</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {relatedArticles.map((relatedArticle, index) => (
                        <div
                          key={relatedArticle.id}
                          onClick={() => handleRelatedArticleClick(relatedArticle.slug)}
                          className="group cursor-pointer"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <article className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300">
                            {relatedArticle.featured_media_url && (
                              <div className="aspect-video overflow-hidden relative">
                                <Image
                                  src={relatedArticle.featured_media_url}
                                  alt={relatedArticle.title.rendered}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                                />
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex items-center text-xs text-gray-500 mb-2">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(relatedArticle.date)}
                              </div>
                              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                                {relatedArticle.title.rendered}
                              </h3>
                              <div className="flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700">
                                Baca Selengkapnya
                                <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                              </div>
                            </div>
                          </article>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <ArticleSidebar relatedArticles={relatedArticles} isArchive={false} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ArticleDetailPage;
