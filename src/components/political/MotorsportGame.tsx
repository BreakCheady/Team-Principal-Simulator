"use client";
import { useState } from "react";
import { SERIES, type SeriesId } from "@/game/world/series";
import { createWorld } from "@/game/world/world";
import { createNewCareer } from "@/game/world/start";
import { decodeSave } from "@/game/save/save-game";
import type { RoundFlowState } from "@/game/season/round-flow";
import { RoundEventsPanel } from "./RoundEventsPanel";
import { demoIssueDefinitions } from "@/game/data/demo-issues";
import { demoRoundEvents } from "@/game/data/demo-round-events";
export function MotorsportGame() {
  const [preview] = useState(() => createWorld()),
    [series, setSeries] = useState<SeriesId>("F1"),
    [selected, setSelected] = useState("team_f1_10"),
    [flow, setFlow] = useState<RoundFlowState | null>(null),
    [error, setError] = useState("");
  const cfg = SERIES.find((s) => s.id === series)!,
    teams = preview.teams.filter((t) => t.seriesId === series),
    team = teams.find((t) => t.id === selected) ?? teams[0];
  function load() {
    try {
      const raw =
        window.localStorage.getItem("team-principal-simulator-v11-rounds") ??
        window.localStorage.getItem("team-principal-simulator-v03-rounds");
      if (!raw) throw new Error("No local save found.");
      setFlow(decodeSave<RoundFlowState>(raw, "ROUND_FLOW").state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load save.");
    }
  }
  if (flow)
    return (
      <main className="tps-shell min-h-screen px-4 py-6 md:px-6">
        <header className="mx-auto flex max-w-[1600px] items-end justify-between gap-4">
          <div>
          <p className="tps-kicker">Team Principal Simulator</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {flow.career?.world
              ? preview.teams.find(
                  (t) => t.id === flow.career!.world!.playerTeamId,
                )?.name
              : "Legacy career"}
          </h1>
          </div>
          <span className="hidden rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-zinc-500 md:block">
            Race operations online
          </span>
        </header>
        <div className="mx-auto max-w-[1600px]">
        <RoundEventsPanel
          key={flow.career?.world?.playerTeamId ?? "legacy"}
          initialState={flow.political}
          events={demoRoundEvents}
          issueDefinitions={demoIssueDefinitions}
          afterRound={flow.currentRound}
          initialFlow={flow}
          onChooseCareer={() => setFlow(null)}
        />
        </div>
      </main>
    );
  return (
    <main className="tps-shell min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="tps-panel tps-track-grid overflow-hidden p-6 md:p-8">
        <p className="tps-kicker">Team Principal Simulator · Career setup</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-.04em] md:text-6xl">Choose your paddock.</h1>
        <p className="mt-4 max-w-3xl text-zinc-400">
          Choose a championship and a fictional team. Start in preseason,
          prepare your lineup and budget, then race a complete season from round
          1.
        </p>
        <p className="mt-5 text-sm font-semibold text-cyan-300">
          9 series · {preview.teams.length} teams ·{" "}
          {preview.people.filter((p) => p.role === "DRIVER").length} drivers ·{" "}
          {preview.people.filter((p) => p.role !== "DRIVER").length} staff
        </p>
      </header>
      <section className="tps-panel p-5 md:p-6">
        <div className="flex items-end justify-between gap-4">
          <div><p className="tps-kicker">Step 01</p><h2 className="mt-2 text-xl font-semibold">Choose series</h2></div>
          <span className="text-xs text-zinc-600">9 championships</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERIES.map((s) => (
            <button
              key={s.id}
              aria-pressed={series === s.id}
              onClick={() => {
                setSeries(s.id);
                setSelected(`team_${s.id.toLowerCase()}_0`);
                setError("");
              }}
              className={`rounded-2xl border p-5 text-left transition ${series === s.id ? "border-cyan-400/50 bg-cyan-400/10 shadow-[inset_3px_0_0_rgba(94,231,255,.8)]" : "border-slate-800 bg-black/20 hover:border-slate-600"}`}
            >
              <span className="font-semibold">{s.name}</span>
              <span className="mt-2 block text-sm text-zinc-400">
                {s.teamNames.length} teams · {s.driversPerTeam} cars/team ·{" "}
                {s.rounds} races
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-zinc-400">{cfg.description}</p>
      </section>
      <section className="tps-panel p-5 md:p-6">
        <p className="tps-kicker">Step 02</p>
        <h2 className="mt-2 text-xl font-semibold">Choose team · {cfg.name}</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => (
            <button
              key={t.id}
              aria-pressed={team.id === t.id}
              onClick={() => setSelected(t.id)}
              className={`rounded-2xl border p-5 text-left transition ${team.id === t.id ? "border-emerald-400/50 bg-emerald-400/10 shadow-[inset_3px_0_0_rgba(82,229,163,.8)]" : "border-slate-800 bg-black/20 hover:border-slate-600"}`}
            >
              <span className="font-semibold">{t.name}{t.classId ? ` · ${t.classId === "HYPERCAR" ? "Hypercar" : "LMGT3"}` : ""}</span>
              <span className="mt-2 block text-sm text-zinc-400">
                Pace {t.pace} · Reliability {t.reliability} · Budget €
                {t.budget.toFixed(2)}m
              </span>
              <span className="mt-2 block text-xs text-zinc-500">
                {t.drivers
                  .map((id) => preview.people.find((p) => p.id === id)!.name)
                  .join(", ")}
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="tps-panel tps-track-grid p-6 md:p-7">
        <h2 className="text-xl font-semibold">{team.name}</h2>
        <p className="mt-3 text-sm text-zinc-400">
          Full {cfg.rounds}-race calendar · {cfg.driversPerTeam} occupied driver
          seats · Technical, sporting and engineering staff · New contracts and
          empty championship tables.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-xl bg-cyan-300 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-200"
            onClick={() => {
              try {
                setFlow(createNewCareer(series, team.id));
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Could not create career.",
                );
              }
            }}
          >
            Start season from round 1
          </button>
          <button
            className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-zinc-300 hover:border-slate-500"
            onClick={load}
          >
            Load existing career
          </button>
        </div>
        {error ? <p className="mt-4 text-amber-300">{error}</p> : null}
      </section>
      </div>
    </main>
  );
}
