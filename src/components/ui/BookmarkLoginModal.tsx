import React, { useState, useEffect } from 'react';
import { X, User, Mail } from 'lucide-react';
import { popupTemplateService } from '@/services/popupTemplateService';
import { PopupTemplate } from '@/lib/supabase';

interface BookmarkLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignup: () => void;
}

const BookmarkLoginModal: React.FC<BookmarkLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onSignup
}) => {
  const [template, setTemplate] = useState<PopupTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTemplate();
    }
  }, [isOpen]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const templateData = await popupTemplateService.getTemplate('bookmark_login_prompt');
      setTemplate(templateData);
    } catch (error) {
      console.error('Error loading popup template:', error);
      // Use fallback template
      setTemplate({
        id: 'fallback',
        template_key: 'bookmark_login_prompt',
        title: 'Daftar/Login Nexjob untuk Menyimpan Pekerjaan',
        content: 'Untuk menyimpan lowongan kerja favorit Anda, silakan daftar atau login terlebih dahulu. Dengan akun Nexjob, Anda dapat menyimpan dan mengelola lowongan yang menarik.',
        button_text: 'Daftar/Login Sekarang',
        created_at: '',
        updated_at: ''
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                {template?.title || 'Daftar/Login untuk Menyimpan'}
              </h3>

              <p className="text-gray-600 mb-6 text-center leading-relaxed">
                {template?.content || 'Untuk menyimpan lowongan kerja favorit Anda, silakan daftar atau login terlebih dahulu.'}
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={onSignup}
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 px-4 rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 font-semibold flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <User className="h-5 w-5 mr-2" />
                  Daftar Akun Gratis
                </button>

                <button
                  onClick={onLogin}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Sudah Punya Akun? Login
                </button>
              </div>


            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarkLoginModal;