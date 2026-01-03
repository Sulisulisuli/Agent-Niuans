'use server'

import { createClient } from '@/utils/supabase/server'

export interface LinkedInShareResult {
    success: boolean
    postId?: string
    error?: string
}

export async function shareOnLinkedIn(
    content: string,
    articleUrl?: string,
    title?: string,
    thumbnailUrl?: string,
    visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
    authorType: 'person' | 'organization' = 'person',
    organizationId?: string
): Promise<LinkedInShareResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
        if (!member) return { success: false, error: 'No Org' }

        const { data: org } = await supabase.from('organizations').select('linkedin_config').eq('id', member.organization_id).single()
        const config = org?.linkedin_config as any
        if (!config?.accessToken || !config?.sub) return { success: false, error: 'LinkedIn Disconnected' }

        let authorUrn = `urn:li:person:${config.sub}`

        if (authorType === 'organization') {
            if (!organizationId) return { success: false, error: 'Organization ID not configured' }
            // Ensure inputs like "urn:li:organization:123" or just "123" both work
            const cleanOrgId = organizationId.replace('urn:li:organization:', '')
            authorUrn = `urn:li:organization:${cleanOrgId}`
        }

        // POSTS API BODY
        // Docs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
        const body: any = {
            author: authorUrn,
            commentary: content,
            visibility: visibility === 'PUBLIC' ? "PUBLIC" : "CONNECTIONS",
            distribution: {
                feedDistribution: "MAIN_FEED",
                targetEntities: [],
                thirdPartyDistributionChannels: []
            },
            lifecycleState: "PUBLISHED",
            isReshareDisabledByAuthor: false
        }

        // Handle Media (Article/Link)
        if (articleUrl) {
            body.content = {
                article: {
                    source: articleUrl,
                    title: title || "New Post",
                    // description: "...", // Optional
                    thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined
                }
            }
        }

        // TODO: Handle Image uploads via "media" field if needed later. 
        // For now, simple text or link/article share.

        console.log("LinkedIn Request Body (Posts API):", JSON.stringify(body, null, 2))

        const response = await fetch('https://api.linkedin.com/rest/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
                'LinkedIn-Version': '202401', // Using a recent version
            },
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('LinkedIn API Error:', errorText)
            return { success: false, error: `LinkedIn API Error: ${response.statusText} - ${errorText}` }
        }

        // Success - Posts API returns 201 Created and the ID in the 'x-restli-id' header or body
        // But simply checking 201/200 OK is enough for success flag.
        // The body might contain the ID or full object.
        const data = await response.json().catch(() => ({})) // Body might be empty on 201

        // The ID usually comes in the header 'x-linkedin-id' or 'x-restli-id' but fetch in server actions might abstract headers.
        // Let's try to get ID from body if available, or fall back to a generic success.
        const newPostId = data.id || response.headers.get('x-restli-id')

        return { success: true, postId: newPostId }

    } catch (error: any) {
        console.error('shareOnLinkedIn Exception:', error)
        return { success: false, error: error.message }
    }
}
