import { getOAuth2Client } from '@/lib/google/client';
import { redirect } from 'next/navigation';

export async function GET() {
    let authorizationUrl;

    try {
        const oauth2Client = getOAuth2Client();

        const scopes = [
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/webmasters.readonly',
            'email',
            'profile',
        ];

        authorizationUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Request refresh token
            scope: scopes,
            include_granted_scopes: true,
            prompt: 'consent', // Force consent prompt to ensure refresh token is returned
        });

    } catch (error: any) {
        console.error('Google Auth Init Error:', error?.message || error);
        if (error?.message === 'Missing Google OAuth credentials') {
            return redirect('/settings?error=missing_credentials');
        }
        return redirect(`/settings?error=google_auth_init_failed&details=${encodeURIComponent(error?.message || 'unknown')}`);
    }

    if (authorizationUrl) {
        return redirect(authorizationUrl);
    }
}
