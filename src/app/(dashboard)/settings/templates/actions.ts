'use server'

import { createClient } from '@/utils/supabase/server'
import { TemplateConfig } from '@/lib/opengraph/engine'
import { revalidatePath } from 'next/cache'

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

    if (templateData.id) {
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

    revalidatePath('/settings/templates')
    return { success: true, data }
}

export async function deleteTemplate(id: string) {
    const supabase = await createClient()

    // 1. Fetch template to check for assets
    const { data: template } = await supabase
        .from('image_templates')
        .select('config')
        .eq('id', id)
        .single()

    // 2. Delete asset if exists
    if (template?.config) {
        const config = template.config as unknown as TemplateConfig
        if (config.backgroundImage && config.backgroundImage.includes('/template-assets/')) {
            try {
                // Extract path: .../template-assets/USER_ID/FILE_NAME
                const path = config.backgroundImage.split('/template-assets/')[1]
                if (path) {
                    await supabase.storage
                        .from('template-assets')
                        .remove([decodeURIComponent(path)])
                }
            } catch (e) {
                console.error('Failed to cleanup asset:', e)
            }
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
