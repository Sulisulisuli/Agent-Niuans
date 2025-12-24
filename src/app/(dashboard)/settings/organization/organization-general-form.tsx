'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateOrganizationDetails } from '../actions'
import { Loader2, Save, Globe, Building2 } from 'lucide-react'

interface OrganizationGeneralFormProps {
    initialName?: string
    initialDomain?: string
}

export default function OrganizationGeneralForm({ initialName = '', initialDomain = '' }: OrganizationGeneralFormProps) {
    const [name, setName] = useState(initialName)
    const [domain, setDomain] = useState(initialDomain)

    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setStatus('idle')
        setErrorMessage('')

        try {
            const res = await updateOrganizationDetails(name, domain)
            if (res.error) {
                setStatus('error')
                setErrorMessage(res.error)
            } else {
                setStatus('success')
                setTimeout(() => setStatus('idle'), 3000)
            }
        } catch (error: any) {
            setStatus('error')
            setErrorMessage(error.message || 'Error updating organization')
        } finally {
            setLoading(false)
        }
    }

    const hasChanges = name !== initialName || domain !== initialDomain

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 rounded-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2 mb-4">
                General Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="orgName" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        Organization Name
                    </Label>
                    <Input
                        id="orgName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My Awesome Org"
                        className="rounded-none bg-gray-50/50 border-gray-300"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="orgDomain" className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        Primary Domain
                    </Label>
                    <Input
                        id="orgDomain"
                        type="url"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="https://www.example.com"
                        pattern="https?://.+"
                        title="Must start with http:// or https://"
                        className="rounded-none bg-gray-50/50 border-gray-300 font-mono text-sm"
                        required
                    />
                </div>
            </div>

            {hasChanges && (
                <div className="flex items-center gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
                    <Button
                        type="submit"
                        disabled={loading || status === 'success'}
                        className={`rounded-none min-w-[120px] transition-all ${status === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-black hover:bg-black/90'}`}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : status === 'success' ? 'Saved' : 'Save Changes'}
                    </Button>

                    {status === 'error' && (
                        <span className="text-sm text-red-500">{errorMessage}</span>
                    )}
                </div>
            )}
        </form>
    )
}
