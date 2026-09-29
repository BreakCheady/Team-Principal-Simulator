import { describe, expect, it } from "vitest";
import { demoState } from "../../src/game/data/demo-state";
import { calculateConflict } from "../../src/game/political/conflicts";
import {
  calculateCharacterAlignment,
  formDynamicFactions,
} from "../../src/game/political/faction-formation";

describe("dynamic faction formation", () => {
  it("forms the technical conflict from current relationships and interests", () => {
    const conflict = demoState.conflicts.find(
      (item) => item.id === "conflict_technical_direction",
    );
    if (!conflict) throw new Error("Missing technical conflict");

    const formation = formDynamicFactions(demoState, conflict);

    expect(formation.factionA.memberCharacterIds).toContain("char_moretti");
    expect(formation.factionB.memberCharacterIds).toContain("char_chen");
    expect(formation.factionB.memberCharacterIds).toContain("char_keller");
    expect(formation.swingActorIds).toContain("char_hartmann");
    expect(formation.factionA.memberCharacterIds).not.toContain("char_hartmann");
    expect(formation.factionB.memberCharacterIds).not.toContain("char_hartmann");
  });

  it("moves a character when directional relationships change strongly", () => {
    const source = structuredClone(demoState);
    const conflict = source.conflicts.find(
      (item) => item.id === "conflict_technical_direction",
    );
    if (!conflict) throw new Error("Missing technical conflict");

    const toMoretti = source.relationships.find(
      (item) =>
        item.fromCharacterId === "char_keller" &&
        item.toCharacterId === "char_moretti",
    );
    const toChen = source.relationships.find(
      (item) =>
        item.fromCharacterId === "char_keller" &&
        item.toCharacterId === "char_chen",
    );
    if (!toMoretti || !toChen) throw new Error("Missing Keller relationships");

    Object.assign(toMoretti, {
      trust: 100,
      loyalty: 100,
      respect: 100,
      dependency: 100,
      resentment: 0,
    });
    Object.assign(toChen, {
      trust: 0,
      loyalty: 0,
      respect: 0,
      dependency: 0,
      resentment: 100,
    });

    const alignment = calculateCharacterAlignment(
      source,
      conflict,
      "char_keller",
    );

    expect(alignment.alignment).toBe("FACTION_A");
    expect(alignment.scoreA).toBeGreaterThan(alignment.scoreB);
  });

  it("uses active goals to create political interest in a side", () => {
    const source = structuredClone(demoState);
    const conflict = source.conflicts.find(
      (item) => item.id === "conflict_driver_status",
    );
    if (!conflict) throw new Error("Missing driver status conflict");

    const before = calculateCharacterAlignment(source, conflict, "char_chen");
    expect(before.alignment).toBe("NEUTRAL");

    source.goals.push({
      id: "goal_chen_equal_status_test",
      characterId: "char_chen",
      type: "KEEP_EQUAL_STATUS",
      priority: 100,
      urgency: 100,
      progress: 0,
      visibility: "KNOWN",
      active: true,
    });

    const after = calculateCharacterAlignment(source, conflict, "char_chen");

    expect(after.alignment).toBe("FACTION_A");
    expect(after.scoreA).toBeGreaterThan(before.scoreA);
    expect(after.scoreB).toBeLessThan(before.scoreB);
  });

  it("keeps politically disengaged characters neutral", () => {
    const source = structuredClone(demoState);
    const conflict = source.conflicts.find(
      (item) => item.id === "conflict_driver_status",
    );
    const chen = source.characters.find((item) => item.id === "char_chen");
    if (!conflict || !chen) throw new Error("Missing test entities");

    chen.personality.assertiveness = 0;
    chen.personality.ambition = 0;
    chen.dynamic.politicalFatigue = 100;
    chen.dynamic.momentum = -25;

    const alignment = calculateCharacterAlignment(
      source,
      conflict,
      "char_chen",
    );

    expect(alignment.engagement).toBeLessThan(42);
    expect(alignment.alignment).toBe("NEUTRAL");
  });

  it("recalculates conflict strength when dynamic membership changes", () => {
    const source = structuredClone(demoState);
    const conflict = source.conflicts.find(
      (item) => item.id === "conflict_technical_direction",
    );
    const keller = source.characters.find((item) => item.id === "char_keller");
    if (!conflict || !keller) throw new Error("Missing test entities");

    const baseline = calculateConflict(source, conflict);
    expect(
      baseline.derived.formation.factionB.memberCharacterIds,
    ).toContain("char_keller");
    expect(baseline.derived.alliancePowerB).toBeGreaterThan(0);

    keller.personality.assertiveness = 0;
    keller.personality.ambition = 0;
    keller.dynamic.politicalFatigue = 100;
    keller.dynamic.momentum = -25;

    const neutralKeller = calculateConflict(source, conflict);

    expect(
      neutralKeller.derived.formation.neutralActorIds,
    ).toContain("char_keller");
    expect(
      neutralKeller.derived.formation.factionB.memberCharacterIds,
    ).not.toContain("char_keller");
    expect(neutralKeller.derived.alliancePowerB).toBeLessThan(
      baseline.derived.alliancePowerB,
    );
    expect(neutralKeller.factionB.strength).toBeLessThan(
      baseline.factionB.strength,
    );
  });
});
