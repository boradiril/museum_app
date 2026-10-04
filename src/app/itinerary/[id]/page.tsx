import Link from "next/link";
import { notFound } from "next/navigation";
import { getItineraryPreview } from "@/lib/itinerary";
import StartTourButton from "./StartTourButton";

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function LockIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

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
      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-40 pt-6">
        <header className="grid grid-cols-3 items-center">
          <Link href="/interests" className="flex items-center gap-2 text-sm font-medium text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm">
              <ChevronLeft />
            </span>
            Edit
          </Link>
          <h1 className="text-center text-lg font-bold text-primary">Your tour</h1>
        </header>

        {/* Route/map card — placeholder until Phase 7 (§7). */}
        <div className="mt-6 flex h-40 flex-col items-center justify-center gap-3 rounded-card bg-[#ebe6dc]">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-primary shadow-sm">
            <PinIcon />
          </span>
          <p className="text-xs text-secondary">Route map — coming in a later phase</p>
        </div>

        {/* Summary card — stop count only; time budget isn't stored yet. */}
        <div className="mt-4 flex items-center justify-between rounded-card bg-surface px-5 py-4 shadow-sm">
          <p className="text-base">
            <span className="font-bold text-primary">{preview.stopCount} stops</span>
          </p>
        </div>

        <p className="mt-8 text-xs font-medium uppercase tracking-wider text-secondary">
          Preview — {preview.previewStops.length} of {preview.stopCount}
        </p>

        <ul className="mt-4 space-y-5">
          {preview.previewStops.map((stop) => (
            <li key={stop.position} className="flex gap-4">
              <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-surface">
                {stop.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={stop.imageUrl} alt={stop.title ?? ""} className="h-full w-full object-cover" />
                )}
                <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-primary shadow-sm">
                  <LockIcon size={10} />
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-snug text-primary">{stop.title}</h2>
                <p className="mt-1 text-sm text-secondary">
                  {[stop.artist, stop.galleryLocation && `Gallery ${stop.galleryLocation}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {stop.matchedInterest && (
                  <p className="mt-1 text-sm font-medium text-pill-selected-text">
                    Matches: {stop.matchedInterest}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {preview.lockedCount > 0 && (
          <div className="mt-6 flex items-center gap-4 rounded-card border border-dashed border-secondary px-5 py-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-track-unfilled text-secondary">
              <LockIcon size={16} />
            </span>
            <div>
              <p className="font-bold text-primary">
                {preview.lockedCount} more {preview.lockedCount === 1 ? "stop" : "stops"}
              </p>
              <p className="mt-0.5 text-sm text-secondary">Unlocked with your tour</p>
            </div>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-bg px-6 pb-8 pt-4">
        <div className="mx-auto w-full max-w-md">
          <StartTourButton />
        </div>
      </div>
    </main>
  );
}
