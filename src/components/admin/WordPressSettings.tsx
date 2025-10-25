import React, { useState, useEffect, useCallback } from 'react';
import { Save, TestTube, Loader2, CheckCircle, XCircle, Globe, Key } from 'lucide-react';
import { supabaseAdminService } from '@/services/supabaseAdminService';
import { wpService } from '@/services/wpService';
import { useToast } from '@/components/ui/ToastProvider';

const WordPressSettings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    api_url: '',
    filters_api_url: '',
    auth_token: '',
    wp_posts_api_url: '',
    wp_jobs_api_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const loadSettings = useCallback(async () => {
    try {
      const adminSettings = await supabaseAdminService.getSettings();
      if (adminSettings) {
        setSettings({
          api_url: adminSettings.api_url || '',
          filters_api_url: adminSettings.filters_api_url || '',
          auth_token: adminSettings.auth_token || '',
          wp_posts_api_url: adminSettings.wp_posts_api_url || '',
          wp_jobs_api_url: adminSettings.wp_jobs_api_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const testConnections = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      const response = await fetch('/api/test-wp-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiUrl: settings.api_url,
          filtersApiUrl: settings.filters_api_url,
          authToken: settings.auth_token
        })
      });

      const result = await response.json();
      setTestResults(result);

      if (result.success) {
        showToast('success', 'All connections successful!');
      } else {
        showToast('error', 'Some connections failed. Check the results below.');
      }
    } catch (error) {
      console.error('Error testing connections:', error);
      showToast('error', 'Failed to test connections');
      setTestResults({
        success: false,
        message: 'Connection test failed',
        results: []
      });
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const result = await supabaseAdminService.saveSettings(settings);

      if (result.success) {
        showToast('success', 'WordPress settings saved successfully!');

        // Update wpService with new settings
        wpService.setBaseUrl(settings.api_url);
        wpService.setFiltersApiUrl(settings.filters_api_url);
        wpService.setAuthToken(settings.auth_token);
      } else {
        showToast('error', result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading WordPress settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Globe className="h-6 w-6 mr-3 text-primary-600" />
            WordPress API Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure the connection to your WordPress CMS for jobs and articles data.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Main API Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WordPress API Base URL
              </label>
              <input
                type="url"
                name="api_url"
                value={settings.api_url}
                onChange={handleInputChange}
                placeholder="https://cms.nexjob.tech/wp-json/wp/v2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Base URL for WordPress REST API (e.g., /wp-json/wp/v2)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filters API URL
              </label>
              <input
                type="url"
                name="filters_api_url"
                value={settings.filters_api_url}
                onChange={handleInputChange}
                placeholder="Enter filters API URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Custom API endpoint for filter data
              </p>
            </div>
          </div>

          {/* Authentication */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authentication Token (Optional)
            </label>
            <input
              type="password"
              name="auth_token"
              value={settings.auth_token}
              onChange={handleInputChange}
              placeholder="Enter JWT token or API key if required"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty if your WordPress API doesn&apos;t require authentication
            </p>
          </div>

          {/* Specific Endpoints */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Specific API Endpoints</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posts API URL
                </label>
                <input
                  type="url"
                  name="wp_posts_api_url"
                  value={settings.wp_posts_api_url}
                  onChange={handleInputChange}
                  placeholder="https://cms.nexjob.tech/wp-json/wp/v2/posts"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jobs API URL
                </label>
                <input
                  type="url"
                  name="wp_jobs_api_url"
                  value={settings.wp_jobs_api_url}
                  onChange={handleInputChange}
                  placeholder="https://cms.nexjob.tech/wp-json/wp/v2/lowongan-kerja"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={testConnections}
              disabled={testing || !settings.api_url}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Connections
            </button>

            <button
              onClick={saveSettings}
              disabled={saving || !settings.api_url}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              {testResults.success ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 mr-2 text-red-500" />
              )}
              Connection Test Results
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {testResults.results?.map((result: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{result.endpoint}</div>
                    <div className="text-sm text-gray-500">{result.url}</div>
                  </div>
                  <div className="flex items-center">
                    {result.success ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-green-600">
                          {result.status} {result.statusText}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="text-sm text-red-600">
                          {result.error || 'Failed'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordPressSettings;