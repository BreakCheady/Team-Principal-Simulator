import Link from "next/link";

const funktionen = [
  ["Team führen", "Fahrer, Personal, Verträge, Finanzen und Entwicklung unter einem Dach."],
  ["Rennen entscheiden", "Training, Qualifying, Strategie, Boxenstopps, Wetter und Zwischenfälle."],
  ["Paddock beherrschen", "Eigentümer, Sponsoren und Schlüsselpersonen verfolgen eigene Interessen."],
  ["Karriere aufbauen", "Neun Rennserien, ein lebendiger Transfermarkt und mehrere Saisons."],
];

const serien = ["F1", "F2", "F3", "F4", "WEC", "GT3", "GT4", "INDYCAR", "RALLY"];

export default function Home() {
  return (
    <main className="mm-app min-h-screen">
      <div className="mm-topbar">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-cyan-400 font-black text-slate-950">TP</div>
            <div>
              <p className="text-sm font-black tracking-wide">TEAM PRINCIPAL</p>
              <p className="text-[10px] uppercase tracking-[.18em] text-slate-500">Simulator</p>
            </div>
          </div>
          <Link href="/game" className="mm-button mm-button-primary">Spiel starten</Link>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.25fr]">
          <div className="mm-panel overflow-hidden">
            <div className="mm-panel-header">Deine Karriere</div>
            <div className="p-6 md:p-8">
              <p className="mm-label text-cyan-300">Motorsport-Management</p>
              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight md:text-5xl">
                Führe dein Team.<br />
                Gewinne die Meisterschaft.
              </h1>
              <p className="mt-5 max-w-xl leading-7 text-slate-400">
                Übernimm die Rolle des Teamchefs und entscheide über Fahrer, Personal,
                Technik, Verträge, Budget und Rennstrategie. Jede Entscheidung wirkt sich
                auf Leistung, Politik und Zukunft deines Teams aus.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/game" className="mm-button mm-button-primary px-6 py-3">Neue Karriere</Link>
                <a href="#funktionen" className="mm-button px-6 py-3">Mehr erfahren</a>
              </div>
            </div>
          </div>

          <div className="mm-panel mm-track overflow-hidden">
            <div className="mm-panel-header flex items-center justify-between">
              <span>Nächstes Rennen</span>
              <span className="text-cyan-300">Runde 7 / 18</span>
            </div>
            <div className="grid min-h-[320px] gap-5 p-5 md:grid-cols-[1.3fr_.7fr]">
              <div className="flex flex-col justify-between rounded-lg border border-slate-700/70 bg-black/20 p-5">
                <div>
                  <p className="mm-label">Kanada</p>
                  <h2 className="mt-2 text-4xl font-black">VANCOUVER</h2>
                  <p className="mt-2 text-sm text-slate-400">57 Runden · 193 Meilen</p>
                </div>
                <svg viewBox="0 0 360 170" className="my-4 w-full" aria-label="Abstrakter Rennkurs">
                  <path d="M38 118 C62 57 108 42 154 64 C198 84 205 29 254 35 C311 42 334 84 295 106 C248 132 221 99 184 121 C143 146 105 152 66 140 C48 135 38 128 38 118Z" fill="none" stroke="#f2f6fb" strokeWidth="9" strokeLinecap="round"/>
                  <path d="M38 118 C62 57 108 42 154 64 C198 84 205 29 254 35 C311 42 334 84 295 106 C248 132 221 99 184 121 C143 146 105 152 66 140 C48 135 38 128 38 118Z" fill="none" stroke="#161e2f" strokeWidth="4" strokeLinecap="round"/>
                </svg>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div><p className="mm-label">Training</p><p className="mt-1">Trocken</p></div>
                  <div><p className="mm-label">Qualifying</p><p className="mt-1">Trocken</p></div>
                  <div><p className="mm-label">Rennen</p><p className="mt-1">Bewölkt</p></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-700/70 bg-black/20 p-4">
                  <p className="mm-label">Teamstatus</p>
                  <p className="mt-2 text-2xl font-black text-emerald-300">STABIL</p>
                </div>
                <div className="rounded-lg border border-slate-700/70 bg-black/20 p-4">
                  <p className="mm-label">Saisonziel</p>
                  <p className="mt-2 font-bold">Top 5</p>
                  <div className="mm-progress mt-3"><span style={{ width: "64%" }} /></div>
                </div>
                <div className="rounded-lg border border-slate-700/70 bg-black/20 p-4">
                  <p className="mm-label">Offene Aufgaben</p>
                  <p className="mt-2 text-3xl font-black text-amber-300">3</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="funktionen" className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {funktionen.map(([titel, text], index) => (
            <article key={titel} className="mm-panel overflow-hidden">
              <div className="mm-panel-header">0{index + 1}</div>
              <div className="p-5">
                <h3 className="font-bold">{titel}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mm-panel p-5">
          <p className="mm-label">Verfügbare Rennserien</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {serien.map((serie) => <span key={serie} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold">{serie}</span>)}
          </div>
        </div>
      </section>
    </main>
  );
}
