-- RPC: Create Organization and Owner Member in one transaction
-- This bypasses RLS issues (because user isn't member yet when creating org)
-- "security definer" means it runs with admin privileges

create or replace function create_organization_with_owner(
  org_name text,
  org_slug text
) returns uuid as $$
declare
  new_org_id uuid;
begin
  -- 1. Create Organization
  insert into organizations (name, slug)
  values (org_name, org_slug)
  returning id into new_org_id;

  -- 2. Create Owner Membership for the calling user
  insert into organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'owner');

  return new_org_id;
end;
$$ language plpgsql security definer;
