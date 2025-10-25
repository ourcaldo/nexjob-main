
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Upload, Loader2, Check, Trash2, Search } from 'lucide-react';
import { supabaseStorageService } from '@/services/supabaseStorageService';
import { supabase, NxdbMedia } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';

type MediaItem = NxdbMedia;

interface MediaManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  currentImageUrl?: string;
  userId: string;
}

const MediaManager: React.FC<MediaManagerProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentImageUrl,
  userId
}) => {
  const { showToast } = useToast();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(currentImageUrl || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('library');

  // Load user's media items
  const loadMediaItems = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('nxdb_media')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading media items:', error);
        showToast('error', 'Failed to load media library');
        return;
      }

      setMediaItems(data || []);
    } catch (error) {
      console.error('Error loading media items:', error);
      showToast('error', 'Failed to load media library');
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    if (isOpen) {
      loadMediaItems();
    }
  }, [isOpen, userId, loadMediaItems]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `${timestamp}.${extension}`;
      const path = `media/${userId}/${fileName}`;

      const uploadResult = await supabaseStorageService.uploadFile(file, path, file.type);

      if (!uploadResult.success || !uploadResult.url) {
        showToast('error', uploadResult.error || 'Upload failed');
        return;
      }

      // Save to database
      const { data, error } = await supabase
        .from('nxdb_media')
        .insert({
          user_id: userId,
          url: uploadResult.url,
          name: file.name,
          path: path,
          size: file.size,
          mime_type: file.type
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving media to database:', error);
        showToast('error', 'Failed to save media information');
        return;
      }

      // Add to media items
      setMediaItems(prev => [data, ...prev]);
      setSelectedImage(uploadResult.url);
      setActiveTab('library');
      showToast('success', 'Image uploaded successfully');

    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('error', 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Delete media item
  const deleteMediaItem = async (item: MediaItem) => {
    try {
      // Delete from storage
      if (item.path) {
        await supabaseStorageService.deleteFile(item.path);
      }

      // Delete from database
      const { error } = await supabase
        .from('nxdb_media')
        .delete()
        .eq('id', item.id);

      if (error) {
        console.error('Error deleting media item:', error);
        showToast('error', 'Failed to delete image');
        return;
      }

      // Remove from state
      setMediaItems(prev => prev.filter(i => i.id !== item.id));
      
      // Clear selection if deleted image was selected
      if (selectedImage === item.url) {
        setSelectedImage('');
      }

      showToast('success', 'Image deleted successfully');
    } catch (error) {
      console.error('Error deleting media item:', error);
      showToast('error', 'Failed to delete image');
    }
  };

  // Filter media items based on search
  const filteredItems = mediaItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle select and close
  const handleSelectAndClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onSelect(selectedImage);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-4/5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Media Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'library'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Media Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'upload'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload New
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {activeTab === 'upload' ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <input
                  type="file"
                  id="media-upload"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="media-upload"
                  className={`cursor-pointer inline-flex flex-col items-center justify-center w-64 h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 text-primary-500 animate-spin mb-2" />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  )}
                  <span className="text-sm text-gray-600">
                    {uploading ? 'Uploading...' : 'Click to upload image'}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    JPEG, PNG, WebP (max 1MB)
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search images..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Media Grid */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    {searchTerm ? 'No images found matching your search' : 'No images uploaded yet'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden ${
                          selectedImage === item.url
                            ? 'border-primary-500'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedImage(item.url);
                        }}
                      >
                        <div className="aspect-square relative">
                          <Image
                            src={item.url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                          
                          {/* Selection indicator */}
                          {selectedImage === item.url && (
                            <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1">
                              <Check className="h-3 w-3" />
                            </div>
                          )}

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMediaItem(item);
                            }}
                            className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        
                        {/* Image info */}
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-600 truncate" title={item.name}>
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {Math.round(item.size / 1024)}KB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedImage && activeTab === 'library' && (
              <span>Selected: {filteredItems.find(item => item.url === selectedImage)?.name}</span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectAndClose(e);
              }}
              disabled={!selectedImage}
              className={`px-4 py-2 rounded-md ${
                selectedImage
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Select Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaManager;
