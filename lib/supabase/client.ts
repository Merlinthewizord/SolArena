import { createBrowserClient as createSupabaseClient } from "@supabase/ssr"

type BrowserClient = ReturnType<typeof createSupabaseClient>

let supabase: BrowserClient | null = null
let loggedMissingEnv = false

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!loggedMissingEnv) {
      console.error(
        "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Supabase features are disabled.",
      )
      loggedMissingEnv = true
    }
    return null
  }

  return { supabaseUrl, supabaseAnonKey }
}

export function getSupabaseBrowserClient(): BrowserClient | null {
  const env = getSupabaseEnv()
  if (!env) return null

  if (!supabase) {
    supabase = createSupabaseClient(env.supabaseUrl, env.supabaseAnonKey)
  }

  return supabase
}

// Export legacy helpers
export const supabaseClient = getSupabaseBrowserClient()
export const supabase = supabaseClient
export const createBrowserClient = () => getSupabaseBrowserClient()
export const createClient = () => getSupabaseBrowserClient()

export default supabase
