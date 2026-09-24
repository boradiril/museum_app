// TEST COPY — dry run only. Fetches 3 objects per department and prints
// them; writes nothing to Supabase. Not part of the deployed app.
//
//   node --env-file=.env.local scripts/seed-met-objects_test.mjs
//
// Endpoint versions are intentionally mixed: /search moves to v1.1 (the Met
// is retiring v1/search on 2026-10-01 — see metmuseum.github.io); /objects/
// {id} has no v1.1 equivalent (confirmed: 404s under v1.1) and stays on v1.

const MET_API_BASE = "https://collectionapi.metmuseum.org/public/collection";

// Ground-floor, Great-Hall-adjacent departments (verified against the Met's
// own floor plan during Phase 3 planning).
const DEPARTMENTS = [
  // { id: 10, name: "Egyptian Art" }//,
  { id: 17, name: "Medieval Art" }//,
  // { id: 4, name: "Arms and Armor" },
];

const CAP_PER_DEPARTMENT = 1;
const REQUEST_DELAY_MS = 150;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  // v1.1/search defaults to limit=100 if not specified — confirmed live,
  // this silently truncates results even though `total` reports the true
  // count. Must pass limit explicitly or larger caps get silently capped
  // at 100 regardless of what we slice() client-side afterward.
  //
  // isOnView=true is essential, not optional — confirmed live that without
  // it, ~87% of Arms and Armor's imaged objects aren't currently displayed
  // (761 of 6,039). An in-museum audio guide can't send someone to look at
  // an object that isn't on view.
  const url = `${MET_API_BASE}/v1.1/search?departmentId=${departmentId}&hasImages=true&isOnView=true&q=a&limit=${CAP_PER_DEPARTMENT}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Search failed for department ${departmentId}: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.objectIDs || [];
}

async function fetchObject(objectId) {
  const res = await fetch(`${MET_API_BASE}/v1/objects/${objectId}`);
  if (!res.ok) {
    return null;
  }
  return res.json();
}

async function previewDepartment(department) {
  console.log(`\n=== ${department.name} (department ${department.id}) ===`);

  const allIds = await fetchDepartmentObjectIds(department.id);
  const candidateIds = allIds.slice(0, CAP_PER_DEPARTMENT);
  console.log(
    `Found ${allIds.length} objects with images (v1.1); previewing first ${candidateIds.length}.`,
  );

  for (const objectId of candidateIds) {
    const obj = await fetchObject(objectId);
    if (!obj) {
      console.log(`  ${objectId}: fetch failed`);
      continue;
    }

    const row = toRow(obj, department.id);
    console.log(`  passes completeness filter: ${isComplete(obj)}`);
    console.log(`  all raw fields from the API (${Object.keys(obj).length} total):`);
    console.log(JSON.stringify(obj, null, 2));
    console.log("  mapped to our met_objects row shape:");
    console.log(JSON.stringify(row, null, 2));

    await delay(REQUEST_DELAY_MS);
  }
}

async function main() {
  for (const department of DEPARTMENTS) {
    await previewDepartment(department);
  }

  console.log(`\n=== Preview done — nothing written to Supabase ===`);
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
