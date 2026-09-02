import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client (§5.1).
 * Uses the public anon key — safe to ship to the browser. Access control is
 * enforced by Row Level Security policies in Postgres, NOT by hiding this key.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
