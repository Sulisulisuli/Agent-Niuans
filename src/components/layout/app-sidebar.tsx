'use client'

import { User as SupabaseUser } from '@supabase/supabase-js'
import { signout } from '@/app/auth/actions'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Database, Share2, Settings, User, LogOut, Linkedin } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AppSidebarProps {
    user: SupabaseUser
    profile: any
}

export function AppSidebar({ user, profile }: AppSidebarProps) {
    const pathname = usePathname()

    const navItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Website CMS", href: "/posts", icon: Database },
        { name: "LinkedIn", href: "/linkedin", icon: Linkedin },
        { name: "Distribution", href: "/distribution", icon: Share2 },
    ]

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    const userInitials = profile?.full_name
        ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || 'AN'

    return (
        <div className="flex flex-col h-full w-64 bg-black text-white border-r border-black/10">
            <div className="p-6">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-[#eb4f27]"></div>
                    <span className="font-bold text-lg tracking-tight">Agent Niuans</span>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white group",
                            isActive(item.href)
                                ? "bg-[#eb4f27] text-white hover:bg-[#eb4f27]"
                                : "text-gray-400"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2">
                <Link
                    href="/settings"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white group",
                        isActive('/settings')
                            ? "bg-[#eb4f27] text-white hover:bg-[#eb4f27]"
                            : "text-gray-400"
                    )}
                >
                    <Settings className="h-4 w-4" />
                    Settings
                </Link>

                <div className="pt-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-white/10 transition-colors group">
                                <Avatar className="h-8 w-8 rounded-none border border-white/20">
                                    <AvatarImage src={profile?.avatar_url || ''} alt="@user" />
                                    <AvatarFallback className="bg-[#eb4f27] text-white rounded-none text-xs">{userInitials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium truncate text-gray-200 group-hover:text-white">
                                        {profile?.full_name || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate group-hover:text-gray-400">
                                        {user?.email}
                                    </p>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-none border-black bg-black text-white" align="start" side="right" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                                    <p className="text-xs leading-none text-gray-400">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white">
                                <form action={signout} className="w-full flex items-center">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <button type="submit" className="w-full text-left">Log out</button>
                                </form>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
