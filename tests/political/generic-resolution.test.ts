import { describe, expect, it } from "vitest";
import { demoState } from "../../src/game/data/demo-state";
import {
  assertUniqueDecisionCatalog,
  getConflictDecisions,
  type ConflictDecisionDefinition,
} from "../../src/game/political/decisions";
import {
  applyConflictDecision,
  resolveOutcomeFromPower,
} from "../../src/game/state/game-state";

function stateWithActiveDriverPriorityConflict() {
  const source = structuredClone(demoState);
  const conflict = source.conflicts.find(
    (item) => item.id === "conflict_driver_status",
  );
  if (!conflict) throw new Error("Missing driver status conflict");
  conflict.status = "ACTIVE";
  return source;
}

describe("generic conflict resolution", () => {
  it("resolves a second catalogued conflict through the public gameplay path", () => {
    const source = stateWithActiveDriverPriorityConflict();
    const original = structuredClone(source);

    expect(getConflictDecisions("conflict_driver_status").map((item) => item.id)).toEqual([
      "back_keller",
      "protect_moretti_status",
    ]);

    const result = applyConflictDecision(
      source,
      "conflict_driver_status",
      "back_keller",
      15,
    );

    expect(source).toEqual(original);
    const conflict = result.nextState.conflicts.find(
      (item) => item.id === "conflict_driver_status",
    );
    expect(conflict?.status).toBe("RESOLVED");
    expect(conflict?.outcome).toBeDefined();
    expect(
      result.nextState.characters.find((item) => item.id === "char_keller")
        ?.dynamic.momentum,
    ).toBe(5);
    expect(
      result.nextState.characters.find((item) => item.id === "char_moretti")
        ?.dynamic.momentum,
    ).toBe(11);
    expect(
      result.nextState.precedents.find(
        (item) => item.id === "precedent_driver_priority",
      )?.applications,
    ).toBe(4);
  });

  it("resolves every catalogued decision into a valid resolved state", () => {
    const scenarios = [
      {
        conflictId: "conflict_technical_direction",
        round: 14,
        state: structuredClone(demoState),
      },
      {
        conflictId: "conflict_driver_status",
        round: 15,
        state: stateWithActiveDriverPriorityConflict(),
      },
    ];

    for (const scenario of scenarios) {
      for (const decision of getConflictDecisions(scenario.conflictId)) {
        const result = applyConflictDecision(
          structuredClone(scenario.state),
          scenario.conflictId,
          decision.id,
          scenario.round,
        );
        const conflict = result.nextState.conflicts.find(
          (item) => item.id === scenario.conflictId,
        );

        expect(conflict?.status).toBe("RESOLVED");
        expect(conflict?.outcome).toBeDefined();
      }
    }
  });


  it("uses live power balance to resolve an attempted faction win", () => {
    const decision = getConflictDecisions("conflict_driver_status").find(
      (item) => item.id === "back_keller",
    );
    if (!decision) throw new Error("Missing Keller decision");

    const strongA = resolveOutcomeFromPower(decision, {
      factionA: { strength: 80, successChance: 75, politicalCost: 20 },
      factionB: { strength: 40, successChance: 25, politicalCost: 40 },
      delta: 40,
      escalation: 60,
      derived: {} as never,
    });
    const weakA = resolveOutcomeFromPower(decision, {
      factionA: { strength: 30, successChance: 30, politicalCost: 60 },
      factionB: { strength: 75, successChance: 70, politicalCost: 20 },
      delta: -45,
      escalation: 75,
      derived: {} as never,
    });

    expect(strongA).toBe("DECISIVE_WIN_A");
    expect(weakA).toBe("BACKFIRE_A");
  });

  it("lets an attempted compromise fail when the power gap is too large", () => {
    const decision = getConflictDecisions("conflict_technical_direction").find(
      (item) => item.id === "offer_compromise",
    );
    if (!decision) throw new Error("Missing compromise decision");

    const balanced = resolveOutcomeFromPower(decision, {
      factionA: { strength: 60, successChance: 53, politicalCost: 30 },
      factionB: { strength: 55, successChance: 47, politicalCost: 30 },
      delta: 5,
      escalation: 60,
      derived: {} as never,
    });
    const dominated = resolveOutcomeFromPower(decision, {
      factionA: { strength: 85, successChance: 78, politicalCost: 20 },
      factionB: { strength: 35, successChance: 22, politicalCost: 60 },
      delta: 50,
      escalation: 70,
      derived: {} as never,
    });

    expect(balanced).toBe("COMPROMISE");
    expect(dominated).toBe("DECISIVE_WIN_A");
  });

  it("rejects resolving a dormant conflict before the season activates it", () => {
    expect(() =>
      applyConflictDecision(
        demoState,
        "conflict_driver_status",
        "back_keller",
        15,
      ),
    ).toThrow(/must be active or escalated/);
  });

  it("rejects duplicate decision ids within the same conflict", () => {
    const duplicate: ConflictDecisionDefinition = {
      id: "same",
      conflictId: "conflict_driver_status",
      label: "Duplicate",
      description: "Duplicate decision.",
      title: "Duplicate",
      summary: "Duplicate.",
      outcome: "STALEMATE",
      effects: [],
    };

    expect(() =>
      assertUniqueDecisionCatalog([duplicate, { ...duplicate }]),
    ).toThrow(/Duplicate decision id/);
  });

  it("allows the same decision id for different conflicts", () => {
    const base: ConflictDecisionDefinition = {
      id: "compromise",
      conflictId: "conflict_a",
      label: "Compromise",
      description: "Compromise.",
      title: "Compromise",
      summary: "Compromise.",
      outcome: "COMPROMISE",
      effects: [],
    };

    expect(() =>
      assertUniqueDecisionCatalog([
        base,
        { ...base, conflictId: "conflict_b" },
      ]),
    ).not.toThrow();
  });
});
