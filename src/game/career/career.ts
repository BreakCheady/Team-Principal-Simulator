import { getSeries } from "@/game/world/series";
import { playerTeam } from "@/game/world/world";
import { advanceWorld, nextWorldSeason } from "@/game/world/simulation";
import { createWeekend, runWeekend } from "@/game/racing/engine";
import { registerPlayerCrews } from "@/game/racing/crews";
import {
  advanceRoundFlow,
  createRoundFlowState,
  getOpenIssues,
  type RoundFlowState,
} from "@/game/season/round-flow";
import type { RoundEventDefinition } from "@/game/season/round-events";
import type { IssueDefinition } from "@/game/issues/issues";
import type { PoliticalCoreState } from "@/game/political/types";
import { validatePoliticalCoreState } from "@/game/political/validation";
import {
  bookFinanceTransaction,
  getCashBalance,
} from "@/game/finance/finances";
import { createCareer, createCandidates, validateCareer } from "./state";
import { careerCopy, logCareer } from "./market";
import { advanceActors } from "./actors";
import { completeDevelopment, simulateRace, teamTable } from "./sport";

export function createCareerFlow(
  political: PoliticalCoreState,
  events: RoundEventDefinition[],
  afterRound: number,
): RoundFlowState {
  const flow = createRoundFlowState(political, events, afterRound);
  flow.career = createCareer(flow.political, afterRound);
  // Scenario staff without a modeled deal get an explicit ongoing employment contract.
  for (const seat of flow.career.seats) {
    if (
      !seat.characterId ||
      flow.political.contracts.some(
        (contract) => contract.characterId === seat.characterId,
      )
    )
      continue;
    const actor = flow.political.characters.find(
      (c) => c.id === seat.characterId,
    )!;
    const salary = seat.seat === "ENGINEERING" ? 1.5 : 2;
    flow.political.contracts.push({
      id: `contract_${actor.id}_career_r${afterRound}`,
      characterId: actor.id,
      employer: "Vanguard Racing",
      status: "ACTIVE",
      signedRound: afterRound,
      startRound: afterRound,
      endRound: afterRound + 24,
      salaryMillionsPerSeason: salary,
      guaranteedSalaryMillions: salary,
      salaryPaidMillions: 0,
      options: [],
      releaseClauses: [],
      performanceTriggers: [],
      earnedBonusesMillions: 0,
    });
  }
  flow.scheduledRounds = Array.from(
    { length: flow.career.seasonEnd - afterRound },
    (_, i) => afterRound + i + 1,
  );
  flow.complete = flow.scheduledRounds.length === 0;
  if (flow.complete) flow.career.status = "REVIEW";
  return flow;
}
export function reviewSeason(source: RoundFlowState): RoundFlowState {
  const next = careerCopy(source),
    c = next.career;
  if (next.currentRound !== c.seasonEnd || !next.complete)
    throw new Error("Finish every scheduled round before the board review.");
  if (c.reviews.some((r) => r.season === c.season))
    throw new Error("Season was already reviewed.");
  const team = c.world ? playerTeam(c.world) : null;
  const teamPosition =
    teamTable(c).findIndex((t) => t.team === (team?.name ?? "Vanguard")) + 1;
  const prize = team
    ? Number(
        (team.budget * Math.max(0.04, 0.3 - teamPosition * 0.014)).toFixed(6),
      )
    : Math.max(6, 42 - teamPosition * 3);
  next.political = bookFinanceTransaction(next.political, {
    id: `prize_s${c.season}`,
    round: next.currentRound,
    category: "PRIZE_INCOME",
    amountMillions: prize,
    description: `Season ${c.season} constructor prize`,
  });
  const cash = getCashBalance(next.political);
  const stability =
    c.activeActorIds.reduce(
      (sum, id) =>
        sum +
        100 -
        next.political.characters.find((a) => a.id === id)!.dynamic.instability,
      0,
    ) / Math.max(1, c.activeActorIds.length);
  const sport = Math.max(
    0,
    35 - Math.max(0, teamPosition - c.targets.teamPosition) * 12,
  );
  const finances =
    cash >= c.targets.cash ? 30 : Math.max(0, 30 - (c.targets.cash - cash) * 2);
  const politics =
    stability >= c.targets.stability
      ? 35
      : Math.max(0, 35 - (c.targets.stability - stability));
  const score = Math.round(sport + finances + politics);
  if (score < 60) c.warnings++;
  else c.warnings = 0;
  const verdict =
    score < 30 || c.warnings >= 2
      ? "DISMISSED"
      : score < 60
        ? "WARNING"
        : "RETAINED";
  c.reviews.push({
    season: c.season,
    round: next.currentRound,
    teamPosition,
    cash,
    stability,
    score,
    verdict,
    prize,
  });
  c.status = verdict === "DISMISSED" ? "DISMISSED" : "REVIEW";
  next.complete = true;
  const principal = next.political.characters.find(
    (a) => a.role === "TEAM_PRINCIPAL",
  )!;
  principal.dynamic.institutionalReputation = Math.max(
    0,
    Math.min(
      100,
      principal.dynamic.institutionalReputation +
        (verdict === "RETAINED" ? 5 : -15),
    ),
  );
  logCareer(
    next,
    `Board review: P${teamPosition}, cash €${cash.toFixed(2)}m, stability ${stability.toFixed(0)}. Score ${score}/100: ${verdict}. Prize €${prize}m.`,
  );
  return next;
}
export function beginCareerWeekend(
  source: RoundFlowState,
  events: RoundEventDefinition[],
  definitions: IssueDefinition[] = [],
): RoundFlowState {
  if (!source.career) return advanceRoundFlow(source, events, definitions);
  if (source.career.status !== "RUNNING")
    throw new Error("Start a new season or reset after dismissal.");
  if (source.career.weekend && !source.career.weekend.committed)
    throw new Error("Finish the current race weekend first.");
  source = structuredClone(source);
  delete source.career!.weekend;
  registerPlayerCrews(source);
  // Authored politics are a one-time introductory story. Sporting results always come from the simulator.
  const activeEvents = events
    .filter(
      (e) =>
        e.round > source.currentRound &&
        e.type !== "RACE_RESULT" &&
        e.effects.every((effect) => {
          if ("characterId" in effect)
            return source.career!.activeActorIds.includes(effect.characterId);
          if ("fromCharacterId" in effect)
            return (
              source.career!.activeActorIds.includes(effect.fromCharacterId) &&
              source.career!.activeActorIds.includes(effect.toCharacterId)
            );
          if ("goalId" in effect)
            return source.political.goals.find((g) => g.id === effect.goalId)
              ?.active;
          if ("leverageId" in effect)
            return source.political.leverages.find(
              (l) => l.id === effect.leverageId,
            )?.active;
          return true;
        }),
    )
    .map((e) => ({ ...e, contractPerformance: undefined }));
  let next = advanceRoundFlow(source, activeEvents, definitions);
  // advanceRoundFlow explicitly copies its fields; preserve the campaign counters and PRNG.
  next.career = structuredClone(source.career);
  next = completeDevelopment(next);
  next = advanceActors(next);
  next.career!.weekend = createWeekend(next);
  next.complete = false;
  return next;
}
export function finishCareerWeekend(source: RoundFlowState): RoundFlowState {
  if (
    !source.career?.weekend ||
    source.career.weekend.phase !== "COMPLETE" ||
    source.career.weekend.committed
  )
    throw new Error("The race has not finished or was already committed.");
  let next = simulateRace(source);
  next.complete = next.nextRoundIndex >= next.scheduledRounds.length;
  advanceWorld(next);
  for (const actor of next.political.characters.filter((a) =>
    next.career!.activeActorIds.includes(a.id),
  ))
    actor.dynamic.politicalFatigue = Math.max(
      0,
      actor.dynamic.politicalFatigue - 1,
    );
  if (next.currentRound === next.career!.seasonEnd) next = reviewSeason(next);
  if (
    getCashBalance(next.political) <
      -(next.career!.world
        ? playerTeam(next.career!.world).budget * 0.2
        : 25) &&
    next.career!.status !== "DISMISSED"
  ) {
    next.career!.status = "DISMISSED";
    next.complete = true;
    logCareer(
      next,
      `Owner ends your tenure after cash falls below −€${next.career!.world ? (playerTeam(next.career!.world).budget * 0.2).toFixed(2) : 25}m.`,
    );
  }
  const valid = validatePoliticalCoreState(next.political);
  if (!valid.success)
    throw new Error("Career progression produced invalid political data.");
  next.political = valid.data;
  next.career = validateCareer(next.career, next.political, next.currentRound);
  return next;
}
export function advanceCareerFlow(
  source: RoundFlowState,
  events: RoundEventDefinition[],
  definitions: IssueDefinition[] = [],
): RoundFlowState {
  if (!source.career) return advanceRoundFlow(source, events, definitions);
  const next =
    source.career.weekend && !source.career.weekend.committed
      ? structuredClone(source)
      : beginCareerWeekend(source, events, definitions);
  runWeekend(next.career!.weekend!);
  return finishCareerWeekend(next);
}
export function startNextSeason(
  source: RoundFlowState,
  ambition: "CONSOLIDATE" | "CHALLENGE" = "CONSOLIDATE",
): RoundFlowState {
  const next = careerCopy(source),
    c = next.career;
  if (
    c.status !== "REVIEW" ||
    next.currentRound !== c.seasonEnd ||
    !c.reviews.some((r) => r.season === c.season)
  )
    throw new Error("Complete the current season and board review first.");
  if (getOpenIssues(next).length)
    throw new Error("Handle open inbox issues before the new season.");
  if (!["CONSOLIDATE", "CHALLENGE"].includes(ambition))
    throw new Error("Unknown season objective.");
  const length = c.world ? getSeries(c.world.playerSeriesId).rounds : 24;
  c.season++;
  c.seasonStart = next.currentRound + 1;
  c.seasonEnd = next.currentRound + length;
  c.status = "RUNNING";
  delete c.weekend;
  c.targets = {
    teamPosition: ambition === "CHALLENGE" ? 2 : 5,
    cash:
      ambition === "CHALLENGE"
        ? c.world
          ? Number((playerTeam(c.world).budget * 0.04).toFixed(3))
          : 5
        : 0,
    stability: ambition === "CHALLENGE" ? 65 : 55,
  };
  next.scheduledRounds = Array.from(
    { length },
    (_, i) => next.currentRound + i + 1,
  );
  next.nextRoundIndex = 0;
  next.complete = false;
  c.car.pace = Math.max(35, c.car.pace - 6);
  c.car.reliability = Math.max(45, c.car.reliability - 3);
  // Standings reset; race history keeps constructor points attributed to the team at the race date.
  c.standings.forEach((s) => {
    s.points = 0;
    s.wins = 0;
    s.podiums = 0;
  });
  const market = c.world
    ? []
    : createCandidates(next.political, next.currentRound);
  for (const candidate of market)
    if (!c.activeActorIds.includes(candidate.character.id)) {
      const old = c.candidates.find((x) => x.id === candidate.id);
      if (old) Object.assign(old, candidate);
      else c.candidates.push(candidate);
    }
  nextWorldSeason(next);
  next.political.finance.ownerFundingUsed = false;
  const last = c.reviews.at(-1)!;
  next.political.finance.sponsorIncomeMillionsPerRound = c.world
    ? Number(
        (
          ((playerTeam(c.world).budget * 0.65) / length) *
          (1.05 - last.teamPosition * 0.005)
        ).toFixed(6),
      )
    : Math.max(1.2, 2.6 - last.teamPosition * 0.1);
  logCareer(
    next,
    `Season ${c.season} starts. Targets: constructors P${c.targets.teamPosition}, cash €${c.targets.cash}m, stability ${c.targets.stability}. Car loses pace under the new regulations; contracts keep their absolute round dates.`,
  );
  return next;
}
export function setRaceStrategy(
  source: RoundFlowState,
  strategy: "BALANCED" | "ATTACK" | "CONSERVE",
): RoundFlowState {
  const next = careerCopy(source);
  if (!["BALANCED", "ATTACK", "CONSERVE"].includes(strategy))
    throw new Error("Unknown strategy.");
  next.career.strategy = strategy;
  return next;
}
