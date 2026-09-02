import { NextResponse } from "next/server";

/**
 * Phase 1 connectivity check. Confirms env vars are wired and that the
 * Supabase project responds. Does NOT touch any tables (none exist until
 * Phase 2), so it works against a brand-new project.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(url),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnon,
    SUPABASE_SERVICE_ROLE_KEY: hasServiceRole,
  };

  if (!url || !hasAnon) {
    return NextResponse.json(
      { ok: false, env, supabase: "unconfigured" },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      cache: "no-store",
    });
    return NextResponse.json({
      ok: res.ok,
      env,
      supabase: res.ok ? "reachable" : `error ${res.status}`,
    });
  } catch {
    return NextResponse.json(
      { ok: false, env, supabase: "unreachable" },
      { status: 502 },
    );
  }
}
