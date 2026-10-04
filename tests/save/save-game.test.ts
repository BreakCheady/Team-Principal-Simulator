import { describe, expect, it } from "vitest";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { demoState } from "../../src/game/data/demo-state";
import { decodeSave, encodeSave } from "../../src/game/save/save-game";
import { createRoundFlowState } from "../../src/game/season/round-flow";
import { advanceRoundFlow, takeRoundFinanceAction } from "../../src/game/season/round-flow";
import { getCashBalance } from "../../src/game/finance/finances";

describe("local save envelope", () => {
  it("preserves bookings and finance decisions without paying the same round again", () => {
    let state = advanceRoundFlow(createRoundFlowState(demoState, demoRoundEvents, 15), demoRoundEvents);
    state = takeRoundFinanceAction(state, "CUT_OPERATING_COSTS");
    const restored = decodeSave<typeof state>(encodeSave("ROUND_FLOW", state), "ROUND_FLOW").state;
    expect(restored).toEqual(state);
    const next = advanceRoundFlow(restored, demoRoundEvents);
    expect(next.political.finance.transactions.filter((item) => item.category === "SALARY" && item.round === 16)).toHaveLength(4);
    expect(next.political.finance.operatingCostMillionsPerRound).toBe(1.84);
  });

  it("migrates version-6 saves at their current round without rebilling past bonuses", () => {
    const state = createRoundFlowState(demoState, demoRoundEvents, 22);
    state.political.contracts[0].performanceTriggers[0].triggered = true;
    state.political.contracts[0].earnedBonusesMillions = 2.5;
    const legacy = JSON.parse(encodeSave("ROUND_FLOW", state));
    legacy.version = 6;
    delete legacy.state.political.finance;
    for (const contract of legacy.state.political.contracts) delete contract.salaryPaidMillions;
    const restored = decodeSave<typeof state>(JSON.stringify(legacy), "ROUND_FLOW");
    expect(restored.version).toBe(9);
    expect(restored.state.currentRound).toBe(22);
    expect(restored.state.political.finance.openedAfterRound).toBe(22);
    expect(restored.state.political.finance.transactions).toEqual([]);
    expect(restored.state.political.contracts[0].performanceTriggers[0].triggered).toBe(true);
    expect(restored.state.political.contracts[0].salaryPaidMillions).toBeCloseTo(32 * 22 / 24, 6);
    const next = advanceRoundFlow(restored.state, demoRoundEvents);
    expect(getCashBalance(next.political)).toBe(16.375);
    expect(next.political.finance.transactions.every((item) => item.round === 23)).toBe(true);
    expect(next.political.finance.transactions.filter((item) => item.category === "PERFORMANCE_BONUS")).toEqual([]);
  });

  it("rejects current saves with missing finances or a broken ledger", () => {
    const state = createRoundFlowState(demoState, demoRoundEvents, 15);
    const broken = JSON.parse(encodeSave("ROUND_FLOW", state));
    delete broken.state.political.finance;
    expect(() => decodeSave(JSON.stringify(broken), "ROUND_FLOW")).toThrow(/team finances/);
    broken.state.political.finance = state.political.finance;
    broken.state.political.finance.openingBalanceMillions = -1;
    expect(() => decodeSave(JSON.stringify(broken), "ROUND_FLOW")).toThrow(/invalid game state/);
  });

  it("round-trips versioned game state", () => {
    const state = createRoundFlowState(demoState, demoRoundEvents, 15);
    const raw = encodeSave("ROUND_FLOW", state);
    const decoded = decodeSave<typeof state>(raw, "ROUND_FLOW");

    expect(decoded.version).toBe(9);
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
