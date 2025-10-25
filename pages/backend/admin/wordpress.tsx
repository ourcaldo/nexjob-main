import { GetServerSideProps } from 'next';

export default function AdminWordPress() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/backend/admin/integration',
      permanent: true,
    },
  };
};