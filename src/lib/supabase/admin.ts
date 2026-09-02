import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client (§5.1) — BYPASSES Row Level Security.
 *
 * The `server-only` import above makes the build fail if this module is ever
 * imported into a Client Component, so the service role key can never leak to
 * the browser. Use only inside Route Handlers / server code for privileged
 * operations (e.g. re-pointing guest rows to a new user_id, §5.3).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
