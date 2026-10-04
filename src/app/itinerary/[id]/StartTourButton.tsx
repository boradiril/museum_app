"use client";

import { useState } from "react";

// Stub for §3.3's "Start tour" CTA. Payment is Phase 5, so this only
// says so — it does not open a payment sheet or unlock anything.
export default function StartTourButton() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setMessage("Payment isn't built yet — coming in a later phase.")}
        className="w-full rounded-pill bg-cta py-3.5 font-semibold text-cta-text"
      >
        Start tour
      </button>
      {message && <p className="mt-3 text-center text-sm text-secondary">{message}</p>}
    </div>
  );
}
