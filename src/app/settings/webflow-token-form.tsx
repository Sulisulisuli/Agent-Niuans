'use client'

import { useState } from 'react'
import { saveWebflowToken, getWebflowSites } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function WebflowTokenForm({ initialHasToken = false }: { initialHasToken?: boolean }) {
    const [loading, setLoading] = useState(false)
    const [token, setToken] = useState('')
    const [saved, setSaved] = useState(false)
    const [hasToken, setHasToken] = useState(initialHasToken)
    const [isEditing, setIsEditing] = useState(!initialHasToken)

    const handleTokenSubmit = async () => {
        setLoading(true)
        setSaved(false)

        // 1. Verify Token by fetching sites
        const res = await getWebflowSites(token)
        if (res.error || !res.sites) {
            setLoading(false)
            alert('Error: ' + (res.error || 'Invalid Token or API Error'))
            return
        }

        // 2. Save Token
        const saveRes = await saveWebflowToken(token)
        setLoading(false)

        if ((saveRes as any).error) {
            alert('Error saving token: ' + (saveRes as any).error)
            return
        }

        setSaved(true)
        setHasToken(true)
        setIsEditing(false)
    }

    if (hasToken && !isEditing) {
        return (
            <Card className="border-black rounded-none shadow-none max-w-2xl bg-gray-50">
                <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-700">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Webflow Connected</h3>
                            <p className="text-sm text-gray-500">API Token is saved and valid.</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="rounded-none border-black hover:bg-black hover:text-white"
                        onClick={() => setIsEditing(true)}
                    >
                        Change Token
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-black rounded-none shadow-none max-w-2xl">
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <CardTitle>Webflow API Token</CardTitle>
                    {hasToken && <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>}
                </div>
                <CardDescription>
                    Generate a token in Webflow Site Settings &gt; Integrations &gt; API Access.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Label>API Token</Label>
                <Input
                    type="password"
                    placeholder="wdp_v2_..."
                    value={token}
                    onChange={(e) => {
                        setToken(e.target.value)
                        setSaved(false)
                    }}
                    className="rounded-none h-12 border-black"
                />
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleTokenSubmit}
                    disabled={!token || loading}
                    className={`w-full h-12 rounded-none text-white transition-all ${saved ? 'bg-green-600 hover:bg-green-700' : 'bg-black hover:bg-[#eb4f27]'}`}
                >
                    {loading ? <Loader2 className="animate-spin" /> : saved ? <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Token Saved</span> : 'Save Token'}
                </Button>
            </CardFooter>
        </Card>
    )
}
