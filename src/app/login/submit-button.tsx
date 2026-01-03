'use client'

import { useFormStatus } from 'react-dom'
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { type ComponentProps } from 'react'

interface SubmitButtonProps extends ComponentProps<typeof Button> {
    children: React.ReactNode
}

export function SubmitButton({ children, className, ...props }: SubmitButtonProps) {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            disabled={pending}
            className={cn(className)}
            {...props}
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                </>
            ) : (
                children
            )}
        </Button>
    )
}
