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
      if (!raw) throw new Error("Kein lokaler Spielstand gefunden.");
      setFlow(decodeSave<RoundFlowState>(raw, "ROUND_FLOW").state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Spielstand konnte nicht geladen werden.");
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
              : "Ältere Karriere"}
          </h1>
          </div>
          <span className="hidden rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-zinc-500 md:block">
            Rennbetrieb aktiv
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
    <main className="tps-shell min-h-screen px-3 py-4 md:px-5">
      <div className="mx-auto max-w-[1450px] space-y-4">
      <header className="tps-panel-raised overflow-hidden p-5 md:p-6">
        <p className="tps-kicker">Team Principal Simulator · Karriere erstellen</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight md:text-4xl">Wähle deine Rennserie.</h1>
        <p className="mt-4 max-w-3xl text-zinc-400">
          Wähle eine Rennserie und ein fiktives Team. Du startest in der Vorsaison,
          stellst Fahrer, Personal und Budget auf und bestreitest anschließend die komplette Saison ab Runde 1.
        </p>
        <p className="mt-5 text-sm font-semibold text-cyan-300">
          9 Rennserien · {preview.teams.length} Teams ·{" "}
          {preview.people.filter((p) => p.role === "DRIVER").length} Fahrer ·{" "}
          {preview.people.filter((p) => p.role !== "DRIVER").length} Mitarbeiter
        </p>
      </header>
      <section className="tps-panel overflow-hidden">
        <div className="flex items-end justify-between gap-4">
          <div><p className="tps-kicker">Schritt 01</p><h2 className="mt-2 text-xl font-semibold">Rennserie wählen</h2></div>
          <span className="text-xs text-zinc-600">9 Meisterschaften</span>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
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
                {s.teamNames.length} Teams · {s.driversPerTeam} Fahrzeuge/Team ·{" "}
                {s.rounds} Rennen
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-zinc-400">{cfg.description}</p>
      </section>
      <section className="tps-panel p-5 md:p-6">
        <p className="tps-kicker">Schritt 02</p>
        <h2 className="mt-2 text-xl font-semibold">Team wählen · {cfg.name}</h2>
        <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => (
            <button
              key={t.id}
              aria-pressed={team.id === t.id}
              onClick={() => setSelected(t.id)}
              className={`rounded-2xl border p-5 text-left transition ${team.id === t.id ? "border-emerald-400/50 bg-emerald-400/10 shadow-[inset_3px_0_0_rgba(82,229,163,.8)]" : "border-slate-800 bg-black/20 hover:border-slate-600"}`}
            >
              <span className="font-semibold">{t.name}{t.classId ? ` · ${t.classId === "HYPERCAR" ? "Hypercar" : "LMGT3"}` : ""}</span>
              <span className="mt-2 block text-sm text-zinc-400">
                Tempo {t.pace} · Zuverlässigkeit {t.reliability} · Budget €
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
      <section className="tps-panel-raised p-4 md:p-5">
        <h2 className="text-xl font-semibold">{team.name}</h2>
        <p className="mt-3 text-sm text-zinc-400">
          Kompletter Kalender mit {cfg.rounds} Rennen · {cfg.driversPerTeam} occupied driver
          seats · Technical, sporting and engineering Mitarbeiter · New contracts and
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
                  e instanceof Error ? e.message : "Karriere konnte nicht erstellt werden.",
                );
              }
            }}
          >
            Saison ab Runde 1 starten
          </button>
          <button
            className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-zinc-300 hover:border-slate-500"
            onClick={load}
          >
            Bestehende Karriere laden
          </button>
        </div>
        {error ? <p className="mt-4 text-amber-300">{error}</p> : null}
      </section>
      </div>
    </main>
  );
}
