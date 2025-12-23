'use client'

import { Button } from "@/components/ui/button"
import { Linkedin } from "lucide-react"

interface LinkedInConnectProps {
    isConnected: boolean
    onConnect?: () => void
    onDisconnect?: () => void
}

export function LinkedInConnect({ isConnected, onConnect, onDisconnect }: LinkedInConnectProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-500">
                {isConnected
                    ? "Your LinkedIn account is connected. You can now publish posts directly to your profile or company page."
                    : "Connect your LinkedIn account to automatically publish content and analyze engagement."}
            </div>

            <div className="flex actions">
                {isConnected ? (
                    <Button
                        variant="outline"
                        onClick={onDisconnect}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        Disconnect LinkedIn
                    </Button>
                ) : (
                    <a
                        href="/api/auth/linkedin"
                        className="inline-flex h-10 items-center justify-center rounded-md bg-[#0077b5] px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-[#006097] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2"
                    >
                        <Linkedin className="h-4 w-4" />
                        Connect LinkedIn Account
                    </a>
                )}
            </div>
        </div >
    )
}
