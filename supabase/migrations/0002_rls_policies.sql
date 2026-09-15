-- MUSE Phase 2 — Row Level Security policies (CLAUDE.md §5.2)
-- Guest identity = Supabase Anonymous Auth, so every session (guest or real
-- account) carries Postgres role `authenticated` and a stable auth.uid().
-- RLS is therefore uniform for guests and signed-in users — no separate
-- guest-vs-real branch anywhere below.

alter table profiles enable row level security;
alter table itineraries enable row level security;
alter table stops enable row level security;
alter table purchases enable row level security;

-- profiles: a signed-in user can read/create/update only their own row.
-- No delete policy — account deletion isn't a designed flow yet.
create policy "profiles_select_own" on profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- itineraries: owner (guest or real) can read/create/update their own rows.
-- No delete policy — no spec'd deletion flow; least privilege by default.
create policy "itineraries_select_own" on itineraries
  for select to authenticated
  using (auth.uid() = user_id);

create policy "itineraries_insert_own" on itineraries
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "itineraries_update_own" on itineraries
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- stops: ownership flows through the parent itinerary. No insert policy —
-- stops are written by the curation endpoint (Phase 4) using the
-- service-role client, which bypasses RLS entirely and doesn't need one.
create policy "stops_select_via_itinerary" on stops
  for select to authenticated
  using (
    exists (
      select 1 from itineraries
      where itineraries.id = stops.itinerary_id
        and itineraries.user_id = auth.uid()
    )
  );

create policy "stops_update_via_itinerary" on stops
  for update to authenticated
  using (
    exists (
      select 1 from itineraries
      where itineraries.id = stops.itinerary_id
        and itineraries.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from itineraries
      where itineraries.id = stops.itinerary_id
        and itineraries.user_id = auth.uid()
    )
  );

-- purchases: READ-ONLY from the client, deliberately. All writes (creating a
-- purchase row, marking it "succeeded") happen server-side via the Stripe
-- webhook handler using the service-role client (§5.4). Granting the client
-- any insert/update policy here — even one scoped to auth.uid() = user_id —
-- would let a user set their own purchase to "succeeded" without ever
-- paying. The absence of those policies below is intentional, not an
-- oversight.
create policy "purchases_select_own" on purchases
  for select to authenticated
  using (auth.uid() = user_id);
