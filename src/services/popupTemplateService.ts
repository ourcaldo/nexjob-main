import { supabase } from '@/lib/supabase';
import { PopupTemplate } from '@/lib/supabase';

class PopupTemplateService {
  // Get popup template by key
  async getTemplate(templateKey: string): Promise<PopupTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('popup_templates')
        .select('*')
        .eq('template_key', templateKey)
        .single();

      if (error) {
        console.error('Error fetching popup template:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching popup template:', error);
      return null;
    }
  }

  // Get all popup templates (admin only)
  async getAllTemplates(): Promise<PopupTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('popup_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching popup templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching popup templates:', error);
      return [];
    }
  }

  // Update popup template (admin only)
  async updateTemplate(
    templateKey: string, 
    updates: Partial<Pick<PopupTemplate, 'title' | 'content' | 'button_text'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('popup_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('template_key', templateKey);

      if (error) {
        console.error('Error updating popup template:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating popup template:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update template' 
      };
    }
  }

  // Create new popup template (admin only)
  async createTemplate(template: Omit<PopupTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('popup_templates')
        .insert(template);

      if (error) {
        console.error('Error creating popup template:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating popup template:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create template' 
      };
    }
  }

  // Delete popup template (admin only)
  async deleteTemplate(templateKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('popup_templates')
        .delete()
        .eq('template_key', templateKey);

      if (error) {
        console.error('Error deleting popup template:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting popup template:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete template' 
      };
    }
  }
}

export const popupTemplateService = new PopupTemplateService();