
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import AdvertisementSettings from '@/components/admin/AdvertisementSettings';
import { supabaseAdminService } from '@/services/supabaseAdminService';

export default function AdvertisementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isSuperAdmin = await supabaseAdminService.isSuperAdmin();
        
        if (!isSuperAdmin) {
          router.replace('/login/');
          return;
        }
        
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.replace('/login/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <AdminLayout currentPage="advertisement">
      <AdvertisementSettings />
    </AdminLayout>
  );
}
