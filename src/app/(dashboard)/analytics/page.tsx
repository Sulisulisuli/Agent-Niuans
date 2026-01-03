import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { getAnalyticsReport } from '@/lib/google/analytics';
import { getSearchPerformance } from '@/lib/google/search-console';
import { getPageSpeedMetrics } from '@/lib/google/pagespeed';

export default async function AnalyticsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get User's Organization
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

    if (!member) {
        redirect('/onboarding');
    }

    const { data: org } = await supabase
        .from('organizations')
        .select('google_config')
        .eq('id', member.organization_id)
        .single();

    const googleConfig = (org?.google_config as any) || {};
    const isConnected = !!(googleConfig.accessToken);

    let traffic = [];
    let search = [];

    let pageSpeed = null;

    if (isConnected) {
        if (googleConfig.selectedPropertyId) {
            try {
                const report = await getAnalyticsReport(member.organization_id, googleConfig.selectedPropertyId);
                // Transform GA4 data
                if (report.rows) {
                    traffic = report.rows.map((row: any) => ({
                        date: row.dimensionValues[0].value,
                        activeUsers: row.metricValues[0].value,
                        screenPageViews: row.metricValues[1].value,
                        sessions: row.metricValues[2].value
                    })).sort((a: any, b: any) => a.date.localeCompare(b.date));
                }
            } catch (e) {
                console.error("Failed to fetch GA4 data", e);
            }
        }

        if (googleConfig.selectedSiteUrl) {
            try {
                // Fetch GSC Data
                const endDate = new Date().toISOString().split('T')[0];
                const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                const gscRows = await getSearchPerformance(
                    member.organization_id,
                    googleConfig.selectedSiteUrl,
                    startDate,
                    endDate
                );

                if (gscRows) {
                    search = gscRows.map((row: any) => ({
                        keys: row.keys,
                        clicks: row.clicks,
                        impressions: row.impressions,
                        ctr: row.ctr,
                        position: row.position
                    }));
                }

                // Fetch PageSpeed Data
                // Use selectedSiteUrl for PSI. 
                pageSpeed = await getPageSpeedMetrics(googleConfig.selectedSiteUrl);

            } catch (e) {
                console.error("Failed to fetch GSC/PSI data", e);
            }
        }
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <AnalyticsDashboard data={{
                isConnected,
                traffic,
                search,
                pageSpeed
            }} />
        </div>
    );
}
