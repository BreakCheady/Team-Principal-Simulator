import { getSeries, pointsForEvent } from "@/game/world/series";
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
    for (const r of race.results)
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
  const next = careerCopy(source),
    career = next.career;
  if (career.races.some((r) => r.round === next.currentRound))
    throw new Error("Race was already simulated.");
  const ourTeam = career.world ? playerTeam(career.world).name : "Vanguard";
  const cfg = career.world ? getSeries(career.world.playerSeriesId) : null;
  const event = cfg?.calendar[next.currentRound - career.seasonStart];
  const drivers = career.seats
    .filter((s) => s.seat.startsWith("DRIVER") && s.characterId)
    .flatMap((s) => s.characterId!);
  const staff = (seat: string) =>
    next.political.characters.find(
      (c) => c.id === career.seats.find((s) => s.seat === seat)?.characterId,
    );
  const sporting = staff("SPORTING"),
    technical = staff("TECHNICAL"),
    engineering = staff("ENGINEERING");
  const operation =
    (sporting?.power.sportingLeverage ?? 25) * 0.07 +
    (engineering?.power.sportingLeverage ?? 25) * 0.04;
  const stability =
    career.activeActorIds.reduce(
      (sum, id) =>
        sum +
        (100 -
          next.political.characters.find((c) => c.id === id)!.dynamic
            .instability),
      0,
    ) / Math.max(1, career.activeActorIds.length);
  const strategy =
    career.strategy === "ATTACK" ? 5 : career.strategy === "CONSERVE" ? -3 : 0;
  const starters = career.standings.filter(
    (s) =>
      s.team !== "Departed" && (s.team !== ourTeam || drivers.includes(s.id)),
  );
  const results = starters
    .map((s) => {
      const ours = s.team === ourTeam,
        actor = next.political.characters.find((c) => c.id === s.id);
      const worldPerson = career.world?.people.find((p) => p.id === s.id);
      const rivalTeam = career.world?.teams.find(
        (t) => t.name === s.team && t.seriesId === career.world!.playerSeriesId,
      );
      const pace = ours
        ? career.car.pace
        : (rivalTeam?.pace ?? Math.min(96, 58 + s.skill * 0.4));
      const reliability = ours
        ? career.car.reliability
        : (rivalTeam?.reliability ?? 88);
      const dnfRisk = ours
        ? Math.max(
            1,
            (100 - reliability) * 0.35 +
              (career.strategy === "ATTACK"
                ? 5
                : career.strategy === "CONSERVE"
                  ? -3
                  : 0) +
              (technical ? 0 : 7),
          )
        : (100 - reliability) * 0.35;
      const eventRisk =
        event?.kind === "ENDURANCE" ? 4 : cfg?.category === "RALLY" ? 3 : 0;
      const dnf = random(career) * 100 < dnfRisk + eventRisk;
      const score =
        pace * 0.55 +
        s.skill * 0.35 +
        (ours
          ? operation +
            (technical?.power.sportingLeverage ?? 25) * 0.03 +
            strategy +
            stability * 0.03 +
            (actor?.dynamic.momentum ?? 0) * 0.18
          : 8) +
        (worldPerson && (cfg?.category === "RALLY" || event?.kind === "OVAL")
          ? worldPerson.terrainSkill * 0.15
          : 0) +
        (worldPerson?.consistency ?? 0) * 0.03 +
        random(career) * 24 -
        (ours ? (actor?.dynamic.politicalFatigue ?? 0) * 0.03 : 0);
      return {
        characterId: s.id,
        name: s.name,
        team: s.team,
        position: 0,
        points: 0,
        dnf,
        score,
      };
    })
    .sort(
      (a, b) =>
        Number(a.dnf) - Number(b.dnf) ||
        b.score - a.score ||
        a.characterId.localeCompare(b.characterId),
    );
  const points = cfg
    ? pointsForEvent(cfg, next.currentRound - career.seasonStart)
    : [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  results.forEach((r, index) => {
    r.position = index + 1;
    r.points = r.dnf ? 0 : (points[index] ?? 0);
    const standing = career.standings.find((s) => s.id === r.characterId)!;
    standing.points += r.points;
    if (!r.dnf && index === 0) standing.wins++;
    if (!r.dnf && index < 3) standing.podiums++;
    if (r.team === ourTeam) {
      const actor = next.political.characters.find(
        (c) => c.id === r.characterId,
      )!;
      actor.dynamic.momentum = Math.max(
        -25,
        Math.min(
          25,
          actor.dynamic.momentum +
            (r.dnf ? -3 : r.position <= 3 ? 3 : r.position <= 10 ? 1 : -1),
        ),
      );
      actor.dynamic.instability = Math.max(
        0,
        Math.min(100, actor.dynamic.instability + (r.dnf ? 4 : -1)),
      );
    }
  });
  career.races.push({
    round: next.currentRound,
    season: career.season,
    results,
  });
  const ordered = [...career.standings].sort(
    (a, b) =>
      b.points - a.points || b.wins - a.wins || a.id.localeCompare(b.id),
  );
  const teamPosition =
    teamTable(career).findIndex((t) => t.team === ourTeam) + 1;
  const applied = processRound(next.political, next.currentRound, [
    {
      id: `race_r${next.currentRound}`,
      round: next.currentRound,
      type: "RACE_RESULT",
      title: `${event?.name ?? `Grand Prix ${next.currentRound - career.seasonStart + 1}`}: ${results.find((r) => !r.dnf)?.name ?? "no classified finisher"}`,
      summary:
        results
          .filter((r) => r.team === ourTeam)
          .map(
            (r) =>
              `${r.name}: ${r.dnf ? "DNF" : `P${r.position}, ${r.points} points`}`,
          )
          .join(" · ") ||
        `All ${ourTeam} driver seats are vacant; no team starter.`,
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
  return next;
}
