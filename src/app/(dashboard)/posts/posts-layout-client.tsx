'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveWebflowConfig } from '@/app/(dashboard)/settings/actions'
import { CollectionSwitcher } from './collection-switcher'
import PostsLoading from './loading'

interface PostsLayoutClientProps {
    children: React.ReactNode
    isConfigured: boolean
    siteId?: string
    token?: string
    collectionId?: string
}

export default function PostsLayoutClient({
    children,
    isConfigured,
    siteId,
    token,
    collectionId
}: PostsLayoutClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // When the user selects a new collection:
    // 1. Update DB (await)
    // 2. Refresh router (inside transition) to show loading state
    const handleCollectionChange = async (newCollectionId: string) => {
        await saveWebflowConfig({ collectionId: newCollectionId }, true)

        startTransition(() => {
            router.refresh()
        })
    }

    return (
        <>
            <header className="flex items-center justify-between border-b bg-white px-6 py-6">
                <h1 className="font-semibold text-lg">Content & Posts</h1>
                {isConfigured && siteId && token && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 hidden md:inline">Working Collection:</span>
                        <CollectionSwitcher
                            token={token}
                            siteId={siteId}
                            currentCollectionId={collectionId || ''}
                            onCollectionChange={handleCollectionChange}
                        />
                    </div>
                )}
            </header>
            <main>
                {isPending ? <PostsLoading /> : children}
            </main>
        </>
    )
}
