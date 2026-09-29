"use client";

import { useMemo, useState } from "react";
import { getConflictDecisions } from "@/game/political/decisions";
import {
  calculateConflict,
  type ConflictCalculationInput,
} from "@/game/political/conflicts";
import type {
  ConflictDecisionResult,
  OutcomeChange,
} from "@/game/political/outcomes";
import type { PoliticalCoreState } from "@/game/political/types";
import { applyConflictDecision } from "@/game/state/game-state";

type Props = {
  initialState: PoliticalCoreState;
  conflictInput: ConflictCalculationInput;
  round: number;
};

function format(value: number) {
  return value.toFixed(1);
}

function changeSign(change: OutcomeChange) {
  const delta = change.after - change.before;
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

export function ConflictDecisionGame({
  initialState,
  conflictInput,
  round,
}: Props) {
  const [gameState, setGameState] = useState<PoliticalCoreState>(() =>
    structuredClone(initialState),
  );
  const [decisionResult, setDecisionResult] =
    useState<ConflictDecisionResult | null>(null);

  const conflict = gameState.conflicts[0];

  const calculation = useMemo(
    () =>
      conflict.status === "RESOLVED"
        ? null
        : calculateConflict(gameState, conflict, conflictInput),
    [gameState, conflict, conflictInput],
  );

  const nameById = useMemo(
    () =>
      new Map(
        gameState.characters.map((character) => [character.id, character.name]),
      ),
    [gameState.characters],
  );

  const [factionA, factionB] = conflict.factions;
  const isResolved = conflict.status === "RESOLVED";
  const decisionOptions = useMemo(
    () => getConflictDecisions(conflict.id),
    [conflict.id],
  );

  function chooseDecision(decisionId: string) {
    if (isResolved) return;

    const result = applyConflictDecision(
      gameState,
      conflict.id,
      decisionId,
      round,
    );

    setGameState(result.nextState);
    setDecisionResult(result);
  }

  function resetScenario() {
    setGameState(structuredClone(initialState));
    setDecisionResult(null);
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6 md:p-10">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
          Vanguard Racing · Round {round}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Team Principal Simulator
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Your decision changes relationships, momentum and institutional
          precedent. Winning the argument is not the same as winning the
          politics.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400">
                  {isResolved ? "Resolved conflict" : "Active conflict"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {conflict.type.replaceAll("_", " ")}
                </h2>
              </div>
              <div className="flex gap-2">
                {calculation ? (
                  <span className="rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-sm text-red-300">
                    Escalation {format(calculation.escalation)}
                  </span>
                ) : null}
                {conflict.outcome ? (
                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300">
                    {conflict.outcome.replaceAll("_", " ")}
                  </span>
                ) : null}
              </div>
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
                      <p className="text-sm text-zinc-500">Faction</p>
                      <h3 className="mt-1 text-xl font-medium">
                        {nameById.get(faction.leaderCharacterId)}
                      </h3>
                      <dl className="mt-5 space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-zinc-500">Strength</dt>
                          <dd>{format(calculated.strength)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-zinc-500">Success chance</dt>
                          <dd>{format(calculated.successChance)}%</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-zinc-500">Political cost</dt>
                          <dd>{calculated.politicalCost}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-zinc-500">Legitimacy</dt>
                          <dd>{faction.legitimacy}</dd>
                        </div>
                      </dl>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-zinc-800 bg-black/20 p-5 text-sm text-zinc-400">
                Pre-decision strength, success chance and escalation are hidden
                after resolution. The result below is now the authoritative state.
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {decisionOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={isResolved}
                  onClick={() => chooseDecision(option.id)}
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-left transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
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
          </article>

          {decisionResult ? (
            <article className="rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
                    Decision consequences
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {decisionResult.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={resetScenario}
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500"
                >
                  Reset scenario
                </button>
              </div>

              <p className="mt-4 max-w-3xl leading-7 text-zinc-300">
                {decisionResult.summary}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {decisionResult.changes.map((change, index) => (
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
            </article>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Political actors
          </p>
          <div className="mt-5 space-y-4">
            {gameState.characters.map((character) => (
              <div
                key={character.id}
                className="rounded-xl border border-zinc-800 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{character.name}</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {character.role.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span className="text-sm text-zinc-400">
                    M {character.dynamic.momentum > 0 ? "+" : ""}
                    {character.dynamic.momentum}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-zinc-500">Internal</p>
                    <p className="mt-1 text-sm">
                      {character.power.internalInfluence}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Sporting</p>
                    <p className="mt-1 text-sm">
                      {character.power.sportingLeverage}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Owner</p>
                    <p className="mt-1 text-sm">
                      {character.power.ownerAccess}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-zinc-800 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Technical authority precedent
            </p>
            {gameState.precedents
              .filter((item) => item.id === "precedent_technical_authority")
              .map((precedent) => (
                <dl key={precedent.id} className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Strength</dt>
                    <dd>{precedent.strength}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Applications</dt>
                    <dd>{precedent.applications}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Violations</dt>
                    <dd>{precedent.violations}</dd>
                  </div>
                </dl>
              ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
