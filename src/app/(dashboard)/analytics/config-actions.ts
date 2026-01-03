'use server';

import { createClient } from '@/utils/supabase/server';
import { listProperties } from '@/lib/google/analytics';
import { listSites } from '@/lib/google/search-console';
import { revalidatePath } from 'next/cache';

export async function getGoogleData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

    if (!member) return { error: 'No org found' };

    const { data: org } = await supabase
        .from('organizations')
        .select('google_config')
        .eq('id', member.organization_id)
        .single();

    const config = org?.google_config as any || {};

    let properties: any[] = [];
    let sites: any[] = [];

    // Fetch lists if connected
    if (config.accessToken) {
        try {
            console.log('Fetching Google Properties for org:', member.organization_id);
            const summaries = await listProperties(member.organization_id);
            // GA4 Admin API returns account summaries, which contain property summaries
            // We need to flatten this to get a list of properties
            if (summaries) {
                properties = summaries.reduce((acc: any[], account: any) => {
                    if (account.propertySummaries) {
                        return [...acc, ...account.propertySummaries];
                    }
                    return acc;
                }, []);
            }
            console.log('Fetched Properties:', properties?.length);
            console.log('Fetched Properties:', properties?.length);
        } catch (e: any) {
            console.error('Failed to list properties:', e?.message || e);
            if (e?.response?.data) {
                console.error('API Error Details:', JSON.stringify(e.response.data, null, 2));
                // Check for specific error regarding disabled API
                if (e.response.data.error?.message?.includes('disabled')) {
                    console.error('Google Analytics Data API is disabled. Please enable it in Google Cloud Console.');
                }
            }
        }

        try {
            console.log('Fetching Google Sites for org:', member.organization_id);
            sites = (await listSites(member.organization_id)) || [];
            console.log('Fetched Sites:', sites?.length);
        } catch (e: any) {
            console.error('Failed to list sites:', e?.message || e);
            if (e?.response?.data) console.error('API Error Details:', JSON.stringify(e.response.data, null, 2));
        }
    }

    return {
        isConnected: !!config.accessToken,
        selectedPropertyId: config.selectedPropertyId,
        selectedSiteUrl: config.selectedSiteUrl,
        properties: properties || [],
        sites: sites || []
    };
}

export async function saveGoogleConfig(propertyId: string, siteUrl: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

    if (!member) return { error: 'No org found' };

    const { data: org } = await supabase
        .from('organizations')
        .select('google_config')
        .eq('id', member.organization_id)
        .single();

    const currentConfig = org?.google_config as any || {};

    const { error } = await supabase
        .from('organizations')
        .update({
            google_config: {
                ...currentConfig,
                selectedPropertyId: propertyId,
                selectedSiteUrl: siteUrl
            }
        })
        .eq('id', member.organization_id);

    if (error) return { error: 'Failed to save' };

    revalidatePath('/analytics');
    return { success: true };
}

export async function disconnectGoogle() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

    if (!member) return { error: 'No org found' };

    const { error } = await supabase
        .from('organizations')
        .update({ google_config: {} }) // Clear config
        .eq('id', member.organization_id);

    if (error) return { error: 'Failed to disconnect' };

    revalidatePath('/analytics');
    revalidatePath('/settings');
    return { success: true };
}
