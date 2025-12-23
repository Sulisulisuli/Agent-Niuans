import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import OnboardingWizard from './wizard'

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // If user already has an org, redirect to dashboard
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (member) {
        redirect('/')
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-lg p-8">
                <OnboardingWizard />
            </div>
        </div>
    )
}
