/**
 * "What draws you in?" chip list (CLAUDE.md §3.2, resolved 2026-09-25).
 * Data-grounded against the Phase 3 met_objects pool — 97.6% coverage via
 * cross-field keyword matching (classification/tags/object_name/medium).
 * No separate "beyond art" chip section for this MVP — see §3.2 for why.
 */
export const INTEREST_CHIPS = [
  "Arms & Weapons",
  "Armor & Shields",
  "Sculpture & Statues",
  "Metalwork, Glass & Fine Materials",
  "Sacred & Religious Art",
  "Animals in Art",
  "Mythology & Legendary Creatures",
  "Royalty & Power",
  "Ancient Egypt",
] as const;

export type InterestChip = (typeof INTEREST_CHIPS)[number];

export function isValidInterestChip(value: string): value is InterestChip {
  return (INTEREST_CHIPS as readonly string[]).includes(value);
}
