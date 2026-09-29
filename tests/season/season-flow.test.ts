import { describe, expect, it } from "vitest";
import { demoSeasonSteps } from "../../src/game/data/demo-season";
import { demoState } from "../../src/game/data/demo-state";
import { calculateConflict } from "../../src/game/political/conflicts";
import {
  advanceSeason,
  createSeasonState,
  getCurrentSeasonStep,
  resolveSeasonDecision,
} from "../../src/game/season/season-flow";

function characterMomentum(
  state: ReturnType<typeof createSeasonState>,
  id: string,
) {
  return state.political.characters.find((item) => item.id === id)?.dynamic
    .momentum;
}

function calculateCurrentConflict(state: ReturnType<typeof createSeasonState>) {
  const step = getCurrentSeasonStep(state);
  const conflict = state.political.conflicts.find(
    (item) => item.id === step.conflictId,
  );
  if (!conflict) throw new Error("Missing current conflict");

  return calculateConflict(state.political, conflict, step.input);
}

describe("season flow", () => {
  it("carries political consequences through consecutive conflicts", () => {
    const initial = createSeasonState(demoState, demoSeasonSteps);
    const initialSnapshot = structuredClone(demoState);

    expect(initial.phase).toBe("DECISION");
    expect(initial.currentRound).toBe(14);
    expect(initial.pendingReview).toBeNull();
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
    expect(first.seasonState.pendingReview?.decisionId).toBe("support_moretti");
    expect(characterMomentum(first.seasonState, "char_moretti")).toBe(19);
    expect(first.seasonState.history).toHaveLength(1);

    const round15 = advanceSeason(first.seasonState);

    expect(round15.phase).toBe("DECISION");
    expect(round15.currentRound).toBe(15);
    expect(round15.pendingReview).toBeNull();
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
    expect(complete.pendingReview).toBeNull();
    expect(complete.history).toHaveLength(2);
  });

  it("previous decisions materially change the next conflict calculation", () => {
    const morettiPath = advanceSeason(
      resolveSeasonDecision(
        createSeasonState(demoState, demoSeasonSteps),
        "support_moretti",
      ).seasonState,
    );
    const chenPath = advanceSeason(
      resolveSeasonDecision(
        createSeasonState(demoState, demoSeasonSteps),
        "support_chen",
      ).seasonState,
    );

    const afterMoretti = calculateCurrentConflict(morettiPath);
    const afterChen = calculateCurrentConflict(chenPath);

    expect(afterMoretti.factionB.strength).not.toBeCloseTo(
      afterChen.factionB.strength,
      4,
    );
    expect(afterMoretti.derived.resentment).toBeGreaterThan(
      afterChen.derived.resentment,
    );
    expect(afterMoretti.escalation).not.toBeCloseTo(afterChen.escalation, 4);
  });

  it("keeps review data after serialization so a save cannot soft-lock REVIEW", () => {
    const resolved = resolveSeasonDecision(
      createSeasonState(demoState, demoSeasonSteps),
      "offer_compromise",
    ).seasonState;

    const rehydrated = JSON.parse(JSON.stringify(resolved)) as typeof resolved;

    expect(rehydrated.phase).toBe("REVIEW");
    expect(rehydrated.pendingReview?.decisionId).toBe("offer_compromise");
    expect(rehydrated.pendingReview?.changes.length).toBeGreaterThan(0);
    expect(() => advanceSeason(rehydrated)).not.toThrow();
  });

  it("does not allow advancing before the current conflict is resolved", () => {
    const season = createSeasonState(demoState, demoSeasonSteps);
    expect(() => advanceSeason(season)).toThrow(
      /reviewing a resolved conflict/,
    );
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

  it("rejects invalid calculation inputs before gameplay starts", () => {
    const invalidSteps = structuredClone(demoSeasonSteps);
    invalidSteps[1].input.resentment = 101;

    expect(() => createSeasonState(demoState, invalidSteps)).toThrow(
      /resentment must be between 0 and 100/,
    );

    const invalidWillingness = structuredClone(demoSeasonSteps);
    invalidWillingness[1].input.willingnessByCharacterId = {
      char_moretti: 1.2,
    };

    expect(() => createSeasonState(demoState, invalidWillingness)).toThrow(
      /must be between 0 and 1/,
    );
  });

  it("rejects a scheduled conflict that has no decision options", () => {
    const source = structuredClone(demoState);
    const template = source.conflicts.find(
      (item) => item.id === "conflict_driver_status",
    );
    if (!template) throw new Error("Missing conflict template");

    source.conflicts.push({
      ...structuredClone(template),
      id: "conflict_without_decisions",
      roundStarted: 16,
      status: "DORMANT",
    });

    expect(() =>
      createSeasonState(source, [
        ...demoSeasonSteps,
        {
          conflictId: "conflict_without_decisions",
          round: 16,
          input: structuredClone(demoSeasonSteps[1].input),
        },
      ]),
    ).toThrow(/has no decision options/);
  });
});
