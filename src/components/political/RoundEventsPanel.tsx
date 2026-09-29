"use client";

import { useMemo, useState } from "react";
import { calculateConflict } from "@/game/political/conflicts";
import type { PoliticalCoreState } from "@/game/political/types";
import {
  advanceRoundFlow,
  createRoundFlowState,
  getNextRound,
} from "@/game/season/round-flow";
import type { RoundEventDefinition } from "@/game/season/round-events";

type Props = {
  initialState: PoliticalCoreState;
  events: RoundEventDefinition[];
  afterRound: number;
};

function format(value: number) {
  return value.toFixed(1);
}

function eventTypeLabel(type: RoundEventDefinition["type"]) {
  return type.replaceAll("_", " ");
}

export function RoundEventsPanel({ initialState, events, afterRound }: Props) {
  const [roundFlow, setRoundFlow] = useState(() =>
    createRoundFlowState(initialState, events, afterRound),
  );

  const nextRound = getNextRound(roundFlow);
  const latest = roundFlow.history.at(-1) ?? null;

  const latestConflictIds = useMemo(() => {
    if (!latest) return [];

    const ids = latest.events.flatMap((event) => [
      ...event.activatedConflictIds,
      ...event.spawnedConflictIds,
    ]);

    return [...new Set(ids)];
  }, [latest]);

  const latestConflicts = useMemo(
    () =>
      latestConflictIds
        .map((id) =>
          roundFlow.political.conflicts.find((conflict) => conflict.id === id),
        )
        .filter(
          (
            conflict,
          ): conflict is PoliticalCoreState["conflicts"][number] =>
            Boolean(conflict),
        ),
    [latestConflictIds, roundFlow.political.conflicts],
  );

  function startNextRound() {
    setRoundFlow((current) => advanceRoundFlow(current, events));
  }

  return (
    <section className="mt-8 space-y-6">
      <article className="rounded-2xl border border-sky-900/70 bg-sky-950/20 p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400">
              Live season rounds
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Round {roundFlow.currentRound}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Sporting and paddock events now change the same PoliticalState
              used by the conflict engine. New political issues can emerge from
              the consequences.
            </p>
          </div>

          {!roundFlow.complete && nextRound !== null ? (
            <button
              type="button"
              onClick={startNextRound}
              className="rounded-xl bg-sky-300 px-5 py-3 font-medium text-sky-950 transition hover:bg-sky-200"
            >
              Start round {nextRound}
            </button>
          ) : (
            <span className="rounded-full border border-emerald-800 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-300">
              Event sequence complete
            </span>
          )}
        </div>
      </article>

      {latest ? (
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Round {latest.round} report
          </p>

          {latest.events.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              No authored political events occurred this round.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {latest.events.map((event) => {
                const conflictCount =
                  event.activatedConflictIds.length +
                  event.spawnedConflictIds.length;

                return (
                  <div
                    key={event.eventId}
                    className="rounded-xl border border-zinc-800 bg-black/20 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-sky-400">
                          {eventTypeLabel(event.type)}
                        </p>
                        <h3 className="mt-2 text-lg font-medium">
                          {event.title}
                        </h3>
                      </div>
                      {conflictCount > 0 ? (
                        <span className="rounded-full border border-amber-800 bg-amber-950/30 px-2.5 py-1 text-xs text-amber-300">
                          {conflictCount} political issue
                          {conflictCount === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {event.summary}
                    </p>

                    {event.activatedConflictIds.length > 0 ? (
                      <p className="mt-4 text-xs text-amber-300">
                        Activated: {event.activatedConflictIds.join(", ")}
                      </p>
                    ) : null}

                    {event.spawnedConflictIds.length > 0 ? (
                      <p className="mt-2 text-xs text-red-300">
                        New conflict: {event.spawnedConflictIds.join(", ")}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </article>
      ) : (
        <article className="rounded-2xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
          Start the next round to reveal the first race and paddock event.
        </article>
      )}

      {latestConflicts.length > 0 ? (
        <article className="rounded-2xl border border-amber-900/70 bg-amber-950/10 p-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400">
            Political consequences
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Conflicts emerging from round {latest?.round}
          </h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {latestConflicts.map((conflict) => {
              const calculation = calculateConflict(
                roundFlow.political,
                conflict,
              );
              const leaderA = roundFlow.political.characters.find(
                (character) =>
                  character.id === conflict.factions[0].leaderCharacterId,
              );
              const leaderB = roundFlow.political.characters.find(
                (character) =>
                  character.id === conflict.factions[1].leaderCharacterId,
              );

              return (
                <div
                  key={conflict.id}
                  className="rounded-xl border border-zinc-800 bg-black/20 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                      {conflict.type.replaceAll("_", " ")}
                    </span>
                    <span className="text-xs text-red-300">
                      Escalation {format(calculation.escalation)}
                    </span>
                  </div>

                  <p className="mt-3 leading-6 text-zinc-300">
                    {conflict.issue}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-zinc-800 p-3">
                      <p className="text-zinc-500">{leaderA?.name}</p>
                      <p className="mt-1 font-medium">
                        {format(calculation.factionA.strength)} strength
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {format(calculation.factionA.successChance)}% support
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-800 p-3">
                      <p className="text-zinc-500">{leaderB?.name}</p>
                      <p className="mt-1 font-medium">
                        {format(calculation.factionB.strength)} strength
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {format(calculation.factionB.successChance)}% support
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {calculation.derived.swingActorIds.map((id) => {
                      const actor = roundFlow.political.characters.find(
                        (character) => character.id === id,
                      );
                      return (
                        <span
                          key={id}
                          className="rounded-full border border-violet-900 bg-violet-950/30 px-2.5 py-1 text-violet-300"
                        >
                          Swing: {actor?.name ?? id}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      ) : latest ? (
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
          This round changed the political state, but did not create or activate
          a new conflict.
        </article>
      ) : null}

      {roundFlow.history.length > 0 ? (
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Event history
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {roundFlow.history.map((entry) => (
              <span
                key={entry.round}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400"
              >
                R{entry.round}: {entry.events.length} event
                {entry.events.length === 1 ? "" : "s"} ·{" "}
                {entry.activeConflictIds.length} active conflict
                {entry.activeConflictIds.length === 1 ? "" : "s"}
              </span>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  );
}
