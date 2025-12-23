-- Allow organization updates by owners
create policy "Users can update their own organization"
on organizations for update
to authenticated
using (
    id in (
        select organization_id 
        from organization_members 
        where user_id = auth.uid() 
        and role = 'owner' -- Or allow 'member' if desired, usually only owners/admins
    )
)
with check (
    id in (
        select organization_id 
        from organization_members 
        where user_id = auth.uid() 
        and role = 'owner'
    )
);
