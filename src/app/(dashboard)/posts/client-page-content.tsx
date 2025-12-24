'use client'

import { useState } from 'react'
import EditorWrapper from './editor-wrapper'
import PostList from './post-list'
import { useRouter } from 'next/navigation'

interface ClientPageContentProps {
    fields: any[]
    collectionId: string
    token: string
    initialItems: any[]
}

export default function ClientPageContent({ fields, collectionId, token, initialItems }: ClientPageContentProps) {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
    const [editingItem, setEditingItem] = useState<any>(null)
    const router = useRouter()

    const handleCreateNew = () => {
        setEditingItem(null)
        setView('create')
    }

    const handleEdit = (item: any) => {
        setEditingItem(item)
        setView('edit') // 'edit' can just reuse 'create' (DynamicPostEditor) but pre-filled.
        // For now let's just use 'create' view as 'editor'
    }

    const handleBack = () => {
        setView('list')
        setEditingItem(null)
    }

    const handleSuccess = () => {
        router.refresh()
        setView('list')
        setEditingItem(null)
    }

    if (view === 'list') {
        return (
            <PostList
                key={collectionId}
                initialItems={initialItems}
                collectionId={collectionId}
                token={token}
                onCreateNew={handleCreateNew}
                onEdit={handleEdit} // Todo: Implement pre-filling in editor
            />
        )
    }

    return (
        <div className="space-y-4">
            <button
                onClick={handleBack}
                className="text-sm text-gray-500 hover:text-black hover:underline flex items-center gap-1 mb-4"
            >
                ← Back to List
            </button>

            <EditorWrapper
                fields={fields}
                collectionId={collectionId}
                token={token}
                initialData={editingItem}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
