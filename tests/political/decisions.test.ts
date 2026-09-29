import { describe, expect, it } from "vitest";
import { demoState } from "../../src/game/data/demo-state";
import { applyConflictDecision } from "../../src/game/state/game-state";

function relationship(state: typeof demoState, id: string) {
  const result = state.relationships.find((item) => item.id === id);
  if (!result) throw new Error(`Missing relationship ${id}`);
  return result;
}

function precedent(state: typeof demoState) {
  const result = state.precedents.find(
    (item) => item.id === "precedent_technical_authority",
  );
  if (!result) throw new Error("Missing technical authority precedent");
  return result;
}

describe("conflict decisions", () => {
  it("supports Moretti without mutating the source state", () => {
    const original = structuredClone(demoState);

    const result = applyConflictDecision(
      demoState,
      "conflict_technical_direction",
      "support_moretti",
      14,
    );

    expect(demoState).toEqual(original);
    expect(result.nextState.conflicts[0].status).toBe("RESOLVED");
    expect(result.nextState.conflicts[0].outcome).toBe("NARROW_WIN_B");
    expect(result.nextState.conflicts[0].roundResolved).toBe(14);
    expect(relationship(result.nextState, "rel_moretti_hartmann").trust).toBe(80);
    expect(relationship(result.nextState, "rel_chen_moretti").resentment).toBe(49);
    expect(precedent(result.nextState).violations).toBe(1);
    expect(precedent(result.nextState).strength).toBe(68);
  });

  it("creates a compromise that strengthens the existing authority rule", () => {
    const result = applyConflictDecision(
      demoState,
      "conflict_technical_direction",
      "offer_compromise",
      14,
    );

    expect(result.nextState.conflicts[0].outcome).toBe("COMPROMISE");
    expect(relationship(result.nextState, "rel_moretti_chen").trust).toBe(61);
    expect(relationship(result.nextState, "rel_chen_moretti").trust).toBe(66);
    expect(precedent(result.nextState).applications).toBe(2);
    expect(precedent(result.nextState).strength).toBe(82);
  });

  it("supports Chen and reinforces the technical authority precedent", () => {
    const result = applyConflictDecision(
      demoState,
      "conflict_technical_direction",
      "support_chen",
      14,
    );

    expect(result.nextState.conflicts[0].outcome).toBe("NARROW_WIN_B");
    expect(relationship(result.nextState, "rel_moretti_hartmann").trust).toBe(64);
    expect(relationship(result.nextState, "rel_moretti_hartmann").resentment).toBe(41);
    expect(precedent(result.nextState).applications).toBe(2);
    expect(precedent(result.nextState).strength).toBe(86);
  });

  it("rejects resolving a conflict before its start round", () => {
    expect(() =>
      applyConflictDecision(
        demoState,
        "conflict_technical_direction",
        "offer_compromise",
        13,
      ),
    ).toThrow(/before it started/);
  });

  it("rejects an unknown decision for a conflict", () => {
    expect(() =>
      applyConflictDecision(
        demoState,
        "conflict_technical_direction",
        "does_not_exist",
        14,
      ),
    ).toThrow(/is not defined/);
  });

  it("refuses to resolve the same conflict twice", () => {
    const first = applyConflictDecision(
      demoState,
      "conflict_technical_direction",
      "offer_compromise",
      14,
    );

    expect(() =>
      applyConflictDecision(
        first.nextState,
        "conflict_technical_direction",
        "support_chen",
        14,
      ),
    ).toThrow(/already resolved/);
  });
});
