-- MUSE Phase 3 — drop additional_images from met_objects (decided unneeded
-- for now; primary_image_url / primary_image_url_small cover display needs).

alter table met_objects drop column additional_images;
