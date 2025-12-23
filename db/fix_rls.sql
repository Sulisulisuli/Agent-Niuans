-- Create RLS Policy for Inserting Organizations
-- Enable users to insert organizations (needed for onboarding)
create policy "Users can populate organization_members"
on organization_members for insert
to authenticated
with check ( auth.uid() = user_id );

create policy "Users can create organizations"
on organizations for insert
to authenticated
with check ( true ); 

-- Also ensure they can read what they created (already done usually but making sure)
create policy "Users can read own organizations"
on organizations for select
to authenticated
using (
    id in (
        select organization_id from organization_members where user_id = auth.uid()
    )
);

create policy "Users can read own memberships"
on organization_members for select
to authenticated
using ( user_id = auth.uid() );
