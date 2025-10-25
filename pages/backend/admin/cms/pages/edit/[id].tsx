
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import UnifiedEditor from '@/components/admin/cms/UnifiedEditor';

interface EditPageProps {
  pageId: string;
}

export default function EditPage({ pageId }: EditPageProps) {
  return (
    <>
      <Head>
        <title>Edit Page - Nexjob Admin</title>
        <meta name="description" content="Edit page in Nexjob CMS" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="cms">
        <UnifiedEditor contentType="pages" itemId={pageId} />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const pageId = params?.id as string;

  if (!pageId) {
    return {
      notFound: true
    };
  }

  return {
    props: {
      pageId
    }
  };
};
