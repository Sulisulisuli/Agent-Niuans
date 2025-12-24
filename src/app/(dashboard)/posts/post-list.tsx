'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { WebflowItem } from '@/lib/webflow' // You might need to export this interface from lib/webflow
import { deleteWebflowItem, updateWebflowItemStatus } from './actions'
import { Loader2, Trash2, Edit2, Plus, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface PostListProps {
    initialItems: any[]
    collectionId: string
    token: string
    onCreateNew: () => void
    onEdit: (item: any) => void
}

export default function PostList({ initialItems, collectionId, token, onCreateNew, onEdit }: PostListProps) {
    const [items, setItems] = useState<any[]>(initialItems)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Sync items when initialItems prop updates (e.g. after router.refresh())
    useEffect(() => {
        setItems(initialItems)
    }, [initialItems])

    const getItemStatus = (item: any) => {
        if (item.isDraft) return 'DRAFT'
        if (!item.lastPublished) return 'STAGED'
        const updated = new Date(item.lastUpdated).getTime()
        const published = new Date(item.lastPublished).getTime()
        return updated > published + 1000 ? 'STAGED' : 'PUBLISHED'
    }

    const handleStatusChange = async (itemId: string, newStatus: string) => {
        setUpdatingId(itemId)

        // Optimistic Update
        const now = new Date().toISOString()
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item

            if (newStatus === 'DRAFT') {
                return { ...item, isDraft: true }
            } else if (newStatus === 'STAGED') {
                // Force Staged: Updated > Published
                return { ...item, isDraft: false, lastUpdated: now }
            } else if (newStatus === 'PUBLISHED') {
                // Force Published: Updated = Published
                return { ...item, isDraft: false, lastUpdated: now, lastPublished: now }
            }
            return item
        }))

        try {
            const res = await updateWebflowItemStatus(token, collectionId, itemId, newStatus as any)

            if (!res.success) {
                setError(res.error || 'Failed to update status')
            }
        } catch (e: any) {
            setError(e.message)
        } finally {
            setUpdatingId(null)
        }
    }

    // Triggered by Confirm Button in Dialog
    const handleDeleteConfirm = async () => {
        if (!deletingId) return

        setIsDeleting(true)
        setError(null)

        try {
            console.log('Attempting to delete:', deletingId)
            const res = await deleteWebflowItem(token, collectionId, deletingId)
            console.log('Delete result:', res)

            if (res.success) {
                setItems(prev => prev.filter(i => i.id !== deletingId))
                setDeletingId(null) // Only close on success, or maybe close anyway?
            } else {
                setDeletingId(null) // Close confirm dialog
                setError(res.error || 'Unknown error occurred') // Show error dialog
            }
        } catch (e: any) {
            console.error('Delete exception:', e)
            setDeletingId(null)
            setError(e.message || 'Network error')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <AlertDialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
                <AlertDialogContent className="rounded-none border-red-500 border-2">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Error Occurred
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-900 font-medium">
                            {error}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => setError(null)}
                            className="bg-red-600 hover:bg-red-700 rounded-none text-white border-0"
                        >
                            Close
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent className="rounded-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the item from your Webflow CMS.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingId(null)} className="rounded-none">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 rounded-none text-white border-0"
                        >
                            {isDeleting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete Item
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">CMS Items ({items.length})</h2>
                <Button
                    onClick={onCreateNew}
                    className="rounded-none bg-[#eb4f27] hover:bg-[#eb4f27]/90 text-white"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New
                </Button>
            </div>

            <div className="grid gap-4">
                {items.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200">
                        <p className="text-gray-500">No items found in this collection.</p>
                    </div>
                )}

                {items.map((item) => (
                    <Card key={item.id} className="group rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-[#eb4f27]/30">
                        <CardContent className="p-5 flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-lg mb-1">{item.fieldData?.name || item.fieldData?.title || 'Untitled Item'}</h3>
                                <div className="flex gap-4 text-sm items-center mt-3">
                                    <Select
                                        value={getItemStatus(item)}
                                        onValueChange={(val) => handleStatusChange(item.id, val)}
                                        disabled={updatingId === item.id}
                                    >
                                        <SelectTrigger
                                            className={`w-auto h-7 px-3 text-xs font-medium rounded-none border-0 transition-colors ${getItemStatus(item) === 'DRAFT' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' :
                                                getItemStatus(item) === 'STAGED' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                                    'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-1.5 mr-1">
                                                <div className={`w-1.5 h-1.5 rounded-full ${getItemStatus(item) === 'DRAFT' ? 'bg-gray-400' :
                                                    getItemStatus(item) === 'STAGED' ? 'bg-yellow-500' :
                                                        'bg-green-500'
                                                    }`} />
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DRAFT">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                    Draft
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="STAGED">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                                    Queued to Publish
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="PUBLISHED">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    Published
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <span className="text-gray-400 text-xs">
                                        Last edited {item.lastUpdated ? format(new Date(item.lastUpdated), 'MMM d, yyyy') : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-none border-gray-300 hover:bg-black hover:text-white"
                                    onClick={() => onEdit(item)}
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-none border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                    onClick={() => setDeletingId(item.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}


