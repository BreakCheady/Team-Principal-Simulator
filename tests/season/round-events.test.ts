import { describe, expect, it } from "vitest";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { demoState } from "../../src/game/data/demo-state";
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

  it("routes media events into the issue layer instead of spawning a conflict immediately", () => {
    const result = processRound(demoState, 19, demoRoundEvents);

    expect(result.events[0].type).toBe("MEDIA_EVENT");
    expect(result.events[0].spawnedConflictIds).toEqual([]);
    expect(
      result.nextState.conflicts.some(
        (item) => item.id === "conflict_moretti_media_pressure",
      ),
    ).toBe(false);
  });

  it("routes contract talks into the issue layer while still changing leverage", () => {
    const result = processRound(demoState, 20, demoRoundEvents);
    const transfer = result.nextState.leverages.find(
      (item) => item.id === "lev_moretti_transfer",
    );

    expect(result.events[0].type).toBe("CONTRACT_TALK");
    expect(transfer?.strength).toBe(99);
    expect(result.events[0].spawnedConflictIds).toEqual([]);
    expect(
      result.nextState.conflicts.some(
        (item) => item.id === "conflict_moretti_contract",
      ),
    ).toBe(false);
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
