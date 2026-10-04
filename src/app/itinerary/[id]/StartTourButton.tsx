"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const PRICE_LABEL = "$4.99";

interface Props {
  itineraryId: string;
  unlocked: boolean;
  stopCount: number;
}

/**
 * Footer CTA. Before payment: "Start tour" opens the payment sheet (§3.4).
 * After payment: "Begin tour" (in-museum mode is a later phase, so it only says so).
 */
export default function StartTourButton({ itineraryId, unlocked, stopCount }: Props) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beginNote, setBeginNote] = useState<string | null>(null);
  const dragStartY = useRef<number | null>(null);

  function closeSheet() {
    setSheetOpen(false);
    setError(null);
  }

  async function pay() {
    setError(null);
    setPaying(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itineraryId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Payment didn't go through. Please try again.");
        return;
      }
      setSheetOpen(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setPaying(false);
    }
  }

  if (unlocked) {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => setBeginNote("In-museum mode is coming in a later phase.")}
          className="w-full rounded-pill bg-cta py-3.5 font-semibold text-cta-text"
        >
          Begin tour
        </button>
        {beginNote && <p className="mt-3 text-center text-sm text-secondary">{beginNote}</p>}
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="w-full rounded-pill bg-cta py-3.5 font-semibold text-cta-text"
      >
        Start tour
      </button>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unlock-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !paying) closeSheet();
          }}
        >
          <div
            className="w-full max-w-md rounded-t-[28px] bg-surface px-6 pb-8 pt-4 shadow-xl"
            onTouchStart={(e) => {
              dragStartY.current = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              const start = dragStartY.current;
              dragStartY.current = null;
              if (start !== null && e.changedTouches[0].clientY - start > 80 && !paying) closeSheet();
            }}
          >
            <div className="mx-auto h-1 w-10 rounded-pill bg-track-unfilled" />
            <h2 id="unlock-title" className="mt-6 text-2xl font-bold text-primary">
              Unlock your audio tour
            </h2>
            <p className="mt-1 text-sm text-secondary">{stopCount} stops · valid all day</p>

            <div className="mt-5 flex items-center justify-between border-y border-track-unfilled py-4">
              <span className="text-secondary">Total</span>
              <span className="text-2xl font-bold text-primary">{PRICE_LABEL}</span>
            </div>

            <button
              type="button"
              onClick={pay}
              disabled={paying}
              className="mt-6 w-full rounded-pill bg-cta py-3.5 font-semibold text-cta-text disabled:opacity-60"
            >
              {paying ? "Processing..." : "Apple Pay"}
            </button>
            <button
              type="button"
              onClick={pay}
              disabled={paying}
              className="mt-3 w-full rounded-pill border border-pill-border bg-surface py-3.5 font-semibold text-primary disabled:opacity-60"
            >
              {paying ? "Processing..." : "Pay with card"}
            </button>

            {error && (
              <p role="alert" className="mt-4 text-center text-sm font-medium text-red-600">
                {error}
              </p>
            )}
            <p className="mt-4 text-center text-xs text-secondary">
              Test payment — nothing is charged. No account needed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
