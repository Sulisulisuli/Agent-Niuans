-- Create asset_tracker table
create table if not exists asset_tracker (
  id uuid default gen_random_uuid() primary key,
  storage_path text not null,
  bucket_id text not null,
  is_confirmed boolean default false,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '24 hours') not null
);

-- Enable RLS
alter table asset_tracker enable row level security;

-- Policy: Users can view their own assets
create policy "Users can view own assets"
  on asset_tracker for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own assets
create policy "Users can insert own assets"
  on asset_tracker for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own assets
create policy "Users can update own assets"
  on asset_tracker for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own assets
create policy "Users can delete own assets"
  on asset_tracker for delete
  using (auth.uid() = user_id);

-- Create index for faster cleanup queries
create index asset_tracker_expires_at_idx on asset_tracker (expires_at) where is_confirmed = false;
