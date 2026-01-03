-- 1. Create the cleanup function
create or replace function cleanup_expired_assets_sql()
returns void
language plpgsql
security definer
as $$
declare
  expiration_time timestamptz := now();
begin
  -- Delete files from storage (cascades to file deletion)
  -- Join tracking table with storage.objects
  delete from storage.objects
  using asset_tracker
  where storage.objects.bucket_id = asset_tracker.bucket_id
  and storage.objects.name = asset_tracker.storage_path
  and asset_tracker.is_confirmed = false
  and asset_tracker.expires_at < expiration_time;

  -- Delete the tracking records
  delete from asset_tracker
  where is_confirmed = false
  and expires_at < expiration_time;
end;
$$;

-- 2. Enable pg_cron (if not enabled)
create extension if not exists pg_cron;

-- 3. Schedule the job (Runs daily at 3:00 AM GMT)
select cron.schedule(
  'native-cleanup-daily',
  '0 3 * * *', 
  $$ select cleanup_expired_assets_sql() $$
);
