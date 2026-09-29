import { describe, expect, it } from "vitest";
import { demoState } from "../../src/game/data/demo-state";
import {
  calculateConflict,
  conflictTypeToPowerContext,
  validateConflictCalculationInput,
} from "../../src/game/political/conflicts";
import {
  calculateAllianceStrength,
  deriveFactionAlliancePower,
  deriveFactionLeverage,
  derivePoliticalCost,
  deriveWillingnessToAct,
} from "../../src/game/political/derived-politics";
import { validatePoliticalCoreState } from "../../src/game/political/validation";

describe("conflict engine v2", () => {
  it("derives a complete conflict calculation from political source state", () => {
    const validation = validatePoliticalCoreState(demoState);
    expect(validation.success).toBe(true);
    if (!validation.success) return;

    const conflict = validation.data.conflicts[0];
    const result = calculateConflict(validation.data, conflict);

    expect(result.factionA.strength).toBeGreaterThan(0);
    expect(result.factionB.strength).toBeGreaterThan(0);
    expect(result.factionA.successChance + result.factionB.successChance).toBeCloseTo(
      100,
      6,
    );
    expect(result.derived.willingnessA).toBeGreaterThanOrEqual(0);
    expect(result.derived.willingnessA).toBeLessThanOrEqual(1);
    expect(result.derived.willingnessB).toBeGreaterThanOrEqual(0);
    expect(result.derived.willingnessB).toBeLessThanOrEqual(1);
    expect(result.derived.alliancePowerB).toBeGreaterThan(
      result.derived.alliancePowerA,
    );
    expect(result.derived.leverageA).toBeGreaterThan(0);
    expect(result.derived.leverageB).toBeGreaterThan(0);
    expect(result.factionA.politicalCost).toBeGreaterThanOrEqual(0);
    expect(result.factionA.politicalCost).toBeLessThanOrEqual(100);
    expect(result.escalation).toBeGreaterThanOrEqual(0);
    expect(result.escalation).toBeLessThanOrEqual(100);
  });

  it("relationship quality changes derived alliance power", () => {
    const source = structuredClone(demoState);
    const conflict = source.conflicts[0];
    const faction = conflict.factions[1];

    const baseline = deriveFactionAlliancePower(
      source,
      faction,
      "TECHNICAL_DIRECTION",
    );

    const relationship = source.relationships.find(
      (item) =>
        item.fromCharacterId === "char_keller" &&
        item.toCharacterId === "char_chen",
    );
    if (!relationship) throw new Error("Missing Keller to Chen relationship");

    relationship.loyalty = 0;
    relationship.trust = 0;
    relationship.dependency = 0;
    relationship.respect = 0;

    const weakened = deriveFactionAlliancePower(
      source,
      faction,
      "TECHNICAL_DIRECTION",
    );

    expect(weakened).toBeLessThan(baseline);
  });

  it("uses personality, goals, momentum, fatigue and stakes for willingness", () => {
    const source = structuredClone(demoState);
    const conflict = source.conflicts[0];
    const moretti = source.characters.find((item) => item.id === "char_moretti");
    if (!moretti) throw new Error("Missing Moretti");

    const baseline = deriveWillingnessToAct(source, moretti, conflict);
    moretti.dynamic.politicalFatigue = 100;
    moretti.dynamic.momentum = -25;
    moretti.personality.assertiveness = 0;
    moretti.personality.ambition = 0;

    const reduced = deriveWillingnessToAct(source, moretti, conflict);
    expect(reduced).toBeLessThan(baseline);
  });

  it("derives leverage only from active usable sources", () => {
    const source = structuredClone(demoState);
    const faction = source.conflicts[0].factions[0];

    const baseline = deriveFactionLeverage(source, faction);
    for (const leverage of source.leverages) {
      if (leverage.ownerCharacterId === "char_moretti") {
        leverage.active = false;
      }
    }

    expect(baseline).toBeGreaterThan(0);
    expect(deriveFactionLeverage(source, faction)).toBe(0);
  });

  it("political cost responds to legitimacy and precedent pressure", () => {
    const source = structuredClone(demoState);
    const conflict = source.conflicts[0];
    const faction = conflict.factions[0];

    const baseline = derivePoliticalCost(source, conflict, faction, 50);
    faction.legitimacy = 100;
    for (const precedent of source.precedents) {
      if (conflict.precedentIds.includes(precedent.id)) {
        precedent.strength = 0;
      }
    }

    const reduced = derivePoliticalCost(source, conflict, faction, 50);
    expect(reduced).toBeLessThan(baseline);
  });

  it("calculates alliance strength from directional relationship dimensions", () => {
    const relationship = demoState.relationships.find(
      (item) => item.id === "rel_keller_chen",
    );
    if (!relationship) throw new Error("Missing relationship");

    expect(calculateAllianceStrength(relationship)).toBeCloseTo(
      relationship.loyalty * 0.4 +
        relationship.trust * 0.25 +
        relationship.dependency * 0.2 +
        relationship.respect * 0.15,
      6,
    );
  });

  it("accepts optional scenario overrides but validates them", () => {
    const conflict = demoState.conflicts[0];
    const baseline = calculateConflict(demoState, conflict);
    const overridden = calculateConflict(demoState, conflict, {
      resentment: 100,
      politicalCostA: 1,
      willingnessByCharacterId: { char_moretti: 0 },
    });

    expect(overridden.derived.resentment).toBe(100);
    expect(overridden.factionA.politicalCost).toBe(1);
    expect(overridden.factionA.strength).toBeLessThan(baseline.factionA.strength);

    expect(() =>
      validateConflictCalculationInput({ politicalCostA: -1 }),
    ).toThrow(/politicalCostA must be between 0 and 100/);
    expect(() =>
      validateConflictCalculationInput({
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
