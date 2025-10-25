import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { env } from '@/lib/env';

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

interface PageViewData {
  page_title: string;
  page_location: string;
  content_group1?: string; // Page type (job, article, etc.)
  content_group2?: string; // Category
  content_group3?: string; // Location
}

export const useAnalytics = () => {
  const router = useRouter();

  // Track page views
  const trackPageView = (data?: Partial<PageViewData>) => {
    if (!env.GA_ID || typeof window.gtag === 'undefined') return;

    const pageData: PageViewData = {
      page_title: document.title,
      page_location: window.location.href,
      ...data,
    };

    window.gtag('config', env.GA_ID!, pageData);
  };

  // Track custom events
  const trackEvent = ({ action, category, label, value }: AnalyticsEvent) => {
    if (!env.GA_ID || typeof window.gtag === 'undefined') return;

    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  };

  // Track job application clicks
  const trackJobApplication = (jobTitle: string, company: string, jobId: string) => {
    trackEvent({
      action: 'job_application_click',
      category: 'Jobs',
      label: `${jobTitle} - ${company}`,
      value: 1,
    });

    // Enhanced ecommerce tracking for job applications
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'select_content', {
        content_type: 'job',
        content_id: jobId,
        items: [{
          item_id: jobId,
          item_name: jobTitle,
          item_category: 'Job Application',
          item_brand: company,
        }]
      });
    }
  };

  // Track search events
  const trackSearch = (searchTerm: string, location?: string, category?: string) => {
    trackEvent({
      action: 'search',
      category: 'Job Search',
      label: searchTerm,
    });

    // Enhanced search tracking
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'search', {
        search_term: searchTerm,
        content_group1: 'job_search',
        content_group2: category || '',
        content_group3: location || '',
      });
    }
  };

  // Track bookmark actions
  const trackBookmark = (action: 'add' | 'remove', jobTitle: string, jobId: string) => {
    trackEvent({
      action: `bookmark_${action}`,
      category: 'Jobs',
      label: jobTitle,
    });
  };

  // Track article reading
  const trackArticleRead = (articleTitle: string, articleId: string, category?: string) => {
    trackEvent({
      action: 'article_read',
      category: 'Articles',
      label: articleTitle,
    });

    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'select_content', {
        content_type: 'article',
        content_id: articleId,
        content_group1: 'article',
        content_group2: category || '',
      });
    }
  };

  // Track filter usage
  const trackFilterUsage = (filterType: string, filterValue: string) => {
    trackEvent({
      action: 'filter_used',
      category: 'Job Search',
      label: `${filterType}: ${filterValue}`,
    });
  };

  return {
    trackPageView,
    trackEvent,
    trackJobApplication,
    trackSearch,
    trackBookmark,
    trackArticleRead,
    trackFilterUsage,
  };
};