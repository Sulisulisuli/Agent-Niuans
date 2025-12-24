'use server'

import { createClient } from "@/utils/supabase/server"
import { shareOnLinkedIn } from "@/app/(dashboard)/posts/linkedin-server-actions"
import { getWebflowItems } from "@/app/(dashboard)/posts/actions"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// --- Data Fetching ---

/**
 * Fetches available Webflow Sites.
 */
export async function getSites() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: "Not authenticated" }

        const config = await getWebflowConfig(supabase, user.id)
        if (!config || !config.apiToken) {
            return { error: "Webflow Token not configured" }
        }

        const { WebflowClient } = await import('@/lib/webflow')
        const webflow = new WebflowClient(config.apiToken)
        const sites = await webflow.listSites()

        // Fetch Organization Domain
        const { getOrganizationProfile } = await import('@/app/(dashboard)/settings/actions')
        const { orgDetails } = await getOrganizationProfile()

        // Inject organization domain into the SITE object (as a customDomain entry) if specific domain doesn't exist?
        // OR simply return it in the payload so the frontend can choose.
        // Let's modify the sites array to include this 'organization domain' as a custom domain option if not present.
        // Or simpler: Just return it separate or merge it. 
        // User said: "Remember that the domain is assigned to the organization".
        // This implies the Webflow Site might NOT list it, but the App's Organization configuration DOES.

        // Let's enhance the site objects with the organization domain if they match? 
        // Or actually, since we are selecting a site, maybe we just assume the Organization's domain applies to the primary site?
        // Let's pass the orgDomain down.

        return {
            sites,
            orgDomain: orgDetails?.domain
        }

    } catch (error: any) {
        console.error("getSites Error", error)
        return { error: error.message }
    }
}

/**
 * Fetches available CMS Collections for the connected Webflow site.
 */
export async function getCollections(siteId?: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: "Not authenticated" }

        const config = await getWebflowConfig(supabase, user.id)
        if (!config || !config.apiToken) {
            return { error: "Webflow Site or Token not configured" }
        }

        const finalSiteId = siteId || config.siteId
        if (!finalSiteId) {
            return { error: "No Site selected" }
        }

        const { WebflowClient } = await import('@/lib/webflow')
        const webflow = new WebflowClient(config.apiToken)
        const collections = await webflow.listCollections(finalSiteId)

        return { collections }

    } catch (error: any) {
        console.error("getCollections Error", error)
        return { error: error.message }
    }
}

/**
 * Fetches published items from a specific collection or the default one.
 */
export async function getPublishedArticles(collectionId?: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: "Not authenticated" }

        const config = await getWebflowConfig(supabase, user.id)

        if (!config || !config.apiToken) {
            return { error: "Webflow not configured" }
        }

        const finalCollectionId = collectionId || config.collectionId
        if (!finalCollectionId) {
            return { error: "No Collection selected" }
        }

        // Fetch Items
        const result = await getWebflowItems(config.apiToken, finalCollectionId)

        if (result.error) return { error: result.error }

        // Filter and map
        const items = result.items?.map((item: any) => ({
            id: item.id,
            title: item.fieldData?.name || item.fieldData?.title || "Untitled",
            slug: item.fieldData?.slug,
            fullData: item.fieldData
        })) || []

        return { items }

    } catch (error: any) {
        console.error("getPublishedArticles Error", error)
        return { error: error.message }
    }
}

// --- AI Generation ---

async function fetchUrlContent(url: string): Promise<string> {
    // Reusing the Jina reader logic (simplified duplicated for self-containment or could import if shared)
    // For now, I'll implement a simple fetch or minimal version since the heavy lifting is in ai-actions
    // Ideally, we refactor fetchUrlContent to a shared utility. 
    // I will assume for now we use a simpler approach or the same logic.

    try {
        const targetUrl = `https://r.jina.ai/${url}`
        const res = await fetch(targetUrl, {
            headers: { 'X-Target-URL': url, 'Accept': 'text/plain' }
        })
        if (!res.ok) return ""
        return (await res.text()).substring(0, 15000)
    } catch (e) {
        return ""
    }
}

interface GenerateLinkedInProps {
    type: 'cms' | 'prompt' | 'link'
    data: string // prompt text, url, or cms item json string
    additionalInstructions?: string
}

export async function generateLinkedInPost({ type, data, additionalInstructions }: GenerateLinkedInProps) {
    try {
        if (!process.env.GEMINI_API_KEY) return { error: "Missing Gemini API Key" }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

        let context = ""

        if (type === 'prompt') {
            context = `USER INSTRUCTION: ${data}`
        } else if (type === 'link') {
            const scrapped = await fetchUrlContent(data)
            context = `SOURCE ARTICLE CONTENT:\n${scrapped}`
        } else if (type === 'cms') {
            // "data" is expected to be a stringified object of the CMS item fields
            try {
                const item = JSON.parse(data)
                // Extract meaningful text from common fields
                const textBody = item['post-body'] || item['content'] || item['description'] || ""
                context = `SOURCE ARTICLE (Title: ${item.name}):\n${textBody}`
            } catch (e) {
                context = `SOURCE CONTENT: ${data}`
            }
        }

        // 0. Fetch Brand Identity
        let brandInstruction = ""
        // Dynamic import to avoid circular dependencies if any, or just standard import usage
        // But since we are in the same app structure, let's use the helper we found.
        // We need to import it at the top, but for now I will use the import inside or add to top.
        // Let's add the import to the top of the file in a separate edit or assume it's available.
        // Actually, let's import it properly.

        const { getOrganizationProfile } = await import('@/app/(dashboard)/settings/actions')
        const { profile } = await getOrganizationProfile()

        if (profile && Object.keys(profile).length > 0) {
            brandInstruction = `
        BRAND IDENTITY (You MUST adopt this persona):
        - Industry: ${profile.industry || "General"}
        - Target Audience: ${profile.target_audience || "General Audience"}
        - Brand Voice: ${profile.brand_voice || "Professional"}
        - Key Values: ${profile.key_values || "N/A"}
        - Primary Language: ${profile.content_language || "Detect from prompt"}
        
        FORBIDDEN TOPICS (Start strictly avoiding these):
        ${profile.forbidden_topics || "None"}
        
        WRITING STYLE SAMPLE (Mimic this tone and sentence structure):
        "${profile.example_content || "N/A"}"
        `
        }

        const systemPrompt = `
        You are an expert LinkedIn Ghostwriter for a professional brand.
        
        ${brandInstruction}

        GOAL: Write a viral, engaging LinkedIn post based on the provided CONTEXT.

        RULES:
        1. **Hook**: Start with a punchy, attention-grabbing first line (max 10 words).
        2. **Structure**: Use short paragraphs (1-2 sentences). Use generous whitespace.
        3. **Tone**: ${profile?.brand_voice || "Professional yet conversational"}, insightful, and authoritative.
        4. **Formatting**: Use bullet points (•) for lists. Use bolding (Unicode bold or just *text*) sparingly for emphasis if supported, but plain text is safer. 
           (Note: Do NOT use markdown bold like **text**, use plain text or unicode if you must, but plain is preferred for raw API).
           Actually, return standard text.
        5. **Length**: 150-300 words.
        6. **Engagement**: End with a thought-provoking question or Call to Action (CTA).
        7. **Tags**: Include 3-5 relevant hashtags at the very bottom.

        INPUT CONTEXT:
        ${context}

        ${additionalInstructions ? `ADDITIONAL USER INSTRUCTIONS:\n${additionalInstructions}` : ""}
        
        RESPONSE FORMAT:
        Return ONLY the raw string of the post content. Do not wrap in JSON.
        `

        const result = await model.generateContent(systemPrompt)
        const response = await result.response
        return { content: response.text() }

    } catch (error: any) {
        console.error("AI Gen Error", error)
        return { error: error.message }
    }
}

// --- Open Graph Image Fetcher ---

export async function fetchOpenGraphImage(url: string) {
    try {
        if (!url || !url.startsWith('http')) return { error: "Invalid URL" };

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AgentNiuansBot/1.0; +http://agentniuans.com)'
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!res.ok) return { error: `Failed to fetch URL: ${res.status}` };

        const html = await res.text();

        // Simple Regex to find og:image
        // <meta property="og:image" content="https://..." />
        const match = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']\s*\/?>/i) ||
            html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']\s*\/?>/i);

        if (match && match[1]) {
            return { imageUrl: match[1] };
        }

        return { imageUrl: null };

    } catch (error: any) {
        console.error("fetchOpenGraphImage Error", error);
        return { error: error.message };
    }
}

// --- Publishing ---

// --- Publishing ---

export async function publishToLinkedInProfile(content: string, linkUrl?: string, title?: string, thumbnailUrl?: string) {
    // Wrapper to keep logic clean and add any future dashboard-specific logging
    return await shareOnLinkedIn(content, linkUrl || undefined, title, thumbnailUrl, "PUBLIC")
}

// Helper to avoid duplicate DB calls
async function getWebflowConfig(supabase: any, userId: string) {
    const { data: org } = await supabase
        .from('organizations')
        .select('webflow_config')
        .eq('id', userId)
        .single()

    let config = org?.webflow_config as any

    if (!org) {
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', userId)
            .maybeSingle()

        if (member) {
            const { data: realOrg } = await supabase
                .from('organizations')
                .select('webflow_config')
                .eq('id', member.organization_id)
                .single()
            config = realOrg?.webflow_config
        }
    }
    return config
}
