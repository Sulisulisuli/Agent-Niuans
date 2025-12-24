'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, Share2, Settings, LogOut, Linkedin } from "lucide-react"

export function AppSidebar() {
    const pathname = usePathname()

    const navItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Posts (Webflow)", href: "/posts", icon: FileText },
        { name: "LinkedIn", href: "/linkedin", icon: Linkedin },
        { name: "Distribution", href: "/distribution", icon: Share2 },
        { name: "Settings", href: "/settings", icon: Settings },
    ]

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

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

            <div className="p-4 border-t border-white/10">
                <div className="px-3 py-2 text-xs text-gray-500">
                    v1.0.0
                </div>
            </div>
        </div>
    )
}
