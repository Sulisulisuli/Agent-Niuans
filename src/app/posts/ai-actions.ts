'use server'

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Helper to fetch and clean URL content using r.jina.ai (LLM-friendly reader)
async function fetchUrlContent(url: string): Promise<string> {
    try {
        console.log(`[fetchUrlContent] Fetching via Jina: ${url}`)

        // Use r.jina.ai for robust extraction (reads JS sites, standardizes to MD)
        const targetUrl = `https://r.jina.ai/${url}`

        const res = await fetch(targetUrl, {
            headers: {
                'X-Target-URL': url,
                'User-Agent': 'Antigravity/1.0',
                'Accept': 'text/plain'
            }
        })

        if (!res.ok) {
            console.error(`[fetchUrlContent] Failed to fetch ${url}: ${res.status} ${res.statusText}`)
            return ""
        }

        const text = await res.text()

        if (!text || text.length < 50) {
            console.error(`[fetchUrlContent] Empty/Short content returned for ${url}`)
            return ""
        }

        console.log(`[fetchUrlContent] Fetched ${text.length} chars from ${url}`)
        return text.substring(0, 20000) // Limit context size
    } catch (e) {
        console.error("[fetchUrlContent] Error fetching URL:", e)
        return ""
    }
}

interface GenerateOptions {
    prompt: string
    fields: any[]
    context?: {
        text?: string
        urls?: string[]
    }
}

import { getOrganizationProfile } from "../settings/actions"

// ... (keep existing imports and helpers)

export async function generatePostContent({ prompt, fields, context }: GenerateOptions) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return { error: 'Missing Gemini API Key' }
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

        // 1. Fetch Brand Context
        let brandInstruction = ""
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
        
        COMPETITORS/CONTEXT:
        ${profile.competitors || "None"}
        
        WRITING STYLE SAMPLE (Mimic this tone and sentence structure):
        "${profile.example_content || "N/A"}"
        `
        }

        // 2. Process Context (User provided)
        let contextMaterial = ""
        if (context?.text) {
            contextMaterial += `\n[USER PROVIDED TEXT CONTEXT]:\n${context.text}\n`
        }
        if (context?.urls && context.urls.length > 0) {
            for (const url of context.urls) {
                if (url.trim()) {
                    const content = await fetchUrlContent(url)
                    contextMaterial += `\n[CONTENT FROM URL: ${url}]:\n${content}\n`
                }
            }
        }

        // 3. Construct the schema definition
        const schemaDescription = fields.map(f => `${f.slug} (${f.type}): ${f.displayName}`).join('\n')

        // 4. Build the full prompt
        const fullPrompt = `
        You are a professional content generator for a CMS.
        
        ${brandInstruction}

        TASK:
        Generate content based on the user's instructions and provided context.
        
        USER INSTRUCTIONS: "${prompt}"

        CONTEXT MATERIAL (Use this to ground your content):
        ${contextMaterial || "No additional context provided."}
        
        TARGET SCHEMA (Webflow Collection Fields):
        ${schemaDescription}
        
        ADDITIONAL REQUIREMENTS:
        - Also generate a list of 5-10 SEO keywords relevant to the content.
        - Return the result as a JSON object where keys match the schema slugs.
        - INCLUDE a special key "_keywords" for the list of keywords.
        
        INSTRUCTIONS:
        1. Generate content for EACH field in the schema.
        2. For 'RichText' fields, use valid HTML (p, h2, ul, li, strong, etc.).
        3. For 'Image' fields, leave them empty.
        4. RETURN ONLY A SINGLE VALID JSON OBJECT.
        
        Example Output JSON:
        {
          "name": "Generated Title",
          "post-body": "<p>Generated content...</p>",
          "_keywords": ["ai", "tech", "webflow"]
        }
        `

        // 5. Generate
        const result = await model.generateContent(fullPrompt)
        const response = await result.response
        const text = response.text()

        // 6. Parse JSON
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            const data = JSON.parse(jsonString)
            return { data }
        } catch (e) {
            console.error("AI JSON Parse Error", text)
            return { error: 'Failed to parse AI response', raw: text }
        }

    } catch (error: any) {
        console.error("AI Generation Error", error)
        return { error: error.message || 'Unknown error' }
    }
}

export async function generateBrandProfileFromUrl(url: string) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return { error: 'Missing Gemini API Key' }
        }

        if (!url) return { error: 'URL is required' }

        // Ensure URL has protocol
        const targetUrl = url.startsWith('http') ? url : `https://${url}`

        const content = await fetchUrlContent(targetUrl)

        if (!content || content.length < 100) {
            return { error: 'Could not fetch enough content from this URL' }
        }

        console.log(`[generateBrandProfileFromUrl] Content length: ${content.length}`)

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

        const prompt = `
        Analyze the following website content and extract the Brand Identity details.
        
        WEBSITE CONTENT:
        ${content.substring(0, 20000)}

        TASK:
        Infer the following 8 fields based on the content:
        1. industry (e.g. SaaS, E-commerce, Blog)
        2. target_audience (Who is this for?)
        3. brand_voice (Adjectives describing the tone e.g. Professional, Playful)
        4. content_language (Detect language e.g. Polish, English)
        5. key_values (Comma separated list of core values/slogans found)
        6. forbidden_topics (Infer what they might want to avoid, or leave empty)
        7. competitors (If mentioned, or leave empty)
        8. example_content (Extract 1-2 representative paragraphs of text that show their style)

        RETURN JSON ONLY:
        {
            "industry": "...",
            "target_audience": "...",
            "brand_voice": "...",
            "content_language": "...",
            "key_values": "...",
            "forbidden_topics": "...",
            "competitors": "...",
            "example_content": "..."
        }
        `

        console.log("[generateBrandProfileFromUrl] Sending prompt to AI...")
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        console.log("[generateBrandProfileFromUrl] Raw AI Response:", text)

        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            const data = JSON.parse(jsonString)
            console.log("[generateBrandProfileFromUrl] Parsed Data:", data)
            return { data }
        } catch (e) {
            console.error("AI Profile Parse Error", text)
            return { error: 'Failed to parse AI response' }
        }

    } catch (error: any) {
        console.error("AI Profile Generation Error", error)
        return { error: error.message || 'Unknown error' }
    }
}
