-- MUSE — one stop per Met object per itinerary.
-- The app already removes repeats before insert (src/app/api/curate/route.ts);
-- this makes the database enforce it too.

alter table stops
  add constraint stops_itinerary_met_object_unique unique (itinerary_id, met_object_id);
