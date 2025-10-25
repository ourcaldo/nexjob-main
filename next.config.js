/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    PORT: process.env.PORT,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'staging.nexjob.tech',
      },
      {
        protocol: 'https',
        hostname: 'nexjob.tech',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cms.nexjob.tech',
      },
      {
        protocol: 'https',
        hostname: 'cdn.nexjob.tech',
      },
      {
        protocol: 'https',
        hostname: 'uzlzyosmbxgghhmafidk.supabase.co',
      },
    ],
    unoptimized: false,
  },
  async rewrites() {
    return [
      {
        source: '/bookmark/',
        destination: '/bookmarks',
      },
      // Admin panel rewrite
      {
        source: '/admin',
        destination: '/backend/admin',
      },
      {
        source: '/admin/',
        destination: '/backend/admin/',
      },
      // Dynamic sitemap rewrites - Maps /sitemap-loker-1.xml → /sitemap-loker/1
      {
        source: '/sitemap-loker-:page(\\d+).xml',
        destination: '/sitemap-loker/:page',
      },
      {
        source: '/sitemap-artikel-:page(\\d+).xml',
        destination: '/sitemap-artikel/:page',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/jobs',
        destination: '/lowongan-kerja',
        permanent: true,
      },
      {
        source: '/jobs/',
        destination: '/lowongan-kerja/',
        permanent: true,
      },
      {
        source: '/jobs/:slug',
        destination: '/lowongan-kerja/:slug',
        permanent: true,
      },
      {
        source: '/jobs/:slug/',
        destination: '/lowongan-kerja/:slug/',
        permanent: true,
      },
      {
        source: '/articles',
        destination: '/artikel',
        permanent: true,
      },
      {
        source: '/articles/',
        destination: '/artikel/',
        permanent: true,
      },
      {
        source: '/articles/:slug',
        destination: '/artikel/:slug',
        permanent: true,
      },
      {
        source: '/articles/:slug/',
        destination: '/artikel/:slug/',
        permanent: true,
      },
      {
        source: '/bookmark',
        destination: '/bookmark/',
        permanent: true,
      },
    ];
  },
  trailingSlash: true,
  generateEtags: false,
  poweredByHeader: false,
};

module.exports = nextConfig;