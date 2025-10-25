import React, { useState, useEffect } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { cmsArticleService } from '@/services/cmsArticleService';
import { NxdbArticle } from '@/lib/supabase';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';
import { getCurrentDomain } from '@/lib/env';
import CMSContent from '@/components/CMSContent';
import { formatDistance } from 'date-fns';
import { Calendar, User, Tag, Folder, Eye } from 'lucide-react';
import { useRouter } from 'next/router';
import ArticleDetailSkeleton from '@/components/ui/ArticleDetailSkeleton';

interface ArticleDetailProps {
  article: NxdbArticle;
  categorySlug: string;
}

export default function ArticleDetail({ article, categorySlug }: ArticleDetailProps) {
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
          <ArticleDetailSkeleton />
        </main>
        <Footer />
      </>
    );
  }
  const currentUrl = getCurrentDomain();

  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Artikel', href: '/artikel' },
    { name: article.categories?.[0]?.name || 'Uncategorized', href: `/artikel/${categorySlug}` },
    { name: article.title, href: `/artikel/${categorySlug}/${article.slug}` }
  ];

  const articleSchema = generateArticleSchema(article);

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems.map(item => ({ 
    label: item.name, 
    href: item.href 
  })));

  return (
    <>
      <Head>
        <title>{article.seo_title || article.title} - Nexjob</title>
        <meta name="description" content={article.meta_description || article.excerpt} />
        <meta name="keywords" content={article.tags?.map(tag => tag.name).join(', ')} />

        {/* Open Graph */}
        <meta property="og:title" content={article.seo_title || article.title} />
        <meta property="og:description" content={article.meta_description || article.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${currentUrl}/artikel/${categorySlug}/${article.slug}`} />
        {article.featured_image && (
          <meta property="og:image" content={article.featured_image} />
        )}
        <meta property="article:published_time" content={article.published_at || article.post_date} />
        <meta property="article:modified_time" content={article.updated_at} />
        <meta property="article:author" content={article.author?.full_name || article.author?.email || 'Nexjob'} />
        <meta property="article:section" content={article.categories?.[0]?.name || 'Article'} />
        {article.tags?.map(tag => (
          <meta key={tag.id} property="article:tag" content={tag.name} />
        ))}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.seo_title || article.title} />
        <meta name="twitter:description" content={article.meta_description || article.excerpt} />
        {article.featured_image && (
          <meta name="twitter:image" content={article.featured_image} />
        )}

        {/* Canonical URL */}
        <link rel="canonical" href={`${currentUrl}/artikel/${categorySlug}/${article.slug}`} />
      </Head>

      <SchemaMarkup schema={[articleSchema, breadcrumbSchema]} />

      <Header />

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              {breadcrumbItems.map((item, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && <span className="mx-2">/</span>}
                  {index === breadcrumbItems.length - 1 ? (
                    <span className="text-gray-900">{item.name}</span>
                  ) : (
                    <a href={item.href} className="hover:text-gray-900">
                      {item.name}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              {article.categories?.map(category => (
                <span
                  key={category.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                >
                  <Folder className="h-4 w-4 mr-1" />
                  {category.name}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-lg text-gray-600 mb-6">
                {article.excerpt}
              </p>
            )}

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>By {article.author?.full_name || article.author?.email || 'Nexjob'}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDistance(new Date(article.published_at || article.post_date), new Date(), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                <span>Updated {formatDistance(new Date(article.updated_at), new Date(), { addSuffix: true })}</span>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {article.featured_image && (
            <div className="mb-8">
              <Image
                src={article.featured_image}
                alt={article.title}
                width={800}
                height={384}
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Article Content */}
          <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
            <div className="prose prose-lg max-w-none">
              <CMSContent content={article.content} />
            </div>
          </article>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
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

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const categorySlug = params?.category as string;
  const slug = params?.slug as string;

  try {
    const article = await cmsArticleService.getArticleBySlug(slug);

    if (!article) {
      return {
        notFound: true
      };
    }

    // Check if article belongs to the requested category
    const hasCategory = article.categories?.some(cat => cat.slug === categorySlug);
    if (!hasCategory) {
      return {
        notFound: true
      };
    }

    return {
      props: {
        article,
        categorySlug
      },
      revalidate: 3600, // 1 hour
    };
  } catch (error) {
    console.error('Error fetching article:', error);
    return {
      notFound: true
    };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const { articles } = await cmsArticleService.getPublishedArticles(100, 0);
    const paths = articles.map(article => ({
      params: { 
        category: article.categories?.[0]?.slug || 'uncategorized',
        slug: article.slug 
      }
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