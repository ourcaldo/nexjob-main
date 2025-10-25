import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import IntegrationSettings from '@/components/admin/IntegrationSettings';

export default function AdminIntegration() {
  return (
    <>
      <Head>
        <title>Integration Settings - Nexjob Admin</title>
        <meta name="description" content="Configure database and storage integrations for Nexjob" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="integration">
        <IntegrationSettings />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};