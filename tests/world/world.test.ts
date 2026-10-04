import { createCareerFlow } from "../../src/game/career/career";
import { demoState } from "../../src/game/data/demo-state";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { describe, it, expect } from "vitest";
import { SERIES, getSeries } from "../../src/game/world/series";
import {
  createWorld,
  validateWorld,
  playerTeam,
} from "../../src/game/world/world";
import { createNewCareer } from "../../src/game/world/start";
import {
  advanceCareerFlow,
  startNextSeason,
} from "../../src/game/career/career";
import {
  terminateEmployment,
  signCandidate,
} from "../../src/game/career/market";
import { startDevelopment } from "../../src/game/career/sport";
import { decodeSave, encodeSave } from "../../src/game/save/save-game";
import { validatePoliticalCoreState } from "../../src/game/political/validation";
import { validateCareer } from "../../src/game/career/state";
import { getCashBalance } from "../../src/game/finance/finances";
import {
  submitRoundContractOffer,
  startRoundContractNegotiation,
  takeRoundFinanceAction,
  type RoundFlowState,
} from "../../src/game/season/round-flow";

function valid(flow: RoundFlowState) {
  expect(validatePoliticalCoreState(flow.political)).toMatchObject({
    success: true,
  });
  expect(() =>
    validateCareer(flow.career, flow.political, flow.currentRound),
  ).not.toThrow();
}

describe("motorsport world", () => {
  it("creates nine series, 116 staffed teams and a large unique fictional pool", () => {
    const w = createWorld();
    expect(w.teams).toHaveLength(116);
    expect(w.people.filter((p) => p.role === "DRIVER")).toHaveLength(830);
    expect(w.people.filter((p) => p.role !== "DRIVER")).toHaveLength(788);
    expect(new Set(w.people.map((p) => p.name)).size).toBe(w.people.length);
    for (const cfg of SERIES) {
      const teams = w.teams.filter((t) => t.seriesId === cfg.id);
      expect(teams).toHaveLength(cfg.teamNames.length);
      expect(
        teams.every(
          (t) =>
            t.drivers.length === cfg.driversPerTeam && t.staff.length === 3,
        ),
      ).toBe(true);
    }
    expect(validateWorld(w)).toEqual(w);
    expect(createWorld()).toEqual(w);
  });
  it.each(SERIES.map((s) => s.id))(
    "starts %s before race one with fresh contracts, finance and a full correct grid",
    (id) => {
      const flow = createNewCareer(id),
        c = flow.career!,
        cfg = getSeries(id);
      expect(flow.currentRound).toBe(0);
      expect(flow.scheduledRounds).toEqual(
        Array.from({ length: cfg.rounds }, (_, i) => i + 1),
      );
      expect(c.standings).toHaveLength(
        cfg.teamNames.length *
          cfg.driversPerTeam *
          (id === "GT3" || id === "WEC" ? 3 : id === "GT4" ? 2 : 1),
      );
      expect(c.standings.every((s) => s.points === 0)).toBe(true);
      expect(c.seats.filter((s) => s.seat.startsWith("DRIVER"))).toHaveLength(
        cfg.driversPerTeam,
      );
      expect(flow.political.finance).toMatchObject({
        openedAfterRound: 0,
        settledThroughRound: 0,
        roundsPerSeason: cfg.rounds,
        transactions: [],
      });
      expect(
        flow.political.contracts.every(
          (c) => c.startRound === 1 && c.salaryPaidMillions === 0,
        ),
      ).toBe(true);
      expect(flow.political.conflicts).toEqual([]);
      valid(flow);
      const next = advanceCareerFlow(flow, []);
      expect(next.currentRound).toBe(1);
      expect(next.career!.races[0].results).toHaveLength(
        cfg.teamNames.length * cfg.driversPerTeam,
      );
      expect(
        next.political.finance.transactions.every((t) => t.round === 1),
      ).toBe(true);
      valid(next);
    },
    15000,
  );
  it("replaces employed rivals before preseason and keeps IDs, salaries and all grids consistent", () => {
    let flow = createNewCareer("F2");
    const w = flow.career!.world!,
      team = playerTeam(w),
      oldId = team.drivers[0];
    flow = terminateEmployment(flow, oldId);
    valid(flow);
    const candidate = flow.career!.candidates.find(
      (c) =>
        c.status === "AVAILABLE" &&
        c.seriesId === "F3" &&
        c.seat === "DRIVER_ONE" &&
        c.employer !== "Free agent" &&
        c.salary < 2,
    )!;
    expect(candidate).toBeDefined();
    const oldTeam = w.teams.find((t) => t.name === candidate.employer)!;
    const signed = signCandidate(
        flow,
        candidate.id,
        "DRIVER_ONE",
        candidate.salary * 1.2,
        28,
      ),
      world = signed.career!.world!;
    expect(playerTeam(world).drivers).toContain(candidate.character.id);
    expect(world.teams.find((t) => t.id === oldTeam.id)!.drivers).not.toContain(
      candidate.character.id,
    );
    expect(world.teams.find((t) => t.id === oldTeam.id)!.drivers).toHaveLength(
      3,
    );
    expect(
      world.people.find((p) => p.id === candidate.character.id)!.teamId,
    ).toBe(world.playerTeamId);
    expect(
      signed.political.contracts.at(-1)!.guaranteedSalaryMillions,
    ).toBeCloseTo(candidate.salary * 1.2, 6);
    expect(
      signed.political.finance.transactions.some(
        (t) => t.category === "SIGNING_FEE",
      ),
    ).toBe(true);
    valid(signed);
    const raced = advanceCareerFlow(signed, []);
    expect(
      raced.career!.races[0].results.some(
        (r) =>
          r.characterId === candidate.character.id &&
          r.team === playerTeam(world).name,
      ),
    ).toBe(true);
    valid(raced);
  });
  it("does not allow unsuitable drivers or invalid source-series assignments", () => {
    const flow = createNewCareer("F1"),
      candidate = flow.career!.candidates.find(
        (c) => c.seriesId === "RALLY" && c.seat === "DRIVER_ONE",
      )!;
    expect(candidate.status).toBe("UNAVAILABLE");
    expect(() =>
      signCandidate(flow, candidate.id, "DRIVER_ONE", candidate.salary, 24),
    ).toThrow(/unavailable/);
    expect(() => createNewCareer("F1", "team_f2_0")).toThrow(/belong/);
  });
  it("records distinct deals when the same free driver is hired twice in preseason", () => {
    let flow = createNewCareer("F4");
    flow = terminateEmployment(flow, flow.career!.seats[0].characterId!);
    const candidate = flow.career!.candidates.find(
      (c) =>
        c.status === "AVAILABLE" &&
        c.seriesId === "F4" &&
        c.seat === "DRIVER_ONE" &&
        c.employer === "Free agent" &&
        !flow.political.contracts.some(
          (deal) => deal.characterId === c.character.id,
        ),
    )!;
    flow = signCandidate(
      flow,
      candidate.id,
      "DRIVER_ONE",
      candidate.salary * 1.2,
      21,
    );
    flow = terminateEmployment(flow, candidate.character.id);
    flow = signCandidate(
      flow,
      candidate.id,
      "DRIVER_ONE",
      candidate.salary * 1.2,
      21,
    );
    const deals = flow.political.contracts.filter(
      (c) => c.characterId === candidate.character.id,
    );
    expect(deals).toHaveLength(2);
    expect(new Set(deals.map((c) => c.id)).size).toBe(2);
    expect(deals.map((c) => c.status)).toEqual(["TERMINATED", "ACTIVE"]);
    valid(flow);
    valid(
      decodeSave<RoundFlowState>(encodeSave("ROUND_FLOW", flow), "ROUND_FLOW")
        .state,
    );
  });
  it("finishes a complete F1 calendar with evolving staff requests and valid saved results", () => {
    let flow = createNewCareer("F1");
    while (!flow.complete) flow = advanceCareerFlow(flow, []);
    expect(flow.currentRound).toBe(24);
    expect(flow.career!.races).toHaveLength(24);
    expect(flow.career!.reviews).toHaveLength(1);
    expect(flow.career!.requests.length).toBeGreaterThan(0);
    valid(flow);
    valid(
      decodeSave<RoundFlowState>(encodeSave("ROUND_FLOW", flow), "ROUND_FLOW")
        .state,
    );
  }, 60000);
  it("runs and resets every championship alongside a complete endurance season", () => {
    let flow = createNewCareer("WEC");
    const old = structuredClone(flow);
    while (!flow.complete) flow = advanceCareerFlow(flow, []);
    expect(old.currentRound).toBe(0);
    expect(flow.currentRound).toBe(8);
    expect(flow.career!.races).toHaveLength(8);
    expect(
      flow.career!.world!.series.every(
        (s) => s.completedRounds === getSeries(s.seriesId).rounds,
      ),
    ).toBe(true);
    expect(
      flow.career!.world!.series.every((s) =>
        s.teams.some((t) => t.points > 0),
      ),
    ).toBe(true);
    expect(flow.career!.reviews).toHaveLength(1);
    valid(flow);
    flow = startNextSeason(flow);
    expect(flow.scheduledRounds).toEqual([9, 10, 11, 12, 13, 14, 15, 16]);
    expect(flow.career!.world!.history).toHaveLength(10);
    expect(
      flow.career!.world!.series.every(
        (s) =>
          s.completedRounds === 0 && s.drivers.every((d) => d.points === 0),
      ),
    ).toBe(true);
    valid(flow);
    while (!flow.complete) flow = advanceCareerFlow(flow, []);
    expect(flow.currentRound).toBe(16);
    expect(flow.career!.reviews).toHaveLength(2);
    valid(flow);
  }, 120000);
  it("persists preseason and midseason worlds including deterministic race replay", () => {
    let flow = createNewCareer("RALLY");
    const raw = encodeSave("ROUND_FLOW", flow);
    // Keep UTF-16 storage comfortably below the usual 5 MiB browser quota.
    expect(raw.length).toBeLessThan(2_000_000);
    expect(decodeSave<RoundFlowState>(raw, "ROUND_FLOW").state).toEqual(flow);
    flow = advanceCareerFlow(flow, []);
    const restored = decodeSave<RoundFlowState>(
      encodeSave("ROUND_FLOW", flow),
      "ROUND_FLOW",
    ).state;
    expect(advanceCareerFlow(restored, [])).toEqual(
      advanceCareerFlow(flow, []),
    );
    valid(restored);
  }, 15000);
  it("supports preseason projects, cost cuts and renewals with valid financial dates", () => {
    let flow = createNewCareer("GT4");
    flow = startDevelopment(flow, "RELIABILITY");
    expect(flow.career!.projects[0].startedRound).toBe(0);
    expect(flow.political.finance.transactions[0].round).toBe(1);
    flow = takeRoundFinanceAction(flow, "CUT_OPERATING_COSTS");
    flow = startRoundContractNegotiation(flow, flow.political.contracts[0].id);
    flow = submitRoundContractOffer(
      flow,
      flow.negotiations[0].id,
      "GENEROUS",
      [],
    );
    expect(flow.career!.requests.length).toBeGreaterThan(0);
    expect(flow.political.finance.settledThroughRound).toBe(0);
    valid(flow);
  });
  it("scales salary, development and operating budgets between junior and top series", () => {
    const junior = createNewCareer("F4"),
      top = createNewCareer("F1");
    expect(
      junior.political.finance.payrollBudgetMillionsPerSeason,
    ).toBeLessThan(top.political.finance.payrollBudgetMillionsPerSeason / 20);
    const juniorProject = startDevelopment(junior, "AERO"),
      topProject = startDevelopment(top, "AERO");
    expect(juniorProject.career!.projects[0].cost).toBeLessThan(
      topProject.career!.projects[0].cost / 20,
    );
    expect(getCashBalance(junior.political)).toBeLessThan(
      getCashBalance(top.political),
    );
  });
  it("rejects duplicated world rosters, unknown employers and calendars beyond their series", () => {
    const w = createWorld(),
      duplicate = structuredClone(w);
    duplicate.teams[1].drivers[0] = duplicate.teams[0].drivers[0];
    expect(() => validateWorld(duplicate)).toThrow(/roster/);
    const unknown = structuredClone(w);
    unknown.people[0].teamId = "team_unknown";
    expect(() => validateWorld(unknown)).toThrow();
    const broken = createNewCareer("F3");
    broken.career!.world!.series[0].completedRounds = 100;
    expect(() =>
      decodeSave(encodeSave("ROUND_FLOW", broken), "ROUND_FLOW"),
    ).toThrow();
  });
  it("loads version-8 careers without resetting their paid salaries, season or current round", () => {
    const state = advanceCareerFlow(
      createCareerFlow(demoState, demoRoundEvents, 15),
      [],
    );
    const raw = JSON.stringify({
      version: 8,
      kind: "ROUND_FLOW",
      savedAt: "old",
      state,
    });
    const restored = decodeSave<RoundFlowState>(raw, "ROUND_FLOW");
    expect(restored.version).toBe(11);
    expect(restored.state).toEqual(state);
  });
});

