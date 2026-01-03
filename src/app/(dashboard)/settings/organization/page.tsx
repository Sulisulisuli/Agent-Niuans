import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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
        <>
            <header className="h-16 border-b border-gray-200 flex items-center px-4 md:px-8 flex-shrink-0 gap-4 md:gap-8 overflow-hidden">
                <h1 className="text-xl font-bold tracking-tight hidden md:block">Organization Settings</h1>
                <nav className="flex gap-4 overflow-x-auto scrollbar-hide w-full md:w-auto items-center h-full">
                    <a href="/settings" className="text-sm font-medium text-gray-400 hover:text-black transition-colors pb-5 mt-5 border-b-2 border-transparent hover:border-gray-200 whitespace-nowrap">Integrations</a>
                    <a href="/settings/organization" className="text-sm font-medium border-b-2 border-black pb-5 mt-5 whitespace-nowrap">Brand & General</a>
                    <a href="/settings/templates" className="text-sm font-medium text-gray-400 hover:text-black transition-colors pb-5 mt-5 border-b-2 border-transparent hover:border-gray-200 whitespace-nowrap">Templates</a>
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
        </>
    )
}
