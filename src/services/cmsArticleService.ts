import { supabase } from '@/lib/supabase';
import { NxdbArticle, NxdbArticleCategory, NxdbArticleTag } from '@/lib/supabase';

export interface CreateArticleData {
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

export interface UpdateArticleData extends Partial<CreateArticleData> {
  id: string;
}

class CmsArticleService {
  // Get all articles with filters
  async getArticles(filters?: {
    status?: string;
    search?: string;
    author_id?: string;
    category_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ articles: NxdbArticle[]; total: number }> {
    try {
      let query = supabase
        .from('nxdb_articles')
        .select(`
          *,
          author:profiles(id, full_name, email),
          categories:nxdb_article_category_relations(
            category:nxdb_article_categories(*)
          ),
          tags:nxdb_article_tag_relations(
            tag:nxdb_article_tags(*)
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
        .from('nxdb_articles')
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
        console.error('Error fetching articles:', error);
        return { articles: [], total: 0 };
      }

      // Transform the data to flatten categories and tags
      const articles = data?.map(article => ({
        ...article,
        categories: article.categories?.map((rel: any) => rel.category) || [],
        tags: article.tags?.map((rel: any) => rel.tag) || []
      })) || [];

      return { articles, total: count || 0 };
    } catch (error) {
      console.error('Error fetching articles:', error);
      return { articles: [], total: 0 };
    }
  }

  // Get single article by ID
  async getArticleById(id: string): Promise<NxdbArticle | null> {
    try {
      const { data, error } = await supabase
        .from('nxdb_articles')
        .select(`
          *,
          author:profiles(id, full_name, email),
          categories:nxdb_article_category_relations(
            category:nxdb_article_categories(*)
          ),
          tags:nxdb_article_tag_relations(
            tag:nxdb_article_tags(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching article:', error);
        return null;
      }

      // Transform the data
      return {
        ...data,
        categories: data.categories?.map((rel: any) => rel.category) || [],
        tags: data.tags?.map((rel: any) => rel.tag) || []
      };
    } catch (error) {
      console.error('Error fetching article:', error);
      return null;
    }
  }

  // Get article by slug (for frontend)
  async getArticleBySlug(slug: string): Promise<NxdbArticle | null> {
    try {
      const { data, error } = await supabase
        .from('nxdb_articles')
        .select(`
          *,
          author:profiles(id, full_name, email),
          categories:nxdb_article_category_relations(
            category:nxdb_article_categories(*)
          ),
          tags:nxdb_article_tag_relations(
            tag:nxdb_article_tags(*)
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Error fetching article by slug:', error);
        return null;
      }

      // Transform the data
      return {
        ...data,
        categories: data.categories?.map((rel: any) => rel.category) || [],
        tags: data.tags?.map((rel: any) => rel.tag) || []
      };
    } catch (error) {
      console.error('Error fetching article by slug:', error);
      return null;
    }
  }

  // Create new article
  async createArticle(articleData: CreateArticleData): Promise<{ success: boolean; article?: NxdbArticle; error?: string }> {
    try {
      // Use RPC for atomic transaction
      const { data, error } = await supabase.rpc('create_article_with_relations', {
        article_data: {
          title: articleData.title,
          slug: articleData.slug,
          content: articleData.content,
          excerpt: articleData.excerpt,
          status: articleData.status,
          author_id: articleData.author_id,
          featured_image: articleData.featured_image,
          seo_title: articleData.seo_title,
          meta_description: articleData.meta_description,
          schema_types: articleData.schema_types,
          post_date: articleData.post_date,
          published_at: articleData.published_at
        },
        category_ids: articleData.category_ids,
        tag_ids: articleData.tag_ids
      });

      if (error) {
        console.error('Error creating article:', error);
        return { success: false, error: error.message };
      }

      return { success: true, article: data };
    } catch (error) {
      console.error('Error creating article:', error);
      
      // Fallback to original method if RPC doesn't exist
      try {
        const { data: article, error: articleError } = await supabase
          .from('nxdb_articles')
          .insert({
            title: articleData.title,
            slug: articleData.slug,
            content: articleData.content,
            excerpt: articleData.excerpt,
            status: articleData.status,
            author_id: articleData.author_id,
            featured_image: articleData.featured_image,
            seo_title: articleData.seo_title,
            meta_description: articleData.meta_description,
            schema_types: articleData.schema_types,
            post_date: articleData.post_date,
            published_at: articleData.published_at
          })
          .select()
          .single();

        if (articleError) {
          return { success: false, error: articleError.message };
        }

        // Add relations in parallel to reduce time
        const promises = [];
        
        if (articleData.category_ids.length > 0) {
          const categoryRelations = articleData.category_ids.map(categoryId => ({
            article_id: article.id,
            category_id: categoryId
          }));
          promises.push(supabase.from('nxdb_article_category_relations').insert(categoryRelations));
        }

        if (articleData.tag_ids.length > 0) {
          const tagRelations = articleData.tag_ids.map(tagId => ({
            article_id: article.id,
            tag_id: tagId
          }));
          promises.push(supabase.from('nxdb_article_tag_relations').insert(tagRelations));
        }

        await Promise.all(promises);
        return { success: true, article };
      } catch (fallbackError) {
        console.error('Fallback error creating article:', fallbackError);
        return { success: false, error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error' };
      }
    }
  }

  // Update article
  async updateArticle(articleData: UpdateArticleData): Promise<{ success: boolean; article?: NxdbArticle; error?: string }> {
    try {
      const { id, category_ids, tag_ids, ...updateData } = articleData;

      // Update article
      const { data: article, error: articleError } = await supabase
        .from('nxdb_articles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (articleError) {
        console.error('Error updating article:', articleError);
        return { success: false, error: articleError.message };
      }

      // Update category relations if provided
      if (category_ids !== undefined) {
        // Delete existing relations
        await supabase
          .from('nxdb_article_category_relations')
          .delete()
          .eq('article_id', id);

        // Add new relations
        if (category_ids.length > 0) {
          const categoryRelations = category_ids.map(categoryId => ({
            article_id: id,
            category_id: categoryId
          }));

          await supabase
            .from('nxdb_article_category_relations')
            .insert(categoryRelations);
        }
      }

      // Update tag relations if provided
      if (tag_ids !== undefined) {
        // Delete existing relations
        await supabase
          .from('nxdb_article_tag_relations')
          .delete()
          .eq('article_id', id);

        // Add new relations
        if (tag_ids.length > 0) {
          const tagRelations = tag_ids.map(tagId => ({
            article_id: id,
            tag_id: tagId
          }));

          await supabase
            .from('nxdb_article_tag_relations')
            .insert(tagRelations);
        }
      }

      return { success: true, article };
    } catch (error) {
      console.error('Error updating article:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Delete article
  async deleteArticle(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('nxdb_articles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting article:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting article:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get categories
  async getCategories(): Promise<NxdbArticleCategory[]> {
    try {
      const { data, error } = await supabase
        .from('nxdb_article_categories')
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
  async createCategory(name: string, description?: string): Promise<{ success: boolean; category?: NxdbArticleCategory; error?: string }> {
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Use a more controlled insert to prevent triggers that might cause reloads
      const { data, error } = await supabase
        .from('nxdb_article_categories')
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
  async getTags(): Promise<NxdbArticleTag[]> {
    try {
      const { data, error } = await supabase
        .from('nxdb_article_tags')
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
  async createTag(name: string): Promise<{ success: boolean; tag?: NxdbArticleTag; error?: string }> {
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { data, error } = await supabase
        .from('nxdb_article_tags')
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
        .from('nxdb_articles')
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

  // Get article stats
  async getArticleStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    trash: number;
    scheduled: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('nxdb_articles')
        .select('status');

      if (error) {
        console.error('Error fetching article stats:', error);
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
      console.error('Error fetching article stats:', error);
      return { total: 0, published: 0, draft: 0, trash: 0, scheduled: 0 };
    }
  }

  // Get articles by category slug for frontend
  async getArticlesByCategory(categorySlug: string, limit: number = 10, offset: number = 0): Promise<{ articles: NxdbArticle[]; total: number }> {
    try {
      // First get the category
      const { data: category, error: categoryError } = await supabase
        .from('nxdb_article_categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

      if (categoryError || !category) {
        return { articles: [], total: 0 };
      }

      // Get articles with that category
      const { data: relations, error: relationsError } = await supabase
        .from('nxdb_article_category_relations')
        .select(`
          article:nxdb_articles(
            *,
            author:profiles(id, full_name, email),
            categories:nxdb_article_category_relations(
              category:nxdb_article_categories(*)
            ),
            tags:nxdb_article_tag_relations(
              tag:nxdb_article_tags(*)
            )
          )
        `)
        .eq('category_id', category.id)
        .eq('article.status', 'published')
        .order('article(published_at)', { ascending: false })
        .range(offset, offset + limit - 1);

      if (relationsError) {
        console.error('Error fetching articles by category:', relationsError);
        return { articles: [], total: 0 };
      }

      // Transform the data
      const articles = relations?.map((rel: any) => ({
        ...rel.article,
        categories: rel.article.categories?.map((catRel: any) => catRel.category) || [],
        tags: rel.article.tags?.map((tagRel: any) => tagRel.tag) || []
      })) || [];

      // Get total count
      const { count } = await supabase
        .from('nxdb_article_category_relations')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);

      return { articles, total: count || 0 };
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      return { articles: [], total: 0 };
    }
  }

  // Get published articles for frontend
  async getPublishedArticles(limit: number = 10, offset: number = 0): Promise<{ articles: NxdbArticle[]; total: number }> {
    const { data, error } = await supabase
      .from('nxdb_articles')
      .select(`
        *,
        author:profiles(id, full_name, email),
        categories:nxdb_article_category_relations(
          category:nxdb_article_categories(*)
        ),
        tags:nxdb_article_tag_relations(
          tag:nxdb_article_tags(*)
        )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching published articles:', error);
      return { articles: [], total: 0 };
    }

    // Transform the data
    const articles = data?.map(article => ({
      ...article,
      categories: article.categories?.map((rel: any) => rel.category) || [],
      tags: article.tags?.map((rel: any) => rel.tag) || []
    })) || [];

    // Get total count
    const { count } = await supabase
      .from('nxdb_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    return { articles, total: count || 0 };
  }

  async getPublishedArticlesByCategory(categorySlug: string, limit: number = 10, offset: number = 0): Promise<{ articles: NxdbArticle[]; total: number }> {
    const { data, error } = await supabase
      .from('nxdb_articles')
      .select(`
        *,
        author:profiles(id, full_name, email),
        categories:nxdb_article_category_relations(
          category:nxdb_article_categories(*)
        ),
        tags:nxdb_article_tag_relations(
          tag:nxdb_article_tags(*)
        )
      `)
      .eq('status', 'published')
      .eq('categories.category.slug', categorySlug)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching published articles by category:', error);
      return { articles: [], total: 0 };
    }

    // Transform the data
    const articles = data?.map(article => ({
      ...article,
      categories: article.categories?.map((rel: any) => rel.category) || [],
      tags: article.tags?.map((rel: any) => rel.tag) || []
    })) || [];

    // Get total count - this is a bit trickier, might need a separate query
    const { count } = await supabase
      .from('nxdb_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published'); // Consider optimising this query

    return {
      articles: articles,
      total: count || 0
    };
  }
}

export const cmsArticleService = new CmsArticleService();