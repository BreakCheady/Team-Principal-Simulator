import { PoliticalCoreStateSchema } from "./schemas";
import type { DomainValidationError, PoliticalCoreState } from "./types";

export type PoliticalCoreValidationResult =
  | { success: true; data: PoliticalCoreState; errors: [] }
  | { success: false; errors: DomainValidationError[] };

export function validatePoliticalCoreReferences(
  state: PoliticalCoreState,
): DomainValidationError[] {
  const errors: DomainValidationError[] = [];
  const characterIds = new Set(state.characters.map((item) => item.id));
  const goalIds = new Set(state.goals.map((item) => item.id));
  const leverageIds = new Set(state.leverages.map((item) => item.id));
  const precedentIds = new Set(state.precedents.map((item) => item.id));
  const globalIds = new Set<string>();

  const register = (id: string, path: string) => {
    if (globalIds.has(id)) {
      errors.push({ path, code: "DUPLICATE_GLOBAL_ID", message: `ID "${id}" is used more than once.` });
    }
    globalIds.add(id);
  };

  state.characters.forEach((item, index) => register(item.id, `characters[${index}].id`));
  state.relationships.forEach((item, index) => register(item.id, `relationships[${index}].id`));
  state.goals.forEach((item, index) => register(item.id, `goals[${index}].id`));
  state.leverages.forEach((item, index) => register(item.id, `leverages[${index}].id`));
  state.precedents.forEach((item, index) => register(item.id, `precedents[${index}].id`));
  state.conflicts.forEach((item, index) => register(item.id, `conflicts[${index}].id`));

  const requireCharacter = (id: string, path: string) => {
    if (!characterIds.has(id)) {
      errors.push({ path, code: "UNKNOWN_CHARACTER", message: `Unknown character "${id}".` });
    }
  };

  const relationshipPairs = new Set<string>();
  state.relationships.forEach((relationship, index) => {
    requireCharacter(relationship.fromCharacterId, `relationships[${index}].fromCharacterId`);
    requireCharacter(relationship.toCharacterId, `relationships[${index}].toCharacterId`);
    const pair = `${relationship.fromCharacterId}->${relationship.toCharacterId}`;
    if (relationshipPairs.has(pair)) {
      errors.push({
        path: `relationships[${index}]`,
        code: "DUPLICATE_RELATIONSHIP",
        message: `Relationship "${pair}" exists more than once.`,
      });
    }
    relationshipPairs.add(pair);
  });

  state.goals.forEach((goal, index) => {
    requireCharacter(goal.characterId, `goals[${index}].characterId`);
    if (goal.targetCharacterId) {
      requireCharacter(goal.targetCharacterId, `goals[${index}].targetCharacterId`);
    }
  });

  state.leverages.forEach((leverage, index) => {
    requireCharacter(leverage.ownerCharacterId, `leverages[${index}].ownerCharacterId`);
    if (leverage.targetCharacterId) {
      requireCharacter(leverage.targetCharacterId, `leverages[${index}].targetCharacterId`);
    }
  });

  state.precedents.forEach((precedent, index) => {
    precedent.affectedCharacterIds.forEach((characterId, characterIndex) => {
      requireCharacter(characterId, `precedents[${index}].affectedCharacterIds[${characterIndex}]`);
    });
  });

  state.characters.forEach((character, index) => {
    character.goalIds.forEach((id, idIndex) => {
      if (!goalIds.has(id)) {
        errors.push({
          path: `characters[${index}].goalIds[${idIndex}]`,
          code: "UNKNOWN_GOAL",
          message: `Unknown goal "${id}".`,
        });
      }
    });

    character.leverageIds.forEach((id, idIndex) => {
      if (!leverageIds.has(id)) {
        errors.push({
          path: `characters[${index}].leverageIds[${idIndex}]`,
          code: "UNKNOWN_LEVERAGE",
          message: `Unknown leverage "${id}".`,
        });
      }
    });

    character.precedentIds.forEach((id, idIndex) => {
      if (!precedentIds.has(id)) {
        errors.push({
          path: `characters[${index}].precedentIds[${idIndex}]`,
          code: "UNKNOWN_PRECEDENT",
          message: `Unknown precedent "${id}".`,
        });
      }
    });
  });

  state.conflicts.forEach((conflict, index) => {
    requireCharacter(conflict.initiatorCharacterId, `conflicts[${index}].initiatorCharacterId`);

    conflict.swingActorIds.forEach((id, idIndex) => {
      requireCharacter(id, `conflicts[${index}].swingActorIds[${idIndex}]`);
    });

    conflict.factions.forEach((faction, factionIndex) => {
      requireCharacter(
        faction.leaderCharacterId,
        `conflicts[${index}].factions[${factionIndex}].leaderCharacterId`,
      );
      faction.memberCharacterIds.forEach((id, memberIndex) => {
        requireCharacter(
          id,
          `conflicts[${index}].factions[${factionIndex}].memberCharacterIds[${memberIndex}]`,
        );
      });
    });

    conflict.precedentIds.forEach((id, idIndex) => {
      if (!precedentIds.has(id)) {
        errors.push({
          path: `conflicts[${index}].precedentIds[${idIndex}]`,
          code: "UNKNOWN_PRECEDENT",
          message: `Unknown precedent "${id}".`,
        });
      }
    });
  });

  return errors;
}

export function validatePoliticalCoreState(input: unknown): PoliticalCoreValidationResult {
  const parsed = PoliticalCoreStateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message,
      })),
    };
  }

  const domainErrors = validatePoliticalCoreReferences(parsed.data);
  if (domainErrors.length > 0) {
    return { success: false, errors: domainErrors };
  }

  return { success: true, data: parsed.data, errors: [] };
}
