import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, AlertCircle, Loader2 } from 'lucide-react';
import { Job } from '@/types/job';
import { wpService } from '@/services/wpService';
import { bookmarkService } from '@/services/bookmarkService';
import JobCard from '@/components/JobCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateBreadcrumbSchema } from '@/utils/schemaUtils';

const BookmarkPage: React.FC = () => {
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookmarkedJobs();
  }, []);

  const loadBookmarkedJobs = async () => {
    try {
      setError(null);
      const bookmarkIds = bookmarkService.getBookmarks();
      
      if (bookmarkIds.length === 0) {
        setBookmarkedJobs([]);
        setLoading(false);
        return;
      }

      // Fetch all jobs and filter by bookmarked IDs
      const allJobsResponse = await wpService.getJobs({}, 1, 100);
      const bookmarked = allJobsResponse.jobs.filter(job => bookmarkIds.includes(job.id));
      setBookmarkedJobs(bookmarked);
    } catch (err) {
      setError('Gagal memuat lowongan yang disimpan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  

  const breadcrumbItems = [
    { label: 'Lowongan Tersimpan' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat lowongan tersimpan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Schema Markup */}
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Bookmark className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Lowongan Tersimpan</h1>
          </div>
          <p className="text-gray-600">
            {bookmarkedJobs.length > 0 
              ? `Anda memiliki ${bookmarkedJobs.length} lowongan yang disimpan`
              : 'Belum ada lowongan yang disimpan'
            }
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Content */}
        {bookmarkedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedJobs.map((job, index) => (
              <div key={job.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <JobCard 
                  job={job}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Lowongan Tersimpan</h3>
            <p className="text-gray-600 mb-6">
              Mulai simpan lowongan yang menarik untuk Anda dengan mengklik ikon bookmark
            </p>
            <Link
              href="/lowongan-kerja/"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center"
            >
              Cari Lowongan
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkPage;