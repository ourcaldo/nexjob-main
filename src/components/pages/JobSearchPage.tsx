import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Search, Filter, X, Loader2, AlertCircle } from 'lucide-react';
import { Job } from '@/types/job';
import { wpService, FilterData } from '@/services/wpService';
import { userBookmarkService } from '@/services/userBookmarkService';
import { supabase } from '@/lib/supabase';
import { useAnalytics } from '@/hooks/useAnalytics';
import JobCard from '@/components/JobCard';
import JobSidebar from '@/components/JobSidebar';
import SearchableSelect from '@/components/SearchableSelect';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface JobSearchPageProps {
  settings: any;
  initialCategory?: string;
  initialLocation?: string;
  locationType?: 'province' | 'city';
}

const JobSearchPage: React.FC<JobSearchPageProps> = ({ 
  settings, 
  initialCategory, 
  initialLocation,
  locationType = 'province'
}) => {
  const router = useRouter();
  const { trackPageView, trackSearch, trackFilterUsage } = useAnalytics();

  // Refs to prevent infinite loops
  const initialDataLoadedRef = useRef(false);
  const isSearchingRef = useRef(false);
  const currentFiltersRef = useRef<any>({});
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [displayedJobsCount, setDisplayedJobsCount] = useState(0); // Track currently displayed jobs
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);

  // Main search filters
  const [keyword, setKeyword] = useState('');
  const [selectedProvince, setSelectedProvince] = useState(initialLocation || '');

  // Sidebar filters
  const [sidebarFilters, setSidebarFilters] = useState({
    cities: initialLocation && locationType === 'city' ? [initialLocation] : [] as string[],
    jobTypes: [] as string[],
    experiences: [] as string[],
    educations: [] as string[],
    industries: [] as string[],
    workPolicies: [] as string[],
    categories: initialCategory ? [initialCategory] : [] as string[],
    salaries: [] as string[]
  });

  const [sortBy, setSortBy] = useState('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Get current filters object - memoized to prevent unnecessary recreations
  const getCurrentFilters = useCallback(() => {
    const locationFilter = initialLocation && locationType === 'province' ? initialLocation : selectedProvince;

    return {
      search: keyword,
      location: locationFilter,
      sortBy: sortBy,
      ...sidebarFilters
    };
  }, [keyword, selectedProvince, sortBy, sidebarFilters, initialLocation, locationType]);

  // Check if filters have changed
  const hasFiltersChanged = useCallback((newFilters: any) => {
    return JSON.stringify(newFilters) !== JSON.stringify(currentFiltersRef.current);
  }, []);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (initialDataLoadedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      // Load filter data
      const filterDataResult = await wpService.getFiltersData();
      setFilterData(filterDataResult);

      // Initialize filters from URL params
      const { search, location, category } = router.query;

      let initialKeyword = '';
      let initialProvince = selectedProvince;
      let initialSidebarFilters = { ...sidebarFilters };

      if (search && typeof search === 'string') {
        initialKeyword = search;
        setKeyword(search);
      }

      if (location && typeof location === 'string' && !initialLocation) {
        initialProvince = location;
        setSelectedProvince(location);
      }

      if (category && typeof category === 'string' && !initialCategory) {
        initialSidebarFilters = {
          ...initialSidebarFilters,
          categories: [category]
        };
        setSidebarFilters(initialSidebarFilters);
      }

      // Build initial filters
      const filters = {
        search: initialKeyword,
        location: initialLocation && locationType === 'province' ? initialLocation : initialProvince,
        sortBy: 'newest',
        ...initialSidebarFilters
      };

      // Store current filters
      currentFiltersRef.current = filters;

      // Load jobs
      const jobsResult = await wpService.getJobs(filters, 1, 24);

      setJobs(jobsResult.jobs);
      setCurrentPage(jobsResult.currentPage);
      setHasMore(jobsResult.hasMore);
      setTotalJobs(jobsResult.totalJobs);
      setDisplayedJobsCount(jobsResult.jobs.length); // Set initial displayed count

      initialDataLoadedRef.current = true;
    } catch (err) {
      setError('Gagal memuat data. Silakan coba lagi.');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  }, [router.query, selectedProvince, sidebarFilters, initialLocation, locationType, initialCategory]);

  // Search with filters
  const searchWithFilters = useCallback(async (filters: any, isManualSearch = false) => {
    if (isSearchingRef.current) return;

    isSearchingRef.current = true;
    setSearching(true);
    setJobs([]);
    setCurrentPage(1);
    setHasMore(true);
    setDisplayedJobsCount(0); // Reset displayed count when searching

    try {
      setError(null);

      // Track search if there's a keyword and it's a manual search
      if (filters.search && isManualSearch) {
        trackSearch(filters.search, filters.location, filters.categories[0]);
      }

      // Update URL for non-category/location pages
      if (!initialCategory && !initialLocation && isManualSearch) {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.location && filters.location !== selectedProvince) params.set('location', filters.location);

        const newUrl = `/lowongan-kerja/${params.toString() ? '?' + params.toString() : ''}`;
        router.replace(newUrl, undefined, { shallow: true });
      }

      const response = await wpService.getJobs(filters, 1, 24);
      setJobs(response.jobs);
      setCurrentPage(response.currentPage);
      setHasMore(response.hasMore);
      setTotalJobs(response.totalJobs);
      setDisplayedJobsCount(response.jobs.length); // Update displayed count with new results

      // Update current filters ref
      currentFiltersRef.current = filters;
    } catch (err) {
      setError('Gagal memuat data pekerjaan. Silakan coba lagi.');
      console.error('Search error:', err);
    } finally {
      setSearching(false);
      isSearchingRef.current = false;
    }
  }, [trackSearch, initialCategory, initialLocation, selectedProvince, router]);

  // Handle manual search (button click or enter key)
  const handleManualSearch = useCallback(async () => {
    if (!initialDataLoadedRef.current) return;

    const filters = getCurrentFilters();
    await searchWithFilters(filters, true);
  }, [searchWithFilters, getCurrentFilters]);

  // Debounced filter search
  const debouncedFilterSearch = useCallback(() => {
    if (!initialDataLoadedRef.current) return;

    const filters = getCurrentFilters();

    // Only search if filters have actually changed
    if (!hasFiltersChanged(filters)) return;

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      searchWithFilters(filters, false);
    }, 300);
  }, [searchWithFilters, getCurrentFilters, hasFiltersChanged]);

  // Load more jobs for infinite scroll
  const loadMoreJobs = useCallback(async () => {
    if (loadingMore || !hasMore || isSearchingRef.current || !initialDataLoadedRef.current) return;

    setLoadingMore(true);
    try {
      const filters = getCurrentFilters();
      const response = await wpService.getJobs(filters, currentPage + 1, 24);

      if (response.jobs.length > 0) {
        setJobs(prevJobs => [...prevJobs, ...response.jobs]);
        setCurrentPage(response.currentPage);
        setHasMore(response.hasMore);
        setDisplayedJobsCount(prevCount => prevCount + response.jobs.length); // Update displayed count
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more jobs:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMore, loadingMore, getCurrentFilters]);

  const loadUserBookmarks = useCallback(async (userId: string) => {
    try {
      const bookmarks = await userBookmarkService.getUserBookmarks(userId);
      const bookmarkSet = new Set(bookmarks.map(b => b.job_id));
      setUserBookmarks(bookmarkSet);
    } catch (error) {
      console.error('Error loading user bookmarks:', error);
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadUserBookmarks(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  }, [loadUserBookmarks]);

  useEffect(() => {
    loadInitialData();
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        loadUserBookmarks(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserBookmarks(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeAuth, loadUserBookmarks, loadInitialData]);

  // Track page view on mount
  useEffect(() => {
    trackPageView({
      page_title: document.title,
      content_group1: 'job_search',
      content_group2: initialCategory || '',
      content_group3: initialLocation || '',
    });
  }, [trackPageView, initialCategory, initialLocation]);

  // Watch for filter changes (debounced)
  useEffect(() => {
    if (!initialDataLoadedRef.current) return;

    debouncedFilterSearch();

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [debouncedFilterSearch]);

  // Infinite scroll hook
  const { isFetching, setTarget, resetFetching } = useInfiniteScroll(loadMoreJobs, {
    threshold: 0.8,
    rootMargin: '200px'
  });

  // Reset fetching state when loading more is complete
  useEffect(() => {
    if (!loadingMore && isFetching) {
      resetFetching();
    }
  }, [loadingMore, isFetching, resetFetching]);

  // Event handlers
  const handleSidebarFilterChange = useCallback((newFilters: any) => {
    setSidebarFilters(newFilters);

    // Track filter usage
    Object.entries(newFilters).forEach(([filterType, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        values.forEach(value => {
          trackFilterUsage(filterType, value);
        });
      }
    });
  }, [trackFilterUsage]);

  const handleSortChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
  }, []);

  const handleJobClick = useCallback((job: Job) => {
    // JobCard handles navigation with Link
    return;
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  }, [handleManualSearch]);

  const clearAllFilters = useCallback(() => {
    setKeyword('');
    setSelectedProvince(initialLocation && locationType === 'province' ? initialLocation : '');
    setSidebarFilters({
      cities: initialLocation && locationType === 'city' ? [initialLocation] : [],
      jobTypes: [],
      experiences: [],
      educations: [],
      industries: [],
      workPolicies: [],
      categories: initialCategory ? [initialCategory] : [],
      salaries: []
    });
    setSortBy('newest');

    if (!initialCategory && !initialLocation) {
      router.replace('/lowongan-kerja/', undefined, { shallow: true });
    }
  }, [initialLocation, locationType, initialCategory, router]);

  const getActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (keyword) count++;
    if (selectedProvince && selectedProvince !== (initialLocation && locationType === 'province' ? initialLocation : '')) count++;

    Object.entries(sidebarFilters).forEach(([key, filterArray]) => {
      if (key === 'categories' && initialCategory) {
        count += filterArray.filter(cat => cat !== initialCategory).length;
      } else if (key === 'cities' && initialLocation && locationType === 'city') {
        count += filterArray.filter(city => city !== initialLocation).length;
      } else {
        count += filterArray.length;
      }
    });
    return count;
  }, [keyword, selectedProvince, sidebarFilters, initialLocation, locationType, initialCategory]);

  const removeFilter = useCallback((filterType: string, value?: string) => {
    if (filterType === 'keyword') {
      setKeyword('');
    } else if (filterType === 'province') {
      setSelectedProvince(initialLocation && locationType === 'province' ? initialLocation : '');
      setSidebarFilters(prev => ({ ...prev, cities: initialLocation && locationType === 'city' ? [initialLocation] : [] }));
    } else if (value) {
      setSidebarFilters(prev => ({
        ...prev,
        [filterType]: prev[filterType as keyof typeof prev].filter(item => item !== value)
      }));
    }
  }, [initialLocation, locationType]);

  const getProvinceOptions = useMemo(() => {
    if (!filterData) return [];
    return Object.keys(filterData.nexjob_lokasi_provinsi).map(province => ({
      value: province,
      label: province
    }));
  }, [filterData]);

  // Show loading state while initial data loads
  if (loading) {
    return (
      <div className="bg-gray-50">
        {/* Search Section Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5">
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="lg:col-span-4">
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="lg:col-span-3">
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Sort Skeleton */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="h-4 bg-gray-200 rounded mb-3 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                {/* Filter Groups Skeleton */}
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="h-5 bg-gray-200 rounded mb-3 animate-pulse"></div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="flex items-center space-x-2">
                          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job Results Skeleton */}
            <div className="lg:col-span-3">
              {/* Results Header Skeleton */}
              <div className="mb-6">
                <div className="h-8 bg-gray-200 rounded mb-2 w-64 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
              </div>

              {/* Job Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      </div>
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
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
  }

  return (
    <div className="bg-gray-50">
      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          {/* Centered Search Form */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Keyword Search */}
              <div className="lg:col-span-5 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan skill, posisi, atau perusahaan..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>

              {/* Province Select */}
              <div className="lg:col-span-4">
                <SearchableSelect
                  options={getProvinceOptions}
                  value={selectedProvince}
                  onChange={setSelectedProvince}
                  placeholder="Semua Provinsi"
                  disabled={Boolean(initialLocation && locationType === 'province')}
                />
              </div>

              {/* Search Button */}
              <div className="lg:col-span-3">
                <button
                  onClick={handleManualSearch}
                  disabled={searching}
                  className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {searching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Cari
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mt-4 text-center">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium inline-flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter ({getActiveFiltersCount})
            </button>
          </div>

          {/* Active Filters */}
          {getActiveFiltersCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 items-center justify-center">
              <span className="text-sm text-gray-600">Filter aktif:</span>

              {keyword && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                  Keyword: {keyword}
                  <button
                    onClick={() => removeFilter('keyword')}
                    className="ml-2 hover:text-primary-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedProvince && selectedProvince !== (initialLocation && locationType === 'province' ? initialLocation : '') && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                  Provinsi: {selectedProvince}
                  <button
                    onClick={() => removeFilter('province')}
                    className="ml-2 hover:text-primary-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {/* Sidebar filters */}
              {Object.entries(sidebarFilters).map(([filterType, values]) =>
                values
                  .filter(value => {
                    if (filterType === 'categories' && initialCategory && value === initialCategory) return false;
                    if (filterType === 'cities' && initialLocation && locationType === 'city' && value === initialLocation) return false;
                    return true;
                  })
                  .map((value) => (
                    <span key={`${filterType}-${value}`} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                      {value}
                      <button
                        onClick={() => removeFilter(filterType, value)}
                        className="ml-2 hover:text-primary-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
              )}

              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Hapus Semua Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className={`lg:col-span-1 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <JobSidebar
                filters={sidebarFilters}
                selectedProvince={selectedProvince}
                sortBy={sortBy}
                onFiltersChange={handleSidebarFilterChange}
                onSortChange={handleSortChange}
                isLoading={searching}
              />
            </div>
          </div>

          {/* Job Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {searching ? 'Mencari...' : `${totalJobs.toLocaleString()} Lowongan Ditemukan`}
                </p>
                {initialCategory && (
                  <p className="text-gray-600">
                    Kategori: <span className="font-medium">{initialCategory}</span>
                  </p>
                )}
                {initialLocation && (
                  <p className="text-gray-600">
                    Lokasi: <span className="font-medium">{initialLocation}</span>
                    {locationType === 'city' && ' (Kota)'}
                    {locationType === 'province' && ' (Provinsi)'}
                  </p>
                )}
                {keyword && (
                  <p className="text-gray-600">
                    Hasil pencarian untuk &quot;<span className="font-medium">{keyword}</span>&quot;
                  </p>
                )}
              </div>
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

            {/* Job Grid */}
            {searching ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Memuat Data</h2>
                  <p className="text-gray-600">Sedang mencari lowongan kerja...</p>
                </div>
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((job, index) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      isBookmarked={userBookmarks.has(job.id)}
                      onBookmarkChange={(jobId, isBookmarked) => {
                        const newBookmarks = new Set(userBookmarks);
                        if (isBookmarked) {
                          newBookmarks.add(jobId);
                        } else {
                          newBookmarks.delete(jobId);
                        }
                        setUserBookmarks(newBookmarks);
                      }}
                    />
                  ))}
                </div>

                {/* Infinite Scroll Trigger */}
                {hasMore && (
                  <div 
                    ref={setTarget}
                    className="flex justify-center items-center py-8"
                  >
                    {loadingMore ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                        <span className="text-gray-600">Memuat lowongan lainnya...</span>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        Scroll untuk memuat lebih banyak lowongan
                      </div>
                    )}
                  </div>
                )}

                {/* End of Results */}
                {!hasMore && jobs.length > 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-500 text-sm">
                      Anda telah melihat semua {totalJobs.toLocaleString()} lowongan yang tersedia
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada lowongan ditemukan</h3>
                <p className="text-gray-600 mb-4">Coba ubah kriteria pencarian Anda</p>
                <button
                  onClick={clearAllFilters}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSearchPage;