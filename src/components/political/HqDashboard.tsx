"use client";

import type { RoundFlowState } from "@/game/season/round-flow";
import { getCashBalance } from "@/game/finance/finances";
import { getSeries } from "@/game/world/series";
import { playerTeam } from "@/game/world/world";

type Props = {
  flow: RoundFlowState;
  onNavigate: (tab: "INBOX" | "RACING" | "MARKET" | "DEVELOPMENT" | "FINANCE" | "WORLD" | "CAREER") => void;
  onStartNextRound: () => void;
};

export function HqDashboard({ flow, onNavigate, onStartNextRound }: Props) {
  const karriere = flow.career;
  const welt = karriere?.world;
  const team = welt ? playerTeam(welt) : null;
  const serie = welt ? getSeries(welt.playerSeriesId) : null;
  const offeneThemen = flow.issues.filter((issue) => issue.status === "OPEN");
  const anfragen = karriere?.requests.filter((request) =>
    ["OPEN", "ESCALATED"].includes(request.status),
  ) ?? [];
  const angebote = karriere?.offers.filter((offer) => offer.status === "OPEN") ?? [];
  const naechsteRunde = flow.currentRound + 1;
  const serienstand = welt?.series.find((item) => item.seriesId === welt.playerSeriesId);
  const teamPosition = team && serienstand
    ? [...serienstand.teams].sort((a, b) => b.points - a.points).findIndex((x) => x.teamId === team.id) + 1
    : 0;
  const fahrer = team?.drivers.slice(0, 2).map((id) => welt?.people.find((p) => p.id === id)) ?? [];
  const meldungen = welt
    ? [...(welt.activity ?? [])].filter((a) => a.seriesId === welt.playerSeriesId).reverse().slice(0, 4)
    : [];

  return (
    <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_280px]">
      <aside className="space-y-4">
        <section className="mm-panel overflow-hidden">
          <div className="mm-panel-header">Team</div>
          <div className="p-4">
            <p className="text-lg font-black">{team?.name ?? "Dein Rennstall"}</p>
            <p className="mt-1 text-xs text-slate-500">{serie?.name ?? "Meisterschaft"}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <p className="mm-label">Meisterschaft</p>
                <p className="mm-value mt-1 text-2xl">{teamPosition ? "P" + teamPosition : "—"}</p>
              </div>
              <div>
                <p className="mm-label">Budget</p>
                <p className="mm-value mt-1 text-lg text-emerald-300">€{getCashBalance(flow.political).toFixed(1)}m</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Fahrzeugleistung</span><b>{karriere?.car.pace ?? "—"}</b></div>
              <div className="mm-progress mt-2"><span style={{ width: Math.min(100, karriere?.car.pace ?? 0) + "%" }} /></div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Zuverlässigkeit</span><b>{karriere?.car.reliability ?? "—"}</b></div>
              <div className="mm-progress mt-2"><span style={{ width: Math.min(100, karriere?.car.reliability ?? 0) + "%", background: "#50d890" }} /></div>
            </div>
          </div>
        </section>

        <section className="mm-panel overflow-hidden">
          <div className="mm-panel-header">Fahrer</div>
          <div className="divide-y divide-slate-700/60">
            {fahrer.map((person, index) => (
              <div key={person?.id ?? index} className="flex items-center justify-between p-4">
                <div>
                  <p className="mm-label">Fahrer {index + 1}</p>
                  <p className="mt-1 text-sm font-bold">{person?.name ?? "Unbesetzt"}</p>
                </div>
                <div className="text-right">
                  <p className="mm-value text-xl text-cyan-300">{person?.skill ?? "—"}</p>
                  <p className="text-[10px] text-slate-500">Stärke</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <main className="space-y-4">
        <section className="mm-panel mm-track overflow-hidden">
          <div className="mm-panel-header flex items-center justify-between">
            <span>Nächstes Rennwochenende</span>
            <span className={offeneThemen.length ? "text-amber-300" : "text-emerald-300"}>
              {offeneThemen.length ? "ENTSCHEIDUNG NÖTIG" : "BEREIT"}
            </span>
          </div>
          <div className="grid gap-5 p-5 md:grid-cols-[1fr_180px]">
            <div>
              <p className="mm-label">{serie?.name ?? "Meisterschaft"}</p>
              <h2 className="mt-2 text-3xl font-black">Runde {naechsteRunde}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                {offeneThemen.length
                  ? offeneThemen.length + " offene " + (offeneThemen.length === 1 ? "Entscheidung blockiert" : "Entscheidungen blockieren") + " den Start der nächsten Runde."
                  : "Dein Team ist bereit. Starte die nächste Runde, sobald deine Vorbereitung abgeschlossen ist."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={onStartNextRound}
                  disabled={offeneThemen.length > 0 || flow.complete}
                  className="mm-button mm-button-primary px-5 py-3 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {flow.complete ? "Saison beendet" : "Runde " + naechsteRunde + " starten"}
                </button>
                <button onClick={() => onNavigate("RACING")} className="mm-button px-5 py-3">Meisterschaft ansehen</button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <svg viewBox="0 0 180 120" className="w-full max-w-[180px]" aria-label="Rennstrecke">
                <path d="M22 78 C35 36 61 24 84 39 C111 55 109 17 137 27 C165 37 165 67 142 74 C116 82 106 68 87 84 C64 102 36 99 22 78Z" fill="none" stroke="#eef4fb" strokeWidth="7" strokeLinecap="round"/>
                <path d="M22 78 C35 36 61 24 84 39 C111 55 109 17 137 27 C165 37 165 67 142 74 C116 82 106 68 87 84 C64 102 36 99 22 78Z" fill="none" stroke="#182136" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="mm-panel overflow-hidden">
            <div className="mm-panel-header flex items-center justify-between">
              <span>Posteingang</span>
              <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950">{offeneThemen.length}</span>
            </div>
            <div className="p-4">
              {offeneThemen.length ? (
                <div className="space-y-2">
                  {offeneThemen.slice(0, 3).map((thema) => (
                    <div key={thema.id} className="rounded-md border border-slate-700 bg-black/15 p-3">
                      <p className="text-sm font-bold">{thema.title}</p>
                      <p className="mt-1 text-xs text-slate-500">Kategorie: {thema.category}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">Keine offenen Entscheidungen.</p>}
              <button onClick={() => onNavigate("INBOX")} className="mm-button mt-4 w-full">Posteingang öffnen</button>
            </div>
          </section>

          <section className="mm-panel overflow-hidden">
            <div className="mm-panel-header">Teamleitung</div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-black/20 p-3"><p className="mm-label">Anfragen</p><p className="mm-value mt-2 text-2xl">{anfragen.length}</p></div>
                <div className="rounded-md bg-black/20 p-3"><p className="mm-label">Angebote</p><p className="mm-value mt-2 text-2xl">{angebote.length}</p></div>
                <div className="rounded-md bg-black/20 p-3"><p className="mm-label">Warnungen</p><p className="mm-value mt-2 text-2xl">{karriere?.warnings ?? 0}</p></div>
              </div>
              <button onClick={() => onNavigate("CAREER")} className="mm-button mt-4 w-full">Vorstand & Karriere</button>
            </div>
          </section>
        </div>
      </main>

      <aside className="space-y-4">
        <section className="mm-panel overflow-hidden">
          <div className="mm-panel-header">Anstehend</div>
          <div className="divide-y divide-slate-700/60">
            <button onClick={() => onNavigate("DEVELOPMENT")} className="block w-full p-4 text-left hover:bg-white/[.025]">
              <p className="mm-label">Technik</p><p className="mt-1 text-sm font-bold">Fahrzeugentwicklung prüfen</p>
            </button>
            <button onClick={() => onNavigate("MARKET")} className="block w-full p-4 text-left hover:bg-white/[.025]">
              <p className="mm-label">Personal</p><p className="mt-1 text-sm font-bold">{angebote.length ? angebote.length + " Transferangebot" + (angebote.length === 1 ? "" : "e") : "Transfermarkt prüfen"}</p>
            </button>
            <button onClick={() => onNavigate("FINANCE")} className="block w-full p-4 text-left hover:bg-white/[.025]">
              <p className="mm-label">Finanzen</p><p className="mt-1 text-sm font-bold">Budget kontrollieren</p>
            </button>
          </div>
        </section>

        <section className="mm-panel overflow-hidden">
          <div className="mm-panel-header">Paddock-Nachrichten</div>
          <div className="divide-y divide-slate-700/60">
            {meldungen.length ? meldungen.map((meldung) => (
              <div key={meldung.id} className="p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-300">{meldung.type.replaceAll("_", " ")}</p>
                <p className="mt-1 text-xs leading-5">{meldung.headline}</p>
              </div>
            )) : <p className="p-4 text-sm text-slate-500">Noch keine Meldungen aus dem Fahrerlager.</p>}
          </div>
          {welt ? <button onClick={() => onNavigate("WORLD")} className="mm-button m-3 mt-0 w-[calc(100%-1.5rem)]">Motorsport-Welt öffnen</button> : null}
        </section>
      </aside>
    </div>
  );
}
