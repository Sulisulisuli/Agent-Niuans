'use server'

import { createClient } from '@/utils/supabase/server'
import { WebflowClient } from '@/lib/webflow'
import { revalidatePath } from 'next/cache'
import { confirmAsset } from '@/utils/asset-utils'

export async function createWebflowPost(token: string, collectionId: string, formData: any) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        console.log('createWebflowPost: Starting', { collectionId, formData })

        // 2. Send to Webflow
        const webflow = new WebflowClient(token)
        const result = await webflow.createItem(collectionId, formData)


        console.log('createWebflowPost: Success', result)

        // Confirm assets
        await checkAndConfirmAssets(formData)

        revalidatePath('/posts')
        return { success: true, itemId: result.id }
    } catch (error: any) {
        console.error('createWebflowPost Error:', error)
        return { error: error.message || 'Failed to create post' }
    }
}

export async function updateWebflowItemStatus(token: string, collectionId: string, itemId: string, status: 'DRAFT' | 'STAGED' | 'PUBLISHED') {
    try {
        const client = new WebflowClient(token)

        if (status === 'DRAFT') {
            await client.updateItem(collectionId, itemId, {}, { isDraft: true })
        } else if (status === 'STAGED') {
            // isDraft: false means "Stage for publish", but DO NOT call publishItems
            await client.updateItem(collectionId, itemId, {}, { isDraft: false })
        } else if (status === 'PUBLISHED') {
            // First stage it (ensure isDraft is false)
            await client.updateItem(collectionId, itemId, {}, { isDraft: false })
            // Then publish to live
            await client.publishItems(collectionId, [itemId])
        }

        revalidatePath('/posts')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to update status' }
    }
}

export async function updateWebflowPost(token: string, collectionId: string, itemId: string, formData: any) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        console.log('updateWebflowPost: Starting', { collectionId, itemId, formData })

        const webflow = new WebflowClient(token)
        const result = await webflow.updateItem(collectionId, itemId, formData)

        console.log('updateWebflowPost: Success', result)

        // Confirm assets
        await checkAndConfirmAssets(formData)

        revalidatePath('/posts')
        return { success: true, itemId: result.id }

    } catch (error: any) {
        console.error('updateWebflowPost Error:', error)
        return { error: error.message || 'Failed to update post' }
    }
}

export async function getWebflowItems(token: string, collectionId: string) {
    if (!token || !collectionId) return { error: 'Missing configuration' }

    const client = new WebflowClient(token)
    try {
        const result = await client.getItems(collectionId)
        return { items: result.items }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function deleteWebflowItem(token: string, collectionId: string, itemId: string) {
    if (!token || !collectionId || !itemId) return { error: 'Missing configuration' }

    const client = new WebflowClient(token)
    try {
        await client.deleteItem(collectionId, itemId)
        revalidatePath('/posts')
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

async function checkAndConfirmAssets(formData: any) {
    try {
        // Iterate through all values in formData
        for (const key in formData) {
            const value = formData[key]
            if (typeof value === 'string' && value.includes('/post-images/')) {
                // Found a post image URL
                const parts = value.split('/post-images/')
                if (parts.length > 1) {
                    const path = parts[1] // e.g. "filename.png" or "user/filename.png"
                    await confirmAsset(decodeURIComponent(path), 'post-images')
                }
            }
        }
    } catch (e) {
        console.error('checkAndConfirmAssets Error:', e)
    }
}
