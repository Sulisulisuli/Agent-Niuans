'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Linkedin, Check, Loader2 } from "lucide-react"
import { updateLinkedInConfig, disconnectLinkedIn } from "@/app/(dashboard)/settings/actions"

interface LinkedInConnectProps {
    isConnected: boolean
    organizationId?: string
    onConnect?: () => void
    onDisconnect?: () => void
}

export function LinkedInConnect({ isConnected, organizationId: initialOrgId, onConnect, onDisconnect }: LinkedInConnectProps) {
    const [orgId, setOrgId] = useState(initialOrgId || "")
    const [isSaving, setIsSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [isDisconnecting, setIsDisconnecting] = useState(false)

    const handleSaveOrgId = async () => {
        setIsSaving(true)
        setIsSaved(false)
        try {
            await updateLinkedInConfig({ organizationId: orgId })
            setIsSaved(true)
            setTimeout(() => setIsSaved(false), 3000)
        } catch (error) {
            console.error("Failed to save Org ID:", error)
            alert("Failed to save Organization ID")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect your LinkedIn account?")) return

        setIsDisconnecting(true)
        try {
            await disconnectLinkedIn()
            if (onDisconnect) onDisconnect()
        } catch (error) {
            console.error("Failed to disconnect:", error)
            alert("Failed to disconnect LinkedIn account")
        } finally {
            setIsDisconnecting(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="text-sm text-gray-500">
                {isConnected
                    ? "Your LinkedIn account is connected. You can now publish posts directly to your profile or company page."
                    : "Connect your LinkedIn account to automatically publish content and analyze engagement."}
            </div>

            {/* 
                Hiding Organization ID input until Marketing Developer Platform is approved by LinkedIn.
                This prevents confusion while the feature is technically waiting for API permissions.
            */}
            {isConnected && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="space-y-2">
                        <Label htmlFor="orgId" className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            LinkedIn Organization ID
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="orgId"
                                placeholder="e.g. 1234567"
                                value={orgId}
                                onChange={(e) => setOrgId(e.target.value)}
                                className="max-w-xs rounded-none border-gray-200"
                            />
                            <Button
                                onClick={handleSaveOrgId}
                                disabled={isSaving || orgId === initialOrgId}
                                className="rounded-none bg-black hover:bg-black/90 text-white min-w-[80px]"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isSaved ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    "Save"
                                )}
                            </Button>
                        </div>
                        <p className="text-[10px] text-gray-400">
                            Required to publish as a Company Page. Find this in your LinkedIn Page URL.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex actions">
                {isConnected ? (
                    <Button
                        variant="ghost"
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 p-0 h-auto font-normal disabled:opacity-50"
                    >
                        {isDisconnecting ? "Disconnecting..." : "Disconnect LinkedIn Account"}
                    </Button>
                ) : (
                    <a
                        href="/api/auth/linkedin"
                        className="inline-flex h-10 items-center justify-center rounded-none bg-[#0077b5] px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-[#006097] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2"
                    >
                        <Linkedin className="h-4 w-4" />
                        Connect LinkedIn Account
                    </a>
                )}
            </div>
        </div >
    )
}
