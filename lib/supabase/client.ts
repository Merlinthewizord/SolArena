import { createBrowserClient as createSupabaseClient } from "@supabase/ssr"

// Create single instance at module load
const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Export the singleton instance
export { supabase }

// Keep factory function for backward compatibility, but return singleton
export const createBrowserClient = () => supabase
export const createClient = () => supabase

export default supabase
