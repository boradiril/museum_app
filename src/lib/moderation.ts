/**
 * Free-text personalization moderation (CLAUDE.md §3.2, resolved 2026-09-25).
 * Two layers by design: this blocklist is a cheap supplementary net, not the
 * primary defense — that's the prompt-structure delimiting applied where the
 * sanitized text is actually used (src/app/api/curate/route.ts). Deliberately
 * not a dedicated moderation classifier call for MVP.
 */

const FREE_TEXT_MAX_LENGTH = 280;

const BLOCKLIST = [
  "ignore previous instructions",
  "ignore all previous instructions",
  "ignore the above",
  "disregard the above",
  "disregard previous",
  "system prompt",
  "you are now",
  "new instructions",
  "act as",
];

/**
 * Returns sanitized free text, or null if empty/blank/flagged. Flagged text
 * is silently dropped, not rejected — free text is "one signal among
 * several, never something that overrides core curation logic" (§3.2), so
 * losing it doesn't block the rest of curation.
 */
export function sanitizeFreeText(input: string | undefined | null): string | null {
  if (!input) return null;

  const truncated = input.slice(0, FREE_TEXT_MAX_LENGTH).trim();
  if (!truncated) return null;

  const lower = truncated.toLowerCase();
  if (BLOCKLIST.some((phrase) => lower.includes(phrase))) {
    return null;
  }

  return truncated;
}
