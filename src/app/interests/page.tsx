"use client";

import { useRef, useState } from "react";
import { INTEREST_CHIPS, type InterestChip } from "@/lib/interests";

type Pace = "highlights" | "go_deep";
type GroupType = "solo" | "couple" | "family" | "group";

const GROUP_OPTIONS: { value: GroupType; label: string }[] = [
  { value: "solo", label: "Solo" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
  { value: "group", label: "Group" },
];

const MIN_MINUTES = 60;
const MAX_MINUTES = 240;
const STEP_MINUTES = 15;
const FREE_TEXT_MAX = 280;

function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr${hrs !== 1 ? "s" : ""}`;
  return `${hrs}h ${mins}m`;
}

interface CurateResult {
  itineraryId: string;
  stopCount: number;
}

export default function InterestsPage() {
  const [timeMinutes, setTimeMinutes] = useState(180);
  const [selectedInterests, setSelectedInterests] = useState<InterestChip[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [pace, setPace] = useState<Pace>("highlights");
  const [groupType, setGroupType] = useState<GroupType>("solo");
  const [freeText, setFreeText] = useState("");
  const [mustSeeQuery, setMustSeeQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CurateResult | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  function toggleInterest(chip: InterestChip) {
    setSelectedInterests((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip],
    );
  }

  function handleExpand() {
    setExpanded(true);
    // §3.2: small auto-scroll to bring newly revealed content into view.
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function handleSubmit() {
    setError(null);
    setResult(null);

    if (selectedInterests.length === 0) {
      setError("Pick at least one interest to build your tour.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeMinutes,
          interests: selectedInterests,
          pace,
          groupType,
          freeText: freeText.trim() || undefined,
          mustSeeQuery: mustSeeQuery.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong building your tour.");
        return;
      }
      setResult(data);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // No itinerary preview screen (§3.3) yet — this is a temporary stand-in
  // confirmation, not the designed screen. Replace once that's built.
  if (result) {
    return (
      <main className="flex flex-1 items-center justify-center bg-bg px-6 py-16">
        <div className="w-full max-w-md rounded-card bg-surface p-8 shadow-sm text-center">
          <h1 className="text-2xl font-bold text-primary">Tour built!</h1>
          <p className="mt-3 text-secondary">
            {result.stopCount} stops selected for you.
          </p>
          <p className="mt-6 text-xs text-secondary break-all">
            Itinerary ID: {result.itineraryId}
          </p>
          <p className="mt-4 text-xs text-secondary">
            (Itinerary preview screen not built yet — this is a placeholder.)
          </p>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="mt-8 w-full rounded-pill border border-pill-border py-3 font-semibold text-primary"
          >
            Start over
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col bg-bg">
      {/* §4.1/§2 principle 3: thin step indicator, input screens only. */}
      <div className="mx-auto w-full max-w-md px-6 pt-6">
        <div className="h-1 w-full rounded-pill bg-track-unfilled">
          <div className="h-1 w-5/6 rounded-pill bg-track-filled" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-32 pt-8">
        <p className="text-sm font-medium tracking-widest text-secondary uppercase">
          Plan your visit
        </p>
        <h1 className="mt-2 text-3xl font-bold text-primary">
          What draws you in?
        </h1>

        {/* Time slider */}
        <div className="mt-8">
          <label htmlFor="time" className="block text-sm font-medium text-secondary">
            How much time do you have?
          </label>
          <p className="mt-1 text-2xl font-bold text-primary">
            {formatTime(timeMinutes)}
          </p>
          <input
            id="time"
            type="range"
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            step={STEP_MINUTES}
            value={timeMinutes}
            onChange={(e) => setTimeMinutes(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--cta-bg)]"
          />
        </div>

        {/* Interest chips */}
        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            {INTEREST_CHIPS.map((chip) => {
              const selected = selectedInterests.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleInterest(chip)}
                  className={
                    selected
                      ? "rounded-pill bg-pill-selected-bg px-4 py-2 text-sm font-medium text-pill-selected-text"
                      : "rounded-pill border border-pill-border px-4 py-2 text-sm font-medium text-pill-border"
                  }
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional expandable panel */}
        {!expanded && (
          <button
            type="button"
            onClick={handleExpand}
            className="mt-8 text-sm font-medium text-secondary underline underline-offset-2"
          >
            Tell us more about you — optional
          </button>
        )}

        {expanded && (
          <div ref={panelRef} className="mt-8 space-y-8">
            <p className="text-sm font-medium text-secondary">
              Pace, group size, and your interests beyond art
            </p>

            {/* Pace toggle */}
            <div>
              <p className="text-sm font-medium text-secondary">Pace</p>
              <div className="mt-2 flex gap-2">
                {(["highlights", "go_deep"] as Pace[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPace(p)}
                    className={
                      pace === p
                        ? "rounded-pill bg-pill-selected-bg px-4 py-2 text-sm font-medium text-pill-selected-text"
                        : "rounded-pill border border-pill-border px-4 py-2 text-sm font-medium text-pill-border"
                    }
                  >
                    {p === "highlights" ? "Highlights" : "Go deep"}
                  </button>
                ))}
              </div>
            </div>

            {/* Group type */}
            <div>
              <p className="text-sm font-medium text-secondary">Who&apos;s visiting?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GROUP_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGroupType(g.value)}
                    className={
                      groupType === g.value
                        ? "rounded-pill bg-pill-selected-bg px-4 py-2 text-sm font-medium text-pill-selected-text"
                        : "rounded-pill border border-pill-border px-4 py-2 text-sm font-medium text-pill-border"
                    }
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Free text */}
            <div>
              <label htmlFor="freeText" className="text-sm font-medium text-secondary">
                Anything else?
              </label>
              <textarea
                id="freeText"
                value={freeText}
                onChange={(e) => setFreeText(e.target.value.slice(0, FREE_TEXT_MAX))}
                placeholder="e.g. I'm a chef, I love sci-fi..."
                rows={2}
                className="mt-2 w-full rounded-card border border-pill-border bg-surface p-3 text-sm text-primary placeholder:text-secondary"
              />
              <p className="mt-1 text-right text-xs text-secondary">
                {freeText.length}/{FREE_TEXT_MAX}
              </p>
            </div>

            {/* Must-see search — stub only, not wired server-side yet */}
            <div>
              <label htmlFor="mustSee" className="text-sm font-medium text-secondary">
                Must-see artwork (optional)
              </label>
              <input
                id="mustSee"
                type="text"
                value={mustSeeQuery}
                onChange={(e) => setMustSeeQuery(e.target.value)}
                placeholder="Search for a specific piece..."
                className="mt-2 w-full rounded-pill border border-pill-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-secondary"
              />
            </div>
          </div>
        )}

        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
      </div>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 w-full border-t border-pill-border/10 bg-bg/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-md">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-pill bg-cta py-3.5 font-semibold text-cta-text disabled:opacity-60"
          >
            {submitting ? "Building your tour..." : "Build my tour"}
          </button>
        </div>
      </div>
    </main>
  );
}
