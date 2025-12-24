import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

import WebflowSetup from './webflow-setup'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'



import ClientPageContent from './client-page-content'
import { getWebflowCollection } from '../settings/actions'

export default async function PostsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get Org and Configuration
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member) redirect('/onboarding')

    const { data: org } = await supabase
        .from('organizations')
        .select('webflow_config')
        .eq('id', member.organization_id)
        .single()

    const config = org?.webflow_config || {}
    const token = config.apiToken
    // Fetch siteId if available (it should be if we ran wizard)
    const siteId = config.siteId
    const isConfigured = !!config.collectionId

    // Case 1: No Token
    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
                <AlertCircle className="h-12 w-12 text-[#eb4f27] mb-4" />
                <h2 className="text-2xl font-bold mb-2">Webflow Not Connected</h2>
                <p className="text-gray-500 mb-6 max-w-md">
                    To start creating posts, you need to connect your Webflow account first.
                </p>
                <Link
                    href="/settings"
                    className="inline-flex h-12 items-center justify-center rounded-none bg-black px-8 text-sm font-medium text-white shadow transition-colors hover:bg-[#eb4f27]"
                >
                    Go to Settings
                </Link>
            </div>
        )
    }

    let collectionFields: any[] = []
    let initialItems: any[] = []

    if (isConfigured) {
        try {
            // Parallel fetch for speed
            const [fieldsRes, itemsRes] = await Promise.all([
                getWebflowCollection(token, config.collectionId),
                getWebflowItems(token, config.collectionId)
            ])

            if (fieldsRes.collection?.fields) {
                collectionFields = fieldsRes.collection.fields
            }
            if (itemsRes.items) {
                initialItems = itemsRes.items
            }
        } catch (e) {
            console.error('Failed to fetch data', e)
        }
    }

    return (
        <div className="p-8">
            {!isConfigured ? (
                <WebflowSetup token={token} />
            ) : (
                <ClientPageContent
                    fields={collectionFields}
                    collectionId={config.collectionId}
                    token={token}
                    initialItems={initialItems}
                />
            )}
        </div>
    )
}


import { getWebflowItems } from './actions'
