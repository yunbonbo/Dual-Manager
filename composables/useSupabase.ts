import { createClient } from "@supabase/supabase-js"

export function useSupabase() {
  const config = useRuntimeConfig()
  const url = config.public?.supabaseUrl || ""
  const anonKey = config.public?.supabaseAnonKey || ""

  if (!url || !anonKey) {
    console.warn(
      "[Dual-Manager] Supabase の URL または anon key が設定されていません。"
    )
    return { supabase: null }
  }

  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })

  return { supabase }
}
