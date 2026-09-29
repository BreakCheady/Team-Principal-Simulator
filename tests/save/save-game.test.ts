import { describe, expect, it } from "vitest";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { demoState } from "../../src/game/data/demo-state";
import { decodeSave, encodeSave } from "../../src/game/save/save-game";
import { createRoundFlowState } from "../../src/game/season/round-flow";

describe("local save envelope", () => {
  it("round-trips versioned game state", () => {
    const state = createRoundFlowState(demoState, demoRoundEvents, 15);
    const raw = encodeSave("ROUND_FLOW", state);
    const decoded = decodeSave<typeof state>(raw, "ROUND_FLOW");

    expect(decoded.version).toBe(2);
    expect(decoded.kind).toBe("ROUND_FLOW");
    expect(decoded.state).toEqual(state);
  });

  it("rejects saves from another stage", () => {
    const state = createRoundFlowState(demoState, demoRoundEvents, 15);
    const raw = encodeSave("ROUND_FLOW", state);

    expect(() => decodeSave(raw, "SEASON")).toThrow(/different game stage/);
  });

  it("rejects unsupported save versions", () => {
    const raw = JSON.stringify({
      version: 999,
      kind: "ROUND_FLOW",
      savedAt: new Date().toISOString(),
      state: {},
    });

    expect(() => decodeSave(raw, "ROUND_FLOW")).toThrow(
      /Unsupported save version/,
    );
  });
});
