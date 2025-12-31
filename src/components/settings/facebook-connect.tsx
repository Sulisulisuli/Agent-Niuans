'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Facebook, Instagram, Loader2 } from "lucide-react"
import { disconnectFacebook, disconnectInstagram } from "@/app/(dashboard)/settings/actions"

interface FacebookConnectProps {
    isConnected: boolean
    onDisconnect?: () => void
    service: 'facebook' | 'instagram'
}

export function MetaConnect({ isConnected, onDisconnect, service }: FacebookConnectProps) {
    const [isDisconnecting, setIsDisconnecting] = useState(false)

    const handleDisconnect = async () => {
        if (!confirm(`Are you sure you want to disconnect your ${service === 'facebook' ? 'Facebook' : 'Instagram'} account?`)) return

        setIsDisconnecting(true)
        try {
            if (service === 'facebook') {
                await disconnectFacebook()
            } else {
                await disconnectInstagram()
            }
            if (onDisconnect) onDisconnect()
        } catch (error) {
            console.error("Failed to disconnect:", error)
            alert("Failed to disconnect account")
        } finally {
            setIsDisconnecting(false)
        }
    }

    const displayText = service === 'facebook' ? 'Facebook Page' : 'Instagram Account'
    const icon = service === 'facebook' ? <Facebook className="h-4 w-4" /> : <Instagram className="h-4 w-4" />
    const brandColor = service === 'facebook' ? 'bg-[#1877F2] hover:bg-[#1877F2]/90' : 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90'

    return (
        <div className="flex flex-col gap-6">
            <div className="text-sm text-gray-500">
                {isConnected
                    ? `Your ${displayText} is connected. You can now publish posts directly.`
                    : `Connect your ${displayText} to automatically publish content and analyze engagement.`}
            </div>

            <div className="flex actions">
                {isConnected ? (
                    <Button
                        variant="ghost"
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 p-0 h-auto font-normal disabled:opacity-50"
                    >
                        {isDisconnecting ? "Disconnecting..." : `Disconnect ${service === 'facebook' ? 'Facebook' : 'Instagram'}`}
                    </Button>
                ) : (
                    <a
                        href={`/api/auth/facebook?connect=${service}`}
                        className={`inline-flex h-10 items-center justify-center rounded-none px-4 py-2 text-sm font-medium text-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2 ${brandColor}`}
                    >
                        {icon}
                        Connect {service === 'facebook' ? 'Facebook' : 'Instagram'}
                    </a>
                )}
            </div>
        </div >
    )
}
