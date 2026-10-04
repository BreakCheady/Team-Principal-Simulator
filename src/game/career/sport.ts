import {
  createWeekend,
  runWeekend,
  classify,
  summarize,
} from "@/game/racing/engine";
import { playerTeam } from "@/game/world/world";
import type { RoundFlowState } from "@/game/season/round-flow";
import { processRound } from "@/game/season/round-events";
import {
  bookFinanceTransaction,
  getCashBalance,
} from "@/game/finance/finances";
import { careerCopy, logCareer } from "./market";
import type { CareerState } from "./state";

export function random(career: CareerState): number {
  let x = career.seed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  career.seed = x >>> 0;
  return career.seed / 4294967296;
}
export const PROJECTS = {
  AERO: { cost: 3, duration: 4, risk: 25, gain: 7 },
  RELIABILITY: { cost: 2, duration: 3, risk: 12, gain: 9 },
  OPERATIONS: { cost: 1.2, duration: 2, risk: 8, gain: 8 },
} as const;
export function startDevelopment(
  source: RoundFlowState,
  kind: keyof typeof PROJECTS,
): RoundFlowState {
  const next = careerCopy(source),
    career = next.career;
  if (career.status !== "RUNNING")
    throw new Error("Development opens during a running season.");
  if (!Object.hasOwn(PROJECTS, kind))
    throw new Error("Unknown development project.");
  if (
    career.projects.filter((p) => p.status === "ACTIVE").length >= 2 ||
    career.projects.some((p) => p.kind === kind && p.status === "ACTIVE")
  )
    throw new Error(
      "Two development slots are available; only one active project of each type.",
    );
  const base = PROJECTS[kind];
  const scale = career.world ? playerTeam(career.world).budget / 120 : 1;
  const spec = { ...base, cost: Number((base.cost * scale).toFixed(6)) };
  const sponsor = career.seats.find(
    (s) => s.seat === (kind === "OPERATIONS" ? "SPORTING" : "TECHNICAL"),
  )?.characterId;
  if (!sponsor)
    throw new Error(
      "Fill the responsible leadership seat before starting this project.",
    );
  if (getCashBalance(next.political) < spec.cost)
    throw new Error("Insufficient cash for development.");
  const id = `project_${kind.toLowerCase()}_r${next.currentRound}`;
  if (career.projects.some((p) => p.id === id))
    throw new Error("This project was already commissioned this round.");
  const actor = next.political.characters.find((c) => c.id === sponsor)!;
  const overload = career.projects.some((p) => p.status === "ACTIVE") ? 10 : 0;
  const risk = Math.min(
    90,
    spec.risk +
      Math.floor(actor.dynamic.politicalFatigue / 10) +
      overload -
      Math.floor((actor.power.sportingLeverage - 65) / 8),
  );
  next.political = bookFinanceTransaction(next.political, {
    id,
    round: Math.max(1, next.currentRound),
    category: "DEVELOPMENT_COST",
    amountMillions: spec.cost,
    description: `Development: ${kind}`,
  });
  career.projects.push({
    id,
    kind,
    startedRound: next.currentRound,
    dueRound: next.currentRound + spec.duration,
    cost: spec.cost,
    risk,
    status: "ACTIVE",
    sponsorId: sponsor,
  });
  next.political.characters.find(
    (c) => c.id === sponsor,
  )!.dynamic.politicalFatigue = Math.min(
    100,
    actor.dynamic.politicalFatigue + 6,
  );
  logCareer(
    next,
    `${kind} commissioned for €${spec.cost}m, due R${next.currentRound + spec.duration}; failure risk ${risk}%.`,
  );
  return next;
}
export function completeDevelopment(flow: RoundFlowState): RoundFlowState {
  const next = careerCopy(flow),
    career = next.career;
  for (const project of career.projects.filter(
    (p) => p.status === "ACTIVE" && p.dueRound <= next.currentRound,
  )) {
    const present =
      project.sponsorId && career.activeActorIds.includes(project.sponsorId);
    const success =
      random(career) * 100 >= Math.min(95, project.risk + (present ? 0 : 25));
    project.status = success ? "SUCCEEDED" : "FAILED";
    const actor = next.political.characters.find(
      (c) => c.id === project.sponsorId,
    );
    if (success) {
      if (project.kind === "AERO")
        career.car.pace = Math.min(100, career.car.pace + PROJECTS.AERO.gain);
      if (project.kind === "RELIABILITY")
        career.car.reliability = Math.min(
          100,
          career.car.reliability + PROJECTS.RELIABILITY.gain,
        );
      if (project.kind === "OPERATIONS" && actor)
        actor.power.sportingLeverage = Math.min(
          100,
          actor.power.sportingLeverage + PROJECTS.OPERATIONS.gain,
        );
      if (actor && present) {
        actor.power.internalInfluence = Math.min(
          100,
          actor.power.internalInfluence + 5,
        );
        actor.dynamic.momentum = Math.min(25, actor.dynamic.momentum + 3);
      }
    } else if (actor && present) {
      actor.dynamic.instability = Math.min(100, actor.dynamic.instability + 8);
      actor.dynamic.momentum = Math.max(-25, actor.dynamic.momentum - 3);
    }
    logCareer(
      next,
      `${project.kind} ${success ? "delivered; sporting capacity and sponsor influence improve" : "failed; costs remain spent and technical pressure rises"}.`,
    );
  }
  return next;
}
export function teamTable(career: CareerState) {
  const teams = new Map<string, number>();
  // Driver moves preserve historical constructor points through race records.
  for (const race of career.races.filter((r) => r.season === career.season))
    for (const r of race.summary?.teamPoints ?? race.results)
      if (r.team !== "Departed")
        teams.set(r.team, (teams.get(r.team) ?? 0) + r.points);
  const ourTeam = career.world ? playerTeam(career.world).name : "Vanguard";
  if (career.world)
    for (const team of career.world.teams.filter(
      (t) => t.seriesId === career.world!.playerSeriesId,
    ))
      if (!teams.has(team.name)) teams.set(team.name, 0);
  if (!teams.has(ourTeam)) teams.set(ourTeam, 0);
  return [...teams]
    .map(([team, points]) => ({ team, points }))
    .sort((a, b) => b.points - a.points || a.team.localeCompare(b.team));
}
export function simulateRace(source: RoundFlowState): RoundFlowState {
  const next = structuredClone(source),
    career = next.career!;
  if (career.races.some((r) => r.round === next.currentRound))
    throw new Error("Race was already simulated.");
  if (
    career.weekend &&
    !career.weekend.committed &&
    career.weekend.round !== next.currentRound
  )
    throw new Error("Finish the active race before advancing its calendar.");
  const weekend =
    career.weekend && !career.weekend.committed
      ? career.weekend
      : createWeekend(next);
  if (weekend.phase !== "COMPLETE") runWeekend(weekend);
  career.weekend = weekend;
  const ourTeam = career.world ? playerTeam(career.world).name : "Vanguard";
  const budget = career.world ? playerTeam(career.world).budget : 120;
  const summary = summarize(weekend, budget),
    cars = classify(weekend);
  const results = cars.map((car, index) => ({
    characterId: car.id,
    name: car.name,
    team: car.team,
    position: index + 1,
    points: car.finishPoints + car.bonusPoints,
    dnf: car.retired || car.dsq,
    score: -(car.totalSeconds + car.penaltySeconds),
  }));
  for (const [index, car] of cars.entries()) {
    const entry = summary.entries[index];
    for (const driver of entry.crew) {
      let standing = career.standings.find((s) => s.id === driver.id);
      if (!standing) {
        const person = career.world?.people.find((p) => p.id === driver.id);
        standing = {
          id: driver.id,
          name: driver.name,
          team: car.team,
          skill: person?.skill ?? car.skill,
          points: 0,
          wins: 0,
          podiums: 0,
        };
        career.standings.push(standing);
      }
      if (driver.eligible) {
        standing.points += results[index].points;
        standing.wins += car.raceWins;
        standing.podiums += car.racePodiums;
      }
      const actor = next.political.characters.find((c) => c.id === driver.id);
      if (actor && car.ours) {
        actor.dynamic.momentum = Math.max(
          -25,
          Math.min(
            25,
            actor.dynamic.momentum +
              (car.retired || car.dsq ? -3 : index < 3 ? 3 : 1),
          ),
        );
        actor.dynamic.instability = Math.max(
          0,
          Math.min(
            100,
            actor.dynamic.instability + (car.retired || car.dsq ? 4 : -1),
          ),
        );
      }
    }
    if (entry.repairCost > 0)
      next.political = bookFinanceTransaction(next.political, {
        id: `race_repair_${car.id}_r${next.currentRound}`,
        round: next.currentRound,
        category: "OPERATING_COST",
        amountMillions: entry.repairCost,
        description: `Race damage and spares: ${car.name}`,
      });
  }
  career.races.push({
    round: next.currentRound,
    season: career.season,
    results,
    summary,
  });
  for (const order of weekend.teamOrders) {
    const giver = next.political.characters.find((c) => c.id === order.giver);
    const principal = next.political.characters.find(
      (c) => c.role === "TEAM_PRINCIPAL",
    )!;
    const relation = next.political.relationships.find(
      (r) =>
        r.fromCharacterId === order.giver && r.toCharacterId === principal.id,
    );
    if (giver) {
      giver.dynamic.instability = Math.min(
        100,
        giver.dynamic.instability + (order.obeyed ? 3 : 7),
      );
      giver.career.transferInterest = Math.min(
        100,
        giver.career.transferInterest + (order.obeyed ? 2 : 5),
      );
    }
    if (relation) {
      relation.resentment = Math.min(
        100,
        relation.resentment + (order.obeyed ? 6 : 10),
      );
      relation.trust = Math.max(0, relation.trust - 4);
    }
    const id = `race_order_${order.giver}_r${next.currentRound}`;
    if (giver && !career.requests.some((r) => r.id === id))
      career.requests.push({
        id,
        characterId: giver.id,
        round: next.currentRound,
        kind: "AUTHORITY",
        contractId: null,
        optionId: null,
        contractEndRound: null,
        summary: `${giver.name} wants an explanation for the team order and future sporting equality.`,
        deadline: next.currentRound + 2,
        status: "OPEN",
      });
  }
  const slowService = weekend.events.some(
    (e) =>
      e.kind === "PIT" &&
      e.text.includes("slow service") &&
      cars.some((c) => c.id === e.carId && c.ours),
  );
  if (slowService) {
    const staffId = career.seats.find(
      (s) => s.seat === "ENGINEERING",
    )?.characterId;
    const actor = next.political.characters.find((c) => c.id === staffId);
    if (actor) {
      actor.dynamic.politicalFatigue = Math.min(
        100,
        actor.dynamic.politicalFatigue + 4,
      );
      const id = `race_staff_r${next.currentRound}`;
      career.requests.push({
        id,
        characterId: actor.id,
        round: next.currentRound,
        kind: "STAFF",
        contractId: null,
        optionId: null,
        contractEndRound: null,
        summary: "Pit crew asks for support after a costly service mistake.",
        deadline: next.currentRound + 2,
        status: "OPEN",
      });
    }
  }
  const sponsor = next.political.characters.find(
    (c) => c.role === "SPONSOR_REPRESENTATIVE",
  );
  if (
    sponsor &&
    results.some((r) => r.team === ourTeam && r.position <= 3 && !r.dnf)
  )
    sponsor.power.commercialBacking = Math.min(
      100,
      sponsor.power.commercialBacking + 1,
    );
  const ordered = [...career.standings].sort(
    (a, b) =>
      b.points - a.points || b.wins - a.wins || a.id.localeCompare(b.id),
  );
  const teamPosition =
    teamTable(career).findIndex((t) => t.team === ourTeam) + 1;
  const drivers = career.activeActorIds.filter(
    (id) =>
      next.political.characters
        .find((c) => c.id === id)
        ?.role.includes("DRIVER") && ordered.some((s) => s.id === id),
  );
  const applied = processRound(next.political, next.currentRound, [
    {
      id: `race_r${next.currentRound}`,
      round: next.currentRound,
      type: "RACE_RESULT",
      title: `${weekend.venue}: ${results.find((r) => !r.dnf)?.name ?? "no finisher"}`,
      summary:
        results
          .filter((r) => r.team === ourTeam)
          .map(
            (r) =>
              `${r.name}: ${r.dnf ? "DNF / DSQ" : `P${r.position}`}, ${r.points} points`,
          )
          .join(" · ") || `All ${ourTeam} driver seats are vacant.`,
      effects: [],
      contractPerformance: drivers.map((id) => {
        const s = ordered.find((s) => s.id === id)!;
        return {
          characterId: id,
          snapshot: {
            points: s.points,
            wins: s.wins,
            podiums: s.podiums,
            driverChampionshipPosition: ordered.indexOf(s) + 1,
            teamChampionshipPosition: teamPosition,
          },
        };
      }),
    },
  ]);
  next.political = applied.nextState;
  const history = next.history.at(-1);
  if (history) history.events.push(...applied.events);
  weekend.committed = true;
  return next;
}
