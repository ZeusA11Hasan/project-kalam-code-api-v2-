import { Database } from "@/supabase/types"
import { createBrowserClient } from "@supabase/ssr"

// Use placeholder values if Supabase is not configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseKey
)

