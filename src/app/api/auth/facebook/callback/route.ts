import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const stateParam = requestUrl.searchParams.get('state')
    const error = requestUrl.searchParams.get('error')

    if (error) {
        return redirect('/settings?error=facebook_auth_failed')
    }

    if (!code) {
        return redirect('/settings?error=no_code')
    }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Parse State to check service type
    let service = 'facebook'
    try {
        if (stateParam) {
            const stateObj = JSON.parse(decodeURIComponent(stateParam))
            service = stateObj.service || 'facebook'
        }
    } catch (e) {
        console.warn('Failed to parse state, defaulting to facebook')
    }

    const clientId = process.env.FACEBOOK_CLIENT_ID
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`

    if (!clientId || !clientSecret) {
        console.error('Missing Facebook credentials')
        return redirect('/settings?error=config_error')
    }

    try {
        // Exchange code for short-lived token
        const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`)

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text()
            console.error('Facebook token exchange error:', errorText)
            throw new Error('Failed to exchange token')
        }

        const tokenData = await tokenResponse.json()
        const shortLivedToken = tokenData.access_token

        // Exchange for long-lived token
        const longLivedResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`)

        const longLivedData = await longLivedResponse.json()
        const accessToken = longLivedData.access_token || shortLivedToken // Fallback
        const expiresSeconds = longLivedData.expires_in || 5184000 // 60 days default

        // Calculate expiresAt
        const expiresAt = new Date()
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresSeconds)

        // Fetch User Info (Name/ID)
        const meResponse = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${accessToken}`)
        const meData = await meResponse.json()


        // PREPARE CONFIG
        const configToSave = {
            userId: meData.id,
            userName: meData.name,
            userPicture: meData.picture?.data?.url,
            accessToken: accessToken, // User Token (Need to get Page token later usually, but User token with permission works for some Graph calls, or we fetch page token on fly)
            expiresAt: expiresAt.toISOString(),
            connectedAt: new Date().toISOString()
        }

        // Save to Database based on Service
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (member) {
            const { data: org } = await supabase
                .from('organizations')
                .select('facebook_config, instagram_config')
                .eq('id', member.organization_id)
                .single()

            if (service === 'instagram') {
                const current = (org?.instagram_config as any) || {}
                // For Instagram, we might want to fetch connected IG accounts here or let the UI handle selection
                // Saving basic auth data first
                await supabase.from('organizations').update({
                    instagram_config: { ...current, ...configToSave }
                }).eq('id', member.organization_id)
            } else {
                const current = (org?.facebook_config as any) || {}
                await supabase.from('organizations').update({
                    facebook_config: { ...current, ...configToSave }
                }).eq('id', member.organization_id)
            }
        }

        return redirect(`/settings?success=${service}_connected`)

    } catch (err) {
        console.error('Facebook Auth Error:', err)
        return redirect('/settings?error=exception')
    }
}
