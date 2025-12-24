import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { LinkedInPostCreator } from "@/components/linkedin/post-creator"
import { LinkedInConnect } from "@/components/settings/linkedin-connect"


export default async function LinkedInPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect("/login")
    }

    // CHECK ORGANIZATION STATUS (Replicating logic from Settings page)
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!member) {
        return redirect('/onboarding')
    }

    const { data: organization } = await supabase
        .from('organizations')
        .select('linkedin_config')
        .eq('id', member.organization_id)
        .single()

    // Fix: Access token is saved as camelCase 'accessToken' in the JSON object
    const isConnected = !!organization?.linkedin_config?.accessToken

    return (
        <div className="flex-1 flex flex-col overflow-y-auto bg-[#FAFAFA]">
            {/* Header */}
            <div className="border-b bg-white px-8 py-5 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">LinkedIn Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Generate and publish content directly to your personal profile.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {isConnected ? (
                    <LinkedInPostCreator />
                ) : (
                    <div className="max-w-2xl mx-auto mt-20 text-center">
                        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-semibold mb-4">Connect LinkedIn to Get Started</h2>
                            <p className="text-gray-500 mb-8">
                                To use the AI post generator and scheduler, you need to connect your LinkedIn profile first.
                            </p>
                            <div className="flex justify-center">
                                <LinkedInConnect isConnected={false} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
