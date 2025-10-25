import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import CmsPages from '@/components/admin/cms/CmsPages';

export default function AdminCms() {
  return (
    <>
      <Head>
        <title>CMS - Nexjob Admin</title>
        <meta name="description" content="Content Management System for Nexjob" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="cms">
        <CmsPages />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};