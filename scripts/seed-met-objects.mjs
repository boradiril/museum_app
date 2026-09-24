// MUSE Phase 3 — one-off seed script for the met_objects candidate pool.
// Not part of the deployed app; run manually, once, from the terminal:
//
//   node --env-file=.env.local scripts/seed-met-objects.mjs
//
// Fetches object IDs per department from the Met Collection API, fetches
// full details for a capped sample, filters for completeness, and upserts
// passing objects into met_objects via the service-role client (the
// table's RLS denies everyone else — see 0004_met_objects.sql).

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Run with: node --env-file=.env.local scripts/seed-met-objects.mjs",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const MET_API_BASE = "https://collectionapi.metmuseum.org/public/collection";

// Ground-floor, Great-Hall-adjacent departments (verified against the Met's
// own floor plan during Phase 3 planning).
const DEPARTMENTS = [
  { id: 10, name: "Egyptian Art" },
  { id: 17, name: "Medieval Art" },
  { id: 4, name: "Arms and Armor" },
];

const CAP_PER_DEPARTMENT = 400;

// Rate-limiting: a 150ms flat delay got the whole IP blocked by Incapsula
// (the Met API's WAF) after ~400 sequential requests. Bumped to 500ms with
// jitter, plus a longer pause every 50 requests, so the pattern looks less
// like a sustained mechanical burst. No guarantee this avoids another
// block — Incapsula's thresholds aren't public — but meaningfully reduces
// the risk versus a flat, fast delay.
const REQUEST_DELAY_MS = 500;
const REQUEST_DELAY_JITTER_MS = 100;
const BATCH_SIZE = 50;
const BATCH_PAUSE_MS = 8000;

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function delayWithJitter() {
  const jitter = Math.floor(Math.random() * REQUEST_DELAY_JITTER_MS);
  return delay(REQUEST_DELAY_MS + jitter);
}

function isComplete(obj) {
  return Boolean(
    obj.primaryImage &&
      obj.title &&
      (obj.medium || obj.objectDate || obj.culture) &&
      obj.creditLine &&
      obj.GalleryNumber,
  );
}

function toRow(obj, departmentId) {
  return {
    met_object_id: obj.objectID,
    department_id: departmentId,
    department: obj.department || null,
    object_name: obj.objectName || null,
    title: obj.title || null,
    artist_display_name: obj.artistDisplayName || null,
    artist_role: obj.artistRole || null,
    artist_display_bio: obj.artistDisplayBio || null,
    artist_nationality: obj.artistNationality || null,
    artist_ulan_url: obj.artistULAN_URL || null,
    culture: obj.culture || null,
    period: obj.period || null,
    dynasty: obj.dynasty || null,
    reign: obj.reign || null,
    portfolio: obj.portfolio || null,
    medium: obj.medium || null,
    object_date: obj.objectDate || null,
    credit_line: obj.creditLine || null,
    gallery_number: obj.GalleryNumber || null,
    city: obj.city || null,
    country: obj.country || null,
    region: obj.region || null,
    subregion: obj.subregion || null,
    locale: obj.locale || null,
    locus: obj.locus || null,
    excavation: obj.excavation || null,
    river: obj.river || null,
    classification: obj.classification || null,
    repository: obj.repository || null,
    primary_image_url: obj.primaryImage || null,
    primary_image_url_small: obj.primaryImageSmall || null,
    // Plain string array of tag terms only (not the full {term, AAT_URL,
    // Wikidata_URL} objects) — per explicit instruction, not our own call.
    tags:
      obj.tags && obj.tags.length
        ? obj.tags.map((t) => t.term).filter(Boolean)
        : null,
    is_highlight: Boolean(obj.isHighlight),
    object_url: obj.objectURL || null,
  };
}

async function fetchDepartmentObjectIds(departmentId) {
  // /search moves to v1.1 (v1/search retires 2026-10-01); /objects/{id} has
  // no v1.1 equivalent and stays on v1 — see seed-met-objects_test.mjs for
  // the full investigation. v1.1 defaults to limit=100 if not passed
  // explicitly (silently truncates despite `total` being correct), and
  // isOnView=true is essential — without it most department objects aren't
  // actually on display (confirmed: only 761/6,039 for Arms and Armor).
  const url = `${MET_API_BASE}/v1.1/search?departmentId=${departmentId}&hasImages=true&isOnView=true&q=a&limit=${CAP_PER_DEPARTMENT}`;
  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) {
    throw new Error(`Search failed for department ${departmentId}: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.objectIDs || [];
}

async function fetchObject(objectId) {
  const res = await fetch(`${MET_API_BASE}/v1/objects/${objectId}`, {
    headers: FETCH_HEADERS,
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

async function seedDepartment(department) {
  console.log(`\n=== ${department.name} (department ${department.id}) ===`);

  // Skip departments already seeded — avoids wasting requests re-fetching
  // data we have, which matters now that minimizing request volume is the
  // whole point (see the Incapsula block from the first run).
  const { count, error: countError } = await supabase
    .from("met_objects")
    .select("met_object_id", { count: "exact", head: true })
    .eq("department_id", department.id);

  if (countError) {
    throw new Error(`Count check failed for ${department.name}: ${countError.message}`);
  }

  if (count > 0) {
    console.log(`${department.name}: already has ${count} rows, skipping.`);
    return { inserted: 0 };
  }

  const allIds = await fetchDepartmentObjectIds(department.id);
  const candidateIds = allIds.slice(0, CAP_PER_DEPARTMENT);
  console.log(
    `Found ${allIds.length} objects with images; sampling first ${candidateIds.length}.`,
  );

  const rows = [];
  let skipped = 0;

  for (let i = 0; i < candidateIds.length; i++) {
    const objectId = candidateIds[i];

    try {
      const obj = await fetchObject(objectId);
      if (obj && isComplete(obj)) {
        rows.push(toRow(obj, department.id));
      } else {
        skipped++;
      }
    } catch (err) {
      console.warn(`  skipped ${objectId}: ${err.message}`);
      skipped++;
    }

    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(
        `  ...${i + 1}/${candidateIds.length} fetched — pausing ${BATCH_PAUSE_MS}ms`,
      );
      await delay(BATCH_PAUSE_MS);
    } else {
      await delayWithJitter();
    }
  }

  console.log(
    `${department.name}: ${rows.length} passed the completeness filter, ${skipped} skipped.`,
  );

  if (rows.length === 0) {
    return { inserted: 0 };
  }

  const { error } = await supabase
    .from("met_objects")
    .upsert(rows, { onConflict: "met_object_id" });

  if (error) {
    throw new Error(`Upsert failed for ${department.name}: ${error.message}`);
  }

  console.log(`${department.name}: upserted ${rows.length} rows.`);
  return { inserted: rows.length };
}

async function main() {
  let totalInserted = 0;

  for (const department of DEPARTMENTS) {
    const { inserted } = await seedDepartment(department);
    totalInserted += inserted;
  }

  console.log(`\n=== Done: ${totalInserted} objects seeded across ${DEPARTMENTS.length} departments ===`);
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
