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
        You are an elite SEO & AEO (Answer Engine Optimization) Copywriter.
        Your goal is to create content that ranks #1 on Google and is cited by AI assistants (Perplexity, Gemini, ChatGPT).
        
        ${brandInstruction}

        TASK:
        Generate content based on the user's instructions and provided context.
        
        USER INSTRUCTIONS: "${prompt}"

        CONTEXT MATERIAL (Use this to ground your content):
        ${contextMaterial || "No additional context provided."}
        
        TARGET SCHEMA (Webflow Collection Fields):
        ${schemaDescription}
        
        ADDITIONAL REQUIREMENTS:
        - First, identify 5-10 strong SEO keywords relevant to the topic.
        - CRITICAL: Use these keywords naturally throughout the content (in titles, headings, and body text).
        - Return the result as a JSON object where keys match the schema slugs.
        - INCLUDE a special key "_keywords" for the list of these used keywords.
        
        STRICT FORMATTING RULES (For RichText Fields):
        1.  **Structure**: logic MUST be broken down with <h2> and <h3> tags. NEVER output a wall of text.
        2.  **Lists**: You MUST include at least one unordered list (<ul>) or ordered list (<ol>) to break up content.
        3.  **Readability**: Paragraphs must be short (max 3 sentences).
        4.  **Emphasis**: You MUST use <strong> tags for specific SEO keywords and important concepts. Don't use markdown bold, use HTML tags.
        5.  **Clean Code**: Return valid, semantic HTML strings (e.g. <h2>Title</h2><p>Content...</p>). Do NOT use Markdown.

        INSTRUCTIONS:
        1. Select keywords.
        2. Generate content for EACH field in the schema, weaving in the selected keywords.
        3. Adhere strictly to the FORMATTING RULES above for any RichText/Body fields.
        4. For 'Image' fields, leave them empty.
        5. RETURN ONLY A SINGLE VALID JSON OBJECT.
        
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

export async function generateTemplateContent(context: string, organizationId: string) {
    if (!process.env.GEMINI_API_KEY) return { error: 'Gemini API Key not configured' }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    // 1. Fetch Brand Identity
    const { profile } = await getOrganizationProfile()
    const brandProfile = profile || {}

    // 2. Construct Prompt
    const prompt = `
    You are a creative social media assistant.
    
    BRAND IDENTITY:
    ${JSON.stringify(brandProfile, null, 2)}
    
    POST CONTEXT:
    ${context}
    
    TASK:
    Based on the post context and brand identity, generate content for a social media image template.
    1. Title: A short, catchy title (max 6 words).
    2. Subtitle: A supporting subtitle (max 10 words).
    3. Image Prompt: A detailed English prompt for an text-to-image model (like Midjourney/DALL-E) that would generate a background or main image fitting the brand style and post subject.
    4. Alt Text: A concise, descriptive alt text for the generated image (max 15 words) suitable for accessibility and SEO.
    
    Return ONLY a JSON object with keys: "title", "subtitle", "imagePrompt", "altText".
    Do not include markdown formatting.
    `

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const data = JSON.parse(jsonStr)

        return { data }

    } catch (e: any) {
        console.error('AI Generation Error:', e)
        return { error: 'Failed to generate content' }
    }
}

import { createClient } from '@/utils/supabase/server'

export async function generateImage(prompt: string) {
    if (!process.env.GEMINI_API_KEY) return { error: 'Gemini API Key missing' }

    try {
        // Use the specific Nano Banana model from the docs
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" })

        const result = await model.generateContent(prompt)
        const response = await result.response

        // Imagen responses via the Generative AI SDK (API v1beta) often come in a specific format
        // We need to check for inline data
        const parts = response.candidates?.[0]?.content?.parts

        // Use a more robust check for image data
        const imagePart = parts?.find((p: any) => p.inlineData && p.inlineData.mimeType.startsWith('image/'))

        if (!imagePart || !imagePart.inlineData) {
            console.log('No image part found. Parts:', JSON.stringify(parts))
            return { error: 'No image generated. The model might have refused the prompt or returned text.' }
        }

        const base64Image = imagePart.inlineData.data
        const mimeType = imagePart.inlineData.mimeType || 'image/png'
        const ext = mimeType.split('/')[1] || 'png'

        // Upload to Supabase
        const supabase = await createClient()
        const fileName = `ai-gen-${Date.now()}.${ext}`
        const buffer = Buffer.from(base64Image, 'base64')

        const { error: uploadError } = await supabase.storage
            .from('post-images')
            .upload(fileName, buffer, {
                contentType: mimeType
            })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
            .from('post-images')
            .getPublicUrl(fileName)

        return { url: publicUrlData.publicUrl }

    } catch (e: any) {
        console.error('Image Generation Error:', e)
        return { error: e.message || 'Failed to generate image' }
    }
}
