import type {
  Character,
  Conflict,
  Goal,
  PoliticalCoreState,
  Relationship,
} from "./types";

export type FactionAlignment = "FACTION_A" | "FACTION_B" | "SWING" | "NEUTRAL";

export type CharacterAlignment = {
  characterId: string;
  alignment: FactionAlignment;
  scoreA: number;
  scoreB: number;
  margin: number;
};

export type DynamicFactionFormation = {
  factionA: Conflict["factions"][number];
  factionB: Conflict["factions"][number];
  swingActorIds: string[];
  neutralActorIds: string[];
  alignments: CharacterAlignment[];
};

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

function relationshipTo(
  state: PoliticalCoreState,
  fromCharacterId: string,
  toCharacterId: string,
): Relationship | undefined {
  return state.relationships.find(
    (relationship) =>
      relationship.fromCharacterId === fromCharacterId &&
      relationship.toCharacterId === toCharacterId,
  );
}

function relationshipSupport(
  relationship: Relationship | undefined,
): number {
  if (!relationship) return 50;

  return clamp(
    0,
    100,
    relationship.trust * 0.3 +
      relationship.loyalty * 0.25 +
      relationship.respect * 0.2 +
      relationship.dependency * 0.15 +
      (100 - relationship.resentment) * 0.1,
  );
}

function goalsForCharacter(
  state: PoliticalCoreState,
  characterId: string,
): Goal[] {
  return state.goals.filter(
    (goal) => goal.characterId === characterId && goal.active,
  );
}

function goalWeight(goal: Goal): number {
  return (goal.priority * 0.6 + goal.urgency * 0.4) / 100;
}

function technicalGoalAffinity(
  goals: Goal[],
  leader: Character,
): number {
  let affinity = 50;

  for (const goal of goals) {
    const weight = goalWeight(goal);

    if (
      goal.type === "PROTECT_TECHNICAL_AUTHORITY" ||
      goal.type === "BUILD_FASTEST_CAR" ||
      goal.type === "PROTECT_ENGINEERING_TEAM"
    ) {
      affinity +=
        (leader.role === "TECHNICAL_DIRECTOR" ? 35 : -20) * weight;
    }

    if (goal.type === "INCREASE_TECHNICAL_INFLUENCE") {
      affinity +=
        (leader.role === "STAR_DRIVER" || leader.role === "DRIVER"
          ? 30
          : -15) * weight;
    }

    if (
      goal.type === "PROTECT_TEAM_AUTHORITY" ||
      goal.type === "MAINTAIN_TEAM_STABILITY"
    ) {
      affinity +=
        (leader.role === "TEAM_PRINCIPAL" ||
        leader.role === "TECHNICAL_DIRECTOR"
          ? 10
          : -5) * weight;
    }
  }

  return clamp(0, 100, affinity);
}

function driverHierarchyGoalAffinity(
  goals: Goal[],
  leader: Character,
): number {
  let affinity = 50;

  for (const goal of goals) {
    const weight = goalWeight(goal);

    if (goal.type === "KEEP_EQUAL_STATUS") {
      affinity +=
        (leader.role === "SECOND_DRIVER" || leader.role === "DRIVER"
          ? 35
          : leader.role === "STAR_DRIVER"
            ? -30
            : 0) * weight;
    }

    if (
      goal.type === "GAIN_NUMBER_ONE_STATUS" ||
      goal.type === "WIN_CHAMPIONSHIP"
    ) {
      affinity +=
        (leader.role === "STAR_DRIVER" ? 25 : -5) * weight;
    }

    if (goal.type === "MAINTAIN_TEAM_STABILITY") {
      affinity +=
        (leader.role === "TEAM_PRINCIPAL" ? 15 : 0) * weight;
    }
  }

  return clamp(0, 100, affinity);
}

function personnelGoalAffinity(
  goals: Goal[],
  leader: Character,
): number {
  let affinity = 50;

  for (const goal of goals) {
    const weight = goalWeight(goal);

    if (goal.type === "PROTECT_ALLY" && goal.targetCharacterId === leader.id) {
      affinity += 40 * weight;
    }

    if (goal.type === "REMOVE_RIVAL" && goal.targetCharacterId === leader.id) {
      affinity -= 45 * weight;
    }

    if (
      goal.type === "PROTECT_TEAM_AUTHORITY" ||
      goal.type === "MAINTAIN_TEAM_STABILITY"
    ) {
      affinity +=
        (leader.role === "TEAM_PRINCIPAL" ||
        leader.role === "CEO" ||
        leader.role === "OWNER_REPRESENTATIVE"
          ? 20
          : 0) * weight;
    }
  }

  return clamp(0, 100, affinity);
}

function goalAffinity(
  conflict: Conflict,
  goals: Goal[],
  leader: Character,
): number {
  switch (conflict.type) {
    case "TECHNICAL_DIRECTION":
      return technicalGoalAffinity(goals, leader);
    case "DRIVER_PRIORITY":
    case "TEAM_ORDER":
      return driverHierarchyGoalAffinity(goals, leader);
    case "PERSONNEL_DECISION":
    case "CONTRACT_DISPUTE":
    case "LEADERSHIP_CHALLENGE":
      return personnelGoalAffinity(goals, leader);
    case "OWNER_INTERVENTION":
    case "SPONSOR_PRESSURE":
    case "MEDIA_CONFLICT":
      return 50;
    default: {
      const exhaustive: never = conflict.type;
      throw new Error(`Unsupported conflict type: ${exhaustive}`);
    }
  }
}

function institutionalAffinity(
  character: Character,
  faction: Conflict["factions"][number],
): number {
  const legitimacySignal = faction.legitimacy - 50;
  return clamp(
    0,
    100,
    50 +
      legitimacySignal *
        (character.personality.ruleRespect / 100) *
        0.75,
  );
}

export function calculateCharacterAlignment(
  state: PoliticalCoreState,
  conflict: Conflict,
  characterId: string,
): CharacterAlignment {
  const [factionA, factionB] = conflict.factions;
  const character = state.characters.find((item) => item.id === characterId);
  const leaderA = state.characters.find(
    (item) => item.id === factionA.leaderCharacterId,
  );
  const leaderB = state.characters.find(
    (item) => item.id === factionB.leaderCharacterId,
  );

  if (!character || !leaderA || !leaderB) {
    throw new Error("Alignment requires existing character and faction leaders.");
  }

  if (character.id === leaderA.id) {
    return {
      characterId,
      alignment: "FACTION_A",
      scoreA: 100,
      scoreB: 0,
      margin: 100,
    };
  }

  if (character.id === leaderB.id) {
    return {
      characterId,
      alignment: "FACTION_B",
      scoreA: 0,
      scoreB: 100,
      margin: -100,
    };
  }

  const goals = goalsForCharacter(state, character.id);
  const relationshipA = relationshipSupport(
    relationshipTo(state, character.id, leaderA.id),
  );
  const relationshipB = relationshipSupport(
    relationshipTo(state, character.id, leaderB.id),
  );
  const goalA = goalAffinity(conflict, goals, leaderA);
  const goalB = goalAffinity(conflict, goals, leaderB);
  const institutionA = institutionalAffinity(character, factionA);
  const institutionB = institutionalAffinity(character, factionB);

  const scoreA =
    relationshipA * 0.5 +
    goalA * 0.3 +
    institutionA * 0.2;
  const scoreB =
    relationshipB * 0.5 +
    goalB * 0.3 +
    institutionB * 0.2;

  const margin = scoreA - scoreB;
  const absoluteMargin = Math.abs(margin);
  const maxScore = Math.max(scoreA, scoreB);

  let alignment: FactionAlignment;
  if (maxScore < 47) {
    alignment = "NEUTRAL";
  } else if (absoluteMargin >= 15) {
    alignment = margin > 0 ? "FACTION_A" : "FACTION_B";
  } else if (absoluteMargin >= 5) {
    alignment = "SWING";
  } else {
    alignment = "NEUTRAL";
  }

  return {
    characterId,
    alignment,
    scoreA,
    scoreB,
    margin,
  };
}

export function formDynamicFactions(
  state: PoliticalCoreState,
  conflict: Conflict,
): DynamicFactionFormation {
  const [sourceA, sourceB] = conflict.factions;
  const alignments = state.characters.map((character) =>
    calculateCharacterAlignment(state, conflict, character.id),
  );

  const factionAMembers = alignments
    .filter((item) => item.alignment === "FACTION_A")
    .map((item) => item.characterId);
  const factionBMembers = alignments
    .filter((item) => item.alignment === "FACTION_B")
    .map((item) => item.characterId);
  const swingActorIds = alignments
    .filter((item) => item.alignment === "SWING")
    .map((item) => item.characterId);
  const neutralActorIds = alignments
    .filter((item) => item.alignment === "NEUTRAL")
    .map((item) => item.characterId);

  return {
    factionA: {
      ...sourceA,
      memberCharacterIds: factionAMembers,
    },
    factionB: {
      ...sourceB,
      memberCharacterIds: factionBMembers,
    },
    swingActorIds,
    neutralActorIds,
    alignments,
  };
}
