import {
  createIssuesFromEvents,
  resolveIssueAction,
  type IssueDefinition,
  type IssueState,
} from "@/game/issues/issues";
import type { PoliticalCoreState } from "@/game/political/types";
import {
  processRound,
  type AppliedRoundEvent,
  type RoundEventDefinition,
} from "@/game/season/round-events";

export type RoundFlowHistoryEntry = {
  round: number;
  events: AppliedRoundEvent[];
  createdIssueIds: string[];
  activeConflictIds: string[];
};

export type RoundFlowState = {
  political: PoliticalCoreState;
  scheduledRounds: number[];
  nextRoundIndex: number;
  currentRound: number;
  history: RoundFlowHistoryEntry[];
  issues: IssueState[];
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
    issues: [],
    complete: scheduledRounds.length === 0,
  };
}

export function getNextRound(state: RoundFlowState): number | null {
  return state.scheduledRounds[state.nextRoundIndex] ?? null;
}

export function getOpenIssues(state: RoundFlowState): IssueState[] {
  return state.issues.filter((issue) => issue.status === "OPEN");
}

export function advanceRoundFlow(
  state: RoundFlowState,
  events: RoundEventDefinition[],
  issueDefinitions: IssueDefinition[] = [],
): RoundFlowState {
  if (state.complete) {
    throw new Error("Round flow is already complete.");
  }

  if (getOpenIssues(state).length > 0) {
    throw new Error("Open inbox issues must be handled before the next round.");
  }

  const round = getNextRound(state);
  if (round === null) {
    throw new Error("Round flow has no next round.");
  }

  const result = processRound(state.political, round, events);
  const createdIssues = createIssuesFromEvents(
    round,
    result.events,
    issueDefinitions,
  ).filter(
    (candidate) => !state.issues.some((issue) => issue.id === candidate.id),
  );

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
        createdIssueIds: createdIssues.map((issue) => issue.id),
        activeConflictIds,
      },
    ],
    issues: [...state.issues, ...createdIssues],
    complete: nextRoundIndex >= state.scheduledRounds.length,
  };
}

export function resolveRoundIssue(
  state: RoundFlowState,
  issueId: string,
  actionId: string,
  issueDefinitions: IssueDefinition[],
): RoundFlowState {
  const issue = state.issues.find((item) => item.id === issueId);
  if (!issue) {
    throw new Error(`Issue "${issueId}" was not found.`);
  }

  const result = resolveIssueAction(
    state.political,
    issue,
    issueDefinitions,
    actionId,
  );

  return {
    ...state,
    political: result.political,
    issues: state.issues.map((item) =>
      item.id === issueId ? result.issue : item,
    ),
  };
}
