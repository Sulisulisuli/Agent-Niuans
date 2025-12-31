'use client'

import { Button } from '@/components/ui/button'
import { Copy, Loader2 } from 'lucide-react'
import { duplicateTemplate } from './actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function DuplicateTemplateButton({ id, organizationId }: { id: string, organizationId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDuplicate = async () => {
        if (loading) return
        setLoading(true)

        try {
            const res = await duplicateTemplate(id, organizationId)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Template duplicated')
                router.refresh()
            }
        } catch (e) {
            toast.error('Failed to duplicate template')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={handleDuplicate}
            disabled={loading}
            className="rounded-none border-black hover:bg-gray-100 w-10 shrink-0"
            title="Duplicate Template"
        >
            {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
                <Copy className="h-3 w-3" />
            )}
        </Button>
    )
}
