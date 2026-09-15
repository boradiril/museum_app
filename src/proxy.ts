import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Guest identity bootstrap (CLAUDE.md §5.3). Runs on every matched request:
 * refreshes an existing Supabase session, or creates an anonymous one on
 * first visit — so every page render, Server Component, and API call
 * already has a valid auth.uid() with zero login screen involved.
 *
 * Mutating `request.cookies` (not just `response.cookies`) before rebuilding
 * `response` is what makes a brand-new anonymous session visible to
 * downstream Server Components within this same request, not just the next
 * one — otherwise a first-time visitor's first render would still see no
 * user.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() (not getSession()) — it revalidates against Supabase's Auth
  // server instead of trusting the local cookie, which matters in
  // server-side code per Supabase's own guidance.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await supabase.auth.signInAnonymously();
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
