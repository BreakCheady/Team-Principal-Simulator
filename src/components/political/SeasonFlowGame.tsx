"use client";

import { useMemo, useState } from "react";
import { RoundEventsPanel } from "@/components/political/RoundEventsPanel";
import type { IssueDefinition } from "@/game/issues/issues";
import { calculateConflict } from "@/game/political/conflicts";
import { getConflictDecisions } from "@/game/political/decisions";
import type { OutcomeChange } from "@/game/political/outcomes";
import type { PoliticalCoreState } from "@/game/political/types";
import type { RoundEventDefinition } from "@/game/season/round-events";
import {
  advanceSeason,
  createSeasonState,
  getCurrentSeasonStep,
  resolveSeasonDecision,
  type SeasonConflictStep,
} from "@/game/season/season-flow";

type Props = {
  initialState: PoliticalCoreState;
  steps: SeasonConflictStep[];
  roundEvents: RoundEventDefinition[];
  issueDefinitions: IssueDefinition[];
};

function format(value: number) {
  return value.toFixed(1);
}

function changeSign(change: OutcomeChange) {
  const delta = change.after - change.before;
  return delta > 0 ? `+${delta}` : String(delta);
}

export function SeasonFlowGame({
  initialState,
  steps,
  roundEvents,
  issueDefinitions,
}: Props) {
  const [season, setSeason] = useState(() =>
    createSeasonState(initialState, steps),
  );
  const step = getCurrentSeasonStep(season);
  const conflict = season.political.conflicts.find(
    (item) => item.id === step.conflictId,
  );

  if (!conflict) {
    throw new Error(`Conflict "${step.conflictId}" was not found.`);
  }

  const calculation = useMemo(
    () =>
      season.phase === "DECISION"
        ? calculateConflict(season.political, conflict, step.input)
        : null,
    [season.phase, season.political, conflict, step.input],
  );

  const decisionOptions = useMemo(
    () => getConflictDecisions(conflict.id),
    [conflict.id],
  );

  const nameById = useMemo(
    () =>
      new Map(
        season.political.characters.map((character) => [
          character.id,
          character.name,
        ]),
      ),
    [season.political.characters],
  );

  function chooseDecision(decisionId: string) {
    const resolution = resolveSeasonDecision(season, decisionId);
    setSeason(resolution.seasonState);
  }

  function continueSeason() {
    setSeason((current) => advanceSeason(current));
  }

  function resetSeason() {
    setSeason(createSeasonState(initialState, steps));
  }

  const [factionA, factionB] = conflict.factions;

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-6 md:p-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
            Vanguard Racing · Saison-Prototyp
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Runde {season.currentRound}
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Politische Entscheidungen wirken weiter. Der nächste Konflikt beginnt mit dem Teamzustand, den du im vorherigen geschaffen hast.
          </p>
        </div>
        <button
          type="button"
          onClick={resetSeason}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500"
        >
          Saison zurücksetzen
        </button>
      </header>

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        {season.steps.map((seasonStep, index) => {
          const scheduledConflict = season.political.conflicts.find(
            (item) => item.id === seasonStep.conflictId,
          );
          const isCurrent = index === season.currentStepIndex;
          return (
            <div
              key={seasonStep.conflictId}
              className={
                isCurrent
                  ? "rounded-xl border border-amber-700 bg-amber-950/20 p-4"
                  : "rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
              }
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Runde {seasonStep.round}
                </span>
                <span className="text-xs text-zinc-400">
                  {scheduledConflict?.status ?? "UNKNOWN"}
                </span>
              </div>
              <p className="mt-2 font-medium">
                {scheduledConflict?.type.replaceAll("_", " ")}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400">
                  {season.phase === "DECISION"
                    ? "Entscheidung erforderlich"
                    : season.phase === "REVIEW"
                      ? "Entscheidung gelöst"
                      : "Saison beendet"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {conflict.type.replaceAll("_", " ")}
                </h2>
              </div>
              {calculation ? (
                <span className="rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-sm text-red-300">
                  Eskalation {format(calculation.escalation)}
                </span>
              ) : null}
            </div>

            <p className="mt-5 leading-7 text-zinc-300">{conflict.issue}</p>

            {calculation ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[factionA, factionB].map((faction, index) => {
                  const calculated =
                    index === 0 ? calculation.factionA : calculation.factionB;
                  return (
                    <div
                      key={faction.id}
                      className="rounded-xl border border-zinc-800 bg-black/20 p-5"
                    >
                      <p className="text-sm text-zinc-500">Lager</p>
                      <h3 className="mt-1 text-xl font-medium">
                        {nameById.get(faction.leaderCharacterId)}
                      </h3>
                      <dl className="mt-5 space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-zinc-500">Stärke</dt>
                          <dd>{format(calculated.strength)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-zinc-500">Erfolgschance</dt>
                          <dd>{format(calculated.successChance)}%</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-zinc-500">Politische Kosten</dt>
                          <dd>{calculated.politicalCost}</dd>
                        </div>
                      </dl>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {season.phase === "DECISION" ? (
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {decisionOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => chooseDecision(option.id)}
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-left transition hover:border-zinc-500 hover:bg-zinc-900"
                  >
                    <span className="block font-medium text-zinc-100">
                      {option.label}
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-zinc-500">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {season.phase === "COMPLETE" ? (
              <div className="mt-8 rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-5">
                <p className="font-medium text-emerald-300">
                  Konfliktfolge der Saison abgeschlossen
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Jede Entscheidung bleibt im endgültigen politischen Zustand und in der Saisonchronik erhalten.
                </p>
              </div>
            ) : null}
          </article>

          {season.phase === "REVIEW" && season.pendingReview ? (
            <article className="rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-6">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
                Folgen
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {season.pendingReview.title}
              </h2>
              <p className="mt-4 leading-7 text-zinc-300">
                {season.pendingReview.summary}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {season.pendingReview.changes.map((change, index) => (
                  <div
                    key={`${change.subject}-${change.metric}-${index}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-black/20 p-4"
                  >
                    <div>
                      <p className="font-medium">{change.subject}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {change.metric}: {change.before} → {change.after}
                      </p>
                    </div>
                    <span
                      className={
                        change.after >= change.before
                          ? "text-sm font-medium text-emerald-400"
                          : "text-sm font-medium text-red-400"
                      }
                    >
                      {changeSign(change)}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={continueSeason}
                className="mt-6 rounded-xl bg-zinc-100 px-5 py-3 font-medium text-zinc-950"
              >
                {season.currentStepIndex === season.steps.length - 1
                  ? "Saisonfolge abschließen"
                  : "Zur nächsten Runde"}
              </button>
            </article>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Politische Akteure
            </p>
            <div className="mt-5 space-y-3">
              {season.political.characters.map((character) => (
                <div
                  key={character.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/20 p-4"
                >
                  <div>
                    <p className="font-medium">{character.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {character.role.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span className="text-sm text-zinc-400">
                    Dynamik {character.dynamic.momentum > 0 ? "+" : ""}
                    {character.dynamic.momentum}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Saisonchronik
            </p>
            {season.history.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">
                Noch keine politischen Entscheidungen erfasst.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {season.history.map((entry) => (
                  <div
                    key={`${entry.round}-${entry.conflictId}`}
                    className="rounded-xl border border-zinc-800 bg-black/20 p-4"
                  >
                    <p className="text-xs text-zinc-500">Runde {entry.round}</p>
                    <p className="mt-1 font-medium">{entry.title}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {entry.outcome.replaceAll("_", " ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Präzedenzfälle
            </p>
            <div className="mt-4 space-y-3">
              {season.political.precedents.map((precedent) => (
                <div
                  key={precedent.id}
                  className="rounded-xl border border-zinc-800 bg-black/20 p-4 text-sm"
                >
                  <p className="font-medium">
                    {precedent.type.replaceAll("_", " ")}
                  </p>
                  <div className="mt-3 flex justify-between text-zinc-400">
                    <span>Stärke {precedent.strength}</span>
                    <span>
                      {precedent.applications} angewendet · {precedent.violations} verletzt
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      {season.phase === "COMPLETE" ? (
        <RoundEventsPanel
          key={season.history.map((entry) => entry.decisionId).join(":")}
          initialState={season.political}
          events={roundEvents}
          issueDefinitions={issueDefinitions}
          afterRound={season.currentRound}
        />
      ) : null}
    </main>
  );
}
