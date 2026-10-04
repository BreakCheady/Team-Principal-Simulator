import type { PoliticalCoreState } from "@/game/political/types";
import { createTeamFinance } from "@/game/finance/defaults";
import { createCareerFlow } from "@/game/career/career";
import type { RoundFlowState } from "@/game/season/round-flow";
import type { Seat } from "@/game/career/state";
import { ensureWorldCrews, supportIds } from "@/game/racing/crews";
import { getSeries, type SeriesId } from "./series";
import {
  createWorld,
  playerTeam,
  characterFromPerson,
  worldCandidates,
} from "./world";

export function createNewCareer(
  seriesId: SeriesId = "F1",
  teamId?: string,
): RoundFlowState {
  const world = createWorld(seriesId, teamId),
    team = playerTeam(world),
    cfg = getSeries(seriesId);
  ensureWorldCrews(world);
  const support = supportIds(world, team.id);
  const roster = [...team.drivers, ...support, ...team.staff, team.principalId];
  const characters = roster.map((id) =>
    characterFromPerson(world.people.find((p) => p.id === id)!),
  );
  characters
    .filter((c) => c.role === "DRIVER")
    .forEach((c, i) => {
      c.role = i === 0 ? "STAR_DRIVER" : i === 1 ? "SECOND_DRIVER" : "DRIVER";
    });
  const principal = characters.find((c) => c.role === "TEAM_PRINCIPAL")!;
  for (const [id, name, role] of [
    ["char_world_owner", "Alex Morgan", "OWNER_REPRESENTATIVE"],
    ["char_world_sponsor", "Nora Sterling", "SPONSOR_REPRESENTATIVE"],
  ] as const) {
    const c = structuredClone(principal);
    c.id = id;
    c.name = name;
    c.role = role;
    c.power.formalAuthority = role === "OWNER_REPRESENTATIVE" ? 90 : 25;
    c.power.commercialBacking = 85;
    characters.push(c);
  }
  const finance = createTeamFinance(0);
  Object.assign(finance, {
    openingBalanceMillions: Number((team.budget * 0.25).toFixed(6)),
    roundsPerSeason: cfg.rounds,
    operatingCostMillionsPerRound: Number(
      ((team.budget * 0.5) / cfg.rounds).toFixed(6),
    ),
    sponsorIncomeMillionsPerRound: Number(
      ((team.budget * 0.65) / cfg.rounds).toFixed(6),
    ),
    ownerIncomeMillionsPerRound: Number(
      ((team.budget * 0.25) / cfg.rounds).toFixed(6),
    ),
    payrollBudgetMillionsPerSeason: Number(
      (team.budget * (support.length ? 0.48 : 0.32)).toFixed(6),
    ),
    commitmentBudgetMillions: Number((team.budget * 1.5).toFixed(6)),
  });
  const political: PoliticalCoreState = {
    characters,
    finance,
    contracts: [],
    goals: [],
    leverages: [],
    precedents: [],
    conflicts: [],
    relationships: [],
  };
  for (const c of characters) {
    const goalId = `goal_${c.id}_season`;
    c.goalIds = [goalId];
    political.goals.push({
      id: goalId,
      characterId: c.id,
      type: c.role.includes("DRIVER")
        ? "WIN_CHAMPIONSHIP"
        : c.role === "TECHNICAL_DIRECTOR"
          ? "BUILD_FASTEST_CAR"
          : c.role === "RACE_ENGINEER"
            ? "PROTECT_ENGINEERING_TEAM"
            : "MAINTAIN_TEAM_STABILITY",
      priority: 75,
      urgency: 45,
      progress: 0,
      visibility: "KNOWN",
      active: true,
    });
  }
  for (const from of characters)
    for (const to of characters)
      if (from.id !== to.id)
        political.relationships.push({
          id: `rel_${from.id}_${to.id}`,
          fromCharacterId: from.id,
          toCharacterId: to.id,
          trust: 65,
          loyalty: 55,
          respect: 70,
          dependency: 45,
          resentment: 0,
          personalLeverage: 15,
        });
  for (const id of [...team.drivers, ...support, ...team.staff]) {
    const p = world.people.find((p) => p.id === id)!;
    const seasons = p.role === "DRIVER" ? 1 : 2;
    const end = seasons * cfg.rounds;
    political.contracts.push({
      id: `contract_${id}_s1`,
      characterId: id,
      employer: team.name,
      status: "ACTIVE",
      signedRound: 1,
      startRound: 1,
      endRound: end,
      salaryMillionsPerSeason: p.salary,
      guaranteedSalaryMillions: Number((p.salary * seasons).toFixed(6)),
      salaryPaidMillions: 0,
      earnedBonusesMillions: 0,
      options: [
        {
          id: `option_${id}_s1`,
          holder: p.role === "TECHNICAL_DIRECTOR" ? "MUTUAL" : "TEAM",
          exerciseFromRound: Math.max(1, end - 4),
          exerciseUntilRound: end,
          extensionRounds: cfg.rounds,
          salaryMultiplier: 1.08,
          available: true,
          exercised: false,
        },
      ],
      releaseClauses: [
        {
          id: `release_${id}_s1`,
          amountMillions: Number((p.salary * 1.5).toFixed(6)),
          activeFromRound: Math.max(2, Math.floor(end * 0.5)),
          expiresAfterRound: end,
          beneficiary: "BOTH",
          active: true,
        },
      ],
      performanceTriggers:
        p.role === "DRIVER"
          ? [
              {
                id: `bonus_${id}_wins`,
                metric: "WINS",
                comparator: "AT_LEAST",
                threshold: 2,
                consequence: "SALARY_BONUS",
                amountMillions: Number((p.salary * 0.12).toFixed(6)),
                triggered: false,
              },
            ]
          : [],
    });
  }
  const flow = createCareerFlow(political, [], 1),
    c = flow.career!;
  c.world = world;
  flow.currentRound = 0;
  c.season = 1;
  c.seasonStart = 1;
  c.seasonEnd = cfg.rounds;
  c.seats = [
    ...team.drivers.map((id, i) => ({
      seat: (["DRIVER_ONE", "DRIVER_TWO", "DRIVER_THREE"] as Seat[])[i],
      characterId: id,
    })),
    ...team.staff.map((id) => ({
      seat: (world.people.find((p) => p.id === id)!.role ===
      "TECHNICAL_DIRECTOR"
        ? "TECHNICAL"
        : world.people.find((p) => p.id === id)!.role === "SPORTING_DIRECTOR"
          ? "SPORTING"
          : "ENGINEERING") as Seat,
      characterId: id,
    })),
  ];
  c.standings = world.people
    .filter(
      (p) =>
        p.role === "DRIVER" &&
        !world.teams.some((t) =>
          t.raceCrews?.some((c) => c.coDriverId === p.id),
        ) &&
        p.teamId &&
        world.teams.find((t) => t.id === p.teamId)?.seriesId === seriesId,
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      team: world.teams.find((t) => t.id === p.teamId)!.name,
      skill: p.skill,
      ...(world.teams.find((t) => t.id === p.teamId)?.classId ? { classId: world.teams.find((t) => t.id === p.teamId)!.classId } : {}),
      points: 0,
      wins: 0,
      podiums: 0,
    }));
  c.candidates = worldCandidates(world, political, 0);
  c.car = { pace: team.pace, reliability: team.reliability };
  c.targets = {
    teamPosition: Math.max(
      2,
      Math.min(
        cfg.teamNames.length,
        Math.ceil((100 - team.reputation) / 3) + 1,
      ),
    ),
    cash: 0,
    stability: 55,
  };
  c.log = [
    {
      round: 0,
      text: `New ${cfg.name} career with ${team.name}. The full ${cfg.rounds}-race season begins at round 1; contracts and championship counters have no previous accrual.`,
    },
  ];
  flow.scheduledRounds = Array.from({ length: cfg.rounds }, (_, i) => i + 1);
  flow.nextRoundIndex = 0;
  flow.complete = false;
  return flow;
}

