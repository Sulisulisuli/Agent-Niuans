'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Button } from '@/components/ui/button'

interface MobileHeaderProps {
    user: SupabaseUser
    profile: any
}

export function MobileHeader({ user, profile }: MobileHeaderProps) {
    return (
        <header className="flex h-16 items-center border-b bg-black px-4 lg:hidden sticky top-0 z-50">
            <div className="flex items-center gap-2 mr-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-80 border-r-0 bg-transparent shadow-none">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SheetDescription className="sr-only">
                            Mobile navigation menu for accessing dashboard sections.
                        </SheetDescription>
                        {/* 
                We render the AppSidebar here. 
                The AppSidebar component itself needs to be robust enough to handle being inside the sheet 
                OR we should style the sheet content to match the sidebar's expected environment.
                Since AppSidebar has its own width and bg, we just render it.
             */}
                        <div className="h-full w-full">
                            <AppSidebar user={user} profile={profile} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-[#eb4f27]"></div>
                <span className="font-bold text-lg text-white tracking-tight">Agent Niuans</span>
            </div>
        </header>
    )
}
