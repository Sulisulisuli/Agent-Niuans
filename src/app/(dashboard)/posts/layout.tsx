import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PostsLayoutClient from './posts-layout-client'

export default async function PostsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    const { data: org } = await supabase
        .from('organizations')
        .select('webflow_config')
        .eq('id', member?.organization_id)
        .single()

    const config = org?.webflow_config || {}
    const token = config.apiToken
    const siteId = config.siteId
    const isConfigured = !!config.collectionId

    return (
        <PostsLayoutClient
            isConfigured={isConfigured}
            siteId={siteId}
            token={token}
            collectionId={config.collectionId}
        >
            {children}
        </PostsLayoutClient>
    )
}
