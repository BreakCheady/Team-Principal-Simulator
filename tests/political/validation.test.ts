import { describe, expect, it } from "vitest";
import { demoState } from "../../src/game/data/demo-state";
import { validatePoliticalCoreState } from "../../src/game/political/validation";

describe("political core validation", () => {
  it("accepts the Vanguard Racing demo state", () => {
    const result = validatePoliticalCoreState(demoState);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.characters).toHaveLength(8);
      expect(result.errors).toEqual([]);
      expect(
        result.data.characters
          .filter((character) =>
            [
              "SPORTING_DIRECTOR",
              "CEO",
              "SPONSOR_REPRESENTATIVE",
              "RACE_ENGINEER",
            ].includes(character.role),
          )
          .map((character) => character.id),
      ).toEqual([
        "char_varga",
        "char_laurent",
        "char_salazar",
        "char_bellini",
      ]);
      expect(
        result.data.leverages
          .filter((leverage) =>
            [
              "lev_varga_sporting",
              "lev_laurent_owner",
              "lev_salazar_sponsor",
              "lev_bellini_staff",
            ].includes(leverage.id),
          )
          .map((leverage) => leverage.ownerCharacterId),
      ).toEqual([
        "char_varga",
        "char_laurent",
        "char_salazar",
        "char_bellini",
      ]);
    }
  });

  it("rejects persisted derived escalation", () => {
    const broken = structuredClone(demoState) as typeof demoState & {
      conflicts: Array<(typeof demoState.conflicts)[number] & { escalation?: number }>;
    };
    broken.conflicts[0].escalation = 71;

    const result = validatePoliticalCoreState(broken);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.path === "conflicts.0")).toBe(true);
    }
  });

  it("rejects a conflict resolved before it started", () => {
    const broken = structuredClone(demoState);
    broken.conflicts[0].status = "RESOLVED";
    broken.conflicts[0].outcome = "COMPROMISE";
    broken.conflicts[0].roundResolved = 13;

    const result = validatePoliticalCoreState(broken);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.errors.some(
          (error) =>
            error.path === "conflicts.0.roundResolved" &&
            error.message.includes("greater than or equal"),
        ),
      ).toBe(true);
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
