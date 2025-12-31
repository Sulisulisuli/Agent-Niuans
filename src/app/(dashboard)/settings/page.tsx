import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

import WebflowTokenForm from './webflow-token-form'
import { IntegrationCard } from '@/components/settings/integration-card'
import { LinkedInConnect } from '@/components/settings/linkedin-connect'
import { MetaConnect } from '@/components/settings/facebook-connect'
import { Linkedin, Database, Facebook, Instagram } from 'lucide-react'

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
        .select('webflow_config, linkedin_config, facebook_config, instagram_config')
        .eq('id', member.organization_id)
        .single()


    const hasToken = !!org?.webflow_config?.apiToken

    // Parse LinkedIn config safely
    const linkedinConfig = org?.linkedin_config as any || {}
    const isLinkedinConnected = !!linkedinConfig.accessToken
    const linkedinProfileName = linkedinConfig.profileName || 'LinkedIn User'

    // Parse FB/Insta
    const facebookConfig = org?.facebook_config as any || {}
    const isFacebookConnected = !!facebookConfig.accessToken

    const instagramConfig = org?.instagram_config as any || {}
    const isInstagramConnected = !!instagramConfig.accessToken

    return (
        <>
            <header className="h-16 border-b border-gray-200 flex items-center px-8 flex-shrink-0 gap-8">
                <h1 className="text-xl font-bold tracking-tight">Settings</h1>
                <nav className="flex gap-4">
                    <a href="/settings" className="text-sm font-medium border-b-2 border-black pb-5 mt-5">Integrations</a>
                    <a href="/settings/organization" className="text-sm font-medium text-gray-400 hover:text-black transition-colors pb-5 mt-5 border-b-2 border-transparent hover:border-gray-200">Brand Identity</a>
                    <a href="/settings/templates" className="text-sm font-medium text-gray-400 hover:text-black transition-colors pb-5 mt-5 border-b-2 border-transparent hover:border-gray-200">Templates</a>
                </nav>
            </header>

            <div className="p-8 max-w-5xl space-y-8">
                <div className="grid gap-6">
                    {/* Webflow Card */}
                    <IntegrationCard
                        title="Webflow"
                        description="Connect your Webflow site to publish AI-generated content."
                        icon={<Database className="h-5 w-5" />}
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
                            organizationId={linkedinConfig.organizationId}
                        />
                    </IntegrationCard>

                    {/* Facebook Card */}
                    <IntegrationCard
                        title={facebookConfig.userName || "Facebook"}
                        description="Connect your Facebook Page to automate posts."
                        icon={<div className="h-5 w-5"><Facebook className="h-5 w-5 text-[#1877F2]" /></div>}
                        isConnected={isFacebookConnected}
                    >
                        <MetaConnect
                            service="facebook"
                            isConnected={isFacebookConnected}
                        />
                    </IntegrationCard>

                    {/* Instagram Card */}
                    <IntegrationCard
                        title={instagramConfig.userName || "Instagram"}
                        description="Connect your Instagram Business Account."
                        icon={<div className="h-5 w-5"><Instagram className="h-5 w-5 text-[#E1306C]" /></div>}
                        isConnected={isInstagramConnected}
                    >
                        <MetaConnect
                            service="instagram"
                            isConnected={isInstagramConnected}
                        />
                    </IntegrationCard>
                </div>
            </div>
        </>
    )
}
