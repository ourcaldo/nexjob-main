import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, GraduationCap, Building, Users, Filter, MapPin, ChevronDown, ChevronUp, Star, Zap, DollarSign } from 'lucide-react';
import { wpService, FilterData } from '@/services/wpService';

interface JobSidebarProps {
  filters: {
    cities: string[];
    jobTypes: string[];
    experiences: string[];
    educations: string[];
    industries: string[];
    workPolicies: string[];
    categories: string[];
    salaries: string[];
  };
  selectedProvince: string;
  sortBy: string;
  onFiltersChange: (filters: any) => void;
  onSortChange: (sortBy: string) => void;
  isLoading: boolean;
}

const JobSidebar: React.FC<JobSidebarProps> = ({ 
  filters, 
  selectedProvince, 
  sortBy,
  onFiltersChange, 
  onSortChange,
  isLoading 
}) => {
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sort: true,
    cities: true,
    categories: true,
    jobTypes: true,
    experiences: true,
    educations: true,
    industries: true,
    workPolicies: true,
    salaries: true
  });

  useEffect(() => {
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
      const data = await wpService.getFiltersData();
      setFilterData(data);
    } catch (error) {
      console.error('Failed to load filter data:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    const currentValues = filters[filterType as keyof typeof filters] || [];
    let newValues;

    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(item => item !== value);
    }

    const newFilters = {
      ...filters,
      [filterType]: newValues
    };

    onFiltersChange(newFilters);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getAllCities = () => {
    if (!filterData) return [];
    
    // If province is selected, return cities for that province
    if (selectedProvince && filterData.nexjob_lokasi_provinsi[selectedProvince]) {
      return filterData.nexjob_lokasi_provinsi[selectedProvince];
    }
    
    // Otherwise, return all cities from all provinces
    const allCities: string[] = [];
    Object.values(filterData.nexjob_lokasi_provinsi).forEach(cities => {
      allCities.push(...cities);
    });
    
    // Remove duplicates and sort
    return [...new Set(allCities)].sort();
  };

  const renderSortSection = () => {
    const isExpanded = expandedSections.sort;
    
    return (
      <div className="border-b border-gray-100 pb-6">
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={() => toggleSection('sort')}
        >
          <div className="flex items-center">
            <Star className="h-4 w-4 text-gray-400 mr-2" />
            <label className="text-sm font-medium text-gray-700">Prioritaskan</label>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {isExpanded && (
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="sortBy"
                value="newest"
                checked={sortBy === 'newest'}
                onChange={(e) => onSortChange(e.target.value)}
                disabled={isLoading}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 focus:ring-2 disabled:opacity-50"
              />
              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 flex items-center">
                <Zap className="h-3 w-3 mr-1 text-green-500" />
                Baru Ditambahkan
              </span>
            </label>
            <label className="flex items-center cursor-pointer group opacity-50">
              <input
                type="radio"
                name="sortBy"
                value="relevant"
                checked={sortBy === 'relevant'}
                onChange={(e) => onSortChange(e.target.value)}
                disabled={true}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 focus:ring-2 disabled:opacity-50"
              />
              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 flex items-center">
                <Star className="h-3 w-3 mr-1 text-orange-500" />
                Paling Relevan
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                  Coming Soon
                </span>
              </span>
            </label>
          </div>
        )}
      </div>
    );
  };

  const renderCheckboxGroup = (
    title: string,
    icon: React.ReactNode,
    filterKey: string,
    options: string[]
  ) => {
    const isExpanded = expandedSections[filterKey];
    const hasScrollbar = options.length > 15;

    return (
      <div className="border-b border-gray-100 pb-6 last:border-b-0">
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={() => toggleSection(filterKey)}
        >
          <div className="flex items-center">
            {icon}
            <label className="text-sm font-medium text-gray-700 ml-2">{title}</label>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {isExpanded && (
          <div className={`space-y-2 ${hasScrollbar ? 'max-h-60 overflow-y-auto' : ''}`}>
            {options.map((option) => (
              <label key={option} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters[filterKey as keyof typeof filters]?.includes(option) || false}
                  onChange={(e) => handleFilterChange(filterKey, option, e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50"
                />
                <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 disabled:opacity-50">
                  {option}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loadingFilters) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-32">
        <div className="flex items-center mb-6">
          <Filter className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Filter Pencarian</h2>
        </div>
        <div className="space-y-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded"></div>
                <div className="h-3 bg-gray-100 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-32">
      <div className="flex items-center mb-6">
        <Filter className="h-5 w-5 text-primary-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Filter Pencarian</h2>
      </div>

      <div className="space-y-6">
        {/* Sort Section */}
        {renderSortSection()}

        {/* Cities Filter - Always show all cities */}
        {getAllCities().length > 0 && (
          renderCheckboxGroup(
            'Kota',
            <MapPin className="h-4 w-4 text-gray-400" />,
            'cities',
            getAllCities()
          )
        )}

        {/* Job Categories */}
        {filterData?.nexjob_kategori_pekerjaan && (
          renderCheckboxGroup(
            'Kategori Pekerjaan',
            <Briefcase className="h-4 w-4 text-gray-400" />,
            'categories',
            filterData.nexjob_kategori_pekerjaan
          )
        )}

        {/* Job Types */}
        {filterData?.nexjob_tipe_pekerjaan && (
          renderCheckboxGroup(
            'Tipe Pekerjaan',
            <Briefcase className="h-4 w-4 text-gray-400" />,
            'jobTypes',
            filterData.nexjob_tipe_pekerjaan
          )
        )}

        {/* Salary Filter */}
        {filterData?.nexjob_gaji && (
          renderCheckboxGroup(
            'Gaji',
            <DollarSign className="h-4 w-4 text-gray-400" />,
            'salaries',
            filterData.nexjob_gaji
          )
        )}

        {/* Experience */}
        {filterData?.nexjob_pengalaman_kerja && (
          renderCheckboxGroup(
            'Pengalaman',
            <Clock className="h-4 w-4 text-gray-400" />,
            'experiences',
            filterData.nexjob_pengalaman_kerja
          )
        )}

        {/* Education */}
        {filterData?.nexjob_pendidikan && (
          renderCheckboxGroup(
            'Pendidikan',
            <GraduationCap className="h-4 w-4 text-gray-400" />,
            'educations',
            filterData.nexjob_pendidikan
          )
        )}

        {/* Industries */}
        {filterData?.nexjob_industri && (
          renderCheckboxGroup(
            'Industri',
            <Building className="h-4 w-4 text-gray-400" />,
            'industries',
            filterData.nexjob_industri
          )
        )}

        {/* Work Policies */}
        {filterData?.nexjob_kebijakan_kerja && (
          renderCheckboxGroup(
            'Kebijakan Kerja',
            <Users className="h-4 w-4 text-gray-400" />,
            'workPolicies',
            filterData.nexjob_kebijakan_kerja
          )
        )}
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => {
          onFiltersChange({
            cities: [],
            jobTypes: [],
            experiences: [],
            educations: [],
            industries: [],
            workPolicies: [],
            categories: [],
            salaries: []
          });
          onSortChange('newest');
        }}
        disabled={isLoading}
        className="w-full mt-6 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
      >
        Reset Filter
      </button>
    </div>
  );
};

export default JobSidebar;