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
    visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC'
): Promise<LinkedInShareResult> {
    try {
        // ... (existing auth logic unchanged) ...
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
        if (!member) return { success: false, error: 'No Org' }

        const { data: org } = await supabase.from('organizations').select('linkedin_config').eq('id', member.organization_id).single()
        const config = org?.linkedin_config as any
        if (!config?.accessToken || !config?.sub) return { success: false, error: 'LinkedIn Disconnected' }

        const authorUrn = `urn:li:person:${config.sub}`

        const body = {
            author: authorUrn,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                        text: content
                    },
                    shareMediaCategory: articleUrl ? "ARTICLE" : "NONE",
                    media: articleUrl ? [
                        {
                            status: "READY",
                            description: {
                                text: "Read more"
                            },
                            originalUrl: articleUrl,
                            title: {
                                text: title || "New Post"
                            },
                            thumbnails: thumbnailUrl ? [{ url: thumbnailUrl }] : undefined
                        }
                    ] : undefined
                }
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": visibility
            }
        }


        console.log("LinkedIn Request Body:", JSON.stringify(body, null, 2))

        // 5. Send Request
        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('LinkedIn API Error:', errorText)
            return { success: false, error: `LinkedIn API Error: ${response.statusText}` }
        }

        const data = await response.json()
        return { success: true, postId: data.id }

    } catch (error: any) {
        console.error('shareOnLinkedIn Exception:', error)
        return { success: false, error: error.message }
    }
}
