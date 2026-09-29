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
  derived: {
    factionMomentumA: number;
    factionMomentumB: number;
    resentment: number;
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
  requireScore100(input.politicalCostA, "politicalCostA");
  requireScore100(input.politicalCostB, "politicalCostB");
  requireScore100(input.resentment, "resentment");
  requireScore100(input.leverageUsed, "leverageUsed");

  for (const [characterId, willingness] of Object.entries(
    input.willingnessByCharacterId,
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

function calculateFactionMomentum(
  state: PoliticalCoreState,
  faction: Conflict["factions"][number],
): number {
  const memberMomentum = faction.memberCharacterIds.map((characterId) => {
    const character = state.characters.find((item) => item.id === characterId);
    if (!character) {
      throw new Error(`Faction member "${characterId}" does not exist.`);
    }
    return character.dynamic.momentum;
  });

  const liveModifier =
    memberMomentum.reduce((sum, value) => sum + value, 0) /
    memberMomentum.length;

  return clamp(0, 100, faction.momentum + liveModifier * 0.5);
}

function calculateCrossFactionResentment(
  state: PoliticalCoreState,
  factionA: Conflict["factions"][number],
  factionB: Conflict["factions"][number],
  scenarioBaseline: number,
): number {
  const aMembers = new Set(factionA.memberCharacterIds);
  const bMembers = new Set(factionB.memberCharacterIds);

  const relevant = state.relationships.filter(
    (relationship) =>
      (aMembers.has(relationship.fromCharacterId) &&
        bMembers.has(relationship.toCharacterId)) ||
      (bMembers.has(relationship.fromCharacterId) &&
        aMembers.has(relationship.toCharacterId)),
  );

  if (relevant.length === 0) {
    return scenarioBaseline;
  }

  const liveResentment =
    relevant.reduce((sum, relationship) => sum + relationship.resentment, 0) /
    relevant.length;

  return clamp(0, 100, (scenarioBaseline + liveResentment) / 2);
}

export function calculateConflict(
  state: PoliticalCoreState,
  conflict: Conflict,
  input: ConflictCalculationInput,
): ConflictCalculationResult {
  validateConflictCalculationInput(input);

  const characters = new Map(
    state.characters.map((character) => [character.id, character]),
  );
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

  const factionMomentumA = calculateFactionMomentum(state, factionA);
  const factionMomentumB = calculateFactionMomentum(state, factionB);
  const resentment = calculateCrossFactionResentment(
    state,
    factionA,
    factionB,
    input.resentment,
  );

  const strengthA = calculateFactionStrength({
    leaderProjectedPower: projectedA,
    alliancePower: factionA.alliancePower,
    leverage: factionA.leverage,
    legitimacy: factionA.legitimacy,
    momentum: factionMomentumA,
    friction: factionA.friction,
  });
  const strengthB = calculateFactionStrength({
    leaderProjectedPower: projectedB,
    alliancePower: factionB.alliancePower,
    leverage: factionB.leverage,
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
    leverageUsed: input.leverageUsed,
  });

  return {
    factionA: {
      strength: strengthA,
      successChance: successChanceA,
      politicalCost: input.politicalCostA,
    },
    factionB: {
      strength: strengthB,
      successChance: successChanceB,
      politicalCost: input.politicalCostB,
    },
    delta: strengthA - strengthB,
    escalation,
    derived: {
      factionMomentumA,
      factionMomentumB,
      resentment,
    },
  };
}
