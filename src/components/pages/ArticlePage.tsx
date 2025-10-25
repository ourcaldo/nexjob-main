import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { wpService } from '@/services/wpService';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateArticleListingSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';
import ArticleSidebar from '@/components/ArticleSidebar';

interface ArticlePageProps {
  settings: any;
}

const ArticlePage: React.FC<ArticlePageProps> = ({ settings }) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    setError(null);

    try {
      const articlesData = await wpService.getArticles();
      setArticles(articlesData);
    } catch (err) {
      setError('Gagal memuat artikel. Silakan coba lagi.');
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const breadcrumbItems = [
    { label: 'Tips Karir' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Schema Markup */}
      {articles.length > 0 && (
        <>
          <SchemaMarkup schema={generateArticleListingSchema(articles)} />
          <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />
        </>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Tips & Panduan Karir
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Artikel dan panduan terbaru untuk membantu perjalanan karir Anda
            </p>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Breadcrumbs */}
        <div className="flex justify-center">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Memuat Data</h2>
              <p className="text-gray-600">Sedang mengambil artikel terbaru...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={loadArticles}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Main Content with Sidebar */}
        {!loading && articles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Articles Grid */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {articles.map((article, index) => (
                  <Link
                    key={article.id}
                    href={`/artikel/${article.slug}/`}
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group block"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {article.featured_media_url && (
                      <div className="aspect-video overflow-hidden relative">
                        <Image
                          src={article.featured_media_url}
                          alt={article.title.rendered}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(article.date)}
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {article.title.rendered}
                      </h2>
                      <div
                        className="text-gray-600 mb-4 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: article.excerpt.rendered }}
                      />
                      <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                        Baca Selengkapnya
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <ArticleSidebar isArchive={true} /></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada artikel tersedia</h3>
            <p className="text-gray-600">Artikel akan segera hadir. Silakan kembali lagi nanti.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlePage;