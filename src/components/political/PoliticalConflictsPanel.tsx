"use client";

import { calculateConflict } from "@/game/political/conflicts";
import { getConflictDecisions } from "@/game/political/decisions";
import type { RoundFlowState } from "@/game/season/round-flow";

type Props = {
  flow: RoundFlowState;
  onConflictDecision: (conflictId: string, decisionId: string) => void;
  onOpenCareer: () => void;
};

function format(value: number) {
  return value.toFixed(1);
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

export function PoliticalConflictsPanel({
  flow,
  onConflictDecision,
  onOpenCareer,
}: Props) {
  const activeConflicts = flow.political.conflicts.filter(
    (conflict) =>
      conflict.status === "ACTIVE" || conflict.status === "ESCALATED",
  );

  return (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeConflicts.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No active political conflicts.
              </p>
            ) : (
              activeConflicts.map((conflict) => {
                const calculation = calculateConflict(
                  flow.political,
                  conflict,
                );
                const leaderA = flow.political.characters.find(
                  (character) =>
                    character.id === conflict.factions[0].leaderCharacterId,
                );
                const leaderB = flow.political.characters.find(
                  (character) =>
                    character.id === conflict.factions[1].leaderCharacterId,
                );

                return (
                  <article
                    key={conflict.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.14em] text-amber-400">
                      {label(conflict.type)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">
                      {conflict.issue}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border border-zinc-800 p-3">
                        <p>{leaderA?.name}</p>
                        <p className="mt-1 text-zinc-500">
                          Strength {format(calculation.factionA.strength)}
                        </p>
                      </div>
                      <div className="rounded-md border border-zinc-800 p-3">
                        <p>{leaderB?.name}</p>
                        <p className="mt-1 text-zinc-500">
                          Strength {format(calculation.factionB.strength)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-red-300">
                      Eskalation {format(calculation.escalation)}
                    </p>
                    {conflict.id.startsWith("conflict_request_") ? (
                      <button
                        type="button"
                        onClick={() => onOpenCareer()}
                        className="mt-3 text-sm text-sky-300"
                      >
                        Resolve actor demand in Career
                      </button>
                    ) : null}
                    {getConflictDecisions(conflict.id).length > 0 ? (
                      <div className="mt-5 grid gap-2">
                        {getConflictDecisions(conflict.id).map((decision) => (
                          <button
                            key={decision.id}
                            type="button"
                            onClick={() =>
                              onConflictDecision(conflict.id, decision.id)
                            }
                            className="rounded-md border border-zinc-700 bg-zinc-950 p-3 text-left text-sm transition hover:border-amber-700"
                          >
                            <span className="font-medium">
                              {decision.label}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-zinc-500">
                              {decision.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
  );
}
