import { advanceContractsForRound } from "@/game/contracts/contracts";
import {
  advanceWatchingIssue,
  createChainedIssue,
  createIssuesFromEvents,
  getFollowUpIssueDefinitionId,
  resolveIssueAction,
  type IssueDefinition,
  type IssueState,
} from "@/game/issues/issues";
import type { PoliticalCoreState } from "@/game/political/types";
import { applyConflictDecision } from "@/game/state/game-state";
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


function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

function ageActiveConflicts(
  sourceState: PoliticalCoreState,
  round: number,
): PoliticalCoreState {
  const nextState = structuredClone(sourceState);

  for (const conflict of nextState.conflicts) {
    if (
      (conflict.status !== "ACTIVE" && conflict.status !== "ESCALATED") ||
      conflict.roundStarted >= round
    ) {
      continue;
    }

    const exposureDelta = conflict.type === "MEDIA_CONFLICT" ? 7 : 4;
    conflict.publicExposure = clamp(
      0,
      100,
      conflict.publicExposure + exposureDelta,
    );
    conflict.stakes = clamp(0, 100, conflict.stakes + 2);

    for (const faction of conflict.factions) {
      const leader = nextState.characters.find(
        (character) => character.id === faction.leaderCharacterId,
      );
      if (leader) {
        leader.dynamic.politicalFatigue = clamp(
          0,
          100,
          leader.dynamic.politicalFatigue + 2,
        );
      }
    }
  }

  return nextState;
}

function ageWatchingIssues(
  sourceState: PoliticalCoreState,
  issues: IssueState[],
  definitions: IssueDefinition[],
  round: number,
): { political: PoliticalCoreState; issues: IssueState[] } {
  let political = structuredClone(sourceState);
  const agedIssues: IssueState[] = [];

  for (const issue of issues) {
    if (issue.status !== "WATCHING") {
      agedIssues.push(issue);
      continue;
    }

    const result = advanceWatchingIssue(
      political,
      issue,
      definitions,
      round,
    );
    political = result.political;
    agedIssues.push(result.issue);
  }

  return { political, issues: agedIssues };
}

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

  const aged = ageWatchingIssues(
    state.political,
    state.issues,
    issueDefinitions,
    round,
  );
  const agedPolitical = ageActiveConflicts(aged.political, round);
  const contractState = advanceContractsForRound(agedPolitical, round);
  const result = processRound(contractState, round, events);
  const createdIssues = createIssuesFromEvents(
    round,
    result.events,
    issueDefinitions,
  ).filter(
    (candidate) => !aged.issues.some((issue) => issue.id === candidate.id),
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
    issues: [...aged.issues, ...createdIssues],
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

  const resolvedIssue = {
    ...result.issue,
    lastUpdatedRound: state.currentRound,
  };
  const followUpDefinitionId = getFollowUpIssueDefinitionId(
    resolvedIssue,
    issueDefinitions,
  );
  const followUpDefinition = followUpDefinitionId
    ? issueDefinitions.find((item) => item.id === followUpDefinitionId)
    : undefined;

  if (followUpDefinitionId && !followUpDefinition) {
    throw new Error(
      `Follow-up issue definition "${followUpDefinitionId}" was not found.`,
    );
  }

  const existingFollowUp = followUpDefinitionId
    ? state.issues.some(
        (item) =>
          item.definitionId === followUpDefinitionId &&
          item.parentIssueId === issueId,
      )
    : false;

  const followUp =
    followUpDefinition && !existingFollowUp
      ? createChainedIssue(state.currentRound, followUpDefinition, issueId)
      : null;

  return {
    ...state,
    political: result.political,
    issues: [
      ...state.issues.map((item) =>
        item.id === issueId ? resolvedIssue : item,
      ),
      ...(followUp ? [followUp] : []),
    ],
  };
}


export function resolveRoundConflict(
  state: RoundFlowState,
  conflictId: string,
  decisionId: string,
): RoundFlowState {
  const conflict = state.political.conflicts.find(
    (item) => item.id === conflictId,
  );
  if (!conflict) {
    throw new Error(`Conflict "${conflictId}" was not found.`);
  }
  if (conflict.status !== "ACTIVE" && conflict.status !== "ESCALATED") {
    throw new Error(`Conflict "${conflictId}" is not active.`);
  }

  const result = applyConflictDecision(
    state.political,
    conflictId,
    decisionId,
    state.currentRound,
  );

  return {
    ...state,
    political: result.nextState,
  };
}
