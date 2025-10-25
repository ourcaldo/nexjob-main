
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import UnifiedEditor from '@/components/admin/cms/UnifiedEditor';

interface EditArticleProps {
  articleId: string;
}

export default function EditArticle({ articleId }: EditArticleProps) {
  return (
    <>
      <Head>
        <title>Edit Article - Nexjob Admin</title>
        <meta name="description" content="Edit article in Nexjob CMS" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      
      <AdminLayout currentPage="cms">
        <UnifiedEditor contentType="articles" itemId={articleId} />
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const articleId = params?.id as string;

  if (!articleId) {
    return {
      notFound: true
    };
  }

  return {
    props: {
      articleId
    }
  };
};
