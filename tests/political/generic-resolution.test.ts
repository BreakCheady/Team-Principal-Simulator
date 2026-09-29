import { describe, expect, it } from "vitest";
import { demoState } from "../../src/game/data/demo-state";
import type { ConflictDecisionDefinition } from "../../src/game/political/decisions";
import { resolveConflictDecision } from "../../src/game/political/outcomes";
import { validatePoliticalCoreState } from "../../src/game/political/validation";

describe("generic conflict resolution", () => {
  it("resolves a second conflict without scenario-specific engine code", () => {
    const source = structuredClone(demoState);
    source.conflicts.push({
      id: "conflict_driver_status",
      type: "DRIVER_PRIORITY",
      status: "ACTIVE",
      initiatorCharacterId: "char_keller",
      issue: "Keller challenges Moretti's privileged sporting status.",
      stakes: 64,
      publicExposure: 38,
      factions: [
        {
          id: "faction_keller_status",
          leaderCharacterId: "char_keller",
          memberCharacterIds: ["char_keller"],
          alliancePower: 42,
          legitimacy: 69,
          leverage: 28,
          friction: 5,
          momentum: 58,
        },
        {
          id: "faction_moretti_status",
          leaderCharacterId: "char_moretti",
          memberCharacterIds: ["char_moretti"],
          alliancePower: 70,
          legitimacy: 61,
          leverage: 68,
          friction: 7,
          momentum: 75,
        },
      ],
      swingActorIds: ["char_hartmann"],
      roundStarted: 15,
      precedentIds: ["precedent_driver_priority"],
    });

    const decision: ConflictDecisionDefinition = {
      id: "back_keller",
      conflictId: "conflict_driver_status",
      label: "Back Keller",
      description: "Protect equality and reduce Moretti's political momentum.",
      title: "Keller wins a political concession",
      summary: "The same generic resolver applies a completely different conflict package.",
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
    };

    const result = resolveConflictDecision(
      source,
      "conflict_driver_status",
      decision,
      { round: 15 },
    );

    expect(result.nextState.conflicts[1].status).toBe("RESOLVED");
    expect(result.nextState.conflicts[1].outcome).toBe("NARROW_WIN_A");
    expect(result.nextState.characters.find((item) => item.id === "char_keller")?.dynamic.momentum).toBe(5);
    expect(result.nextState.characters.find((item) => item.id === "char_moretti")?.dynamic.momentum).toBe(11);
    expect(result.nextState.precedents.find((item) => item.id === "precedent_driver_priority")?.applications).toBe(4);
    expect(validatePoliticalCoreState(result.nextState).success).toBe(true);
  });

  it("does not mutate the source state", () => {
    const source = structuredClone(demoState);
    const original = structuredClone(source);
    const decision: ConflictDecisionDefinition = {
      id: "generic_noop",
      conflictId: "conflict_technical_direction",
      label: "Resolve",
      description: "Resolve without side effects.",
      title: "Resolved",
      summary: "No effects.",
      outcome: "STALEMATE",
      effects: [],
    };

    resolveConflictDecision(source, source.conflicts[0].id, decision, { round: 14 });

    expect(source).toEqual(original);
  });

  it("rejects a decision for the wrong conflict", () => {
    const decision: ConflictDecisionDefinition = {
      id: "wrong_conflict",
      conflictId: "conflict_elsewhere",
      label: "Wrong",
      description: "Wrong conflict.",
      title: "Wrong",
      summary: "Wrong.",
      outcome: "STALEMATE",
      effects: [],
    };

    expect(() =>
      resolveConflictDecision(
        demoState,
        "conflict_technical_direction",
        decision,
        { round: 14 },
      ),
    ).toThrow(/belongs to conflict/);
  });
});
