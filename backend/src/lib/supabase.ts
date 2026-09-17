import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

function createSupabaseAdmin() {
  if (!env.supabaseUrl || !env.supabaseSecretKey) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env',
    )
  }

  return createClient(env.supabaseUrl, env.supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const supabaseAdmin = createSupabaseAdmin()
