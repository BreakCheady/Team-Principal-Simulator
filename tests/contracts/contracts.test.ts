import { describe, expect, it } from "vitest";
import { demoState } from "../../src/game/data/demo-state";
import {
  advanceContractsForRound,
  evaluateContractPerformance,
  exerciseContractOption,
  canExerciseTeamOption,
  isReleaseClauseInForce,
} from "../../src/game/contracts/contracts";
import { validatePoliticalCoreState } from "../../src/game/political/validation";

describe("contract engine", () => {
  it.each([
    ["EXPIRED", 22], ["TERMINATED", 22], ["ACTIVE", 27], ["ACTIVE", 1],
  ] as const)("does not award performance outside an active term (%s, R%s)", (status, round) => {
    const state = structuredClone(demoState);
    const contract = state.contracts[0];
    contract.status = status;
    contract.startRound = 2;
    const original = structuredClone(state);
    const result = evaluateContractPerformance(state, contract.id, {
      wins: 5, driverChampionshipPosition: 1, teamChampionshipPosition: 4,
    }, round);
    expect(result.triggeredPerformanceTriggerIds).toEqual([]);
    expect(result.nextState).toEqual(original);
    expect(state).toEqual(original);
  });

  it("does not extend a stale active contract after its end round", () => {
    const state = structuredClone(demoState);
    const contract = state.contracts[0];
    contract.options[0].available = true;
    contract.options[0].exerciseUntilRound = 30;
    expect(() => exerciseContractOption(state, contract.id, contract.options[0].id, 27))
      .toThrow(/active term/);
  });

  it("uses inclusive option and release-clause windows", () => {
    const contract = structuredClone(demoState.contracts[0]);
    const option = contract.options[0];
    option.available = true;
    expect([21, 22, 25, 26].map((round) => canExerciseTeamOption(contract, option, round)))
      .toEqual([false, true, true, false]);
    const clause = contract.releaseClauses[0];
    clause.active = true;
    expect([19, 20, 26, 27].map((round) => isReleaseClauseInForce(contract, clause, round)))
      .toEqual([false, true, true, false]);
    contract.status = "TERMINATED";
    expect(isReleaseClauseInForce(contract, clause, 22)).toBe(false);
  });

  it("rejects invalid performance results and round numbers", () => {
    for (const snapshot of [{ wins: -1 }, { wins: 1.5 }, { points: Infinity }, { driverChampionshipPosition: 0 }]) {
      expect(() => evaluateContractPerformance(demoState, demoState.contracts[0].id, snapshot, 22))
        .toThrow(/Invalid contract performance/);
    }
    expect(() => advanceContractsForRound(demoState, 0)).toThrow(/positive integer/);
  });

  it("validates persistent Vanguard contract objects", () => {
    const validation = validatePoliticalCoreState(demoState);

    expect(validation.success).toBe(true);
    if (!validation.success) return;

    expect(validation.data.contracts).toHaveLength(4);
    expect(
      validation.data.contracts.map((contract) => contract.characterId),
    ).toEqual(["char_moretti", "char_keller", "char_chen", "char_varga"]);
  });

  it("triggers bonuses, options and release clauses from performance", () => {
    const result = evaluateContractPerformance(
      demoState,
      "contract_moretti_2026",
      {
        driverChampionshipPosition: 2,
        teamChampionshipPosition: 4,
        wins: 5,
      },
      22,
    );

    const contract = result.nextState.contracts.find(
      (item) => item.id === "contract_moretti_2026",
    );

    expect(result.triggeredPerformanceTriggerIds).toEqual([
      "trigger_moretti_win_bonus",
      "trigger_moretti_option",
      "trigger_moretti_release",
    ]);
    expect(contract?.earnedBonusesMillions).toBe(2.5);
    expect(contract?.options[0].available).toBe(true);
    expect(contract?.releaseClauses[0].active).toBe(true);
  });

  it("does not pay the same performance trigger twice", () => {
    const first = evaluateContractPerformance(
      demoState,
      "contract_moretti_2026",
      { wins: 5 },
      22,
    );
    const second = evaluateContractPerformance(
      first.nextState,
      "contract_moretti_2026",
      { wins: 6 },
      23,
    );

    const contract = second.nextState.contracts.find(
      (item) => item.id === "contract_moretti_2026",
    );

    expect(second.triggeredPerformanceTriggerIds).toEqual([]);
    expect(contract?.earnedBonusesMillions).toBe(2.5);
  });

  it("exercises an available option inside its contractual window", () => {
    const unlocked = evaluateContractPerformance(
      demoState,
      "contract_moretti_2026",
      { driverChampionshipPosition: 1 },
      22,
    ).nextState;

    const nextState = exerciseContractOption(
      unlocked,
      "contract_moretti_2026",
      "option_moretti_team_2027",
      23,
    );
    const contract = nextState.contracts.find(
      (item) => item.id === "contract_moretti_2026",
    );

    expect(contract?.options[0].exercised).toBe(true);
    expect(contract?.endRound).toBe(50);
    expect(contract?.salaryMillionsPerSeason).toBe(34.56);
  });

  it("rejects locked options and options outside their exercise window", () => {
    expect(() =>
      exerciseContractOption(
        demoState,
        "contract_moretti_2026",
        "option_moretti_team_2027",
        23,
      ),
    ).toThrow(/not available/);

    expect(() =>
      exerciseContractOption(
        demoState,
        "contract_chen_2026",
        "option_chen_mutual_2028",
        20,
      ),
    ).toThrow(/outside its exercise window/);
  });

  it("expires contracts when the season advances beyond the end round", () => {
    const nextState = advanceContractsForRound(demoState, 27);
    const moretti = nextState.contracts.find(
      (item) => item.id === "contract_moretti_2026",
    );
    const character = nextState.characters.find(
      (item) => item.id === "char_moretti",
    );

    expect(moretti?.status).toBe("EXPIRED");
    expect(character?.career.contractSecurity).toBe(0);
  });

  it("raises transfer pressure when an active release clause exists", () => {
    const nextState = advanceContractsForRound(demoState, 20);
    const keller = nextState.characters.find(
      (item) => item.id === "char_keller",
    );

    expect(keller?.career.transferInterest).toBeGreaterThanOrEqual(60);
  });
});
