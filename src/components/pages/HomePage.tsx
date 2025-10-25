import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { Search, TrendingUp, ArrowRight, Users, Building, Code, Heart, Calculator, Truck, Briefcase } from 'lucide-react';
import { wpService, FilterData } from '@/services/wpService';
import { userBookmarkService } from '@/services/userBookmarkService';
import { supabase } from '@/lib/supabase';
import { adminService } from '@/services/adminService';
import SearchableSelect from '@/components/SearchableSelect';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateWebsiteSchema, generateOrganizationSchema } from '@/utils/schemaUtils';
import { Job } from '@/types/job';
import JobCard from '@/components/JobCard';

interface HomePageProps {
  initialArticles: any[];
  initialFilterData: FilterData | null;
  settings: any;
}

const HomePage: React.FC<HomePageProps> = ({ initialArticles, initialFilterData, settings }) => {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [articles, setArticles] = useState<any[]>(initialArticles || []);
  const [filterData, setFilterData] = useState<FilterData | null>(initialFilterData);
  const [jobCategories, setJobCategories] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Load filter data if not provided initially
    if (!filterData) {
      loadFilterData();
    } else {
      // Extract job categories from filter data
      if (filterData.nexjob_kategori_pekerjaan) {
        setJobCategories(filterData.nexjob_kategori_pekerjaan.slice(0, 9));
      }
    }
  }, [filterData]);

  const loadFilterData = async () => {
    try {
      const data = await wpService.getFiltersData();
      setFilterData(data);
      if (data.nexjob_kategori_pekerjaan) {
        setJobCategories(data.nexjob_kategori_pekerjaan.slice(0, 9));
      }
    } catch (error) {
      console.error('Error loading filter data:', error);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchKeyword) params.set('search', searchKeyword);
    if (selectedLocation) params.set('location', selectedLocation);

    // Navigate to jobs page in new tab
    const url = `/lowongan-kerja/?${params.toString()}`;
    window.open(url, '_blank');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getProvinceOptions = () => {
    if (!filterData) return [];
    return Object.keys(filterData.nexjob_lokasi_provinsi).map(province => ({
      value: province,
      label: province
    }));
  };

  const getCategoryUrl = (category: string) => {
    // Create URL-friendly slug by removing special characters and converting to lowercase
    const slug = category
      .toLowerCase()
      .replace(/[&]/g, '') // Remove & symbol
      .replace(/[^a-z0-9\s]/g, '') // Remove other special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    return `/lowongan-kerja/kategori/${slug}/`;
  };

  const getArticleUrl = (articleSlug: string) => {
    return `/artikel/${articleSlug}/`;
  };

  // Generic icon component for categories
  const CategoryIcon = () => (
    <Briefcase className="h-6 w-6 text-white" />
  );

    // Dummy function to simulate loading jobs (replace with actual data fetching)
    const loadData = async () => {
      setLoading(true);
      // Simulate fetching job data
      const jobData: Job[] = [
          {
            id: '1',
            slug: 'software-engineer-jakarta',
            title: 'Software Engineer',
            content: 'Lowongan Software Engineer di Jakarta',
            company_name: 'PT. Teknologi Maju',
            kategori_pekerjaan: 'Teknologi Informasi',
            lokasi_provinsi: 'DKI Jakarta',
            lokasi_kota: 'Jakarta',
            tipe_pekerjaan: 'Full Time',
            pendidikan: 'S1',
            industry: 'Teknologi Informasi',
            pengalaman: '2-3 Tahun',
            tag: 'Software Engineer, Programming',
            gender: 'Laki-Laki atau Perempuan',
            gaji: 'Rp 8-12 Juta',
            kebijakan_kerja: 'Hybrid Working',
            link: '#',
            sumber_lowongan: 'Nexjob',
            created_at: new Date().toISOString(),
            seo_title: 'Software Engineer Jakarta',
            seo_description: 'Lowongan Software Engineer di Jakarta',
            _id: { $oid: '1' },
            id_obj: { $numberInt: '1' }
          },
          {
            id: '2',
            slug: 'data-scientist-bandung',
            title: 'Data Scientist',
            content: 'Lowongan Data Scientist di Bandung',
            company_name: 'PT. Analytics Solutions',
            kategori_pekerjaan: 'Data Science',
            lokasi_provinsi: 'Jawa Barat',
            lokasi_kota: 'Bandung',
            tipe_pekerjaan: 'Full Time',
            pendidikan: 'S1',
            industry: 'Teknologi Informasi',
            pengalaman: '2-4 Tahun',
            tag: 'Data Science, Analytics',
            gender: 'Laki-Laki atau Perempuan',
            gaji: 'Rp 10-15 Juta',
            kebijakan_kerja: 'Remote Working',
            link: '#',
            sumber_lowongan: 'Nexjob',
            created_at: new Date().toISOString(),
            seo_title: 'Data Scientist Bandung',
            seo_description: 'Lowongan Data Scientist di Bandung',
            _id: { $oid: '2' },
            id_obj: { $numberInt: '2' }
          },
          {
            id: '3',
            slug: 'web-developer-surabaya',
            title: 'Web Developer',
            content: 'Lowongan Web Developer di Surabaya',
            company_name: 'PT. Digital Creative',
            kategori_pekerjaan: 'Web Development',
            lokasi_provinsi: 'Jawa Timur',
            lokasi_kota: 'Surabaya',
            tipe_pekerjaan: 'Full Time',
            pendidikan: 'D3',
            industry: 'Teknologi Informasi',
            pengalaman: '1-2 Tahun',
            tag: 'Web Development, Frontend',
            gender: 'Laki-Laki atau Perempuan',
            gaji: 'Rp 6-10 Juta',
            kebijakan_kerja: 'On-site Working',
            link: '#',
            sumber_lowongan: 'Nexjob',
            created_at: new Date().toISOString(),
            seo_title: 'Web Developer Surabaya',
            seo_description: 'Lowongan Web Developer di Surabaya',
            _id: { $oid: '3' },
            id_obj: { $numberInt: '3' }
          },
          {
            id: '4',
            slug: 'mobile-developer-medan',
            title: 'Mobile Developer',
            content: 'Lowongan Mobile Developer di Medan',
            company_name: 'PT. Mobile Apps',
            kategori_pekerjaan: 'Mobile Development',
            lokasi_provinsi: 'Sumatera Utara',
            lokasi_kota: 'Medan',
            tipe_pekerjaan: 'Full Time',
            pendidikan: 'S1',
            industry: 'Teknologi Informasi',
            pengalaman: '2-3 Tahun',
            tag: 'Mobile Development, React Native',
            gender: 'Laki-Laki atau Perempuan',
            gaji: 'Rp 7-11 Juta',
            kebijakan_kerja: 'Hybrid Working',
            link: '#',
            sumber_lowongan: 'Nexjob',
            created_at: new Date().toISOString(),
            seo_title: 'Mobile Developer Medan',
            seo_description: 'Lowongan Mobile Developer di Medan',
            _id: { $oid: '4' },
            id_obj: { $numberInt: '4' }
          },
          {
            id: '5',
            slug: 'ui-ux-designer-makassar',
            title: 'UI/UX Designer',
            content: 'Lowongan UI/UX Designer di Makassar',
            company_name: 'PT. Design Studio',
            kategori_pekerjaan: 'Design',
            lokasi_provinsi: 'Sulawesi Selatan',
            lokasi_kota: 'Makassar',
            tipe_pekerjaan: 'Full Time',
            pendidikan: 'S1',
            industry: 'Creative Agency',
            pengalaman: '1-3 Tahun',
            tag: 'UI/UX Design, Figma',
            gender: 'Laki-Laki atau Perempuan',
            gaji: 'Rp 5-9 Juta',
            kebijakan_kerja: 'Remote Working',
            link: '#',
            sumber_lowongan: 'Nexjob',
            created_at: new Date().toISOString(),
            seo_title: 'UI/UX Designer Makassar',
            seo_description: 'Lowongan UI/UX Designer di Makassar',
            _id: { $oid: '5' },
            id_obj: { $numberInt: '5' }
          },
          {
            id: '6',
            slug: 'product-manager-palembang',
            title: 'Product Manager',
            content: 'Lowongan Product Manager di Palembang',
            company_name: 'PT. Product Innovation',
            kategori_pekerjaan: 'Product Management',
            lokasi_provinsi: 'Sumatera Selatan',
            lokasi_kota: 'Palembang',
            tipe_pekerjaan: 'Full Time',
            pendidikan: 'S1',
            industry: 'Teknologi Informasi',
            pengalaman: '3-5 Tahun',
            tag: 'Product Management, Strategy',
            gender: 'Laki-Laki atau Perempuan',
            gaji: 'Rp 12-18 Juta',
            kebijakan_kerja: 'Hybrid Working',
            link: '#',
            sumber_lowongan: 'Nexjob',
            created_at: new Date().toISOString(),
            seo_title: 'Product Manager Palembang',
            seo_description: 'Lowongan Product Manager di Palembang',
            _id: { $oid: '6' },
            id_obj: { $numberInt: '6' }
          }
      ];
      setJobs(jobData);
      setLoading(false);
  };

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
    loadData();
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await loadUserBookmarks(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserBookmarks(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeAuth, loadUserBookmarks]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Schema Markup */}
      <SchemaMarkup schema={generateWebsiteSchema(settings)} />
      <SchemaMarkup schema={generateOrganizationSchema()} />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Temukan Karir Impianmu
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              {settings.siteDescription}
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Keyword Search */}
                <div className="md:col-span-6 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan skill, posisi, atau perusahaan..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900 text-lg"
                  />
                </div>

                {/* Location Select */}
                <div className="md:col-span-4">
                  <SearchableSelect
                    options={getProvinceOptions()}
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    placeholder="Semua Provinsi"
                    className="text-lg"
                  />
                </div>

                {/* Search Button */}
                <div className="md:col-span-2">
                  <button
                    onClick={handleSearch}
                    className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Cari
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-8 py-4 text-center">
              <span className="text-3xl font-bold block">10,000+</span>
              <span className="text-primary-100">Lowongan Aktif</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-8 py-4 text-center">
              <span className="text-3xl font-bold block">2,500+</span>
              <span className="text-primary-100">Perusahaan</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-8 py-4 text-center">
              <span className="text-3xl font-bold block">50,000+</span>
              <span className="text-primary-100">Pencari Kerja</span>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Kategori Pekerjaan Populer</h2>
          <p className="text-xl text-gray-600">Temukan pekerjaan berdasarkan kategori yang paling diminati</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobCategories.map((category, index) => {
            const categoryUrl = getCategoryUrl(category);

            return (
              <a
                key={index}
                href={categoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group hover:border-primary-200 block"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <CategoryIcon />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {category}
                </h3>
                <p className="text-gray-600 mb-4">Lihat semua lowongan</p>
                <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                  Lihat Lowongan
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Jobs Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Lowongan Kerja Terbaru</h2>
          <p className="text-xl text-gray-600">Temukan posisi yang sesuai dengan keahlian dan minat Anda</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <p>Loading jobs...</p>
          ) : (
            jobs.slice(0, 6).map((job) => (
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
            ))
          )}
        </div>

        <div className="text-center mt-12">
          <a
            href="/lowongan-kerja/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium inline-flex items-center"
          >
            Lihat Semua Lowongan
            <ArrowRight className="h-4 w-4 ml-2" />
          </a>
        </div>
      </div>

      {/* Articles Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tips & Panduan Karir</h2>
            <p className="text-xl text-gray-600">Artikel terbaru untuk membantu perjalanan karir Anda</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {articles.map((article, index) => {
              const articleUrl = getArticleUrl(article.slug);

              return (
                <a
                  key={article.id}
                  href={articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group block"
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {article.title.rendered}
                    </h3>
                    <div
                      className="text-gray-600 mb-4 line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: article.excerpt.rendered }}
                    />
                    <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                      Baca Selengkapnya
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <a
              href="/artikel/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium inline-flex items-center"
            >
              Lihat Semua Artikel
              <ArrowRight className="h-4 w-4 ml-2" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;