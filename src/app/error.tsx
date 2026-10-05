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
      <section className="w-full mm-panel border-red-950 p-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-400">
          Teamzentrale unterbrochen
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          Diese Ansicht konnte nicht dargestellt werden.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
          Dein lokaler Spielstand bleibt erhalten. Versuche die Ansicht zuerst erneut; falls das Problem bestehen bleibt, lade die Seite neu und stelle den letzten lokalen Spielstand wieder her.
        </p>
        {error.digest ? (
          <p className="mt-4 text-xs text-zinc-600">Referenz {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 mm-button mm-button-primary mt-6"
        >
          Ansicht erneut laden
        </button>
      </section>
    </main>
  );
}
