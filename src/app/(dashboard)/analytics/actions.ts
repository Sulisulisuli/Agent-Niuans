'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";
import { getAnalyticsReport } from "@/lib/google/analytics";
import { getSearchPerformance } from "@/lib/google/search-console";
import { getPageSpeedMetrics } from "@/lib/google/pagespeed";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateAIReport() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: 'Unauthorized' };
        }

        // Get User's Organization
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();

        if (!member) {
            return { error: 'Organization not found' };
        }

        const { data: org } = await supabase
            .from('organizations')
            .select('google_config')
            .eq('id', member.organization_id)
            .single();

        const config = (org?.google_config as any) || {};

        if (!config.accessToken) {
            return { error: 'Google account not connected' };
        }

        // Fetch Data
        const results: any = {};

        if (config.selectedPropertyId) {
            try {
                results.ga4 = await getAnalyticsReport(member.organization_id, config.selectedPropertyId);
            } catch (e) {
                console.error("GA4 Fetch Error", e);
                results.ga4Error = "Failed to fetch GA4 data";
            }
        }

        if (config.selectedSiteUrl) {
            try {
                results.gsc = await getSearchPerformance(
                    member.organization_id,
                    config.selectedSiteUrl,
                    new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    new Date().toISOString().split('T')[0]
                );
            } catch (e) {
                console.error("GSC Fetch Error", e);
                results.gscError = "Failed to fetch GSC data";
            }

            try {
                results.psi = await getPageSpeedMetrics(config.selectedSiteUrl);
            } catch (e) {
                console.error("PSI Fetch Error", e);
                results.psiError = "Failed to fetch PageSpeed data";
            }
        }

        if (!results.ga4 && !results.gsc) {
            return { error: 'No data available to generate report. Please ensure properties are selected.' };
        }

        // Generate Report
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `
    You are a Senior Data Analyst.
    Analyze the following website analytics data (GA4 and Search Console) for the last 28 days.
    
    DATA:
    ${JSON.stringify(results, null, 2)}
    
    TASK:
    Generate a comprehensive, actionable markdown report.
    
    STRUCTURE:
    1. **Executive Summary**: High-level overview of performance.
    2. **Traffic Analysis**: Trends in users, sessions, and engagement (if available).
    3. **Search Performance**: Top queries, clicks, impressions trends.
    4. **Technical Performance**: Review PageSpeed Insights metrics (Performance, Accessibility, SEO).
    5. **Key Insights**: Identify 3 positive trends and 3 areas for improvement.
    6. **Action Plan**: Specific recommendations to improve SEO, speed, and engagement based on this data.
    
    Tone: Professional, insightful, and concise.
    Format: Markdown.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return { report: text };

    } catch (error: any) {
        console.error('AI Report Generation Error:', error);
        return { error: error.message || 'Failed to generate report' };
    }
}
