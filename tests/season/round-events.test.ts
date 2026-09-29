import { describe, expect, it } from "vitest";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { demoState } from "../../src/game/data/demo-state";
import { calculateConflict } from "../../src/game/political/conflicts";
import { processRound } from "../../src/game/season/round-events";

function character(state: typeof demoState, id: string) {
  const item = state.characters.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing character ${id}`);
  return item;
}

describe("round event system", () => {
  it("applies race results and activates a dormant political conflict", () => {
    const original = structuredClone(demoState);
    const result = processRound(demoState, 16, demoRoundEvents);

    expect(demoState).toEqual(original);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("RACE_RESULT");
    expect(result.events[0].activatedConflictIds).toEqual([
      "conflict_driver_status",
    ]);
    expect(character(result.nextState, "char_keller").dynamic.momentum).toBe(6);
    expect(
      result.nextState.conflicts.find(
        (item) => item.id === "conflict_driver_status",
      )?.status,
    ).toBe("ACTIVE");
  });

  it("applies performance swings to momentum, instability and goal urgency", () => {
    const result = processRound(demoState, 17, demoRoundEvents);
    const moretti = character(result.nextState, "char_moretti");
    const titleGoal = result.nextState.goals.find(
      (item) => item.id === "goal_moretti_title",
    );

    expect(result.events[0].type).toBe("PERFORMANCE_SWING");
    expect(moretti.dynamic.momentum).toBe(8);
    expect(moretti.dynamic.instability).toBe(16);
    expect(titleGoal?.urgency).toBe(97);
  });

  it("applies technical problems to engineering politics", () => {
    const result = processRound(demoState, 18, demoRoundEvents);
    const chen = character(result.nextState, "char_chen");
    const relationship = result.nextState.relationships.find(
      (item) => item.id === "rel_moretti_chen",
    );

    expect(result.events[0].type).toBe("TECHNICAL_PROBLEM");
    expect(chen.dynamic.momentum).toBe(6);
    expect(chen.dynamic.politicalFatigue).toBe(29);
    expect(chen.dynamic.instability).toBe(11);
    expect(relationship?.resentment).toBe(52);
  });

  it("lets media events create a new public conflict", () => {
    const result = processRound(demoState, 19, demoRoundEvents);
    const spawned = result.nextState.conflicts.find(
      (item) => item.id === "conflict_moretti_media_pressure",
    );

    expect(result.events[0].type).toBe("MEDIA_EVENT");
    expect(result.events[0].spawnedConflictIds).toEqual([
      "conflict_moretti_media_pressure",
    ]);
    expect(spawned?.status).toBe("ACTIVE");
    expect(spawned?.publicExposure).toBe(84);

    if (!spawned) throw new Error("Media conflict was not spawned");
    const calculation = calculateConflict(result.nextState, spawned);
    expect(calculation.factionA.strength).toBeGreaterThan(0);
    expect(calculation.factionB.strength).toBeGreaterThan(0);
  });

  it("lets contract talks create a contract dispute from leverage and dependency", () => {
    const result = processRound(demoState, 20, demoRoundEvents);
    const transfer = result.nextState.leverages.find(
      (item) => item.id === "lev_moretti_transfer",
    );
    const conflict = result.nextState.conflicts.find(
      (item) => item.id === "conflict_moretti_contract",
    );

    expect(result.events[0].type).toBe("CONTRACT_TALK");
    expect(transfer?.strength).toBe(99);
    expect(result.events[0].spawnedConflictIds).toEqual([
      "conflict_moretti_contract",
    ]);
    expect(conflict?.type).toBe("CONTRACT_DISPUTE");
    expect(conflict?.status).toBe("ACTIVE");
  });

  it("does not spawn the same generated conflict twice", () => {
    const first = processRound(demoState, 19, demoRoundEvents);
    const second = processRound(first.nextState, 19, demoRoundEvents);

    expect(
      second.nextState.conflicts.filter(
        (item) => item.id === "conflict_moretti_media_pressure",
      ),
    ).toHaveLength(1);
    expect(second.events[0].spawnedConflictIds).toEqual([]);
  });

  it("clamps event effects to political schema ranges", () => {
    const result = processRound(demoState, 99, [
      {
        id: "event_clamp_test",
        type: "PERFORMANCE_SWING",
        title: "Clamp test",
        summary: "Exercises hard score limits.",
        round: 99,
        effects: [
          {
            type: "CHARACTER_MOMENTUM_DELTA",
            characterId: "char_moretti",
            delta: 100,
          },
          {
            type: "CHARACTER_FATIGUE_DELTA",
            characterId: "char_moretti",
            delta: 100,
          },
          {
            type: "GOAL_URGENCY_DELTA",
            goalId: "goal_moretti_title",
            delta: 100,
          },
        ],
      },
    ]);

    expect(character(result.nextState, "char_moretti").dynamic.momentum).toBe(25);
    expect(
      character(result.nextState, "char_moretti").dynamic.politicalFatigue,
    ).toBe(100);
    expect(
      result.nextState.goals.find((item) => item.id === "goal_moretti_title")
        ?.urgency,
    ).toBe(100);
  });

  it("fails fast when authored events reference missing political entities", () => {
    expect(() =>
      processRound(demoState, 99, [
        {
          id: "event_invalid_reference",
          type: "MEDIA_EVENT",
          title: "Invalid event",
          summary: "References an actor that does not exist.",
          round: 99,
          effects: [
            {
              type: "CHARACTER_MOMENTUM_DELTA",
              characterId: "char_missing",
              delta: 1,
            },
          ],
        },
      ]),
    ).toThrow(/was not found/);
  });
});
