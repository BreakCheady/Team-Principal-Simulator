import { calculateContextualPower, type PowerContext } from "./power";
import type {
  Character,
  Conflict,
  PoliticalCoreState,
  Relationship,
} from "./types";

export function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function calculateAllianceStrength(
  relationship: Relationship,
): number {
  return (
    relationship.loyalty * 0.4 +
    relationship.trust * 0.25 +
    relationship.dependency * 0.2 +
    relationship.respect * 0.15
  );
}

function directedRelationship(
  state: PoliticalCoreState,
  fromCharacterId: string,
  toCharacterId: string,
) {
  return state.relationships.find(
    (relationship) =>
      relationship.fromCharacterId === fromCharacterId &&
      relationship.toCharacterId === toCharacterId,
  );
}

export function deriveFactionAlliancePower(
  state: PoliticalCoreState,
  faction: Conflict["factions"][number],
  context: PowerContext,
): number {
  const allies = faction.memberCharacterIds
    .filter((id) => id !== faction.leaderCharacterId)
    .map((id) => {
      const character = state.characters.find((item) => item.id === id);
      const relationship = directedRelationship(
        state,
        id,
        faction.leaderCharacterId,
      );
      if (!character || !relationship) return null;

      const allianceStrength = calculateAllianceStrength(relationship) / 100;
      const contextualPower = calculateContextualPower(character, context);
      return contextualPower * allianceStrength;
    })
    .filter((value): value is number => value !== null)
    .sort((a, b) => b - a);

  const diminishingReturns = [1, 0.75, 0.55, 0.4];

  const weighted = allies.reduce(
    (sum, value, index) =>
      sum +
      value *
        (diminishingReturns[index] ??
          diminishingReturns[diminishingReturns.length - 1] * 0.625),
    0,
  );

  return clampScore(weighted);
}

export function deriveFactionMomentum(
  state: PoliticalCoreState,
  faction: Conflict["factions"][number],
): number {
  const members = faction.memberCharacterIds.map((id) => {
    const character = state.characters.find((item) => item.id === id);
    if (!character) {
      throw new Error(`Faction member "${id}" does not exist.`);
    }
    return character;
  });

  const averageMomentum =
    members.reduce((sum, character) => sum + character.dynamic.momentum, 0) /
    members.length;

  return clampScore(50 + averageMomentum * 2);
}

export function deriveCrossFactionResentment(
  state: PoliticalCoreState,
  factionA: Conflict["factions"][number],
  factionB: Conflict["factions"][number],
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

  if (relevant.length === 0) return 0;

  return clampScore(
    relevant.reduce((sum, relationship) => sum + relationship.resentment, 0) /
      relevant.length,
  );
}

export function deriveWillingnessToAct(
  state: PoliticalCoreState,
  character: Character,
  conflict: Conflict,
): number {
  const activeGoals = state.goals.filter(
    (goal) => goal.characterId === character.id && goal.active,
  );

  const goalPressure =
    activeGoals.length === 0
      ? 50
      : activeGoals.reduce(
          (sum, goal) => sum + (goal.priority * 0.6 + goal.urgency * 0.4),
          0,
        ) / activeGoals.length;

  const momentumScore = (character.dynamic.momentum + 25) * 2;
  const fatigueResistance = 100 - character.dynamic.politicalFatigue;

  const willingness =
    character.personality.assertiveness * 0.25 +
    character.personality.ambition * 0.2 +
    goalPressure * 0.25 +
    momentumScore * 0.1 +
    fatigueResistance * 0.1 +
    conflict.stakes * 0.1;

  return clampScore(willingness) / 100;
}

function effectiveLeverageScore(
  strength: number,
  credibility: number,
  usability: number,
  risk: number,
) {
  const effective = (strength * credibility * usability) / 10000;
  return effective * (1 - risk / 150);
}

export function deriveFactionLeverage(
  state: PoliticalCoreState,
  faction: Conflict["factions"][number],
): number {
  const memberIds = new Set(faction.memberCharacterIds);

  const scores = state.leverages
    .filter(
      (leverage) =>
        leverage.active &&
        memberIds.has(leverage.ownerCharacterId) &&
        leverage.usesRemaining !== 0,
    )
    .map((leverage) =>
      effectiveLeverageScore(
        leverage.strength,
        leverage.credibility,
        leverage.usability,
        leverage.risk,
      ),
    )
    .sort((a, b) => b - a);

  if (scores.length === 0) return 0;

  const diminishingReturns = [1, 0.75, 0.55, 0.4];
  return clampScore(
    scores.reduce(
      (sum, value, index) =>
        sum +
        value *
          (diminishingReturns[index] ??
            diminishingReturns[diminishingReturns.length - 1] * 0.625),
      0,
    ),
  );
}

export function derivePoliticalCost(
  state: PoliticalCoreState,
  conflict: Conflict,
  faction: Conflict["factions"][number],
  crossFactionResentment: number,
): number {
  const members = faction.memberCharacterIds
    .map((id) => state.characters.find((item) => item.id === id))
    .filter((character): character is Character => Boolean(character));

  const averageInstability =
    members.length === 0
      ? 0
      : members.reduce(
          (sum, character) => sum + character.dynamic.instability,
          0,
        ) / members.length;

  const relevantPrecedents = conflict.precedentIds
    .map((id) => state.precedents.find((precedent) => precedent.id === id))
    .filter((precedent) => precedent?.active);

  const precedentPressure =
    relevantPrecedents.length === 0
      ? 0
      : relevantPrecedents.reduce(
          (sum, precedent) => sum + (precedent?.strength ?? 0),
          0,
        ) / relevantPrecedents.length;

  return clampScore(
    (100 - faction.legitimacy) * 0.3 +
      crossFactionResentment * 0.25 +
      conflict.publicExposure * 0.2 +
      precedentPressure * 0.15 +
      averageInstability * 0.1,
  );
}
