import Link from "next/link";
import { notFound } from "next/navigation";
import { getItineraryPreview } from "@/lib/itinerary";
import StartTourButton from "./StartTourButton";

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const preview = await getItineraryPreview(id);

  if (!preview) notFound();

  return (
    <main className="flex flex-1 flex-col bg-bg">
      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-32 pt-6">
        <header className="flex items-center justify-between">
          <Link href="/interests" className="text-sm font-medium text-primary">
            ← Edit
          </Link>
          <p className="text-sm text-secondary">{preview.stopCount} stops</p>
        </header>

        <h1 className="mt-6 text-3xl font-bold text-primary">Your tour</h1>

        {/* Route/map thumbnail — placeholder until Phase 7 (§7). */}
        <div className="mt-6 flex h-40 items-center justify-center rounded-card bg-surface text-sm text-secondary shadow-sm">
          Route map — coming in a later phase
        </div>

        <ul className="mt-8 space-y-4">
          {preview.previewStops.map((stop) => (
            <li key={stop.position} className="overflow-hidden rounded-card bg-surface shadow-sm">
              {stop.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={stop.imageUrl} alt={stop.title ?? ""} className="h-48 w-full object-cover" />
              )}
              <div className="p-4">
                <p className="text-xs font-medium text-secondary">Stop {stop.position}</p>
                <h2 className="mt-1 text-base font-semibold text-primary">{stop.title}</h2>
                {stop.artist && <p className="mt-1 text-sm text-secondary">{stop.artist}</p>}
                {stop.matchedInterest && (
                  <span className="mt-3 inline-block rounded-pill bg-pill-selected-bg px-3 py-1 text-xs font-medium text-pill-selected-text">
                    Matches: {stop.matchedInterest}
                  </span>
                )}
                {stop.galleryLocation && (
                  <p className="mt-2 text-xs text-secondary">Gallery {stop.galleryLocation}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {preview.lockedCount > 0 && (
          <div className="mt-4 rounded-card border border-pill-border px-4 py-5 text-center">
            <p className="font-semibold text-primary">
              {preview.lockedCount} more {preview.lockedCount === 1 ? "stop" : "stops"}
            </p>
            <p className="mt-1 text-sm text-secondary">Unlocked with your tour</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 w-full border-t border-pill-border/10 bg-bg/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-md">
          <StartTourButton />
        </div>
      </div>
    </main>
  );
}
