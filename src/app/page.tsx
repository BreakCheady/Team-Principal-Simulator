import Link from "next/link";

const bereiche = [
  ["Team führen", "Personal, Verträge, Budget und Entwicklung greifen direkt ineinander."],
  ["Rennen entscheiden", "Training, Qualifying, Reifen, Sprit und Strategie bestimmen den Renntag."],
  ["Politik beherrschen", "Eigentümer, Sponsoren und Mitarbeiter verfolgen eigene Interessen."],
  ["Karriere aufbauen", "Neun Rennserien entwickeln sich parallel mit Transfers und wechselnden Kräfteverhältnissen."],
];

const serien = ["F1", "F2", "F3", "F4", "WEC", "GT3", "GT4", "INDYCAR", "RALLY"];

export default function Home() {
  return (
    <main className="tps-shell min-h-screen">
      <header className="border-b border-slate-800 bg-[#080b10]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-cyan-400 text-sm font-black italic text-slate-950">TP</span>
            <div>
              <p className="text-sm font-black uppercase tracking-wide">Team Principal</p>
              <p className="text-[10px] uppercase tracking-[.2em] text-zinc-500">Motorsport Manager</p>
            </div>
          </div>
          <Link href="/game" className="mm-button-primary">Spiel starten</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <article className="tps-panel-raised overflow-hidden">
            <div className="border-b border-slate-700 bg-gradient-to-r from-cyan-400/15 to-violet-500/10 px-5 py-4">
              <p className="tps-kicker">Motorsport-Managementsimulation</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">Dein Team. Deine Entscheidungen.</h1>
            </div>
            <div className="p-5 md:p-6">
              <p className="max-w-2xl text-base leading-7 text-zinc-400">
                Übernimm die Rolle des Teamchefs. Baue dein Team auf, manage Fahrer und Personal,
                entwickle das Auto, halte das Budget im Griff und triff während des Rennens die entscheidenden strategischen Entscheidungen.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/game" className="mm-button-primary">Neue Karriere starten</Link>
                <a href="#ueberblick" className="mm-button">Spiel ansehen</a>
              </div>
              <div className="mt-7 grid grid-cols-3 gap-2">
                <div className="mm-stat"><strong className="tps-number block text-2xl">9</strong><span className="text-xs text-zinc-500">Rennserien</span></div>
                <div className="mm-stat"><strong className="tps-number block text-2xl">116</strong><span className="text-xs text-zinc-500">Teams</span></div>
                <div className="mm-stat"><strong className="tps-number block text-2xl">1.600+</strong><span className="text-xs text-zinc-500">Fahrer & Personal</span></div>
              </div>
            </div>
          </article>

          <article className="tps-panel overflow-hidden">
            <div className="mm-section-title">Nächstes Rennwochenende</div>
            <div className="p-4">
              <div className="rounded-lg border border-slate-700 bg-[#0c1118] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">Runde 7</p>
                    <h2 className="mt-1 text-2xl font-black">Kanada</h2>
                    <p className="mt-1 text-sm text-zinc-500">Vancouver · 70 Runden</p>
                  </div>
                  <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-300">BEREIT</span>
                </div>
                <svg viewBox="0 0 400 180" className="mt-4 h-36 w-full" aria-label="Stilisierte Rennstrecke">
                  <path d="M50 125 C68 69 116 48 174 58 C225 67 226 24 286 38 C347 53 352 103 309 121 C259 141 237 106 198 130 C158 155 126 166 84 155 C64 150 50 140 50 125Z" fill="none" stroke="#344152" strokeWidth="13" strokeLinecap="round"/>
                  <path d="M50 125 C68 69 116 48 174 58 C225 67 226 24 286 38 C347 53 352 103 309 121 C259 141 237 106 198 130 C158 155 126 166 84 155 C64 150 50 140 50 125Z" fill="none" stroke="#29d3df" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="mm-stat"><span className="text-[10px] uppercase text-zinc-500">Wetter</span><b className="mt-1 block text-sm">Trocken</b></div>
                <div className="mm-stat"><span className="text-[10px] uppercase text-zinc-500">Ziel</span><b className="mt-1 block text-sm">P5</b></div>
                <div className="mm-stat"><span className="text-[10px] uppercase text-zinc-500">Budget</span><b className="mt-1 block text-sm">€87 Mio.</b></div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="ueberblick" className="border-y border-slate-800 bg-[#0b0f16]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="tps-kicker">Spielbereiche</p>
              <h2 className="mt-1 text-2xl font-black">Alles, was ein Teamchef kontrollieren muss</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {bereiche.map(([titel, text], index) => (
              <article key={titel} className="tps-panel overflow-hidden">
                <div className="mm-section-title"><span className="mr-2 text-cyan-300">0{index + 1}</span>{titel}</div>
                <p className="p-4 text-sm leading-6 text-zinc-400">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="tps-panel overflow-hidden">
          <div className="mm-section-title">Verfügbare Rennserien</div>
          <div className="flex flex-wrap gap-2 p-4">
            {serien.map((serie) => (
              <span key={serie} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold">{serie}</span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-[#080b10] px-4 py-6 text-xs text-zinc-600">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 md:px-2">
          <span>Team Principal Simulator</span>
          <span>Team · Technik · Strategie · Politik</span>
        </div>
      </footer>
    </main>
  );
}
