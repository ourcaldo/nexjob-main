
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AdDisplay from './Advertisement/AdDisplay';

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  published_at: string;
}

interface ArticleSidebarProps {
  relatedArticles?: RelatedArticle[];
  isArchive?: boolean;
}

const ArticleSidebar: React.FC<ArticleSidebarProps> = ({ 
  relatedArticles = [], 
  isArchive = false 
}) => {
  const adPosition = isArchive ? 'sidebar_archive_ad_code' : 'sidebar_single_ad_code';

  return (
    <aside className="space-y-8">
      {/* Advertisement */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <AdDisplay position={adPosition} />
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Artikel Terkait
          </h3>
          <div className="space-y-4">
            {relatedArticles.slice(0, 5).map((article) => (
              <div key={article.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                <Link 
                  href={`/artikel/${article.slug}`}
                  className="block group"
                >
                  <div className="flex space-x-3">
                    {article.featured_image && (
                      <div className="flex-shrink-0">
                        <Image
                          src={article.featured_image}
                          alt={article.title}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary-600 line-clamp-2">
                        {article.title}
                      </h4>
                      {article.excerpt && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(article.published_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Another Ad Space */}
      {!isArchive && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <AdDisplay position="sidebar_single_ad_code" />
        </div>
      )}

      {/* Popular Categories */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Kategori Populer
        </h3>
        <div className="space-y-2">
          <Link href="/artikel/karir" className="block text-sm text-gray-600 hover:text-primary-600">
            Tips Karir
          </Link>
          <Link href="/artikel/interview" className="block text-sm text-gray-600 hover:text-primary-600">
            Persiapan Interview
          </Link>
          <Link href="/artikel/cv" className="block text-sm text-gray-600 hover:text-primary-600">
            Panduan CV
          </Link>
          <Link href="/artikel/gaji" className="block text-sm text-gray-600 hover:text-primary-600">
            Negosiasi Gaji
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default ArticleSidebar;
