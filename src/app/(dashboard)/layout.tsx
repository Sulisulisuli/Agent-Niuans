import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch full profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="flex h-screen bg-white text-black overflow-hidden flex-col md:flex-row">
            {/* Mobile Header */}
            <MobileHeader user={user} profile={profile} />

            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden md:flex w-64 flex-col h-full fixed inset-y-0 z-50">
                <AppSidebar user={user} profile={profile} />
            </div>

            {/* Main Content Area */}
            {/* Added md:pl-64 to account for fixed sidebar */}
            <main className="flex-1 flex flex-col overflow-y-auto w-full md:pl-64">
                {children}
            </main>
        </div>
    )
}
