import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { FacebookPostCreator } from '@/components/facebook/post-creator'
import { MetaConnect } from '@/components/settings/facebook-connect'

export default async function FacebookPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!member) {
        redirect('/onboarding')
    }

    const { data: org } = await supabase
        .from('organizations')
        .select('facebook_config')
        .eq('id', member.organization_id)
        .single()

    const config = org?.facebook_config as any || {}
    const isConnected = !!config.accessToken

    return (
        <div className="h-full flex flex-col">
            <header className="flex-none border-b bg-white px-8 py-4">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Facebook</h1>
                <p className="text-sm text-gray-500">Manage your Facebook Page posts</p>
            </header>

            <div className="flex-1 overflow-auto p-8">
                <div className="mx-auto max-w-5xl">
                    {isConnected ? (
                        <FacebookPostCreator />
                    ) : (
                        <div className="max-w-2xl mx-auto mt-20 text-center space-y-6">
                            <h2 className="text-xl font-semibold">Connect Facebook</h2>
                            <p className="text-gray-500">Connect your Facebook Page to start posting.</p>
                            <div className="flex justify-center">
                                <MetaConnect isConnected={false} service="facebook" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
