# Item 2 — Real interest-combination tests for `/api/curate`

**Date:** 2026-10-03
**Runner:** `tests/run-curation-tests.mjs` (raw outputs in `tests/results/`)
**Branch:** `Phase4.0`, dev server (`npm run dev`), real Claude call (`claude-sonnet-5`), real Supabase.
**Runs:** 4 full passes of the 3 combinations (12 curation requests in total).

## Test inputs

| ID | Interests | Time | Pace | Group | Free text |
|---|---|---|---|---|---|
| A | Animals in Art | 120 min | highlights | solo | — |
| B | Arms & Weapons, Armor & Shields | 180 min | go_deep | couple | — |
| C | Sacred & Religious Art, Royalty & Power | 90 min | highlights | family | "I love medieval kings and saints" |

## Outputs

| ID | Run 1 | Run 2 | Run 3 | Run 4 | Elapsed (s) | Stops per 120/180/90 min |
|---|---|---|---|---|---|---|
| A | **HTTP 502** (empty itinerary) | 200, 10 stops | 200, 10 stops | 200, 13 stops | 5.6–6.7 | 9–12 min per stop |
| B | 200, 13 stops | 200, 13 stops | 200, 16 stops | 200, 15 stops | 6.6–8.0 | 11–14 min per stop |
| C | 200, 8 stops | 200, 10 stops | 200, 7 stops | 200, 8 stops | 5.4–6.2 | 9–13 min per stop |

Each saved stop was also read back from the database (position, object id, title, artist, gallery, matched interest).

## Findings

### Passed
- **Interest validity:** all 123 saved stops have a `matched_interest` that is one of the visitor's selected chips. The enum constraint and the post-validation filter held in every run.
- **No duplicate objects:** no `met_object_id` appears twice within one itinerary.
- **Relevance (A):** all 13 stops in run 4 are genuinely animal-themed (lion, hippopotamus, baboon, cat, griffin, panther, a rabbit-shaped helmet, a lion's-head sallet), with a couple of weaker picks (a cow's head, a Bes column).
- **Relevance (B):** the stops match the two selected categories well. Both categories are represented, and the mix of cannons, swords, cuirasses, and helmets fits "arms and armor."
- **Speed:** requests took 5.4–8.0 seconds. That is over the under-5-seconds target in the scaling notes, so either the target needs revisiting or the curation call needs to get faster.
- **Free-text effect (C):** the free text ("medieval kings and saints") is visible. Kings and saints appear, though only one saint stop surfaced.

### Problems
1. **Intermittent failure (A, run 1).** One of 4 runs for combination A returned HTTP 502 "Claude returned an empty itinerary." The other 3 runs for A, and all runs for B and C, passed. I didn't capture the raw Claude output for the failure, so the cause is still unknown. A temporary debug log was added to the route (`TEMP-DEBUG`, uncommitted) to capture it if it recurs. Remove it, or keep it as a deliberate diagnostic.
2. **Pace and time are not respected.** Stop counts barely change with the time budget or the pace setting:
   - B asked for `go_deep` (CLAUDE.md §3.2 and the prompt say 25–35 minutes per stop, so roughly 5–7 stops over 180 minutes). It returned 13–16 stops, about 11–14 minutes each. That's a clear miss.
   - A (120 min, highlights, expected 12–18 min per stop, so roughly 7–10 stops) returned 10–13 stops.
   - C (90 min, highlights) returned 7–10 stops, which is in range.
   The prompt's pacing guidance is being loosely followed at best.
3. **Repeated titles.** Combination C returned three different objects titled "Head of a King" (IDs 466822, 468090, 468219) back to back. They are real, distinct pieces, but the repetition looks like a bug to a visitor. Deduplicating by title or spreading out similar titles would help.
4. **Free-text coverage is thin.** For "kings and saints," the free text mostly reinforced the chips. Only one saint-specific stop appeared (Saint Michael and a Donor), and the Royalty & Power stops were mostly heads of kings. This matches the known limitation that free text can only reorder within the chip-filtered set.

### Not a problem
- The three "Head of a King" stops are distinct objects, not duplicate database rows (see problem 3).
- The test runner removed all itineraries and visitors it created. Nothing was left in the database.

## Open items
- Decide what to do about the pacing miss (problem 2). It's most likely a prompt-engineering issue: the model needs an explicit stop-count target, not just a per-stop duration.
- Investigate problem 1 with the temporary debug log in place, and remove or keep the log once the cause is known.
- Decide whether 5–8 second curation latency is acceptable. The target is under 5 seconds, so the current results miss it.
