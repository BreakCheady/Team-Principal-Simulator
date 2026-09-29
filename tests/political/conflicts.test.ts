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
import {
  calculateCharacterAlignment,
  formDynamicFactions,
} from "../../src/game/political/faction-formation";
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


describe("dynamic faction formation", () => {
  function setRelationshipSupport(
    state: typeof demoState,
    fromCharacterId: string,
    toCharacterId: string,
    support: number,
  ) {
    let relationship = state.relationships.find(
      (item) =>
        item.fromCharacterId === fromCharacterId &&
        item.toCharacterId === toCharacterId,
    );

    if (!relationship) {
      relationship = {
        id: `rel_${fromCharacterId.replace("char_", "")}_${toCharacterId.replace("char_", "")}`,
        fromCharacterId,
        toCharacterId,
        trust: support,
        loyalty: support,
        respect: support,
        dependency: support,
        resentment: 100 - support,
        personalLeverage: 0,
      };
      state.relationships.push(relationship);
      return;
    }

    relationship.trust = support;
    relationship.loyalty = support;
    relationship.respect = support;
    relationship.dependency = support;
    relationship.resentment = 100 - support;
  }

  function neutralizeHartmannInterests(state: typeof demoState) {
    const hartmann = state.characters.find((item) => item.id === "char_hartmann");
    if (!hartmann) throw new Error("Missing Hartmann");

    hartmann.personality.ruleRespect = 0;
    for (const goal of state.goals) {
      if (goal.characterId === hartmann.id) goal.active = false;
    }
  }

  it("forms the demo technical factions from live relationships and interests", () => {
    const formation = formDynamicFactions(
      demoState,
      demoState.conflicts[0],
    );

    expect(formation.factionA.memberCharacterIds).toContain("char_moretti");
    expect(formation.factionB.memberCharacterIds).toContain("char_chen");
    expect(formation.factionB.memberCharacterIds).toContain("char_keller");
    expect(
      formation.factionA.memberCharacterIds.includes("char_keller"),
    ).toBe(false);
    expect(
      new Set([
        ...formation.factionA.memberCharacterIds,
        ...formation.factionB.memberCharacterIds,
        ...formation.swingActorIds,
        ...formation.neutralActorIds,
      ]).size,
    ).toBe(demoState.characters.length);
  });

  it("classifies a strong preference as joining faction A", () => {
    const source = structuredClone(demoState);
    neutralizeHartmannInterests(source);
    setRelationshipSupport(source, "char_hartmann", "char_moretti", 90);
    setRelationshipSupport(source, "char_hartmann", "char_chen", 40);

    expect(
      calculateCharacterAlignment(
        source,
        source.conflicts[0],
        "char_hartmann",
      ).alignment,
    ).toBe("FACTION_A");
  });

  it("classifies a strong preference as joining faction B", () => {
    const source = structuredClone(demoState);
    neutralizeHartmannInterests(source);
    setRelationshipSupport(source, "char_hartmann", "char_moretti", 40);
    setRelationshipSupport(source, "char_hartmann", "char_chen", 90);

    expect(
      calculateCharacterAlignment(
        source,
        source.conflicts[0],
        "char_hartmann",
      ).alignment,
    ).toBe("FACTION_B");
  });

  it("classifies a meaningful but undecided preference as swing", () => {
    const source = structuredClone(demoState);
    neutralizeHartmannInterests(source);
    setRelationshipSupport(source, "char_hartmann", "char_moretti", 70);
    setRelationshipSupport(source, "char_hartmann", "char_chen", 50);

    const alignment = calculateCharacterAlignment(
      source,
      source.conflicts[0],
      "char_hartmann",
    );

    expect(alignment.alignment).toBe("SWING");
    expect(Math.abs(alignment.margin)).toBeGreaterThanOrEqual(5);
    expect(Math.abs(alignment.margin)).toBeLessThan(15);
  });

  it("classifies balanced preference as neutral", () => {
    const source = structuredClone(demoState);
    neutralizeHartmannInterests(source);
    setRelationshipSupport(source, "char_hartmann", "char_moretti", 50);
    setRelationshipSupport(source, "char_hartmann", "char_chen", 50);

    expect(
      calculateCharacterAlignment(
        source,
        source.conflicts[0],
        "char_hartmann",
      ).alignment,
    ).toBe("NEUTRAL");
  });

  it("allows a relevant goal to move an otherwise balanced actor", () => {
    const source = structuredClone(demoState);
    const conflict = source.conflicts[1];
    const hartmann = source.characters.find((item) => item.id === "char_hartmann");
    if (!hartmann) throw new Error("Missing Hartmann");

    hartmann.personality.ruleRespect = 0;
    for (const goal of source.goals) {
      if (goal.characterId === hartmann.id) goal.active = false;
    }

    setRelationshipSupport(source, "char_hartmann", "char_keller", 50);
    setRelationshipSupport(source, "char_hartmann", "char_moretti", 50);

    source.goals.push({
      id: "goal_hartmann_equal_status_test",
      characterId: "char_hartmann",
      type: "KEEP_EQUAL_STATUS",
      priority: 100,
      urgency: 100,
      progress: 0,
      visibility: "HIDDEN",
      active: true,
    });

    const alignment = calculateCharacterAlignment(
      source,
      conflict,
      "char_hartmann",
    );

    expect(alignment.scoreA).toBeGreaterThan(alignment.scoreB);
    expect(alignment.alignment).toBe("SWING");
  });

  it("lets institutional legitimacy influence a rule-respecting actor", () => {
    const source = structuredClone(demoState);
    neutralizeHartmannInterests(source);
    const hartmann = source.characters.find((item) => item.id === "char_hartmann");
    if (!hartmann) throw new Error("Missing Hartmann");

    hartmann.personality.ruleRespect = 100;
    setRelationshipSupport(source, "char_hartmann", "char_moretti", 50);
    setRelationshipSupport(source, "char_hartmann", "char_chen", 50);
    source.conflicts[0].factions[0].legitimacy = 0;
    source.conflicts[0].factions[1].legitimacy = 100;

    const alignment = calculateCharacterAlignment(
      source,
      source.conflicts[0],
      "char_hartmann",
    );

    expect(alignment.alignment).toBe("FACTION_B");
    expect(alignment.scoreB).toBeGreaterThan(alignment.scoreA);
  });

  it("feeds formed memberships back into conflict strength", () => {
    const baseline = calculateConflict(demoState, demoState.conflicts[0]);
    const source = structuredClone(demoState);

    const kellerToChen = source.relationships.find(
      (item) =>
        item.fromCharacterId === "char_keller" &&
        item.toCharacterId === "char_chen",
    );
    if (!kellerToChen) throw new Error("Missing Keller to Chen relationship");

    kellerToChen.trust = 0;
    kellerToChen.loyalty = 0;
    kellerToChen.respect = 0;
    kellerToChen.dependency = 0;
    kellerToChen.resentment = 100;

    const changed = calculateConflict(source, source.conflicts[0]);

    expect(baseline.derived.factionBMemberIds).toContain("char_keller");
    expect(changed.derived.factionBMemberIds).not.toContain("char_keller");
    expect(changed.factionB.strength).toBeLessThan(baseline.factionB.strength);
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
