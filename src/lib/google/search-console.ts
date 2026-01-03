import { google } from 'googleapis';
import { getAuthenticatedClient } from './client';

export async function getSearchConsoleService(organizationId: string) {
    const auth = await getAuthenticatedClient(organizationId);
    return google.searchconsole({ version: 'v1', auth });
}

export async function listSites(organizationId: string) {
    const service = await getSearchConsoleService(organizationId);
    const response = await service.sites.list();
    return response.data.siteEntry;
}

export async function getSearchPerformance(
    organizationId: string,
    siteUrl: string,
    startDate: string,
    endDate: string
) {
    const service = await getSearchConsoleService(organizationId);

    const response = await service.searchanalytics.query({
        siteUrl,
        requestBody: {
            startDate,
            endDate,
            dimensions: ['date'],
            rowLimit: 30,
        },
    });

    return response.data.rows;
}
