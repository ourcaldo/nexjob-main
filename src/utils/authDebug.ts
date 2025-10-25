
export const debugAuth = async () => {
  if (typeof window === 'undefined') return;
  
  const { supabase } = await import('@/lib/db-client');
  
  console.group('🔐 Auth Debug Info');
  
  try {
    // Check session
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('📋 Current Session:', session ? 'Active' : 'None');
    console.log('👤 User ID:', session?.user?.id || 'None');
    console.log('📧 Email:', session?.user?.email || 'None');
    console.log('⏰ Expires At:', session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'None');
    
    if (error) {
      console.error('❌ Session Error:', error);
    }
    
    // Check localStorage
    const localStorageKeys = ['sb-uzlzyosmbxgghhmafidk-auth-token'];
    localStorageKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`💾 LocalStorage ${key}:`, value ? 'Present' : 'Missing');
    });
    
  } catch (error) {
    console.error('❌ Auth Debug Error:', error);
  }
  
  console.groupEnd();
};

// Add to window for easy access in dev tools
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
}
