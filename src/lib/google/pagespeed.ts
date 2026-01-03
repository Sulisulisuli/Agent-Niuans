import { google } from 'googleapis';
import { unstable_cache } from 'next/cache';

export interface PageSpeedMetrics {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
}

// Cached version of the API call to prevent rate limits (429) and improve performance
const getCachedPageSpeedMetrics = unstable_cache(
    async (targetUrl: string, apiKey: string): Promise<PageSpeedMetrics | null> => {
        try {
            console.log(`Fetching PageSpeed for ${targetUrl} (Cached)`);
            const pagespeedonline = google.pagespeedonline('v5');

            // Try with API key first if available (higher detailed quotas)
            let response;
            try {
                // Use key if we have one
                const params: any = {
                    url: targetUrl,
                    strategy: 'MOBILE',
                };
                if (apiKey) params.key = apiKey;

                response = await pagespeedonline.pagespeedapi.runpagespeed(params);
            } catch (error: any) {
                console.warn(`PSI Error with key: ${error.message || 'Unknown'}`);

                // Fallback for ANY error if we used a key
                // This covers 403 (Forbidden), 429 (Quota), 400 (Bad Request), etc.
                if (apiKey) {
                    console.log('Retrying PSI request without API key...');
                    try {
                        response = await pagespeedonline.pagespeedapi.runpagespeed({
                            url: targetUrl,
                            strategy: 'MOBILE',
                            // No key
                        });
                        console.log('PSI Retry successful');
                    } catch (retryError: any) {
                        console.error('PSI Retry failed:', retryError.message);
                        throw retryError; // Throw so outer catch handles it
                    }
                } else {
                    throw error;
                }
            }

            const lighthouse = response?.data?.lighthouseResult;
            if (!lighthouse?.categories) {
                console.error('PSI Response missing categories');
                return null;
            }

            return {
                performance: Math.round((lighthouse.categories.performance?.score || 0) * 100),
                accessibility: Math.round((lighthouse.categories.accessibility?.score || 0) * 100),
                bestPractices: Math.round((lighthouse.categories['best-practices']?.score || 0) * 100),
                seo: Math.round((lighthouse.categories.seo?.score || 0) * 100),
            };

        } catch (error: any) {
            console.error('Final PageSpeed API Error:', error?.message || error);
            return null;
        }
    },
    ['pagespeed-metrics-v2'], // Changed cache key to invalidate old null results
    { revalidate: 3600 }   // Revalidate every hour
);

export async function getPageSpeedMetrics(url: string): Promise<PageSpeedMetrics | null> {
    if (!url) return null;

    // Handle GSC domain properties (e.g., sc-domain:example.com)
    let targetUrl = url;
    if (url.startsWith('sc-domain:')) {
        targetUrl = `https://${url.replace('sc-domain:', '')}`;
    }

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";

    // Call the cached function
    return getCachedPageSpeedMetrics(targetUrl, apiKey);
}
