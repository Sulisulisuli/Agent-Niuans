'use server'

import { createClient } from '@/utils/supabase/server'

export async function uploadImage(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        return { error: 'Only images are allowed' }
    }

    // Generate unique path
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    const { error: uploadError } = await supabase
        .storage
        .from('template-assets')
        .upload(filePath, file)

    if (uploadError) {
        console.error('Upload Error:', uploadError)
        return { error: uploadError.message }
    }

    const { data: { publicUrl } } = supabase
        .storage
        .from('template-assets')
        .getPublicUrl(filePath)

    return { publicUrl }
}
