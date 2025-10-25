class BookmarkService {
  private storageKey = 'nexjob_bookmarks';

  getBookmarks(): string[] {
    try {
      const bookmarks = localStorage.getItem(this.storageKey);
      return bookmarks ? JSON.parse(bookmarks) : [];
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  }

  addBookmark(jobId: string): void {
    try {
      const bookmarks = this.getBookmarks();
      if (!bookmarks.includes(jobId)) {
        bookmarks.push(jobId);
        localStorage.setItem(this.storageKey, JSON.stringify(bookmarks));
        this.notifyBookmarkChange();
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  }

  removeBookmark(jobId: string): void {
    try {
      const bookmarks = this.getBookmarks();
      const updatedBookmarks = bookmarks.filter(id => id !== jobId);
      localStorage.setItem(this.storageKey, JSON.stringify(updatedBookmarks));
      this.notifyBookmarkChange();
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  }

  isBookmarked(jobId: string): boolean {
    return this.getBookmarks().includes(jobId);
  }

  toggleBookmark(jobId: string): boolean {
    const isCurrentlyBookmarked = this.isBookmarked(jobId);
    if (isCurrentlyBookmarked) {
      this.removeBookmark(jobId);
      return false;
    } else {
      this.addBookmark(jobId);
      return true;
    }
  }

  getBookmarkCount(): number {
    return this.getBookmarks().length;
  }

  private notifyBookmarkChange(): void {
    // Dispatch custom event for bookmark changes
    const event = new CustomEvent('bookmarkUpdated', {
      detail: { bookmarks: this.getBookmarks() }
    });
    window.dispatchEvent(event);
    
    // Also dispatch storage event manually for same-tab updates
    const storageEvent = new StorageEvent('storage', {
      key: this.storageKey,
      newValue: localStorage.getItem(this.storageKey),
      oldValue: null,
      storageArea: localStorage,
      url: window.location.href
    });
    window.dispatchEvent(storageEvent);
  }
}

export const bookmarkService = new BookmarkService();