import { calculateAllianceStrength, clampScore } from "./derived-politics";
import type { Character, Conflict, Goal, PoliticalCoreState } from "./types";

export type FactionAlignment = "FACTION_A" | "FACTION_B" | "SWING" | "NEUTRAL";

export type CharacterAlignment = {
  characterId: string;
  alignment: FactionAlignment;
  scoreA: number;
  scoreB: number;
  margin: number;
  engagement: number;
};

export type DynamicFactionFormation = {
  factionA: Conflict["factions"][number];
  factionB: Conflict["factions"][number];
  swingActorIds: string[];
  neutralActorIds: string[];
  alignments: CharacterAlignment[];
};

function relationshipAffinity(
  state: PoliticalCoreState,
  characterId: string,
  leaderId: string,
): number {
  const relationship = state.relationships.find(
    (item) =>
      item.fromCharacterId === characterId && item.toCharacterId === leaderId,
  );

  if (!relationship) return 0;

  return clampScore(
    calculateAllianceStrength(relationship) - relationship.resentment * 0.55,
  );
}

function roleAffinity(
  character: Character,
  leader: Character,
  conflict: Conflict,
): number {
  switch (conflict.type) {
    case "TECHNICAL_DIRECTION":
      if (
        leader.role === "TECHNICAL_DIRECTOR" &&
        ["TECHNICAL_DIRECTOR", "RACE_ENGINEER"].includes(character.role)
      ) {
        return 14;
      }
      if (
        ["STAR_DRIVER", "SECOND_DRIVER", "DRIVER"].includes(leader.role) &&
        ["STAR_DRIVER", "SECOND_DRIVER", "DRIVER"].includes(character.role)
      ) {
        return 6;
      }
      return 0;
    case "DRIVER_PRIORITY":
    case "TEAM_ORDER":
      return ["STAR_DRIVER", "SECOND_DRIVER", "DRIVER"].includes(leader.role) &&
        ["STAR_DRIVER", "SECOND_DRIVER", "DRIVER", "RACE_ENGINEER"].includes(
          character.role,
        )
        ? 8
        : 0;
    case "PERSONNEL_DECISION":
    case "CONTRACT_DISPUTE":
    case "LEADERSHIP_CHALLENGE":
      return ["TEAM_PRINCIPAL", "CEO", "OWNER_REPRESENTATIVE"].includes(
        leader.role,
      )
        ? 8
        : 0;
    case "OWNER_INTERVENTION":
    case "SPONSOR_PRESSURE":
    case "MEDIA_CONFLICT":
      return ["CEO", "OWNER_REPRESENTATIVE", "SPONSOR_REPRESENTATIVE"].includes(
        leader.role,
      )
        ? 8
        : 0;
    default:
      return 0;
  }
}

function goalAffinityForLeader(
  goal: Goal,
  owner: Character,
  leader: Character,
  conflict: Conflict,
): number {
  if (!goal.active) return 0;

  const weight = (goal.priority * 0.6 + goal.urgency * 0.4) / 100;

  if (goal.targetCharacterId) {
    if (goal.type === "PROTECT_ALLY" && goal.targetCharacterId === leader.id) {
      return 30 * weight;
    }
    if (goal.type === "REMOVE_RIVAL" && goal.targetCharacterId === leader.id) {
      return -30 * weight;
    }
  }

  switch (conflict.type) {
    case "TECHNICAL_DIRECTION":
      if (goal.type === "INCREASE_TECHNICAL_INFLUENCE") {
        return ["STAR_DRIVER", "SECOND_DRIVER", "DRIVER"].includes(leader.role)
          ? 28 * weight
          : -12 * weight;
      }
      if (
        [
          "PROTECT_TECHNICAL_AUTHORITY",
          "BUILD_FASTEST_CAR",
          "PROTECT_ENGINEERING_TEAM",
        ].includes(goal.type)
      ) {
        return leader.role === "TECHNICAL_DIRECTOR"
          ? 28 * weight
          : -16 * weight;
      }
      if (goal.type === "KEEP_EQUAL_STATUS") {
        return leader.role === "TECHNICAL_DIRECTOR" ? 8 * weight : -8 * weight;
      }
      break;
    case "DRIVER_PRIORITY":
    case "TEAM_ORDER":
      if (goal.type === "KEEP_EQUAL_STATUS") {
        if (leader.id === owner.id) return 32 * weight;
        if (leader.role === "STAR_DRIVER") return -24 * weight;
        if (["SECOND_DRIVER", "DRIVER"].includes(leader.role)) {
          return 18 * weight;
        }
      }
      if (goal.type === "GAIN_NUMBER_ONE_STATUS") {
        if (leader.id === owner.id) return 32 * weight;
        return leader.role === "STAR_DRIVER" ? 16 * weight : -10 * weight;
      }
      if (goal.type === "WIN_CHAMPIONSHIP") {
        return leader.id === owner.id ? 18 * weight : 0;
      }
      break;
    case "LEADERSHIP_CHALLENGE":
    case "PERSONNEL_DECISION":
      if (goal.type === "PROTECT_TEAM_AUTHORITY") {
        return leader.role === "TEAM_PRINCIPAL" ? 26 * weight : -12 * weight;
      }
      if (goal.type === "MAINTAIN_TEAM_STABILITY") {
        return leader.role === "TEAM_PRINCIPAL" ? 12 * weight : -6 * weight;
      }
      break;
    default:
      break;
  }

  if (goal.type === "PROTECT_TEAM_AUTHORITY") {
    return leader.role === "TEAM_PRINCIPAL" ? 12 * weight : 0;
  }

  if (goal.type === "MAINTAIN_TEAM_STABILITY") {
    return -Math.max(0, conflict.stakes - 50) * 0.08 * weight;
  }

  return 0;
}

function goalAffinity(
  state: PoliticalCoreState,
  character: Character,
  leader: Character,
  conflict: Conflict,
): number {
  return state.goals
    .filter((goal) => goal.characterId === character.id && goal.active)
    .reduce(
      (sum, goal) =>
        sum + goalAffinityForLeader(goal, character, leader, conflict),
      0,
    );
}

function engagementScore(character: Character, conflict: Conflict): number {
  const momentum = (character.dynamic.momentum + 25) * 2;

  return clampScore(
    character.personality.assertiveness * 0.3 +
      character.personality.ambition * 0.2 +
      (100 - character.dynamic.politicalFatigue) * 0.2 +
      momentum * 0.1 +
      conflict.stakes * 0.2,
  );
}

export function calculateCharacterAlignment(
  state: PoliticalCoreState,
  conflict: Conflict,
  characterId: string,
): CharacterAlignment {
  const [baseA, baseB] = conflict.factions;
  const character = state.characters.find((item) => item.id === characterId);
  const leaderA = state.characters.find(
    (item) => item.id === baseA.leaderCharacterId,
  );
  const leaderB = state.characters.find(
    (item) => item.id === baseB.leaderCharacterId,
  );

  if (!character || !leaderA || !leaderB) {
    throw new Error(
      "Alignment requires existing character and faction leaders.",
    );
  }

  if (character.id === leaderA.id) {
    return {
      characterId,
      alignment: "FACTION_A",
      scoreA: 100,
      scoreB: 0,
      margin: 100,
      engagement: 100,
    };
  }

  if (character.id === leaderB.id) {
    return {
      characterId,
      alignment: "FACTION_B",
      scoreA: 0,
      scoreB: 100,
      margin: -100,
      engagement: 100,
    };
  }

  if (character.role === "TEAM_PRINCIPAL") {
    return {
      characterId,
      alignment: "SWING",
      scoreA: 50,
      scoreB: 50,
      margin: 0,
      engagement: 100,
    };
  }

  const scoreA = clampScore(
    20 +
      relationshipAffinity(state, character.id, leaderA.id) * 0.55 +
      goalAffinity(state, character, leaderA, conflict) +
      roleAffinity(character, leaderA, conflict),
  );
  const scoreB = clampScore(
    20 +
      relationshipAffinity(state, character.id, leaderB.id) * 0.55 +
      goalAffinity(state, character, leaderB, conflict) +
      roleAffinity(character, leaderB, conflict),
  );
  const margin = scoreA - scoreB;
  const strongest = Math.max(scoreA, scoreB);
  const engagement = engagementScore(character, conflict);

  let alignment: FactionAlignment;
  if (engagement < 42 || strongest < 32) {
    alignment = "NEUTRAL";
  } else if (Math.abs(margin) <= 10 && strongest >= 38) {
    alignment = "SWING";
  } else if (margin >= 14) {
    alignment = "FACTION_A";
  } else if (margin <= -14) {
    alignment = "FACTION_B";
  } else {
    alignment = "NEUTRAL";
  }

  return {
    characterId,
    alignment,
    scoreA,
    scoreB,
    margin,
    engagement,
  };
}

export function formDynamicFactions(
  state: PoliticalCoreState,
  conflict: Conflict,
): DynamicFactionFormation {
  const [sourceA, sourceB] = conflict.factions;
  const alignments = state.characters
    .filter((character) => character.active !== false)
    .map((character) =>
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
