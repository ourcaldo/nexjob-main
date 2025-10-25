import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import SystemSettings from '@/components/admin/SystemSettings';

export default function AdminSystem() {
  return (
    <>
      <Head>
        <title>System Settings - Nexjob Admin</title>
        <meta name="description" content="Configure system settings for Nexjob" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="system">
        <SystemSettings />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};