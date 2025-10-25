import React, { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, Settings, Database, Globe, BarChart3 } from 'lucide-react';
import { supabaseAdminService } from '@/services/supabaseAdminService';
import { useToast } from '@/components/ui/ToastProvider';

const SystemSettings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    site_url: '',
    ga_id: '',
    gtm_id: '',
    // Supabase Storage Configuration
    supabase_storage_endpoint: '',
    supabase_storage_region: '',
    supabase_storage_access_key: '',
    supabase_storage_secret_key: '',
    // Database Configuration
    database_supabase_url: '',
    database_supabase_anon_key: '',
    database_supabase_service_role_key: '',
    // Storage Configuration
    storage_bucket_name: '',
    storage_endpoint: '',
    storage_region: '',
    storage_access_key: '',
    storage_secret_key: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const adminSettings = await supabaseAdminService.getSettings();
      if (adminSettings) {
        setSettings({
          site_url: adminSettings.site_url || '',
          ga_id: adminSettings.ga_id || '',
          gtm_id: adminSettings.gtm_id || '',
          supabase_storage_endpoint: adminSettings.supabase_storage_endpoint || '',
          supabase_storage_region: adminSettings.supabase_storage_region || '',
          supabase_storage_access_key: adminSettings.supabase_storage_access_key || '',
          supabase_storage_secret_key: adminSettings.supabase_storage_secret_key || '',
          database_supabase_url: adminSettings.database_supabase_url || '',
          database_supabase_anon_key: adminSettings.database_supabase_anon_key || '',
          database_supabase_service_role_key: adminSettings.database_supabase_service_role_key || '',
          storage_bucket_name: adminSettings.storage_bucket_name || '',
          storage_endpoint: adminSettings.storage_endpoint || '',
          storage_region: adminSettings.storage_region || '',
          storage_access_key: adminSettings.storage_access_key || '',
          storage_secret_key: adminSettings.storage_secret_key || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('error', 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const result = await supabaseAdminService.saveSettings(settings);
      
      if (result.success) {
        showToast('success', 'System settings saved successfully!');
      } else {
        showToast('error', result.error || 'Failed to save system settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', 'Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading system settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General System Settings */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Globe className="h-6 w-6 mr-3 text-primary-600" />
            General System Settings
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure basic system and environment settings.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site URL
            </label>
            <input
              type="url"
              name="site_url"
              value={settings.site_url}
              onChange={handleInputChange}
              placeholder="https://nexjob.tech"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              The main URL of your website
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Settings */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-6 w-6 mr-3 text-primary-600" />
            Analytics Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure Google Analytics and Tag Manager.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Analytics ID
              </label>
              <input
                type="text"
                name="ga_id"
                value={settings.ga_id}
                onChange={handleInputChange}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Tag Manager ID
              </label>
              <input
                type="text"
                name="gtm_id"
                value={settings.gtm_id}
                onChange={handleInputChange}
                placeholder="GTM-XXXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Database Configuration */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Database className="h-6 w-6 mr-3 text-primary-600" />
            Database Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure Supabase database connection settings.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supabase URL
            </label>
            <input
              type="url"
              name="database_supabase_url"
              value={settings.database_supabase_url}
              onChange={handleInputChange}
              placeholder="https://your-project.supabase.co"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Anon Key
              </label>
              <input
                type="password"
                name="database_supabase_anon_key"
                value={settings.database_supabase_anon_key}
                onChange={handleInputChange}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Service Role Key
              </label>
              <input
                type="password"
                name="database_supabase_service_role_key"
                value={settings.database_supabase_service_role_key}
                onChange={handleInputChange}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Storage Configuration */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Settings className="h-6 w-6 mr-3 text-primary-600" />
            Storage Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure file storage settings for uploads.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Bucket Name
              </label>
              <input
                type="text"
                name="storage_bucket_name"
                value={settings.storage_bucket_name}
                onChange={handleInputChange}
                placeholder="nexjob"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Region
              </label>
              <input
                type="text"
                name="storage_region"
                value={settings.storage_region}
                onChange={handleInputChange}
                placeholder="ap-southeast-1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Storage Endpoint
            </label>
            <input
              type="url"
              name="storage_endpoint"
              value={settings.storage_endpoint}
              onChange={handleInputChange}
              placeholder="https://your-project.supabase.co/storage/v1/s3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Access Key
              </label>
              <input
                type="password"
                name="storage_access_key"
                value={settings.storage_access_key}
                onChange={handleInputChange}
                placeholder="Access key for storage"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Secret Key
              </label>
              <input
                type="password"
                name="storage_secret_key"
                value={settings.storage_secret_key}
                onChange={handleInputChange}
                placeholder="Secret key for storage"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
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
            <Save className="h-4 w-4 mr-2" />
          )}
          Save System Settings
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;