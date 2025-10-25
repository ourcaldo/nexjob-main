import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import Dashboard from '@/components/admin/Dashboard';

export default function AdminDashboard() {
  return (
    <>
      <Head>
        <title>Dashboard - Nexjob Admin</title>
        <meta name="description" content="Nexjob admin dashboard for managing the job portal" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="dashboard">
        <Dashboard />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};