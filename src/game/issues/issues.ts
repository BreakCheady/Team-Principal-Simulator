import type { Conflict, PoliticalCoreState } from "@/game/political/types";
import { validatePoliticalCoreState } from "@/game/political/validation";
import type { AppliedRoundEvent } from "@/game/season/round-events";

export type IssueStatus = "OPEN" | "WATCHING" | "RESOLVED" | "ESCALATED";

export type IssueEffect =
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
      type: "RELATIONSHIP_DELTA";
      fromCharacterId: string;
      toCharacterId: string;
      metric: "trust" | "loyalty" | "respect" | "dependency" | "resentment";
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
    };

export type IssueActionDefinition = {
  id: string;
  label: string;
  description: string;
  escalationDelta: number;
  effects: IssueEffect[];
};

export type IssueDefinition = {
  id: string;
  sourceEventId: string;
  title: string;
  summary: string;
  category: "SPORTING" | "TECHNICAL" | "MEDIA" | "CONTRACT";
  initiatorCharacterId: string;
  baseEscalation: number;
  escalationThreshold: number;
  actions: IssueActionDefinition[];
  spawnedConflict?: Conflict;
};

export type NpcIssueAction = {
  characterId: string;
  label: string;
  escalationDelta: number;
};

export type IssueState = {
  id: string;
  definitionId: string;
  sourceEventId: string;
  title: string;
  summary: string;
  category: IssueDefinition["category"];
  initiatorCharacterId: string;
  round: number;
  status: IssueStatus;
  escalation: number;
  selectedActionId: string | null;
  npcActions: NpcIssueAction[];
  spawnedConflictId: string | null;
};

export type IssueActionResult = {
  political: PoliticalCoreState;
  issue: IssueState;
  spawnedConflictId: string | null;
};

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

function applyEffect(state: PoliticalCoreState, effect: IssueEffect): void {
  switch (effect.type) {
    case "CHARACTER_MOMENTUM_DELTA": {
      const character = state.characters.find(
        (item) => item.id === effect.characterId,
      );
      if (!character) throw new Error(`Unknown character "${effect.characterId}".`);
      character.dynamic.momentum = clamp(
        -25,
        25,
        character.dynamic.momentum + effect.delta,
      );
      break;
    }
    case "CHARACTER_FATIGUE_DELTA": {
      const character = state.characters.find(
        (item) => item.id === effect.characterId,
      );
      if (!character) throw new Error(`Unknown character "${effect.characterId}".`);
      character.dynamic.politicalFatigue = clamp(
        0,
        100,
        character.dynamic.politicalFatigue + effect.delta,
      );
      break;
    }
    case "RELATIONSHIP_DELTA": {
      const relationship = state.relationships.find(
        (item) =>
          item.fromCharacterId === effect.fromCharacterId &&
          item.toCharacterId === effect.toCharacterId,
      );
      if (!relationship) {
        throw new Error(
          `Unknown relationship "${effect.fromCharacterId} -> ${effect.toCharacterId}".`,
        );
      }
      relationship[effect.metric] = clamp(
        0,
        100,
        relationship[effect.metric] + effect.delta,
      );
      break;
    }
    case "GOAL_URGENCY_DELTA": {
      const goal = state.goals.find((item) => item.id === effect.goalId);
      if (!goal) throw new Error(`Unknown goal "${effect.goalId}".`);
      goal.urgency = clamp(0, 100, goal.urgency + effect.delta);
      break;
    }
    case "LEVERAGE_STRENGTH_DELTA": {
      const leverage = state.leverages.find((item) => item.id === effect.leverageId);
      if (!leverage) throw new Error(`Unknown leverage "${effect.leverageId}".`);
      leverage.strength = clamp(0, 100, leverage.strength + effect.delta);
      break;
    }
  }
}

function chooseNpcAction(
  state: PoliticalCoreState,
  definition: IssueDefinition,
  issue: IssueState,
): NpcIssueAction {
  const initiator = state.characters.find(
    (character) => character.id === definition.initiatorCharacterId,
  );
  if (!initiator) {
    throw new Error(
      `Issue initiator "${definition.initiatorCharacterId}" was not found.`,
    );
  }

  const pressure =
    initiator.personality.assertiveness * 0.35 +
    initiator.personality.ambition * 0.25 +
    initiator.personality.grudgeHolding * 0.2 +
    initiator.dynamic.momentum * 0.4 +
    issue.escalation * 0.2 -
    initiator.personality.compromiseWillingness * 0.15;

  if (pressure >= 65) {
    return {
      characterId: initiator.id,
      label: "Escalates pressure",
      escalationDelta: 10,
    };
  }

  if (pressure >= 45) {
    return {
      characterId: initiator.id,
      label: "Keeps pressure on",
      escalationDelta: 4,
    };
  }

  return {
    characterId: initiator.id,
    label: "Leaves room for compromise",
    escalationDelta: -5,
  };
}

export function createIssuesFromEvents(
  round: number,
  events: AppliedRoundEvent[],
  definitions: IssueDefinition[],
): IssueState[] {
  return events.flatMap((event) => {
    const definition = definitions.find(
      (item) => item.sourceEventId === event.eventId,
    );
    if (!definition) return [];

    return [
      {
        id: `issue_${round}_${definition.id}`,
        definitionId: definition.id,
        sourceEventId: event.eventId,
        title: definition.title,
        summary: definition.summary,
        category: definition.category,
        initiatorCharacterId: definition.initiatorCharacterId,
        round,
        status: "OPEN" as const,
        escalation: clamp(0, 100, definition.baseEscalation),
        selectedActionId: null,
        npcActions: [],
        spawnedConflictId: null,
      },
    ];
  });
}

export function resolveIssueAction(
  sourceState: PoliticalCoreState,
  issue: IssueState,
  definitions: IssueDefinition[],
  actionId: string,
): IssueActionResult {
  if (issue.status !== "OPEN" && issue.status !== "WATCHING") {
    throw new Error("Only open or watched issues can be acted on.");
  }

  const definition = definitions.find(
    (item) => item.id === issue.definitionId,
  );
  if (!definition) {
    throw new Error(`Issue definition "${issue.definitionId}" was not found.`);
  }

  const action = definition.actions.find((item) => item.id === actionId);
  if (!action) {
    throw new Error(`Issue action "${actionId}" was not found.`);
  }

  const political = structuredClone(sourceState);
  for (const effect of action.effects) {
    applyEffect(political, effect);
  }

  let escalation = clamp(0, 100, issue.escalation + action.escalationDelta);
  const npcAction = chooseNpcAction(political, definition, {
    ...issue,
    escalation,
  });
  escalation = clamp(0, 100, escalation + npcAction.escalationDelta);

  let status: IssueStatus =
    escalation <= 25
      ? "RESOLVED"
      : escalation >= definition.escalationThreshold
        ? "ESCALATED"
        : "WATCHING";

  let spawnedConflictId: string | null = null;

  if (
    status === "ESCALATED" &&
    definition.spawnedConflict &&
    !political.conflicts.some(
      (conflict) => conflict.id === definition.spawnedConflict?.id,
    )
  ) {
    political.conflicts.push(structuredClone(definition.spawnedConflict));
    spawnedConflictId = definition.spawnedConflict.id;
  }

  if (
    status === "ESCALATED" &&
    definition.spawnedConflict &&
    political.conflicts.some(
      (conflict) => conflict.id === definition.spawnedConflict?.id,
    )
  ) {
    spawnedConflictId = definition.spawnedConflict.id;
  }

  const validation = validatePoliticalCoreState(political);
  if (!validation.success) {
    throw new Error("Issue action produced an invalid political state.");
  }

  return {
    political: validation.data,
    issue: {
      ...issue,
      status,
      escalation,
      selectedActionId: action.id,
      npcActions: [...issue.npcActions, npcAction],
      spawnedConflictId,
    },
    spawnedConflictId,
  };
}
