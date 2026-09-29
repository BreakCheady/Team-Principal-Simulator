import { describe, expect, it } from "vitest";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { demoState } from "../../src/game/data/demo-state";
import {
  advanceRoundFlow,
  createRoundFlowState,
  getNextRound,
} from "../../src/game/season/round-flow";

describe("round flow", () => {
  it("schedules authored event rounds after the completed conflict sequence", () => {
    const flow = createRoundFlowState(demoState, demoRoundEvents, 15);

    expect(flow.currentRound).toBe(15);
    expect(flow.scheduledRounds).toEqual([16, 17, 18, 19, 20]);
    expect(getNextRound(flow)).toBe(16);
    expect(flow.complete).toBe(false);
  });

  it("advances one round at a time and carries the changed PoliticalState", () => {
    const source = structuredClone(demoState);
    const initialSnapshot = structuredClone(source);
    const round16 = advanceRoundFlow(
      createRoundFlowState(source, demoRoundEvents, 15),
      demoRoundEvents,
    );

    expect(source).toEqual(initialSnapshot);
    expect(round16.currentRound).toBe(16);
    expect(getNextRound(round16)).toBe(17);
    expect(round16.history).toHaveLength(1);
    expect(round16.history[0].events[0].type).toBe("RACE_RESULT");

    const keller = round16.political.characters.find(
      (character) => character.id === "char_keller",
    );
    expect(keller?.dynamic.momentum).toBe(6);

    const driverStatus = round16.political.conflicts.find(
      (conflict) => conflict.id === "conflict_driver_status",
    );
    expect(driverStatus?.status).toBe("ACTIVE");
  });

  it("surfaces conflicts spawned by later paddock events", () => {
    let flow = createRoundFlowState(demoState, demoRoundEvents, 15);

    while (getNextRound(flow) !== 19) {
      flow = advanceRoundFlow(flow, demoRoundEvents);
    }
    flow = advanceRoundFlow(flow, demoRoundEvents);

    const latest = flow.history.at(-1);
    expect(latest?.round).toBe(19);
    expect(latest?.events[0].spawnedConflictIds).toContain(
      "conflict_moretti_media_pressure",
    );
    expect(latest?.activeConflictIds).toContain(
      "conflict_moretti_media_pressure",
    );
    expect(
      flow.political.conflicts.find(
        (conflict) => conflict.id === "conflict_moretti_media_pressure",
      )?.status,
    ).toBe("ACTIVE");
  });

  it("finishes after the last authored round and rejects further advancement", () => {
    let flow = createRoundFlowState(demoState, demoRoundEvents, 15);

    while (!flow.complete) {
      flow = advanceRoundFlow(flow, demoRoundEvents);
    }

    expect(flow.currentRound).toBe(20);
    expect(getNextRound(flow)).toBeNull();
    expect(flow.history.map((entry) => entry.round)).toEqual([
      16, 17, 18, 19, 20,
    ]);
    expect(() => advanceRoundFlow(flow, demoRoundEvents)).toThrow(
      /already complete/,
    );
  });

  it("starts from the PoliticalState produced by prior player decisions", () => {
    const political = structuredClone(demoState);
    const moretti = political.characters.find(
      (character) => character.id === "char_moretti",
    );
    if (!moretti) throw new Error("Missing Moretti");

    moretti.dynamic.momentum = 20;

    const round16 = advanceRoundFlow(
      createRoundFlowState(political, demoRoundEvents, 15),
      demoRoundEvents,
    );

    expect(
      round16.political.characters.find(
        (character) => character.id === "char_moretti",
      )?.dynamic.momentum,
    ).toBe(18);
  });
});
