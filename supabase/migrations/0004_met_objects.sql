-- MUSE Phase 3 — cached candidate pool of Met Collection API objects (CLAUDE.md §5.4)
-- Ground-floor, Great-Hall-adjacent departments for the demo: Egyptian Art (10),
-- Medieval Art (17), Arms and Armor (4).
--
-- Consolidated into one file (schema + RLS + grants) rather than split like
-- Phase 2's 0001/0002/0003 — there's only one table and no real policies to
-- write (deny-all), so the extra file boundaries would be ceremony without
-- benefit here.

create table met_objects (
  met_object_id integer primary key,
  department_id integer not null,
  title text,
  artist_display_name text,
  culture text,
  medium text,
  object_date text,
  credit_line text,
  gallery_number text,
  primary_image_url text,
  additional_images jsonb,
  tags jsonb,
  is_highlight boolean not null default false,
  object_url text,
  cached_at timestamptz not null default now()
);

create index met_objects_department_id_idx on met_objects (department_id);
create index met_objects_gallery_number_idx on met_objects (gallery_number);

-- Deny-all RLS: the client never queries this table directly, only through
-- /api/met (server-side, service-role client) per §5.4's proxy design. No
-- insert/select/update/delete policy exists for anon/authenticated on
-- purpose — same reasoning as purchases in 0002_rls_policies.sql.
alter table met_objects enable row level security;

-- Same broad-GRANT + narrow-RLS pattern as the rest of the schema (0003) —
-- service_role needs this to seed/read the table; anon/authenticated get
-- the grant too for consistency, but RLS blocks them regardless since no
-- policy exists for either role.
grant select, insert, update, delete on public.met_objects to anon, authenticated, service_role;
