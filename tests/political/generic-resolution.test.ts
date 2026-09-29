import { describe, expect, it } from "vitest";
import { demoState } from "../../src/game/data/demo-state";
import {
  assertUniqueDecisionCatalog,
  getConflictDecisions,
  type ConflictDecisionDefinition,
} from "../../src/game/political/decisions";
import { applyConflictDecision } from "../../src/game/state/game-state";

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
    expect(conflict?.outcome).toBe("NARROW_WIN_A");
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
