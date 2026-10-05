import { getSeries, SERIES, wecClassForTeamIndex, type SeriesId } from "./series";
import {
  WorldSchema,
  type MotorsportWorld,
  type WorldPerson,
  type WorldTeam,
} from "./schemas";
import type { Character, PoliticalCoreState } from "@/game/political/types";
import type { Candidate } from "@/game/career/state";

export function worldRandom(world: { seed: number }) {
  let x = world.seed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  world.seed = x >>> 0;
  return world.seed / 4294967296;
}
const first = [
  "Luca",
  "Sofia",
  "Noah",
  "Amelia",
  "Ren",
  "Mira",
  "Rafael",
  "Elena",
  "Marco",
  "Alex",
  "Nora",
  "Leo",
  "Maya",
  "Oscar",
  "Aiko",
  "Jonas",
  "Isabel",
  "Elias",
  "Mina",
  "Victor",
  "Clara",
  "Diego",
  "Nina",
  "Adrian",
  "Eva",
  "Mateo",
  "Sara",
  "Felix",
  "Leila",
  "Hugo",
  "Yuna",
  "Daniel",
  "Lena",
  "Theo",
  "Valeria",
  "Kai",
  "Julia",
  "Ravi",
  "Emma",
  "Malik",
  "Zoe",
  "Anton",
  "Ines",
  "Tomas",
  "Freya",
  "Nico",
  "Camila",
  "Arthur",
];
const last = [
  "Alvarez",
  "Ito",
  "Reed",
  "Silva",
  "Kovac",
  "Morelli",
  "Kessler",
  "Laurent",
  "Bellini",
  "Andersen",
  "Sato",
  "Weber",
  "Nakamura",
  "Costa",
  "Dubois",
  "Lindholm",
  "Rossi",
  "Khan",
  "Nowak",
  "Garcia",
  "Martins",
  "Chen",
  "Santos",
  "Bianchi",
  "Patel",
  "Jensen",
  "Bennett",
  "Fischer",
  "Suzuki",
  "Fernandez",
  "Novak",
  "Muller",
  "Tanaka",
  "Hamiltonne",
  "Leclercq",
  "Pereira",
  "Kim",
  "Wilson",
  "Ahmed",
  "Hansen",
  "Ivanov",
  "Berg",
  "Torres",
  "Park",
  "Riccardi",
  "Lopez",
  "Dlamini",
  "Taylor",
];
const nationalities = [
  "ESP",
  "JPN",
  "GBR",
  "BRA",
  "CRO",
  "ITA",
  "DEU",
  "FRA",
  "SWE",
  "DNK",
  "FIN",
  "NLD",
  "USA",
  "CAN",
  "MEX",
  "AUS",
  "NZL",
  "ARG",
  "IND",
  "CHN",
  "KOR",
  "ZAF",
  "POL",
  "NOR",
];
function specialties(id: SeriesId) {
  const c = getSeries(id).category;
  return SERIES.filter(
    (s) =>
      s.category === c ||
      (c === "FORMULA" && s.id === "INDYCAR") ||
      (c === "AMERICAN" && s.category === "FORMULA") ||
      ((c === "GT" || c === "PROTOTYPE") &&
        (s.category === "GT" || s.category === "PROTOTYPE")),
  ).map((s) => s.id);
}
export function createWorld(
  playerSeriesId: SeriesId = "F1",
  playerTeamId?: string,
): MotorsportWorld {
  const world: MotorsportWorld = {
    version: 1,
    season: 1,
    seed: 20261004,
    playerSeriesId,
    playerTeamId: playerTeamId ?? `team_${playerSeriesId.toLowerCase()}_0`,
    people: [],
    teams: [],
    series: [],
    history: [],
    activity: [],
  };
  let number = 0;
  const person = (
    seriesId: SeriesId,
    role: WorldPerson["role"],
    team: WorldTeam | null,
    rosterIndex: number,
  ) => {
    const cfg = getSeries(seriesId),
      r = () => worldRandom(world);
    const index = number++;
    const skill = Math.max(
      role === "DRIVER" ? cfg.minDriverSkill : 40,
      Math.min(
        96,
        Math.round(
          (team ? team.reputation : 48 + r() * 30) +
            r() * 18 -
            8 -
            rosterIndex * 2,
        ),
      ),
    );
    const age =
      role === "DRIVER" ? 16 + Math.floor(r() * 24) : 27 + Math.floor(r() * 31);
    const salary = Number(
      (
        cfg.budget *
        (role === "DRIVER" ? 0.07 : role === "TEAM_PRINCIPAL" ? 0.018 : 0.016) *
        (0.5 + skill / 100) *
        (team ? team.budget / cfg.budget : 0.8)
      ).toFixed(4),
    );
    const p: WorldPerson = {
      id: `person_${String(index + 1).padStart(5, "0")}`,
      name: `${first[index % first.length]} ${last[Math.floor(index / first.length) % last.length]}`,
      age,
      nationality: nationalities[index % nationalities.length],
      ...(role === "DRIVER" ? { rating: skill < 70 ? "BRONZE" as const : skill < 80 ? "SILVER" as const : skill < 90 ? "GOLD" as const : "PLATINUM" as const } : {}),
      role,
      seriesId,
      specialties:
        role === "DRIVER" ? specialties(seriesId) : SERIES.map((s) => s.id),
      teamId: team?.id ?? null,
      skill,
      potential: Math.min(
        100,
        skill + Math.max(0, Math.round((42 - age) * 0.6 + r() * 12)),
      ),
      experience: Math.max(0, age - (role === "DRIVER" ? 16 : 25)),
      ambition: 45 + Math.floor(r() * 50),
      compromise: 40 + Math.floor(r() * 45),
      riskTolerance: 35 + Math.floor(r() * 55),
      consistency: 45 + Math.floor(r() * 50),
      terrainSkill: 35 + Math.floor(r() * 60),
      salary,
      contractEndSeason: 1 + Math.floor(r() * 3),
    };
    world.people.push(p);
    return p.id;
  };
  for (const cfg of SERIES) {
    cfg.teamNames.forEach((name, index) => {
      const strength = Math.max(45, 90 - index * 3);
      const team: WorldTeam = {
        id: `team_${cfg.id.toLowerCase()}_${index}`,
        name,
        seriesId: cfg.id,
        ...(cfg.id === "WEC" ? { classId: wecClassForTeamIndex(index) } : {}),
        reputation: strength,
        pace: Math.max(48, 92 - index * 3),
        reliability: Math.max(70, 91 - index),
        budget: Number(
          (cfg.budget * (1.25 - index / (cfg.teamNames.length * 2))).toFixed(3),
        ),
        drivers: [],
        staff: [],
        principalId: "placeholder_id",
      };
      if (team.classId === "LMGT3") {
        team.budget = Number((team.budget * 0.18).toFixed(3));
        team.pace = Math.max(55, 88 - (index - 9) * 3);
        team.reputation = Math.max(55, 88 - (index - 9) * 3);
      }
      world.teams.push(team);
      for (let i = 0; i < cfg.driversPerTeam; i++)
        {
          const id = person(cfg.id, "DRIVER", team, i);
          team.drivers.push(id);
          if (team.classId === "LMGT3") world.people.find((p) => p.id === id)!.rating = "BRONZE";
          else if (team.classId === "HYPERCAR" && world.people.find((p) => p.id === id)!.rating === "BRONZE") world.people.find((p) => p.id === id)!.rating = "SILVER";
        }
      for (const role of [
        "TECHNICAL_DIRECTOR",
        "SPORTING_DIRECTOR",
        "RACE_ENGINEER",
      ] as const)
        team.staff.push(person(cfg.id, role, team, 0));
      team.principalId = person(cfg.id, "TEAM_PRINCIPAL", team, 0);
    });
    for (let i = 0; i < (cfg.id === "WEC" ? 192 : 48); i++) {
      const id = person(cfg.id, "DRIVER", null, i % 3);
      if (cfg.id === "WEC") world.people.find((p) => p.id === id)!.rating = (["BRONZE", "SILVER", "GOLD", "GOLD"] as const)[i % 4];
    }
    for (const role of [
      "TECHNICAL_DIRECTOR",
      "SPORTING_DIRECTOR",
      "RACE_ENGINEER",
    ] as const)
      for (let i = 0; i < 12; i++) person(cfg.id, role, null, 0);
  }
  resetWorldStandings(world);
  if (
    !world.teams.some(
      (t) => t.id === world.playerTeamId && t.seriesId === playerSeriesId,
    )
  )
    throw new Error("The selected team does not belong to this series.");
  return WorldSchema.parse(world);
}
export function resetWorldStandings(world: MotorsportWorld) {
  world.series = SERIES.map((cfg) => ({
    seriesId: cfg.id,
    completedRounds: 0,
    ...(cfg.id === "WEC" ? { entries: world.teams.filter((t) => t.seriesId === "WEC").flatMap((t) => Array.from({ length: getSeries(t.seriesId).driversPerTeam }, (_, index) => ({ id: `${t.id}_car_${index + 1}`, teamId: t.id, classId: t.classId!, points: 0 }))) } : {}),
    drivers: world.people
      .filter(
        (p) =>
          p.role === "DRIVER" &&
          !world.teams.some((t) =>
            t.raceCrews?.some((c) => c.coDriverId === p.id),
          ) &&
          p.teamId &&
          world.teams.find((t) => t.id === p.teamId)?.seriesId === cfg.id,
      )
      .map((p) => ({ personId: p.id, ...(cfg.id === "WEC" ? { classId: world.teams.find((t) => t.id === p.teamId)!.classId } : {}), points: 0, wins: 0, podiums: 0 })),
    teams: world.teams
      .filter((t) => t.seriesId === cfg.id)
      .map((t) => ({ teamId: t.id, ...(t.classId ? { classId: t.classId } : {}), points: 0 })),
    lastResults: [],
  }));
}
export function playerTeam(world: MotorsportWorld) {
  const team = world.teams.find((t) => t.id === world.playerTeamId);
  if (!team) throw new Error("Player team is missing.");
  return team;
}
export function characterFromPerson(p: WorldPerson): Character {
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    active: true,
    power: {
      formalAuthority: p.role === "TEAM_PRINCIPAL" ? 95 : 25,
      internalInfluence: p.role === "TEAM_PRINCIPAL" ? 80 : 40,
      ownerAccess: 45,
      sportingLeverage: p.skill,
      mediaInfluence: 35 + Math.floor(p.skill / 3),
      commercialBacking: 40,
    },
    dynamic: {
      momentum: 0,
      institutionalReputation: 70,
      politicalFatigue: 8,
      instability: 8,
    },
    personality: {
      assertiveness: 55,
      ambition: p.ambition,
      compromiseWillingness: p.compromise,
      riskTolerance: p.riskTolerance,
      grudgeHolding: 45,
      ruleRespect: 75,
    },
    career: {
      contractSecurity: 65,
      replacementDifficulty: p.skill,
      transferInterest: p.teamId ? 25 : 65,
    },
    goalIds: [],
    leverageIds: [],
    precedentIds: [],
  };
}
export function worldCandidates(
  world: MotorsportWorld,
  political: PoliticalCoreState,
  round: number,
): Candidate[] {
  const cfg = getSeries(world.playerSeriesId),
    availableUntil = world.season * cfg.rounds;
  return world.people
    .filter(
      (p) => p.role !== "TEAM_PRINCIPAL" && p.teamId !== world.playerTeamId,
    )
    .map((p) => {
      const employer = world.teams.find((t) => t.id === p.teamId);
      const compatible =
        !(world.playerSeriesId === "WEC" && playerTeam(world).classId === "HYPERCAR" && p.role === "DRIVER" && p.rating === "BRONZE") &&
        p.specialties.includes(world.playerSeriesId) &&
        (p.role !== "DRIVER" || p.skill >= cfg.minDriverSkill);
      return {
        id: `candidate_${p.id}`,
        character: characterFromPerson(p),
        seat:
          p.role === "DRIVER"
            ? "DRIVER_ONE"
            : p.role === "TECHNICAL_DIRECTOR"
              ? "TECHNICAL"
              : p.role === "SPORTING_DIRECTOR"
                ? "SPORTING"
                : "ENGINEERING",
        skill: p.skill,
        salary: p.salary,
        signingFee: Number((p.salary * 0.1).toFixed(4)),
        buyout: employer
          ? Number(
              (
                p.salary *
                Math.max(0, p.contractEndSeason - world.season + 1) *
                0.5
              ).toFixed(4),
            )
          : 0,
        employer: employer?.name ?? "Free agent",
        availableFrom: round,
        availableUntil: Math.max(round + 1, availableUntil),
        status:
          compatible &&
          !political.characters.some((c) => c.id === p.id && c.active !== false)
            ? "AVAILABLE"
            : "UNAVAILABLE",
        seriesId: p.seriesId,
        age: p.age,
        nationality: p.nationality,
        potential: p.potential,
        personId: p.id,
      };
    });
}
export function transferWorldPerson(
  world: MotorsportWorld,
  personId: string,
  teamId: string | null,
  crewLeadId?: string,
) {
  const p = world.people.find((p) => p.id === personId);
  if (!p) throw new Error("Unknown person in world transfer.");
  const target = teamId ? world.teams.find((t) => t.id === teamId) : null;
  if (teamId && !target) throw new Error("Unknown destination team.");
  const old = world.teams.find((t) => t.id === p.teamId);
  if (old && old.id !== teamId) {
    for (const crew of old.raceCrews ?? []) {
      const removed =
        crew.members.includes(personId) || crew.coDriverId === personId;
      crew.members = crew.members.filter((id) => id !== personId);
      if (crew.coDriverId === personId) crew.coDriverId = null;
      if (removed && old.id !== world.playerTeamId) {
        const replacement = world.people
          .filter(
            (x) =>
              !x.teamId &&
              x.role === "DRIVER" &&
              x.specialties.includes(old.seriesId) &&
              (old.classId === "HYPERCAR" ? x.rating !== "BRONZE" : old.classId === "LMGT3" ? x.rating === p.rating : true),
          )
          .sort(
            (a, b) => Math.abs(a.skill - p.skill) - Math.abs(b.skill - p.skill),
          )[0];
        if (replacement) {
          replacement.teamId = old.id;
          replacement.seriesId = old.seriesId;
          replacement.contractEndSeason = world.season + 1;
          if (old.seriesId === "RALLY") crew.coDriverId = replacement.id;
          else crew.members.push(replacement.id);
        }
      }
    }
    const list = p.role === "DRIVER" ? old.drivers : old.staff;
    const index = list.indexOf(personId);
    if (index >= 0) {
      list.splice(index, 1);
      if (old.id !== world.playerTeamId) {
        const replacement = world.people
          .filter(
            (x) =>
              !x.teamId &&
              x.role === p.role &&
              x.specialties.includes(old.seriesId) &&
              (old.classId === "HYPERCAR" ? x.rating !== "BRONZE" : old.classId === "LMGT3" ? x.rating === p.rating : true),
          )
          .sort(
            (a, b) =>
              Math.abs(a.skill - p.skill) - Math.abs(b.skill - p.skill) ||
              a.id.localeCompare(b.id),
          )[0];
        if (replacement) {
          replacement.teamId = old.id;
          replacement.seriesId = old.seriesId;
          replacement.contractEndSeason = world.season + 1;
          list.splice(index, 0, replacement.id);
          const crew = old.raceCrews?.find((c) => c.leadId === personId);
          if (crew) crew.leadId = replacement.id;
        }
      }
    }
  }
  p.teamId = teamId;
  if (target) {
    if (crewLeadId) {
      const crew = target.raceCrews?.find((c) => c.leadId === crewLeadId);
      if (!crew || p.role !== "DRIVER")
        throw new Error("Unknown crew destination.");
      if (target.seriesId === "RALLY") {
        if (crew.coDriverId && crew.coDriverId !== personId)
          world.people.find((x) => x.id === crew.coDriverId)!.teamId = null;
        crew.coDriverId = personId;
      } else if (!crew.members.includes(personId)) crew.members.push(personId);
      p.seriesId = target.seriesId;
      p.contractEndSeason = world.season + 1;
      return;
    }
    const roster = p.role === "DRIVER" ? target.drivers : target.staff;
    const replace =
      p.role === "DRIVER"
        ? roster.length >= getSeries(target.seriesId).driversPerTeam
          ? roster[roster.length - 1]
          : undefined
        : roster.find(
            (id) => world.people.find((x) => x.id === id)?.role === p.role,
          );
    if (replace && replace !== personId) {
      world.people.find((x) => x.id === replace)!.teamId = null;
      roster.splice(roster.indexOf(replace), 1);
      const crew = target.raceCrews?.find((c) => c.leadId === replace);
      if (crew) crew.leadId = personId;
    }
    p.seriesId = target.seriesId;
    p.contractEndSeason = world.season + 1;
    const list = p.role === "DRIVER" ? target.drivers : target.staff;
    if (!list.includes(personId)) list.push(personId);
    const vacantCrew = target.raceCrews?.find(
      (c) => !target.drivers.includes(c.leadId),
    );
    if (p.role === "DRIVER" && vacantCrew) vacantCrew.leadId = personId;
  }
}
export function validateWorld(input: unknown): MotorsportWorld {
  const w = WorldSchema.parse(input),
    ids = new Set(w.people.map((p) => p.id)),
    teams = new Map(w.teams.map((t) => [t.id, t])),
    persons = new Map(w.people.map((p) => [p.id, p]));
  if (
    ids.size !== w.people.length ||
    teams.size !== w.teams.length ||
    new Set(w.people.map((p) => p.name)).size !== w.people.length ||
    w.series.length !== SERIES.length ||
    new Set(w.series.map((s) => s.seriesId)).size !== SERIES.length
  )
    throw new Error("Duplicate world identities or series.");
  const assigned = new Set<string>();
  for (const t of w.teams) {
    if (
      t.drivers.length > getSeries(t.seriesId).driversPerTeam ||
      t.staff.length > 3
    )
      throw new Error("Invalid world roster size.");
    if ((t.seriesId === "WEC") !== !!t.classId) throw new Error("Invalid WEC class assignment.");
    for (const id of [...t.drivers, ...t.staff, t.principalId]) {
      const p = persons.get(id);
      if (
        !p ||
        p.teamId !== t.id ||
        p.seriesId !== t.seriesId ||
        assigned.has(id)
      )
        throw new Error("Invalid world team roster.");
      assigned.add(id);
      if (
        (t.drivers.includes(id) && p.role !== "DRIVER") ||
        (t.staff.includes(id) &&
          ![
            "TECHNICAL_DIRECTOR",
            "SPORTING_DIRECTOR",
            "RACE_ENGINEER",
          ].includes(p.role)) ||
        (id === t.principalId && p.role !== "TEAM_PRINCIPAL")
      )
        throw new Error("Invalid world role assignment.");
    }
    for (const crew of t.raceCrews ?? []) {
      if (
        persons.get(crew.leadId)?.role !== "DRIVER" ||
        new Set(t.raceCrews?.map((c) => c.leadId)).size !==
          t.raceCrews?.length ||
        (t.raceCrews?.length ?? 0) > getSeries(t.seriesId).driversPerTeam ||
        crew.members.length > 2 ||
        (crew.coDriverId && t.seriesId !== "RALLY")
      )
        throw new Error("Invalid world race crew.");
      for (const id of [
        ...crew.members,
        ...(crew.coDriverId ? [crew.coDriverId] : []),
      ]) {
        const p = persons.get(id);
        if (
          !p ||
          p.role !== "DRIVER" ||
          p.teamId !== t.id ||
          p.seriesId !== t.seriesId ||
          assigned.has(id)
        )
          throw new Error("Invalid world crew employment.");
        assigned.add(id);
      }
    }
  }
  for (const p of w.people)
    if (p.teamId && (!teams.has(p.teamId) || !assigned.has(p.id)))
      throw new Error("Person references an invalid employer.");
  for (const cfg of SERIES)
    if (
      w.teams.filter((t) => t.seriesId === cfg.id).length !==
      cfg.teamNames.length
    )
      throw new Error("Invalid world team count.");
  for (const s of w.series) {
    if (
      new Set(s.drivers.map((d) => d.personId)).size !== s.drivers.length ||
      new Set(s.teams.map((t) => t.teamId)).size !== s.teams.length ||
      new Set(s.lastResults.map((r) => r.personId)).size !==
        s.lastResults.length
    )
      throw new Error("Duplicate world standings or results.");
    if (
      s.completedRounds > getSeries(s.seriesId).rounds ||
      s.teams.length !== getSeries(s.seriesId).teamNames.length
    )
      throw new Error("Invalid series calendar or grid.");
    if (s.seriesId === "WEC") {
      if (!s.entries || new Set(s.entries.map((e) => e.id)).size !== s.entries.length)
        throw new Error("Invalid WEC entry standings.");
      for (const entry of s.entries) {
        const team = teams.get(entry.teamId);
        if (team?.seriesId !== "WEC" || team.classId !== entry.classId ||
            ![`${entry.teamId}_car_1`, `${entry.teamId}_car_2`].includes(entry.id))
          throw new Error("Invalid WEC car entry.");
      }
    }
    for (const d of s.drivers)
      if (!ids.has(d.personId)) throw new Error("Unknown championship driver.");
    for (const t of s.teams)
      if (teams.get(t.teamId)?.seriesId !== s.seriesId)
        throw new Error("Wrong championship team.");
    for (const r of s.lastResults)
      if (!ids.has(r.personId) || teams.get(r.teamId)?.seriesId !== s.seriesId)
        throw new Error("Invalid world result.");
  }
  if (teams.get(w.playerTeamId)?.seriesId !== w.playerSeriesId)
    throw new Error("Invalid player series/team selection.");
  return w;
}

export function syncWorldCandidates(
  flow: import("@/game/season/round-flow").RoundFlowState,
) {
  const c = flow.career!,
    w = c.world;
  if (!w) return;
  c.candidates = worldCandidates(w, flow.political, flow.currentRound);
  for (const standing of c.standings) {
    const p = w.people.find((p) => p.id === standing.id),
      team = w.teams.find((t) => t.id === p?.teamId);
    if (team?.classId) standing.classId = team.classId;
    standing.team =
      team?.seriesId === w.playerSeriesId ? team.name : "Departed";
  }
  for (const team of w.teams.filter((t) => t.seriesId === w.playerSeriesId))
    for (const id of team.drivers)
      if (!c.standings.some((s) => s.id === id)) {
        const p = w.people.find((p) => p.id === id)!;
        c.standings.push({
          id: p.id,
          name: p.name,
          team: team.name,
          skill: p.skill,
          ...(team.classId ? { classId: team.classId } : {}),
          points: 0,
          wins: 0,
          podiums: 0,
        });
      }
}

