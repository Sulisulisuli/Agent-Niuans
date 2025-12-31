'use server'

import { createClient } from '@/utils/supabase/server'

export async function getFacebookPages() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
        if (!member) return { error: 'No Org' }

        const { data: org } = await supabase.from('organizations').select('facebook_config').eq('id', member.organization_id).single()
        const config = org?.facebook_config as any

        if (!config?.accessToken) return { error: 'Not Connected' }

        const res = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${config.accessToken}&fields=id,name,picture,category`)
        const data = await res.json()

        if (data.error) return { error: data.error.message }

        return { pages: data.data } // Array of { id, name, category, picture: { data: { url } } }
    } catch (error: any) {
        return { error: error.message }
    }
}
