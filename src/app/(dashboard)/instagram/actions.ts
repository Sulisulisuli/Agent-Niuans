'use server'

import { createClient } from '@/utils/supabase/server'

// UI Wrapper actions for Instagram if needed (e.g. fetching profiles)
// Currently mostly handled in the main server action above or direct component logic.
export async function getInstagramProfile() {
    return { error: "Not implemented" }
}
