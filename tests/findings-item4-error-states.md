# Item 4 — Error states

**Date:** 2026-10-04
**Scope:** API error responses for `/api/curate`, and how the interests page shows errors.

## API responses (checked live against the dev server)

| Case | Request | Response |
|---|---|---|
| No interests | `interests: []` | 400 "interests must be a non-empty array." |
| Invalid chip | `interests: ["Food"]` | 400, lists the nine valid chips |
| Time too high | `timeMinutes: 9999` | 400 "timeMinutes must be a positive number (max 600)." |
| Time missing | no `timeMinutes` | 400, same message |
| Body not JSON | `not json` | 400 "Request body must be valid JSON." (was: raw parser text, fixed) |
| No session cookie | valid body, no cookie | 200, itinerary created (see note) |

**Note on "no session cookie":** `src/proxy.ts` gives every first-time visitor an anonymous session on their first request, so the route's 401 "No session found" branch is effectively unreachable. The test's itinerary was deleted afterward.

## Interests page (checked by reading the code; browser check done by the user)

| Case | Expected | Result |
|---|---|---|
| Nothing selected, click "Build my tour" | "Pick at least one interest…" | Message shown, but **below the fold** — fixed (see Changes) |
| Server unreachable | "Couldn't reach the server…" | Message shown, but **below the fold** — fixed (see Changes) |
| Server returns a non-JSON error | Generic server-error message | Previously showed "Couldn't reach the server" — fixed |

## Changes made

1. **Error message moved into the fixed footer**, directly above the "Build my tour" button, with `role="alert"`, so it's visible without scrolling.
2. **Server-error handling:** a failed response with no JSON body now shows "Something went wrong on our side. Please try again." instead of "Couldn't reach the server."
3. **Invalid JSON** now returns the fixed message "Request body must be valid JSON."

## Known gap (not an error-state bug, but related)

- **Selections are lost on reload or server restart.** Choices live in the page's memory, so a reload resets the time, chips, and panel. CLAUDE.md §3.2 says the Back/Edit path must restore prior selections; that isn't built yet. Decide whether to persist selections (e.g., `sessionStorage`) before the Edit path on the itinerary screen is wired.

## Still open

- Server-error copy on the itinerary page's Back/Edit path is not yet tested.
- The 502 "Claude returned an empty itinerary." message is passed through to the user as-is, because the front end shows any error the server sends. That wording is developer-facing. Consider a friendlier message, but the root cause is still unknown (see CLAUDE.md §7).
