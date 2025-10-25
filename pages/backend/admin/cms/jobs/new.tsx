
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import UnifiedEditor from '@/components/admin/cms/UnifiedEditor';

export default function NewJob() {
  return (
    <>
      <Head>
        <title>New Job - Nexjob Admin</title>
        <meta name="description" content="Create new job posting for Nexjob CMS" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="cms">
        <UnifiedEditor contentType="jobs" />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};
