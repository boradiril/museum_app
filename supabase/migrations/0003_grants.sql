-- MUSE Phase 2 — table-level grants (companion to 0002_rls_policies.sql)
--
-- These GRANTs are deliberately broad — Supabase's convention is that RLS
-- policies (0002), not table-level GRANTs, are the real access-control
-- boundary. Granting insert/update here does NOT reopen anything: without a
-- matching RLS policy, the operation is still denied at the row level. This
-- is why purchases can safely get insert/update grants below even though
-- 0002 intentionally has no insert/update *policy* for it (purchases stay
-- writable only by the service-role client, which bypasses both layers).

-- service_role bypasses RLS but, like anon/authenticated, still needs its
-- own table-level GRANTs — discovered missing during Phase 2 verification
-- (a service-role query returned "permission denied," not just empty rows).
grant select, insert, update, delete on public.profiles to anon, authenticated, service_role;
grant select, insert, update, delete on public.itineraries to anon, authenticated, service_role;
grant select, insert, update, delete on public.stops to anon, authenticated, service_role;
grant select, insert, update, delete on public.purchases to anon, authenticated, service_role;
