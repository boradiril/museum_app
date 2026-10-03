"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { INTEREST_CHIPS, isValidInterestChip, type InterestChip } from "@/lib/interests";

type Pace = "highlights" | "go_deep";
type GroupType = "solo" | "couple" | "family" | "group";

const GROUP_OPTIONS: { value: GroupType; label: string }[] = [
  { value: "solo", label: "Solo" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
  { value: "group", label: "Group" },
];

const MIN_MINUTES = 60;
const MAX_MINUTES = 300;
const STEP_MINUTES = 15;
const FREE_TEXT_MAX = 280;

// Session-scoped so a visitor's choices survive the trip to the itinerary and
// back via "Edit", but don't leak into a new browsing session.
const STORAGE_KEY = "muse.interests.v1";

interface SavedInterests {
  timeMinutes: number;
  selectedInterests: InterestChip[];
  expanded: boolean;
  pace: Pace;
  groupType: GroupType;
  freeText: string;
  mustSeeQuery: string;
}

// Remembers the last successful build and the exact inputs it came from, so
// "Build my tour" can reuse that itinerary when nothing has changed.
const LAST_BUILD_KEY = "muse.lastBuild.v1";

interface LastBuild {
  signature: string;
  itineraryId: string;
}

function buildRequest(input: {
  timeMinutes: number;
  selectedInterests: InterestChip[];
  pace: Pace;
  groupType: GroupType;
  freeText: string;
  mustSeeQuery: string;
}) {
  return {
    timeMinutes: input.timeMinutes,
    interests: input.selectedInterests,
    pace: input.pace,
    groupType: input.groupType,
    freeText: input.freeText.trim() || undefined,
    mustSeeQuery: input.mustSeeQuery.trim() || undefined,
  };
}

function signatureOf(request: ReturnType<typeof buildRequest>): string {
  return JSON.stringify({ ...request, interests: [...request.interests].sort() });
}

function readLastBuild(): LastBuild | null {
  try {
    const raw = sessionStorage.getItem(LAST_BUILD_KEY);
    return raw ? (JSON.parse(raw) as LastBuild) : null;
  } catch {
    return null;
  }
}

function readSaved(): Partial<SavedInterests> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<SavedInterests>) : null;
  } catch {
    return null;
  }
}

function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr${hrs !== 1 ? "s" : ""}`;
  return `${hrs}h ${mins}m`;
}

function BackArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
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
  const [restored, setRestored] = useState(false);
  const router = useRouter();

  const panelRef = useRef<HTMLDivElement>(null);

  // Restore once on mount. Saving stays off until this has run, so the default
  // values can't overwrite what's stored (React dev mode runs effects twice).
  useEffect(() => {
    const saved = readSaved();
    setRestored(true);
    if (!saved) return;
    if (typeof saved.timeMinutes === "number" && saved.timeMinutes >= MIN_MINUTES && saved.timeMinutes <= MAX_MINUTES) {
      setTimeMinutes(saved.timeMinutes);
    }
    if (Array.isArray(saved.selectedInterests)) {
      setSelectedInterests(saved.selectedInterests.filter((c): c is InterestChip => typeof c === "string" && isValidInterestChip(c)));
    }
    if (saved.pace === "highlights" || saved.pace === "go_deep") setPace(saved.pace);
    if (saved.groupType && GROUP_OPTIONS.some((g) => g.value === saved.groupType)) setGroupType(saved.groupType);
    if (typeof saved.freeText === "string") setFreeText(saved.freeText.slice(0, FREE_TEXT_MAX));
    if (typeof saved.mustSeeQuery === "string") setMustSeeQuery(saved.mustSeeQuery);
    if (saved.expanded === true) setExpanded(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      const snapshot: SavedInterests = {
        timeMinutes,
        selectedInterests,
        expanded,
        pace,
        groupType,
        freeText,
        mustSeeQuery,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Storage unavailable (private mode, quota): selections just aren't kept.
    }
  }, [restored, timeMinutes, selectedInterests, expanded, pace, groupType, freeText, mustSeeQuery]);

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

    if (selectedInterests.length === 0) {
      setError("Pick at least one interest to build your tour.");
      return;
    }

    const request = buildRequest({ timeMinutes, selectedInterests, pace, groupType, freeText, mustSeeQuery });
    const signature = signatureOf(request);
    const last = readLastBuild();
    if (last && last.signature === signature) {
      router.push(`/itinerary/${last.itineraryId}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Something went wrong on our side. Please try again.");
        return;
      }
      try {
        sessionStorage.setItem(LAST_BUILD_KEY, JSON.stringify({ signature, itineraryId: data.itineraryId }));
      } catch {
        // Storage unavailable: the next submit will simply call curation again.
      }
      router.push(`/itinerary/${data.itineraryId}`);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const chipClass = (selected: boolean) =>
    selected
      ? "rounded-pill bg-pill-selected-bg px-4 py-2.5 text-sm font-medium text-pill-selected-text"
      : "rounded-pill border border-pill-border bg-surface px-4 py-2.5 text-sm font-medium text-primary";

  return (
    <main className="flex flex-1 flex-col bg-bg">
      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-44 pt-6">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Back" className="flex h-9 w-9 items-center justify-center text-primary">
            <BackArrow />
          </Link>
          <p className="text-sm text-secondary">Step 1 of 2</p>
        </header>

        {/* Two-segment step indicator; first segment filled for Step 1 (§4.1). */}
        <div className="mt-4 flex gap-2">
          <div className="h-1 flex-1 rounded-pill bg-track-filled" />
          <div className="h-1 flex-1 rounded-pill bg-track-unfilled" />
        </div>

        <h1 className="mt-8 text-3xl font-bold text-primary">Plan your experience</h1>
        <p className="mt-2 text-secondary">We&apos;ll fit the tour to your schedule.</p>

        {/* Time card */}
        <div className="mt-6 rounded-card bg-surface px-6 py-5 shadow-sm">
          <div className="flex items-baseline justify-between">
            <label htmlFor="time" className="text-sm text-secondary">
              Time at the museum
            </label>
            <p className="text-2xl font-bold text-primary">{formatTime(timeMinutes)}</p>
          </div>
          <input
            id="time"
            type="range"
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            step={STEP_MINUTES}
            value={timeMinutes}
            onChange={(e) => setTimeMinutes(Number(e.target.value))}
            className="mt-5 w-full accent-[var(--cta-bg)]"
          />
        </div>

        <h2 className="mt-8 text-2xl font-bold text-primary">What draws you in?</h2>
        <p className="mt-1 text-secondary">Pick a few — you can adjust later.</p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {INTEREST_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => toggleInterest(chip)}
              className={chipClass(selectedInterests.includes(chip))}
            >
              {chip}
            </button>
          ))}
        </div>

        {!expanded && (
          <button
            type="button"
            onClick={handleExpand}
            className="mt-6 flex items-center gap-2 text-sm font-medium text-secondary underline underline-offset-4"
          >
            <span aria-hidden="true">✦</span>
            Tell us more about you — optional
          </button>
        )}

        {expanded && (
          <div ref={panelRef} className="mt-6 space-y-8">
            <p className="text-sm font-medium text-secondary">
              Pace, group size, and your interests beyond art
            </p>

            <div>
              <p className="text-sm font-medium text-secondary">Pace</p>
              <div className="mt-2 flex gap-2">
                {(["highlights", "go_deep"] as Pace[]).map((p) => (
                  <button key={p} type="button" onClick={() => setPace(p)} className={chipClass(pace === p)}>
                    {p === "highlights" ? "Highlights" : "Go deep"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-secondary">Who&apos;s visiting?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GROUP_OPTIONS.map((g) => (
                  <button key={g.value} type="button" onClick={() => setGroupType(g.value)} className={chipClass(groupType === g.value)}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

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

      </div>

      <div className="fixed inset-x-0 bottom-0 bg-bg px-6 pb-8 pt-4">
        <div className="mx-auto w-full max-w-md">
          {error && <p role="alert" className="mb-3 text-center text-sm font-medium text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-pill bg-cta py-3.5 font-semibold text-cta-text disabled:opacity-60"
          >
            {submitting ? "Building your tour..." : "Build my tour"}
          </button>
          <p className="mt-3 text-center text-xs text-secondary">Defaults to a solo, highlights-paced tour</p>
        </div>
      </div>
    </main>
  );
}
