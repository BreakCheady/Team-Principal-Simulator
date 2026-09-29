import {
  deriveCrossFactionResentment,
  deriveFactionAlliancePower,
  deriveFactionLeverage,
  deriveFactionMomentum,
  derivePoliticalCost,
  deriveWillingnessToAct,
} from "./derived-politics";
import { formDynamicFactions } from "./faction-formation";
import {
  calculateContextualPower,
  calculateProjectedPower,
  type PowerContext,
} from "./power";
import type { Conflict, PoliticalCoreState } from "./types";

export type ConflictCalculationInput = {
  willingnessByCharacterId?: Record<string, number>;
  politicalCostA?: number;
  politicalCostB?: number;
  resentment?: number;
  leverageUsed?: number;
};

export type ConflictCalculationResult = {
  factionA: { strength: number; successChance: number; politicalCost: number };
  factionB: { strength: number; successChance: number; politicalCost: number };
  delta: number;
  escalation: number;
  derived: {
    willingnessA: number;
    willingnessB: number;
    alliancePowerA: number;
    alliancePowerB: number;
    factionMomentumA: number;
    factionMomentumB: number;
    leverageA: number;
    leverageB: number;
    resentment: number;
    leverageUsed: number;
    factionAMemberIds: string[];
    factionBMemberIds: string[];
    swingActorIds: string[];
    neutralActorIds: string[];
    alignments: ReturnType<typeof formDynamicFactions>["alignments"];
  };
};

export function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

function requireScore100(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`${label} must be between 0 and 100.`);
  }
}

export function validateConflictCalculationInput(
  input: ConflictCalculationInput,
): void {
  for (const [label, value] of [
    ["politicalCostA", input.politicalCostA],
    ["politicalCostB", input.politicalCostB],
    ["resentment", input.resentment],
    ["leverageUsed", input.leverageUsed],
  ] as const) {
    if (value !== undefined) requireScore100(value, label);
  }

  for (const [characterId, willingness] of Object.entries(
    input.willingnessByCharacterId ?? {},
  )) {
    if (!Number.isFinite(willingness) || willingness < 0 || willingness > 1) {
      throw new RangeError(
        `willingnessByCharacterId.${characterId} must be between 0 and 1.`,
      );
    }
  }
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

export function calculateSuccessChance(
  strengthA: number,
  strengthB: number,
): number {
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
  const closeness = clamp(
    0,
    100,
    100 - Math.abs(input.strengthA - input.strengthB),
  );

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
  input: ConflictCalculationInput = {},
): ConflictCalculationResult {
  validateConflictCalculationInput(input);

  const characters = new Map(
    state.characters.map((character) => [character.id, character]),
  );
  const formation = formDynamicFactions(state, conflict);
  const factionA = formation.factionA;
  const factionB = formation.factionB;
  const leaderA = characters.get(factionA.leaderCharacterId);
  const leaderB = characters.get(factionB.leaderCharacterId);

  if (!leaderA || !leaderB) {
    throw new Error("Conflict faction leader does not exist.");
  }

  const context = conflictTypeToPowerContext(conflict.type);

  const willingnessA =
    input.willingnessByCharacterId?.[leaderA.id] ??
    deriveWillingnessToAct(state, leaderA, conflict);
  const willingnessB =
    input.willingnessByCharacterId?.[leaderB.id] ??
    deriveWillingnessToAct(state, leaderB, conflict);

  const projectedA = calculateProjectedPower(
    calculateContextualPower(leaderA, context),
    willingnessA,
  );
  const projectedB = calculateProjectedPower(
    calculateContextualPower(leaderB, context),
    willingnessB,
  );

  const alliancePowerA = deriveFactionAlliancePower(state, factionA, context);
  const alliancePowerB = deriveFactionAlliancePower(state, factionB, context);
  const factionMomentumA = deriveFactionMomentum(state, factionA);
  const factionMomentumB = deriveFactionMomentum(state, factionB);
  const leverageA = deriveFactionLeverage(state, factionA);
  const leverageB = deriveFactionLeverage(state, factionB);
  const resentment =
    input.resentment ??
    deriveCrossFactionResentment(state, factionA, factionB);
  const leverageUsed =
    input.leverageUsed ?? clamp(0, 100, (leverageA + leverageB) / 2);

  const politicalCostA =
    input.politicalCostA ??
    derivePoliticalCost(state, conflict, factionA, resentment);
  const politicalCostB =
    input.politicalCostB ??
    derivePoliticalCost(state, conflict, factionB, resentment);

  const strengthA = calculateFactionStrength({
    leaderProjectedPower: projectedA,
    alliancePower: alliancePowerA,
    leverage: leverageA,
    legitimacy: factionA.legitimacy,
    momentum: factionMomentumA,
    friction: factionA.friction,
  });
  const strengthB = calculateFactionStrength({
    leaderProjectedPower: projectedB,
    alliancePower: alliancePowerB,
    leverage: leverageB,
    legitimacy: factionB.legitimacy,
    momentum: factionMomentumB,
    friction: factionB.friction,
  });

  const successChanceA = calculateSuccessChance(strengthA, strengthB);
  const successChanceB = 100 - successChanceA;
  const escalation = calculateEscalation({
    strengthA,
    strengthB,
    resentment,
    stakes: conflict.stakes,
    publicExposure: conflict.publicExposure,
    leverageUsed,
  });

  return {
    factionA: {
      strength: strengthA,
      successChance: successChanceA,
      politicalCost: politicalCostA,
    },
    factionB: {
      strength: strengthB,
      successChance: successChanceB,
      politicalCost: politicalCostB,
    },
    delta: strengthA - strengthB,
    escalation,
    derived: {
      willingnessA,
      willingnessB,
      alliancePowerA,
      alliancePowerB,
      factionMomentumA,
      factionMomentumB,
      leverageA,
      leverageB,
      resentment,
      leverageUsed,
      factionAMemberIds: [...factionA.memberCharacterIds],
      factionBMemberIds: [...factionB.memberCharacterIds],
      swingActorIds: [...formation.swingActorIds],
      neutralActorIds: [...formation.neutralActorIds],
      alignments: formation.alignments,
    },
  };
}
