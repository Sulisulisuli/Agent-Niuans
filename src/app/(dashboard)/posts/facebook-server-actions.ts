'use server'

import { createClient } from '@/utils/supabase/server'

export interface FacebookShareResult {
    success: boolean
    postId?: string
    error?: string
}

export async function shareOnFacebook(
    content: string,
    linkUrl?: string,
    imageUrl?: string, // Facebook prefers either link or image, or text
    pageId?: string
): Promise<FacebookShareResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
        if (!member) return { success: false, error: 'No Org' }

        const { data: org } = await supabase.from('organizations').select('facebook_config').eq('id', member.organization_id).single()
        const config = org?.facebook_config as any

        if (!config?.accessToken) return { success: false, error: 'Facebook Disconnected' }

        // 1. Get Page Access Token (User token -> Page Token)
        // If we stored the page token directly, we could skip this. But we stored User Token.
        // We need to find the Page ID we want to post to.
        // For MVP, we will fetch the first page or let user select in UI.
        // Ideally pass pageId from UI. If not passed, use the first one.

        const accountsParams = new URLSearchParams({
            access_token: config.accessToken,
            fields: 'id,name,access_token'
        })

        const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?${accountsParams}`)
        const accountsData = await accountsRes.json()

        if (accountsData.error) throw new Error(accountsData.error.message)
        if (!accountsData.data || accountsData.data.length === 0) return { success: false, error: 'No Facebook Pages found' }

        let targetPage = accountsData.data[0]
        if (pageId) {
            const found = accountsData.data.find((p: any) => p.id === pageId)
            if (found) targetPage = found
        }

        const pageAccessToken = targetPage.access_token
        const targetPageId = targetPage.id

        // 2. Prepare Post Request
        const endpoint = `https://graph.facebook.com/v19.0/${targetPageId}/feed`
        const params: Record<string, string> = {
            access_token: pageAccessToken,
            message: content
        }

        if (linkUrl) {
            params.link = linkUrl
        } else if (imageUrl) {
            // If posting an image, we should use /photos endpoint instead strictly speaking, 
            // but for simplicity let's see if we can just post a link to image or if we want real image upload.
            // Requirement says "same as LinkedIn". LinkedIn allowed "thumbnailUrl".
            // FB /feed allows 'link' which renders a preview.
            // If we want to upload a photo, we use /{page-id}/photos with url param.

            // Let's stick to /feed with link for now if link provided.
            // If ONLY image provided (no link), use /photos.
            const photoEndpoint = `https://graph.facebook.com/v19.0/${targetPageId}/photos`
            const photoParams = {
                access_token: pageAccessToken,
                url: imageUrl,
                caption: content
            }

            const photoRes = await fetch(photoEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(photoParams)
            })
            const photoData = await photoRes.json()
            if (photoData.error) throw new Error(photoData.error.message)
            return { success: true, postId: photoData.id }
        }

        // Regular Feed Post (Text or Link)
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        })

        const data = await res.json()
        if (data.error) throw new Error(data.error.message)

        return { success: true, postId: data.id }

    } catch (error: any) {
        console.error('shareOnFacebook Exception:', error)
        return { success: false, error: error.message }
    }
}
