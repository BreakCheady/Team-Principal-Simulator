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
  const career = flow.career;
  const world = career?.world;
  const team = world ? playerTeam(world) : null;
  const series = world ? getSeries(world.playerSeriesId) : null;
  const offeneThemen = flow.issues.filter((issue) => issue.status === "OPEN");
  const offeneAnfragen = career?.requests.filter((request) => ["OPEN", "ESCALATED"].includes(request.status)) ?? [];
  const angebote = career?.offers.filter((offer) => offer.status === "OPEN") ?? [];
  const naechsteRunde = flow.currentRound + 1;
  const nachrichten = world ? [...(world.activity ?? [])].filter((item) => item.seriesId === world.playerSeriesId).reverse().slice(0, 4) : [];
  const championship = world?.series.find((item) => item.seriesId === world.playerSeriesId);
  const teamRang = team && championship ? [...championship.teams].sort((a, b) => b.points - a.points).findIndex((entry) => entry.teamId === team.id) + 1 : 0;

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.65fr)]">
      <div className="space-y-3">
        <section className="tps-panel overflow-hidden">
          <div className="mm-section-title">Nächstes Rennwochenende</div>
          <div className="grid gap-3 p-4 md:grid-cols-[1fr_260px]">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">{series?.name ?? "Meisterschaft"} · Runde {naechsteRunde}</p>
                  <h2 className="mt-1 text-2xl font-black">Vorbereitung auf Runde {naechsteRunde}</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                    {offeneThemen.length ? offeneThemen.length + " offene Entscheidung" + (offeneThemen.length === 1 ? "" : "en") + " blockiert den Start des nächsten Wochenendes." : "Alle Pflichtentscheidungen sind erledigt. Das Team kann in das nächste Rennwochenende starten."}
                  </p>
                </div>
                <span className={"rounded px-2 py-1 text-[10px] font-black " + (offeneThemen.length ? "bg-amber-400/15 text-amber-300" : "bg-emerald-400/15 text-emerald-300")}>{offeneThemen.length ? "AKTION NÖTIG" : "BEREIT"}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="mm-stat"><p className="text-[10px] uppercase text-zinc-500">Fahrzeugtempo</p><p className="tps-number mt-1 text-xl font-black">{career?.car.pace ?? "—"}</p></div>
                <div className="mm-stat"><p className="text-[10px] uppercase text-zinc-500">Zuverlässigkeit</p><p className="tps-number mt-1 text-xl font-black">{career?.car.reliability ?? "—"}</p></div>
                <div className="mm-stat"><p className="text-[10px] uppercase text-zinc-500">Teamwertung</p><p className="tps-number mt-1 text-xl font-black">{teamRang ? "P" + teamRang : "—"}</p></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={onStartNextRound} disabled={offeneThemen.length > 0 || flow.complete} className="mm-button-primary disabled:opacity-40">{flow.complete ? "Saison abgeschlossen" : "Runde " + naechsteRunde + " starten"}</button>
                <button onClick={() => onNavigate("RACING")} className="mm-button">Meisterschaft öffnen</button>
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-[#0c1118] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Teamstatus</p>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-zinc-500">Kassenbestand</dt><dd className="font-bold">€{getCashBalance(flow.political).toFixed(2)} Mio.</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-zinc-500">Offene Themen</dt><dd className="font-bold">{offeneThemen.length}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-zinc-500">Vorstandswarnungen</dt><dd className="font-bold">{career?.warnings ?? 0}/2</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-zinc-500">Team</dt><dd className="max-w-36 truncate font-bold">{team?.name ?? "Team"}</dd></div>
              </dl>
              <button onClick={() => onNavigate("FINANCE")} className="mt-4 w-full mm-button">Finanzen öffnen</button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <article className="tps-panel overflow-hidden">
            <div className="mm-section-title">Fahrer</div>
            <div className="divide-y divide-slate-800">
              {team?.drivers.slice(0, 3).map((id, index) => {
                const fahrer = world?.people.find((person) => person.id === id);
                return (
                  <div key={id} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 px-4 py-3">
                    <span className="grid h-8 w-8 place-items-center rounded bg-slate-800 text-xs font-black text-cyan-300">{index + 1}</span>
                    <div><p className="text-sm font-bold">{fahrer?.name ?? id}</p><p className="text-[11px] text-zinc-500">Fahrer {index + 1} · {fahrer?.nationality ?? "—"}</p></div>
                    <div className="text-right"><p className="tps-number font-black">{fahrer?.skill ?? "—"}</p><p className="text-[10px] uppercase text-zinc-600">Stärke</p></div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="tps-panel overflow-hidden">
            <div className="mm-section-title">Entscheidungen</div>
            <div className="divide-y divide-slate-800 text-sm">
              <button onClick={() => onNavigate("INBOX")} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-800/40"><span>Posteingang</span><b className="rounded bg-amber-400/10 px-2 py-1 text-amber-300">{offeneThemen.length}</b></button>
              <button onClick={() => onNavigate("CAREER")} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-800/40"><span>Anfragen aus dem Team</span><b>{offeneAnfragen.length}</b></button>
              <button onClick={() => onNavigate("MARKET")} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-800/40"><span>Angebote anderer Teams</span><b>{angebote.length}</b></button>
            </div>
          </article>
        </section>
      </div>

      <aside className="space-y-3">
        <section className="tps-panel overflow-hidden">
          <div className="mm-section-title">Paddock-Nachrichten</div>
          <div className="divide-y divide-slate-800">
            {nachrichten.length ? nachrichten.map((item) => (
              <div key={item.id} className="p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-300">{item.type.replaceAll("_", " ")}</p>
                <p className="mt-1 text-sm font-semibold">{item.headline}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{item.detail}</p>
              </div>
            )) : <p className="p-4 text-sm text-zinc-500">Derzeit gibt es keine neuen Meldungen.</p>}
          </div>
          {world ? <button onClick={() => onNavigate("WORLD")} className="m-3 mt-0 mm-button">Motorsport-Welt öffnen</button> : null}
        </section>

        <section className="tps-panel overflow-hidden">
          <div className="mm-section-title">Schnellzugriff</div>
          <div className="grid grid-cols-2 gap-2 p-3 text-sm">
            <button onClick={() => onNavigate("DEVELOPMENT")} className="mm-button">Entwicklung</button>
            <button onClick={() => onNavigate("MARKET")} className="mm-button">Transfermarkt</button>
            <button onClick={() => onNavigate("CAREER")} className="mm-button">Vorstand</button>
            <button onClick={() => onNavigate("RACING")} className="mm-button">Rennen</button>
          </div>
        </section>
      </aside>
    </div>
  );
}