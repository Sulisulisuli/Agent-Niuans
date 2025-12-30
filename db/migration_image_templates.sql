-- Create image_templates table
create table image_templates (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  organization_id uuid references organizations(id) on delete cascade not null,
  config jsonb not null default '{}'::jsonb,
  thumbnail_url text, -- Preview image URL
  category text -- 'news', 'tutorial', 'promo', etc.
);

-- Enable RLS
alter table image_templates enable row level security;

-- Policies (Assuming standard RLS setup where users can access data for their orgs)
-- This policy checks if the user is a member of the organization linked to the template
create policy "Users can view templates of their organization"
  on image_templates for select
  using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = image_templates.organization_id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Users can insert templates for their organization"
  on image_templates for insert
  with check (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = image_templates.organization_id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Users can update templates of their organization"
  on image_templates for update
  using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = image_templates.organization_id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Users can delete templates of their organization"
  on image_templates for delete
  using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = image_templates.organization_id
      and organization_members.user_id = auth.uid()
    )
  );
