import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'
import WebflowTokenForm from './webflow-token-form'
import { IntegrationCard } from '@/components/settings/integration-card'
import { LinkedInConnect } from '@/components/settings/linkedin-connect'
import { Linkedin } from 'lucide-react'

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
        .select('webflow_config, linkedin_config')
        .eq('id', member.organization_id)
        .single()


    const hasToken = !!org?.webflow_config?.apiToken

    // Parse LinkedIn config safely
    const linkedinConfig = org?.linkedin_config as any || {}
    const isLinkedinConnected = !!linkedinConfig.accessToken
    const linkedinProfileName = linkedinConfig.profileName || 'LinkedIn User'

    return (
        <div className="flex h-screen bg-white text-black overflow-hidden">
            <AppSidebar />
            <main className="flex-1 flex flex-col overflow-y-auto">
                <header className="h-16 border-b border-gray-200 flex items-center px-8 flex-shrink-0 gap-8">
                    <h1 className="text-xl font-bold tracking-tight">Settings</h1>
                    <nav className="flex gap-4">
                        <a href="/settings" className="text-sm font-medium border-b-2 border-black pb-5 mt-5">Integrations</a>
                        <a href="/settings/organization" className="text-sm font-medium text-gray-400 hover:text-black transition-colors pb-5 mt-5 border-b-2 border-transparent hover:border-gray-200">Brand Identity</a>
                    </nav>
                </header>

                <div className="p-8 max-w-5xl space-y-8">
                    <div className="grid gap-6">
                        {/* Webflow Card */}
                        <IntegrationCard
                            title="Webflow"
                            description="Connect your Webflow site to publish AI-generated content."
                            icon={<img src="https://assets-global.website-files.com/64589d97746566d5be5b902e/64589d97746566d5be5b905a_Webflow_logo_icon_black.svg" className="h-5 w-5" alt="Webflow" />}
                            isConnected={hasToken}
                            statusText={hasToken ? "Ready to Publish" : "Not Configured"}
                        >
                            <WebflowTokenForm initialHasToken={hasToken} />
                        </IntegrationCard>

                        {/* LinkedIn Card */}
                        <IntegrationCard
                            title={isLinkedinConnected ? linkedinProfileName : "LinkedIn"}
                            description="Connect your LinkedIn profile or company page to automate social posts."
                            icon={<div className="h-5 w-5"><Linkedin className="h-5 w-5 text-[#0077b5]" /></div>}
                            isConnected={isLinkedinConnected}
                        >
                            <LinkedInConnect
                                isConnected={isLinkedinConnected}
                            />
                        </IntegrationCard>
                    </div>
                </div>
            </main>
        </div>
    )
}
