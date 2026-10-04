"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-3xl border border-red-950 bg-zinc-950 p-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-400">
          Team HQ interrupted
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          The current screen could not be rendered.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
          Your browser save is kept separately. Retry the screen first; if the
          problem persists, reload and restore the latest local save.
        </p>
        {error.digest ? (
          <p className="mt-4 text-xs text-zinc-600">Reference {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-950"
        >
          Retry screen
        </button>
      </section>
    </main>
  );
}
