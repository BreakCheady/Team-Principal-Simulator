import type { CareerState } from "@/game/career/state";
import {
  acceptNegotiationCounter,
  createNegotiationOffer,
  rejectContractNegotiation,
  startContractNegotiation,
  submitNegotiationOffer,
  type ContractNegotiationSession,
} from "@/game/contracts/negotiations";
import {
  advanceContractsForRound,
  exerciseContractOption,
} from "@/game/contracts/contracts";
import {
  cutOperatingCosts,
  requestOwnerFunding,
  settleTeamFinancesThroughRound,
} from "@/game/finance/finances";
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
  career?: CareerState;
  political: PoliticalCoreState;
  scheduledRounds: number[];
  nextRoundIndex: number;
  currentRound: number;
  history: RoundFlowHistoryEntry[];
  issues: IssueState[];
  negotiations: ContractNegotiationSession[];
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

    const result = advanceWatchingIssue(political, issue, definitions, round);
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
    negotiations: [],
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
  if (state.career?.weekend && !state.career.weekend.committed)
    throw new Error("Beende zuerst das aktuelle Rennwochenende.");
  if (state.career?.status === "DISMISSED")
    throw new Error("Deine Amtszeit ist beendet.");
  if (state.complete) {
    throw new Error("Der Saisonverlauf ist bereits abgeschlossen.");
  }

  if (getOpenIssues(state).length > 0) {
    throw new Error("Offene Themen im Posteingang müssen vor der nächsten Runde bearbeitet werden.");
  }

  const round = getNextRound(state);
  if (round === null) {
    throw new Error("Es gibt keine nächste Runde.");
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
    ...(state.career ? { career: structuredClone(state.career) } : {}),
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
    negotiations: state.negotiations,
    complete: nextRoundIndex >= state.scheduledRounds.length,
  };
}

export function resolveRoundIssue(
  state: RoundFlowState,
  issueId: string,
  actionId: string,
  issueDefinitions: IssueDefinition[],
): RoundFlowState {
  if (state.career?.weekend && !state.career.weekend.committed)
    throw new Error("Beende zuerst das aktuelle Rennwochenende.");
  if (state.career?.status === "DISMISSED")
    throw new Error("Deine Amtszeit ist beendet.");
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
  if (state.career?.weekend && !state.career.weekend.committed)
    throw new Error("Beende zuerst das aktuelle Rennwochenende.");
  if (state.career?.status === "DISMISSED")
    throw new Error("Deine Amtszeit ist beendet.");
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

function appendNegotiationFollowUps(
  state: RoundFlowState,
  session: ContractNegotiationSession,
  issueDefinitions: IssueDefinition[],
): RoundFlowState {
  if (state.career?.world && session.followUpIssueDefinitionIds.length) {
    const next = structuredClone(state);
    const kind =
      session.lastTeamPosture === "GENEROUS"
        ? "OWNER"
        : session.status === "REJECTED"
          ? "STAFF"
          : "SPONSOR";
    const role =
      kind === "OWNER"
        ? "OWNER_REPRESENTATIVE"
        : kind === "STAFF"
          ? "RACE_ENGINEER"
          : "SPONSOR_REPRESENTATIVE";
    const actor = next.political.characters.find(
      (c) => c.role === role && c.active !== false,
    );
    const id = `reaction_${session.id}_${kind.toLowerCase()}`;
    if (actor && !next.career!.requests.some((r) => r.id === id))
      next.career!.requests.push({
        id,
        characterId: actor.id,
        round: Math.max(1, next.currentRound),
        kind,
        contractId: null,
        optionId: null,
        contractEndRound: null,
        deadline: next.currentRound + 2,
        status: "OPEN",
        summary: `${actor.name} requests a review of ${session.lastTeamPosture?.toLowerCase() ?? "failed"} contract talks. Respond through Career to address their concerns.`,
      });
    return next;
  }
  if (session.followUpIssueDefinitionIds.length === 0) return state;

  const additions = session.followUpIssueDefinitionIds.flatMap(
    (definitionId) => {
      const definition = issueDefinitions.find(
        (item) => item.id === definitionId,
      );
      if (!definition) {
        throw new Error(
          `Negotiation follow-up issue definition "${definitionId}" was not found.`,
        );
      }

      const alreadyExists = state.issues.some(
        (issue) =>
          issue.definitionId === definitionId &&
          issue.parentIssueId === session.id,
      );

      return alreadyExists
        ? []
        : [createChainedIssue(state.currentRound, definition, session.id)];
    },
  );

  return additions.length === 0
    ? state
    : {
        ...state,
        issues: [...state.issues, ...additions],
      };
}

export function exerciseRoundContractOption(
  state: RoundFlowState,
  contractId: string,
  optionId: string,
): RoundFlowState {
  if (state.career?.weekend && !state.career.weekend.committed)
    throw new Error("Beende zuerst das aktuelle Rennwochenende.");
  if (state.career?.status === "DISMISSED")
    throw new Error("Deine Amtszeit ist beendet.");
  const contract = state.political.contracts.find(
    (item) => item.id === contractId,
  );
  if (!contract) throw new Error(`Contract "${contractId}" was not found.`);
  const option = contract.options.find((item) => item.id === optionId);
  if (!option) throw new Error(`Contract option "${optionId}" was not found.`);
  if (option.holder !== "TEAM") {
    throw new Error(
      "Nur Teamoptionen können einseitig vom Team gezogen werden.",
    );
  }
  const openNegotiation = state.negotiations.some(
    (session) =>
      session.contractId === contractId &&
      ["OPEN", "COUNTERED"].includes(session.status),
  );
  if (openNegotiation) {
    throw new Error("Schließe die Vertragsgespräche ab, bevor du eine Option ziehst.");
  }
  return {
    ...state,
    political: exerciseContractOption(
      state.political,
      contractId,
      optionId,
      state.currentRound,
    ),
  };
}

export function takeRoundFinanceAction(
  state: RoundFlowState,
  action: "OWNER_FUNDING" | "CUT_OPERATING_COSTS",
): RoundFlowState {
  if (state.career?.weekend && !state.career.weekend.committed)
    throw new Error("Beende zuerst das aktuelle Rennwochenende.");
  if (state.career?.status === "DISMISSED")
    throw new Error("Deine Amtszeit ist beendet.");
  const political =
    state.currentRound === 0
      ? structuredClone(state.political)
      : settleTeamFinancesThroughRound(state.political, state.currentRound);
  return {
    ...state,
    political:
      action === "OWNER_FUNDING"
        ? requestOwnerFunding(political, Math.max(1, state.currentRound))
        : cutOperatingCosts(political),
  };
}

export function startRoundContractNegotiation(
  state: RoundFlowState,
  contractId: string,
): RoundFlowState {
  if (state.career?.weekend && !state.career.weekend.committed)
    throw new Error("Beende zuerst das aktuelle Rennwochenende.");
  if (state.career?.status === "DISMISSED")
    throw new Error("Deine Amtszeit ist beendet.");
  if (
    state.career &&
    !state.career.activeActorIds.includes(
      state.political.contracts.find((c) => c.id === contractId)?.characterId ??
        "",
    )
  ) {
    throw new Error(
      "Diese Person hat das Team verlassen; besetze die freie Position über den Transfermarkt.",
    );
  }
  const existingOpen = state.negotiations.find(
    (session) =>
      session.contractId === contractId &&
      ["OPEN", "COUNTERED"].includes(session.status),
  );
  if (existingOpen) {
    throw new Error("Für diesen Vertrag läuft bereits eine Verhandlung.");
  }

  const created = startContractNegotiation(
    state.political,
    contractId,
    state.currentRound,
  );
  const sameBaseIdCount = state.negotiations.filter(
    (session) =>
      session.id === created.id || session.id.startsWith(created.id + "_n"),
  ).length;
  const session =
    sameBaseIdCount === 0
      ? created
      : { ...created, id: created.id + "_n" + (sameBaseIdCount + 1) };

  return {
    ...state,
    negotiations: [...state.negotiations, session],
  };
}

export function submitRoundContractOffer(
  state: RoundFlowState,
  negotiationId: string,
  posture: "FIRM" | "BALANCED" | "GENEROUS",
  issueDefinitions: IssueDefinition[],
): RoundFlowState {
  if (state.career?.weekend && !state.career.weekend.committed)
    throw new Error("Beende zuerst das aktuelle Rennwochenende.");
  if (state.career?.status === "DISMISSED")
    throw new Error("Deine Amtszeit ist beendet.");
  const session = state.negotiations.find((item) => item.id === negotiationId);
  if (!session)
    throw new Error(`Negotiation "${negotiationId}" was not found.`);
  if (
    state.career &&
    !state.career.activeActorIds.includes(session.characterId)
  )
    throw new Error("Die Person hat das Team verlassen.");

  const offer = createNegotiationOffer(session, posture);
  const result = submitNegotiationOffer(
    state.political,
    session,
    offer,
    state.currentRound,
    posture,
  );

  const nextState: RoundFlowState = {
    ...state,
    political: result.political,
    negotiations: state.negotiations.map((item) =>
      item.id === negotiationId ? result.session : item,
    ),
  };

  return appendNegotiationFollowUps(
    nextState,
    result.session,
    issueDefinitions,
  );
}

export function acceptRoundContractCounter(
  state: RoundFlowState,
  negotiationId: string,
  issueDefinitions: IssueDefinition[],
): RoundFlowState {
  if (state.career?.weekend && !state.career.weekend.committed)
    throw new Error("Beende zuerst das aktuelle Rennwochenende.");
  if (state.career?.status === "DISMISSED")
    throw new Error("Deine Amtszeit ist beendet.");
  const session = state.negotiations.find((item) => item.id === negotiationId);
  if (!session)
    throw new Error(`Negotiation "${negotiationId}" was not found.`);
  if (
    state.career &&
    !state.career.activeActorIds.includes(session.characterId)
  )
    throw new Error("Die Person hat das Team verlassen.");

  const result = acceptNegotiationCounter(
    state.political,
    session,
    state.currentRound,
  );

  const nextState: RoundFlowState = {
    ...state,
    political: result.political,
    negotiations: state.negotiations.map((item) =>
      item.id === negotiationId ? result.session : item,
    ),
  };

  return appendNegotiationFollowUps(
    nextState,
    result.session,
    issueDefinitions,
  );
}

export function rejectRoundContractNegotiation(
  state: RoundFlowState,
  negotiationId: string,
  issueDefinitions: IssueDefinition[],
): RoundFlowState {
  if (state.career?.weekend && !state.career.weekend.committed)
    throw new Error("Beende zuerst das aktuelle Rennwochenende.");
  if (state.career?.status === "DISMISSED")
    throw new Error("Deine Amtszeit ist beendet.");
  const session = state.negotiations.find((item) => item.id === negotiationId);
  if (!session)
    throw new Error(`Negotiation "${negotiationId}" was not found.`);

  const result = rejectContractNegotiation(state.political, session);

  const nextState: RoundFlowState = {
    ...state,
    political: result.political,
    negotiations: state.negotiations.map((item) =>
      item.id === negotiationId ? result.session : item,
    ),
  };

  return appendNegotiationFollowUps(
    nextState,
    result.session,
    issueDefinitions,
  );
}
