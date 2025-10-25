import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { SupabaseAdminService } from '@/services/supabaseAdminService';
import SignupPage from '@/components/pages/SignupPage';

interface SignupPageProps {
  settings: any;
}

export default function Signup({ settings }: SignupPageProps) {
  const pageTitle = settings.signup_page_title.replace('{{site_title}}', settings.site_title);
  const pageDescription = settings.signup_page_description;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL}/signup/`} />
      </Head>
      
      <SignupPage settings={settings} />
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