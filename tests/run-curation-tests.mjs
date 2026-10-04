// Item 2 — real interest-combination tests for /api/curate.
// Run with the dev server up (npm run dev in another terminal):
//
//   node --env-file=.env.local tests/run-curation-tests.mjs
//
// Creates a temporary visitor session, sends each combination through the
// real endpoint, pulls the saved stops back from the database, writes the
// raw inputs/outputs to tests/results/, then deletes the test itineraries
// and visitor. Findings are written up separately in tests/findings.md.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPA_URL || !SERVICE_KEY) {
  console.error("Missing Supabase env vars. Run with --env-file=.env.local");
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(here, "results");

const COMBINATIONS = [
  {
    id: "A-single-interest",
    description: "One interest alone, short visit, highlights pace",
    input: {
      timeMinutes: 120,
      interests: ["Animals in Art"],
      pace: "highlights",
      groupType: "solo",
    },
  },
  {
    id: "B-two-non-overlapping",
    description: "Two non-overlapping interests (weapons + armor), longer visit, go-deep pace, couple",
    input: {
      timeMinutes: 180,
      interests: ["Arms & Weapons", "Armor & Shields"],
      pace: "go_deep",
      groupType: "couple",
    },
  },
  {
    id: "C-mix-with-free-text",
    description: "Two interests plus a free-text note; short visit, family group",
    input: {
      timeMinutes: 90,
      interests: ["Sacred & Religious Art", "Royalty & Power"],
      pace: "highlights",
      groupType: "family",
      freeText: "I love medieval kings and saints",
    },
  },
];

async function getSessionCookie() {
  const res = await fetch(`${BASE}/api/whoami`);
  const body = await res.json();
  const cookies = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  return { cookie: cookies, userId: body.userId };
}

async function curate(cookie, input) {
  const res = await fetch(`${BASE}/api/curate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(input),
  });
  return { status: res.status, body: await res.json() };
}

async function supa(pathAndQuery, init = {}) {
  const res = await fetch(`${SUPA_URL}${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Supabase ${res.status} on ${pathAndQuery}: ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

async function fetchStops(itineraryId) {
  return supa(
    `/rest/v1/stops?select=position,met_object_id,title,artist,matched_interest,gallery_location&itinerary_id=eq.${itineraryId}&order=position`,
  );
}

async function main() {
  const session = await getSessionCookie();
  const runs = [];

  for (const combo of COMBINATIONS) {
    const started = Date.now();
    const { status, body } = await curate(session.cookie, combo.input);
    const elapsedMs = Date.now() - started;

    const run = {
      id: combo.id,
      description: combo.description,
      input: combo.input,
      httpStatus: status,
      response: body,
      elapsedMs,
      stops: null,
    };

    if (status === 200 && body.itineraryId) {
      run.stops = await fetchStops(body.itineraryId);
    }
    runs.push(run);
    console.log(`${combo.id}: HTTP ${status}, ${elapsedMs} ms, ${run.stops?.length ?? 0} stops saved`);
  }

  await mkdir(resultsDir, { recursive: true });
  const outFile = path.join(resultsDir, `curation-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await writeFile(outFile, JSON.stringify({ visitor: session.userId, runs }, null, 2));
  console.log(`Results written to ${path.relative(process.cwd(), outFile)}`);

  for (const run of runs) {
    if (run.response?.itineraryId) {
      await supa(`/rest/v1/itineraries?id=eq.${run.response.itineraryId}`, { method: "DELETE" });
    }
  }
  await supa(`/auth/v1/admin/users/${session.userId}`, { method: "DELETE" });
  console.log("Test itineraries and visitor deleted.");
}

main().catch((err) => {
  console.error("Test run failed:", err);
  process.exit(1);
});
