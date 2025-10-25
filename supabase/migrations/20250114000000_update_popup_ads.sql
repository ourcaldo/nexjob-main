
-- Update admin_settings table for new popup ad system
ALTER TABLE admin_settings 
DROP COLUMN IF EXISTS popup_ad_code;

-- Add new popup ad columns
ALTER TABLE admin_settings 
ADD COLUMN popup_ad_url text DEFAULT '',
ADD COLUMN popup_ad_enabled boolean DEFAULT false,
ADD COLUMN popup_ad_load_settings text[] DEFAULT ARRAY['all_pages'], -- 'all_pages', 'single_articles'
ADD COLUMN popup_ad_max_executions integer DEFAULT 1,
ADD COLUMN popup_ad_device text DEFAULT 'all'; -- 'mobile', 'desktop', 'all'

-- Update existing row if exists, otherwise these will be default values
UPDATE admin_settings 
SET 
  popup_ad_url = '',
  popup_ad_enabled = false,
  popup_ad_load_settings = ARRAY['all_pages'],
  popup_ad_max_executions = 1,
  popup_ad_device = 'all'
WHERE id = 1;
