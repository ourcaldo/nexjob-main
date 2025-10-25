
-- Create articles table
CREATE TABLE nxdb_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL DEFAULT '',
    excerpt TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'trash', 'scheduled')),
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    featured_image TEXT,
    seo_title TEXT,
    meta_description TEXT,
    schema_types TEXT[] DEFAULT ARRAY['Article'],
    post_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create article categories table
CREATE TABLE nxdb_article_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create article tags table
CREATE TABLE nxdb_article_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create article category relations table
CREATE TABLE nxdb_article_category_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES nxdb_articles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES nxdb_article_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, category_id)
);

-- Create article tag relations table
CREATE TABLE nxdb_article_tag_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES nxdb_articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES nxdb_article_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX idx_articles_slug ON nxdb_articles(slug);
CREATE INDEX idx_articles_status ON nxdb_articles(status);
CREATE INDEX idx_articles_author_id ON nxdb_articles(author_id);
CREATE INDEX idx_articles_published_at ON nxdb_articles(published_at);
CREATE INDEX idx_article_categories_slug ON nxdb_article_categories(slug);
CREATE INDEX idx_article_tags_slug ON nxdb_article_tags(slug);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON nxdb_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_article_categories_updated_at BEFORE UPDATE ON nxdb_article_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_article_tags_updated_at BEFORE UPDATE ON nxdb_article_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE nxdb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nxdb_article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nxdb_article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE nxdb_article_category_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nxdb_article_tag_relations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Articles are viewable by everyone for published content" ON nxdb_articles
    FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');

CREATE POLICY "Articles are editable by authenticated users" ON nxdb_articles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Article categories are viewable by everyone" ON nxdb_article_categories
    FOR SELECT USING (true);

CREATE POLICY "Article categories are editable by authenticated users" ON nxdb_article_categories
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Article tags are viewable by everyone" ON nxdb_article_tags
    FOR SELECT USING (true);

CREATE POLICY "Article tags are editable by authenticated users" ON nxdb_article_tags
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Article category relations are viewable by everyone" ON nxdb_article_category_relations
    FOR SELECT USING (true);

CREATE POLICY "Article category relations are editable by authenticated users" ON nxdb_article_category_relations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Article tag relations are viewable by everyone" ON nxdb_article_tag_relations
    FOR SELECT USING (true);

CREATE POLICY "Article tag relations are editable by authenticated users" ON nxdb_article_tag_relations
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert some default article categories
INSERT INTO nxdb_article_categories (name, slug, description) VALUES
('Tips Karir', 'tips-karir', 'Tips dan trik untuk mengembangkan karir'),
('Industri', 'industri', 'Berita dan update tentang berbagai industri'),
('Wawancara Kerja', 'wawancara-kerja', 'Panduan dan tips untuk wawancara kerja'),
('Skill Development', 'skill-development', 'Artikel tentang pengembangan skill dan kemampuan'),
('Berita Kerja', 'berita-kerja', 'Berita terbaru seputar dunia kerja dan lowongan');
