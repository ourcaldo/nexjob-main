import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import SitemapManagement from '@/components/admin/SitemapManagement';

export default function AdminSitemap() {
  return (
    <>
      <Head>
        <title>Sitemap Management - Nexjob Admin</title>
        <meta name="description" content="Manage sitemaps for Nexjob" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="sitemap">
        <SitemapManagement />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};