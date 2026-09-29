import {
  getConflictDecision,
  type ConflictDecisionDefinition,
} from "@/game/political/decisions";
import {
  calculateConflict,
  type ConflictCalculationResult,
} from "@/game/political/conflicts";
import {
  resolveConflictDecision,
  type ConflictDecisionResult,
} from "@/game/political/outcomes";
import type { Conflict, PoliticalCoreState } from "@/game/political/types";
import { validatePoliticalCoreState } from "@/game/political/validation";

function intendedSide(
  outcome: ConflictDecisionDefinition["outcome"],
): "A" | "B" | "COMPROMISE" {
  if (
    outcome === "DECISIVE_WIN_A" ||
    outcome === "NARROW_WIN_A" ||
    outcome === "BACKFIRE_B"
  ) {
    return "A";
  }

  if (
    outcome === "DECISIVE_WIN_B" ||
    outcome === "NARROW_WIN_B" ||
    outcome === "BACKFIRE_A"
  ) {
    return "B";
  }

  return "COMPROMISE";
}

export function resolveOutcomeFromPower(
  decision: ConflictDecisionDefinition,
  calculation: ConflictCalculationResult,
): NonNullable<Conflict["outcome"]> {
  const side = intendedSide(decision.outcome);

  if (side === "COMPROMISE") {
    const absoluteDelta = Math.abs(calculation.delta);

    if (absoluteDelta <= 12 && calculation.escalation < 82) {
      return "COMPROMISE";
    }

    if (calculation.delta > 0) {
      return calculation.factionA.successChance >= 70
        ? "DECISIVE_WIN_A"
        : "NARROW_WIN_A";
    }

    return calculation.factionB.successChance >= 70
      ? "DECISIVE_WIN_B"
      : "NARROW_WIN_B";
  }

  const successChance =
    side === "A"
      ? calculation.factionA.successChance
      : calculation.factionB.successChance;

  if (successChance >= 70) {
    return side === "A" ? "DECISIVE_WIN_A" : "DECISIVE_WIN_B";
  }

  if (successChance >= 50) {
    return side === "A" ? "NARROW_WIN_A" : "NARROW_WIN_B";
  }

  if (successChance >= 40) {
    return "COMPROMISE";
  }

  return side === "A" ? "BACKFIRE_A" : "BACKFIRE_B";
}

function withResolvedOutcome(
  decision: ConflictDecisionDefinition,
  outcome: NonNullable<Conflict["outcome"]>,
): ConflictDecisionDefinition {
  if (outcome === decision.outcome) return decision;

  if (outcome === "BACKFIRE_A" || outcome === "BACKFIRE_B") {
    return {
      ...decision,
      outcome,
      title: "The approach backfires",
      summary:
        "The chosen approach runs into a stronger political position than expected. The attempt itself still has consequences, but the intended side fails to impose the result.",
    };
  }

  if (outcome === "COMPROMISE") {
    return {
      ...decision,
      outcome,
      title: "Power forces a compromise",
      summary:
        "Neither side has enough political strength to impose the attempted outcome cleanly. The approach still changes relationships and momentum, but the conflict ends in compromise.",
    };
  }

  return {
    ...decision,
    outcome,
    title:
      outcome === "DECISIVE_WIN_A" || outcome === "DECISIVE_WIN_B"
        ? "The stronger side wins decisively"
        : "The stronger side edges the conflict",
    summary:
      "The current balance of alliances, leverage, momentum and legitimacy determines the final political result.",
  };
}

export function applyConflictDecision(
  sourceState: PoliticalCoreState,
  conflictId: string,
  decisionId: string,
  round: number,
): ConflictDecisionResult {
  const sourceValidation = validatePoliticalCoreState(sourceState);
  if (!sourceValidation.success) {
    throw new Error("Cannot apply a decision to an invalid political core state.");
  }

  const conflict = sourceValidation.data.conflicts.find(
    (item) => item.id === conflictId,
  );
  if (!conflict) {
    throw new Error(`Conflict "${conflictId}" was not found.`);
  }

  const decision = getConflictDecision(conflictId, decisionId);
  const calculation = calculateConflict(sourceValidation.data, conflict);
  const outcome = resolveOutcomeFromPower(decision, calculation);
  const resolvedDecision = withResolvedOutcome(decision, outcome);

  const result = resolveConflictDecision(
    sourceValidation.data,
    conflictId,
    resolvedDecision,
    { round },
  );

  const nextValidation = validatePoliticalCoreState(result.nextState);
  if (!nextValidation.success) {
    throw new Error(
      `Decision produced an invalid political core state: ${nextValidation.errors
        .map((error) => `${error.path}: ${error.message}`)
        .join("; ")}`,
    );
  }

  return {
    ...result,
    nextState: nextValidation.data,
  };
}
