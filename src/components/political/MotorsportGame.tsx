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
  const [preview] = useState(() => createWorld());
  const [series, setSeries] = useState<SeriesId>("F1");
  const [selected, setSelected] = useState("team_f1_10");
  const [flow, setFlow] = useState<RoundFlowState | null>(null);
  const [error, setError] = useState("");

  const cfg = SERIES.find((s) => s.id === series)!;
  const teams = preview.teams.filter((t) => t.seriesId === series);
  const team = teams.find((t) => t.id === selected) ?? teams[0];

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

  if (flow) {
    const playerTeam = flow.career?.world
      ? preview.teams.find((t) => t.id === flow.career!.world!.playerTeamId)
      : null;

    return (
      <main className="mm-app min-h-screen pb-20">
        <header className="mm-topbar sticky top-0 z-30">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-3 py-2 md:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-cyan-400 text-sm font-black text-slate-950">TP</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{playerTeam?.name ?? "Team Principal Simulator"}</p>
                <p className="truncate text-[10px] uppercase tracking-wider text-slate-500">
                  Saison {2025 + (flow.career?.season ?? 1)} · {flow.career?.world?.playerSeriesId ?? "Karriere"}
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-5 text-right md:flex">
              <div><p className="mm-label">Status</p><p className="text-xs font-bold text-emerald-300">Teamleitung aktiv</p></div>
              <div><p className="mm-label">Runde</p><p className="mm-value text-sm">{flow.currentRound === 0 ? "Vorsaison" : flow.currentRound}</p></div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-3 py-4 md:px-5">
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
  }

  return (
    <main className="mm-app min-h-screen">
      <header className="mm-topbar">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-cyan-400 font-black text-slate-950">TP</div>
            <div>
              <p className="text-sm font-black">KARRIERE STARTEN</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Team Principal Simulator</p>
            </div>
          </div>
          <button className="mm-button" onClick={load}>Spielstand laden</button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <section className="mm-panel overflow-hidden">
          <div className="mm-panel-header">1 · Rennserie auswählen</div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERIES.map((s) => (
              <button
                key={s.id}
                aria-pressed={series === s.id}
                onClick={() => {
                  setSeries(s.id);
                  setSelected("team_" + s.id.toLowerCase() + "_0");
                  setError("");
                }}
                className="mm-card-select p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black">{s.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{s.teamNames.length} Teams · {s.rounds} Rennen</p>
                  </div>
                  <span className={series === s.id ? "text-cyan-300" : "text-slate-600"}>●</span>
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-400">{s.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mm-panel overflow-hidden">
          <div className="mm-panel-header flex items-center justify-between">
            <span>2 · Team auswählen</span>
            <span className="text-cyan-300">{cfg.name}</span>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <button
                key={t.id}
                aria-pressed={team.id === t.id}
                onClick={() => setSelected(t.id)}
                className="mm-card-select p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{t.name}</p>
                  {t.classId ? <span className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-400">{t.classId === "HYPERCAR" ? "Hypercar" : "LMGT3"}</span> : null}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div><p className="mm-label">Tempo</p><p className="mm-value mt-1">{t.pace}</p></div>
                  <div><p className="mm-label">Zuverl.</p><p className="mm-value mt-1">{t.reliability}</p></div>
                  <div><p className="mm-label">Budget</p><p className="mm-value mt-1">€{t.budget.toFixed(0)}m</p></div>
                </div>
                <p className="mt-4 truncate text-xs text-slate-500">
                  {t.drivers.map((id) => preview.people.find((p) => p.id === id)!.name).join(" · ")}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="mm-panel overflow-hidden">
          <div className="mm-panel-header">3 · Karriere bestätigen</div>
          <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-black">{team.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Starte in der Vorsaison mit vollständigem {cfg.rounds}-Rennen-Kalender,
                besetzten Fahrerplätzen, Personal, Verträgen und leerer Meisterschaftswertung.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {preview.teams.length} Teams · {preview.people.filter((p) => p.role === "DRIVER").length} Fahrer · {preview.people.filter((p) => p.role !== "DRIVER").length} Mitarbeiter im Motorsport-Universum
              </p>
            </div>
            <button
              className="mm-button mm-button-primary px-7 py-3"
              onClick={() => {
                try {
                  setFlow(createNewCareer(series, team.id));
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Karriere konnte nicht erstellt werden.");
                }
              }}
            >
              Karriere starten
            </button>
          </div>
          {error ? <p className="border-t border-slate-700 px-5 py-3 text-sm text-amber-300">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}
