import {
  createWeekend,
  runWeekend,
  classify,
  summarize,
} from "@/game/racing/engine";
import type { RoundFlowState } from "@/game/season/round-flow";
import { getSeries, SERIES } from "./series";
import {
  worldRandom,
  resetWorldStandings,
  playerTeam,
  worldCandidates,
} from "./world";
import type { MotorsportWorld } from "./schemas";
function worldRace(
  world: MotorsportWorld,
  seriesId: MotorsportWorld["playerSeriesId"],
) {
  const cfg = getSeries(seriesId),
    table = world.series.find((s) => s.seriesId === seriesId)!,
    team = world.teams.find((t) => t.seriesId === seriesId)!,
    index = table.completedRounds;
  const view = { ...world, playerSeriesId: seriesId, playerTeamId: team.id };
  const source: Parameters<typeof createWeekend>[0] = {
    currentRound: (world.season - 1) * cfg.rounds + index + 1,
    political: { characters: [], relationships: [] },
    career: {
      world: view,
      seed: world.seed,
      season: world.season,
      seasonStart: (world.season - 1) * cfg.rounds + 1,
      strategy: "BALANCED",
      car: { pace: team.pace, reliability: team.reliability },
      seats: [],
      standings: [],
      races: table.qualifying?.length
        ? [{ summary: { qualifying: table.qualifying } }]
        : [],
    },
  };
  const weekend = createWeekend(source);
  for (const car of weekend.cars) {
    car.ours = false;
    const t = world.teams.find((t) => t.name === car.team);
    car.crewSkill =
      t?.staff
        .map((id) => world.people.find((p) => p.id === id))
        .find((p) => p?.role === "RACE_ENGINEER")?.skill ?? 65;
  }
  runWeekend(weekend);
  world.seed = weekend.seed;
  const summary = summarize(weekend, 0),
    cars = classify(weekend);
  for (const [i, car] of cars.entries())
    for (const driver of summary.entries[i].crew) {
      let d = table.drivers.find((d) => d.personId === driver.id);
      if (!d) {
        d = { personId: driver.id, points: 0, wins: 0, podiums: 0 };
        table.drivers.push(d);
      }
      if (driver.eligible) {
        d.points += car.finishPoints + car.bonusPoints;
        d.wins += car.raceWins;
        d.podiums += car.racePodiums;
      }
    }
  for (const result of summary.teamPoints) {
    const t = world.teams.find(
      (t) => t.name === result.team && t.seriesId === seriesId,
    )!;
    table.teams.find((r) => r.teamId === t.id)!.points += result.points;
  }
  table.completedRounds++;
  table.qualifying = weekend.qualifying;
  table.lastResults = cars.map((c) => ({
    personId: c.id,
    teamId: world.teams.find(
      (t) => t.name === c.team && t.seriesId === seriesId,
    )!.id,
    position: c.position,
    points: c.finishPoints + c.bonusPoints,
    dnf: c.retired || c.dsq,
  }));
}
export function advanceWorld(flow: RoundFlowState) {
  const c = flow.career!,
    w = c.world;
  if (!w) return;
  const selected = w.series.find((s) => s.seriesId === w.playerSeriesId)!,
    race = c.races.at(-1)!,
    cfg = getSeries(w.playerSeriesId);
  for (const r of race.results) {
    const entry = race.summary?.entries.find((e) => e.id === r.characterId);
    const crew = entry?.crew ?? [{ id: r.characterId, eligible: true }];
    for (const member of crew) {
      let standing = selected.drivers.find((d) => d.personId === member.id);
      if (!standing) {
        standing = { personId: member.id, points: 0, wins: 0, podiums: 0 };
        selected.drivers.push(standing);
      }
      if (member.eligible) {
        standing.points += r.points;
        standing.wins += entry?.wins ?? (!r.dnf && r.position === 1 ? 1 : 0);
        standing.podiums +=
          entry?.podiums ?? (!r.dnf && r.position <= 3 ? 1 : 0);
      }
    }
  }
  for (const r of race.summary?.teamPoints ?? race.results) {
    const team = w.teams.find(
      (t) => t.name === r.team && t.seriesId === w.playerSeriesId,
    );
    if (team)
      selected.teams.find((t) => t.teamId === team.id)!.points += r.points;
  }
  selected.qualifying = race.summary?.qualifying;
  selected.completedRounds = flow.currentRound - c.seasonStart + 1;
  selected.lastResults = race.results.map((r) => ({
    personId: r.characterId,
    teamId: w.teams.find(
      (t) => t.name === r.team && t.seriesId === w.playerSeriesId,
    )!.id,
    position: r.position,
    points: r.points,
    dnf: r.dnf,
  }));
  const progress = selected.completedRounds / cfg.rounds;
  for (const other of SERIES)
    if (other.id !== w.playerSeriesId) {
      const table = w.series.find((s) => s.seriesId === other.id)!;
      const target = Math.floor(progress * other.rounds);
      while (table.completedRounds < target) worldRace(w, other.id);
    }
  // Team employees reflect the manager's active seats, including vacancies and new hires.
  const team = playerTeam(w);
  team.pace = c.car.pace;
  team.reliability = c.car.reliability;
}
export function nextWorldSeason(flow: RoundFlowState) {
  const c = flow.career!,
    w = c.world;
  if (!w) return;
  for (const table of w.series) {
    w.history.push({
      season: w.season,
      seriesId: table.seriesId,
      driverId:
        [...table.drivers].sort(
          (a, b) => b.points - a.points || b.wins - a.wins,
        )[0]?.personId ?? null,
      teamId:
        [...table.teams].sort((a, b) => b.points - a.points)[0]?.teamId ?? null,
    });
  }
  w.season = c.season;
  for (const p of w.people) {
    p.age = Math.min(80, p.age + 1);
    p.experience = Math.min(50, p.experience + 1);
    if (p.role === "DRIVER" && p.age < 28)
      p.skill = Math.min(p.potential, p.skill + 1);
    else if (p.role === "DRIVER" && p.age > 38)
      p.skill = Math.max(30, p.skill - 1);
  }
  for (const team of w.teams)
    if (team.id !== w.playerTeamId) {
      team.pace = Math.max(
        40,
        Math.min(96, team.pace - 3 + Math.floor(worldRandom(w) * 7)),
      );
      team.reliability = Math.max(
        65,
        Math.min(97, team.reliability - 2 + Math.floor(worldRandom(w) * 5)),
      );
    }
  resetWorldStandings(w);
  c.candidates = worldCandidates(w, flow.political, flow.currentRound);
  const previous = c.standings;
  c.standings = w.people
    .filter(
      (p) =>
        p.role === "DRIVER" &&
        !w.teams.some((t) => t.raceCrews?.some((c) => c.coDriverId === p.id)) &&
        p.teamId &&
        w.teams.find((t) => t.id === p.teamId)?.seriesId === w.playerSeriesId,
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      team: w.teams.find((t) => t.id === p.teamId)!.name,
      skill: p.skill,
      points: 0,
      wins: 0,
      podiums: 0,
    }));
  for (const old of previous)
    if (!c.standings.some((s) => s.id === old.id))
      c.standings.push({
        ...old,
        team: "Departed",
        points: 0,
        wins: 0,
        podiums: 0,
      });
  for (const actor of flow.political.characters) {
    const p = w.people.find((p) => p.id === actor.id);
    if (p && actor.active !== false) actor.power.sportingLeverage = p.skill;
  }
}
