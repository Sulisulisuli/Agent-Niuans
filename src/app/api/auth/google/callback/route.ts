import { getOAuth2Client } from '@/lib/google/client';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');

    if (error) {
        console.error('Google Auth Error from query:', error);
        return redirect('/settings?error=google_auth_failed');
    }

    if (!code) {
        return redirect('/settings?error=no_code');
    }

    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return redirect('/login');
        }

        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        // Calculate expiresAt
        const expiresAt = new Date();
        if (tokens.expiry_date) {
            expiresAt.setTime(tokens.expiry_date);
        } else {
            // Default to 1 hour if not provided, though it usually is
            expiresAt.setHours(expiresAt.getHours() + 1);
        }

        const googleConfig = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token, // IMPORTANT: Only returned on first consent or forced consent
            expiresAt: expiresAt.toISOString(),
            scope: tokens.scope,
        };

        // Save to Database
        // First find the organization the user belongs to
        // TODO: Handle scenarios where user is in multiple orgs or has no org
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();

        if (member) {
            // Fetch current config to merge, to preserve selected properties if any (though we are just setting up now)
            const { data: org } = await supabase
                .from('organizations')
                .select('google_config')
                .eq('id', member.organization_id)
                .single();

            const currentConfig = (org?.google_config as any) || {};

            // Note: If refresh_token is missing in new tokens (e.g. re-auth without prompt), keep the old one
            if (!googleConfig.refreshToken && currentConfig.refreshToken) {
                googleConfig.refreshToken = currentConfig.refreshToken;
            }

            const { error: updateError } = await supabase
                .from('organizations')
                .update({
                    google_config: { ...currentConfig, ...googleConfig },
                })
                .eq('id', member.organization_id);

            if (updateError) {
                console.error('Failed to update organization with Google tokens:', updateError);
                return redirect('/settings?error=db_update_failed');
            }
        } else {
            console.error('User not found in any organization');
            return redirect('/settings?error=no_organization');
        }

        return redirect('/settings?success=google_connected');
    } catch (err) {
        console.error('Google Auth Callback Error:', err);
        return redirect('/settings?error=exception');
    }
}
