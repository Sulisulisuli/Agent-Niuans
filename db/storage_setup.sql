insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Set up access policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'post-images' );

create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'post-images' and auth.role() = 'authenticated' );
