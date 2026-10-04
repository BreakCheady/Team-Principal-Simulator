import { z } from "zod";
import { EntityIdSchema, Score100Schema } from "@/game/political/schemas";
import { SeriesIdSchema } from "./series";
import { QualifyingSchema } from "@/game/racing/schema";
export const WecClassSchema = z.enum(["HYPERCAR", "LMGT3"]);
export const DriverRatingSchema = z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]);
export const WorldRoleSchema = z.enum([
  "DRIVER",
  "TECHNICAL_DIRECTOR",
  "SPORTING_DIRECTOR",
  "RACE_ENGINEER",
  "TEAM_PRINCIPAL",
]);
export const WorldPersonSchema = z
  .object({
    id: EntityIdSchema,
    name: z.string(),
    age: z.number().int().min(16).max(80),
    nationality: z.string(),
    rating: DriverRatingSchema.optional(),
    role: WorldRoleSchema,
    seriesId: SeriesIdSchema,
    specialties: z.array(SeriesIdSchema).min(1),
    teamId: EntityIdSchema.nullable(),
    skill: Score100Schema,
    potential: Score100Schema,
    experience: z.number().int().min(0).max(50),
    ambition: Score100Schema,
    compromise: Score100Schema,
    riskTolerance: Score100Schema,
    consistency: Score100Schema,
    terrainSkill: Score100Schema,
    salary: z.number().min(0),
    contractEndSeason: z.number().int().min(1),
  })
  .strict();
export type WorldPerson = z.infer<typeof WorldPersonSchema>;
export const WorldTeamSchema = z
  .object({
    id: EntityIdSchema,
    seriesId: SeriesIdSchema,
    name: z.string(),
    classId: WecClassSchema.optional(),
    reputation: Score100Schema,
    pace: Score100Schema,
    reliability: Score100Schema,
    budget: z.number().positive(),
    drivers: z.array(EntityIdSchema),
    staff: z.array(EntityIdSchema),
    principalId: EntityIdSchema,
    raceCrews: z
      .array(
        z
          .object({
            leadId: EntityIdSchema,
            members: z.array(EntityIdSchema),
            coDriverId: EntityIdSchema.nullable(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();
export type WorldTeam = z.infer<typeof WorldTeamSchema>;
const Result = z
  .object({
    personId: EntityIdSchema,
    teamId: EntityIdSchema,
    classId: WecClassSchema.optional(),
    classPosition: z.number().int().min(1).optional(),
    position: z.number().int().min(1),
    points: z.number().min(0),
    dnf: z.boolean(),
  })
  .strict();
export const WorldSeriesStateSchema = z
  .object({
    seriesId: SeriesIdSchema,
    completedRounds: z.number().int().min(0),
    entries: z.array(z.object({ id: EntityIdSchema, teamId: EntityIdSchema, classId: WecClassSchema, points: z.number().min(0) }).strict()).optional(),
    drivers: z.array(
      z
        .object({
          personId: EntityIdSchema,
          classId: WecClassSchema.optional(),
          points: z.number().min(0),
          wins: z.number().int().min(0),
          podiums: z.number().int().min(0),
        })
        .strict(),
    ),
    teams: z.array(
      z.object({ teamId: EntityIdSchema, classId: WecClassSchema.optional(), points: z.number().min(0) }).strict(),
    ),
    lastResults: z.array(Result),
    qualifying: z.array(QualifyingSchema).optional(),
  })
  .strict();
export const WorldSchema = z
  .object({
    version: z.literal(1),
    season: z.number().int().min(1),
    seed: z.number().int().min(1).max(4294967295),
    playerSeriesId: SeriesIdSchema,
    playerTeamId: EntityIdSchema,
    people: z.array(WorldPersonSchema),
    teams: z.array(WorldTeamSchema),
    series: z.array(WorldSeriesStateSchema),
    history: z.array(
      z
        .object({
          season: z.number().int().min(1),
          seriesId: SeriesIdSchema,
          classId: WecClassSchema.optional(),
          driverId: EntityIdSchema.nullable(),
          teamId: EntityIdSchema.nullable(),
        })
        .strict(),
    ),
  })
  .strict();
export type MotorsportWorld = z.infer<typeof WorldSchema>;

