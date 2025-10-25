import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { User, Mail, Phone, Calendar, MapPin, Camera, Save, Loader2, LogOut, Bookmark } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/supabase';
import { supabaseStorageService } from '@/services/supabaseStorageService';
import { userBookmarkService } from '@/services/userBookmarkService';
import { useToast } from '@/components/ui/ToastProvider';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import JobCard from '@/components/JobCard';
import { wpService } from '@/services/wpService';
import { Job } from '@/types/job';

interface ProfilePageProps {
  settings: any;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ settings }) => {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Job[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'bookmarks'>('profile');

  const [formData, setFormData] = useState<{
    full_name: string;
    phone: string;
    birth_date: string;
    gender: 'male' | 'female' | 'other' | '';
    location: string;
    bio: string;
  }>({
    full_name: '',
    phone: '',
    birth_date: '',
    gender: '',
    location: '',
    bio: ''
  });

  const loadProfile = useCallback(async (userId: string) => {
    try {
      // Use API layer instead of direct database access
      const { userProfileApiService } = await import('@/services/userProfileApiService');
      const result = await userProfileApiService.getCurrentUserProfile();

      if (!result.success) {
        console.error('Error loading profile:', result.error);
        showToast('error', 'Gagal memuat profil');
        return;
      }

      if (!result.data) {
        showToast('error', 'Profil tidak ditemukan');
        return;
      }

      setProfile(result.data);
      setFormData({
        full_name: result.data.full_name || '',
        phone: result.data.phone || '',
        birth_date: result.data.birth_date || '',
        gender: result.data.gender || '',
        location: result.data.location || '',
        bio: result.data.bio || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('error', 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const checkAuthStatus = useCallback(async () => {
    try {
      // Use single session check to avoid multiple auth calls
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        router.push('/login/');
        return;
      }

      setUser(user);
      await loadProfile(user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login/');
    }
  }, [router, loadProfile]);

  useEffect(() => {
    checkAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login/');
      } else if (event === 'SIGNED_IN' && session.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAuthStatus, router, loadProfile]);

  const loadBookmarkedJobs = useCallback(async () => {
    if (!user) return;
    
    setLoadingBookmarks(true);
    try {
      const bookmarks = await userBookmarkService.getUserBookmarks(user.id);
      const jobIds = bookmarks.map(bookmark => bookmark.job_id);
      
      if (jobIds.length > 0) {
        const jobs = await wpService.getJobsByIds(jobIds);
        setBookmarkedJobs(jobs);
      } else {
        setBookmarkedJobs([]);
      }
    } catch (error) {
      console.error('Error loading bookmarked jobs:', error);
      showToast('error', 'Gagal memuat lowongan tersimpan');
    } finally {
      setLoadingBookmarks(false);
    }
  }, [user, showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (activeTab === 'bookmarks' && user) {
      loadBookmarkedJobs();
    }
  }, [activeTab, user, loadBookmarkedJobs]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      // Delete old image if exists
      if (profile?.photo_url) {
        await supabaseStorageService.deleteProfileImage(profile.photo_url);
      }

      // Upload new image
      const result = await supabaseStorageService.uploadProfileImage(user.id, file);

      if (!result.success) {
        showToast('error', result.error || 'Gagal mengupload foto');
        return;
      }

      // Use API layer to update profile
      const { userProfileApiService } = await import('@/services/userProfileApiService');
      const updateResult = await userProfileApiService.updateUserProfile({
        photo_url: result.url
      });

      if (!updateResult.success) {
        showToast('error', 'Gagal menyimpan foto profil');
        return;
      }

      setProfile(prev => prev ? { ...prev, photo_url: result.url } : null);
      showToast('success', 'Foto profil berhasil diperbarui');
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('error', 'Gagal mengupload foto');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Prepare data with proper types
      const updateData = {
        full_name: formData.full_name,
        phone: formData.phone,
        birth_date: formData.birth_date,
        gender: formData.gender === '' ? undefined : formData.gender as 'male' | 'female' | 'other',
        location: formData.location,
        bio: formData.bio
      };

      // Use API layer instead of direct database access
      const { userProfileApiService } = await import('@/services/userProfileApiService');
      const result = await userProfileApiService.updateUserProfile(updateData);

      if (!result.success) {
        showToast('error', 'Gagal menyimpan profil');
        return;
      }

      setProfile(prev => prev ? { ...prev, ...updateData } : null);
      showToast('success', 'Profil berhasil disimpan');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('error', 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      showToast('success', 'Berhasil logout');
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
      showToast('error', 'Gagal logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Memuat profil...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
                {profile?.photo_url ? (
                  <Image
                    src={profile.photo_url}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
              {uploadingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.full_name || 'Nama Belum Diisi'}
              </h1>
              <p className="text-gray-600">{profile?.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Bergabung sejak {new Date(profile?.created_at || '').toLocaleDateString('id-ID')}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="h-5 w-5 inline mr-2" />
                Profil Saya
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookmarks'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Bookmark className="h-5 w-5 inline mr-2" />
                Lowongan Tersimpan
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'profile' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Telepon
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="Masukkan nomor telepon"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Lahir
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        name="birth_date"
                        value={formData.birth_date}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Kelamin
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    >
                      <option value="">Pilih jenis kelamin</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lokasi
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="Masukkan lokasi"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="Ceritakan sedikit tentang diri Anda..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Simpan Profil
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Lowongan Tersimpan
                </h3>

                {loadingBookmarks ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
                      <p className="text-gray-600">Memuat lowongan tersimpan...</p>
                    </div>
                  </div>
                ) : bookmarkedJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bookmarkedJobs.map((job, index) => (
                      <div key={job.id} style={{ animationDelay: `${index * 0.1}s` }}>
                        <JobCard job={job} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bookmark className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Belum Ada Lowongan Tersimpan
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Mulai simpan lowongan yang menarik untuk Anda
                    </p>
                    <Link
                      href="/lowongan-kerja/"
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center"
                    >
                      Cari Lowongan
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;