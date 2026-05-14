import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS. Only use in server-side cron routes,
// never in user-facing API routes or client-side code.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL not set')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
