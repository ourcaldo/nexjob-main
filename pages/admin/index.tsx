import { GetServerSideProps } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new admin URL
    router.replace('/backend/admin/');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to admin panel...</p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/backend/admin/',
      permanent: true,
    },
  };
};