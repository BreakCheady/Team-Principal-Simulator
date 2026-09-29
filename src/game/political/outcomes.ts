import type {
  ConflictDecisionDefinition,
  DecisionEffect,
} from "./decisions";
import type { PoliticalCoreState } from "./types";

export type OutcomeChange = {
  subject: string;
  metric: string;
  before: number;
  after: number;
};

export type ConflictDecisionResult = {
  decisionId: string;
  title: string;
  summary: string;
  nextState: PoliticalCoreState;
  changes: OutcomeChange[];
};

type DecisionContext = {
  round: number;
};

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

function requireEntity<T extends { id: string }>(
  entities: T[],
  id: string,
  label: string,
): T {
  const entity = entities.find((item) => item.id === id);
  if (!entity) throw new Error(`${label} "${id}" was not found.`);
  return entity;
}

function pushChange(
  changes: OutcomeChange[],
  subject: string,
  metric: string,
  before: number,
  after: number,
) {
  changes.push({ subject, metric, before, after });
}

function applyEffect(
  state: PoliticalCoreState,
  effect: DecisionEffect,
  changes: OutcomeChange[],
) {
  switch (effect.type) {
    case "CHARACTER_MOMENTUM_DELTA": {
      const character = requireEntity(state.characters, effect.characterId, "Character");
      const before = character.dynamic.momentum;
      const after = clamp(-25, 25, before + effect.delta);
      character.dynamic.momentum = after;
      pushChange(changes, effect.subject, "Momentum", before, after);
      return;
    }
    case "RELATIONSHIP_DELTA": {
      const relationship = requireEntity(
        state.relationships,
        effect.relationshipId,
        "Relationship",
      );
      const before = relationship[effect.metric];
      const after = clamp(0, 100, before + effect.delta);
      relationship[effect.metric] = after;
      pushChange(changes, effect.subject, effect.metric, before, after);
      return;
    }
    case "GOAL_PROGRESS_DELTA": {
      const goal = requireEntity(state.goals, effect.goalId, "Goal");
      const before = goal.progress;
      const after = clamp(0, 100, before + effect.delta);
      goal.progress = after;
      pushChange(changes, effect.subject, "Progress", before, after);
      return;
    }
    case "PRECEDENT_STRENGTH_DELTA": {
      const precedent = requireEntity(state.precedents, effect.precedentId, "Precedent");
      const before = precedent.strength;
      const after = clamp(0, 100, before + effect.delta);
      precedent.strength = after;
      pushChange(changes, effect.subject, "Strength", before, after);
      return;
    }
    case "PRECEDENT_COUNTER_DELTA": {
      const precedent = requireEntity(state.precedents, effect.precedentId, "Precedent");
      const before = precedent[effect.counter];
      const after = Math.max(0, before + effect.delta);
      precedent[effect.counter] = after;
      pushChange(changes, effect.subject, effect.counter, before, after);
      return;
    }
    default: {
      const exhaustive: never = effect;
      throw new Error(`Unsupported effect: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export function resolveConflictDecision(
  sourceState: PoliticalCoreState,
  conflictId: string,
  decision: ConflictDecisionDefinition,
  context: DecisionContext,
): ConflictDecisionResult {
  if (decision.conflictId !== conflictId) {
    throw new Error(
      `Decision "${decision.id}" belongs to conflict "${decision.conflictId}", not "${conflictId}".`,
    );
  }

  const nextState = structuredClone(sourceState);
  const conflict = requireEntity(nextState.conflicts, conflictId, "Conflict");

  if (conflict.status === "RESOLVED") {
    throw new Error(`Conflict "${conflict.id}" is already resolved.`);
  }

  if (conflict.status !== "ACTIVE" && conflict.status !== "ESCALATED") {
    throw new Error(
      `Conflict "${conflict.id}" must be active or escalated before it can be resolved.`,
    );
  }

  if (context.round < conflict.roundStarted) {
    throw new Error(
      `Conflict "${conflict.id}" cannot resolve in round ${context.round} before it started in round ${conflict.roundStarted}.`,
    );
  }

  const changes: OutcomeChange[] = [];
  for (const effect of decision.effects) {
    applyEffect(nextState, effect, changes);
  }

  conflict.status = "RESOLVED";
  conflict.outcome = decision.outcome;
  conflict.roundResolved = context.round;

  return {
    decisionId: decision.id,
    title: decision.title,
    summary: decision.summary,
    nextState,
    changes,
  };
}
