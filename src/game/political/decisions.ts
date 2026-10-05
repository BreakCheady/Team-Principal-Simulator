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
    label: "Moretti unterstützen",
    description:
      "Gib dem Starfahrer mehr technischen Einfluss und akzeptiere die institutionellen Kosten.",
    title: "Moretti erhält mehr technischen Einfluss",
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
      { type: "GOAL_PROGRESS_DELTA", goalId: "goal_moretti_tech", delta: 30, subject: "Morettis technischer Einfluss" },
      { type: "GOAL_PROGRESS_DELTA", goalId: "goal_chen_authority", delta: -20, subject: "Chens technische Autorität" },
      { type: "PRECEDENT_STRENGTH_DELTA", precedentId: "precedent_technical_authority", delta: -10, subject: "Präzedenz technische Autorität" },
      { type: "PRECEDENT_COUNTER_DELTA", precedentId: "precedent_technical_authority", counter: "violations", delta: 1, subject: "Präzedenz technische Autorität" },
    ],
  },
  {
    id: "offer_compromise",
    conflictId: "conflict_technical_direction",
    label: "Kompromiss anbieten",
    description:
      "Increase Moretti's feedback weight while Chen keeps final technical authority.",
    title: "Ein kontrollierter Kompromiss",
    summary:
      "Moretti erhält mehr Gewicht beim Entwicklungsfeedback, während Chen die letzte technische Entscheidungsgewalt behält. Der Präzedenzfall bleibt bestehen und beide Seiten erhalten ein Zugeständnis.",
    outcome: "COMPROMISE",
    effects: [
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_moretti", delta: 2, subject: "Luca Moretti" },
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_chen", delta: 1, subject: "Dr. Adrian Chen" },
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 4, subject: "Daniel Hartmann" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_chen", metric: "trust", delta: 4, subject: "Moretti → Chen" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_chen", metric: "resentment", delta: -5, subject: "Moretti → Chen" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_chen_moretti", metric: "trust", delta: 5, subject: "Chen → Moretti" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_chen_moretti", metric: "resentment", delta: -5, subject: "Chen → Moretti" },
      { type: "GOAL_PROGRESS_DELTA", goalId: "goal_moretti_tech", delta: 12, subject: "Morettis technischer Einfluss" },
      { type: "GOAL_PROGRESS_DELTA", goalId: "goal_chen_authority", delta: 5, subject: "Chens technische Autorität" },
      { type: "PRECEDENT_STRENGTH_DELTA", precedentId: "precedent_technical_authority", delta: 4, subject: "Präzedenz technische Autorität" },
      { type: "PRECEDENT_COUNTER_DELTA", precedentId: "precedent_technical_authority", counter: "applications", delta: 1, subject: "Präzedenz technische Autorität" },
    ],
  },
  {
    id: "support_chen",
    conflictId: "conflict_technical_direction",
    label: "Chen unterstützen",
    description:
      "Verteidige die technische Befehlskette und stärke den bestehenden Präzedenzfall.",
    title: "Chen's authority is upheld",
    summary:
      "Die technische Befehlskette wird gestärkt. Moretti verliert Dynamik und Vertrauen in Hartmann, während der institutionelle Präzedenzfall schwerer angreifbar wird.",
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
      { type: "GOAL_PROGRESS_DELTA", goalId: "goal_moretti_tech", delta: -10, subject: "Morettis technischer Einfluss" },
      { type: "GOAL_PROGRESS_DELTA", goalId: "goal_chen_authority", delta: 10, subject: "Chens technische Autorität" },
      { type: "PRECEDENT_STRENGTH_DELTA", precedentId: "precedent_technical_authority", delta: 8, subject: "Präzedenz technische Autorität" },
      { type: "PRECEDENT_COUNTER_DELTA", precedentId: "precedent_technical_authority", counter: "applications", delta: 1, subject: "Präzedenz technische Autorität" },
    ],
  },
];

export const driverPriorityDecisions: ConflictDecisionDefinition[] = [
  {
    id: "back_keller",
    conflictId: "conflict_driver_status",
    label: "Keller unterstützen",
    description: "Protect equality and reduce Moretti's privileged sporting position.",
    title: "Keller erhält ein politisches Zugeständnis",
    summary:
      "Keller gewinnt an Dynamik und der leistungsbasierte Fahrerprioritäts-Präzedenzfall wird gegen automatische Starfahrer-Sonderrechte angewandt.",
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
        subject: "Präzedenz Fahrerpriorität",
      },
    ],
  },
  {
    id: "protect_moretti_status",
    conflictId: "conflict_driver_status",
    label: "Protect Moretti's status",
    description: "Preserve the star driver's sporting priority despite Keller's challenge.",
    title: "Moretti behält die Oberhand",
    summary:
      "Moretti behält den sportlichen Vorrang, aber der objektive Fahrerprioritäts-Präzedenzfall wird geschwächt.",
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
        subject: "Präzedenz Fahrerpriorität",
      },
      {
        type: "PRECEDENT_COUNTER_DELTA",
        precedentId: "precedent_driver_priority",
        counter: "violations",
        delta: 1,
        subject: "Präzedenz Fahrerpriorität",
      },
    ],
  },
];

export const mediaConflictDecisions: ConflictDecisionDefinition[] = [
  {
    id: "contain_media_story",
    conflictId: "conflict_moretti_media_pressure",
    label: "Berichterstattung eindämmen",
    description:
      "Vereinbare eine kontrollierte öffentliche Linie und halte den sportlichen Konflikt intern.",
    title: "Der Medienkonflikt wird eingedämmt",
    summary:
      "Beide Seiten ziehen sich aus der öffentlichen Eskalation zurück. Hartmann schützt seine Autorität, ohne Moretti bloßzustellen.",
    outcome: "COMPROMISE",
    effects: [
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 2, subject: "Daniel Hartmann" },
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_moretti", delta: -1, subject: "Luca Moretti" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_hartmann", metric: "trust", delta: 4, subject: "Moretti → Hartmann" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_hartmann", metric: "resentment", delta: -4, subject: "Moretti → Hartmann" },
    ],
  },
  {
    id: "back_moretti_publicly",
    conflictId: "conflict_moretti_media_pressure",
    label: "Moretti öffentlich unterstützen",
    description:
      "Übernimm seine Darstellung und stärke dem Starfahrer vor dem Paddock den Rücken.",
    title: "Moretti gewinnt die öffentliche Auseinandersetzung",
    summary:
      "Moretti gewinnt Dynamik und Loyalität, Hartmann gibt jedoch einen Teil der Kontrolle über die öffentliche Darstellung ab.",
    outcome: "NARROW_WIN_A",
    effects: [
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_moretti", delta: 4, subject: "Luca Moretti" },
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: -2, subject: "Daniel Hartmann" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_hartmann", metric: "loyalty", delta: 6, subject: "Moretti → Hartmann" },
      { type: "PRECEDENT_STRENGTH_DELTA", precedentId: "precedent_driver_priority", delta: -4, subject: "Präzedenz Fahrerpriorität" },
    ],
  },
  {
    id: "discipline_moretti_media",
    conflictId: "conflict_moretti_media_pressure",
    label: "Moretti disziplinieren",
    description:
      "Ziehe eine klare Grenze: Fahrer bestimmen die Teamlinie nicht über die Presse.",
    title: "Hartmann stellt die Medienkontrolle wieder her",
    summary:
      "Der Teamchef gewinnt den institutionellen Streit, doch die Beziehung zu Moretti verschlechtert sich.",
    outcome: "NARROW_WIN_B",
    effects: [
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_moretti", delta: -4, subject: "Luca Moretti" },
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 3, subject: "Daniel Hartmann" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_hartmann", metric: "trust", delta: -7, subject: "Moretti → Hartmann" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_hartmann", metric: "resentment", delta: 9, subject: "Moretti → Hartmann" },
    ],
  },
];

export const contractConflictDecisions: ConflictDecisionDefinition[] = [
  {
    id: "structured_contract_compromise",
    conflictId: "conflict_moretti_contract",
    label: "Strukturierten Kompromiss verhandeln",
    description:
      "Biete Überprüfungspunkte und leistungsabhängige sportliche Zusagen ohne dauerhafte Garantien an.",
    title: "Vertragsgespräche kehren in geordnete Bahnen zurück",
    summary:
      "Moretti erhält einen glaubwürdigen Weg zu sportlichem Vorrang, während Hartmann keine dauerhafte Autorität abgibt.",
    outcome: "COMPROMISE",
    effects: [
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 2, subject: "Daniel Hartmann" },
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_moretti", delta: 1, subject: "Luca Moretti" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_hartmann", metric: "trust", delta: 5, subject: "Moretti → Hartmann" },
      { type: "PRECEDENT_COUNTER_DELTA", precedentId: "precedent_driver_priority", counter: "applications", delta: 1, subject: "Präzedenz Fahrerpriorität" },
    ],
  },
  {
    id: "grant_contract_guarantees",
    conflictId: "conflict_moretti_contract",
    label: "Sportliche Garantien gewähren",
    description:
      "Binde Moretti mit stärkeren sportlichen Prioritäten im Vertrag.",
    title: "Moretti gewinnt Verhandlungsmacht",
    summary:
      "Der Starfahrer gewinnt Sicherheit und Macht, während Keller und der objektive Prioritäts-Präzedenzfall geschwächt werden.",
    outcome: "NARROW_WIN_A",
    effects: [
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_moretti", delta: 4, subject: "Luca Moretti" },
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_keller", delta: -3, subject: "Noah Keller" },
      { type: "PRECEDENT_STRENGTH_DELTA", precedentId: "precedent_driver_priority", delta: -10, subject: "Präzedenz Fahrerpriorität" },
      { type: "PRECEDENT_COUNTER_DELTA", precedentId: "precedent_driver_priority", counter: "violations", delta: 1, subject: "Präzedenz Fahrerpriorität" },
    ],
  },
  {
    id: "hold_contract_line",
    conflictId: "conflict_moretti_contract",
    label: "Position halten",
    description:
      "Lehne dauerhafte sportliche Garantien ab und zwinge Moretti zu entscheiden, ob er wirklich gehen will.",
    title: "Hartmann schützt die Vertragsautorität",
    summary:
      "Das Team hält an der regelbasierten Position fest, doch Moretti geht verärgerter und mit weniger Vertrauen aus dem Konflikt.",
    outcome: "NARROW_WIN_B",
    effects: [
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_moretti", delta: -3, subject: "Luca Moretti" },
      { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 3, subject: "Daniel Hartmann" },
      { type: "RELATIONSHIP_DELTA", relationshipId: "rel_moretti_hartmann", metric: "resentment", delta: 8, subject: "Moretti → Hartmann" },
      { type: "PRECEDENT_STRENGTH_DELTA", precedentId: "precedent_driver_priority", delta: 5, subject: "Präzedenz Fahrerpriorität" },
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
  ...mediaConflictDecisions,
  ...contractConflictDecisions,
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
