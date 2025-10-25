
import React from 'react';

const JobArchiveSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs Skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>

        {/* Page Header Skeleton */}
        <div className="text-center mb-12">
          <div className="h-10 bg-gray-200 rounded mb-4 w-96 mx-auto animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-80 mx-auto animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            {/* Search Form Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="h-6 bg-gray-200 rounded mb-4 w-32 animate-pulse"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded mb-2 w-20 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Quick Filters Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="h-6 bg-gray-200 rounded mb-4 w-28 animate-pulse"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="lg:col-span-3">
            {/* Results Header Skeleton */}
            <div className="mb-6">
              <div className="h-8 bg-gray-200 rounded mb-2 w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>

            {/* Job Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <div className="h-4 w-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobArchiveSkeleton;
