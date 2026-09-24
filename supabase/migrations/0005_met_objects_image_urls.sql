-- MUSE Phase 3 — expand met_objects with the additional raw Met API fields
-- identified during data investigation (data_investigation/Medieval Art/).
--
-- Supersedes the original plan to rename primary_image_url -> image_url:
-- 0004's original primary_image_url column already matches the naming
-- settled on here (full-resolution primaryImage), so no rename is needed —
-- only a new primary_image_url_small column plus the fields below.

alter table met_objects add column primary_image_url_small text;

alter table met_objects add column department text;
alter table met_objects add column object_name text;
alter table met_objects add column period text;
alter table met_objects add column dynasty text;
alter table met_objects add column reign text;
alter table met_objects add column portfolio text;
alter table met_objects add column artist_role text;
alter table met_objects add column artist_display_bio text;
alter table met_objects add column artist_nationality text;
alter table met_objects add column artist_ulan_url text;
alter table met_objects add column city text;
alter table met_objects add column country text;
alter table met_objects add column region text;
alter table met_objects add column subregion text;
alter table met_objects add column locale text;
alter table met_objects add column locus text;
alter table met_objects add column excavation text;
alter table met_objects add column river text;
alter table met_objects add column classification text;
alter table met_objects add column repository text;
