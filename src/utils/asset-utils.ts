import { createClient } from '@/utils/supabase/server'

export async function trackAsset(storagePath: string, bucketId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error('trackAsset: No user found')
        return
    }

    const { error } = await supabase
        .from('asset_tracker')
        .insert({
            storage_path: storagePath,
            bucket_id: bucketId,
            user_id: user.id,
            is_confirmed: false
        })

    if (error) {
        console.error('trackAsset Error:', error)
    } else {
        console.log(`[trackAsset] Tracked ${bucketId}/${storagePath}`)
    }
}

export async function confirmAsset(storagePath: string, bucketId: string) {
    // NOTE: storagePath usually comes as "USER_ID/FILENAME.ext"
    // We should match it exactly.

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
        .from('asset_tracker')
        .update({ is_confirmed: true })
        .eq('storage_path', storagePath)
        .eq('bucket_id', bucketId)
        .eq('user_id', user.id)

    if (error) {
        console.error('confirmAsset Error:', error)
    } else {
        console.log(`[confirmAsset] Confirmed ${bucketId}/${storagePath}`)
    }
}

export async function cleanupExpiredAssets() {
    const supabase = await createClient()

    // 1. Fetch expired, unconfirmed assets
    const { data: expiredAssets, error } = await supabase
        .from('asset_tracker')
        .select('*')
        .eq('is_confirmed', false)
        .lt('expires_at', new Date().toISOString())
        .limit(50) // Process in chunks

    if (error) {
        console.error('cleanupExpiredAssets Fetch Error:', error)
        return { error: error.message }
    }

    if (!expiredAssets || expiredAssets.length === 0) {
        return { message: 'No expired assets found' }
    }

    console.log(`[cleanupExpiredAssets] Found ${expiredAssets.length} expired assets`)

    const results = []

    for (const asset of expiredAssets) {
        // 2. Delete from Storage
        const { error: storageError } = await supabase
            .storage
            .from(asset.bucket_id)
            .remove([asset.storage_path])

        if (storageError) {
            console.error(`Failed to delete ${asset.storage_path} from storage:`, storageError)
            results.push({ id: asset.id, status: 'failed_storage', error: storageError.message })
            continue
        }

        // 3. Delete from Tracker
        const { error: dbError } = await supabase
            .from('asset_tracker')
            .delete()
            .eq('id', asset.id)

        if (dbError) {
            console.error(`Failed to delete tracker record ${asset.id}:`, dbError)
            results.push({ id: asset.id, status: 'failed_db', error: dbError.message })
        } else {
            results.push({ id: asset.id, status: 'deleted' })
        }
    }

    return { results }
}

export async function deleteAsset(storagePath: string, bucketId: string) {
    const supabase = await createClient()

    // 1. Delete from Storage
    const { error: storageError } = await supabase
        .storage
        .from(bucketId)
        .remove([storagePath])

    if (storageError) {
        console.error(`[deleteAsset] Storage error for ${storagePath}:`, storageError)
    }

    // 2. Delete from Tracker
    const { error: dbError } = await supabase
        .from('asset_tracker')
        .delete()
        .eq('storage_path', storagePath)
        .eq('bucket_id', bucketId)

    if (dbError) {
        console.error(`[deleteAsset] DB error for ${storagePath}:`, dbError)
    } else {
        console.log(`[deleteAsset] Deleted ${bucketId}/${storagePath}`)
    }
}
