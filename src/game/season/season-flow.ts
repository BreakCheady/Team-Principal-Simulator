import {
  validateConflictCalculationInput,
  type ConflictCalculationInput,
} from "@/game/political/conflicts";
import { getConflictDecisions } from "@/game/political/decisions";
import type {
  ConflictDecisionResult,
  OutcomeChange,
} from "@/game/political/outcomes";
import type { PoliticalCoreState } from "@/game/political/types";
import { validatePoliticalCoreState } from "@/game/political/validation";
import { applyConflictDecision } from "@/game/state/game-state";

export type SeasonPhase = "DECISION" | "REVIEW" | "COMPLETE";

export type SeasonConflictStep = {
  conflictId: string;
  round: number;
  input: ConflictCalculationInput;
};

export type SeasonHistoryEntry = {
  conflictId: string;
  round: number;
  decisionId: string;
  outcome: string;
  title: string;
  summary: string;
};

export type SeasonReview = {
  decisionId: string;
  title: string;
  summary: string;
  changes: OutcomeChange[];
};

export type SeasonState = {
  political: PoliticalCoreState;
  steps: SeasonConflictStep[];
  currentStepIndex: number;
  currentRound: number;
  phase: SeasonPhase;
  history: SeasonHistoryEntry[];
  pendingReview: SeasonReview | null;
};

function requireConflict(state: PoliticalCoreState, conflictId: string) {
  const conflict = state.conflicts.find((item) => item.id === conflictId);
  if (!conflict) {
    throw new Error(`Season conflict "${conflictId}" was not found.`);
  }
  return conflict;
}

function validateSeasonSteps(
  state: PoliticalCoreState,
  steps: SeasonConflictStep[],
): void {
  if (steps.length === 0) {
    throw new Error("Season requires at least one conflict step.");
  }

  const conflictIds = new Set<string>();
  let previousRound = 0;

  for (const [index, step] of steps.entries()) {
    if (conflictIds.has(step.conflictId)) {
      throw new Error(
        `Conflict "${step.conflictId}" appears more than once in the season.`,
      );
    }
    conflictIds.add(step.conflictId);

    if (!Number.isInteger(step.round) || step.round < 1) {
      throw new Error(`Season step ${index} has an invalid round.`);
    }
    if (step.round < previousRound) {
      throw new Error("Season conflict rounds must be in chronological order.");
    }
    previousRound = step.round;

    validateConflictCalculationInput(step.input);

    const conflict = requireConflict(state, step.conflictId);
    if (conflict.roundStarted !== step.round) {
      throw new Error(
        `Conflict "${step.conflictId}" starts in round ${conflict.roundStarted}, but the season schedules it for round ${step.round}.`,
      );
    }

    if (getConflictDecisions(step.conflictId).length === 0) {
      throw new Error(
        `Season conflict "${step.conflictId}" has no decision options.`,
      );
    }

    if (index === 0) {
      if (conflict.status !== "ACTIVE" && conflict.status !== "ESCALATED") {
        throw new Error("The first season conflict must already be active.");
      }
    } else if (conflict.status !== "DORMANT") {
      throw new Error(
        `Future conflict "${step.conflictId}" must be dormant before it is activated.`,
      );
    }
  }
}

export function createSeasonState(
  sourceState: PoliticalCoreState,
  steps: SeasonConflictStep[],
): SeasonState {
  const validation = validatePoliticalCoreState(sourceState);
  if (!validation.success) {
    throw new Error(
      "Cannot create a season from an invalid political core state.",
    );
  }

  validateSeasonSteps(validation.data, steps);

  return {
    political: structuredClone(validation.data),
    steps: structuredClone(steps),
    currentStepIndex: 0,
    currentRound: steps[0].round,
    phase: "DECISION",
    history: [],
    pendingReview: null,
  };
}

export function getCurrentSeasonStep(state: SeasonState): SeasonConflictStep {
  const step = state.steps[state.currentStepIndex];
  if (!step) {
    throw new Error("Season has no current conflict step.");
  }
  return step;
}

export function resolveSeasonDecision(
  state: SeasonState,
  decisionId: string,
): { seasonState: SeasonState; result: ConflictDecisionResult } {
  if (state.phase !== "DECISION") {
    throw new Error(
      "A season decision can only be made during the DECISION phase.",
    );
  }

  const step = getCurrentSeasonStep(state);
  const conflict = requireConflict(state.political, step.conflictId);
  if (conflict.status !== "ACTIVE" && conflict.status !== "ESCALATED") {
    throw new Error(
      `Current conflict "${conflict.id}" is not active and cannot be resolved.`,
    );
  }

  const result = applyConflictDecision(
    state.political,
    step.conflictId,
    decisionId,
    step.round,
  );
  const resolved = requireConflict(result.nextState, step.conflictId);

  const seasonState: SeasonState = {
    ...state,
    political: result.nextState,
    phase: "REVIEW",
    pendingReview: {
      decisionId: result.decisionId,
      title: result.title,
      summary: result.summary,
      changes: structuredClone(result.changes),
    },
    history: [
      ...state.history,
      {
        conflictId: step.conflictId,
        round: step.round,
        decisionId,
        outcome: resolved.outcome ?? "UNKNOWN",
        title: result.title,
        summary: result.summary,
      },
    ],
  };

  return { seasonState, result };
}

export function advanceSeason(state: SeasonState): SeasonState {
  if (state.phase !== "REVIEW") {
    throw new Error(
      "Season can only advance after reviewing a resolved conflict.",
    );
  }

  const currentStep = getCurrentSeasonStep(state);
  const currentConflict = requireConflict(
    state.political,
    currentStep.conflictId,
  );
  if (currentConflict.status !== "RESOLVED") {
    throw new Error("Cannot advance while the current conflict is unresolved.");
  }

  const nextIndex = state.currentStepIndex + 1;
  const nextStep = state.steps[nextIndex];

  if (!nextStep) {
    return {
      ...state,
      phase: "COMPLETE",
      pendingReview: null,
    };
  }

  const political = structuredClone(state.political);
  const nextConflict = requireConflict(political, nextStep.conflictId);
  if (nextConflict.status !== "DORMANT") {
    throw new Error(
      `Next conflict "${nextConflict.id}" must be dormant before activation.`,
    );
  }
  nextConflict.status = "ACTIVE";

  const validation = validatePoliticalCoreState(political);
  if (!validation.success) {
    throw new Error(
      "Activating the next conflict produced an invalid political state.",
    );
  }

  return {
    ...state,
    political: validation.data,
    currentStepIndex: nextIndex,
    currentRound: nextStep.round,
    phase: "DECISION",
    pendingReview: null,
  };
}
