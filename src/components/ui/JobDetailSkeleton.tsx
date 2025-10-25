
import React from 'react';

const JobDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs Skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Job Header Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="h-8 bg-gray-200 rounded mb-4 w-3/4 animate-pulse"></div>
                  <div className="flex items-center mb-4">
                    <div className="h-5 w-5 bg-gray-200 rounded mr-2 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center">
                      <div className="h-4 w-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>

              {/* Tags Skeleton */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                ))}
              </div>

              {/* Apply Buttons Skeleton */}
              <div className="flex gap-3">
                <div className="h-12 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                <div className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>

            {/* Mobile: Company Info and Job Info Cards Skeleton */}
            <div className="lg:hidden space-y-6 mb-8">
              {/* Company Info Card Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="h-6 bg-gray-200 rounded mb-4 w-40 animate-pulse"></div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 rounded mb-2 w-32 mx-auto animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-24 mx-auto animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
                </div>
              </div>

              {/* Job Info Card Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="h-6 bg-gray-200 rounded mb-4 w-40 animate-pulse"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="h-5 w-5 bg-gray-200 rounded mr-3 animate-pulse"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded mb-1 w-16 animate-pulse"></div>
                          <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Job Description Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
              <div className="h-7 bg-gray-200 rounded mb-6 w-48 animate-pulse"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                ))}
              </div>
            </div>

            {/* Related Jobs Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="h-7 bg-gray-200 rounded mb-6 w-40 animate-pulse"></div>
              <div className="grid grid-cols-1 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      </div>
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Sidebar Skeleton */}
          <div className="hidden lg:block space-y-6">
            {/* Company Info Card Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="h-6 bg-gray-200 rounded mb-4 w-40 animate-pulse"></div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded mb-2 w-32 mx-auto animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-24 mx-auto animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
              </div>
            </div>

            {/* Job Info Card Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="h-6 bg-gray-200 rounded mb-4 w-40 animate-pulse"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="h-5 w-5 bg-gray-200 rounded mr-3 animate-pulse"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded mb-1 w-16 animate-pulse"></div>
                        <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailSkeleton;
