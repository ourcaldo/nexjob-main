import { supabase } from '@/lib/supabase';
import { UserBookmark } from '@/lib/supabase';

class UserBookmarkService {
  private async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Get user bookmarks using API layer
  async getUserBookmarks(userId: string): Promise<UserBookmark[]> {
    try {
      const { getCachedAuthState } = await import('@/lib/supabase');
      const { session } = await getCachedAuthState();
      if (!session?.user || session.user.id !== userId) {
        throw new Error('Unauthorized');
      }

      // Check if we're on client side
      if (typeof window !== 'undefined') {
        const token = await this.getAuthToken();
        if (!token) {
          console.error('No auth token available for bookmarks');
          return [];
        }

        const response = await fetch('/api/user/bookmarks/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('Error fetching bookmarks via API:', response.status);
          return [];
        }

        const data = await response.json();
        return data.success ? data.data : [];
      }

      // Server-side fallback (for SSR)
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user bookmarks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user bookmarks:', error);
      return [];
    }
  }

  // Add bookmark
  async addBookmark(userId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we're on client side
      if (typeof window !== 'undefined') {
        const token = await this.getAuthToken();
        if (!token) {
          return { success: false, error: 'No authentication token available' };
        }

        const response = await fetch('/api/user/bookmarks/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          return { success: false, error: errorData.error || 'Failed to add bookmark' };
        }

        this.notifyBookmarkChange();
        return { success: true };
      }

      // Server-side fallback (for SSR)
      const { error } = await supabase
        .from('user_bookmarks')
        .insert({
          user_id: userId,
          job_id: jobId
        });

      if (error) {
        console.error('Error adding bookmark:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding bookmark:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add bookmark' 
      };
    }
  }

  // Remove bookmark
  async removeBookmark(userId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we're on client side
      if (typeof window !== 'undefined') {
        const token = await this.getAuthToken();
        if (!token) {
          return { success: false, error: 'No authentication token available' };
        }

        const response = await fetch('/api/user/bookmarks/', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          return { success: false, error: errorData.error || 'Failed to remove bookmark' };
        }

        this.notifyBookmarkChange();
        return { success: true };
      }

      // Server-side fallback (for SSR)
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('job_id', jobId);

      if (error) {
        console.error('Error removing bookmark:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to remove bookmark' 
      };
    }
  }

  // Check if job is bookmarked
  async isBookmarked(userId: string, jobId: string): Promise<boolean> {
    try {
      // Check if we're on client side
      if (typeof window !== 'undefined') {
        const token = await this.getAuthToken();
        if (!token) {
          return false;
        }

        const response = await fetch('/api/user/bookmarks/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          return false;
        }

        const data = await response.json();
        if (data.success && data.data) {
          return data.data.some((bookmark: any) => bookmark.job_id === jobId);
        }
        return false;
      }

      // Server-side fallback (for SSR)
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('job_id', jobId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking bookmark:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking bookmark:', error);
      return false;
    }
  }

  // Toggle bookmark
  async toggleBookmark(jobId: string): Promise<{ success: boolean; isBookmarked: boolean; error?: string }> {
    try {
      const { getCachedAuthState } = await import('@/lib/supabase');
      const { session } = await getCachedAuthState();
      const user = session?.user;

      if (!user) {
        return { success: false, isBookmarked: false, error: 'User not authenticated' };
      }

      const userId = user.id;
      const isCurrentlyBookmarked = await this.isBookmarked(userId, jobId);

      if (isCurrentlyBookmarked) {
        const result = await this.removeBookmark(userId, jobId);
        if (result.success) {
          this.notifyBookmarkChange();
        }
        return {
          success: result.success,
          isBookmarked: false,
          error: result.error
        };
      } else {
        const result = await this.addBookmark(userId, jobId);
        if (result.success) {
          this.notifyBookmarkChange();
        }
        return {
          success: result.success,
          isBookmarked: true,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      return {
        success: false,
        isBookmarked: false,
        error: error instanceof Error ? error.message : 'Failed to toggle bookmark'
      };
    }
  }

  // Notify other components about bookmark changes
  private notifyBookmarkChange(): void {
    if (typeof window !== 'undefined') {
      // Dispatch custom event for bookmark changes
      const event = new CustomEvent('bookmarkUpdated', {
        detail: { timestamp: Date.now() }
      });
      window.dispatchEvent(event);
    }
  }

  // Get bookmark count for user
  async getBookmarkCount(userId: string): Promise<number> {
    try {
      // Check if we're on client side
      if (typeof window !== 'undefined') {
        const token = await this.getAuthToken();
        if (!token) {
          console.error('No auth token available for bookmark count');
          return 0;
        }

        const response = await fetch('/api/user/bookmarks/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('Error fetching bookmark count via API:', response.status);
          return 0;
        }

        const data = await response.json();
        return data.success ? (data.data?.length || 0) : 0;
      }

      // Server-side fallback (for SSR)
      const { count, error } = await supabase
        .from('user_bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting bookmark count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting bookmark count:', error);
      return 0;
    }
  }
}

export const userBookmarkService = new UserBookmarkService();