import type { RoundFlowState } from "@/game/season/round-flow";
import { getSeries, pointsForEvent, SERIES } from "./series";
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
    event = cfg.calendar[table.completedRounds];
  const results = world.teams
    .filter((t) => t.seriesId === seriesId)
    .flatMap((team) =>
      team.drivers.map((id) => {
        const p = world.people.find((p) => p.id === id)!;
        const terrain =
          event.kind === "OVAL" || cfg.category === "RALLY"
            ? p.terrainSkill * 0.15
            : 0;
        const dnf =
          worldRandom(world) * 100 <
          (100 - team.reliability) * 0.35 +
            (event.kind === "ENDURANCE" ? 4 : cfg.category === "RALLY" ? 3 : 0);
        const score =
          team.pace * 0.5 +
          p.skill * 0.38 +
          p.consistency * 0.05 +
          terrain +
          worldRandom(world) * 22;
        return {
          personId: id,
          teamId: team.id,
          dnf,
          score,
          position: 0,
          points: 0,
        };
      }),
    )
    .sort(
      (a, b) =>
        Number(a.dnf) - Number(b.dnf) ||
        b.score - a.score ||
        a.personId.localeCompare(b.personId),
    );
  const points = pointsForEvent(cfg, table.completedRounds);
  results.forEach((r, i) => {
    r.position = i + 1;
    r.points = r.dnf ? 0 : (points[i] ?? 0);
    let standing = table.drivers.find((d) => d.personId === r.personId);
    if (!standing) {
      standing = { personId: r.personId, points: 0, wins: 0, podiums: 0 };
      table.drivers.push(standing);
    }
    standing.points += r.points;
    if (!r.dnf && i === 0) standing.wins++;
    if (!r.dnf && i < 3) standing.podiums++;
    table.teams.find((t) => t.teamId === r.teamId)!.points += r.points;
  });
  table.completedRounds++;
  table.lastResults = results.map(
    ({ personId, teamId, dnf, position, points }) => ({
      personId,
      teamId,
      dnf,
      position,
      points,
    }),
  );
}
export function advanceWorld(flow: RoundFlowState) {
  const c = flow.career!,
    w = c.world;
  if (!w) return;
  const selected = w.series.find((s) => s.seriesId === w.playerSeriesId)!,
    race = c.races.at(-1)!,
    cfg = getSeries(w.playerSeriesId);
  for (const r of race.results) {
    let standing = selected.drivers.find((d) => d.personId === r.characterId);
    if (!standing) {
      standing = { personId: r.characterId, points: 0, wins: 0, podiums: 0 };
      selected.drivers.push(standing);
    }
    standing.points += r.points;
    if (!r.dnf && r.position === 1) standing.wins++;
    if (!r.dnf && r.position <= 3) standing.podiums++;
    const team = w.teams.find(
      (t) => t.name === r.team && t.seriesId === w.playerSeriesId,
    );
    if (team)
      selected.teams.find((t) => t.teamId === team.id)!.points += r.points;
  }
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
