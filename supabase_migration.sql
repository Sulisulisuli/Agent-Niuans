-- Add these columns to your 'organizations' table in Supabase

alter table organizations
add column facebook_config jsonb default '{}'::jsonb,
add column instagram_config jsonb default '{}'::jsonb;
