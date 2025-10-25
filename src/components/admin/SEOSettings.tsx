import React, { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, FileText, Image as ImageIcon, Globe, Search } from 'lucide-react';
import Image from 'next/image';
import { supabaseAdminService } from '@/services/supabaseAdminService';
import { useToast } from '@/components/ui/ToastProvider';

const SEOSettings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    site_title: '',
    site_tagline: '',
    site_description: '',
    // Page Templates
    location_page_title_template: '',
    location_page_description_template: '',
    category_page_title_template: '',
    category_page_description_template: '',
    // Archive Pages
    jobs_title: '',
    jobs_description: '',
    articles_title: '',
    articles_description: '',
    // Auth Pages
    login_page_title: '',
    login_page_description: '',
    signup_page_title: '',
    signup_page_description: '',
    profile_page_title: '',
    profile_page_description: '',
    // OG Images
    home_og_image: '',
    jobs_og_image: '',
    articles_og_image: '',
    default_job_og_image: '',
    default_article_og_image: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const adminSettings = await supabaseAdminService.getSettings();
      if (adminSettings) {
        setSettings({
          site_title: adminSettings.site_title || '',
          site_tagline: adminSettings.site_tagline || '',
          site_description: adminSettings.site_description || '',
          location_page_title_template: adminSettings.location_page_title_template || '',
          location_page_description_template: adminSettings.location_page_description_template || '',
          category_page_title_template: adminSettings.category_page_title_template || '',
          category_page_description_template: adminSettings.category_page_description_template || '',
          jobs_title: adminSettings.jobs_title || '',
          jobs_description: adminSettings.jobs_description || '',
          articles_title: adminSettings.articles_title || '',
          articles_description: adminSettings.articles_description || '',
          login_page_title: adminSettings.login_page_title || '',
          login_page_description: adminSettings.login_page_description || '',
          signup_page_title: adminSettings.signup_page_title || '',
          signup_page_description: adminSettings.signup_page_description || '',
          profile_page_title: adminSettings.profile_page_title || '',
          profile_page_description: adminSettings.profile_page_description || '',
          home_og_image: adminSettings.home_og_image || '',
          jobs_og_image: adminSettings.jobs_og_image || '',
          articles_og_image: adminSettings.articles_og_image || '',
          default_job_og_image: adminSettings.default_job_og_image || '',
          default_article_og_image: adminSettings.default_article_og_image || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('error', 'Failed to load SEO settings');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const result = await supabaseAdminService.saveSettings(settings);

      if (result.success) {
        showToast('success', 'SEO settings saved successfully!');
      } else {
        showToast('error', result.error || 'Failed to save SEO settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', 'Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading SEO settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General SEO Settings */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Search className="h-6 w-6 mr-3 text-primary-600" />
            General SEO Settings
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure basic SEO information for your website.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Title
              </label>
              <input
                type="text"
                name="site_title"
                value={settings.site_title}
                onChange={handleInputChange}
                placeholder="Nexjob"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Tagline
              </label>
              <input
                type="text"
                name="site_tagline"
                value={settings.site_tagline}
                onChange={handleInputChange}
                placeholder="Find Your Dream Job"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Description
            </label>
            <textarea
              name="site_description"
              value={settings.site_description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Platform pencarian kerja terpercaya di Indonesia"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Page Templates */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-3 text-primary-600" />
            Dynamic Page Templates
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure SEO templates for dynamic pages. Use variables like {`{{lokasi}}`}, {`{{kategori}}`}, {`{{site_title}}`}.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Page Title Template
              </label>
              <input
                type="text"
                name="location_page_title_template"
                value={settings.location_page_title_template}
                onChange={handleInputChange}
                placeholder={`Lowongan Kerja di {{lokasi}} - {{site_title}}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Page Title Template
              </label>
              <input
                type="text"
                name="category_page_title_template"
                value={settings.category_page_title_template}
                onChange={handleInputChange}
                placeholder={`Lowongan Kerja {{kategori}} - {{site_title}}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Page Description Template
              </label>
              <textarea
                name="location_page_description_template"
                value={settings.location_page_description_template}
                onChange={handleInputChange}
                rows={3}
                placeholder={`Temukan lowongan kerja terbaru di {{lokasi}}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Page Description Template
              </label>
              <textarea
                name="category_page_description_template"
                value={settings.category_page_description_template}
                onChange={handleInputChange}
                rows={3}
                placeholder={`Temukan lowongan kerja {{kategori}} terbaru...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Archive Pages */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Globe className="h-6 w-6 mr-3 text-primary-600" />
            Archive Pages SEO
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure SEO for main archive pages (jobs, articles, auth pages).
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jobs Page Title
              </label>
              <input
                type="text"
                name="jobs_title"
                value={settings.jobs_title}
                onChange={handleInputChange}
                placeholder={`Lowongan Kerja Terbaru - {{site_title}}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Articles Page Title
              </label>
              <input
                type="text"
                name="articles_title"
                value={settings.articles_title}
                onChange={handleInputChange}
                placeholder={`Tips Karir & Panduan Kerja - {{site_title}}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jobs Page Description
              </label>
              <textarea
                name="jobs_description"
                value={settings.jobs_description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Temukan lowongan kerja terbaru dari berbagai perusahaan..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Articles Page Description
              </label>
              <textarea
                name="articles_description"
                value={settings.articles_description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Artikel dan panduan karir terbaru untuk membantu..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Open Graph Images */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <ImageIcon className="h-6 w-6 mr-3 text-primary-600" />
            Open Graph Images
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure default Open Graph images for social media sharing.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Home Page OG Image
              </label>
              <input
                type="url"
                name="home_og_image"
                value={settings.home_og_image}
                onChange={handleInputChange}
                placeholder="https://nexjob.tech/og-home.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              {settings.home_og_image && (
                <div className="mt-2">
                  <Image
                    src={settings.home_og_image}
                    alt="Home OG Image Preview"
                    width={200}
                    height={100}
                    className="rounded border object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jobs Page OG Image
              </label>
              <input
                type="url"
                name="jobs_og_image"
                value={settings.jobs_og_image}
                onChange={handleInputChange}
                placeholder="https://nexjob.tech/og-jobs.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Articles Page OG Image
              </label>
              <input
                type="url"
                name="articles_og_image"
                value={settings.articles_og_image}
                onChange={handleInputChange}
                placeholder="https://nexjob.tech/og-articles.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Job OG Image
              </label>
              <input
                type="url"
                name="default_job_og_image"
                value={settings.default_job_og_image}
                onChange={handleInputChange}
                placeholder="https://nexjob.tech/og-job-default.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Article OG Image
            </label>
            <input
              type="url"
              name="default_article_og_image"
              value={settings.default_article_og_image}
              onChange={handleInputChange}
              placeholder="https://nexjob.tech/og-article-default.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
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
          Save SEO Settings
        </button>
      </div>
    </div>
  );
};

export default SEOSettings;