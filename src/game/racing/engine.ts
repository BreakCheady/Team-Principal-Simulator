import type { RoundFlowState } from "@/game/season/round-flow";
import { getSeries } from "@/game/world/series";
import { playerTeam } from "@/game/world/world";
import {
  getRaceRules,
  isSprintWeekend,
  meetingIndex,
  tyreLife,
  tyrePenalty,
  type RaceRules,
} from "./rules";
import {
  type Compound,
  type RaceCar,
  type RaceWeekend,
  type RaceSummary,
  type RaceEvent,
  SetupSchema,
  PlanSchema,
} from "./schema";

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));
const round = (n: number) => Math.round(n * 1000) / 1000;
export function raceRandom(w: { seed: number }) {
  let x = w.seed || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  w.seed = x >>> 0 || 1;
  return w.seed / 4294967296;
}
const ruleCache = new WeakMap<
  RaceWeekend,
  { session: RaceWeekend["session"]; rules: RaceRules }
>();
export function raceRules(w: RaceWeekend) {
  const cached = ruleCache.get(w);
  if (cached?.session === w.session) return cached.rules;
  const rules = getRaceRules(
    w.seriesId,
    w.eventIndex,
    getSeries(w.seriesId).calendar[w.eventIndex % getSeries(w.seriesId).rounds]
      ?.kind ?? "FEATURE",
    w.session,
  );
  ruleCache.set(w, { session: w.session, rules });
  return rules;
}
export function logRace(
  w: RaceWeekend,
  kind: RaceEvent["kind"],
  text: string,
  carId: string | null = null,
  seconds?: number,
) {
  w.events.push({
    lap: w.lap,
    kind,
    carId,
    text,
    ...(seconds !== undefined ? { seconds: round(seconds) } : {}),
  });
  if (w.events.length > 240) w.events.shift();
}
type WeekendSource = {
  currentRound: number;
  career?: Pick<
    NonNullable<RoundFlowState["career"]>,
    | "world"
    | "seed"
    | "season"
    | "seasonStart"
    | "strategy"
    | "car"
    | "seats"
    | "standings"
  > & { races: Array<{ summary?: Pick<RaceSummary, "qualifying"> }> };
  political: Pick<RoundFlowState["political"], "characters" | "relationships">;
};
export function createWeekend(flow: WeekendSource): RaceWeekend {
  const c = flow.career!,
    world = c.world,
    seriesId = world?.playerSeriesId ?? "F1",
    cfg = getSeries(seriesId),
    index = flow.currentRound - c.seasonStart,
    event = cfg.calendar[index % cfg.rounds],
    rules = getRaceRules(seriesId, index, event?.kind ?? "FEATURE"),
    ourTeam = world ? playerTeam(world).name : "Vanguard";
  const rng = { seed: (c.seed ^ (flow.currentRound * 2654435761)) >>> 0 || 1 };
  raceRandom(rng);
  c.seed = rng.seed;
  const trackSeed = [
    ...(event?.name.split(" · ")[0] ?? "Legacy Circuit"),
  ].reduce(
    (seed, ch) => (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0,
    2166136261,
  );
  const geometry = { seed: trackSeed || 1 };
  const length =
    event?.kind === "OVAL"
      ? index === 6
        ? 4.023
        : 2.2
      : 3.2 + raceRandom(geometry) * 3.6;
  const baseLap =
    seriesId === "RALLY"
      ? 420 + raceRandom(geometry) * 240
      : event?.kind === "OVAL"
        ? length * 14
        : length *
          (seriesId === "F1"
            ? 17
            : seriesId === "LMP1"
              ? 18
              : seriesId === "GT4"
                ? 27
                : seriesId === "GT3"
                  ? 23
                  : 20);
  const duration = rules.minutes * 60,
    totalLaps =
      rules.format === "RALLY"
        ? 18
        : Math.ceil(
            rules.distanceKm ? rules.distanceKm / length : duration / baseLap,
          ) + (!rules.distanceKm ? 1 : 0);
  const weather = { seed: rng.seed ^ 0x51b328f || 1 },
    changes: Array<{ lap: number; rain: number }> = [];
  const initialRain =
    event?.kind === "OVAL"
      ? 0
      : raceRandom(weather) < 0.22
        ? 35 + raceRandom(weather) * 50
        : 0;
  for (
    let lap = Math.max(3, Math.floor(totalLaps / 5));
    lap < totalLaps;
    lap += Math.max(3, Math.floor(totalLaps / 5))
  )
    changes.push({
      lap,
      rain:
        event?.kind === "OVAL"
          ? 0
          : raceRandom(weather) < 0.35
            ? 30 + raceRandom(weather) * 65
            : 0,
    });
  const ideal = {
    downforce:
      event?.kind === "OVAL" ? 15 : 25 + Math.floor(raceRandom(geometry) * 65),
    suspension:
      seriesId === "RALLY" ? 70 : 25 + Math.floor(raceRandom(geometry) * 50),
    cooling: 30 + Math.floor(raceRandom(geometry) * 45),
  };
  const staffSkill = (team: string) => {
    if (team === ourTeam) {
      const id = c.seats.find((s) => s.seat === "ENGINEERING")?.characterId;
      return (
        flow.political.characters.find((p) => p.id === id)?.power
          .sportingLeverage ?? 25
      );
    }
    const t = world?.teams.find((t) => t.name === team);
    return t
      ? (world!.people.find(
          (p) => t.staff.includes(p.id) && p.role === "RACE_ENGINEER",
        )?.skill ?? 60)
      : 65;
  };
  const leadIds = world
    ? world.teams
        .filter((t) => t.seriesId === seriesId)
        .flatMap((t) => t.drivers)
    : c.standings
        .filter(
          (s) =>
            s.team !== "Departed" &&
            (s.team !== ourTeam || c.seats.some((x) => x.characterId === s.id)),
        )
        .map((s) => s.id);
  const entries: Array<{ id: string; classId: "MAIN" | "TRAFFIC" }> =
    leadIds.map((id) => ({ id, classId: "MAIN" }));
  if (seriesId === "LMP1" && world)
    for (const id of world.teams
      .filter((t) => t.seriesId === "GT3")
      .slice(0, 4)
      .flatMap((t) => t.drivers))
      entries.push({ id, classId: "TRAFFIC" });
  const cars: RaceCar[] = entries.map(({ id, classId }, i) => {
    const p = world?.people.find((p) => p.id === id),
      standing = c.standings.find((s) => s.id === id),
      actor = flow.political.characters.find((p) => p.id === id),
      team = world?.teams.find((t) => t.id === p?.teamId),
      teamName = team?.name ?? standing?.team ?? ourTeam,
      ours = teamName === ourTeam && classId === "MAIN",
      skill = p?.skill ?? standing?.skill ?? 70;
    const assigned = team?.raceCrews?.find((cr) => cr.leadId === id),
      crewIds = [id, ...(assigned?.members ?? [])].slice(0, rules.crewSize);
    const crew = crewIds.map((id) => {
      const d = world?.people.find((p) => p.id === id);
      return {
        id,
        name: d?.name ?? standing?.name ?? id,
        skill: d?.skill ?? skill,
        consistency: d?.consistency ?? 75,
        drivingSeconds: 0,
        fatigue: 0,
      };
    });
    const compound = rules.compounds.includes("MEDIUM")
      ? "MEDIUM"
      : rules.compounds[0];
    const setup = ours
      ? { downforce: 50, suspension: 50, cooling: 50 }
      : {
          downforce: clamp(
            ideal.downforce + Math.round((raceRandom(rng) - 0.5) * 25),
          ),
          suspension: clamp(
            ideal.suspension + Math.round((raceRandom(rng) - 0.5) * 25),
          ),
          cooling: clamp(
            ideal.cooling + Math.round((raceRandom(rng) - 0.5) * 25),
          ),
        };
    const principal = flow.political.characters.find(
        (p) => p.role === "TEAM_PRINCIPAL",
      ),
      trust =
        flow.political.relationships.find(
          (r) => r.fromCharacterId === id && r.toCharacterId === principal?.id,
        )?.trust ?? 65;
    return {
      id,
      name: p?.name ?? standing?.name ?? id,
      team: teamName,
      classId,
      ours,
      crew,
      activeDriver: 0,
      coDriverSkill:
        world?.people.find((p) => p.id === assigned?.coDriverId)?.skill ??
        (seriesId === "RALLY" ? 0 : 65),
      pace:
        classId === "TRAFFIC"
          ? 45
          : rules.specCar
            ? 80
            : ours
              ? c.car.pace
              : (team?.pace ?? 78),
      reliability: ours ? c.car.reliability : (team?.reliability ?? 88),
      skill,
      consistency: p?.consistency ?? 75,
      wetSkill: p?.terrainSkill ?? 65,
      aggression: actor?.personality.riskTolerance ?? p?.riskTolerance ?? 55,
      discipline: actor?.personality.ruleRespect ?? 75,
      trust,
      crewSkill: staffSkill(teamName),
      setup,
      setupFit: 50,
      mode: ours ? c.strategy : raceRandom(rng) < 0.2 ? "CONSERVE" : "BALANCED",
      plan: {
        startCompound: compound,
        pitLap: Math.max(
          6,
          Math.round(totalLaps * (0.35 + raceRandom(rng) * 0.25)),
        ),
        nextCompound: rules.compounds.includes("HARD")
          ? "HARD"
          : rules.compounds.includes("SOFT")
            ? "SOFT"
            : rules.compounds[0],
        fuelTarget: 1,
        automatic: true,
        repair: true,
        changeDriver: true,
      },
      compound,
      tyreAge: 0,
      wear: 0,
      fuel: 0,
      damage: 0,
      confidence: 65 + (actor?.dynamic.momentum ?? 0) * 0.5,
      totalSeconds: 0,
      nextLapAt: 0,
      lapStartedAt: 0,
      pitRelease: 0,
      stintSeconds: 0,
      pitRequested: false,
      finished: false,
      warnings: 0,
      lastLap: 0,
      bestLap: 0,
      completedLaps: 0,
      grid: i + 1,
      position: i + 1,
      stops: 0,
      mandatoryStops: 0,
      tyreSets: [],
      wetUsed: false,
      retired: false,
      dsq: false,
      retirementReason: null,
      penaltySeconds: 0,
      lapsLed: 0,
      pitLoss: 0,
      battleLoss: 0,
      mistakeLoss: 0,
      serviceLoss: 0,
      sundaySeconds: 0,
      powerStageSeconds: 0,
      finishPoints: 0,
      bonusPoints: 0,
      raceWins: 0,
      racePodiums: 0,
    };
  });
  const old = c.races.at(-1)?.summary;
  const meeting = meetingIndex(seriesId, index),
    reuse =
      (seriesId === "F2" || seriesId === "F3"
        ? index % 2 > 0
        : seriesId === "F4"
          ? index % 3 > 0
          : false) && !!old;
  const w: RaceWeekend = {
    round: flow.currentRound,
    season: c.season,
    eventIndex: index,
    meeting,
    seriesId,
    venue: event?.name ?? `Grand Prix ${index + 1}`,
    ruleId: rules.id,
    seed: rng.seed,
    phase: reuse ? "GRID" : "PRACTICE",
    session: seriesId === "RALLY" ? "RALLY" : "RACE",
    sprintPending: isSprintWeekend(seriesId, index),
    sprintFinished: false,
    lap: 0,
    totalLaps,
    durationSeconds: duration,
    baseLap: round(baseLap),
    lengthKm: round(length),
    overtaking: event?.kind === "OVAL" ? 90 : 20 + raceRandom(rng) * 65,
    abrasion: 25 + raceRandom(rng) * 55,
    idealSetup: ideal,
    clockSeconds: 0,
    wetness: initialRain * 0.7,
    rain: initialRain,
    forecast: changes.map((ch) => ({
      lap: ch.lap,
      chance: clamp(ch.rain ? 50 + raceRandom(rng) * 40 : raceRandom(rng) * 35),
    })),
    weatherSeed: weather.seed,
    weatherChanges: changes,
    flag: "GREEN",
    flagRemaining: 0,
    pitClosed: false,
    redFlags: 0,
    pitWindowOpened: false,
    pitWindowDelay: 0,
    pitWindowEnd: rules.pitWindow?.[1] ?? 0,
    practiceRuns: reuse ? 2 : 0,
    knowledge: reuse ? 70 : 0,
    practiceNotes: [],
    qualifying: reuse
      ? structuredClone(old!.qualifying).filter((q) =>
          cars.some((c) => c.id === q.id),
        )
      : [],
    cars,
    events: [],
    snapshots: [],
    decision: null,
    teamOrders: [],
    committed: false,
  };
  if (reuse) {
    for (const car of cars.filter((c) => c.classId === "MAIN"))
      if (!w.qualifying.some((q) => q.id === car.id))
        w.qualifying.push({
          id: car.id,
          time: baseLap * 1.2,
          secondTime: baseLap * 1.2,
          position: cars.length + 1,
          segments: [],
        });
    w.qualifying.sort(
      (a, b) => a.position - b.position || a.id.localeCompare(b.id),
    );
    w.qualifying.forEach((q, i) => (q.position = i + 1));
    for (const car of cars) {
      const q = w.qualifying.find((q) => q.id === car.id);
      car.grid = q?.position ?? cars.length;
      car.setup = { ...ideal };
      car.setupFit = 90;
    }
    if (seriesId === "F4") setF4Grid(w);
  }
  return w;
}
export function setSetup(w: RaceWeekend, id: string, setup: RaceCar["setup"]) {
  if (!["PRACTICE", "QUALIFYING"].includes(w.phase))
    throw new Error("Setup is locked after qualifying (parc fermé).");
  const car = w.cars.find((c) => c.id === id && c.ours);
  if (!car) throw new Error("Unknown player car.");
  car.setup = SetupSchema.parse(setup);
}
export function setPlan(w: RaceWeekend, id: string, plan: RaceCar["plan"]) {
  const car = w.cars.find((c) => c.id === id && c.ours);
  if (!car) throw new Error("Unknown player car.");
  if (w.phase === "COMPLETE") throw new Error("Race already finished.");
  const parsed = PlanSchema.parse(plan),
    rules = raceRules(w);
  if (
    !rules.compounds.includes(parsed.startCompound) ||
    !rules.compounds.includes(parsed.nextCompound)
  )
    throw new Error("Tyre compound is not legal in this series.");
  if (parsed.pitLap > w.totalLaps)
    throw new Error("Pit lap is outside the race.");
  if (w.phase === "RACING" && parsed.startCompound !== car.plan.startCompound)
    throw new Error("Starting tyres are already fitted.");
  if (
    w.phase === "RACING" &&
    !rules.refuel &&
    parsed.fuelTarget !== car.plan.fuelTarget
  )
    throw new Error(
      "Race refuelling is forbidden; the starting fuel load is fixed.",
    );
  car.plan = parsed;
}
function setupFit(w: RaceWeekend, car: RaceCar) {
  return clamp(
    100 -
      (Math.abs(car.setup.downforce - w.idealSetup.downforce) * 0.55 +
        Math.abs(car.setup.suspension - w.idealSetup.suspension) * 0.3 +
        Math.abs(car.setup.cooling - w.idealSetup.cooling) * 0.15),
  );
}
export function practice(w: RaceWeekend) {
  if (w.phase !== "PRACTICE" || w.practiceRuns >= 3)
    throw new Error("Practice session is closed.");
  w.practiceRuns++;
  const engineers = w.cars.filter((c) => c.ours);
  w.knowledge = clamp(
    w.knowledge +
      15 +
      (engineers.reduce((sum, c) => sum + c.crewSkill, 0) /
        Math.max(1, engineers.length)) *
        0.15,
  );
  for (const car of w.cars) {
    car.setupFit = setupFit(w, car);
    if (!car.ours) continue;
    const direction = (v: number, target: number) =>
      Math.abs(v - target) < 10
        ? "balanced"
        : v < target
          ? "increase"
          : "reduce";
    w.practiceNotes.push(
      `${car.name}: ${direction(car.setup.downforce, w.idealSetup.downforce)} downforce; ${direction(car.setup.suspension, w.idealSetup.suspension)} suspension; ${direction(car.setup.cooling, w.idealSetup.cooling)} cooling. Estimated ${car.plan.startCompound} life ${Math.round(tyreLife(car.plan.startCompound, w.abrasion) * (0.9 + raceRandom(w) * 0.2))} laps. Setup confidence ${Math.round(w.knowledge)}%.`,
    );
  }
  if (w.practiceRuns === 3) w.phase = "QUALIFYING";
}
function setF4Grid(w: RaceWeekend) {
  const slot = w.eventIndex % 3,
    lap = (q: RaceWeekend["qualifying"][number]) =>
      slot === 0
        ? q.time
        : slot === 1
          ? q.secondTime
          : (q.segments[2] ?? Math.max(q.time, q.secondTime));
  const rows = [...w.qualifying].sort(
    (a, b) => lap(a) - lap(b) || a.id.localeCompare(b.id),
  );
  rows.forEach((q, i) => {
    w.cars.find((c) => c.id === q.id)!.grid = i + 1;
  });
}
export function qualify(w: RaceWeekend) {
  if (!["PRACTICE", "QUALIFYING"].includes(w.phase))
    throw new Error("Qualifying is closed.");
  if (!w.practiceRuns) practice(w);
  const rules = raceRules(w),
    main = w.cars.filter((c) => c.classId === "MAIN");
  for (const car of w.cars) car.setupFit = setupFit(w, car);
  const time = (c: RaceCar, driver = 0) =>
    round(
      w.baseLap +
        (100 - c.pace) * 0.025 +
        (100 - c.crew[driver].skill) * 0.035 +
        (100 - c.setupFit) * 0.025 +
        (100 - c.consistency) * raceRandom(w) * 0.013 +
        raceRandom(w) * 0.7 +
        tyrePenalty(
          rules.compounds.includes("SOFT") ? "SOFT" : rules.compounds[0],
          w.wetness,
          0,
        ),
    );
  let rows = main
    .map((c) => ({
      id: c.id,
      time: time(c),
      secondTime: time(c),
      position: 1,
      segments: [] as number[],
    }))
    .sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
  if (rules.qualifying === "CREW") {
    for (const q of rows) {
      const car = main.find((c) => c.id === q.id)!;
      q.segments = car.crew
        .slice(0, w.seriesId === "LMP1" ? 2 : 3)
        .map((_, i) => time(car, i));
      q.time = q.segments.reduce((sum, t) => sum + t, 0) / q.segments.length;
    }
    rows.sort((a, b) => a.time - b.time);
  } else if (w.seriesId === "GT4") {
    for (const q of rows) {
      const car = main.find((c) => c.id === q.id)!;
      q.time = time(car, Math.min(w.eventIndex % 2, car.crew.length - 1));
    }
    rows.sort((a, b) => a.time - b.time);
  } else if (rules.qualifying === "Q123" || rules.qualifying === "FAST6") {
    let active =
      rules.qualifying === "Q123" ? main : main.filter((_, i) => i % 2 === 0);
    if (rules.qualifying === "FAST6") {
      const groups = [
        main.filter((_, i) => i % 2 === 0),
        main.filter((_, i) => i % 2 === 1),
      ];
      active = groups.flatMap((g) =>
        [...g]
          .sort(
            (a, b) =>
              rows.find((q) => q.id === a.id)!.time -
              rows.find((q) => q.id === b.id)!.time,
          )
          .slice(0, 6),
      );
    } else
      active = [...main]
        .sort(
          (a, b) =>
            rows.find((q) => q.id === a.id)!.time -
            rows.find((q) => q.id === b.id)!.time,
        )
        .slice(0, Math.max(10, main.length - 6));
    for (const n of [rules.qualifying === "Q123" ? 10 : 6, 0]) {
      const segment = active
        .map((c) => ({ id: c.id, time: time(c) }))
        .sort((a, b) => a.time - b.time);
      for (const q of segment) {
        const row = rows.find((r) => r.id === q.id)!;
        row.segments.push(q.time);
        row.time = q.time;
      }
      const ids = new Set(segment.map((q) => q.id));
      rows = [
        ...segment.map((q) => rows.find((r) => r.id === q.id)!),
        ...rows.filter((q) => !ids.has(q.id)),
      ];
      if (n)
        active = segment
          .slice(0, n)
          .map((q) => main.find((c) => c.id === q.id)!);
    }
  } else if (rules.qualifying === "OVAL") {
    rows.forEach((q) => {
      q.segments = [q.time, q.secondTime];
      q.time = (q.time + q.secondTime) / 2;
    });
    rows.sort((a, b) => a.time - b.time);
  }
  if (rules.qualifying === "SHAKEDOWN")
    rows = main.map((c) => rows.find((q) => q.id === c.id)!); // road order is seeded by championship entry order, not shakedown speed
  if (w.seriesId === "F4")
    for (const q of rows) {
      const car = main.find((c) => c.id === q.id)!;
      q.segments = [
        q.time,
        q.secondTime,
        Math.min(
          q.time + 0.05 + raceRandom(w) * 0.2,
          q.secondTime + 0.05 + raceRandom(w) * 0.2,
        ),
      ];
    }
  rows.forEach((q, i) => (q.position = i + 1));
  w.qualifying = rows;
  const reversed = [...rows.slice(0, rules.reverse)]
    .reverse()
    .concat(rows.slice(rules.reverse));
  for (const car of main)
    car.grid =
      (rules.reverse ? reversed : rows).findIndex((q) => q.id === car.id) + 1;
  if (w.seriesId === "F4") setF4Grid(w);
  if (w.sprintPending && !w.sprintFinished) {
    w.session = "SPRINT";
    const sr = getRaceRules(w.seriesId, w.eventIndex, "FEATURE", "SPRINT");
    w.totalLaps = Math.ceil(sr.distanceKm! / w.lengthKm);
    w.durationSeconds = sr.minutes * 60;
    for (const car of w.cars)
      car.plan.pitLap = Math.min(car.plan.pitLap, w.totalLaps);
  }
  w.phase = "GRID";
  logRace(
    w,
    "START",
    `${rules.qualifying} qualifying complete. ${main.find((c) => c.grid === 1)?.name} takes pole${rules.reverse ? `; top ${rules.reverse} reversed for the sprint` : ""}.`,
  );
}
function suitableTyre(
  w: RaceWeekend,
  rules: RaceRules,
  car?: RaceCar,
): Compound {
  if (w.wetness > 60 && rules.compounds.includes("WET")) return "WET";
  if (w.wetness > 20 && rules.compounds.includes("INTERMEDIATE"))
    return "INTERMEDIATE";
  if (rules.alternateSets && car) {
    const count = car.tyreSets.filter(
      (s) =>
        s.compound === "ALTERNATE" &&
        s.laps >= rules.tyreMinimumLaps &&
        s.greenLaps > 0,
    ).length;
    if (count < rules.alternateSets) return "ALTERNATE";
    return "PRIMARY";
  }
  if (
    car &&
    rules.twoCompounds &&
    new Set(car.tyreSets.filter((s) => s.laps > 0).map((s) => s.compound))
      .size < 2
  ) {
    if (car.plan.nextCompound !== car.compound) return car.plan.nextCompound;
    return (
      rules.compounds.find(
        (c) => c !== car.compound && !["WET", "INTERMEDIATE"].includes(c),
      ) ?? car.plan.nextCompound
    );
  }
  return rules.compounds.includes("HARD")
    ? "HARD"
    : rules.compounds.includes("MEDIUM")
      ? "MEDIUM"
      : rules.compounds[0];
}
function lapTime(w: RaceWeekend, car: RaceCar) {
  const driver = car.crew[car.activeDriver],
    rules = raceRules(w),
    base = w.baseLap * (car.classId === "TRAFFIC" ? 1.28 : 1);
  const mode =
    car.mode === "ATTACK"
      ? -0.7
      : car.mode === "CONSERVE"
        ? 0.7
        : car.mode === "DEFEND"
          ? 0.3
          : 0;
  const wet = Math.max(0, w.wetness - 10) * (100 - car.wetSkill) * 0.0009;
  let seconds =
    base +
    (100 - car.pace) * 0.035 +
    (100 - driver.skill) * 0.044 +
    (100 - car.setupFit) * 0.022 +
    tyrePenalty(car.compound, w.wetness, car.wear) +
    car.damage * 0.06 +
    driver.fatigue * 0.012 +
    (100 - car.confidence) * 0.007 +
    wet +
    mode +
    (car.fuel / (rules.refuel ? rules.fuelLaps : w.totalLaps + 3)) * 0.55 +
    (raceRandom(w) - 0.5) * (0.3 + (100 - driver.consistency) * 0.018);
  if (w.flag !== "GREEN")
    seconds = base * (w.flag === "SC" ? 1.65 : 1.4) + raceRandom(w) * 0.1;
  return Math.max(base * 0.8, round(seconds));
}
export function startRace(w: RaceWeekend) {
  if (w.phase !== "GRID")
    throw new Error("Complete qualifying before starting.");
  const rules = raceRules(w);
  w.phase = "RACING";
  w.lap = 0;
  w.clockSeconds = 0;
  w.flag = "GREEN";
  w.decision = null;
  for (const car of w.cars) {
    car.compound =
      car.plan.automatic && w.wetness > 20
        ? suitableTyre(w, rules)
        : car.plan.startCompound;
    car.tyreSets = [{ compound: car.compound, laps: 0, greenLaps: 0 }];
    car.wetUsed = ["WET", "INTERMEDIATE"].includes(car.compound);
    car.fuel = rules.refuel
      ? rules.fuelLaps * car.plan.fuelTarget
      : (w.totalLaps * 1.08 + 1) * car.plan.fuelTarget;
    car.totalSeconds = 0;
    car.lapStartedAt = 0;
    car.completedLaps = 0;
    car.finished = false;
    car.retired = false;
    car.dsq = false;
    car.retirementReason = null;
    car.damage = 0;
    car.stops = 0;
    car.mandatoryStops = 0;
    car.tyreAge = 0;
    car.wear = 0;
    car.activeDriver = 0;
    car.stintSeconds = 0;
    car.pitRequested = false;
    car.penaltySeconds = 0;
    car.lapsLed = 0;
    car.lastLap = 0;
    car.bestLap = 0;
    car.pitLoss = 0;
    car.battleLoss = 0;
    car.mistakeLoss = 0;
    car.serviceLoss = 0;
    car.sundaySeconds = 0;
    car.powerStageSeconds = 0;
    car.crew.forEach((d) => {
      d.drivingSeconds = 0;
      d.fatigue = 0;
    });
    const startGap = (car.grid - 1) * (rules.rollingStart ? 0.45 : 0.25);
    car.nextLapAt =
      lapTime(w, car) + startGap + (100 - car.skill) * raceRandom(w) * 0.025;
    car.position = car.grid;
  }
  logRace(
    w,
    "START",
    `${rules.rollingStart ? "Rolling" : "Standing"} start. ${w.session === "RALLY" ? "18 timed stages; service after stages 3, 6, 9, 12 and 15" : `${w.totalLaps} planned laps`}.`,
  );
  snapshot(w);
}
export function liveOrder(w: RaceWeekend) {
  return [...w.cars].sort(
    (a, b) =>
      Number(a.dsq) - Number(b.dsq) ||
      Number(a.retired) - Number(b.retired) ||
      b.completedLaps - a.completedLaps ||
      a.nextLapAt - b.nextLapAt ||
      a.id.localeCompare(b.id),
  );
}
export function gapToLeader(w: RaceWeekend, car: RaceCar) {
  const leader = liveOrder(w).find((c) => c.classId === car.classId);
  return leader
    ? Math.max(
        0,
        (leader.completedLaps - car.completedLaps) * w.baseLap +
          car.nextLapAt -
          leader.nextLapAt,
      )
    : 0;
}
function snapshot(w: RaceWeekend) {
  const rows = liveOrder(w).filter((c) => c.classId === "MAIN");
  rows.forEach((c, i) => (c.position = i + 1));
  w.snapshots.push({
    lap: w.lap,
    wetness: round(w.wetness),
    flag: w.flag,
    rows: rows
      .filter((c) => c.ours)
      .map((c) => ({
        id: c.id,
        position: c.position,
        gap: round(
          Math.max(
            0,
            (rows[0].completedLaps - c.completedLaps) * w.baseLap +
              c.nextLapAt -
              rows[0].nextLapAt,
          ),
        ),
        wear: round(c.wear),
        fuel: round(c.fuel),
      })),
  });
  if (w.snapshots.length > 60) w.snapshots.splice(1, 1);
}
function control(
  w: RaceWeekend,
  flag: RaceWeekend["flag"],
  laps: number,
  text: string,
) {
  if (w.flag === "RED") return;
  w.flag = flag;
  w.flagRemaining = laps;
  w.pitClosed = w.seriesId === "INDYCAR" && flag === "SC";
  logRace(w, "CONTROL", text);
  w.decision = text;
}
function pitWindow(w: RaceWeekend, rules: RaceRules) {
  if (!rules.pitWindow) return true;
  return (
    w.pitWindowOpened &&
    w.clockSeconds >= rules.pitWindow[0] + w.pitWindowDelay &&
    w.clockSeconds < w.pitWindowEnd
  );
}
function shouldPit(w: RaceWeekend, car: RaceCar, rules: RaceRules) {
  if (w.seriesId === "RALLY") return false;
  if (w.pitClosed) return false;
  if (car.pitRequested) return true;
  if (!car.plan.automatic && car.ours) return false;
  const remaining = w.totalLaps - w.lap;
  if (remaining <= 1) return false;
  const mandatory =
    rules.mandatoryStop &&
    car.mandatoryStops < rules.requiredStops &&
    pitWindow(w, rules) &&
    car.completedLaps >= rules.minStopLap;
  if (rules.pitWindow) {
    if (
      mandatory &&
      w.clockSeconds > rules.pitWindow[0] + w.pitWindowDelay + 120
    )
      return true;
  } else if (
    mandatory &&
    (car.completedLaps >= car.plan.pitLap || car.wear > 65)
  )
    return true;
  if (rules.refuel && car.fuel < 2.2) return true;
  if (car.damage > 20 && car.plan.repair) return true;
  if (car.wear > 80 && remaining > 3) return true;
  if (
    tyrePenalty(car.compound, w.wetness, 0) > 3 &&
    rules.compounds.some((c) => tyrePenalty(c, w.wetness, 0) < 1)
  )
    return true;
  if (rules.twoCompounds && !car.wetUsed) {
    const valid = car.tyreSets.filter(
      (s) =>
        s.laps >= rules.tyreMinimumLaps &&
        (!rules.alternateSets || s.greenLaps > 0),
    );
    const alt = valid.filter((s) => s.compound === "ALTERNATE").length;
    if (
      rules.alternateSets &&
      (alt < rules.alternateSets ||
        !valid.some((s) => s.compound === "PRIMARY")) &&
      remaining <= Math.max(5, (rules.alternateSets - alt + 1) * 3)
    )
      return true;
    if (
      !rules.alternateSets &&
      new Set(valid.map((s) => s.compound)).size < 2 &&
      car.completedLaps >= car.plan.pitLap
    )
      return true;
  }
  if (
    rules.maxStintMinutes &&
    car.stintSeconds > rules.maxStintMinutes * 60 - 180
  )
    return true;
  // An AI undercut is only attempted close to an opponent with ageing tyres.
  if (car.ours || car.stops > 0 || car.wear <= 45) return false;
  const ahead = liveOrder(w).find(
    (c) => c.position === car.position - 1 && c.classId === car.classId,
  );
  return (
    !!ahead &&
    gapToLeader(w, car) - gapToLeader(w, ahead) < 2 &&
    raceRandom(w) < 0.08
  );
}
function doPit(w: RaceWeekend, car: RaceCar, rules: RaceRules) {
  const requested = car.pitRequested;
  car.pitRequested = false;
  let compound = requested
    ? car.plan.nextCompound
    : suitableTyre(w, rules, car);
  if (!rules.compounds.includes(compound)) compound = rules.compounds[0];
  let seconds =
    rules.pitSeconds *
      (w.flag === "GREEN" ? 1 : w.flag === "SC" ? 0.48 : 0.65) +
    (100 - car.crewSkill) * 0.035 +
    raceRandom(w) * 1.5;
  const teammate = w.cars.find(
    (c) =>
      c.id !== car.id && c.team === car.team && c.pitRelease > car.totalSeconds,
  );
  if (teammate) {
    const wait = teammate.pitRelease - car.totalSeconds;
    seconds += wait;
    logRace(
      w,
      "PIT",
      `${car.name} queues ${wait.toFixed(1)}s behind the other team car.`,
      car.id,
      wait,
    );
  }
  if (car.plan.repair && car.damage > 0) {
    const repair = car.damage * 0.8;
    seconds += repair;
    car.serviceLoss += repair;
    car.damage = 0;
  }
  if (rules.refuel) {
    const fill = Math.max(
      0,
      Math.min(rules.fuelLaps * car.plan.fuelTarget, w.totalLaps - w.lap + 2) -
        car.fuel,
    );
    const fuelTime = fill * 0.45;
    if (rules.sequentialService) seconds += fuelTime + 10;
    else seconds += Math.max(0, fuelTime - 5);
    car.fuel += fill;
  }
  if (raceRandom(w) < (100 - car.crewSkill) * 0.001) {
    const loss = 3 + raceRandom(w) * 8;
    seconds += loss;
    logRace(
      w,
      "PIT",
      `${car.name}: slow service adds ${loss.toFixed(1)}s.`,
      car.id,
      loss,
    );
  }
  const change =
    rules.changeDriver &&
    car.plan.changeDriver &&
    car.crew.length > 1 &&
    (!rules.pitWindow || (pitWindow(w, rules) && car.mandatoryStops === 0));
  if (change) {
    car.activeDriver = car.crew
      .map((d, i) => ({ i, seconds: d.drivingSeconds }))
      .filter((d) => d.i !== car.activeDriver)
      .sort((a, b) => a.seconds - b.seconds)[0].i;
    car.stintSeconds = 0;
  }
  const valid =
    car.completedLaps >= rules.minStopLap &&
    pitWindow(w, rules) &&
    (!rules.changeDriver || change);
  if (valid) car.mandatoryStops++;
  car.stops++;
  car.compound = compound;
  car.tyreSets.push({ compound, laps: 0, greenLaps: 0 });
  car.wetUsed ||= ["WET", "INTERMEDIATE"].includes(compound);
  car.wear = 0;
  car.tyreAge = 0;
  car.pitLoss += seconds;
  car.pitRelease = car.totalSeconds + seconds;
  logRace(
    w,
    "PIT",
    `${car.name}: stop ${car.stops}, ${compound}${change ? `, ${car.crew[car.activeDriver].name} takes over` : ""}, ${seconds.toFixed(1)}s lost.`,
    car.id,
    seconds,
  );
  return seconds;
}
function incident(w: RaceWeekend, car: RaceCar, seconds: number) {
  const rules = raceRules(w);
  if (w.flag !== "GREEN") return 0;
  const risk = ((100 - car.reliability) * 0.000022 * seconds) / 90;
  if (raceRandom(w) < risk) {
    car.retired = true;
    car.retirementReason = "Mechanical failure";
    logRace(
      w,
      "INCIDENT",
      `${car.name} retires with a mechanical failure.`,
      car.id,
    );
    if (rules.format !== "RALLY")
      control(
        w,
        rules.neutralisation,
        2,
        "Race control neutralises the circuit for recovery.",
      );
    return 0;
  }
  const error =
    (100 - car.discipline) * 0.000026 +
    (car.mode === "ATTACK" ? 0.0015 : car.mode === "CONSERVE" ? -0.0003 : 0) +
    Math.max(0, w.wetness - 15) * 0.000014 +
    (100 - car.setupFit) * 0.00001;
  if (raceRandom(w) < Math.max(0.0002, error)) {
    const serious = raceRandom(w) < 0.18,
      loss =
        rules.format === "RALLY"
          ? 15 + raceRandom(w) * 45
          : 3 + raceRandom(w) * 12;
    car.mistakeLoss += loss;
    car.confidence = clamp(car.confidence - 8);
    car.damage = clamp(car.damage + (serious ? 45 : 5));
    if (serious && raceRandom(w) < 0.4) {
      car.retired = true;
      car.retirementReason = "Accident";
    }
    logRace(
      w,
      "INCIDENT",
      `${car.name}: ${car.retired ? "crash and retirement" : rules.format === "RALLY" ? "stage error / puncture" : "off-track excursion"}${car.retired ? "" : `, +${loss.toFixed(1)}s`}.`,
      car.id,
      loss,
    );
    if (serious && rules.format !== "RALLY")
      control(w, "SC", 3, "Safety Car deployed after an accident.");
    if (car.ours)
      w.decision = `${car.name} has damage: repair at the next stop, continue or retire.`;
    return loss;
  }
  if (raceRandom(w) < 0.0002 * (100 - car.discipline)) {
    car.warnings++;
    if (car.warnings % 4 === 0) {
      car.penaltySeconds += 5;
      logRace(
        w,
        "PENALTY",
        `${car.name}: repeated track-limit breaches, +5s.`,
        car.id,
        5,
      );
    }
  }
  if (car.wear >= 98 && raceRandom(w) < 0.12) {
    car.damage = clamp(car.damage + 8);
    car.wear = 100;
    car.pitRequested = true;
    logRace(w, "INCIDENT", `${car.name} suffers a puncture.`, car.id, 20);
    car.mistakeLoss += 20;
    return 20;
  }
  return 0;
}
function battle(w: RaceWeekend, car: RaceCar, seconds: number) {
  if (w.flag !== "GREEN" || w.seriesId === "RALLY") return seconds;
  const leader = liveOrder(w).find(
    (c) =>
      c.id !== car.id &&
      !c.retired &&
      c.classId === car.classId &&
      c.completedLaps === car.completedLaps &&
      c.nextLapAt > car.totalSeconds &&
      c.nextLapAt < car.totalSeconds + seconds,
  );
  if (leader) {
    const difference = car.totalSeconds + seconds - leader.nextLapAt;
    if (difference < 1.8) {
      const opportunity =
        w.overtaking / 100 +
        (car.mode === "ATTACK" ? 0.12 : 0) -
        (leader.mode === "DEFEND" ? 0.18 : 0) +
        (car.skill - leader.skill) * 0.004;
      if (raceRandom(w) > clamp(opportunity, 0.05, 0.95)) {
        const loss = 0.25 + (100 - w.overtaking) * 0.015;
        car.battleLoss += loss;
        seconds += loss;
      } else if (car.position > leader.position) {
        car.confidence = clamp(car.confidence + 1);
        logRace(
          w,
          "PASS",
          `${car.name} challenges ${leader.name} for position.`,
          car.id,
        );
      }
    }
  }
  if (w.seriesId === "LMP1" && car.classId === "MAIN") {
    const traffic = w.cars.filter((c) => c.classId === "TRAFFIC" && !c.retired);
    if (traffic.length && raceRandom(w) < 0.13) {
      const loss = (100 - w.overtaking) * 0.009 + raceRandom(w) * 0.5;
      seconds += loss;
      car.battleLoss += loss;
      if (car.ours && loss > 0.6)
        logRace(
          w,
          "PASS",
          `${car.name} loses ${loss.toFixed(1)}s negotiating slower-class traffic.`,
          car.id,
          loss,
        );
    }
  }
  return round(seconds);
}
function completeCarLap(w: RaceWeekend, car: RaceCar) {
  const rules = raceRules(w),
    seconds = car.nextLapAt - car.lapStartedAt;
  car.totalSeconds = car.nextLapAt;
  car.lastLap = round(seconds);
  if (w.flag === "GREEN")
    car.bestLap = car.bestLap ? Math.min(car.bestLap, seconds) : seconds;
  car.completedLaps += 1;
  car.tyreAge += 1;
  car.tyreSets.at(-1)!.laps += 1;
  if (w.flag === "GREEN") car.tyreSets.at(-1)!.greenLaps += 1;
  car.wear = clamp(
    car.wear +
      (100 / tyreLife(car.compound, w.abrasion)) *
        (car.mode === "ATTACK" ? 1.18 : car.mode === "CONSERVE" ? 0.78 : 1),
  );
  car.fuel = Math.max(
    0,
    car.fuel -
      (car.mode === "ATTACK" ? 1.04 : car.mode === "CONSERVE" ? 0.92 : 1) *
        (w.flag === "GREEN" ? 1 : 0.68),
  );
  const driver = car.crew[car.activeDriver];
  driver.drivingSeconds += Math.min(seconds, w.baseLap * 1.8);
  driver.fatigue = clamp(driver.fatigue + (seconds / 3600) * 14);
  car.stintSeconds += Math.min(seconds, w.baseLap * 1.8);
  for (const [i, d] of car.crew.entries())
    if (i !== car.activeDriver)
      d.fatigue = clamp(d.fatigue - (seconds / 3600) * 20);
  if (w.seriesId === "RALLY") {
    if (w.lap >= 15) car.sundaySeconds += seconds;
    if (w.lap === 18) car.powerStageSeconds = seconds;
  }
  if (car.fuel <= 0 && !rules.refuel) {
    car.retired = true;
    car.retirementReason = "Out of fuel";
    logRace(w, "INCIDENT", `${car.name} runs out of fuel.`, car.id);
    return;
  }
  let delay = incident(w, car, seconds);
  if (car.retired) return;
  if (shouldPit(w, car, rules)) delay += doPit(w, car, rules);
  else if (rules.refuel && car.fuel <= 0) {
    car.retired = true;
    car.retirementReason = "Out of fuel";
    logRace(w, "INCIDENT", `${car.name} runs out of fuel.`, car.id);
    return;
  }
  const next =
    rules.format === "RALLY"
      ? lapTime(w, car) * stageFactor(w.lap + 1) +
        (car.coDriverSkill ? Math.max(0, 70 - car.coDriverSkill) * 0.1 : 20)
      : battle(w, car, lapTime(w, car));
  car.lapStartedAt = car.totalSeconds + delay;
  car.nextLapAt = car.lapStartedAt + next;
}
function stageFactor(stage: number) {
  return [0.7, 1.1, 0.9, 1.3, 0.8, 1, 1.15, 0.75, 1.25][(stage - 1) % 9];
}
function rallyService(w: RaceWeekend) {
  for (const car of w.cars.filter((c) => !c.retired)) {
    const repair = car.plan.repair
      ? Math.min(car.damage, car.crewSkill * 0.6)
      : 0;
    car.damage -= repair;
    car.wear = 0;
    car.tyreAge = 0;
    car.fuel = 4;
    car.compound = car.plan.nextCompound;
    car.wetUsed ||= ["WET", "INTERMEDIATE"].includes(car.compound);
    car.tyreSets.push({ compound: car.compound, laps: 0, greenLaps: 0 });
    car.stops++;
    if (car.ours)
      logRace(
        w,
        "SERVICE",
        `${car.name}: scheduled service, ${repair.toFixed(0)} damage repaired; ${car.compound} tyres.`,
        car.id,
      );
  }
  w.decision =
    "Service park: choose tyres, repairs and the next stage's risk level.";
}
export function stepRace(w: RaceWeekend) {
  if (w.phase !== "RACING") throw new Error("Race is not running.");
  w.decision = null;
  const rules = raceRules(w);
  if (w.flagRemaining > 0) {
    w.flagRemaining--;
    if (w.flagRemaining === 0) {
      w.flag = "GREEN";
      w.pitClosed = false;
      logRace(w, "CONTROL", "Green flag. Racing resumes.");
    } else if (w.seriesId === "INDYCAR") w.pitClosed = false;
  }
  const change = w.weatherChanges.find(
    (ch) => ch.lap > w.lap && ch.lap <= w.lap + 1,
  );
  if (change) {
    w.rain = change.rain;
    logRace(
      w,
      "WEATHER",
      w.rain
        ? "Rain is arriving; track grip is changing."
        : "Rain stops; a drying line is forming.",
    );
    w.decision = "Weather changed: review tyres and the forecast.";
  }
  w.wetness = clamp(
    w.wetness + (w.rain ? w.rain * 0.08 : -(4 + w.baseLap / 60)),
  );
  if (w.rain > 92 && w.redFlags < 1 && w.seriesId !== "RALLY") {
    w.redFlags++;
    control(
      w,
      "RED",
      1,
      "Red flag: standing water. Race paused for six minutes.",
    );
    for (const car of w.cars.filter((c) => !c.retired)) {
      car.nextLapAt += 360;
      car.lapStartedAt += 360;
    }
    w.clockSeconds += 360;
    w.wetness = clamp(w.wetness - 10);
    snapshot(w);
    return;
  }
  const neutralOrder =
    w.flag !== "GREEN" ? liveOrder(w).filter((c) => !c.retired) : [];
  const running = w.cars.filter((c) => !c.retired && c.classId === "MAIN");
  if (!running.length) {
    finishSession(w);
    return;
  }
  if (rules.format === "RALLY") {
    w.lap++;
    for (const car of running) {
      car.nextLapAt =
        car.totalSeconds +
        lapTime(w, car) * stageFactor(w.lap) +
        (car.coDriverSkill ? Math.max(0, 70 - car.coDriverSkill) * 0.1 : 20);
      car.lapStartedAt = car.totalSeconds;
      completeCarLap(w, car);
    }
    w.clockSeconds = Math.min(...running.map((c) => c.totalSeconds));
    if (w.lap % 3 === 0 && w.lap < 18) rallyService(w);
  } else {
    const max = Math.max(...running.map((c) => c.completedLaps));
    const target = Math.min(
      ...running.filter((c) => c.completedLaps === max).map((c) => c.nextLapAt),
    );
    w.clockSeconds = target;
    w.lap = max + 1;
    if (
      rules.pitWindow &&
      !w.pitWindowOpened &&
      w.clockSeconds >= rules.pitWindow[0]
    ) {
      if (w.flag === "GREEN") {
        w.pitWindowOpened = true;
        if (w.pitWindowDelay) w.pitWindowEnd = w.clockSeconds + 600;
      } else {
        w.pitWindowDelay = w.clockSeconds - rules.pitWindow[0];
        w.pitWindowEnd = w.clockSeconds + 600;
      }
    }
    for (const car of w.cars.filter((c) => !c.retired)) {
      let guard = 0;
      while (car.nextLapAt <= target + 0.0001 && !car.retired && guard++ < 4)
        completeCarLap(w, car);
    }
    if (w.flag === "SC") {
      const order = liveOrder(w).filter((c) => !c.retired);
      const lead = order[0];
      if (lead)
        order.forEach((c, i) => {
          const maximum =
            lead.nextLapAt +
            i * 0.6 +
            (lead.completedLaps - c.completedLaps) * w.baseLap;
          if (c.nextLapAt > maximum)
            c.nextLapAt = Math.max(c.lapStartedAt + w.baseLap * 1.4, maximum);
        });
    }
    const leader = liveOrder(w).find((c) => c.classId === "MAIN" && !c.retired);
    if (leader) leader.lapsLed += 1;
  }
  if (neutralOrder.length && w.flag !== "GREEN") {
    const previousByLap = new Map<number, RaceCar>();
    for (const car of neutralOrder) {
      if (car.retired || car.pitRelease > car.totalSeconds) continue;
      const ahead = previousByLap.get(car.completedLaps);
      if (ahead)
        car.nextLapAt = Math.max(
          car.nextLapAt,
          ahead.nextLapAt + 0.05,
          car.lapStartedAt + 1,
        );
      previousByLap.set(car.completedLaps, car);
    }
  }
  snapshot(w);
  if (
    w.lap >= w.totalLaps ||
    (rules.format !== "RALLY" &&
      w.clockSeconds >= w.durationSeconds + w.redFlags * 360)
  ) {
    if (rules.format !== "RALLY")
      for (const car of w.cars.filter(
        (c) => !c.retired && c.totalSeconds < w.clockSeconds,
      )) {
        completeCarLap(w, car);
        car.finished = true;
      }
    finishSession(w);
  } else if (
    !w.decision &&
    w.cars.some(
      (c) =>
        c.ours && !c.retired && (c.wear > 70 || c.fuel < 4 || c.damage > 10),
    )
  )
    w.decision = "Pit wall: tyres, fuel or damage need attention.";
}
export function tyreCompliance(car: RaceCar, rules: RaceRules) {
  if (!rules.twoCompounds || car.wetUsed) return true;
  const valid = car.tyreSets.filter(
    (s) =>
      s.laps >= rules.tyreMinimumLaps &&
      (!rules.alternateSets || s.greenLaps > 0),
  );
  if (rules.alternateSets)
    return (
      valid.filter((s) => s.compound === "ALTERNATE").length >=
        rules.alternateSets && valid.some((s) => s.compound === "PRIMARY")
    );
  return new Set(valid.map((s) => s.compound)).size >= 2;
}
export function classify(w: RaceWeekend) {
  return [...w.cars]
    .filter((c) => c.classId === "MAIN")
    .sort(
      (a, b) =>
        Number(a.dsq) - Number(b.dsq) ||
        b.completedLaps - a.completedLaps ||
        a.totalSeconds + a.penaltySeconds - b.totalSeconds - b.penaltySeconds ||
        a.id.localeCompare(b.id),
    );
}
function finishSession(w: RaceWeekend) {
  const rules = raceRules(w),
    main = w.cars.filter((c) => c.classId === "MAIN"),
    leaderLaps = Math.max(0, ...main.map((c) => c.completedLaps));
  for (const car of main) {
    if (!tyreCompliance(car, rules)) {
      if (w.seriesId === "INDYCAR") {
        car.completedLaps = Math.max(0, car.completedLaps - 1);
        car.penaltySeconds += w.baseLap;
        logRace(
          w,
          "PENALTY",
          `${car.name}: required tyre sets not completed; one-lap penalty.`,
          car.id,
          w.baseLap,
        );
      } else {
        car.dsq = true;
        car.retirementReason = "Dry tyre specification requirement not met";
        logRace(
          w,
          "PENALTY",
          `${car.name}: excluded for missing the dry-tyre requirement.`,
          car.id,
        );
      }
    }
    if (
      rules.mandatoryStop &&
      !car.retired &&
      car.mandatoryStops < rules.requiredStops
    ) {
      car.dsq = true;
      car.retirementReason = "Mandatory pit stop / driver change missing";
      logRace(
        w,
        "PENALTY",
        `${car.name}: excluded for missing the mandatory stop.`,
        car.id,
      );
    }
    if (
      w.seriesId === "GT3" &&
      rules.maxStintMinutes &&
      car.crew.some((d) => d.drivingSeconds > rules.maxStintMinutes! * 60 + 300)
    ) {
      car.penaltySeconds += 30;
      logRace(
        w,
        "PENALTY",
        `${car.name}: driver exceeds event driving-time limit, +30s.`,
        car.id,
        30,
      );
    }
    if (
      rules.changeDriver &&
      !car.retired &&
      car.crew.length < rules.crewSize
    ) {
      car.dsq = true;
      car.retirementReason = "Incomplete driver crew";
    }
  }
  const rows = classify(w),
    mostLed = Math.max(0, ...rows.map((c) => c.lapsLed)),
    fastest = [...rows]
      .filter((c) => !c.dsq && c.bestLap > 0)
      .sort((a, b) => a.bestLap - b.bestLap)[0];
  const sunday = [...rows]
      .filter((c) => !c.retired && !c.dsq)
      .sort((a, b) => a.sundaySeconds - b.sundaySeconds),
    power = [...rows]
      .filter((c) => !c.retired && !c.dsq)
      .sort((a, b) => a.powerStageSeconds - b.powerStageSeconds);
  rows.forEach((car, i) => {
    car.position = i + 1;
    const classified =
      leaderLaps > 0 &&
      !car.dsq &&
      car.completedLaps >= Math.floor(leaderLaps * rules.minimumDistance) &&
      (rules.format !== "RALLY" || !car.retired);
    car.finishPoints += classified
      ? (rules.points[i] ??
        (w.seriesId === "LMP1"
          ? w.eventIndex === 3 || w.eventIndex === 7
            ? 1
            : 0.5
          : 0))
      : 0;
    if (classified && i === 0 && !car.retired) car.raceWins++;
    if (classified && i < 3 && !car.retired) car.racePodiums++;
    if (classified && rules.fastestBonus && fastest?.id === car.id && i < 10)
      car.bonusPoints += rules.fastestBonus;
    if (car.grid === 1 && rules.poleBonus && w.qualifying[0]?.id === car.id)
      car.bonusPoints += rules.poleBonus;
    if (w.seriesId === "INDYCAR") {
      if (car.lapsLed > 0) car.bonusPoints++;
      if (car.lapsLed === mostLed && mostLed > 0) car.bonusPoints += 2;
      if (w.eventIndex === 6)
        car.bonusPoints += Math.max(
          0,
          13 - (w.qualifying.find((q) => q.id === car.id)?.position ?? 100),
        );
    }
    if (w.seriesId === "RALLY" && classified) {
      const s = sunday.findIndex((c) => c.id === car.id),
        p = power.findIndex((c) => c.id === car.id);
      car.bonusPoints += Math.max(0, 5 - s) + Math.max(0, 5 - p);
    }
  });
  logRace(
    w,
    "FINISH",
    `${w.session} finished. ${rows.find((c) => !c.retired && !c.dsq)?.name ?? "No finisher"}.`,
  );
  snapshot(w);
  if (w.session === "SPRINT" && w.sprintPending) {
    w.sprintFinished = true;
    w.session = "RACE";
    w.phase = "QUALIFYING";
    w.lap = 0;
    const mainRules = getRaceRules(w.seriesId, w.eventIndex, "FEATURE");
    w.totalLaps = Math.ceil(mainRules.distanceKm! / w.lengthKm);
    w.durationSeconds = mainRules.minutes * 60;
    w.decision =
      "Sprint complete. Prepare Grand Prix qualifying; sprint points remain recorded.";
  } else w.phase = "COMPLETE";
}
export function runWeekend(w: RaceWeekend, stopAtDecision = false) {
  let guard = 0;
  while (w.phase !== "COMPLETE" && guard++ < 4000) {
    if (w.phase === "PRACTICE") {
      practice(w);
      practice(w);
      qualify(w);
    } else if (w.phase === "QUALIFYING") qualify(w);
    else if (w.phase === "GRID") {
      startRace(w);
    } else stepRace(w);
    if (stopAtDecision && w.decision && w.phase === "RACING") return;
  }
  if (guard >= 4000) throw new Error("Race exceeded its simulation limit.");
}
export function summarize(w: RaceWeekend, budget: number): RaceSummary {
  const rules = raceRules(w),
    rows = classify(w),
    teams = new Map<string, number>();
  for (const car of rows) {
    const points = car.finishPoints + car.bonusPoints;
    teams.set(
      car.team,
      w.seriesId === "GT3" || w.seriesId === "GT4"
        ? Math.max(teams.get(car.team) ?? 0, points)
        : (teams.get(car.team) ?? 0) + points,
    );
  }
  return {
    ruleId: w.ruleId,
    venue: w.venue,
    laps: Math.max(1, w.lap),
    wetRace: w.cars.some((c) => c.wetUsed),
    qualifying: structuredClone(w.qualifying),
    events: w.events
      .filter(
        (e) =>
          !e.carId ||
          w.cars.some((c) => c.id === e.carId && c.ours) ||
          e.kind === "FINISH",
      )
      .slice(-100),
    snapshots: structuredClone(w.snapshots),
    teamOrders: structuredClone(w.teamOrders),
    teamPoints: [...teams].map(([team, points]) => ({ team, points })),
    entries: rows.map((car) => ({
      id: car.id,
      time: round(car.totalSeconds + car.penaltySeconds),
      laps: car.completedLaps,
      grid: car.grid,
      stops: car.stops,
      compound: car.compound,
      penalty: round(car.penaltySeconds),
      dsq: car.dsq,
      reason: car.retirementReason,
      crew: car.crew.map((d) => ({
        id: d.id,
        name: d.name,
        seconds: round(d.drivingSeconds),
        eligible:
          !rules.changeDriver ||
          (d.drivingSeconds > 0 &&
            d.drivingSeconds >= rules.minDriverMinutes * 60),
      })),
      explanation: `Setup ${Math.round(car.setupFit)}%; pit loss ${car.pitLoss.toFixed(1)}s; traffic ${car.battleLoss.toFixed(1)}s; errors ${car.mistakeLoss.toFixed(1)}s; penalties ${car.penaltySeconds.toFixed(1)}s. ${car.retirementReason ?? "Reached the finish"}.`,
      repairCost: car.ours
        ? Number(
            (budget * (car.retired ? 0.002 : 0.00004 * car.damage)).toFixed(6),
          )
        : 0,
      finishPoints: car.finishPoints,
      bonusPoints: car.bonusPoints,
      wins: car.raceWins,
      podiums: car.racePodiums,
    })),
  };
}
