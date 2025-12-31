import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestUrl = new URL(request.url)
    const connectService = requestUrl.searchParams.get('connect') || 'facebook' // 'facebook' or 'instagram'

    const clientId = process.env.FACEBOOK_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`
    const state = JSON.stringify({
        nonce: Math.random().toString(36).substring(7),
        service: connectService
    })

    if (!clientId) {
        return Response.json({ error: 'Facebook Client ID not configured' }, { status: 500 })
    }

    // Common scopes
    // pages_show_list, pages_read_engagement, pages_manage_posts -> For FB Pages
    // instagram_basic, instagram_content_publish -> For Instagram
    // public_profile, email -> Common
    const scope = 'public_profile email pages_show_list pages_read_engagement pages_manage_posts instagram_basic instagram_content_publish'

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`

    redirect(authUrl)
}
