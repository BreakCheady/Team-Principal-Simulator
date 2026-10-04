import { z } from "zod";
import {
  EntityIdSchema,
  Score100Schema,
  CharacterSchema,
} from "@/game/political/schemas";
import type { PoliticalCoreState } from "@/game/political/types";

const Money = z.number().min(0);
const Round = z.number().int().min(1);
export const SeatSchema = z.enum([
  "DRIVER_ONE",
  "DRIVER_TWO",
  "TECHNICAL",
  "SPORTING",
  "ENGINEERING",
]);
export type Seat = z.infer<typeof SeatSchema>;
export const CandidateSchema = z
  .object({
    id: EntityIdSchema,
    character: CharacterSchema,
    seat: SeatSchema,
    skill: Score100Schema,
    salary: Money,
    signingFee: Money,
    buyout: Money,
    employer: z.string().min(1),
    availableFrom: Round,
    availableUntil: Round,
    status: z.enum(["AVAILABLE", "SIGNED", "UNAVAILABLE"]),
  })
  .strict();
export type Candidate = z.infer<typeof CandidateSchema>;
const DriverStanding = z
  .object({
    id: EntityIdSchema,
    name: z.string(),
    team: z.string(),
    skill: Score100Schema,
    points: z.number().int().min(0),
    wins: z.number().int().min(0),
    podiums: z.number().int().min(0),
  })
  .strict();
export const CareerSchema = z
  .object({
    season: Round,
    seasonStart: Round,
    seasonEnd: Round,
    seed: z.number().int().min(0).max(4294967295),
    status: z.enum(["RUNNING", "REVIEW", "DISMISSED"]),
    activeActorIds: z.array(EntityIdSchema),
    seats: z.array(
      z
        .object({ seat: SeatSchema, characterId: EntityIdSchema.nullable() })
        .strict(),
    ),
    candidates: z.array(CandidateSchema),
    offers: z.array(
      z
        .object({
          id: EntityIdSchema,
          characterId: EntityIdSchema,
          club: z.string(),
          salary: Money,
          fee: Money,
          clauseId: EntityIdSchema.nullable(),
          createdRound: Round,
          expiresRound: Round,
          status: z.enum([
            "OPEN",
            "ACCEPTED",
            "REJECTED",
            "EXPIRED",
            "DEPARTED",
          ]),
        })
        .strict(),
    ),
    requests: z.array(
      z
        .object({
          id: EntityIdSchema,
          characterId: EntityIdSchema,
          round: Round,
          kind: z.enum([
            "RENEWAL",
            "AUTHORITY",
            "OWNER",
            "SPONSOR",
            "STAFF",
            "OPTION",
          ]),
          contractId: EntityIdSchema.nullable(),
          optionId: EntityIdSchema.nullable(),
          contractEndRound: Round.nullable(),
          summary: z.string(),
          deadline: Round,
          status: z.enum(["OPEN", "SUPPORTED", "REFUSED", "ESCALATED"]),
        })
        .strict(),
    ),
    log: z.array(z.object({ round: Round, text: z.string() }).strict()),
    car: z
      .object({ pace: Score100Schema, reliability: Score100Schema })
      .strict(),
    strategy: z.enum(["BALANCED", "ATTACK", "CONSERVE"]),
    projects: z.array(
      z
        .object({
          id: EntityIdSchema,
          kind: z.enum(["AERO", "RELIABILITY", "OPERATIONS"]),
          startedRound: Round,
          dueRound: Round,
          cost: Money,
          risk: Score100Schema,
          status: z.enum(["ACTIVE", "SUCCEEDED", "FAILED"]),
          sponsorId: EntityIdSchema.nullable(),
        })
        .strict(),
    ),
    standings: z.array(DriverStanding),
    races: z.array(
      z
        .object({
          round: Round,
          season: Round,
          results: z.array(
            z
              .object({
                characterId: EntityIdSchema,
                name: z.string(),
                team: z.string(),
                position: z.number().int().min(1),
                points: z.number().int().min(0),
                dnf: z.boolean(),
                score: z.number(),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
    targets: z
      .object({
        teamPosition: z.number().int().min(1).max(10),
        cash: z.number(),
        stability: Score100Schema,
      })
      .strict(),
    reviews: z.array(
      z
        .object({
          season: Round,
          round: Round,
          teamPosition: z.number().int().min(1),
          cash: z.number(),
          stability: z.number().min(0).max(100),
          score: Score100Schema,
          verdict: z.enum(["RETAINED", "WARNING", "DISMISSED"]),
          prize: Money,
        })
        .strict(),
    ),
    warnings: z.number().int().min(0),
  })
  .strict();
export type CareerState = z.infer<typeof CareerSchema>;

export function createCareer(
  state: PoliticalCoreState,
  round: number,
): CareerState {
  const roles: [Seat, string[]][] = [
    ["DRIVER_ONE", ["STAR_DRIVER"]],
    ["DRIVER_TWO", ["SECOND_DRIVER", "DRIVER"]],
    ["TECHNICAL", ["TECHNICAL_DIRECTOR"]],
    ["SPORTING", ["SPORTING_DIRECTOR"]],
    ["ENGINEERING", ["RACE_ENGINEER"]],
  ];
  const seats = roles.map(([seat, roles]) => ({
    seat,
    characterId:
      state.characters.find((c) => c.active !== false && roles.includes(c.role))
        ?.id ?? null,
  }));
  const standings: CareerState["standings"] = seats
    .filter((s) => s.seat.startsWith("DRIVER") && s.characterId)
    .map((s) => {
      const c = state.characters.find((c) => c.id === s.characterId)!;
      return {
        id: c.id,
        name: c.name,
        team: "Vanguard",
        skill: c.power.sportingLeverage,
        points: 0,
        wins: 0,
        podiums: 0,
      };
    });
  for (let team = 0; team < 9; team++)
    for (let driver = 0; driver < 2; driver++)
      standings.push({
        id: `rival_${team}_${driver}`,
        name: `${["Orion", "Apex", "Titan", "Zenith", "Nova", "Atlas", "Velocity", "Pulse", "Horizon"][team]} ${driver + 1}`,
        team: [
          "Orion",
          "Apex",
          "Titan",
          "Zenith",
          "Nova",
          "Atlas",
          "Velocity",
          "Pulse",
          "Horizon",
        ][team],
        skill: Math.max(40, 93 - team * 5 - driver * 4),
        points: 0,
        wins: 0,
        podiums: 0,
      });
  const season = Math.floor((round - 1) / 24) + 1;
  return CareerSchema.parse({
    season,
    seasonStart: (season - 1) * 24 + 1,
    seasonEnd: season * 24,
    seed: 20261004,
    status: "RUNNING",
    activeActorIds: state.characters
      .filter((c) => c.active !== false)
      .map((c) => c.id),
    seats,
    candidates: createCandidates(state, round),
    offers: [],
    requests: [],
    log: [
      {
        round,
        text: "Career opened. Championship counters start here; earlier race results are not reconstructed.",
      },
    ],
    car: { pace: 78, reliability: 84 },
    strategy: "BALANCED",
    projects: [],
    standings,
    races: [],
    targets: { teamPosition: 4, cash: 0, stability: 55 },
    reviews: [],
    warnings: 0,
  });
}

export function createCandidates(
  state: PoliticalCoreState,
  round: number,
): Candidate[] {
  const template =
    state.characters.find((c) => c.role === "TEAM_PRINCIPAL") ??
    state.characters[0];
  if (!template) return [];
  return [
    [
      "char_alvarez",
      "Sofia Alvarez",
      "DRIVER_ONE",
      "DRIVER",
      88,
      12,
      2,
      6,
      "Orion",
      86,
      45,
    ],
    [
      "char_ito",
      "Ren Ito",
      "DRIVER_TWO",
      "DRIVER",
      76,
      4,
      0.8,
      0,
      "Free agent",
      82,
      72,
    ],
    [
      "char_reed",
      "Amelia Reed",
      "TECHNICAL",
      "TECHNICAL_DIRECTOR",
      88,
      4.5,
      0.8,
      2,
      "Apex",
      78,
      56,
    ],
    [
      "char_silva",
      "Rafael Silva",
      "SPORTING",
      "SPORTING_DIRECTOR",
      80,
      2.2,
      0.5,
      0,
      "Free agent",
      65,
      82,
    ],
    [
      "char_kovac",
      "Mira Kovac",
      "ENGINEERING",
      "RACE_ENGINEER",
      82,
      1.5,
      0.3,
      0,
      "Free agent",
      62,
      78,
    ],
  ].map((row) => {
    const [
      id,
      name,
      seat,
      role,
      skill,
      salary,
      signingFee,
      buyout,
      employer,
      ambition,
      compromise,
    ] = row;
    const character = structuredClone(template);
    character.id = String(id);
    character.active = true;
    character.name = String(name);
    character.role = role as typeof character.role;
    character.goalIds = [];
    character.leverageIds = [];
    character.precedentIds = [];
    character.power = {
      formalAuthority: 25,
      internalInfluence: 40,
      ownerAccess: 25,
      sportingLeverage: Number(skill),
      mediaInfluence: 40,
      commercialBacking: 35,
    };
    character.dynamic = {
      momentum: 0,
      institutionalReputation: 65,
      politicalFatigue: 10,
      instability: 10,
    };
    character.personality = {
      assertiveness: 60,
      riskTolerance: 55,
      ambition: Number(ambition),
      compromiseWillingness: Number(compromise),
      grudgeHolding: 40,
      ruleRespect: 75,
    };
    character.career = {
      contractSecurity: 0,
      replacementDifficulty: Number(skill),
      transferInterest: 50,
    };
    return CandidateSchema.parse({
      id: `candidate_${String(id).replace("char_", "")}`,
      character,
      seat,
      skill,
      salary,
      signingFee,
      buyout,
      employer,
      availableFrom: round,
      availableUntil: Math.ceil(round / 24) * 24 + 24,
      status: "AVAILABLE",
    });
  });
}

export function validateCareer(
  career: unknown,
  political: PoliticalCoreState,
  round: number,
): CareerState {
  const c = CareerSchema.parse(career);
  const ids = new Set(political.characters.map((c) => c.id));
  for (const id of c.activeActorIds)
    if (!ids.has(id)) throw new Error("Career references an unknown actor.");
  if (
    new Set(c.activeActorIds).size !== c.activeActorIds.length ||
    new Set(c.seats.map((s) => s.seat)).size !== c.seats.length ||
    c.seats.length !== 5
  )
    throw new Error("Career has duplicate actors or invalid seats.");
  if (
    political.characters.some(
      (actor) =>
        c.activeActorIds.includes(actor.id) === (actor.active === false),
    )
  )
    throw new Error("Career and political actor activity disagree.");
  const occupied = c.seats.flatMap((s) =>
    s.characterId ? [s.characterId] : [],
  );
  if (
    new Set(occupied).size !== occupied.length ||
    occupied.some((id) => !c.activeActorIds.includes(id))
  )
    throw new Error("Invalid career lineup.");
  for (const collection of [
    c.candidates,
    c.offers,
    c.requests,
    c.projects,
    c.standings,
  ]) {
    if (new Set(collection.map((x) => x.id)).size !== collection.length)
      throw new Error("Duplicate career IDs.");
  }
  for (const request of c.requests) {
    if (!ids.has(request.characterId))
      throw new Error("Unknown request actor.");
    if (request.contractId) {
      const contract = political.contracts.find(
        (x) =>
          x.id === request.contractId && x.characterId === request.characterId,
      );
      if (
        !contract ||
        (request.optionId &&
          !contract.options.some((o) => o.id === request.optionId))
      )
        throw new Error("Invalid option request.");
    }
  }
  for (const offer of c.offers) {
    if (!ids.has(offer.characterId)) throw new Error("Unknown transfer actor.");
    if (
      offer.clauseId &&
      !political.contracts.some(
        (contract) =>
          contract.characterId === offer.characterId &&
          contract.releaseClauses.some(
            (clause) => clause.id === offer.clauseId,
          ),
      )
    )
      throw new Error("Unknown transfer release clause.");
  }
  for (const project of c.projects)
    if (project.sponsorId && !ids.has(project.sponsorId))
      throw new Error("Unknown project sponsor.");
  if (new Set(c.races.map((r) => r.round)).size !== c.races.length)
    throw new Error("Duplicate race rounds.");
  for (const race of c.races)
    if (
      race.season !== Math.floor((race.round - 1) / 24) + 1 ||
      new Set(race.results.map((r) => r.characterId)).size !==
        race.results.length ||
      race.results.some((r) => !c.standings.some((s) => s.id === r.characterId))
    )
      throw new Error("Invalid race references.");
  if (
    c.seasonStart !== (c.season - 1) * 24 + 1 ||
    c.seasonEnd !== c.season * 24 ||
    round < c.seasonStart - 1 ||
    round > c.seasonEnd ||
    c.races.some((r) => r.round > round)
  )
    throw new Error("Career calendar does not match current round.");
  return c;
}
