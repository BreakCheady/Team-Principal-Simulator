import type { ConflictDecisionId } from "@/game/political/decisions";
import {
  resolveVanguardTechnicalDirectionDecision,
  type ConflictDecisionResult,
} from "@/game/political/outcomes";
import type { PoliticalCoreState } from "@/game/political/types";
import { validatePoliticalCoreState } from "@/game/political/validation";

export function applyConflictDecision(
  sourceState: PoliticalCoreState,
  conflictId: string,
  decisionId: ConflictDecisionId,
  round: number,
): ConflictDecisionResult {
  const sourceValidation = validatePoliticalCoreState(sourceState);
  if (!sourceValidation.success) {
    throw new Error("Cannot apply a decision to an invalid political core state.");
  }

  const result = resolveVanguardTechnicalDirectionDecision(
    sourceValidation.data,
    conflictId,
    decisionId,
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
