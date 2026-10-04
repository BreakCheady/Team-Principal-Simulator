import { formDynamicFactions } from "../../src/game/political/faction-formation";
import { describe, expect, it } from "vitest";
import { demoState } from "../../src/game/data/demo-state";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { demoIssueDefinitions } from "../../src/game/data/demo-issues";
import {
  createCareerFlow,
  advanceCareerFlow,
  startNextSeason,
  reviewSeason,
  setRaceStrategy,
} from "../../src/game/career/career";
import {
  signCandidate,
  respondTransferOffer,
  terminateEmployment,
  releaseContract,
  agreeMutualOption,
} from "../../src/game/career/market";
import {
  advanceActors,
  respondActorRequest,
} from "../../src/game/career/actors";
import {
  startDevelopment,
  completeDevelopment,
  simulateRace,
  teamTable,
} from "../../src/game/career/sport";
import { validateCareer } from "../../src/game/career/state";
import {
  bookFinanceTransaction,
  getCashBalance,
} from "../../src/game/finance/finances";
import { validatePoliticalCoreState } from "../../src/game/political/validation";
import { decodeSave, encodeSave } from "../../src/game/save/save-game";
import {
  getOpenIssues,
  resolveRoundIssue,
  startRoundContractNegotiation,
  submitRoundContractOffer,
  takeRoundFinanceAction,
  type RoundFlowState,
} from "../../src/game/season/round-flow";

function flow(round = 15) {
  const political = structuredClone(demoState);
  political.finance.openingBalanceMillions = 150;
  return createCareerFlow(political, demoRoundEvents, round);
}
function valid(state: RoundFlowState) {
  expect(validatePoliticalCoreState(state.political)).toMatchObject({
    success: true,
  });
  expect(() =>
    validateCareer(state.career, state.political, state.currentRound),
  ).not.toThrow();
}
function clearInbox(state: RoundFlowState) {
  while (getOpenIssues(state).length) {
    const issue = getOpenIssues(state)[0],
      definition = demoIssueDefinitions.find(
        (d) => d.id === issue.definitionId,
      )!;
    state = resolveRoundIssue(
      state,
      issue.id,
      definition.actions[0].id,
      demoIssueDefinitions,
    );
  }
  return state;
}
function finish(state: RoundFlowState, events = demoRoundEvents) {
  while (!state.complete)
    state = advanceCareerFlow(clearInbox(state), events, demoIssueDefinitions);
  return clearInbox(state);
}

describe("career market and contractual rights", () => {
  it("settles departures immediately, closes talks and preserves history without recurring pay", () => {
    let state = flow();
    state = startRoundContractNegotiation(state, "contract_keller_2026");
    const old = structuredClone(state),
      cash = getCashBalance(state.political);
    const next = terminateEmployment(state, "char_keller");
    expect(state).toEqual(old);
    expect(
      next.career!.seats.find((s) => s.seat === "DRIVER_TWO")!.characterId,
    ).toBeNull();
    expect(next.negotiations[0].status).toBe("REJECTED");
    expect(getCashBalance(next.political)).toBe(cash - 11);
    expect(next.political.contracts[1].salaryPaidMillions).toBe(16);
    const after = advanceCareerFlow(next, []);
    expect(
      after.political.finance.transactions.filter(
        (t) => t.contractId === "contract_keller_2026" && t.round === 16,
      ),
    ).toEqual([]);
    expect(() =>
      submitRoundContractOffer(next, next.negotiations[0].id, "GENEROUS", []),
    ).toThrow(/left/);
    valid(after);
  });
  it("models the previously contractless engineering seat so staff can be replaced", () => {
    const state = flow();
    expect(
      state.political.contracts.find((c) => c.characterId === "char_bellini"),
    ).toMatchObject({
      salaryMillionsPerSeason: 1.5,
      guaranteedSalaryMillions: 1.5,
    });
    const departed = terminateEmployment(state, "char_bellini");
    const signed = signCandidate(
      departed,
      "candidate_kovac",
      "ENGINEERING",
      1.5,
      24,
    );
    expect(
      signed.career!.seats.find((s) => s.seat === "ENGINEERING")!.characterId,
    ).toBe("char_kovac");
    valid(signed);
  });
  it("excludes alumni from newly derived political coalitions", () => {
    const state = terminateEmployment(flow(), "char_keller");
    const conflict = state.political.conflicts.find(
      (c) => c.id === "conflict_technical_direction",
    )!;
    expect(
      formDynamicFactions(state.political, conflict).alignments.some(
        (a) => a.characterId === "char_keller",
      ),
    ).toBe(false);
    expect(
      state.political.characters.find((a) => a.id === "char_keller")!.active,
    ).toBe(false);
  });
  it("checks cash for guaranteed exits and never mutates a rejected operation", () => {
    const state = createCareerFlow(demoState, [], 15),
      old = structuredClone(state);
    expect(() => terminateEmployment(state, "char_moretti")).toThrow(/Cash/);
    expect(state).toEqual(old);
  });
  it("creates real contracts, relationships, goals and sporting participants on signing", () => {
    const state = terminateEmployment(flow(), "char_keller");
    const next = signCandidate(state, "candidate_ito", "DRIVER_TWO", 4, 24);
    expect(getCashBalance(next.political)).toBeCloseTo(138.2);
    expect(
      next.career!.seats.find((s) => s.seat === "DRIVER_TWO")!.characterId,
    ).toBe("char_ito");
    const contract = next.political.contracts.find(
      (c) => c.characterId === "char_ito",
    )!;
    expect(contract).toMatchObject({
      startRound: 16,
      endRound: 39,
      guaranteedSalaryMillions: 4,
    });
    expect(
      next.political.relationships.some(
        (r) =>
          r.fromCharacterId === "char_ito" &&
          r.toCharacterId === "char_hartmann",
      ),
    ).toBe(true);
    expect(
      next.political.goals.some(
        (g) => g.characterId === "char_ito" && g.active,
      ),
    ).toBe(true);
    const raced = advanceCareerFlow(next, []);
    expect(
      raced.career!.races[0].results.some((r) => r.characterId === "char_ito"),
    ).toBe(true);
    expect(
      raced.career!.races[0].results.some(
        (r) => r.characterId === "char_keller",
      ),
    ).toBe(false);
    valid(raced);
  });
  it("enforces vacancy, candidate role, salary, term, consent and financial caps", () => {
    const full = flow();
    expect(() =>
      signCandidate(full, "candidate_ito", "DRIVER_TWO", 4, 24),
    ).toThrow(/vacant/);
    const state = terminateEmployment(full, "char_keller"),
      old = structuredClone(state);
    expect(() =>
      signCandidate(state, "candidate_reed", "DRIVER_TWO", 5, 24),
    ).toThrow(/vacant/);
    expect(() =>
      signCandidate(state, "candidate_ito", "DRIVER_TWO", 3, 24),
    ).toThrow(/salary/);
    expect(() =>
      signCandidate(state, "candidate_ito", "DRIVER_TWO", 4, 60),
    ).toThrow(/12–48/);
    expect(() =>
      signCandidate(state, "candidate_ito", "DRIVER_TWO", 100, 24),
    ).toThrow(/payroll/);
    state.political.characters.find(
      (c) => c.role === "TEAM_PRINCIPAL",
    )!.dynamic.institutionalReputation = 0;
    expect(() =>
      signCandidate(state, "candidate_alvarez", "DRIVER_TWO", 12, 24),
    ).toThrow(/premium/);
    state.political.characters.find(
      (c) => c.role === "TEAM_PRINCIPAL",
    )!.dynamic.institutionalReputation = old.political.characters.find(
      (c) => c.role === "TEAM_PRINCIPAL",
    )!.dynamic.institutionalReputation;
    expect(state).toEqual(old);
  });
  it("requires an active team release right and books fees plus outstanding guarantees once", () => {
    const state = flow(18),
      cash = getCashBalance(state.political);
    expect(() =>
      releaseContract(
        state,
        "contract_moretti_2026",
        "release_moretti_team_slump",
      ),
    ).toThrow(/release right/);
    const next = releaseContract(
      state,
      "contract_keller_2026",
      "release_keller_market",
    );
    // Current round's salaries settle under the old contract before the guarantee is paid.
    const salaryDelta =
      next.political.contracts[1].salaryPaidMillions -
      state.political.contracts[1].salaryPaidMillions;
    expect(salaryDelta).toBe(11);
    expect(
      next.political.finance.transactions.filter(
        (t) => t.category === "RELEASE_PAYMENT",
      ),
    ).toHaveLength(1);
    expect(getCashBalance(next.political)).toBeLessThan(cash - 28);
    expect(() =>
      releaseContract(next, "contract_keller_2026", "release_keller_market"),
    ).toThrow(/release right/);
    valid(next);
  });
  it("creates rival approaches and requires player and actor consent for ordinary transfers", () => {
    const state = advanceActors(flow(18));
    const offer = state.career!.offers.find(
      (o) => o.characterId === "char_keller",
    )!;
    expect(offer).toMatchObject({ fee: 28, status: "OPEN", expiresRound: 20 });
    const moved = respondTransferOffer(state, offer.id, true);
    expect(moved.career!.offers.find((o) => o.id === offer.id)!.status).toBe(
      "ACCEPTED",
    );
    expect(
      moved.political.finance.transactions.some(
        (t) => t.category === "TRANSFER_INCOME" && t.amountMillions === 28,
      ),
    ).toBe(true);
    expect(() => respondTransferOffer(moved, offer.id, true)).toThrow(
      /no longer open/,
    );
    const no = structuredClone(state);
    no.political.characters.find(
      (c) => c.id === offer.characterId,
    )!.career.transferInterest = 0;
    no.political.characters.find(
      (c) => c.id === offer.characterId,
    )!.personality.ambition = 0;
    expect(() => respondTransferOffer(no, offer.id, true)).toThrow(/consent/);
    valid(moved);
  });
  it("honours a unilateral character release even after a refused offer and without cash", () => {
    let state = advanceActors(flow(18));
    const offer = state.career!.offers.find(
      (o) => o.characterId === "char_keller",
    )!;
    state = respondTransferOffer(state, offer.id, false);
    state.currentRound = 21;
    state.political.finance.openingBalanceMillions = 0;
    state.political.characters.find(
      (c) => c.id === "char_keller",
    )!.dynamic.instability = 90;
    const moved = advanceActors(state);
    expect(moved.career!.activeActorIds).not.toContain("char_keller");
    expect(moved.career!.offers.find((o) => o.id === offer.id)!.status).toBe(
      "DEPARTED",
    );
    valid(moved);
  });
  it("gets mutual consent, checks budget and cannot exercise twice or outside the window", () => {
    const state = flow(30),
      contract = state.political.contracts[2],
      option = contract.options[0];
    const next = agreeMutualOption(state, contract.id, option.id);
    expect(next.political.contracts[2].endRound).toBe(62);
    expect(() => agreeMutualOption(next, contract.id, option.id)).toThrow(
      /already exercised/,
    );
    const refused = structuredClone(state);
    refused.political.characters.find(
      (c) => c.id === "char_chen",
    )!.dynamic.instability = 100;
    refused.political.characters.find(
      (c) => c.id === "char_chen",
    )!.personality.compromiseWillingness = 0;
    expect(() => agreeMutualOption(refused, contract.id, option.id)).toThrow(
      /refuses consent/,
    );
    expect(() => agreeMutualOption(flow(29), contract.id, option.id)).toThrow(
      /window/,
    );
    valid(next);
  });
  it("lets characters independently exercise their option despite the voluntary payroll cap", () => {
    const state = flow(21),
      contract = state.political.contracts[1];
    contract.options[0].holder = "CHARACTER";
    contract.options[0].available = true;
    state.political.finance.payrollBudgetMillionsPerSeason = 1;
    const next = advanceActors(state);
    expect(next.political.contracts[1].options[0].exercised).toBe(true);
    expect(next.political.contracts[1].endRound).toBe(50);
    valid(next);
  });
});

describe("sporting and development simulation", () => {
  it("uses seeded results instead of authored championship snapshots and persists the RNG", () => {
    const initial = flow(21),
      old = structuredClone(initial);
    const first = advanceCareerFlow(initial, demoRoundEvents);
    const same = advanceCareerFlow(initial, demoRoundEvents);
    expect(first).toEqual(same);
    expect(initial).toEqual(old);
    expect(first.career!.races).toHaveLength(1);
    expect(
      first.career!.standings.find((s) => s.id === "char_moretti")!.wins,
    ).toBeLessThanOrEqual(1);
    expect(
      first.history[0].events.some(
        (e) => e.eventId === "event_round_22_contract_results",
      ),
    ).toBe(false);
    const restored = decodeSave<RoundFlowState>(
      encodeSave("ROUND_FLOW", first),
      "ROUND_FLOW",
    ).state;
    expect(advanceCareerFlow(restored, [])).toEqual(
      advanceCareerFlow(first, []),
    );
    valid(first);
  });
  it("changes results with driver skill, car upgrades, race strategy and absent staff", () => {
    const slow = flow(16);
    slow.career!.car.pace = 30;
    slow.career!.car.reliability = 100;
    const fast = structuredClone(slow);
    fast.career!.car.pace = 100;
    fast.career!.strategy = "ATTACK";
    const resultSlow = simulateRace(slow),
      resultFast = simulateRace(fast);
    expect(
      resultFast.career!.races[0].results.find(
        (r) => r.characterId === "char_moretti",
      )!.score,
    ).toBeGreaterThan(
      resultSlow.career!.races[0].results.find(
        (r) => r.characterId === "char_moretti",
      )!.score,
    );
    const vacant = structuredClone(slow);
    vacant.career!.seats.forEach((s) => {
      if (s.seat === "SPORTING" || s.seat === "ENGINEERING")
        s.characterId = null;
    });
    const resultVacant = simulateRace(vacant);
    expect(
      resultVacant.career!.races[0].results.find(
        (r) => r.characterId === "char_moretti",
      )!.score,
    ).toBeLessThan(
      resultSlow.career!.races[0].results.find(
        (r) => r.characterId === "char_moretti",
      )!.score,
    );
    expect(() => simulateRace(resultFast)).toThrow(/already simulated/);
  });
  it("takes actual cumulative results to contract triggers exactly once", () => {
    const state = flow(16);
    state.political.contracts[1].performanceTriggers[0].threshold = 0;
    const next = simulateRace(state),
      bonus = next.political.finance.transactions.filter(
        (t) => t.category === "PERFORMANCE_BONUS",
      );
    expect(bonus).toHaveLength(1);
    expect(bonus[0].amountMillions).toBe(1.2);
    next.currentRound = 17;
    const after = simulateRace(next);
    expect(
      after.political.finance.transactions.filter(
        (t) => t.category === "PERFORMANCE_BONUS",
      ),
    ).toHaveLength(1);
    valid(after);
  });
  it("retains historic constructor points after a driver leaves", () => {
    const state = simulateRace(flow(16));
    const before = teamTable(state.career!).find(
      (t) => t.team === "Vanguard",
    )!.points;
    const departed = terminateEmployment(state, "char_keller");
    expect(
      teamTable(departed.career!).find((t) => t.team === "Vanguard")!.points,
    ).toBe(before);
  });
  it("books projects upfront, limits capacity and delivers after delay", () => {
    const state = flow(),
      old = structuredClone(state);
    let next = startDevelopment(state, "AERO");
    next = startDevelopment(next, "RELIABILITY");
    expect(state).toEqual(old);
    expect(getCashBalance(next.political)).toBe(145);
    expect(() => startDevelopment(next, "OPERATIONS")).toThrow(/slots/);
    expect(
      completeDevelopment(next).career!.projects.every(
        (p) => p.status === "ACTIVE",
      ),
    ).toBe(true);
    next.currentRound = 19;
    next.career!.projects.forEach((p) => (p.risk = 0));
    const delivered = completeDevelopment(next);
    expect(delivered.career!.car).toEqual({ pace: 85, reliability: 93 });
    expect(
      delivered.career!.projects.every((p) => p.status === "SUCCEEDED"),
    ).toBe(true);
    expect(completeDevelopment(delivered)).toEqual(delivered);
    valid(delivered);
  });
  it("retains sunk costs and raises political pressure when a project fails", () => {
    let state = startDevelopment(flow(), "AERO");
    state.currentRound = 19;
    state.career!.projects[0].risk = 100;
    const before = state.political.characters.find((c) => c.id === "char_chen")!
      .dynamic.instability;
    const next = completeDevelopment(state);
    expect(next.career!.projects[0].status).toBe("FAILED");
    expect(getCashBalance(next.political)).toBe(147);
    expect(
      next.political.characters.find((c) => c.id === "char_chen")!.dynamic
        .instability,
    ).toBe(before + 8);
  });
});

describe("autonomous actors, seasons and saves", () => {
  it("builds coalitions, demands and actionable escalated conflicts without a player trigger", () => {
    const source = flow(18),
      old = structuredClone(source);
    let next = advanceActors(source);
    expect(source).toEqual(old);
    expect(next.career!.requests.length).toBeGreaterThan(0);
    expect(
      next.career!.log.some((l) => l.text.includes("builds support")),
    ).toBe(true);
    const request = next.career!.requests.find((r) => r.kind === "AUTHORITY")!;
    next.currentRound = 21;
    next = advanceActors(next);
    expect(next.career!.requests.find((r) => r.id === request.id)!.status).toBe(
      "ESCALATED",
    );
    expect(
      next.political.conflicts.find((c) => c.id === `conflict_${request.id}`)!
        .status,
    ).toBe("ESCALATED");
    const responded = respondActorRequest(next, request.id, false);
    expect(
      responded.political.conflicts.find(
        (c) => c.id === `conflict_${request.id}`,
      )!.status,
    ).toBe("RESOLVED");
    expect(() => respondActorRequest(responded, request.id, false)).toThrow(
      /closed/,
    );
    valid(responded);
  });
  it("cannot satisfy a renewal demand with an unchanged old contract", () => {
    const state = advanceActors(flow(21)),
      request = state.career!.requests.find((r) => r.kind === "RENEWAL")!;
    expect(() => respondActorRequest(state, request.id, true)).toThrow(
      /Renew the contract/,
    );
    const renewed = structuredClone(state);
    renewed.political.contracts.find(
      (c) => c.id === request.contractId,
    )!.endRound += 24;
    expect(
      respondActorRequest(renewed, request.id, true).career!.requests.find(
        (r) => r.id === request.id,
      )!.status,
    ).toBe("SUPPORTED");
  });
  it("plays three seasons, expires contracts, reaches later option windows and retains obligations", () => {
    let state = finish(flow());
    expect(state.currentRound).toBe(24);
    expect(state.career!.reviews).toHaveLength(1);
    expect(state.career!.status).toBe("REVIEW");
    const initialLedger = state.political.finance.transactions.length;
    state = startNextSeason(state);
    expect(state.scheduledRounds).toEqual(
      Array.from({ length: 24 }, (_, i) => 25 + i),
    );
    expect(state.career!.standings.every((s) => s.points === 0)).toBe(true);
    state = finish(state, []);
    expect(state.currentRound).toBe(48);
    expect(
      state.career!.seats.find((s) => s.seat === "DRIVER_ONE")!.characterId,
    ).toBeNull();
    expect(state.political.contracts[0]).toMatchObject({
      status: "EXPIRED",
      salaryPaidMillions: 64,
    });
    expect(state.political.finance.transactions.length).toBeGreaterThan(
      initialLedger,
    );
    state = startNextSeason(state);
    state = finish(state, []);
    expect(state.currentRound).toBe(72);
    expect(state.career!.reviews).toHaveLength(3);
    expect(state.career!.races).toHaveLength(57);
    valid(state);
    expect(
      state.political.finance.transactions.filter(
        (t) => t.category === "PRIZE_INCOME",
      ),
    ).toHaveLength(3);
    expect(
      state.political.finance.transactions.filter(
        (t) =>
          t.category === "GUARANTEE_SETTLEMENT" &&
          t.contractId === "contract_moretti_2026",
      ),
    ).toHaveLength(1);
  }, 20000);
  it("prevents repeat prizes, early season restarts, and all actions after dismissal", () => {
    expect(() => startNextSeason(flow())).toThrow(/Complete/);
    expect(() => reviewSeason(flow())).toThrow(/Finish every/);
    const completed = finish(flow());
    expect(() => reviewSeason(completed)).toThrow(/already reviewed/);
    completed.career!.status = "DISMISSED";
    expect(() => startNextSeason(completed)).toThrow(/tenure/);
    expect(() => setRaceStrategy(completed, "ATTACK")).toThrow(/tenure/);
    expect(() => takeRoundFinanceAction(completed, "OWNER_FUNDING")).toThrow(
      /tenure/,
    );
    expect(() =>
      startRoundContractNegotiation(completed, "contract_chen_2026"),
    ).toThrow(/tenure/);
    expect(() => advanceCareerFlow(completed, [])).toThrow(/reset/);
  });
  it("books distinct emergency funding on both sides of the same season-boundary round", () => {
    let state = finish(flow());
    const cash = getCashBalance(state.political);
    state.political = bookFinanceTransaction(state.political, {
      id: "cash_setup",
      round: 24,
      category: "OPERATING_COST",
      amountMillions: cash + 1,
      description: "Cash stress scenario",
    });
    state = takeRoundFinanceAction(state, "OWNER_FUNDING");
    state.political = bookFinanceTransaction(state.political, {
      id: "cash_setup_two",
      round: 24,
      category: "OPERATING_COST",
      amountMillions: 25,
      description: "Further cash stress",
    });
    state = startNextSeason(state);
    state = takeRoundFinanceAction(state, "OWNER_FUNDING");
    expect(
      state.political.finance.transactions.filter(
        (t) => t.category === "OWNER_FUNDING",
      ),
    ).toHaveLength(2);
    expect(getCashBalance(state.political)).toBe(14);
    valid(state);
  });
  it("issues board warnings and dismisses after two failures", () => {
    let state = flow(24);
    state.career!.targets = { teamPosition: 1, cash: 1000, stability: 100 };
    state.political.characters.forEach((c) => (c.dynamic.instability = 70));
    state = reviewSeason(state);
    expect(state.career!.reviews[0].verdict).toBe("WARNING");
    state = startNextSeason(state);
    state.currentRound = 48;
    state.complete = true;
    state.career!.targets = { teamPosition: 1, cash: 1000, stability: 100 };
    state = reviewSeason(state);
    expect(state.career!.status).toBe("DISMISSED");
  });
  it("migrates old final-round saves to a playable new calendar without replayed charges", () => {
    const legacy = {
      version: 7,
      kind: "ROUND_FLOW",
      savedAt: "old",
      state: { ...flow(24), career: undefined },
    };
    const state = decodeSave<RoundFlowState>(
      JSON.stringify(legacy),
      "ROUND_FLOW",
    ).state;
    expect(state.career!.status).toBe("RUNNING");
    expect(state.scheduledRounds[0]).toBe(25);
    expect(state.political.finance.transactions).toEqual([]);
    expect(state.career!.standings.every((s) => s.points === 0)).toBe(true);
    valid(state);
  });
  it("rejects broken career references, duplicate seats, bad RNG and future races on load", () => {
    const initial = flow();
    for (const change of [
      (s: RoundFlowState) => {
        s.career!.seats[0].characterId = "char_unknown";
      },
      (s: RoundFlowState) => {
        s.career!.seats[1].characterId = s.career!.seats[0].characterId;
      },
      (s: RoundFlowState) => {
        s.career!.seed = -1;
      },
      (s: RoundFlowState) => {
        s.career!.seasonEnd = 40;
      },
      (s: RoundFlowState) => {
        s.nextRoundIndex = 100;
      },
    ]) {
      const broken = structuredClone(initial);
      change(broken);
      expect(() =>
        decodeSave(encodeSave("ROUND_FLOW", broken), "ROUND_FLOW"),
      ).toThrow();
    }
  });
});
