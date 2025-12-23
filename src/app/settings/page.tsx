import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'
import WebflowTokenForm from './webflow-token-form'

export default async function SettingsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // CHECK ORGANIZATION STATUS
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    // If NO Org -> Redirect to Onboarding
    if (!member) {
        redirect('/onboarding')
    }

    const { data: org } = await supabase
        .from('organizations')
        .select('webflow_config')
        .eq('id', member.organization_id)
        .single()

    const hasToken = !!org?.webflow_config?.apiToken

    return (
        <div className="flex h-screen bg-white text-black overflow-hidden">
            <AppSidebar />
            <main className="flex-1 flex flex-col overflow-y-auto">
                <header className="h-16 border-b border-gray-200 flex items-center px-8 flex-shrink-0 gap-8">
                    <h1 className="text-xl font-bold tracking-tight">Settings</h1>
                    <nav className="flex gap-4">
                        <a href="/settings" className="text-sm font-medium border-b-2 border-black pb-5 mt-5">Webflow API</a>
                        <a href="/settings/organization" className="text-sm font-medium text-gray-400 hover:text-black transition-colors pb-5 mt-5 border-b-2 border-transparent hover:border-gray-200">Brand Identity</a>
                    </nav>
                </header>

                <div className="p-8">
                    <WebflowTokenForm initialHasToken={hasToken} />
                </div>
            </main>
        </div>
    )
}
