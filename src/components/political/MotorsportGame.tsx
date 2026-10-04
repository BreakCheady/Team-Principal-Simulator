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
      const raw = window.localStorage.getItem(
        "team-principal-simulator-v03-rounds",
      );
      if (!raw) throw new Error("No local save found.");
      setFlow(decodeSave<RoundFlowState>(raw, "ROUND_FLOW").state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load save.");
    }
  }
  if (flow)
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <header>
          <p className="text-xs uppercase tracking-widest text-sky-400">
            Team Principal Simulator
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {flow.career?.world
              ? preview.teams.find(
                  (t) => t.id === flow.career!.world!.playerTeamId,
                )?.name
              : "Legacy career"}
          </h1>
        </header>
        <RoundEventsPanel
          key={flow.career?.world?.playerTeamId ?? "legacy"}
          initialState={flow.political}
          events={demoRoundEvents}
          issueDefinitions={demoIssueDefinitions}
          afterRound={flow.currentRound}
          initialFlow={flow}
          onChooseCareer={() => setFlow(null)}
        />
      </main>
    );
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10">
      <header>
        <p className="text-xs uppercase tracking-widest text-sky-400">
          Team Principal Simulator · Motorsport World
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Start your career</h1>
        <p className="mt-4 max-w-3xl text-zinc-400">
          Choose a championship and a fictional team. Start in preseason,
          prepare your lineup and budget, then race a complete season from round
          1.
        </p>
        <p className="mt-3 text-sm text-sky-300">
          9 series · {preview.teams.length} teams ·{" "}
          {preview.people.filter((p) => p.role === "DRIVER").length} drivers ·{" "}
          {preview.people.filter((p) => p.role !== "DRIVER").length} staff
        </p>
      </header>
      <section>
        <h2 className="text-xl font-semibold">Choose series</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {SERIES.map((s) => (
            <button
              key={s.id}
              aria-pressed={series === s.id}
              onClick={() => {
                setSeries(s.id);
                setSelected(`team_${s.id.toLowerCase()}_0`);
                setError("");
              }}
              className={`rounded-2xl border p-4 text-left ${series === s.id ? "border-sky-500 bg-sky-950/50" : "border-zinc-800 bg-zinc-950"}`}
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
      <section>
        <h2 className="text-xl font-semibold">Choose team · {cfg.name}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {teams.map((t) => (
            <button
              key={t.id}
              aria-pressed={team.id === t.id}
              onClick={() => setSelected(t.id)}
              className={`rounded-2xl border p-4 text-left ${team.id === t.id ? "border-emerald-500 bg-emerald-950/30" : "border-zinc-800"}`}
            >
              <span className="font-semibold">{t.name}</span>
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
      <section className="rounded-2xl border border-zinc-800 p-6">
        <h2 className="text-xl font-semibold">{team.name}</h2>
        <p className="mt-3 text-sm text-zinc-400">
          Full {cfg.rounds}-race calendar · {cfg.driversPerTeam} occupied driver
          seats · Technical, sporting and engineering staff · New contracts and
          empty championship tables.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-xl bg-sky-300 px-6 py-3 font-semibold text-sky-950"
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
            className="rounded-xl border border-zinc-700 px-5 py-3"
            onClick={load}
          >
            Load existing career
          </button>
        </div>
        {error ? <p className="mt-4 text-amber-300">{error}</p> : null}
      </section>
    </main>
  );
}
