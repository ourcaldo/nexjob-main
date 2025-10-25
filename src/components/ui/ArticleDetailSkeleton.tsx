
import React from 'react';

const ArticleDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs Skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Article Header Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
              {/* Category Badge Skeleton */}
              <div className="h-6 bg-gray-200 rounded-full w-24 mb-4 animate-pulse"></div>
              
              {/* Title Skeleton */}
              <div className="h-10 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded mb-6 w-3/4 animate-pulse"></div>
              
              {/* Meta Info Skeleton */}
              <div className="flex items-center space-x-6 text-gray-500 mb-6">
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>

              {/* Featured Image Skeleton */}
              <div className="w-full h-64 bg-gray-200 rounded-lg mb-6 animate-pulse"></div>

              {/* Share Buttons Skeleton */}
              <div className="flex space-x-2 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Article Content Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${Math.random() * 30 + 70}%` }}></div>
                ))}
              </div>
              
              {/* Subheading Skeleton */}
              <div className="h-7 bg-gray-200 rounded mt-8 mb-4 w-1/2 animate-pulse"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${Math.random() * 25 + 75}%` }}></div>
                ))}
              </div>
            </div>

            {/* Tags Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
              <div className="h-6 bg-gray-200 rounded mb-4 w-20 animate-pulse"></div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Related Articles Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="h-7 bg-gray-200 rounded mb-6 w-48 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded mb-3 w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Latest Articles Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="h-6 bg-gray-200 rounded mb-4 w-32 animate-pulse"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex space-x-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-1 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="h-6 bg-gray-200 rounded mb-4 w-24 animate-pulse"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-6 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailSkeleton;
