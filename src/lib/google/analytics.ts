import { google } from 'googleapis';
import { getAuthenticatedClient } from './client';

export async function getAnalyticsService(organizationId: string) {
    const auth = await getAuthenticatedClient(organizationId);
    return google.analyticsdata({ version: 'v1beta', auth });
}

export async function listProperties(organizationId: string) {
    // We need the 'analytics.readonly' scope, but checking properties needs
    // accessing the account summaries or properties list.
    // 'google.analytics.data' is for *data*. 'google.analytics.admin' is for *admin*.
    // We asked for 'analytics.readonly' which covers both usually or we check docs.
    // Actually, 'analytics.readonly' allows reading properties.
    // We use the Admin API for listing properties.

    const auth = await getAuthenticatedClient(organizationId);
    const admin = google.analyticsadmin({ version: 'v1beta', auth });

    const response = await admin.accountSummaries.list();
    return response.data.accountSummaries;
}

export async function getAnalyticsReport(
    organizationId: string,
    propertyId: string,
    startDate: string = '28daysAgo',
    endDate: string = 'today'
) {
    const analyticsData = await getAnalyticsService(organizationId);

    const response = await analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
            dateRanges: [
                {
                    startDate,
                    endDate,
                },
            ],
            metrics: [
                { name: 'activeUsers' },
                { name: 'screenPageViews' },
                { name: 'sessions' },
                { name: 'eventCount' },
                { name: 'engagementRate' },
                { name: 'averageSessionDuration' },
                { name: 'newUsers' },
            ],
            dimensions: [
                { name: 'date' } // Get trend data
            ]
        },
    });

    return response.data;
}
