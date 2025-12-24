import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error("Missing Supabase environment variables for admin client")
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function recordAuditLog(params: {
  action: string
  actorWallet: string
  targetType: string
  targetId: string
  payload?: any
}) {
  const { data, error } = await supabaseAdmin.from("admin_audit_log").insert({
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
