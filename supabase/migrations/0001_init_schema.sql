-- MUSE Phase 2 — core schema (CLAUDE.md §5.2)
-- Guest identity = Supabase Anonymous Auth (§5.3), so every itinerary/purchase
-- has a real auth.users row and user_id is NEVER NULL, guest or not.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
-- No row is created here for anonymous users — only on real account creation
-- (Phase 6, identity link). A missing profiles row is the normal guest state.

create table itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  unlocked_at timestamptz, -- set when payment succeeds (Phase 5)
  created_at timestamptz not null default now()
);

create table stops (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries (id) on delete cascade,
  met_object_id integer not null,
  position integer not null,
  matched_interest text,
  title text,
  artist text,
  image_url text,
  gallery_location text,
  visited_at timestamptz, -- lets a resumed session skip already-seen stops
  created_at timestamptz not null default now()
);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_session_id text,
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  receipt_email text, -- powers "Restore purchase via email" (§3.8/§3.9)
  created_at timestamptz not null default now()
);

create index itineraries_user_id_idx on itineraries (user_id);
create index stops_itinerary_id_idx on stops (itinerary_id);
create index purchases_itinerary_id_idx on purchases (itinerary_id);
create index purchases_user_id_idx on purchases (user_id);
create index purchases_receipt_email_idx on purchases (receipt_email);
