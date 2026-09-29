import { describe, expect, it } from "vitest";
import { demoState } from "../../src/game/data/demo-state";
import { validatePoliticalCoreState } from "../../src/game/political/validation";

describe("political core validation", () => {
  it("accepts the Vanguard Racing demo state", () => {
    const result = validatePoliticalCoreState(demoState);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.characters).toHaveLength(4);
      expect(result.errors).toEqual([]);
    }
  });

  it("rejects unknown character references", () => {
    const broken = structuredClone(demoState);
    broken.relationships[0].toCharacterId = "char_unknown";

    const result = validatePoliticalCoreState(broken);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.code === "UNKNOWN_CHARACTER")).toBe(true);
    }
  });
});
