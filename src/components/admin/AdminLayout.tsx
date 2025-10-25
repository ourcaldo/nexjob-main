import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Settings, 
  Globe, 
  FileText, 
  Users, 
  BarChart3, 
  Menu, 
  X, 
  LogOut,
  Search,
  Bell,
  User,
  Link2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Briefcase
} from 'lucide-react';
import { supabaseAdminService } from '@/services/supabaseAdminService';
import { useToast } from '@/components/ui/ToastProvider';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPage }) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [cmsExpanded, setCmsExpanded] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCmsOpen, setIsCmsOpen] = useState(currentPage === 'cms' || currentPage.startsWith('cms-'));

  const checkAuth = useCallback(async () => {
    try {
      const profile = await supabaseAdminService.getCurrentProfile();
      if (!profile || profile.role !== 'super_admin') {
        router.push('/login/');
        return;
      }
      setProfile(profile);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await supabaseAdminService.signOut();
      showToast('success', 'Logged out successfully');
      router.push('/');
    } catch (error) {
      showToast('error', 'Logout failed');
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/backend/admin/', icon: LayoutDashboard, current: currentPage === 'dashboard' },
    { 
      name: 'CMS', 
      href: '/backend/admin/cms', 
      icon: Edit3, 
      current: currentPage === 'cms',
      hasSubmenu: true,
      submenu: [
        { name: 'Articles', href: '/backend/admin/cms?type=articles', icon: FileText },
        { name: 'Pages', href: '/backend/admin/cms?type=pages', icon: FileText },
        { name: 'Lowongan Kerja', href: '/backend/admin/cms?type=jobs', icon: Users }
      ]
    },
    { name: 'SEO Settings', href: '/backend/admin/seo', icon: FileText, current: currentPage === 'seo' },
    { name: 'Advertisement', href: '/backend/admin/advertisement', icon: Globe, current: currentPage === 'advertisement' },
    { name: 'Sitemap Management', href: '/backend/admin/sitemap', icon: BarChart3, current: currentPage === 'sitemap' },
    { name: 'Integration', href: '/backend/admin/integration', icon: Link2, current: currentPage === 'integration' },
    { name: 'User Management', href: '/backend/admin/users', icon: Users, current: currentPage === 'users' },
    { name: 'System Settings', href: '/backend/admin/system', icon: Settings, current: currentPage === 'system' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />

        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition ease-in-out duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  Nex<span className="text-primary-600">job</span> Admin
                </span>
              </div>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.hasSubmenu ? (
                    <div>
                      <button
                        onClick={() => setCmsExpanded(!cmsExpanded)}
                        className={`group w-full flex items-center justify-between px-2 py-2 text-base font-medium rounded-md ${
                          item.current
                            ? 'bg-primary-100 text-primary-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center">
                          <item.icon className={`mr-4 h-6 w-6 ${item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                          {item.name}
                        </div>
                        {cmsExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      {cmsExpanded && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.submenu?.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                            >
                              <subItem.icon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                        item.current
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`mr-4 h-6 w-6 ${item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'} select-none ${sidebarCollapsed ? 'pointer-events-auto' : ''}`}>
        <div className={`flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white ${sidebarCollapsed ? 'overflow-hidden' : ''}`}>
          <div className={`flex-1 flex flex-col pt-5 pb-4 ${sidebarCollapsed ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <div className={`flex items-center flex-shrink-0 ${sidebarCollapsed ? 'px-2 justify-center' : 'px-4'} ${sidebarCollapsed ? 'cursor-default' : ''}`}>
              <div className={`flex items-center ${sidebarCollapsed ? 'space-x-0' : 'space-x-2'}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <Search className="h-5 w-5 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <span className="text-xl font-bold text-gray-900">
                    Nex<span className="text-primary-600">job</span> Admin
                  </span>
                )}
              </div>
            </div>

            <nav className={`mt-8 flex-1 space-y-1 ${sidebarCollapsed ? 'px-2 overflow-x-hidden' : 'px-2'}`}>
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.hasSubmenu && !sidebarCollapsed ? (
                    <div>
                      <button
                        onClick={() => setCmsExpanded(!cmsExpanded)}
                        className={`group w-full flex items-center justify-between py-2 px-2 text-sm font-medium rounded-md ${
                          item.current
                            ? 'bg-primary-100 text-primary-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center">
                          <item.icon className={`h-5 w-5 mr-3 ${item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                          {item.name}
                        </div>
                        {cmsExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      {cmsExpanded && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.submenu?.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                            >
                              <subItem.icon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`group flex items-center py-2 text-sm font-medium rounded-md relative ${
                        sidebarCollapsed ? 'px-2 justify-center w-12 mx-auto' : 'px-2'
                      } ${
                        item.current
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } ${sidebarCollapsed ? 'select-none overflow-hidden' : ''}`}
                      title={sidebarCollapsed ? item.name : ''}
                      draggable={false}
                    >
                      <item.icon className={`h-5 w-5 ${sidebarCollapsed ? 'mr-0' : 'mr-3'} ${item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'} ${sidebarCollapsed ? 'flex-shrink-0' : ''}`} />
                      {!sidebarCollapsed && item.name}

                      {/* Tooltip for collapsed state */}
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Collapse Toggle Button - Moved to bottom */}
            <div className={`${sidebarCollapsed ? 'px-2' : 'px-4'} pb-2`}>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-full flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Top navigation */}
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-semibold text-gray-900 capitalize">
                  {currentPage === 'dashboard' ? 'Dashboard' : currentPage.replace('-', ' ')}
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <Bell className="h-5 w-5" />
                </button>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">
                      {profile?.full_name || 'Admin'}
                    </div>
                    <div className="text-xs text-gray-500">Super Admin</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;