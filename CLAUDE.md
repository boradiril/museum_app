# MUSE — Project Spec & Planning Document

*Consolidated from design/planning conversation. Use this as the shared source of truth across chats, and as `CLAUDE.md` for Claude Code sessions.*

---

## 1. Product Definition

**One-sentence definition:**
> An AI-curated audio guide that turns any museum visit into a personal tour matched to your time and your interests — no planning required.

**Tagline variant (marketing/emotional hook):**
> A personal museum curator in your pocket — built for travelers who have three hours, not three days.

**Primary persona:** A time-constrained tourist (e.g., 3 hours at the Met during a multi-day NYC trip) who wants a meaningful visit without the burden of planning it themselves. Secondary persona: seasoned museum-goers who plan travel around museum visits but still face the same time/attention/stamina constraints.

**Core value prop vs. alternatives:**
- vs. a standard museum audio guide → *personalized*, not generic
- vs. asking ChatGPT about artifacts on the spot → *trustworthy*, sourced from the museum's own collection data, not LLM-hallucinated facts
- vs. self-planning from a website → *zero planning effort required*

**Non-negotiable trust anchor:** AI is used only for *curation/matching*, never for generating facts. All artifact content is sourced from the museum's own API/collection data.

---

## 2. Core Design Principles (established through iteration — don't relitigate these)

1. **Login/account creation is deferred as long as possible.** Interests + time capture and the itinerary reveal happen with zero login. Account creation is offered *after* payment succeeds, framed as optional ("save this tour"), never a gate.
2. **Payment works via guest checkout** (Apple Pay / Google Pay led, card + PayPal secondary), tied to a session/device token + email receipt — not an account.
3. **Progress steppers belong only on input screens**, never on result/hub screens like the itinerary page. The stepper should disappear once the user reaches the itinerary — it's a destination, not a step.
4. **Optional sections use progressive disclosure**, not multiple stacked forms. Pace, group type, "beyond art" interests, free-text personalization, and must-see search are consolidated into one collapsible "Tell us more about you — optional" panel, not separate collapsibles.
5. **Visual weight signals stakes.** High-stakes actions (payment) get bold filled CTAs, longer option lists, no easy dismiss. Low-stakes/optional actions (account prompt) get lighter buttons, prominent skip, tap-outside-to-dismiss.
6. **Bottom sheets over full-screen navigation** for anything that should feel like "one small thing layered on top of what you're already looking at" (payment, account prompt) — blur + dim the background screen in place; don't navigate away from it.
7. **Full navigation (not a sheet)** is reserved for genuine mode changes — e.g., tapping "Begin tour" to enter in-museum navigation.
8. **Never leak the paid product for free.** The itinerary preview shows only 3 of N stops in full detail (one per selected interest category, not arbitrary order), with the rest shown only as a locked count. No editing (remove/add/reorder) is allowed pre-payment — editing controls are a deliberate post-payment action, tucked behind a `•••` menu, not always-visible.
9. **Guest sessions must be fully functional**, with "Restore purchase via email" as the safety net for device switches / reinstalls / cache clears.
10. **Every optional or ambiguous state needs an explicit design**, not a fallback assumption — e.g., location denied, no glasses found, permission not yet granted. These are common paths for this persona, not edge cases.

---

## 3. Screen-by-Screen UX Spec

### 3.1 Landing / "Where are you exploring?"
- **Location granted + strong match:** leads with a confirmation card ("Looks like you're at The Met — Start here?") as the dominant one-tap action.
- **Location denied / no strong match:** search field promoted to top; "Popular in [city]" list sourced from IP-level city detection if available, generic "Popular museums" if not; small "Enable location for nearby suggestions" link, non-intrusive.
- **Location ambiguous** (multiple museums nearby): top card becomes a short list instead of one confirmation.
- Include a quiet "Not in [city]? Change" correction affordance next to any inferred city label — IP geolocation is frequently wrong (VPNs, carrier NAT, international roaming, private relay).

### 3.2 Step 1 — Interests + Time
- **Default/collapsed view:** time slider + "What draws you in?" interest chips only. Single CTA: "Build my tour."
- **Optional expandable panel** ("Tell us more about you — optional," with subtext "Pace, group size, and your interests beyond art"): contains pace toggle (Highlights / Go deep, defaults to Highlights), who's-visiting chips (Solo/Couple/Family/Group, defaults to Solo), "beyond art" life-interest chips (Food, Nature, Travel, Mythology, Fashion, etc.), a free-text field ("Anything else? e.g. I'm a chef, I love sci-fi..."), and must-see-artwork search — all consolidated into one panel, not separate collapsibles.
- Expansion behavior: whole-page scroll (no nested scroll container), sticky/anchored CTA button so it's always reachable, small auto-scroll to bring newly revealed content into view on expand.
- Free-text input is a real personalization signal for the LLM but carries real risk (prompt injection, moderation) — treat it as one signal among several, never something that overrides core curation logic; apply length limits and basic moderation before it reaches the LLM prompt.
- Back/"Edit" navigation from the itinerary screen returns here with prior selections preserved, not blank.

### 3.3 Itinerary Screen (locked preview, pre-payment)
- Header: "Edit" label next to back arrow (not a bare ambiguous arrow) — signals "adjust my inputs," not "abandon."
- Route/map thumbnail, "N stops · Xh Ym" + "Fits your [time]" badge.
- **Preview: first 3 stops shown in full** (name, artist/location, "Matches: [interest]" tag) — selected to cover breadth (one stop per selected interest category, not first-in-route-order), proving the AI listened to all inputs.
- **Remaining stops: locked teaser only** — "N more stops / Unlocked with your tour," no names or gallery locations revealed (this is a real anti-leak requirement: full stop details are enough for someone to self-navigate without paying for the actual paid product — audio + AR).
- **No editing controls in this state** — no drag handles, no remove (X), no "add another stop." Editing pre-payment was found to create an exploit (repeatedly removing stops could cycle through and reveal the full locked list) — resolved by removing all pre-payment editing entirely.
- Single CTA: "Start tour" → triggers payment sheet.

### 3.4 Payment (bottom sheet, blurred backdrop)
- Itinerary screen dims + blurs in place (does not navigate away) on "Start tour" tap.
- Sheet slides up: "Unlock your audio tour," stop count/time, price, Apple Pay/Google Pay led (bold, dominant), card + PayPal secondary (below a divider), reassurance line ("No account needed. Receipt sent to your email.").
- No tap-outside-to-dismiss — require explicit cancel (protects an in-progress transaction from accidental loss).
- On success: sheet content transforms in place (Smart Animate on internal content, not a new sheet) to a checkmark + "Tour unlocked" confirmation, then either dismisses back to the now-unlocked itinerary or chains into the account prompt sheet.

### 3.5 Unlocked Itinerary (post-payment)
- "Tour unlocked · valid all day" banner (temporary/dismissible).
- All stops now shown with a small audio-badge icon (unlocked indicator) instead of a lock icon.
- Editing controls (drag/remove/add) removed from the default view — tucked behind `•••` menu as a deliberate "Customize stops" action, since the list is now final by default.
- CTA changes from "Start tour" → "Begin tour," which triggers full navigation (not a sheet) into in-museum mode.

### 3.6 Soft Account Prompt (bottom sheet, after payment)
- Framed around benefit: "Save this tour to your account? / So you can find it again if you switch devices."
- Continue with Apple / Continue with Google primary; "Use email instead" secondary; "Not now" always present and easy.
- Tap-outside-to-dismiss **is** allowed here (unlike payment) — no cost to accidental dismissal.
- **RESOLVED: primary buttons ("Continue with Apple" / "Continue with Google") use the same bold, filled dark navy treatment as the payment CTA** — not the lighter/outlined version. Lower stakes is instead signaled entirely through "Not now" being present, easy, and tap-outside-to-dismiss being enabled (unlike payment). Note this is a deliberate tradeoff: a confident primary CTA at the cost of the button styling alone no longer visually distinguishing this sheet's stakes from payment's — acceptable since the skip affordance carries that signal instead.
- On "Continue with Apple/Google" success: brief confirmation state ("You're all set / Signed in as j\*\*\*@icloud.com") with a required "Continue" tap (no auto-dismiss) before returning to the unlocked itinerary.
- Re-offer account creation once more, later, at the post-visit screen — never nag beyond that.

### 3.7 "Begin Tour" → In-Museum Sub-flow
Sequence: **Confirm location** (near-instant if already granted; real pre-prompt with rationale if not, capped at 2-3s before proceeding regardless of GPS fix) → **Pair glasses** (optional, equal-weight choice between "Pair Meta glasses" and "Continue on phone," not a skewed upsell; needs a "not found" timeout state) → **First stop reveal** (one-time, dismissible coach mark only) → **Navigation loop** (repeats per stop) → **Tour complete / post-visit**.

- Note technical risk: standard phone GPS is often unreliable indoors — the scale of precision implied ("which gallery are you in") may not be achievable without supplementary positioning (beacons, WiFi, or manual self-report). Validate before committing further design/engineering time.

### 3.8 In-Museum Navigation Screen
- Dominant "Next stop" card (accent-colored, largest element) with audio play button.
- Completed stops shown struck-through/dimmed (not removed) for progress visibility.
- "Running behind? Shorten tour" safety-valve button — re-prompts AI to re-rank remaining stops given time left. High-priority feature for this persona (tourists run late constantly).
- Small, quiet status line: "Guest session · valid all day" (or equivalent signed-in state) — visible but not demanding attention.
- `•••` menu: Customize stops, Shorten tour, Restore purchase (guest recovery via email), Save to account (second low-pressure chance to convert).

### 3.9 AR Glasses Overlay (concept-level, not pixel-spec)
- All UI edge-anchored; center of field of view stays clear.
- Small dark high-contrast label pills near objects, not cards.
- "Gaze to play audio" — no tap targets in the AR view.
- Treat as a pitch/concept artifact — actual implementation constrained by Meta's SDK, TBD.

### 3.10 Not Yet Designed / Deferred
- Post-visit screen (save/rate/favorites) — first place account status should become visibly meaningful.
- Museum selection screen full detail (beyond the landing-screen location logic above).

---

## 4. Design System — LOCKED

**Decision: "Step Flow / Light" is the design system for the MVP build.** This was an open question in earlier drafts; it's now resolved. Build every screen against these tokens — do not introduce the "Ink & Brass" dark alternative (see 4.2) into the app itself.

### 4.1 "Step Flow / Light" (the build spec)

**Color tokens (use these exact CSS variable names in the codebase):**
```css
--bg: #F6F6F7;                  /* page background, light off-white grey */
--surface: #FFFFFF;             /* elevated card surface */
--text-primary: #14161F;        /* near-black navy — also CTA fill */
--text-secondary: #8A8D98;      /* grey — subtext/labels */
--pill-selected-bg: #D6E4F5;    /* light blue — selected pill fill */
--pill-selected-text: #2C5AA0;  /* medium blue — selected pill text */
--pill-border: #14161F;         /* unselected pill border + text */
--track-filled: #14161F;        /* progress bar, filled segment */
--track-unfilled: #E5E5E7;      /* progress bar, unfilled segment */
--cta-bg: #14161F;               /* primary CTA button fill */
--cta-text: #FFFFFF;             /* primary CTA button label */
--radius-pill: 999px;
--radius-card: 16px;
```

**Typography:**
- Headline font: bold geometric/humanist sans-serif — Inter, SF Pro, Manrope, or Söhne. **For the web build, use Inter** (free, self-hostable via `next/font`, closest open-source match to the reference). Used for page titles ("Plan your experience," "What draws you in?") and stat numbers ("3 hrs").
- Body/UI font: same family, regular weight. Used for subtext, pill labels, slider labels, links, footnotes.

**Style principles:**
- Light, airy background with white elevated cards — soft shadow, **no border** on cards.
- Fully rounded pill components for both tags and the slider thumb (`--radius-pill: 999px`).
- Selected pill state = light blue fill + blue text, color alone carries the meaning (no checkmark icon required by the base spec, though the founder's reference screenshot does show one — **default to color-only per this style guide; checkmark is optional polish, not required for MVP**).
- Unselected pill state = white fill + 1px dark border + dark text (outline style).
- CTA button: solid dark navy (`--cta-bg`), full-width, bold white label — this is the main visual anchor on every screen that has one.
- Step indicator: thin progress bar, filled segment dark navy, unfilled light grey. **Per Section 2, Principle 3 — only appears on input screens (Step 1), never on the itinerary or later screens.**
- Minimal icons — small settings/sliders icon before the "Tell us more about you" optional link is the only icon needed on Step 1.
- Overall mood: clean, modern, approachable — consumer SaaS feel, not editorial/dark.

### 4.2 "Ink & Brass" — REJECTED for app build, reference only
Dark, brass-accented theme explored for the investor deck and as an alternate app direction. **Not used in the MVP app.** Kept here only in case a future dark-mode variant or a separate marketing site wants this treatment:
```css
--bg: #0F1015;
--surface: #1C1E28;
--text-primary: #EDE6D6;
--text-secondary: #8A8478;
--accent: #B08D57;
--line-muted: #332E22;
```

---

## 5. Technical Architecture — LOCKED: Web App (Next.js), not React Native

**Decision: build the MVP as a responsive web app first, for dev speed.** React Native/Expo was considered and set aside for the MVP specifically (may be revisited post-MVP — see Section 8). Do not scaffold a React Native project for this phase.

| Layer | Choice | Why |
|---|---|---|
| Frontend + Backend | Next.js (App Router) + TypeScript | One language/repo — both UI and backend endpoints live in the same project, no separate backend service needed |
| Styling | Tailwind CSS | Maps directly to the design tokens in Section 4 |
| Auth + Database | Supabase (Postgres + Auth + Storage) | Fast real account system + real DB for MVP speed |
| Payment (mock) | Stripe, Test Mode | Real Checkout UI/flow, zero real charges |
| Museum data | The Met's public Collection API | Free, no key, real data |
| LLM curation | Claude API | Structured JSON output for interest-matching |
| Hosting | Vercel | Zero-config for Next.js, auto-deploys on every git push |

### 5.1 Client vs. server split (important — where secrets live)

Next.js runs code in two contexts; keeping this straight matters for security:

- **Client-side** (browser-executed React components): safe to call Supabase directly using the **anon key**. Access control is enforced by **Row Level Security (RLS) policies** defined in Postgres — not by hiding the key, which is meant to be public.
- **Server-side** (Next.js Route Handlers, under `app/api/.../route.ts`): the **only** place the following may ever be used — Anthropic API key, Stripe secret key, and Supabase **service role key** (which bypasses RLS). None of these three may appear in any client-side file or be sent to the browser.

### 5.2 Data layer — Supabase/Postgres tables

- `profiles` — one row per authenticated user, linked to Supabase Auth.
- `itineraries` — one row per generated tour. Foreign-keyed to **either** `user_id` **or** `guest_session_id` (nullable pair — exactly one is set) — this dual-ownership model is what makes guest checkout work before account creation.
- `stops` — child rows per itinerary, referencing MET object IDs (one-to-many from `itineraries`).
- `purchases` — one row per Stripe payment, status, foreign-keyed to an itinerary.
- RLS policies required on every table before any real user data flows through them — treat this as real work in Phase 3/early, not boilerplate to rush.

### 5.3 Guest session identity
A random session token (UUID) generated on first visit, stored in a cookie, used as the owner reference on `itineraries`/`purchases` before/unless the person creates an account. On account creation, existing guest-owned rows should be re-pointed to the new `user_id`.

### 5.4 Server-side API endpoints to build
- **MET API proxy** (`/api/met/...`) — server-side fetch + filter of Met Collection API results (filters for objects with both image and full description present — data completeness is inconsistent, budget real time here); returns cleaned JSON to the client. Caches a candidate pool rather than hitting the live API per-request.
- **LLM curation endpoint** (`/api/curate`) — takes user inputs (from Step 1) + candidate MET objects, calls the Claude API, returns structured itinerary JSON (ranked stops, route order, "Matches: X" tags). Apply basic length/moderation limits to the free-text personalization field before it reaches the prompt (see Section 7).
- **Stripe Checkout + webhook** (`/api/checkout`, `/api/webhooks/stripe`) — creates a Checkout Session server-side; a separate webhook handler receives Stripe's async payment-success callback and marks the itinerary "unlocked" in the DB. Verify the webhook signature — do not trust an unverified callback.

**Deliberately simplified for MVP (be upfront in the product/demo that these are simplifications, not full features):**
- **Route/map:** static Met floor plan image + hardcoded gallery-coordinate lookup table for the demo's gallery subset; a drawn connecting line, not real pathfinding (no walls/shortest-path logic).
- **Blue dot:** manual self-report ("I'm at Gallery 825") driving position, not real indoor positioning (no public Met beacon/WiFi infra exists to build against). A scripted animated walk-through is a possible pure-demo fallback but should never be presented as a working feature.

**iOS/Android distribution:** MVP ships as this responsive web app with "Add to Home Screen" (PWA) support — manifest.json + apple-touch-icon + apple-mobile-web-app-capable meta tag — no App Store needed; a real `https://` URL from Vercel is enough for any demo. A future native rewrite (if pursued post-MVP) would most reasonably be React Native/Expo — same TypeScript/React mental model, UI layer rebuilt from scratch, backend/business logic (Supabase calls, API routes' underlying logic) largely reusable. Meta glasses pairing will very likely need a small native module regardless of path, since AR glasses SDKs are typically not exposed to JS/web.

---

## 6. Phased Build Plan — FINAL ORDER (hour estimates)

Reordered from the original numeric draft: data layer + guest session moved up (everything downstream depends on it), account creation moved after payment (matches the guest-first product principle in Section 2).

| Order | Phase | Scope | Est. hours |
|---|---|---|---|
| 1 | Foundation | Scaffold Next.js + TS + Tailwind, create Supabase project, wire env vars (local + Vercel), deploy empty skeleton live | 2–3 |
| 2 | Data layer + guest sessions | Create tables (5.2), RLS policies, guest session token/cookie logic (5.3) | 2–4 |
| 3 | MET API layer | Server-side proxy endpoint, filter for complete objects, cache candidate pool | 3–5 |
| 4 | Step 1 + itinerary screens + LLM curation | Build Step 1 UI (collapsed + expanded), itinerary locked-preview UI, `/api/curate` endpoint — **biggest phase, core product risk, budget extra for prompt iteration** | 6–9 |
| 5 | Payment | Stripe Checkout session + webhook, payment sheet UI, unlocked-itinerary state | 2–4 |
| 6 | Account creation | Supabase Auth, soft account-prompt sheet UI, guest-row re-pointing on signup | 2–3 |
| 7 | Route/map display | Static floor plan image + coordinate lookup table for demo galleries, drawn connector line | 3–5 |
| 8 | Save & share | Persist itinerary, shareable read-only link | 2–3 |
| 9 | Blue dot (stretch — cut first if time is short) | Manual self-report position UI | 3–6 |
| 10 | Polish & demo prep | Design tokens applied everywhere, error/empty states, PWA manifest + icons, pre-verify 2–3 demo-safe interest combos before showing anyone | 3–5 |
| **Total** | | | **~28–39 hrs** |

**Working process with Claude Code:**
- One phase per session where practical; commit to git after each phase fully works. Run `/clear` between unrelated phases in the same terminal session to avoid context drift.
- Feed it actual screen mockups (saved as PNGs, ideally in a `/design-reference/` folder in-repo) as visual references rather than re-describing screens in prose — drag-and-drop, file path, or clipboard paste (`Ctrl+V` on Mac terminal, not `Cmd+V`) all work.
- Keep this document as `CLAUDE.md` at repo root so architecture/scope decisions aren't re-litigated mid-build.
- Explicitly ask Claude Code to flag assumptions rather than silently guess, especially around Met API data gaps and the two intentionally-simplified features (routing, blue dot).
- Ask Claude Code to explain *why* behind any non-trivial decision, especially in Phases 2, 5, and 6 (auth, payment, RLS) — these are the areas where a subtly wrong default (e.g., a missing RLS policy) won't show up as visible breakage, only as a later security gap.
- Consider Supabase's official MCP server for Phase 2/3 (schema/migrations/auth work via natural language instead of manual dashboard clicking) — start it in read-only mode, only enable writes once trusted.

---

## 7. Open Questions / Things to Validate Before/During Build

- [ ] Whether GPS/indoor positioning is precise enough for even the simplified "gallery-level" blue dot — validate early, this could force cutting Phase 9 entirely.
- [ ] Meta glasses pairing/session model — current design is conceptual; needs real API research once that phase is reached.
- [ ] Whether "Tour unlocked" content should differ if the free-text personalization field is empty vs. filled — not yet designed.
- [ ] Content moderation approach for the free-text "anything else?" input before it reaches the LLM prompt.
- [ ] Confirm real Met Collection API data completeness (image + description availability) is sufficient across enough objects to support several different interest-combinations reliably before demo day.

---

## 8. Resolved Decisions Log

*Decisions that were open questions in earlier drafts and are now final — kept here so they aren't accidentally re-opened.*

- **Platform for MVP: web app (Next.js), not React Native/Expo.** Chosen for dev speed. React Native remains a possible post-MVP path if going native is later justified — would reuse business logic, rebuild the UI layer.
- **Design system: "Step Flow / Light" (Section 4.1), final.** "Ink & Brass" is explicitly not used in the app.
- **Distribution: web URL + "Add to Home Screen," no App Store for MVP.**
- **Build order: data layer/guest sessions before screens; account creation after payment**, not in original numeric order — see Section 6.
- **Account-prompt sheet buttons are bold/filled**, matching the payment sheet's visual weight (Section 3.6) — "Not now" + tap-outside-to-dismiss carry the lower-stakes signal instead of button styling.
