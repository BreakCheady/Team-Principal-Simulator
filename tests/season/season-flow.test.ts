import { describe, expect, it } from "vitest";
import { demoSeasonSteps } from "../../src/game/data/demo-season";
import { demoState } from "../../src/game/data/demo-state";
import {
  advanceSeason,
  createSeasonState,
  getCurrentSeasonStep,
  resolveSeasonDecision,
} from "../../src/game/season/season-flow";

function characterMomentum(state: ReturnType<typeof createSeasonState>, id: string) {
  return state.political.characters.find((item) => item.id === id)?.dynamic.momentum;
}

describe("season flow", () => {
  it("carries political consequences through consecutive conflicts", () => {
    const initial = createSeasonState(demoState, demoSeasonSteps);
    const initialSnapshot = structuredClone(demoState);

    expect(initial.phase).toBe("DECISION");
    expect(initial.currentRound).toBe(14);
    expect(getCurrentSeasonStep(initial).conflictId).toBe(
      "conflict_technical_direction",
    );
    expect(
      initial.political.conflicts.find(
        (item) => item.id === "conflict_driver_status",
      )?.status,
    ).toBe("DORMANT");

    const first = resolveSeasonDecision(initial, "support_moretti");

    expect(demoState).toEqual(initialSnapshot);
    expect(first.seasonState.phase).toBe("REVIEW");
    expect(characterMomentum(first.seasonState, "char_moretti")).toBe(19);
    expect(first.seasonState.history).toHaveLength(1);

    const round15 = advanceSeason(first.seasonState);

    expect(round15.phase).toBe("DECISION");
    expect(round15.currentRound).toBe(15);
    expect(getCurrentSeasonStep(round15).conflictId).toBe(
      "conflict_driver_status",
    );
    expect(
      round15.political.conflicts.find(
        (item) => item.id === "conflict_driver_status",
      )?.status,
    ).toBe("ACTIVE");

    const second = resolveSeasonDecision(round15, "back_keller");

    expect(characterMomentum(second.seasonState, "char_moretti")).toBe(16);
    expect(characterMomentum(second.seasonState, "char_keller")).toBe(5);
    expect(second.seasonState.history.map((item) => item.conflictId)).toEqual([
      "conflict_technical_direction",
      "conflict_driver_status",
    ]);
    expect(
      second.seasonState.political.precedents.find(
        (item) => item.id === "precedent_technical_authority",
      )?.violations,
    ).toBe(1);
    expect(
      second.seasonState.political.precedents.find(
        (item) => item.id === "precedent_driver_priority",
      )?.applications,
    ).toBe(4);

    const complete = advanceSeason(second.seasonState);
    expect(complete.phase).toBe("COMPLETE");
    expect(complete.history).toHaveLength(2);
  });

  it("does not allow advancing before the current conflict is resolved", () => {
    const season = createSeasonState(demoState, demoSeasonSteps);
    expect(() => advanceSeason(season)).toThrow(/reviewing a resolved conflict/);
  });

  it("does not allow a second decision while consequences are under review", () => {
    const season = createSeasonState(demoState, demoSeasonSteps);
    const first = resolveSeasonDecision(season, "offer_compromise");
    expect(() =>
      resolveSeasonDecision(first.seasonState, "support_chen"),
    ).toThrow(/DECISION phase/);
  });

  it("rejects duplicate conflicts in the season schedule", () => {
    expect(() =>
      createSeasonState(demoState, [demoSeasonSteps[0], demoSeasonSteps[0]]),
    ).toThrow(/appears more than once/);
  });
});
