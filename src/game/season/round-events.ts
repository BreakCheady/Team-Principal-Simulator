import type { Conflict, PoliticalCoreState } from "@/game/political/types";
import { validatePoliticalCoreState } from "@/game/political/validation";

export type RoundEventType =
  | "RACE_RESULT"
  | "PERFORMANCE_SWING"
  | "TECHNICAL_PROBLEM"
  | "MEDIA_EVENT"
  | "CONTRACT_TALK";

export type RoundEventEffect =
  | {
      type: "CHARACTER_MOMENTUM_DELTA";
      characterId: string;
      delta: number;
    }
  | {
      type: "CHARACTER_FATIGUE_DELTA";
      characterId: string;
      delta: number;
    }
  | {
      type: "CHARACTER_INSTABILITY_DELTA";
      characterId: string;
      delta: number;
    }
  | {
      type: "RELATIONSHIP_DELTA";
      fromCharacterId: string;
      toCharacterId: string;
      metric: "trust" | "loyalty" | "respect" | "dependency" | "resentment";
      delta: number;
    }
  | {
      type: "GOAL_PROGRESS_DELTA";
      goalId: string;
      delta: number;
    }
  | {
      type: "GOAL_URGENCY_DELTA";
      goalId: string;
      delta: number;
    }
  | {
      type: "LEVERAGE_STRENGTH_DELTA";
      leverageId: string;
      delta: number;
    }
  | {
      type: "PRECEDENT_STRENGTH_DELTA";
      precedentId: string;
      delta: number;
    };

export type ConflictTriggerCondition =
  | {
      type: "RELATIONSHIP_AT_LEAST";
      fromCharacterId: string;
      toCharacterId: string;
      metric: "resentment" | "dependency" | "personalLeverage";
      value: number;
    }
  | {
      type: "GOAL_URGENCY_AT_LEAST";
      goalId: string;
      value: number;
    }
  | {
      type: "CHARACTER_MOMENTUM_AT_LEAST";
      characterId: string;
      value: number;
    }
  | {
      type: "CHARACTER_MOMENTUM_AT_MOST";
      characterId: string;
      value: number;
    }
  | {
      type: "LEVERAGE_STRENGTH_AT_LEAST";
      leverageId: string;
      value: number;
    };

export type RoundConflictTrigger = {
  id: string;
  all: ConflictTriggerCondition[];
  activateConflictId?: string;
  spawnConflict?: Conflict;
};

export type RoundEventDefinition = {
  id: string;
  type: RoundEventType;
  title: string;
  summary: string;
  round: number;
  effects: RoundEventEffect[];
  conflictTriggers?: RoundConflictTrigger[];
};

export type AppliedRoundEvent = {
  eventId: string;
  type: RoundEventType;
  title: string;
  summary: string;
  activatedConflictIds: string[];
  spawnedConflictIds: string[];
};

export type RoundResolution = {
  round: number;
  nextState: PoliticalCoreState;
  events: AppliedRoundEvent[];
};

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

function requireCharacter(state: PoliticalCoreState, id: string) {
  const character = state.characters.find((item) => item.id === id);
  if (!character) throw new Error(`Character "${id}" was not found.`);
  return character;
}

function requireGoal(state: PoliticalCoreState, id: string) {
  const goal = state.goals.find((item) => item.id === id);
  if (!goal) throw new Error(`Goal "${id}" was not found.`);
  return goal;
}

function requireLeverage(state: PoliticalCoreState, id: string) {
  const leverage = state.leverages.find((item) => item.id === id);
  if (!leverage) throw new Error(`Leverage "${id}" was not found.`);
  return leverage;
}

function requireRelationship(
  state: PoliticalCoreState,
  fromCharacterId: string,
  toCharacterId: string,
) {
  const relationship = state.relationships.find(
    (item) =>
      item.fromCharacterId === fromCharacterId &&
      item.toCharacterId === toCharacterId,
  );
  if (!relationship) {
    throw new Error(
      `Relationship "${fromCharacterId} -> ${toCharacterId}" was not found.`,
    );
  }
  return relationship;
}

function applyEffect(
  state: PoliticalCoreState,
  effect: RoundEventEffect,
): void {
  switch (effect.type) {
    case "CHARACTER_MOMENTUM_DELTA": {
      const character = requireCharacter(state, effect.characterId);
      character.dynamic.momentum = clamp(
        -25,
        25,
        character.dynamic.momentum + effect.delta,
      );
      break;
    }
    case "CHARACTER_FATIGUE_DELTA": {
      const character = requireCharacter(state, effect.characterId);
      character.dynamic.politicalFatigue = clamp(
        0,
        100,
        character.dynamic.politicalFatigue + effect.delta,
      );
      break;
    }
    case "CHARACTER_INSTABILITY_DELTA": {
      const character = requireCharacter(state, effect.characterId);
      character.dynamic.instability = clamp(
        0,
        100,
        character.dynamic.instability + effect.delta,
      );
      break;
    }
    case "RELATIONSHIP_DELTA": {
      const relationship = requireRelationship(
        state,
        effect.fromCharacterId,
        effect.toCharacterId,
      );
      relationship[effect.metric] = clamp(
        0,
        100,
        relationship[effect.metric] + effect.delta,
      );
      break;
    }
    case "GOAL_PROGRESS_DELTA": {
      const goal = requireGoal(state, effect.goalId);
      goal.progress = clamp(0, 100, goal.progress + effect.delta);
      break;
    }
    case "GOAL_URGENCY_DELTA": {
      const goal = requireGoal(state, effect.goalId);
      goal.urgency = clamp(0, 100, goal.urgency + effect.delta);
      break;
    }
    case "LEVERAGE_STRENGTH_DELTA": {
      const leverage = requireLeverage(state, effect.leverageId);
      leverage.strength = clamp(0, 100, leverage.strength + effect.delta);
      break;
    }
    case "PRECEDENT_STRENGTH_DELTA": {
      const precedent = state.precedents.find((item) => item.id === effect.precedentId);
      if (!precedent) {
        throw new Error(`Precedent "${effect.precedentId}" was not found.`);
      }
      precedent.strength = clamp(0, 100, precedent.strength + effect.delta);
      break;
    }
  }
}

function conditionMatches(
  state: PoliticalCoreState,
  condition: ConflictTriggerCondition,
): boolean {
  switch (condition.type) {
    case "RELATIONSHIP_AT_LEAST": {
      const relationship = requireRelationship(
        state,
        condition.fromCharacterId,
        condition.toCharacterId,
      );
      return relationship[condition.metric] >= condition.value;
    }
    case "GOAL_URGENCY_AT_LEAST":
      return requireGoal(state, condition.goalId).urgency >= condition.value;
    case "CHARACTER_MOMENTUM_AT_LEAST":
      return (
        requireCharacter(state, condition.characterId).dynamic.momentum >=
        condition.value
      );
    case "CHARACTER_MOMENTUM_AT_MOST":
      return (
        requireCharacter(state, condition.characterId).dynamic.momentum <=
        condition.value
      );
    case "LEVERAGE_STRENGTH_AT_LEAST":
      return (
        requireLeverage(state, condition.leverageId).strength >= condition.value
      );
  }
}

function fireTrigger(
  state: PoliticalCoreState,
  trigger: RoundConflictTrigger,
): { activated: string[]; spawned: string[] } {
  if (!trigger.all.every((condition) => conditionMatches(state, condition))) {
    return { activated: [], spawned: [] };
  }

  const activated: string[] = [];
  const spawned: string[] = [];

  if (trigger.activateConflictId) {
    const conflict = state.conflicts.find(
      (item) => item.id === trigger.activateConflictId,
    );
    if (!conflict) {
      throw new Error(
        `Conflict "${trigger.activateConflictId}" was not found for trigger "${trigger.id}".`,
      );
    }
    if (conflict.status === "DORMANT") {
      conflict.status = "ACTIVE";
      activated.push(conflict.id);
    }
  }

  if (trigger.spawnConflict) {
    if (!state.conflicts.some((item) => item.id === trigger.spawnConflict?.id)) {
      state.conflicts.push(structuredClone(trigger.spawnConflict));
      spawned.push(trigger.spawnConflict.id);
    }
  }

  return { activated, spawned };
}

export function processRound(
  sourceState: PoliticalCoreState,
  round: number,
  events: RoundEventDefinition[],
): RoundResolution {
  if (!Number.isInteger(round) || round < 1) {
    throw new RangeError("round must be a positive integer.");
  }

  const nextState = structuredClone(sourceState);
  const applied: AppliedRoundEvent[] = [];

  for (const event of events.filter((item) => item.round === round)) {
    for (const effect of event.effects) {
      applyEffect(nextState, effect);
    }

    const activatedConflictIds: string[] = [];
    const spawnedConflictIds: string[] = [];

    for (const trigger of event.conflictTriggers ?? []) {
      const fired = fireTrigger(nextState, trigger);
      activatedConflictIds.push(...fired.activated);
      spawnedConflictIds.push(...fired.spawned);
    }

    applied.push({
      eventId: event.id,
      type: event.type,
      title: event.title,
      summary: event.summary,
      activatedConflictIds,
      spawnedConflictIds,
    });
  }

  const validation = validatePoliticalCoreState(nextState);
  if (!validation.success) {
    throw new Error("Round events produced an invalid political state.");
  }

  return {
    round,
    nextState: validation.data,
    events: applied,
  };
}
