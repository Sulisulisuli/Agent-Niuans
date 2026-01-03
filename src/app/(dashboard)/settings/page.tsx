import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

import WebflowTokenForm from './webflow-token-form'
import { IntegrationCard } from '@/components/settings/integration-card'
import { LinkedInConnect } from '@/components/settings/linkedin-connect'
import { MetaConnect } from '@/components/settings/facebook-connect'
import ConnectGoogleButton from '@/components/analytics/ConnectGoogleButton'
import { Linkedin, Database, Facebook, Instagram } from 'lucide-react'
import DisconnectGoogleButton from '@/components/analytics/DisconnectGoogleButton';

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
        .select('webflow_config, linkedin_config, facebook_config, instagram_config, google_config')
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

    const googleConfig = org?.google_config as any || {}
    const isGoogleConnected = !!googleConfig.accessToken

    return (
        <>
            <header className="h-16 border-b border-gray-200 flex items-center px-4 md:px-8 flex-shrink-0 gap-4 md:gap-8 overflow-hidden">
                <h1 className="text-xl font-bold tracking-tight hidden md:block">Settings</h1>
                <nav className="flex gap-4 overflow-x-auto scrollbar-hide w-full md:w-auto items-center h-full">
                    <a href="/settings" className="text-sm font-medium border-b-2 border-black pb-5 mt-5 whitespace-nowrap">Integrations</a>
                    <a href="/settings/organization" className="text-sm font-medium text-gray-400 hover:text-black transition-colors pb-5 mt-5 border-b-2 border-transparent hover:border-gray-200 whitespace-nowrap">Brand Identity</a>
                    <a href="/settings/templates" className="text-sm font-medium text-gray-400 hover:text-black transition-colors pb-5 mt-5 border-b-2 border-transparent hover:border-gray-200 whitespace-nowrap">Templates</a>
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



                    {/* Google Card */}
                    <IntegrationCard
                        title="Google Analytics & Search Console"
                        description="Connect your Google accounts to track performance and generate AI reports."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>}
                        isConnected={isGoogleConnected}
                    >
                        {isGoogleConnected ? (
                            <div className="flex items-center justify-between w-full">
                                <span className="text-sm text-green-600 font-medium flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    Connected
                                </span>
                                <DisconnectGoogleButton />
                            </div>
                        ) : (
                            <ConnectGoogleButton isConnected={isGoogleConnected} />
                        )}
                    </IntegrationCard>
                </div>
            </div>
        </>
    )
}
