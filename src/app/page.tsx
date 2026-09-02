export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-bg px-6 py-16">
      <div className="w-full max-w-md rounded-card bg-surface p-8 shadow-sm">
        <p className="text-sm font-medium tracking-widest text-secondary uppercase">
          MUSE
        </p>
        <h1 className="mt-3 text-3xl font-bold text-primary">
          Your personal museum curator
        </h1>
        <p className="mt-3 text-secondary">
          An AI-curated audio guide that turns any museum visit into a personal
          tour matched to your time and your interests.
        </p>

        <button
          type="button"
          className="mt-8 w-full rounded-pill bg-cta py-3.5 font-semibold text-cta-text"
        >
          Build my tour
        </button>

        <p className="mt-6 text-xs text-secondary">
          Phase 1 skeleton — design tokens wired, Supabase connected, deployed on
          Vercel.
        </p>
      </div>
    </main>
  );
}
