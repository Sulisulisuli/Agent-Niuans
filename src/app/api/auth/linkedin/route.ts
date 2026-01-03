import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function GET(request: Request) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID
    console.log('DEBUG: LinkedIn Auth Route Hit')
    console.log('DEBUG: LINKEDIN_CLIENT_ID exists?', !!clientId)
    console.log('DEBUG: LINKEDIN_CLIENT_ID value (first 4 chars):', clientId?.substring(0, 4))

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`
    const state = Math.random().toString(36).substring(7)

    // NOTE: w_organization_social requires "Marketing Developer Platform" product in LinkedIn Portal
    // Adding it without approval causes a "Bummer, something went wrong" error on LinkedIn.
    const scope = encodeURIComponent('w_member_social w_organization_social r_organization_social rw_organization_admin openid profile email')

    if (!clientId) {
        return Response.json({ error: 'LinkedIn Client ID not configured' }, { status: 500 })
    }

    const linkedinUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`

    redirect(linkedinUrl)
}
