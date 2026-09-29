import {
  calculateContextualPower,
  calculateProjectedPower,
  type PowerContext,
} from "./power";
import type { Conflict, PoliticalCoreState } from "./types";

export type ConflictCalculationInput = {
  willingnessByCharacterId: Record<string, number>;
  politicalCostA: number;
  politicalCostB: number;
  resentment: number;
  leverageUsed: number;
};

export type ConflictCalculationResult = {
  factionA: { strength: number; successChance: number; politicalCost: number };
  factionB: { strength: number; successChance: number; politicalCost: number };
  delta: number;
  escalation: number;
};

export function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateFactionStrength(input: {
  leaderProjectedPower: number;
  alliancePower: number;
  leverage: number;
  legitimacy: number;
  momentum: number;
  friction: number;
}): number {
  return (
    input.leaderProjectedPower * 0.4 +
    input.alliancePower * 0.25 +
    input.leverage * 0.15 +
    input.legitimacy * 0.1 +
    input.momentum * 0.1 -
    input.friction
  );
}

export function calculateSuccessChance(strengthA: number, strengthB: number): number {
  return clamp(10, 90, 50 + 0.6 * (strengthA - strengthB));
}

export function calculateEscalation(input: {
  strengthA: number;
  strengthB: number;
  resentment: number;
  stakes: number;
  publicExposure: number;
  leverageUsed: number;
}): number {
  const closeness = clamp(0, 100, 100 - Math.abs(input.strengthA - input.strengthB));

  return clamp(
    0,
    100,
    closeness * 0.25 +
      input.resentment * 0.25 +
      input.stakes * 0.2 +
      input.publicExposure * 0.15 +
      input.leverageUsed * 0.15,
  );
}

export function conflictTypeToPowerContext(
  type: Conflict["type"],
): PowerContext {
  switch (type) {
    case "TECHNICAL_DIRECTION":
      return "TECHNICAL_DIRECTION";
    case "DRIVER_PRIORITY":
    case "TEAM_ORDER":
      return "DRIVER_HIERARCHY";
    case "PERSONNEL_DECISION":
    case "CONTRACT_DISPUTE":
    case "LEADERSHIP_CHALLENGE":
      return "PERSONNEL_DECISION";
    case "OWNER_INTERVENTION":
    case "SPONSOR_PRESSURE":
    case "MEDIA_CONFLICT":
      return "REGULATION_POLITICS";
    default: {
      const exhaustive: never = type;
      throw new Error(`Unsupported conflict type: ${exhaustive}`);
    }
  }
}

export function calculateConflict(
  state: PoliticalCoreState,
  conflict: Conflict,
  input: ConflictCalculationInput,
): ConflictCalculationResult {
  const characters = new Map(state.characters.map((character) => [character.id, character]));
  const [factionA, factionB] = conflict.factions;
  const leaderA = characters.get(factionA.leaderCharacterId);
  const leaderB = characters.get(factionB.leaderCharacterId);

  if (!leaderA || !leaderB) {
    throw new Error("Conflict faction leader does not exist.");
  }

  const context = conflictTypeToPowerContext(conflict.type);

  const projectedA = calculateProjectedPower(
    calculateContextualPower(leaderA, context),
    input.willingnessByCharacterId[leaderA.id] ?? 1,
  );
  const projectedB = calculateProjectedPower(
    calculateContextualPower(leaderB, context),
    input.willingnessByCharacterId[leaderB.id] ?? 1,
  );

  const strengthA = calculateFactionStrength({
    leaderProjectedPower: projectedA,
    alliancePower: factionA.alliancePower,
    leverage: factionA.leverage,
    legitimacy: factionA.legitimacy,
    momentum: factionA.momentum,
    friction: factionA.friction,
  });
  const strengthB = calculateFactionStrength({
    leaderProjectedPower: projectedB,
    alliancePower: factionB.alliancePower,
    leverage: factionB.leverage,
    legitimacy: factionB.legitimacy,
    momentum: factionB.momentum,
    friction: factionB.friction,
  });

  const successChanceA = calculateSuccessChance(strengthA, strengthB);
  const successChanceB = 100 - successChanceA;
  const escalation = calculateEscalation({
    strengthA,
    strengthB,
    resentment: input.resentment,
    stakes: conflict.stakes,
    publicExposure: conflict.publicExposure,
    leverageUsed: input.leverageUsed,
  });

  return {
    factionA: { strength: strengthA, successChance: successChanceA, politicalCost: input.politicalCostA },
    factionB: { strength: strengthB, successChance: successChanceB, politicalCost: input.politicalCostB },
    delta: strengthA - strengthB,
    escalation,
  };
}
