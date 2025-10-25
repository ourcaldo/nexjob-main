import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Briefcase, 
  TrendingUp, 
  Globe, 
  Calendar,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabaseAdminService } from '@/services/supabaseAdminService';
import { wpService } from '@/services/wpService';

interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  totalArticles: number;
  totalBookmarks: number;
  recentActivity: any[];
  systemStatus: {
    wordpress: boolean;
    supabase: boolean;
    lastSitemapUpdate: string;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalJobs: 0,
    totalArticles: 0,
    totalBookmarks: 0,
    recentActivity: [],
    systemStatus: {
      wordpress: false,
      supabase: false,
      lastSitemapUpdate: ''
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load settings to get last sitemap update
      const settings = await supabaseAdminService.getSettings();
      
      // Test WordPress connection
      const wpTest = await wpService.testConnection();
      
      // Test filters API
      const filtersTest = await wpService.testFiltersConnection();
      
      // Get basic stats (mock data for now - you can implement real queries)
      const mockStats = {
        totalUsers: 1250,
        totalJobs: 3420,
        totalArticles: 156,
        totalBookmarks: 892,
        recentActivity: [
          { type: 'user_signup', message: 'New user registered', time: '2 minutes ago' },
          { type: 'job_posted', message: 'New job posted by PT. Tech Indonesia', time: '15 minutes ago' },
          { type: 'article_published', message: 'New article: "Tips Interview Success"', time: '1 hour ago' },
          { type: 'system_update', message: 'Sitemap updated successfully', time: '2 hours ago' },
        ],
        systemStatus: {
          wordpress: wpTest.success && filtersTest.success,
          supabase: true,
          lastSitemapUpdate: settings?.last_sitemap_update || new Date().toISOString()
        }
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }: any) => (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
              <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <div className="text-sm font-medium text-gray-500">{title}</div>
            <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
            {trend && (
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                {trend}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg shadow-sm">
        <div className="px-6 py-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to Nexjob Admin</h2>
          <p className="text-primary-100">
            Monitor your job portal performance and manage system settings from this dashboard.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend="+12% from last month"
          color="blue"
        />
        <StatCard
          title="Active Jobs"
          value={stats.totalJobs}
          icon={Briefcase}
          trend="+8% from last month"
          color="green"
        />
        <StatCard
          title="Published Articles"
          value={stats.totalArticles}
          icon={FileText}
          trend="+5% from last month"
          color="purple"
        />
        <StatCard
          title="Total Bookmarks"
          value={stats.totalBookmarks}
          icon={Activity}
          trend="+15% from last month"
          color="orange"
        />
      </div>

      {/* System Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              System Status
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">WordPress API</span>
              <div className="flex items-center">
                {stats.systemStatus.wordpress ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className={`text-sm ${stats.systemStatus.wordpress ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.systemStatus.wordpress ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Supabase Database</span>
              <div className="flex items-center">
                {stats.systemStatus.supabase ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className={`text-sm ${stats.systemStatus.supabase ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.systemStatus.supabase ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                Last sitemap update: {formatDate(stats.systemStatus.lastSitemapUpdate)}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Globe className="h-6 w-6 text-primary-600 mb-2" />
              <div className="font-medium text-gray-900">Update WordPress Settings</div>
              <div className="text-sm text-gray-500">Configure API connections</div>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <FileText className="h-6 w-6 text-green-600 mb-2" />
              <div className="font-medium text-gray-900">Generate Sitemap</div>
              <div className="text-sm text-gray-500">Force sitemap regeneration</div>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Users className="h-6 w-6 text-purple-600 mb-2" />
              <div className="font-medium text-gray-900">Manage Users</div>
              <div className="text-sm text-gray-500">View and manage user accounts</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;