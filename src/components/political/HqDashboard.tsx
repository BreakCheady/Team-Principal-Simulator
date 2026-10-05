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

const panel = "tps-panel p-5";

export function HqDashboard({ flow, onNavigate, onStartNextRound }: Props) {
  const career = flow.career;
  const world = career?.world;
  const team = world ? playerTeam(world) : null;
  const series = world ? getSeries(world.playerSeriesId) : null;
  const openIssues = flow.issues.filter((issue) => issue.status === "OPEN");
  const openRequests = career?.requests.filter((request) =>
    ["OPEN", "ESCALATED"].includes(request.status),
  ) ?? [];
  const openOffers = career?.offers.filter((offer) => offer.status === "OPEN") ?? [];
  const nextRound = flow.currentRound + 1;
  const latestNews = world
    ? [...(world.activity ?? [])]
        .filter((item) => item.seriesId === world.playerSeriesId)
        .reverse()
        .slice(0, 3)
    : [];
  const championship = world?.series.find((item) => item.seriesId === world.playerSeriesId);
  const teamStanding = team && championship
    ? [...championship.teams]
        .sort((a, b) => b.points - a.points)
        .findIndex((entry) => entry.teamId === team.id) + 1
    : 0;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[1.45fr_.55fr]">
        <article className="tps-panel tps-track-grid overflow-hidden p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="tps-kicker">Next race weekend</p>
              <h3 className="mt-3 text-3xl font-bold tracking-tight">
                {series ? series.name + " · Round " + nextRound : "Round " + nextRound}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                {openIssues.length
                  ? openIssues.length + " inbox decision" + (openIssues.length === 1 ? "" : "s") + " must be resolved before the team can move on."
                  : "The team is clear to proceed. Finalize preparation and open the race weekend when ready."}
              </p>
            </div>
            <span className={
              "rounded-full px-3 py-1.5 text-xs font-bold " +
              (openIssues.length
                ? "bg-amber-400/10 text-amber-300"
                : "bg-emerald-400/10 text-emerald-300")
            }>
              {openIssues.length ? "ACTION REQUIRED" : "READY"}
            </span>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Car pace</p>
              <p className="tps-number mt-2 text-3xl font-bold">{career?.car.pace ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Reliability</p>
              <p className="tps-number mt-2 text-3xl font-bold">{career?.car.reliability ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Constructors</p>
              <p className="tps-number mt-2 text-3xl font-bold">{teamStanding ? "P" + teamStanding : "—"}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onStartNextRound}
              disabled={openIssues.length > 0 || flow.complete}
              className="rounded-xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              {flow.complete ? "Season complete" : "Start round " + nextRound}
            </button>
            <button onClick={() => onNavigate("RACING")} className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-zinc-300 hover:border-slate-500">
              Championship
            </button>
          </div>
        </article>

        <article className={panel}>
          <p className="tps-kicker">Team health</p>
          <div className="mt-5 space-y-5">
            <div>
              <div className="flex justify-between text-sm"><span className="text-zinc-500">Cash</span><strong>€{getCashBalance(flow.political).toFixed(2)}m</strong></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-2/3 rounded-full bg-emerald-400" /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm"><span className="text-zinc-500">Open issues</span><strong>{openIssues.length}</strong></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-amber-400" style={{ width: Math.min(100, openIssues.length * 22) + "%" }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm"><span className="text-zinc-500">Board warnings</span><strong>{career?.warnings ?? 0}/2</strong></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-rose-400" style={{ width: Math.min(100, (career?.warnings ?? 0) * 50) + "%" }} /></div>
            </div>
          </div>
          <button onClick={() => onNavigate("CAREER")} className="mt-6 text-sm font-semibold text-cyan-300 hover:text-cyan-200">Open board report →</button>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className={panel}>
          <div className="flex items-center justify-between">
            <div><p className="tps-kicker">Priority</p><h3 className="mt-2 text-lg font-semibold">Decision queue</h3></div>
            <span className="tps-number text-3xl font-bold">{openIssues.length + openRequests.length + openOffers.length}</span>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <button onClick={() => onNavigate("INBOX")} className="flex w-full justify-between rounded-lg border border-slate-800 p-3 text-left hover:border-slate-600"><span>Inbox issues</span><strong>{openIssues.length}</strong></button>
            <button onClick={() => onNavigate("CAREER")} className="flex w-full justify-between rounded-lg border border-slate-800 p-3 text-left hover:border-slate-600"><span>Actor initiatives</span><strong>{openRequests.length}</strong></button>
            <button onClick={() => onNavigate("MARKET")} className="flex w-full justify-between rounded-lg border border-slate-800 p-3 text-left hover:border-slate-600"><span>Rival approaches</span><strong>{openOffers.length}</strong></button>
          </div>
        </article>

        <article className={panel}>
          <p className="tps-kicker">Team</p>
          <h3 className="mt-2 text-lg font-semibold">{team?.name ?? "Legacy team"}</h3>
          <div className="mt-5 space-y-3">
            {team?.drivers.slice(0, 3).map((id, index) => {
              const driver = world?.people.find((person) => person.id === id);
              return (
                <div key={id} className="flex items-center justify-between rounded-lg border border-slate-800 p-3">
                  <div><span className="text-xs text-zinc-600">DRIVER {index + 1}</span><p className="font-medium">{driver?.name ?? id}</p></div>
                  <strong className="tps-number text-cyan-300">{driver?.skill ?? "—"}</strong>
                </div>
              );
            })}
          </div>
          <button onClick={() => onNavigate("DEVELOPMENT")} className="mt-5 text-sm font-semibold text-cyan-300 hover:text-cyan-200">Open performance →</button>
        </article>

        <article className={panel}>
          <p className="tps-kicker">Paddock wire</p>
          <h3 className="mt-2 text-lg font-semibold">World activity</h3>
          <div className="mt-5 space-y-4">
            {latestNews.length ? latestNews.map((item) => (
              <div key={item.id} className="border-b border-slate-800 pb-3 last:border-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">{item.type.replaceAll("_", " ")}</p>
                <p className="mt-1 text-sm font-medium">{item.headline}</p>
              </div>
            )) : <p className="text-sm text-zinc-500">The paddock is quiet for now.</p>}
          </div>
          {world ? <button onClick={() => onNavigate("WORLD")} className="mt-5 text-sm font-semibold text-cyan-300 hover:text-cyan-200">Open motorsport world →</button> : null}
        </article>
      </section>
    </div>
  );
}
