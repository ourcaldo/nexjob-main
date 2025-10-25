import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, CheckCircle, Clock, FileText, BarChart3, Settings } from 'lucide-react';
import { supabaseAdminService } from '@/services/supabaseAdminService';
import { useToast } from '@/components/ui/ToastProvider';

const SitemapManagement: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    sitemap_update_interval: 300,
    auto_generate_sitemap: true,
    last_sitemap_update: '',
    robots_txt: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const adminSettings = await supabaseAdminService.getSettings();
      if (adminSettings) {
        setSettings({
          sitemap_update_interval: adminSettings.sitemap_update_interval || 300,
          auto_generate_sitemap: adminSettings.auto_generate_sitemap ?? true,
          last_sitemap_update: adminSettings.last_sitemap_update || '',
          robots_txt: adminSettings.robots_txt || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('error', 'Failed to load sitemap settings');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const result = await supabaseAdminService.saveSettings(settings);

      if (result.success) {
        showToast('success', 'Sitemap settings saved successfully!');
      } else {
        showToast('error', result.error || 'Failed to save sitemap settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', 'Failed to save sitemap settings');
    } finally {
      setSaving(false);
    }
  };

  const forceSitemapUpdate = async () => {
    setRegenerating(true);
    try {
      const response = await fetch('/api/admin/force-sitemap-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        showToast('success', 'Sitemap regenerated successfully!');
        // Reload settings to get updated timestamp
        await loadSettings();
      } else {
        showToast('error', result.message || 'Failed to regenerate sitemap');
      }
    } catch (error) {
      console.error('Error regenerating sitemap:', error);
      showToast('error', 'Failed to regenerate sitemap');
    } finally {
      setRegenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNextUpdateTime = () => {
    if (!settings.last_sitemap_update) return 'Unknown';
    const lastUpdate = new Date(settings.last_sitemap_update);
    const nextUpdate = new Date(lastUpdate.getTime() + settings.sitemap_update_interval * 60 * 1000);
    return nextUpdate.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading sitemap settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sitemap Status */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-6 w-6 mr-3 text-primary-600" />
            Sitemap Status
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Monitor and manage your website&apos;s sitemap generation.
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Status</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {settings.auto_generate_sitemap ? 'Active' : 'Disabled'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Last Update</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(settings.last_sitemap_update)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <RefreshCw className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Next Update</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {settings.auto_generate_sitemap ? getNextUpdateTime() : 'Manual'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={forceSitemapUpdate}
              disabled={regenerating}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {regenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Force Regenerate Sitemap
            </button>
          </div>
        </div>
      </div>

      {/* Sitemap Configuration */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Settings className="h-6 w-6 mr-3 text-primary-600" />
            Sitemap Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure automatic sitemap generation settings.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="auto_generate_sitemap"
              checked={settings.auto_generate_sitemap}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-3 text-sm font-medium text-gray-700">
              Enable automatic sitemap generation
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Interval (minutes)
            </label>
            <input
              type="number"
              name="sitemap_update_interval"
              value={settings.sitemap_update_interval}
              onChange={handleInputChange}
              min="1"
              max="1440"
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              How often to automatically regenerate the sitemap (1-1440 minutes)
            </p>
          </div>
        </div>
      </div>

      {/* Robots.txt Configuration */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-3 text-primary-600" />
            Robots.txt Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure your robots.txt file content.
          </p>
        </div>

        <div className="p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Robots.txt Content
            </label>
            <textarea
              name="robots_txt"
              value={settings.robots_txt}
              onChange={handleInputChange}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              placeholder={`User-agent: *
Allow: /

# Disallow admin panel
Disallow: /admin/
Disallow: /admin

# Sitemaps
Sitemap: https://nexjob.tech/sitemap.xml`}
            />
            <p className="mt-1 text-xs text-gray-500">
              This content will be served at /robots.txt
            </p>
          </div>
        </div>
      </div>

      {/* Sitemap URLs */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Sitemap URLs</h2>
          <p className="mt-1 text-sm text-gray-600">
            Direct links to your generated sitemaps.
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Main Sitemap</span>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                /sitemap.xml
              </a>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Pages Sitemap</span>
              <a
                href="/sitemap-pages.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                /sitemap-pages.xml
              </a>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Jobs Sitemap</span>
              <a
                href="/sitemap-loker.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                /sitemap-loker.xml
              </a>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Articles Sitemap</span>
              <a
                href="/sitemap-artikel.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                /sitemap-artikel.xml
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Settings className="h-4 w-4 mr-2" />
          )}
          Save Sitemap Settings
        </button>
      </div>
    </div>
  );
};

export default SitemapManagement;