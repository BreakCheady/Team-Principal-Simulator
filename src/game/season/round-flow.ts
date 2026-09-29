import type { PoliticalCoreState } from "@/game/political/types";
import {
  processRound,
  type AppliedRoundEvent,
  type RoundEventDefinition,
} from "@/game/season/round-events";

export type RoundFlowHistoryEntry = {
  round: number;
  events: AppliedRoundEvent[];
  activeConflictIds: string[];
};

export type RoundFlowState = {
  political: PoliticalCoreState;
  scheduledRounds: number[];
  nextRoundIndex: number;
  currentRound: number;
  history: RoundFlowHistoryEntry[];
  complete: boolean;
};

function uniqueSortedRounds(
  events: RoundEventDefinition[],
  afterRound: number,
): number[] {
  return [...new Set(events.map((event) => event.round))]
    .filter((round) => round > afterRound)
    .sort((a, b) => a - b);
}

export function createRoundFlowState(
  sourceState: PoliticalCoreState,
  events: RoundEventDefinition[],
  afterRound: number,
): RoundFlowState {
  const scheduledRounds = uniqueSortedRounds(events, afterRound);

  return {
    political: structuredClone(sourceState),
    scheduledRounds,
    nextRoundIndex: 0,
    currentRound: afterRound,
    history: [],
    complete: scheduledRounds.length === 0,
  };
}

export function getNextRound(state: RoundFlowState): number | null {
  return state.scheduledRounds[state.nextRoundIndex] ?? null;
}

export function advanceRoundFlow(
  state: RoundFlowState,
  events: RoundEventDefinition[],
): RoundFlowState {
  if (state.complete) {
    throw new Error("Round flow is already complete.");
  }

  const round = getNextRound(state);
  if (round === null) {
    throw new Error("Round flow has no next round.");
  }

  const result = processRound(state.political, round, events);
  const activeConflictIds = result.nextState.conflicts
    .filter(
      (conflict) =>
        (conflict.status === "ACTIVE" || conflict.status === "ESCALATED") &&
        conflict.roundStarted <= round,
    )
    .map((conflict) => conflict.id);

  const nextRoundIndex = state.nextRoundIndex + 1;

  return {
    political: result.nextState,
    scheduledRounds: state.scheduledRounds,
    nextRoundIndex,
    currentRound: round,
    history: [
      ...state.history,
      {
        round,
        events: result.events,
        activeConflictIds,
      },
    ],
    complete: nextRoundIndex >= state.scheduledRounds.length,
  };
}
