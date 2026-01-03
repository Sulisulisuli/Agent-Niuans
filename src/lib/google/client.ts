import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';

export function getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
        throw new Error('Missing Google OAuth credentials');
    }

    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );
}

export async function getAuthenticatedClient(organizationId: string) {
    const supabase = await createClient();

    const { data: org, error } = await supabase
        .from('organizations')
        .select('google_config')
        .eq('id', organizationId)
        .single();

    if (error || !org || !org.google_config) {
        throw new Error('Organization not connected to Google');
    }

    const config = org.google_config as any; // Cast from JSONB
    const oauth2Client = getOAuth2Client();

    oauth2Client.setCredentials({
        access_token: config.accessToken,
        refresh_token: config.refreshToken,
        expiry_date: config.expiresAt ? new Date(config.expiresAt).getTime() : undefined,
        scope: config.scope,
    });

    // Check if token needs refreshing
    const isExpired = config.expiresAt && new Date(config.expiresAt).getTime() < Date.now();

    if (isExpired && config.refreshToken) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();

            // Update DB
            const newExpiresAt = credentials.expiry_date
                ? new Date(credentials.expiry_date).toISOString()
                : new Date(Date.now() + 3600 * 1000).toISOString();

            await supabase
                .from('organizations')
                .update({
                    google_config: {
                        ...config,
                        accessToken: credentials.access_token,
                        expiresAt: newExpiresAt,
                        // Refresh token might not be returned again
                        refreshToken: credentials.refresh_token || config.refreshToken
                    }
                })
                .eq('id', organizationId);

            oauth2Client.setCredentials(credentials);
        } catch (refreshError) {
            console.error('Failed to refresh token', refreshError);
            // throw refreshError; // Or return null/expired client
        }
    }

    return oauth2Client;
}
