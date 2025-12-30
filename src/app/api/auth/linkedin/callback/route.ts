import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const state = requestUrl.searchParams.get('state')
    const error = requestUrl.searchParams.get('error')

    if (error) {
        return redirect('/settings?error=linkedin_auth_failed')
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

    // Exchange code for access token
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`

    if (!clientId || !clientSecret) {
        console.error('Missing LinkedIn credentials')
        return redirect('/settings?error=config_error')
    }

    try {
        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: clientId,
                client_secret: clientSecret,
            }),
        })

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text()
            console.error('LinkedIn token error:', errorText)
            throw new Error('Failed to exchange token')
        }

        const tokenData = await tokenResponse.json()

        // Get User Profile to save name/avatar
        const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        })

        const profileData = await profileResponse.json()

        // Calculate expiresAt (60 days typically)
        const expiresAt = new Date()
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in)

        const linkedinConfig = {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token, // May be undefined if not provided initially
            expiresAt: expiresAt.toISOString(),
            profileName: profileData.name,
            profileImage: profileData.picture,
            sub: profileData.sub // LinkedIn unique user ID
        }

        // Save to Database
        // First find the organization
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (member) {
            // Fetch current config to merge
            const { data: org } = await supabase
                .from('organizations')
                .select('linkedin_config')
                .eq('id', member.organization_id)
                .single()

            const currentConfig = (org?.linkedin_config as any) || {}

            await supabase
                .from('organizations')
                .update({
                    linkedin_config: { ...currentConfig, ...linkedinConfig }
                })
                .eq('id', member.organization_id)
        }

        return redirect('/settings?success=linkedin_connected')

    } catch (err) {
        console.error('LinkedIn Auth Error:', err)
        return redirect('/settings?error=exception')
    }
}
