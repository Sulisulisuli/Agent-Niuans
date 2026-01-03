'use server'

import { createClient } from '@/utils/supabase/server'
import { TemplateConfig } from '@/lib/opengraph/engine'
import { revalidatePath } from 'next/cache'
import { confirmAsset, deleteAsset } from '@/utils/asset-utils'

export async function getTemplates(organizationId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('image_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('getTemplates Error:', error)
        return { error: error.message }
    }

    return { data }
}

export async function getTemplate(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('image_templates')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('getTemplate Error:', error)
        return { error: error.message }
    }

    return { data }
}

export async function saveTemplate(
    organizationId: string,
    templateData: {
        id?: string
        name: string
        config: TemplateConfig
        category?: string
    }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const payload = {
        name: templateData.name,
        config: templateData.config,
        category: templateData.category || 'general',
        organization_id: organizationId,
        updated_at: new Date().toISOString(),
    }

    let error: any;
    let data: any;
    let removedAssets: string[] = [];

    if (templateData.id) {
        // OPTIONAL: Fetch old config to identify removed assets for cleanup
        try {
            const { data: oldTemplate } = await supabase
                .from('image_templates')
                .select('config')
                .eq('id', templateData.id)
                .single()

            if (oldTemplate?.config) {
                const oldString = JSON.stringify(oldTemplate.config)
                const oldMatches = oldString.match(/\/template-assets\/[^"'\s\\]+/g) || []

                const newString = JSON.stringify(templateData.config)
                const newMatches = newString.match(/\/template-assets\/[^"'\s\\]+/g) || []
                const newAssetsSet = new Set(newMatches)

                // Assets present in old but NOT in new
                removedAssets = oldMatches.filter(x => !newAssetsSet.has(x))
                // Deduplicate
                removedAssets = Array.from(new Set(removedAssets))
            }
        } catch (e) {
            console.warn('Failed to calculate asset diff:', e)
        }

        // Update
        const res = await supabase
            .from('image_templates')
            .update(payload)
            .eq('id', templateData.id)
            .select()
            .single()
        error = res.error
        data = res.data
    } else {
        // Insert
        const res = await supabase
            .from('image_templates')
            .insert(payload)
            .select()
            .single()
        error = res.error
        data = res.data
    }

    if (error) {
        console.error('saveTemplate Error:', error)
        return { error: error.message }
    }


    // Confirm ALL assets found in the config
    if (data && data.config) {
        try {
            const configString = JSON.stringify(data.config)
            // Regex to find all occurrences of /template-assets/... until a quote or whitespace
            const matches = configString.match(/\/template-assets\/[^"'\s\\]+/g) || []
            const uniquePaths = Array.from(new Set(matches))

            if (uniquePaths.length > 0) {
                console.log(`[saveTemplate] Found ${uniquePaths.length} unique assets to confirm`)
                for (const match of uniquePaths) {
                    const parts = match.split('/template-assets/')
                    if (parts.length > 1) {
                        const path = parts[1]
                        await confirmAsset(decodeURIComponent(path), 'template-assets')
                    }
                }
            }
        } catch (e) {
            console.error('Failed to confirm assets:', e)
        }
    }

    // CLEANUP: If we removed assets during update, check if they are now orphans and delete them
    if (removedAssets.length > 0) {
        try {
            console.log(`[saveTemplate] Checking ${removedAssets.length} potentially removed assets for cleanup...`)

            // Fetch ALL templates for this org to check global usage
            // We need to be sure we don't delete an asset used by another template
            const { data: allTemplates, error: fetchAllError } = await supabase
                .from('image_templates')
                .select('config')
                .eq('organization_id', organizationId)

            if (!fetchAllError && allTemplates) {
                const globalUsedAssets = new Set<string>()
                allTemplates.forEach(row => {
                    const rowConfig = JSON.stringify(row.config)
                    const rowMatches = rowConfig.match(/\/template-assets\/[^"'\s\\]+/g) || []
                    rowMatches.forEach(m => globalUsedAssets.add(m))
                })

                for (const assetToRemove of removedAssets) {
                    if (globalUsedAssets.has(assetToRemove)) {
                        console.log(`[saveTemplate] Asset ${assetToRemove} removed from this template but used elsewhere. Keeping.`)
                    } else {
                        console.log(`[saveTemplate] Asset ${assetToRemove} is now an orphan. Deleting...`)
                        const parts = assetToRemove.split('/template-assets/')
                        if (parts.length > 1) {
                            const decodedPath = decodeURIComponent(parts[1])
                            await deleteAsset(decodedPath, 'template-assets')
                        }
                    }
                }
            }
        } catch (e) {
            console.error('[saveTemplate] Failed to cleanup orphan assets:', e)
        }
    }

    revalidatePath('/settings/templates')
    return { success: true, data }
}

export async function deleteTemplate(id: string) {
    const supabase = await createClient()

    // 1. Fetch template to check for assets
    const { data: template } = await supabase
        .from('image_templates')
        .select('config, organization_id') // Added organization_id
        .eq('id', id)
        .single()

    // 2. RAM-based verification (Reliable & Robust)
    if (template?.config) {
        try {
            // Find all assets in THIS template
            const configString = JSON.stringify(template.config)
            const matches = configString.match(/\/template-assets\/[^"'\s\\]+/g) || []
            const uniqueAssetsInCurrentTemplate = Array.from(new Set(matches))

            if (uniqueAssetsInCurrentTemplate.length > 0) {
                console.log(`[deleteTemplate] Found ${uniqueAssetsInCurrentTemplate.length} assets in current template. Checking usage...`)

                // FETCH ALL OTHER TEMPLATES for this organization
                // We fetch only the 'config' column to minimize bandwidth
                // This is safe because even with 100-500 templates, the text data is manageable for a server action.
                const { data: otherTemplates, error: fetchAllError } = await supabase
                    .from('image_templates')
                    .select('config')
                    .eq('organization_id', template.organization_id)
                    .neq('id', id)

                if (fetchAllError) {
                    throw new Error(`Failed to fetch other templates: ${fetchAllError.message}`)
                }

                // Build a Set of ALL assets used in ALL OTHER templates
                const globalUsedAssets = new Set<string>()

                otherTemplates?.forEach(row => {
                    const rowConfig = JSON.stringify(row.config)
                    const rowMatches = rowConfig.match(/\/template-assets\/[^"'\s\\]+/g) || []
                    rowMatches.forEach(m => globalUsedAssets.add(m))
                })

                console.log(`[deleteTemplate] Scanned ${otherTemplates?.length} other templates. Found ${globalUsedAssets.size} total active assets.`)

                // Decide for each asset
                for (const assetRawOne of uniqueAssetsInCurrentTemplate) {
                    // Check exact string match in the Set
                    if (globalUsedAssets.has(assetRawOne)) {
                        console.log(`[deleteTemplate] Preserving ${assetRawOne} (used in other templates)`)
                    } else {
                        // Double check: decoded version?
                        // Our regex extracts exactly what is in the JSON string.
                        // So simple string equality is usually enough.
                        // But just to be safe, we rely on the exact match we found in the current template
                        // vs the exact matches found in other templates.

                        console.log(`[deleteTemplate] Deleting orphan asset: ${assetRawOne}`)

                        const parts = assetRawOne.split('/template-assets/')
                        if (parts.length > 1) {
                            const decodedPath = decodeURIComponent(parts[1])
                            await deleteAsset(decodedPath, 'template-assets')
                        }
                    }
                }
            }

        } catch (e) {
            console.error('Failed to cleanup assets:', e)
        }
    }

    // 3. Delete record
    const { error } = await supabase
        .from('image_templates')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/settings/templates')
    return { success: true }
}

export async function duplicateTemplate(id: string, organizationId: string) {
    const supabase = await createClient()

    // 1. Fetch original template
    const { data: original, error: fetchError } = await supabase
        .from('image_templates')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()

    if (fetchError || !original) {
        return { error: 'Template not found' }
    }

    // 2. Prepare new payload
    const payload = {
        name: `Copy of ${original.name}`,
        config: original.config,
        category: original.category,
        organization_id: organizationId,
        // created_at, updated_at, id are auto-generated
    }

    // 3. Insert new record
    const { data: newTemplate, error: insertError } = await supabase
        .from('image_templates')
        .insert(payload)
        .select()
        .single()

    if (insertError) {
        console.error('duplicateTemplate Error:', insertError)
        return { error: insertError.message }
    }

    revalidatePath('/settings/templates')
    return { success: true, data: newTemplate }
}
