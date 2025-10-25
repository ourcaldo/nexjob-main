import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import BookmarkPage from '@/components/pages/BookmarkPage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateBreadcrumbSchema } from '@/utils/schemaUtils';

interface BookmarksPageProps {
  settings: any;
}

export default function Bookmarks({ settings }: BookmarksPageProps) {
  const breadcrumbItems = [{ label: 'Lowongan Tersimpan' }];

  return (
    <>
      <Head>
        <title>Lowongan Tersimpan - Nexjob</title>
        <meta name="description" content="Kelola lowongan kerja yang telah Anda simpan di Nexjob" />
        <meta property="og:title" content="Lowongan Tersimpan - Nexjob" />
        <meta property="og:description" content="Kelola lowongan kerja yang telah Anda simpan di Nexjob" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://nexjob.tech/bookmark/" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://nexjob.tech/bookmark/" />
      </Head>
      
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />
      
      <Header />
      <main>
        <BookmarkPage />
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const settings = await SupabaseAdminService.getSettingsServerSide();
  
  return {
    props: {
      settings
    }
  };
};