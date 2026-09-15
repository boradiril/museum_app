import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Temporary debug route (Phase 2 verification, same spirit as Phase 1's
 * /api/health) — shows your current session's identity so the Anonymous
 * Auth bootstrap (src/proxy.ts) can be confirmed by reloading a page,
 * without needing DevTools or curl. Delete before Phase 4/5, same as
 * /api/health.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { signedIn: false, error: error?.message ?? "no session" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    signedIn: true,
    userId: user.id,
    isAnonymous: user.is_anonymous ?? false,
    email: user.email || null,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at,
  });
}
