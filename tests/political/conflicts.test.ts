import { describe, expect, it } from "vitest";
import { demoConflictInput, demoState } from "../../src/game/data/demo-state";
import { calculateConflict } from "../../src/game/political/conflicts";
import { validatePoliticalCoreState } from "../../src/game/political/validation";

describe("technical direction conflict", () => {
  it("reproduces the Moretti vs Chen baseline", () => {
    const validation = validatePoliticalCoreState(demoState);
    expect(validation.success).toBe(true);
    if (!validation.success) return;

    const result = calculateConflict(
      validation.data,
      validation.data.conflicts[0],
      demoConflictInput,
    );

    expect(result.factionA.strength).toBeCloseTo(60.47, 1);
    expect(result.factionB.strength).toBeCloseTo(71.42, 1);
    expect(result.factionA.successChance).toBeCloseTo(43.43, 1);
    expect(result.factionB.successChance).toBeCloseTo(56.57, 1);
  });
});
