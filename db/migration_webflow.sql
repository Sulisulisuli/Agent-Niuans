-- Add Webflow Config to Organizations
alter table organizations 
add column webflow_config jsonb default '{}'::jsonb;

-- Example structure of webflow_config:
-- {
--   "apiToken": "...",
--   "siteId": "...",
--   "collectionId": "...",
--   "fieldMapping": {
--     "title": "name",
--     "content": "post-body",
--     "mainImage": "main-image"
--   }
-- }
