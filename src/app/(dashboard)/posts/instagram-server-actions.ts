'use server'

import { createClient } from '@/utils/supabase/server'

export interface InstagramShareResult {
    success: boolean
    postId?: string
    error?: string
}

export async function shareOnInstagram(
    imageUrl: string,
    caption: string,
    instagramAccountId?: string
): Promise<InstagramShareResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
        if (!member) return { success: false, error: 'No Org' }

        const { data: org } = await supabase.from('organizations').select('instagram_config').eq('id', member.organization_id).single()
        const config = org?.instagram_config as any

        if (!config?.accessToken) return { success: false, error: 'Instagram Disconnected' }

        // 1. Get Instagram Business Account ID
        // If we don't have it stored or passed, we need to find it.
        // It's linked to the Facebook Page.
        // For MVP, we'll try to fetch connected accounts again or use the one if we had stored it.
        // In the auth callback we tried to store user ID. But that might be the FB User ID.
        // We need the IG Business Account ID.

        // Let's first check fields on 'me/accounts' to find the page, then the connected ig_business_account.
        const accountsParams = new URLSearchParams({
            access_token: config.accessToken,
            fields: 'id,name,instagram_business_account'
        })

        const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?${accountsParams}`)
        const accountsData = await accountsRes.json()

        if (accountsData.error) throw new Error(accountsData.error.message)

        let targetIgUserId: string | null = null

        // Find first page with a connected IG business account
        for (const page of accountsData.data) {
            if (page.instagram_business_account && page.instagram_business_account.id) {
                targetIgUserId = page.instagram_business_account.id
                break
            }
        }

        if (!targetIgUserId) return { success: false, error: 'No Instagram Business Account found linked to your Facebook Pages.' }

        // 2. Create Media Container
        // https://graph.facebook.com/v19.0/{ig-user-id}/media
        const containerParams = new URLSearchParams({
            access_token: config.accessToken, // User token is fine if it has permissions
            image_url: imageUrl,
            caption: caption
        })

        const containerRes = await fetch(`https://graph.facebook.com/v19.0/${targetIgUserId}/media?${containerParams}`, {
            method: 'POST'
        })
        const containerData = await containerRes.json()

        if (containerData.error) throw new Error("Media Create Error: " + containerData.error.message)

        const creationId = containerData.id

        // 3. Publish Media
        // https://graph.facebook.com/v19.0/{ig-user-id}/media_publish
        const publishParams = new URLSearchParams({
            access_token: config.accessToken,
            creation_id: creationId
        })

        const publishRes = await fetch(`https://graph.facebook.com/v19.0/${targetIgUserId}/media_publish?${publishParams}`, {
            method: 'POST'
        })
        const publishData = await publishRes.json()

        if (publishData.error) throw new Error("Media Publish Error: " + publishData.error.message)

        return { success: true, postId: publishData.id }

    } catch (error: any) {
        console.error('shareOnInstagram Exception:', error)
        return { success: false, error: error.message }
    }
}
