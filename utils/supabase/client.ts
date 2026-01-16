import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in browser-based components.
 * * This client is "anonymous" and does not handle user authentication. It's suitable
 * for fetching public data from your database.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
