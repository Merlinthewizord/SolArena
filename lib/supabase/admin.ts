import { createClient } from "@supabase/supabase-js"

let supabaseAdmin: ReturnType<typeof createClient> | null = null
let loggedMissingEnv = false

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRole) {
    if (!loggedMissingEnv) {
      console.error("Missing Supabase environment variables for admin client")
      loggedMissingEnv = true
    }
    return null
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return supabaseAdmin
}

export { getSupabaseAdmin as supabaseAdmin }

export async function recordAuditLog(params: {
  action: string
  actorWallet: string
  targetType: string
  targetId: string
  payload?: any
}) {
  const client = getSupabaseAdmin()
  if (!client) {
    return { data: null, error: new Error("Supabase admin client is not configured.") }
  }

  const { data, error } = await client.from("admin_audit_log").insert({
    action: params.action,
    actor_wallet: params.actorWallet,
    target_type: params.targetType,
    target_id: params.targetId,
    payload: params.payload || {},
  })

  if (error) {
    console.error("[Audit Log] Error recording:", error)
  }

  return { data, error }
}
