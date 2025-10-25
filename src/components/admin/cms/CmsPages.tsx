import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  FileText, 
  Calendar, 
  User, 
  Tag,
  Folder,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Briefcase,
  BarChart3,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { cmsPageService } from '@/services/cmsPageService';
import { cmsArticleService } from '@/services/cmsArticleService';
import { NxdbPage, NxdbArticle } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';
import { formatDistance } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

type ContentType = 'articles' | 'pages' | 'jobs';

const CmsPages: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    articles: false,
    pages: true,
    jobs: false
  });

  // Initialize activeContentType from URL parameter
  const getInitialContentType = (): ContentType => {
    const type = router.query.type as string;
    if (type === 'articles' || type === 'pages' || type === 'jobs') {
      return type as ContentType;
    }
    return 'pages'; // default fallback
  };

  const [activeContentType, setActiveContentType] = useState<ContentType>(getInitialContentType());

  // Pages state
  const [pages, setPages] = useState<NxdbPage[]>([]);
  const [pageStats, setPageStats] = useState({
    total: 0, published: 0, draft: 0, trash: 0, scheduled: 0
  });

  // Articles state
  const [articles, setArticles] = useState<NxdbArticle[]>([]);
  const [articleStats, setArticleStats] = useState({
    total: 0, published: 0, draft: 0, trash: 0, scheduled: 0
  });

  // Jobs state (placeholder for future implementation)
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobStats, setJobStats] = useState({
    total: 0, published: 0, draft: 0, trash: 0, scheduled: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    limit: 10,
    offset: 0
  });

  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeContentType === 'pages') {
        const [pagesData, stats] = await Promise.all([
          cmsPageService.getPages(filters),
          cmsPageService.getPageStats()
        ]);
        setPages(pagesData.pages);
        setPageStats(stats);
        setTotal(pagesData.total);
      } else if (activeContentType === 'articles') {
        const [articlesData, stats] = await Promise.all([
          cmsArticleService.getArticles(filters),
          cmsArticleService.getArticleStats()
        ]);
        setArticles(articlesData.articles);
        setArticleStats(stats);
        setTotal(articlesData.total);
      } else if (activeContentType === 'jobs') {
        // For now, just set empty data until jobs functionality is implemented
        setJobs([]);
        setJobStats({ total: 0, published: 0, draft: 0, trash: 0, scheduled: 0 });
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [activeContentType, filters, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update activeContentType when URL query changes
  useEffect(() => {
    const type = router.query.type as string;
    if (type === 'articles' || type === 'pages' || type === 'jobs') {
      setActiveContentType(type as ContentType);
    } else if (router.isReady && !type) {
      // Default to pages if no type is specified
      setActiveContentType('pages');
    }
  }, [router.query.type, router.isReady]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleContentTypeChange = (type: ContentType) => {
    setActiveContentType(type);
    setFilters(prev => ({ ...prev, offset: 0 }));

    // Update URL to reflect the content type
    router.push({
      pathname: router.pathname,
      query: { ...router.query, type }
    }, undefined, { shallow: true });
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status: status === filters.status ? '' : status, offset: 0 }));
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, offset: 0 }));
  };

  const handleEdit = (id: string) => {
    if (activeContentType === 'pages') {
      router.push(`/backend/admin/cms/pages/edit/${id}`);
    } else if (activeContentType === 'articles') {
      router.push(`/backend/admin/cms/articles/edit/${id}`);
    } else if (activeContentType === 'jobs') {
      showToast('info', 'Jobs CMS functionality is under development');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      let result;
      if (activeContentType === 'pages') {
        result = await cmsPageService.deletePage(id);
      } else if (activeContentType === 'articles') {
        result = await cmsArticleService.deleteArticle(id);
      } else if (activeContentType === 'jobs') {
        showToast('info', 'Jobs CMS functionality is under development');
        return;
      }

      if (result?.success) {
        showToast('success', 'Item deleted successfully');
        loadData();
      } else {
        showToast('error', result?.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('error', 'Failed to delete item');
    }
  };

  const handleCreateNew = () => {
    if (activeContentType === 'pages') {
      router.push('/backend/admin/cms/pages/new');
    } else if (activeContentType === 'articles') {
      router.push('/backend/admin/cms/articles/new');
    } else if (activeContentType === 'jobs') {
      router.push('/backend/admin/cms/jobs/new');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'trash': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStats = () => {
    const stats = activeContentType === 'pages' ? pageStats : 
                  activeContentType === 'articles' ? articleStats : jobStats;
    return (
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Published</p>
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            </div>
            <Eye className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Draft</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
            </div>
            <Edit className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Trash</p>
              <p className="text-2xl font-bold text-red-600">{stats.trash}</p>
            </div>
            <Trash2 className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const items = activeContentType === 'pages' ? pages : 
                  activeContentType === 'articles' ? articles : jobs;

    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mb-4">
            {activeContentType === 'pages' ? (
              <FileText className="h-12 w-12 text-gray-400 mx-auto" />
            ) : (
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeContentType === 'jobs' ? 'Jobs CMS Under Development' : `No ${activeContentType} found`}
          </h3>
          <p className="text-gray-500 mb-4">
            {activeContentType === 'jobs' 
              ? 'Jobs CMS functionality is currently under development. Please check back later.' 
              : `Get started by creating your first ${activeContentType.slice(0, -1)}.`
            }
          </p>
          {activeContentType !== 'jobs' && (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create {activeContentType === 'pages' ? 'Page' : 'Article'}
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {activeContentType === 'pages' ? (
                          <FileText className="h-5 w-5 text-gray-400" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          /{item.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.author?.full_name || item.author?.email || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.categories?.map((cat: any) => cat.name).join(', ') || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistance(new Date(item.updated_at), new Date(), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(item.id)}
                          className="text-primary-600 hover:text-primary-900 p-1"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {item.status === 'published' && (
                          <a
                            href={getPreviewUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        )}

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const getPreviewUrl = (item: any) => {
    if (activeContentType === 'pages') {
      return `/${item.slug}`;
    } else if (activeContentType === 'articles') {
      // Get primary category for article URL structure
      const primaryCategory = item.categories?.[0];
      const categorySlug = primaryCategory?.slug || 'uncategorized';
      return `/artikel/${categorySlug}/${item.slug}`;
    }
    return '#';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Content Management</h1>
        <p className="text-gray-600">Manage your website content including articles, pages, and job listings.</p>
      </div>

      <div>
        {/* Main Content */}
        <div>
          {/* Stats */}
          {renderStats()}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleStatusFilter('published')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filters.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Published
                  </button>
                  <button
                    onClick={() => handleStatusFilter('draft')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filters.status === 'draft' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    onClick={() => handleStatusFilter('scheduled')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filters.status === 'scheduled' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Scheduled
                  </button>
                </div>
              </div>

              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New {activeContentType === 'pages' ? 'Page' : activeContentType === 'articles' ? 'Article' : 'Job'}
              </button>
            </div>
          </div>

          {/* Content */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CmsPages;