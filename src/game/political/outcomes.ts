import {
  ConflictDecisionId,
  type ConflictDecisionId as ConflictDecisionIdType,
} from "./decisions";
import type {
  Character,
  Conflict,
  Goal,
  PoliticalCoreState,
  Precedent,
  Relationship,
} from "./types";

export type OutcomeChange = {
  subject: string;
  metric: string;
  before: number;
  after: number;
};

export type ConflictDecisionResult = {
  decisionId: ConflictDecisionIdType;
  title: string;
  summary: string;
  nextState: PoliticalCoreState;
  changes: OutcomeChange[];
};

export const VANGUARD_TECHNICAL_DIRECTION_CONFLICT_ID =
  "conflict_technical_direction";

type DecisionContext = {
  round: number;
};

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

type NumericKey<T> = {
  [K in keyof T]-?: T[K] extends number ? K : never;
}[keyof T];

function changeScore<T extends object, K extends NumericKey<T>>(
  changes: OutcomeChange[],
  subject: string,
  metric: string,
  target: T,
  key: K,
  delta: number,
  min = 0,
  max = 100,
) {
  const before = target[key] as number;
  const after = clamp(min, max, before + delta);
  target[key] = after as T[K];
  changes.push({ subject, metric, before, after });
}

function characterById(state: PoliticalCoreState, id: string): Character {
  const character = state.characters.find((item) => item.id === id);
  if (!character) throw new Error(`Character "${id}" was not found.`);
  return character;
}

function relationshipById(state: PoliticalCoreState, id: string): Relationship {
  const relationship = state.relationships.find((item) => item.id === id);
  if (!relationship) throw new Error(`Relationship "${id}" was not found.`);
  return relationship;
}

function goalById(state: PoliticalCoreState, id: string): Goal {
  const goal = state.goals.find((item) => item.id === id);
  if (!goal) throw new Error(`Goal "${id}" was not found.`);
  return goal;
}

function precedentById(state: PoliticalCoreState, id: string): Precedent {
  const precedent = state.precedents.find((item) => item.id === id);
  if (!precedent) throw new Error(`Precedent "${id}" was not found.`);
  return precedent;
}

function conflictById(state: PoliticalCoreState, id: string): Conflict {
  const conflict = state.conflicts.find((item) => item.id === id);
  if (!conflict) throw new Error(`Conflict "${id}" was not found.`);
  return conflict;
}

function resolveConflict(
  conflict: Conflict,
  outcome: NonNullable<Conflict["outcome"]>,
  round: number,
) {
  if (conflict.status === "RESOLVED") {
    throw new Error(`Conflict "${conflict.id}" is already resolved.`);
  }

  if (round < conflict.roundStarted) {
    throw new Error(
      `Conflict "${conflict.id}" cannot resolve in round ${round} before it started in round ${conflict.roundStarted}.`,
    );
  }

  conflict.status = "RESOLVED";
  conflict.outcome = outcome;
  conflict.roundResolved = round;
}

function applySupportMoretti(
  state: PoliticalCoreState,
  conflict: Conflict,
  context: DecisionContext,
): Omit<ConflictDecisionResult, "decisionId" | "nextState"> {
  const changes: OutcomeChange[] = [];

  const moretti = characterById(state, "char_moretti");
  const chen = characterById(state, "char_chen");
  const morettiHartmann = relationshipById(state, "rel_moretti_hartmann");
  const chenMoretti = relationshipById(state, "rel_chen_moretti");
  const kellerMoretti = relationshipById(state, "rel_keller_moretti");
  const morettiTech = goalById(state, "goal_moretti_tech");
  const chenAuthority = goalById(state, "goal_chen_authority");
  const precedent = precedentById(state, "precedent_technical_authority");

  changeScore(changes, moretti.name, "Momentum", moretti.dynamic, "momentum", 5, -25, 25);
  changeScore(changes, chen.name, "Momentum", chen.dynamic, "momentum", -4, -25, 25);
  changeScore(changes, "Moretti → Hartmann", "Trust", morettiHartmann, "trust", 8);
  changeScore(changes, "Moretti → Hartmann", "Loyalty", morettiHartmann, "loyalty", 6);
  changeScore(changes, "Moretti → Hartmann", "Resentment", morettiHartmann, "resentment", -6);
  changeScore(changes, "Chen → Moretti", "Trust", chenMoretti, "trust", -8);
  changeScore(changes, "Chen → Moretti", "Resentment", chenMoretti, "resentment", 10);
  changeScore(changes, "Keller → Moretti", "Trust", kellerMoretti, "trust", -4);
  changeScore(changes, "Keller → Moretti", "Resentment", kellerMoretti, "resentment", 8);
  changeScore(changes, "Moretti technical influence", "Progress", morettiTech, "progress", 30);
  changeScore(changes, "Chen technical authority", "Progress", chenAuthority, "progress", -20);
  changeScore(changes, "Technical authority precedent", "Strength", precedent, "strength", -10);

  const beforeViolations = precedent.violations;
  precedent.violations += 1;
  changes.push({
    subject: "Technical authority precedent",
    metric: "Violations",
    before: beforeViolations,
    after: precedent.violations,
  });

  resolveConflict(conflict, "NARROW_WIN_A", context.round);

  return {
    title: "Moretti gets greater technical influence",
    summary:
      "The star driver gains political momentum, but Chen's authority and the existing technical precedent are weakened.",
    changes,
  };
}

function applyCompromise(
  state: PoliticalCoreState,
  conflict: Conflict,
  context: DecisionContext,
): Omit<ConflictDecisionResult, "decisionId" | "nextState"> {
  const changes: OutcomeChange[] = [];

  const moretti = characterById(state, "char_moretti");
  const chen = characterById(state, "char_chen");
  const hartmann = characterById(state, "char_hartmann");
  const morettiChen = relationshipById(state, "rel_moretti_chen");
  const chenMoretti = relationshipById(state, "rel_chen_moretti");
  const morettiTech = goalById(state, "goal_moretti_tech");
  const chenAuthority = goalById(state, "goal_chen_authority");
  const precedent = precedentById(state, "precedent_technical_authority");

  changeScore(changes, moretti.name, "Momentum", moretti.dynamic, "momentum", 2, -25, 25);
  changeScore(changes, chen.name, "Momentum", chen.dynamic, "momentum", 1, -25, 25);
  changeScore(changes, hartmann.name, "Momentum", hartmann.dynamic, "momentum", 4, -25, 25);
  changeScore(changes, "Moretti → Chen", "Trust", morettiChen, "trust", 4);
  changeScore(changes, "Moretti → Chen", "Resentment", morettiChen, "resentment", -5);
  changeScore(changes, "Chen → Moretti", "Trust", chenMoretti, "trust", 5);
  changeScore(changes, "Chen → Moretti", "Resentment", chenMoretti, "resentment", -5);
  changeScore(changes, "Moretti technical influence", "Progress", morettiTech, "progress", 12);
  changeScore(changes, "Chen technical authority", "Progress", chenAuthority, "progress", 5);
  changeScore(changes, "Technical authority precedent", "Strength", precedent, "strength", 4);

  const beforeApplications = precedent.applications;
  precedent.applications += 1;
  changes.push({
    subject: "Technical authority precedent",
    metric: "Applications",
    before: beforeApplications,
    after: precedent.applications,
  });

  resolveConflict(conflict, "COMPROMISE", context.round);

  return {
    title: "A controlled compromise",
    summary:
      "Moretti receives more weight in development feedback, while Chen retains final technical authority. The precedent survives and both sides can claim something.",
    changes,
  };
}

function applySupportChen(
  state: PoliticalCoreState,
  conflict: Conflict,
  context: DecisionContext,
): Omit<ConflictDecisionResult, "decisionId" | "nextState"> {
  const changes: OutcomeChange[] = [];

  const moretti = characterById(state, "char_moretti");
  const chen = characterById(state, "char_chen");
  const hartmann = characterById(state, "char_hartmann");
  const morettiHartmann = relationshipById(state, "rel_moretti_hartmann");
  const morettiChen = relationshipById(state, "rel_moretti_chen");
  const kellerMoretti = relationshipById(state, "rel_keller_moretti");
  const morettiTech = goalById(state, "goal_moretti_tech");
  const chenAuthority = goalById(state, "goal_chen_authority");
  const precedent = precedentById(state, "precedent_technical_authority");

  changeScore(changes, moretti.name, "Momentum", moretti.dynamic, "momentum", -5, -25, 25);
  changeScore(changes, chen.name, "Momentum", chen.dynamic, "momentum", 4, -25, 25);
  changeScore(changes, hartmann.name, "Momentum", hartmann.dynamic, "momentum", 3, -25, 25);
  changeScore(changes, "Moretti → Hartmann", "Trust", morettiHartmann, "trust", -8);
  changeScore(changes, "Moretti → Hartmann", "Resentment", morettiHartmann, "resentment", 10);
  changeScore(changes, "Moretti → Chen", "Trust", morettiChen, "trust", -7);
  changeScore(changes, "Moretti → Chen", "Resentment", morettiChen, "resentment", 8);
  changeScore(changes, "Keller → Moretti", "Resentment", kellerMoretti, "resentment", -4);
  changeScore(changes, "Moretti technical influence", "Progress", morettiTech, "progress", -10);
  changeScore(changes, "Chen technical authority", "Progress", chenAuthority, "progress", 10);
  changeScore(changes, "Technical authority precedent", "Strength", precedent, "strength", 8);

  const beforeApplications = precedent.applications;
  precedent.applications += 1;
  changes.push({
    subject: "Technical authority precedent",
    metric: "Applications",
    before: beforeApplications,
    after: precedent.applications,
  });

  resolveConflict(conflict, "NARROW_WIN_B", context.round);

  return {
    title: "Chen's authority is upheld",
    summary:
      "The technical chain of command is reinforced. Moretti loses momentum and trust in Hartmann, while the institutional precedent becomes harder to challenge.",
    changes,
  };
}

export function resolveVanguardTechnicalDirectionDecision(
  sourceState: PoliticalCoreState,
  conflictId: string,
  decisionId: ConflictDecisionIdType,
  context: DecisionContext,
): ConflictDecisionResult {
  if (conflictId !== VANGUARD_TECHNICAL_DIRECTION_CONFLICT_ID) {
    throw new Error(
      `This resolver only supports "${VANGUARD_TECHNICAL_DIRECTION_CONFLICT_ID}".`,
    );
  }

  const nextState = structuredClone(sourceState);
  const conflict = conflictById(nextState, conflictId);

  if (
    conflict.type !== "TECHNICAL_DIRECTION" ||
    conflict.initiatorCharacterId !== "char_moretti" ||
    conflict.factions[0].leaderCharacterId !== "char_moretti" ||
    conflict.factions[1].leaderCharacterId !== "char_chen"
  ) {
    throw new Error(
      "The Vanguard technical-direction scenario no longer matches its expected actors.",
    );
  }

  let outcome: Omit<ConflictDecisionResult, "decisionId" | "nextState">;

  switch (decisionId) {
    case ConflictDecisionId.SUPPORT_MORETTI:
      outcome = applySupportMoretti(nextState, conflict, context);
      break;
    case ConflictDecisionId.COMPROMISE:
      outcome = applyCompromise(nextState, conflict, context);
      break;
    case ConflictDecisionId.SUPPORT_CHEN:
      outcome = applySupportChen(nextState, conflict, context);
      break;
    default: {
      const exhaustive: never = decisionId;
      throw new Error(`Unsupported decision: ${exhaustive}`);
    }
  }

  return {
    decisionId,
    nextState,
    ...outcome,
  };
}
