'use client'

import { deleteTemplate } from './actions'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'

export function DeleteTemplateButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition()

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this template?')) {
            startTransition(async () => {
                await deleteTemplate(id)
            })
        }
    }

    return (
        <Button
            variant="outline"
            size="icon"
            className="rounded-none border-black hover:bg-red-50 hover:text-red-500 hover:border-red-500 shrink-0"
            onClick={handleDelete}
            disabled={isPending}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}
