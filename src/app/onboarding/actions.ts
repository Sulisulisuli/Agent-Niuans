'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createOrganization(formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.error('Create Org: User not authenticated', { user })
            return { error: 'User not authenticated' }
        }

        console.log('Create Org: User authenticated', user.id)

        const companyName = formData.get('companyName') as string

        // Simple validation
        if (!companyName || companyName.length < 2) {
            return { error: 'Company Name is too short' }
        }

        // Generate slug
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000)

        console.log('Creating organization:', { name: companyName, slug, userId: user.id })

        console.log('Creating organization via RPC:', { name: companyName, slug })

        // Use RPC to create org and member atomically (bypass RLS)
        const { data: newOrgId, error: rpcError } = await supabase
            .rpc('create_organization_with_owner', {
                org_name: companyName,
                org_slug: slug
            })

        console.log('RPC Result:', { newOrgId, rpcError })

        if (rpcError) {
            console.error('RPC Error:', rpcError)
            return { error: 'Failed to create workspace: ' + rpcError.message }
        }

        if (!newOrgId) {
            return { error: 'Did not receive Organization ID' }
        }

        console.log('Organization created successfully:', newOrgId)

        // Update domain if provided (since RPC might not handle it yet)
        const companyDomain = formData.get('companyDomain') as string
        if (companyDomain) {
            // Check if brand_profile exists, if not init it
            await supabase.from('organizations').update({
                brand_profile: { domain: companyDomain }
            }).eq('id', newOrgId)
        }

        // No need to manually add member, RPC does it.

    } catch (err: any) {
        console.error('Unexpected Server Error:', err)
        return { error: 'Server Error: ' + err.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
