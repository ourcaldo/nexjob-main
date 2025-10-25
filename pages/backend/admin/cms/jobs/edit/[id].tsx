
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import UnifiedEditor from '@/components/admin/cms/UnifiedEditor';

interface EditJobProps {
  jobId: string;
}

export default function EditJob({ jobId }: EditJobProps) {
  return (
    <>
      <Head>
        <title>Edit Job - Nexjob Admin</title>
        <meta name="description" content="Edit job posting in Nexjob CMS" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="cms">
        <UnifiedEditor contentType="jobs" itemId={jobId} />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const jobId = params?.id as string;

  if (!jobId) {
    return {
      notFound: true
    };
  }

  return {
    props: {
      jobId
    }
  };
};
