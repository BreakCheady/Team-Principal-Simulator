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

function roleName(role: string) {
  return ({
    DRIVER: "Fahrer",
    TECHNICAL_DIRECTOR: "Technischer Direktor",
    SPORTING_DIRECTOR: "Sportdirektor",
    RACE_ENGINEER: "Renningenieur",
    TEAM_PRINCIPAL: "Teamchef",
  } as Record<string, string>)[role] ?? role.replaceAll("_", " ");
}
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
        d = { personId: driver.id, ...(seriesId === "WEC" ? { classId: car.classId as "HYPERCAR" | "LMGT3" } : {}), points: 0, wins: 0, podiums: 0 };
        table.drivers.push(d);
      }
      if (seriesId === "WEC") d.classId = car.classId as "HYPERCAR" | "LMGT3";
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
  if (seriesId === "WEC") for (const car of cars) {
    table.entries ??= [];
    let entry = table.entries.find((e) => e.id === car.entryId);
    if (!entry) { entry = { id: car.entryId!, teamId: world.teams.find((t) => t.name === car.team)!.id, classId: car.classId as "HYPERCAR" | "LMGT3", points: 0 }; table.entries.push(entry); }
    entry.points += car.finishPoints + car.bonusPoints;
  }
  table.completedRounds++;
  table.qualifying = weekend.qualifying;
  table.lastResults = cars.map((c) => ({
    personId: c.id,
    teamId: world.teams.find(
      (t) => t.name === c.team && t.seriesId === seriesId,
    )!.id,
    ...(seriesId === "WEC" ? { classId: c.classId as "HYPERCAR" | "LMGT3", classPosition: summary.entries.find((e) => e.id === c.id)!.classPosition } : {}),
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
        standing = { personId: member.id, ...(r.classId ? { classId: r.classId } : {}), points: 0, wins: 0, podiums: 0 };
        selected.drivers.push(standing);
      }
      if (r.classId) standing.classId = r.classId;
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
  if (w.playerSeriesId === "WEC") for (const r of race.results) {
    selected.entries ??= [];
    const entryId = race.summary!.entries.find((e) => e.id === r.characterId)!.entryId!;
    let entry = selected.entries.find((e) => e.id === entryId);
    if (!entry) { entry = { id: entryId, teamId: w.teams.find((t) => t.name === r.team)!.id, classId: r.classId!, points: 0 }; selected.entries.push(entry); }
    entry.points += r.points;
  }
  selected.qualifying = race.summary?.qualifying;
  selected.completedRounds = flow.currentRound - c.seasonStart + 1;
  selected.lastResults = race.results.map((r) => ({
    personId: r.characterId,
    teamId: w.teams.find(
      (t) => t.name === r.team && t.seriesId === w.playerSeriesId,
    )!.id,
    ...(r.classId ? { classId: r.classId, classPosition: r.classPosition } : {}),
    position: r.position,
    points: r.points,
    dnf: r.dnf,
  }));
  const rumorMilestones = new Set([
    Math.max(1, Math.floor(cfg.rounds * 0.33)),
    Math.max(1, Math.floor(cfg.rounds * 0.66)),
  ]);
  if (rumorMilestones.has(selected.completedRounds)) {
    w.activity ??= [];
    const rumorId = `activity_s${w.season}_r${selected.completedRounds}_rumor_${w.playerSeriesId.toLowerCase()}`;
    if (!w.activity.some((item) => item.id === rumorId)) {
      const candidate = w.people
        .filter(
          (person) =>
            person.role === "DRIVER" &&
            person.teamId &&
            person.teamId !== w.playerTeamId &&
            person.contractEndSeason <= w.season &&
            person.specialties.includes(w.playerSeriesId),
        )
        .sort(
          (a, b) =>
            b.potential - a.potential ||
            b.skill - a.skill ||
            a.id.localeCompare(b.id),
        )[0];
      if (candidate) {
        const currentTeam = w.teams.find((team) => team.id === candidate.teamId)!;
        const destination = w.teams
          .filter(
            (team) =>
              team.seriesId === w.playerSeriesId &&
              team.id !== currentTeam.id &&
              team.id !== w.playerTeamId,
          )
          .sort(
            (a, b) =>
              b.reputation - a.reputation ||
              b.budget - a.budget ||
              a.id.localeCompare(b.id),
          )[0];
        if (destination)
          w.activity.push({
            id: rumorId,
            season: w.season,
            seriesId: w.playerSeriesId,
            type: "RUMOR",
            personId: candidate.id,
            fromTeamId: currentTeam.id,
            toTeamId: destination.id,
            headline: `${candidate.name} mit ${destination.name} in Verbindung gebracht`,
            detail: `Im Paddock wird ${candidate.name} mit ${destination.name} in Verbindung gebracht, während der Vertrag bei ${currentTeam.name} ausläuft.`,
          });
      }
    }
  }

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

function offseasonCandidateScore(
  world: MotorsportWorld,
  team: MotorsportWorld["teams"][number],
  person: MotorsportWorld["people"][number],
) {
  const youthUpside =
    person.role === "DRIVER" && person.age <= 24
      ? Math.max(0, person.potential - person.skill) * 0.7
      : 0;
  const ambitionFit = person.ambition * 0.08;
  const experienceFit = Math.min(12, person.experience * 0.25);
  const noise = worldRandom(world) * 6;
  return (
    person.skill +
    youthUpside +
    ambitionFit +
    experienceFit +
    team.reputation * 0.08 +
    noise
  );
}

function addWorldActivity(
  world: MotorsportWorld,
  activity: NonNullable<MotorsportWorld["activity"]>[number],
) {
  world.activity ??= [];
  world.activity.push(activity);
  if (world.activity.length > 300) world.activity.splice(0, world.activity.length - 300);
}

function runAiOffseason(world: MotorsportWorld) {
  const completedSeason = world.season;
  const playerId = world.playerTeamId;
  const rosterRoles = ["DRIVER", "TECHNICAL_DIRECTOR", "SPORTING_DIRECTOR", "RACE_ENGINEER"] as const;

  // Expiring AI contracts enter the market before teams recruit, which creates
  // genuine replacement chains across the world instead of isolated swaps.
  for (const person of world.people) {
    if (
      !person.teamId ||
      person.teamId === playerId ||
      person.role === "TEAM_PRINCIPAL" ||
      person.contractEndSeason > completedSeason
    )
      continue;
    const team = world.teams.find((item) => item.id === person.teamId);
    if (!team) continue;
    if (
      person.role === "DRIVER" &&
      !team.drivers.includes(person.id) &&
      team.raceCrews?.some(
        (crew) =>
          crew.members.includes(person.id) || crew.coDriverId === person.id,
      )
    ) {
      // Shared-car support drivers remain on rolling one-year deals for now;
      // the silly season replaces the stable entry lead without corrupting
      // persistent WEC/Rally crew identities.
      person.contractEndSeason = completedSeason + 1;
      continue;
    }
    if (person.role === "DRIVER")
      team.drivers = team.drivers.filter((id) => id !== person.id);
    else team.staff = team.staff.filter((id) => id !== person.id);
    addWorldActivity(world, {
      id: `activity_s${completedSeason}_expiry_${person.id}`,
      season: completedSeason,
      seriesId: team.seriesId,
      type: "CONTRACT_EXPIRED",
      personId: person.id,
      fromTeamId: team.id,
      toTeamId: null,
      headline: `${person.name} ist auf dem Markt`,
      detail: `Der Vertrag von ${person.name} als ${roleName(person.role)} bei ${team.name} ist nach Saison ${completedSeason} ausgelaufen.`,
    });
    person.teamId = null;
  }

  const championshipPosition = new Map<string, number>();
  for (const table of world.series) {
    [...table.teams]
      .sort((a, b) => b.points - a.points || a.teamId.localeCompare(b.teamId))
      .forEach((entry, index) => championshipPosition.set(entry.teamId, index + 1));
  }

  for (const team of world.teams) {
    if (team.id === playerId) continue;
    const cfg = getSeries(team.seriesId);
    const position = championshipPosition.get(team.id) ?? cfg.teamNames.length;
    const performance = 1 - (position - 1) / Math.max(1, cfg.teamNames.length - 1);
    const oldBudget = team.budget;
    const oldReputation = team.reputation;

    // Sponsor/owner confidence changes the resources available next season.
    const budgetSwing = 0.96 + performance * 0.08 + (worldRandom(world) - 0.5) * 0.04;
    team.budget = Number(Math.max(cfg.budget * 0.25, team.budget * budgetSwing).toFixed(3));
    team.reputation = Math.max(
      35,
      Math.min(98, Math.round(team.reputation + (performance - 0.5) * 6 + (worldRandom(world) - 0.5) * 4)),
    );
    const budgetDelta = team.budget - oldBudget;
    const reputationDelta = team.reputation - oldReputation;
    if (Math.abs(budgetDelta) >= Math.max(0.25, oldBudget * 0.015) || Math.abs(reputationDelta) >= 2)
      addWorldActivity(world, {
        id: `activity_s${completedSeason}_trend_${team.id}`,
        season: completedSeason,
        seriesId: team.seriesId,
        type: "TEAM_TREND",
        personId: null,
        fromTeamId: team.id,
        toTeamId: team.id,
        headline: `${team.name} ${budgetDelta >= 0 ? "gewinnt" : "verliert"} an Dynamik`,
        detail: `Saison ${completedSeason} P${position}: Budget ${budgetDelta >= 0 ? "+" : ""}€${budgetDelta.toFixed(2)} Mio. und Reputation ${reputationDelta >= 0 ? "+" : ""}${reputationDelta}.`,
      });

    const needs = new Map<(typeof rosterRoles)[number], number>([
      ["DRIVER", Math.max(0, cfg.driversPerTeam - team.drivers.length)],
      ["TECHNICAL_DIRECTOR", team.staff.some((id) => world.people.find((p) => p.id === id)?.role === "TECHNICAL_DIRECTOR") ? 0 : 1],
      ["SPORTING_DIRECTOR", team.staff.some((id) => world.people.find((p) => p.id === id)?.role === "SPORTING_DIRECTOR") ? 0 : 1],
      ["RACE_ENGINEER", team.staff.some((id) => world.people.find((p) => p.id === id)?.role === "RACE_ENGINEER") ? 0 : 1],
    ]);

    for (const role of rosterRoles) {
      const count = needs.get(role) ?? 0;
      for (let slot = 0; slot < count; slot++) {
        const candidates = world.people
          .filter(
            (p) =>
              !p.teamId &&
              p.role === role &&
              p.specialties.includes(team.seriesId) &&
              (role !== "DRIVER" || p.skill >= cfg.minDriverSkill) &&
              !(team.classId === "HYPERCAR" && p.rating === "BRONZE") &&
              !(team.classId === "LMGT3" && p.rating !== "BRONZE"),
          )
          .map((p) => ({ p, score: offseasonCandidateScore(world, team, p) }))
          .sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id));
        const chosen = candidates[0]?.p;
        if (!chosen) continue;
        const sourceSeries = chosen.seriesId;
        chosen.teamId = team.id;
        chosen.seriesId = team.seriesId;
        chosen.contractEndSeason = completedSeason + 1 + Math.floor(worldRandom(world) * 3);
        chosen.salary = Number(
          Math.max(chosen.salary, cfg.budget * (role === "DRIVER" ? 0.035 : 0.008) * (0.6 + chosen.skill / 100)).toFixed(4),
        );
        addWorldActivity(world, {
          id: `activity_s${completedSeason}_signing_${team.id}_${chosen.id}`,
          season: completedSeason,
          seriesId: team.seriesId,
          type:
            role !== "DRIVER"
              ? "STAFF_MOVE"
              : sourceSeries !== team.seriesId
                ? "PROMOTION"
                : "SIGNING",
          personId: chosen.id,
          fromTeamId: null,
          toTeamId: team.id,
          headline:
            role === "DRIVER"
              ? `${team.name} verpflichtet ${chosen.name}`
              : `${chosen.name} wechselt zu ${team.name}`,
          detail:
            role === "DRIVER" && sourceSeries !== team.seriesId
              ? `${chosen.name} steigt von ${sourceSeries} in die ${team.seriesId} auf und unterschreibt bis Saison ${chosen.contractEndSeason}.`
              : `${chosen.name} joins ${team.name} through season ${chosen.contractEndSeason}.`,
        });
        if (role === "DRIVER") {
          team.drivers.push(chosen.id);
          const vacantCrew = team.raceCrews?.find(
            (crew) =>
              world.people.find((person) => person.id === crew.leadId)?.teamId !==
              team.id,
          );
          if (vacantCrew) vacantCrew.leadId = chosen.id;
        } else team.staff.push(chosen.id);
      }
    }

    // A world simulation must never enter a season with an AI structural
    // vacancy. If the preferred specialty market is exhausted, use the best
    // remaining free specialist of the exact role as a one-year fallback.
    for (const role of ["TECHNICAL_DIRECTOR", "SPORTING_DIRECTOR", "RACE_ENGINEER"] as const) {
      if (
        team.staff.some(
          (id) => world.people.find((person) => person.id === id)?.role === role,
        )
      )
        continue;
      const fallback = world.people
        .filter((person) => !person.teamId && person.role === role)
        .sort(
          (a, b) =>
            b.skill - a.skill ||
            b.potential - a.potential ||
            a.id.localeCompare(b.id),
        )[0];
      if (fallback) {
        fallback.teamId = team.id;
        fallback.seriesId = team.seriesId;
        fallback.contractEndSeason = completedSeason + 1;
        team.staff.push(fallback.id);
        addWorldActivity(world, {
          id: `activity_s${completedSeason}_fallback_${team.id}_${fallback.id}`,
          season: completedSeason,
          seriesId: team.seriesId,
          type: "STAFF_MOVE",
          personId: fallback.id,
          fromTeamId: null,
          toTeamId: team.id,
          headline: `${team.name} besetzt eine wichtige Personalstelle`,
          detail: `${fallback.name} kommt als ${roleName(role)} mit einem Einjahresvertrag.`,
        });
      }
    }
  }
}

export function nextWorldSeason(flow: RoundFlowState) {
  const c = flow.career!,
    w = c.world;
  if (!w) return;
  for (const table of w.series) {
    for (const classId of table.seriesId === "WEC" ? ["HYPERCAR", "LMGT3"] as const : [undefined]) {
    w.history.push({
      season: w.season,
      seriesId: table.seriesId,
      ...(classId ? { classId } : {}),
      driverId:
        table.drivers.filter((d) => !classId || d.classId === classId).sort(
          (a, b) => b.points - a.points || b.wins - a.wins,
        )[0]?.personId ?? null,
      teamId:
        classId === "LMGT3" ? [...(table.entries ?? [])].filter((e) => e.classId === "LMGT3").sort((a, b) => b.points - a.points)[0]?.teamId ?? null :
        table.teams.filter((t) => !classId || t.classId === classId).sort((a, b) => b.points - a.points)[0]?.teamId ?? null,
    });
    }
  }
  runAiOffseason(w);
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
      ...(w.teams.find((t) => t.id === p.teamId)?.classId ? { classId: w.teams.find((t) => t.id === p.teamId)!.classId } : {}),
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

