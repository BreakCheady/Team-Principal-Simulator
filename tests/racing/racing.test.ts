import { describe, expect, it } from "vitest";
import { createNewCareer } from "../../src/game/world/start";
import {
  beginCareerWeekend,
  advanceCareerFlow,
} from "../../src/game/career/career";
import { validateCareer } from "../../src/game/career/state";
import { validatePoliticalCoreState } from "../../src/game/political/validation";
import { encodeSave, decodeSave } from "../../src/game/save/save-game";
import { takeRoundFinanceAction } from "../../src/game/season/round-flow";
import type { RoundFlowState } from "../../src/game/season/round-flow";
import { SERIES, type SeriesId } from "../../src/game/world/series";
import { getRaceRules } from "../../src/game/racing/rules";
import {
  qualify,
  startRace,
  stepRace,
  runWeekend,
  tyreCompliance,
  classify,
  summarize,
} from "../../src/game/racing/engine";
import {
  runPractice,
  runQualifying,
  advanceRace,
  updateRaceSetup,
  updateRacePlan,
  commandDriver,
  callPit,
  issueTeamOrder,
  retireRaceCar,
  recruitRaceCrew,
} from "../../src/game/racing/actions";
import {
  terminateEmployment,
  signCandidate,
} from "../../src/game/career/market";
import { transferWorldPerson, validateWorld } from "../../src/game/world/world";
import { getCashBalance } from "../../src/game/finance/finances";
function prepared(id: SeriesId = "F1") {
  const flow = beginCareerWeekend(createNewCareer(id), []);
  const w = flow.career!.weekend!;
  w.rain = 0;
  w.wetness = 0;
  w.weatherChanges = [];
  for (const car of w.cars) {
    car.reliability = 100;
    car.discipline = 100;
  }
  return flow;
}
function valid(flow: RoundFlowState) {
  expect(validatePoliticalCoreState(flow.political).success).toBe(true);
  expect(() =>
    validateCareer(flow.career, flow.political, flow.currentRound),
  ).not.toThrow();
}
describe("series sporting profiles", () => {
  it("distinguishes F2/F3 grids, mandatory stops and points instead of sharing a generic formula", () => {
    const f2 = getRaceRules("F2", 0, "SPRINT"),
      f3 = getRaceRules("F3", 0, "SPRINT"),
      feature = getRaceRules("F2", 1, "FEATURE");
    expect(f2.reverse).toBe(10);
    expect(f3.reverse).toBe(12);
    expect(f2.points).toEqual([10, 8, 6, 5, 4, 3, 2, 1]);
    expect(f3.points).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(feature).toMatchObject({
      mandatoryStop: true,
      twoCompounds: true,
      refuel: false,
      poleBonus: 2,
      fastestBonus: 1,
      minStopLap: 6,
    });
  });
  it("uses Italian F4 2026 top-15 points, regional GT pit windows and historical WEC durations", () => {
    expect(getRaceRules("F4", 0, "SPRINT").points).toEqual([
      30, 26, 22, 20, 18, 16, 14, 12, 10, 9, 8, 6, 4, 2, 1,
    ]);
    expect(getRaceRules("GT4", 0, "SPRINT")).toMatchObject({
      crewSize: 2,
      pitWindow: [1500, 2100],
      refuel: false,
    });
    expect(getRaceRules("GT3", 1, "ENDURANCE")).toMatchObject({
      crewSize: 3,
      requiredStops: 2,
      refuel: true,
    });
    expect(getRaceRules("LMP1", 3, "ENDURANCE")).toMatchObject({
      minutes: 1440,
      sequentialService: true,
      points: [50, 36, 30, 24, 20, 16, 12, 8, 4, 2],
    });
    expect(getRaceRules("LMP1", 7, "ENDURANCE").minutes).toBe(480);
  });
  it("counts dry specifications used under a Safety Car in F1 but retains IndyCar green-lap requirements", () => {
    const car = prepared().career!.weekend!.cars[0];
    car.wetUsed = false;
    car.tyreSets = [
      { compound: "MEDIUM", laps: 4, greenLaps: 0 },
      { compound: "HARD", laps: 2, greenLaps: 0 },
    ];
    expect(tyreCompliance(car, getRaceRules("F1", 0, "FEATURE"))).toBe(true);
    car.tyreSets = [
      { compound: "PRIMARY", laps: 4, greenLaps: 0 },
      { compound: "ALTERNATE", laps: 2, greenLaps: 0 },
    ];
    expect(tyreCompliance(car, getRaceRules("INDYCAR", 2, "ROAD"))).toBe(false);
  });
  it("requires two alternate sets on IndyCar street tracks and no compound switch on ovals", () => {
    const street = getRaceRules("INDYCAR", 0, "STREET"),
      oval = getRaceRules("INDYCAR", 1, "OVAL");
    const car = prepared("INDYCAR").career!.weekend!.cars[0];
    car.wetUsed = false;
    car.tyreSets = [
      { compound: "PRIMARY", laps: 2, greenLaps: 1 },
      { compound: "ALTERNATE", laps: 2, greenLaps: 1 },
    ];
    expect(tyreCompliance(car, street)).toBe(false);
    car.tyreSets.push({ compound: "ALTERNATE", laps: 2, greenLaps: 1 });
    expect(tyreCompliance(car, street)).toBe(true);
    car.tyreSets = [];
    expect(tyreCompliance(car, oval)).toBe(true);
    car.wetUsed = true;
    expect(tyreCompliance(car, street)).toBe(true);
  });
});
describe("interactive race weekends", () => {
  it("keeps dry automatic opponents legal instead of excluding the whole grid", () => {
    const w = prepared().career!.weekend!;
    runWeekend(w);
    const finishers = classify(w).filter((c) => !c.retired);
    expect(finishers.length).toBeGreaterThan(10);
    expect(
      finishers.every(
        (c) =>
          !c.dsq &&
          new Set(c.tyreSets.filter((s) => s.laps > 0).map((s) => s.compound))
            .size >= 2,
      ),
    ).toBe(true);
  });
  it("delays an unopened GT pit window under caution and then permits only one sprint driver change", () => {
    const w = prepared("GT4").career!.weekend!;
    qualify(w);
    startRace(w);
    for (const [i, c] of [...w.cars]
      .sort((a, b) => a.grid - b.grid)
      .entries()) {
      c.completedLaps = 10;
      c.totalSeconds = 1450;
      c.lapStartedAt = 1450;
      c.nextLapAt = 1510 + i * 0.1;
      c.setupFit = 100;
      c.mode = "CONSERVE";
    }
    w.flag = "SC";
    w.flagRemaining = 3;
    stepRace(w);
    expect(w.pitWindowOpened).toBe(false);
    expect(w.pitWindowDelay).toBeGreaterThan(0);
    stepRace(w);
    stepRace(w);
    expect(w.pitWindowOpened).toBe(true);
    expect(w.pitWindowEnd - w.clockSeconds).toBeCloseTo(600);
    runWeekend(w);
    expect(
      classify(w)
        .filter((c) => !c.retired && !c.dsq)
        .every((c) => c.mandatoryStops === 1 && c.activeDriver === 1),
    ).toBe(true);
  });
  it("preserves qualifying and track geometry across the F2 sprint and feature", () => {
    const sprint = advanceRace(prepared("F2"), "FINISH"),
      previous = sprint.career!.races[0].summary!;
    const feature = beginCareerWeekend(sprint, []),
      w = feature.career!.weekend!;
    expect(w.phase).toBe("GRID");
    expect(w.qualifying).toEqual(previous.qualifying);
    expect(
      w.cars
        .filter((c) => c.classId === "MAIN")
        .every(
          (c) =>
            c.grid === previous.qualifying.find((q) => q.id === c.id)!.position,
        ),
    ).toBe(true);
    expect(w.lengthKm).toBe(sprint.career!.weekend!.lengthKm);
    expect(() => takeRoundFinanceAction(feature, "OWNER_FUNDING")).toThrow(
      /Finish/,
    );
  }, 15000);

  it.each(SERIES.map((s) => s.id))(
    "starts %s without crediting a race, preserves a live save, and produces finite classified timing",
    (id) => {
      let flow = prepared(id);
      expect(flow.currentRound).toBe(1);
      expect(flow.career!.races).toHaveLength(0);
      expect(
        flow.career!.world!.series.find((s) => s.seriesId === id)!
          .completedRounds,
      ).toBe(0);
      valid(flow);
      flow = runPractice(flow);
      flow = runQualifying(flow);
      flow = advanceRace(flow, "LAP");
      valid(flow);
      const restored = decodeSave<RoundFlowState>(
        encodeSave("ROUND_FLOW", flow),
        "ROUND_FLOW",
      ).state;
      expect(restored).toEqual(flow);
      const next = advanceRace(restored, "LAP"),
        replay = advanceRace(flow, "LAP");
      expect(next).toEqual(replay);
      expect(
        next.career!.weekend!.cars.every(
          (c) =>
            Number.isFinite(c.totalSeconds) && Number.isFinite(c.nextLapAt),
        ),
      ).toBe(true);
      valid(next);
    },
  );
  it("reverses exactly twelve F3 qualifiers and locks setup after grid publication", () => {
    let flow = prepared("F3");
    flow = runQualifying(flow);
    const w = flow.career!.weekend!,
      ordered = [...w.cars].sort((a, b) => a.grid - b.grid);
    expect(ordered.slice(0, 12).map((c) => c.id)).toEqual(
      w.qualifying
        .slice(0, 12)
        .map((q) => q.id)
        .reverse(),
    );
    expect(() =>
      updateRaceSetup(flow, ordered[0].id, {
        downforce: 50,
        suspension: 50,
        cooling: 50,
      }),
    ).toThrow(/locked|Unknown/);
  });
  it("runs the F1 sprint and separate main qualifying before one championship/finance commit", () => {
    let flow = createNewCareer("F1");
    flow = advanceCareerFlow(flow, []);
    const salaries = flow.political.finance.transactions.filter(
      (t) => t.category === "SALARY",
    ).length;
    flow = beginCareerWeekend(flow, []);
    const w = flow.career!.weekend!;
    qualify(w);
    expect(w.session).toBe("SPRINT");
    expect(w.cars.every((c) => c.plan.pitLap <= w.totalLaps)).toBe(true);
    startRace(w);
    while (w.phase === "RACING") stepRace(w);
    expect(w.phase).toBe("QUALIFYING");
    expect(w.sprintFinished).toBe(true);
    expect(flow.career!.races).toHaveLength(1);
    expect(
      flow.career!.world!.series.find((s) => s.seriesId === "F1")!
        .completedRounds,
    ).toBe(1);
    valid(flow);
    const finished = advanceRace(flow, "FINISH");
    expect(finished.career!.races).toHaveLength(2);
    expect(
      finished.political.finance.transactions.filter(
        (t) => t.category === "SALARY",
      ).length,
    ).toBe(salaries * 2);
    expect(() => advanceRace(finished, "FINISH")).toThrow(/No active/);
    valid(finished);
  }, 20000);
  it("uses measured tyre/fuel consumption and permits independent driver instructions", () => {
    let flow = prepared();
    flow = runQualifying(flow);
    flow = advanceRace(flow, "LAP");
    const cars = flow.career!.weekend!.cars.filter((c) => c.ours);
    expect(() =>
      updateRacePlan(flow, cars[0].id, { ...cars[0].plan, fuelTarget: 0.6 }),
    ).toThrow(/refuelling/);
    flow = commandDriver(flow, cars[0].id, "ATTACK");
    flow = commandDriver(flow, cars[1].id, "CONSERVE");
    const next = advanceRace(flow, "LAP"),
      first = next.career!.weekend!.cars.find((c) => c.id === cars[0].id)!,
      second = next.career!.weekend!.cars.find((c) => c.id === cars[1].id)!;
    expect(first.mode).toBe("ATTACK");
    expect(second.mode).toBe("CONSERVE");
    expect(first.wear).toBeGreaterThan(cars[0].wear);
    expect(second.fuel).toBeLessThan(cars[1].fuel);
    expect(() => terminateEmployment(next, first.id)).toThrow(/Finish/);
    valid(next);
  });
  it("penalises a deliberately omitted F2 feature stop but allows a wet tyre exemption from dry-spec usage", () => {
    const flow = prepared("F2"),
      w = flow.career!.weekend!;
    w.eventIndex = 1;
    w.venue = "Feature test";
    qualify(w);
    const car = w.cars.find((c) => c.ours)!;
    car.plan.automatic = false;
    runWeekend(w);
    expect(car.dsq || car.retired).toBe(true);
    const rules = getRaceRules("F2", 1, "FEATURE");
    car.wetUsed = true;
    expect(tyreCompliance(car, rules)).toBe(true);
  });
  it("records legal team orders and applies an equality request after the race", () => {
    let flow = prepared();
    flow = runQualifying(flow);
    flow = advanceRace(flow, "LAP");
    const w = flow.career!.weekend!,
      cars = w.cars
        .filter((c) => c.ours)
        .sort((a, b) => a.nextLapAt - b.nextLapAt);
    for (const c of cars) {
      c.completedLaps = 1;
      c.totalSeconds = 100;
      c.lapStartedAt = 100;
      c.nextLapAt = 200;
      c.position = 1;
    }
    cars[1].nextLapAt = 201;
    w.flag = "GREEN";
    w.flagRemaining = 0;
    flow = issueTeamOrder(flow, cars[0].id, cars[1].id);
    expect(flow.career!.weekend!.teamOrders).toHaveLength(1);
    flow = advanceRace(flow, "FINISH");
    expect(
      flow.career!.requests.some((r) => r.id.startsWith("race_order_")),
    ).toBe(true);
    valid(flow);
  }, 15000);
  it("charges race damage once, updates contract performance and supports deterministic finish replay", () => {
    let flow = prepared("GT4");
    flow = runQualifying(flow);
    flow = advanceRace(flow, "LAP");
    const id = flow.career!.weekend!.cars.find((c) => c.ours)!.id;
    flow = retireRaceCar(flow, id);
    const before = getCashBalance(flow.political),
      restore = decodeSave<RoundFlowState>(
        encodeSave("ROUND_FLOW", flow),
        "ROUND_FLOW",
      ).state;
    const finish = advanceRace(flow, "FINISH");
    expect(finish).toEqual(advanceRace(restore, "FINISH"));
    expect(getCashBalance(finish.political)).toBeLessThan(before);
    expect(
      finish.political.finance.transactions.filter(
        (t) => t.id === `race_repair_${id}_r1`,
      ),
    ).toHaveLength(1);
    expect(
      finish.career!.races[0].summary!.entries.find((e) => e.id === id)!
        .repairCost,
    ).toBeGreaterThan(0);
    valid(finish);
  }, 15000);
  it("runs GT crew changes and shares driver points while counting only the best team car", () => {
    const flow = prepared("GT4"),
      w = flow.career!.weekend!;
    runWeekend(w);
    const summary = summarize(w, 10),
      cars = classify(w).filter((c) => !c.retired && !c.dsq);
    expect(cars.length).toBeGreaterThan(0);
    expect(
      cars.every((c) => c.mandatoryStops >= 1 && c.crew[1].drivingSeconds > 0),
    ).toBe(true);
    for (const team of summary.teamPoints)
      expect(team.points).toBe(
        Math.max(
          ...classify(w)
            .filter((c) => c.team === team.team)
            .map((c) => c.finishPoints + c.bonusPoints),
        ),
      );
  });
  it("uses timed rally stages and service parks without circuit overtaking or box calls", () => {
    let flow = prepared("RALLY");
    flow = runQualifying(flow);
    flow = advanceRace(flow, "LAP");
    const w = flow.career!.weekend!,
      car = w.cars.find((c) => c.ours)!;
    expect(() => callPit(flow, car.id, car.compound, true, false)).toThrow(
      /service parks/,
    );
    runWeekend(w);
    expect(w.lap).toBe(18);
    expect(w.events.some((e) => e.kind === "SERVICE")).toBe(true);
    expect(w.events.some((e) => e.kind === "PASS")).toBe(false);
    expect(classify(w).some((c) => c.bonusPoints > 0)).toBe(true);
  });
  it("replaces a contracted crew member from the persistent pool and preserves both employers", () => {
    let flow = createNewCareer("GT4"),
      team = flow.career!.world!.teams.find(
        (t) => t.id === flow.career!.world!.playerTeamId,
      )!,
      crew = team.raceCrews![0],
      old = crew.members[0];
    flow = terminateEmployment(flow, old);
    const candidate = flow.career!.candidates.find(
      (c) =>
        c.status === "AVAILABLE" && c.seat === "DRIVER_ONE" && c.salary < 0.15,
    )!;
    expect(candidate).toBeDefined();
    flow = recruitRaceCrew(flow, candidate.id, crew.leadId);
    const target = flow.career!.world!.teams.find((t) => t.id === team.id)!;
    expect(target.raceCrews![0].members).toContain(candidate.character.id);
    expect(flow.political.contracts.at(-1)?.status).toBe("ACTIVE");
    valid(flow);
    expect(() =>
      signCandidate(
        beginCareerWeekend(flow, []),
        candidate.id,
        "DRIVER_ONE",
        1,
        12,
      ),
    ).toThrow(/Finish/);
  });
  it("keeps a dormant player crew valid when its former lead joins a rival and maps it to a new hire", () => {
    let flow = createNewCareer("GT4");
    const world = flow.career!.world!,
      team = world.teams.find((t) => t.id === world.playerTeamId)!,
      old = team.drivers[0],
      members = [...team.raceCrews![0].members];
    flow = terminateEmployment(flow, old);
    transferWorldPerson(
      flow.career!.world!,
      old,
      world.teams.find((t) => t.seriesId === "GT4" && t.id !== team.id)!.id,
    );
    expect(() => validateWorld(flow.career!.world!)).not.toThrow();
    const candidate = flow.career!.candidates.find(
      (c) =>
        c.status === "AVAILABLE" && c.seat === "DRIVER_ONE" && c.salary < 0.15,
    )!;
    flow = signCandidate(
      flow,
      candidate.id,
      "DRIVER_ONE",
      candidate.salary * 1.2,
      12,
    );
    const mapped = flow
      .career!.world!.teams.find((t) => t.id === team.id)!
      .raceCrews!.find((c) => c.leadId === candidate.character.id)!;
    expect(mapped.members).toEqual(members);
    valid(flow);
  });
  it("rejects tampered live car references and future race clocks", () => {
    let flow = prepared();
    const w = flow.career!.weekend!;
    w.cars[0].activeDriver = 99;
    expect(() =>
      decodeSave(encodeSave("ROUND_FLOW", flow), "ROUND_FLOW"),
    ).toThrow(/entry/);
    flow = prepared();
    flow.career!.world!.series.find(
      (s) => s.seriesId === "F1",
    )!.completedRounds = 1;
    expect(() =>
      decodeSave(encodeSave("ROUND_FLOW", flow), "ROUND_FLOW"),
    ).toThrow(/clock/);
  });
});
