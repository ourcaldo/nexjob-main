import { supabase } from '@/lib/supabase';
import { NxdbPage, NxdbPageCategory, NxdbPageTag } from '@/lib/supabase';

export interface CreatePageData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published' | 'trash' | 'scheduled';
  author_id: string;
  featured_image?: string;
  seo_title?: string;
  meta_description?: string;
  schema_types: string[];
  post_date: string;
  published_at?: string;
  category_ids: string[];
  tag_ids: string[];
}

export interface UpdatePageData extends Partial<CreatePageData> {
  id: string;
}

class CmsPageService {
  // Get all pages with filters
  async getPages(filters?: {
    status?: string;
    search?: string;
    author_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ pages: NxdbPage[]; total: number }> {
    try {
      let query = supabase
        .from('nxdb_pages')
        .select(`
          *,
          author:profiles(id, full_name, email),
          categories:nxdb_page_category_relations(
            category:nxdb_page_categories(*)
          ),
          tags:nxdb_page_tag_relations(
            tag:nxdb_page_tags(*)
          )
        `)
        .order('updated_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%, content.ilike.%${filters.search}%`);
      }

      if (filters?.author_id) {
        query = query.eq('author_id', filters.author_id);
      }

      // Get total count
      const { count } = await supabase
        .from('nxdb_pages')
        .select('*', { count: 'exact', head: true });

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters?.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pages:', error);
        return { pages: [], total: 0 };
      }

      // Transform the data to flatten categories and tags
      const pages = data?.map(page => ({
        ...page,
        categories: page.categories?.map((rel: any) => rel.category) || [],
        tags: page.tags?.map((rel: any) => rel.tag) || []
      })) || [];

      return { pages, total: count || 0 };
    } catch (error) {
      console.error('Error fetching pages:', error);
      return { pages: [], total: 0 };
    }
  }

  // Get single page by ID
  async getPageById(id: string): Promise<NxdbPage | null> {
    try {
      const { data, error } = await supabase
        .from('nxdb_pages')
        .select(`
          *,
          author:profiles(id, full_name, email),
          categories:nxdb_page_category_relations(
            category:nxdb_page_categories(*)
          ),
          tags:nxdb_page_tag_relations(
            tag:nxdb_page_tags(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching page:', error);
        return null;
      }

      // Transform the data
      return {
        ...data,
        categories: data.categories?.map((rel: any) => rel.category) || [],
        tags: data.tags?.map((rel: any) => rel.tag) || []
      };
    } catch (error) {
      console.error('Error fetching page:', error);
      return null;
    }
  }

  // Get page by slug (for frontend)
  async getPageBySlug(slug: string): Promise<NxdbPage | null> {
    try {
      const { data, error } = await supabase
        .from('nxdb_pages')
        .select(`
          *,
          author:profiles(id, full_name, email),
          categories:nxdb_page_category_relations(
            category:nxdb_page_categories(*)
          ),
          tags:nxdb_page_tag_relations(
            tag:nxdb_page_tags(*)
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Error fetching page by slug:', error);
        return null;
      }

      // Transform the data
      return {
        ...data,
        categories: data.categories?.map((rel: any) => rel.category) || [],
        tags: data.tags?.map((rel: any) => rel.tag) || []
      };
    } catch (error) {
      console.error('Error fetching page by slug:', error);
      return null;
    }
  }

  // Create new page
  async createPage(pageData: CreatePageData): Promise<{ success: boolean; page?: NxdbPage; error?: string }> {
    try {
      // Use single transaction approach
      const { data: page, error: pageError } = await supabase
        .from('nxdb_pages')
        .insert({
          title: pageData.title,
          slug: pageData.slug,
          content: pageData.content,
          excerpt: pageData.excerpt,
          status: pageData.status,
          author_id: pageData.author_id,
          featured_image: pageData.featured_image,
          seo_title: pageData.seo_title,
          meta_description: pageData.meta_description,
          schema_types: pageData.schema_types,
          post_date: pageData.post_date,
          published_at: pageData.published_at
        })
        .select()
        .single();

      if (pageError) {
        console.error('Error creating page:', pageError);
        return { success: false, error: pageError.message };
      }

      // Add relations in parallel to reduce time and avoid multiple re-renders
      const promises = [];
      
      if (pageData.category_ids.length > 0) {
        const categoryRelations = pageData.category_ids.map(categoryId => ({
          page_id: page.id,
          category_id: categoryId
        }));
        promises.push(supabase.from('nxdb_page_category_relations').insert(categoryRelations));
      }

      if (pageData.tag_ids.length > 0) {
        const tagRelations = pageData.tag_ids.map(tagId => ({
          page_id: page.id,
          tag_id: tagId
        }));
        promises.push(supabase.from('nxdb_page_tag_relations').insert(tagRelations));
      }

      // Execute all relation inserts in parallel
      if (promises.length > 0) {
        await Promise.all(promises);
      }

      return { success: true, page };
    } catch (error) {
      console.error('Error creating page:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Update page
  async updatePage(pageData: UpdatePageData): Promise<{ success: boolean; page?: NxdbPage; error?: string }> {
    try {
      const { id, category_ids, tag_ids, ...updateData } = pageData;

      // Update page
      const { data: page, error: pageError } = await supabase
        .from('nxdb_pages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (pageError) {
        console.error('Error updating page:', pageError);
        return { success: false, error: pageError.message };
      }

      // Update category relations if provided
      if (category_ids !== undefined) {
        // Delete existing relations
        await supabase
          .from('nxdb_page_category_relations')
          .delete()
          .eq('page_id', id);

        // Add new relations
        if (category_ids.length > 0) {
          const categoryRelations = category_ids.map(categoryId => ({
            page_id: id,
            category_id: categoryId
          }));

          await supabase
            .from('nxdb_page_category_relations')
            .insert(categoryRelations);
        }
      }

      // Update tag relations if provided
      if (tag_ids !== undefined) {
        // Delete existing relations
        await supabase
          .from('nxdb_page_tag_relations')
          .delete()
          .eq('page_id', id);

        // Add new relations
        if (tag_ids.length > 0) {
          const tagRelations = tag_ids.map(tagId => ({
            page_id: id,
            tag_id: tagId
          }));

          await supabase
            .from('nxdb_page_tag_relations')
            .insert(tagRelations);
        }
      }

      return { success: true, page };
    } catch (error) {
      console.error('Error updating page:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Delete page
  async deletePage(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('nxdb_pages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting page:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting page:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Move to trash
  async moveToTrash(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('nxdb_pages')
        .update({ status: 'trash' })
        .eq('id', id);

      if (error) {
        console.error('Error moving page to trash:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error moving page to trash:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Restore from trash
  async restoreFromTrash(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('nxdb_pages')
        .update({ status: 'draft' })
        .eq('id', id);

      if (error) {
        console.error('Error restoring page from trash:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error restoring page from trash:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get categories
  async getCategories(): Promise<NxdbPageCategory[]> {
    try {
      const { data, error } = await supabase
        .from('nxdb_page_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Create category
  async createCategory(name: string, description?: string): Promise<{ success: boolean; category?: NxdbPageCategory; error?: string }> {
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Use a more controlled insert to prevent triggers that might cause reloads
      const { data, error } = await supabase
        .from('nxdb_page_categories')
        .insert({
          name: name.trim(),
          slug,
          description: description?.trim() || ''
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        return { success: false, error: error.message };
      }

      return { success: true, category: data };
    } catch (error) {
      console.error('Error creating category:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get tags
  async getTags(): Promise<NxdbPageTag[]> {
    try {
      const { data, error } = await supabase
        .from('nxdb_page_tags')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching tags:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
  }

  // Create tag
  async createTag(name: string): Promise<{ success: boolean; tag?: NxdbPageTag; error?: string }> {
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { data, error } = await supabase
        .from('nxdb_page_tags')
        .insert({
          name,
          slug
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating tag:', error);
        return { success: false, error: error.message };
      }

      return { success: true, tag: data };
    } catch (error) {
      console.error('Error creating tag:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Generate unique slug
  async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      let query = supabase
        .from('nxdb_pages')
        .select('id')
        .eq('slug', slug);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data } = await query;

      if (!data || data.length === 0) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Get page stats
  async getPageStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    trash: number;
    scheduled: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('nxdb_pages')
        .select('status');

      if (error) {
        console.error('Error fetching page stats:', error);
        return { total: 0, published: 0, draft: 0, trash: 0, scheduled: 0 };
      }

      const stats = {
        total: data.length,
        published: data.filter(p => p.status === 'published').length,
        draft: data.filter(p => p.status === 'draft').length,
        trash: data.filter(p => p.status === 'trash').length,
        scheduled: data.filter(p => p.status === 'scheduled').length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching page stats:', error);
      return { total: 0, published: 0, draft: 0, trash: 0, scheduled: 0 };
    }
  }
}

export const cmsPageService = new CmsPageService();