import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Pre-payment itinerary preview (CLAUDE.md §3.3, §2 principle 8).
 * Runs server-side with the visitor's own session, so RLS limits reads to
 * their own itinerary. Locked stops are dropped here, never sent to the
 * client, so the paid content can't leak through the page source.
 */

// Design (Figma) shows "Preview — 4 of 8"; CLAUDE.md §3.3 says 3. Confirm.
const PREVIEW_STOP_COUNT = 4;

export interface PreviewStop {
  position: number;
  title: string | null;
  artist: string | null;
  matchedInterest: string | null;
  galleryLocation: string | null;
  imageUrl: string | null;
}

export interface ItineraryPreview {
  itineraryId: string;
  unlocked: boolean;
  timeMinutes: number | null;
  stopCount: number;
  previewStops: PreviewStop[];
  lockedCount: number;
}

interface StopRow {
  position: number;
  title: string | null;
  artist: string | null;
  matched_interest: string | null;
  gallery_location: string | null;
  image_url: string | null;
}

/**
 * Breadth selection (§3.3): one stop per interest category, in route order,
 * then fill any remaining slots from the rest of the route.
 */
function selectPreviewStops(stops: StopRow[]): StopRow[] {
  const picked: StopRow[] = [];
  const seenInterests = new Set<string>();

  for (const stop of stops) {
    if (picked.length >= PREVIEW_STOP_COUNT) break;
    const interest = stop.matched_interest ?? "";
    if (!seenInterests.has(interest)) {
      seenInterests.add(interest);
      picked.push(stop);
    }
  }

  for (const stop of stops) {
    if (picked.length >= PREVIEW_STOP_COUNT) break;
    if (!picked.includes(stop)) picked.push(stop);
  }

  return picked.sort((a, b) => a.position - b.position);
}

export async function getItineraryPreview(itineraryId: string): Promise<ItineraryPreview | null> {
  const supabase = await createClient();

  const { data: itinerary, error: itineraryError } = await supabase
    .from("itineraries")
    .select("id, unlocked_at, time_minutes")
    .eq("id", itineraryId)
    .maybeSingle();

  if (itineraryError) {
    throw new Error(`Failed to load itinerary: ${itineraryError.message}`);
  }
  if (!itinerary) return null;

  const { data: stops, error: stopsError } = await supabase
    .from("stops")
    .select("position, title, artist, matched_interest, gallery_location, image_url")
    .eq("itinerary_id", itineraryId)
    .order("position", { ascending: true });

  if (stopsError) {
    throw new Error(`Failed to load stops: ${stopsError.message}`);
  }

  const allStops = (stops ?? []) as StopRow[];
  const unlocked = Boolean(itinerary.unlocked_at);
  const previewRows = unlocked ? allStops : selectPreviewStops(allStops);

  return {
    itineraryId,
    unlocked,
    timeMinutes: itinerary.time_minutes ?? null,
    stopCount: allStops.length,
    previewStops: previewRows.map((s) => ({
      position: s.position,
      title: s.title,
      artist: s.artist,
      matchedInterest: s.matched_interest,
      galleryLocation: s.gallery_location,
      imageUrl: s.image_url,
    })),
    lockedCount: unlocked ? 0 : allStops.length - previewRows.length,
  };
}
