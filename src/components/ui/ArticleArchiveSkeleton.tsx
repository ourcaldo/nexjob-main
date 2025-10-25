
import React from 'react';

const ArticleArchiveSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs Skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>

        {/* Page Header Skeleton */}
        <div className="text-center mb-12">
          <div className="h-10 bg-gray-200 rounded mb-4 w-80 mx-auto animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Header Skeleton */}
            <div className="mb-8">
              <div className="h-8 bg-gray-200 rounded mb-2 w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>

            {/* Article Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <article key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Featured Image Skeleton */}
                  <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
                  
                  <div className="p-6">
                    {/* Category Badge Skeleton */}
                    <div className="h-6 bg-gray-200 rounded-full w-20 mb-3 animate-pulse"></div>
                    
                    {/* Title Skeleton */}
                    <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded mb-3 w-3/4 animate-pulse"></div>
                    
                    {/* Excerpt Skeleton */}
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    </div>
                    
                    {/* Meta Info Skeleton */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="h-4 w-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                      <div className="flex items-center">
                        <div className="h-4 w-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Categories Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="h-6 bg-gray-200 rounded mb-4 w-24 animate-pulse"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-6 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

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
                        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="h-6 bg-gray-200 rounded mb-4 w-16 animate-pulse"></div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
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

export default ArticleArchiveSkeleton;
