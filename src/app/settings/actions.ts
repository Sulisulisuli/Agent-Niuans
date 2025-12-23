'use server'

import { createClient } from '@/utils/supabase/server'
import { WebflowClient } from '@/lib/webflow'
import { revalidatePath } from 'next/cache'

export async function saveWebflowToken(token: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Log user and member search
        console.log('SaveToken: User', user.id)

        // Find org (assuming single org for now)
        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (memberError) console.error('Member fetch error:', memberError)

        let orgId = member?.organization_id
        console.log('SaveToken: Found Org ID', orgId)

        if (!orgId) {
            // Create new org
            const { data: newOrg, error: orgError } = await supabase
                .from('organizations')
                .insert({ name: 'My Workspace', slug: `workspace-${user.id.slice(0, 6)}` })
                .select()
                .single()

            if (orgError) throw new Error('Failed to create organization: ' + orgError.message)
            orgId = newOrg.id

            // Add member
            await supabase.from('organization_members').insert({
                organization_id: orgId,
                user_id: user.id,
                role: 'owner'
            })
        }

        // Update config
        const { data: org } = await supabase.from('organizations').select('webflow_config').eq('id', orgId).single()
        const currentConfig = org?.webflow_config || {}

        const { error: updateError } = await supabase
            .from('organizations')
            .update({
                webflow_config: { ...currentConfig, apiToken: token }
            })
            .eq('id', orgId)

        console.log('SaveToken: Update Result', { orgId, updateError })

        if (updateError) throw new Error('Failed to save token: ' + updateError.message)

        return { success: true }
    } catch (error: any) {
        console.error('Save Token Error:', error)
        return { error: error.message || 'Unknown server error' }
    }
}

export async function getWebflowSites(token: string) {
    try {
        const webflow = new WebflowClient(token)
        const sites = await webflow.listSites()
        return { sites }
    } catch (error: any) {
        console.error('getWebflowSites Error:', error)
        return { error: error.message || 'Failed to fetch sites' }
    }
}

export async function getWebflowCollections(token: string, siteId: string) {
    console.log('getWebflowCollections calling:', siteId)
    try {
        const webflow = new WebflowClient(token)
        const collections = await webflow.listCollections(siteId)
        console.log('getWebflowCollections success, count:', collections.length)
        return { collections }
    } catch (error: any) {
        console.error('getWebflowCollections Error:', error)
        return { error: error.message || 'Failed to fetch collections' }
    }
}


export async function getWebflowCollection(token: string, collectionId: string) {
    try {
        const webflow = new WebflowClient(token)
        const collection = await webflow.getCollection(collectionId)
        return { collection }
    } catch (error: any) {
        console.error('getWebflowCollection Error:', error)
        return { error: error.message || 'Failed to fetch collection details' }
    }
}

export async function createNewWebflowCollection(token: string, siteId: string) {
    try {
        const webflow = new WebflowClient(token)

        const fields = [
            { displayName: 'Post Content', slug: 'post-content', type: 'RichText' },
            { displayName: 'Post Excerpt', slug: 'post-excerpt', type: 'PlainText' },
            { displayName: 'Main Image', slug: 'main-image', type: 'Image' }
        ]

        const collection = await webflow.createCollection(
            siteId,
            'Agent Niuans Posts',
            'Post',
            'agent-niuans-posts',
            fields
        )

        return { collection }
    } catch (error: any) {
        console.error('createNewWebflowCollection Error:', error)
        return { error: error.message || 'Failed to create collection' }
    }
}

export async function saveWebflowConfig(config: any, shouldRevalidate = false) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get Org ID (reuse logic)
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member) throw new Error('No organization')

    // Merge with existing config
    const { data: org } = await supabase.from('organizations').select('webflow_config').eq('id', member.organization_id).single()
    const currentConfig = org?.webflow_config || {}

    await supabase
        .from('organizations')
        .update({
            webflow_config: { ...currentConfig, ...config }
        })
        .eq('id', member.organization_id)

    if (shouldRevalidate) {
        revalidatePath('/settings')
    }
    return { success: true }
}
export async function getOrganizationProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!member) return { error: 'No organization found' }

    const { data: org, error } = await supabase
        .from('organizations')
        .select('name, slug, brand_profile')
        .eq('id', member.organization_id)
        .single()

    if (error) return { error: error.message }

    // Merge core fields into the returned object or return strictly structured
    return {
        profile: org?.brand_profile || {},
        orgDetails: {
            name: org?.name,
            slug: org?.slug,
            domain: org?.brand_profile?.domain || ''
        }
    }
}

export async function saveOrganizationProfile(profile: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!member) return { error: 'No organization found' }

    const { error } = await supabase
        .from('organizations')
        .update({ brand_profile: profile })
        .eq('id', member.organization_id)

    if (error) return { error: error.message }

    revalidatePath('/settings/organization')
    return { success: true }
}

export async function updateOrganizationDetails(name: string, domain: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!member) return { error: 'No organization found' }

    // Validate
    if (!name || name.length < 2) return { error: 'Name must be at least 2 characters' }

    // 1. Get current profile to merge
    const { data: org, error: fetchError } = await supabase
        .from('organizations')
        .select('brand_profile')
        .eq('id', member.organization_id)
        .single()

    if (fetchError) return { error: 'Failed to fetch current profile' }

    const currentProfile = org?.brand_profile || {}
    const updatedProfile = { ...currentProfile, domain }

    // 2. Update name (root) and domain (jsonb)
    const { error } = await supabase
        .from('organizations')
        .update({
            name,
            brand_profile: updatedProfile
        })
        .eq('id', member.organization_id)

    if (error) return { error: error.message }

    revalidatePath('/settings/organization')
    return { success: true }
}
