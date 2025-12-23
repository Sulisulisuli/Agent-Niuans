import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'
import OrganizationGeneralForm from './organization-general-form'
import OrganizationProfileForm from './organization-profile-form'
import { getOrganizationProfile } from '../actions'

export default async function OrganizationSettingsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Load Profile Data
    const { profile, orgDetails, error } = await getOrganizationProfile()

    if (error) {
        console.error('Failed to load profile:', error)
    }

    return (
        <div className="flex h-screen bg-white text-black overflow-hidden">
            <AppSidebar />
            <main className="flex-1 flex flex-col overflow-y-auto">
                <header className="h-16 border-b border-gray-200 flex items-center px-8 flex-shrink-0 gap-8">
                    <h1 className="text-xl font-bold tracking-tight">Organization Settings</h1>
                    <nav className="flex gap-4">
                        <a href="/settings" className="text-sm font-medium text-gray-400 hover:text-black transition-colors pb-5 mt-5 border-b-2 border-transparent hover:border-gray-200">Webflow API</a>
                        <a href="/settings/organization" className="text-sm font-medium border-b-2 border-black pb-5 mt-5">Brand & General</a>
                    </nav>
                </header>

                <div className="p-8 space-y-8">
                    {/* General Settings */}
                    <OrganizationGeneralForm
                        initialName={orgDetails?.name}
                        initialDomain={orgDetails?.domain}
                    />

                    {/* Brand Profile */}
                    <OrganizationProfileForm
                        initialProfile={profile}
                        organizationDomain={orgDetails?.domain}
                    />
                </div>
            </main>
        </div>
    )
}
