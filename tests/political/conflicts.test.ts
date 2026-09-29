import { describe, expect, it } from "vitest";
import { demoConflictInput, demoState } from "../../src/game/data/demo-state";
import {
  calculateConflict,
  conflictTypeToPowerContext,
  validateConflictCalculationInput,
} from "../../src/game/political/conflicts";
import { validatePoliticalCoreState } from "../../src/game/political/validation";

describe("technical direction conflict", () => {
  it("reproduces the Moretti vs Chen baseline with live-state modifiers", () => {
    const validation = validatePoliticalCoreState(demoState);
    expect(validation.success).toBe(true);
    if (!validation.success) return;

    const result = calculateConflict(
      validation.data,
      validation.data.conflicts[0],
      demoConflictInput,
    );

    expect(result.factionA.strength).toBeCloseTo(61.17, 1);
    expect(result.factionB.strength).toBeCloseTo(71.72, 1);
    expect(result.factionA.successChance).toBeCloseTo(43.67, 1);
    expect(result.factionB.successChance).toBeCloseTo(56.33, 1);
    expect(result.derived.factionMomentumA).toBeCloseTo(89, 1);
    expect(result.derived.factionMomentumB).toBeCloseTo(77, 1);
    expect(result.derived.resentment).toBeCloseTo(57.33, 1);
    expect(result.escalation).toBeCloseTo(66.2, 1);
  });

  it("validates scenario calculation inputs", () => {
    expect(() =>
      validateConflictCalculationInput({
        ...demoConflictInput,
        politicalCostA: -1,
      }),
    ).toThrow(/politicalCostA must be between 0 and 100/);

    expect(() =>
      validateConflictCalculationInput({
        ...demoConflictInput,
        willingnessByCharacterId: { char_moretti: 1.01 },
      }),
    ).toThrow(/must be between 0 and 1/);
  });
});

describe("conflict power contexts", () => {
  it("maps technical direction explicitly", () => {
    expect(conflictTypeToPowerContext("TECHNICAL_DIRECTION")).toBe(
      "TECHNICAL_DIRECTION",
    );
  });

  it("maps driver priority to driver hierarchy", () => {
    expect(conflictTypeToPowerContext("DRIVER_PRIORITY")).toBe(
      "DRIVER_HIERARCHY",
    );
  });

  it("maps personnel decisions explicitly", () => {
    expect(conflictTypeToPowerContext("PERSONNEL_DECISION")).toBe(
      "PERSONNEL_DECISION",
    );
  });
});
