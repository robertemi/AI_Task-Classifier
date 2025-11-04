import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY as string

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
        '⚠️ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.'
    )
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
