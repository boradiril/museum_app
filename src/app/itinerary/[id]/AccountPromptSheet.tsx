"use client";

import { useRef } from "react";

export type AccountChoice = "apple" | "google" | "email";

interface Props {
  onClose: () => void;
  onChoose: (choice: AccountChoice) => void;
}

/**
 * Soft account prompt after payment (CLAUDE.md §3.6). Unlike the payment sheet,
 * tapping outside or swiping down dismisses it, and "Not now" is always visible.
 * Sign-in itself is not wired yet; the parent decides what each choice does.
 */
export default function AccountPromptSheet({ onClose, onChoose }: Props) {
  const dragStartY = useRef<number | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
          if (start !== null && e.changedTouches[0].clientY - start > 80) onClose();
        }}
      >
        <div className="mx-auto h-1 w-10 rounded-pill bg-track-unfilled" />
        <p className="mt-6 text-sm font-semibold text-pill-selected-text">Tour unlocked</p>
        <h2 id="account-title" className="mt-2 text-2xl font-bold leading-tight text-primary">
          Save this tour to your account?
        </h2>
        <p className="mt-2 text-sm text-secondary">So you can find it again if you switch devices.</p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => onChoose("apple")}
            className="w-full rounded-pill bg-cta py-3.5 font-semibold text-cta-text"
          >
            Continue with Apple
          </button>
          <button
            type="button"
            onClick={() => onChoose("google")}
            className="w-full rounded-pill bg-cta py-3.5 font-semibold text-cta-text"
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => onChoose("email")}
            className="w-full rounded-pill border border-pill-border bg-surface py-3.5 font-semibold text-primary"
          >
            Use email instead
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 text-center text-sm font-medium text-secondary"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
