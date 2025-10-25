
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import UnifiedEditor from '@/components/admin/cms/UnifiedEditor';

export default function NewPage() {
  return (
    <>
      <Head>
        <title>Add New Page - Nexjob Admin</title>
        <meta name="description" content="Add new page to Nexjob CMS" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="cms">
        <UnifiedEditor contentType="pages" />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};
