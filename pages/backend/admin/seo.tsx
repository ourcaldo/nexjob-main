import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import SEOSettings from '@/components/admin/SEOSettings';

export default function AdminSEO() {
  return (
    <>
      <Head>
        <title>SEO Settings - Nexjob Admin</title>
        <meta name="description" content="Configure SEO settings for Nexjob" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="seo">
        <SEOSettings />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};