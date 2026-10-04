import { describe, expect, it } from "vitest";
import { createNewCareer } from "../../src/game/world/start";
import { getSeries, SERIES } from "../../src/game/world/series";
import { playerTeam, validateWorld, transferWorldPerson } from "../../src/game/world/world";
import { beginCareerWeekend, advanceCareerFlow } from "../../src/game/career/career";
import { createWeekend, qualify, runWeekend, classify, summarize } from "../../src/game/racing/engine";
import { advanceRace } from "../../src/game/racing/actions";
import { getRaceRules } from "../../src/game/racing/rules";
import { encodeSave, decodeSave } from "../../src/game/save/save-game";
import type { RoundFlowState } from "../../src/game/season/round-flow";
import { validateCareer } from "../../src/game/career/state";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { RacePanel } from "../../src/components/political/RacePanel";
import { MotorsportGame } from "../../src/components/political/MotorsportGame";

function prepared(team = "team_wec_0") {
  const flow = beginCareerWeekend(createNewCareer("WEC", team), []);
  const w = flow.career!.weekend!;
  w.rain = 0; w.wetness = 0; w.weatherChanges = [];
  for (const c of w.cars) { c.reliability = 100; c.discipline = 100; c.mode = "CONSERVE"; }
  return flow;
}
function legacy(source: RoundFlowState) {
  const flow = structuredClone(source), world = flow.career!.world!;
  const removed = new Set(world.teams.filter((t) => t.seriesId === "WEC" && Number(t.id.split("_").at(-1)) >= 8).map((t) => t.id));
  world.people = world.people.filter((p) => !p.teamId || !removed.has(p.teamId));
  world.teams = world.teams.filter((t) => !removed.has(t.id));
  for (const t of world.teams) delete t.classId;
  for (const p of world.people) delete p.rating;
  const ids = new Set(world.people.map((p) => p.id));
  const table = world.series.find((s) => s.seriesId === "WEC")!;
  table.drivers = table.drivers.filter((d) => ids.has(d.personId));
  table.teams = table.teams.filter((t) => !removed.has(t.teamId));
  delete table.entries;
  for (const d of table.drivers) delete d.classId;
  for (const t of table.teams) delete t.classId;
  table.lastResults = table.lastResults.filter((r) => ids.has(r.personId));
  flow.career!.standings = flow.career!.standings.filter((s) => ids.has(s.id));
  for (const s of flow.career!.standings) delete s.classId;
  const w = flow.career!.weekend;
  if (w) {
    w.cars = w.cars.filter((c) => ids.has(c.id));
    w.qualifying = w.qualifying.filter((q) => ids.has(q.id));
    for (const c of w.cars) { c.classId = "MAIN"; delete c.entryId; for (const d of c.crew) delete d.rating; }
  }
  return JSON.stringify({ version: 10, kind: "ROUND_FLOW", savedAt: "2026-10-04", state: flow }).replaceAll('"WEC"', '"LMP1"').replaceAll("team_wec_", "team_lmp1_");
}

describe("current WEC replacement", () => {
  it("offers WEC with two selectable classes and removes LMP1 from new careers", () => {
    expect(SERIES.some((s) => (s.id as string) === "LMP1")).toBe(false);
    const f = createNewCareer("WEC", "team_wec_9"), world = f.career!.world!;
    expect(playerTeam(world).classId).toBe("LMGT3");
    expect(world.teams.filter((t) => t.seriesId === "WEC" && t.classId === "HYPERCAR")).toHaveLength(9);
    expect(world.teams.filter((t) => t.seriesId === "WEC" && t.classId === "LMGT3")).toHaveLength(9);
    expect(() => validateWorld(world)).not.toThrow();
    const html = renderToStaticMarkup(createElement(MotorsportGame));
    expect(html).toContain("FIA World Endurance Championship"); expect(html).not.toContain("LMP1");
  });
  it("uses the revised 2026 calendar and modern top-ten points without historic half-points", () => {
    const cfg = getSeries("WEC");
    expect(cfg.calendar.map((r) => r.name)).toEqual(["6 Hours of Imola", "6 Hours of Spa-Francorchamps", "24 Hours of Le Mans", "6 Hours of São Paulo", "Lone Star Le Mans · 6 Hours", "6 Hours of Fuji", "6 Hours of Barcelona", "6 Hours of Monza"]);
    expect(getRaceRules("WEC", 2, "ENDURANCE").minutes).toBe(1440);
    expect(getRaceRules("WEC", 10, "ENDURANCE").minutes).toBe(1440);
    expect(getRaceRules("WEC", 7, "ENDURANCE").minutes).toBe(360);
    expect(getRaceRules("WEC", 0, "ENDURANCE").minDriverMinutes).toBe(45);
  });
  it("runs Hyperpole independently for both classes and gives each a pole point", () => {
    const f = prepared(), w = f.career!.weekend!; qualify(w);
    for (const classId of ["HYPERCAR", "LMGT3"] as const) {
      const qualifiers = w.qualifying.filter((q) => w.cars.find((c) => c.id === q.id)!.classId === classId);
      expect(qualifiers.slice(0, 10).every((q) => q.segments.length === 2)).toBe(true);
      expect(qualifiers.slice(10).every((q) => q.segments.length === 0)).toBe(true);
    }
    runWeekend(w);
    const rows = classify(w);
    for (const classId of ["HYPERCAR", "LMGT3"] as const) {
      const pole = w.qualifying.find((q) => rows.find((c) => c.id === q.id)!.classId === classId)!;
      expect(rows.find((c) => c.id === pole.id)!.bonusPoints).toBe(1);
      const classRows = rows.filter((c) => c.classId === classId && !c.retired && !c.dsq);
      expect(classRows.length).toBeGreaterThan(10);
      expect(classRows[0].finishPoints).toBe(25);
      expect(classRows[10].finishPoints).toBe(0);
    }
    expect(summarize(w, 10).entries.every((e) => e.classPosition! >= 1)).toBe(true);
  });
  it("completes Le Mans with eligible LMGT3 amateurs and double class points", () => {
    const f = prepared("team_wec_9");
    f.currentRound = 3;
    const w = createWeekend(f);
    w.rain = 0; w.wetness = 0; w.weatherChanges = [];
    for (const car of w.cars) {
      car.reliability = 100; car.discipline = 100; car.mode = "CONSERVE";
    }
    runWeekend(w);
    const finishers = classify(w).filter((c) => c.classId === "LMGT3" && !c.retired && !c.dsq);
    expect(finishers.length).toBeGreaterThan(10);
    expect(finishers[0].finishPoints).toBe(50);
    for (const car of finishers) {
      expect(car.crew.filter((d) => d.rating === "BRONZE" || d.rating === "SILVER").every((d) => d.drivingSeconds >= 6 * 3600)).toBe(true);
      expect(summarize(w, 0).entries.find((e) => e.id === car.id)!.crew.every((d) => d.eligible)).toBe(true);
    }
  }, 20000);
  it("keeps a car-entry identity when its lead driver changes", () => {
    const f = prepared("team_wec_9"), w = f.career!.world!;
    const team = w.teams.find((t) => t.id === "team_wec_9")!;
    const before = f.career!.weekend!.cars.find((c) => c.id === team.drivers[0])!;
    const survivingLead = team.drivers[1];
    transferWorldPerson(w, team.drivers[0], null);
    expect(createWeekend(f).cars.find((c) => c.id === survivingLead)!.entryId).toBe(`${team.id}_car_2`);
    const replacement = w.people.find((p) => p.role === "DRIVER" && !p.teamId && p.seriesId === "WEC" && p.rating === "BRONZE")!;
    transferWorldPerson(w, replacement.id, team.id);
    const after = createWeekend(f).cars.find((c) => c.id === replacement.id)!;
    expect(after.entryId).toBe(before.entryId);
    expect(after.classId).toBe("LMGT3");
  });
  it("starts with legal rated crews and disqualifies an illegal Hypercar Bronze lineup", () => {
    const w = prepared().career!.weekend!;
    for (const c of w.cars) {
      if (c.classId === "HYPERCAR") expect(c.crew.every((d) => d.rating !== "BRONZE")).toBe(true);
      else { expect(c.crew.some((d) => d.rating === "BRONZE")).toBe(true); expect(c.crew.filter((d) => ["BRONZE", "SILVER"].includes(d.rating!)).length).toBeGreaterThanOrEqual(2); }
    }
    const car = w.cars.find((c) => c.classId === "HYPERCAR")!; car.crew[0].rating = "BRONZE";
    runWeekend(w); expect(car.dsq).toBe(true); expect(car.retirementReason).toMatch(/rating/);
  });
  it("commits LMGT3 class points to persistent entry standings and displays separate trophies", () => {
    const f = advanceRace(prepared("team_wec_9"), "FINISH"), world = f.career!.world!;
    const table = world.series.find((s) => s.seriesId === "WEC")!;
    expect(table.entries!.some((e) => e.classId === "LMGT3" && e.points >= 25)).toBe(true);
    expect(f.career!.races[0].results.filter((r) => r.classId === "LMGT3")).toHaveLength(18);
    const html = renderToStaticMarkup(createElement(RacePanel, { flow: f, onAction: () => {} }));
    expect(html).toContain("Hypercar manufacturers championship"); expect(html).toContain("LMGT3 teams trophy");
    expect(decodeSave<RoundFlowState>(encodeSave("ROUND_FLOW", f), "ROUND_FLOW").state).toEqual(f);
  }, 20000);
  it.each(["F1", "WEC"] as const)("migrates an old %s world without resetting contracts, money or progress", (series) => {
    const source = createNewCareer(series), raw = legacy(source);
    const restored = decodeSave<RoundFlowState>(raw, "ROUND_FLOW");
    expect(restored.version).toBe(11);
    expect(restored.state.political).toEqual(source.political);
    expect(restored.state.currentRound).toBe(0);
    expect(restored.state.career!.world!.teams.filter((t) => t.seriesId === "WEC")).toHaveLength(18);
    expect(() => validateCareer(restored.state.career, restored.state.political, 0)).not.toThrow();
    expect(() => advanceCareerFlow(restored.state, [])).not.toThrow();
  }, 20000);
  it("resumes an old LMP1 live event at the original clock without charging its crew again", () => {
    const f = prepared(), raw = legacy(f);
    const restored = decodeSave<RoundFlowState>(raw, "ROUND_FLOW").state;
    expect(restored.career!.weekend!.durationSeconds).toBe(f.career!.weekend!.durationSeconds);
    expect(restored.political.finance.transactions).toEqual(f.political.finance.transactions);
    expect(() => validateCareer(restored.career, restored.political, restored.currentRound)).not.toThrow();
    const finished = advanceRace(restored, "FINISH");
    expect(finished.career!.races).toHaveLength(1);
    expect(decodeSave<RoundFlowState>(encodeSave("ROUND_FLOW", finished), "ROUND_FLOW").state).toEqual(finished);
  }, 20000);
});
