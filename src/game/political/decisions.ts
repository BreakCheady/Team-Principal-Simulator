import type { Conflict } from "./types";

export type RelationshipMetric =
  | "trust"
  | "loyalty"
  | "respect"
  | "dependency"
  | "resentment"
  | "personalLeverage";

export type DecisionEffect =
  | {
      type: "CHARACTER_MOMENTUM_DELTA";
      characterId: string;
      delta: number;
      subject: string;
    }
  | {
      type: "RELATIONSHIP_DELTA";
      relationshipId: string;
      metric: RelationshipMetric;
      delta: number;
      subject: string;
    }
  | {
      type: "GOAL_PROGRESS_DELTA";
      goalId: string;
      delta: number;
      subject: string;
    }
  | {
      type: "PRECEDENT_STRENGTH_DELTA";
      precedentId: string;
      delta: number;
      subject: string;
    }
  | {
      type: "PRECEDENT_COUNTER_DELTA";
      precedentId: string;
      counter: "applications" | "violations";
      delta: number;
      subject: string;
    };

export type ConflictDecisionDefinition = {
  id: string;
  conflictId: string;
  label: string;
  description: string;
  title: string;
  summary: string;
  outcome: NonNullable<Conflict["outcome"]>;
  effects: DecisionEffect[];
};

export const vanguardTechnicalDirectionDecisions: ConflictDecisionDefinition[] = [
  {
    id: "support_moretti",
    conflictId: "conflict_technical_direction",
    label: "Support Moretti",
    description:
      "Give the star driver greater technical influence, accepting institutional cost.",
    title: "Moretti gets greater technical influence",
    summary:
      "The star driver gains political momentum, but Chen's authority and the existing technical precedent are weakened.",
    outcome: "NARROW_WIN_A",
    effects: [
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_moretti", delta: 5, subject: "Luca Moretti" },
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_chen", delta: -4, subject: "Dr. Adrian Chen" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_hartmann", metric: "trust", delta: 8, subject: "Moretti → Hartmann" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_hartmann", metric: "loyalty", delta: 6, subject: "Moretti → Hartmann" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_hartmann", metric: "resentment", delta: -6, subject: "Moretti → Hartmann" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_chen_moretti", metric: "trust", delta: -8, subject: "Chen → Moretti" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_chen_moretti", metric: "resentment", delta: 10, subject: "Chen → Moretti" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_keller_moretti", metric: "trust", delta: -4, subject: "Keller → Moretti" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_keller_moretti", metric: "resentment", delta: 8, subject: "Keller → Moretti" },
      { type: "GOAL_PROGRESS_DELTA", goalId: "goal_moretti_tech", delta: 30, subject: "Moretti technical influence" },
      { type: "GOAL_PROGRESS_DELTA", goalId: "goal_chen_authority", delta: -20, subject: "Chen technical authority" },
      { type: "PRECEDENT_STRENGTH_DELTA", precedentId: "precedent_technical_authority", delta: -10, subject: "Technical authority precedent" },
      { type: "PRECEDENT_COUNTER_DELTA", precedentId: "precedent_technical_authority", counter: "violations", delta: 1, subject: "Technical authority precedent" },
    ],
  },
  {
    id: "offer_compromise",
    conflictId: "conflict_technical_direction",
    label: "Offer compromise",
    description:
      "Increase Moretti's feedback weight while Chen keeps final technical authority.",
    title: "A controlled compromise",
    summary:
      "Moretti receives more weight in development feedback, while Chen retains final technical authority. The precedent survives and both sides can claim something.",
    outcome: "COMPROMISE",
    effects: [
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_moretti", delta: 2, subject: "Luca Moretti" },
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_chen", delta: 1, subject: "Dr. Adrian Chen" },
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 4, subject: "Daniel Hartmann" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_chen", metric: "trust", delta: 4, subject: "Moretti → Chen" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_chen", metric: "resentment", delta: -5, subject: "Moretti → Chen" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_chen_moretti", metric: "trust", delta: 5, subject: "Chen → Moretti" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_chen_moretti", metric: "resentment", delta: -5, subject: "Chen → Moretti" },
      { type: "GOAL_PROGRESS_DELTA", goalId: "goal_moretti_tech", delta: 12, subject: "Moretti technical influence" },
      { type: "GOAL_PROGRESS_DELTA", goalId: "goal_chen_authority", delta: 5, subject: "Chen technical authority" },
      { type: "PRECEDENT_STRENGTH_DELTA", precedentId: "precedent_technical_authority", delta: 4, subject: "Technical authority precedent" },
      { type: "PRECEDENT_COUNTER_DELTA", precedentId: "precedent_technical_authority", counter: "applications", delta: 1, subject: "Technical authority precedent" },
    ],
  },
  {
    id: "support_chen",
    conflictId: "conflict_technical_direction",
    label: "Support Chen",
    description:
      "Defend the technical chain of command and reinforce the existing precedent.",
    title: "Chen's authority is upheld",
    summary:
      "The technical chain of command is reinforced. Moretti loses momentum and trust in Hartmann, while the institutional precedent becomes harder to challenge.",
    outcome: "NARROW_WIN_B",
    effects: [
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_moretti", delta: -5, subject: "Luca Moretti" },
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_chen", delta: 4, subject: "Dr. Adrian Chen" },
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 3, subject: "Daniel Hartmann" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_hartmann", metric: "trust", delta: -8, subject: "Moretti → Hartmann" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_hartmann", metric: "resentment", delta: 10, subject: "Moretti → Hartmann" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_chen", metric: "trust", delta: -7, subject: "Moretti → Chen" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_chen", metric: "resentment", delta: 8, subject: "Moretti → Chen" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_keller_moretti", metric: "resentment", delta: -4, subject: "Keller → Moretti" },
      { type: "GOAL_PROGRESS_DELTA", goalId: "goal_moretti_tech", delta: -10, subject: "Moretti technical influence" },
      { type: "GOAL_PROGRESS_DELTA", goalId: "goal_chen_authority", delta: 10, subject: "Chen technical authority" },
      { type: "PRECEDENT_STRENGTH_DELTA", precedentId: "precedent_technical_authority", delta: 8, subject: "Technical authority precedent" },
      { type: "PRECEDENT_COUNTER_DELTA", precedentId: "precedent_technical_authority", counter: "applications", delta: 1, subject: "Technical authority precedent" },
    ],
  },
];

export const driverPriorityDecisions: ConflictDecisionDefinition[] = [
  {
    id: "back_keller",
    conflictId: "conflict_driver_status",
    label: "Back Keller",
    description: "Protect equality and reduce Moretti's privileged sporting position.",
    title: "Keller wins a political concession",
    summary:
      "Keller gains momentum and the performance-based driver-priority precedent is applied against automatic star-driver privilege.",
    outcome: "NARROW_WIN_A",
    effects: [
      {
        type: "CHARACTER_MOMENTUM_DELTA",
        characterId: "char_keller",
        delta: 4,
        subject: "Noah Keller",
      },
      {
        type: "CHARACTER_MOMENTUM_DELTA",
        characterId: "char_moretti",
        delta: -3,
        subject: "Luca Moretti",
      },
      {
        type: "PRECEDENT_COUNTER_DELTA",
        precedentId: "precedent_driver_priority",
        counter: "applications",
        delta: 1,
        subject: "Driver priority precedent",
      },
    ],
  },
  {
    id: "protect_moretti_status",
    conflictId: "conflict_driver_status",
    label: "Protect Moretti's status",
    description: "Preserve the star driver's sporting priority despite Keller's challenge.",
    title: "Moretti keeps the upper hand",
    summary:
      "Moretti retains sporting priority, but the objective driver-priority precedent is weakened.",
    outcome: "NARROW_WIN_B",
    effects: [
      {
        type: "CHARACTER_MOMENTUM_DELTA",
        characterId: "char_moretti",
        delta: 3,
        subject: "Luca Moretti",
      },
      {
        type: "CHARACTER_MOMENTUM_DELTA",
        characterId: "char_keller",
        delta: -3,
        subject: "Noah Keller",
      },
      {
        type: "PRECEDENT_STRENGTH_DELTA",
        precedentId: "precedent_driver_priority",
        delta: -8,
        subject: "Driver priority precedent",
      },
      {
        type: "PRECEDENT_COUNTER_DELTA",
        precedentId: "precedent_driver_priority",
        counter: "violations",
        delta: 1,
        subject: "Driver priority precedent",
      },
    ],
  },
];

export function assertUniqueDecisionCatalog(
  decisions: ConflictDecisionDefinition[],
): void {
  const keys = new Set<string>();

  for (const decision of decisions) {
    const key = `${decision.conflictId}::${decision.id}`;
    if (keys.has(key)) {
      throw new Error(
        `Duplicate decision id "${decision.id}" for conflict "${decision.conflictId}".`,
      );
    }
    keys.add(key);
  }
}

const decisionCatalog: ConflictDecisionDefinition[] = [
  ...vanguardTechnicalDirectionDecisions,
  ...driverPriorityDecisions,
];

assertUniqueDecisionCatalog(decisionCatalog);

export function getConflictDecisions(conflictId: string): ConflictDecisionDefinition[] {
  return decisionCatalog.filter((decision) => decision.conflictId === conflictId);
}

export function getConflictDecision(
  conflictId: string,
  decisionId: string,
): ConflictDecisionDefinition {
  const decision = decisionCatalog.find(
    (item) => item.conflictId === conflictId && item.id === decisionId,
  );

  if (!decision) {
    throw new Error(
      `Decision "${decisionId}" is not defined for conflict "${conflictId}".`,
    );
  }

  return decision;
}
