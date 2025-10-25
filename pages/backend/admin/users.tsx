import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import UserManagement from '@/components/admin/UserManagement';

export default function AdminUsers() {
  return (
    <>
      <Head>
        <title>User Management - Nexjob Admin</title>
        <meta name="description" content="Manage users for Nexjob" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="users">
        <UserManagement />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};