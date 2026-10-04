import { z } from "zod";
import { SeriesIdSchema } from "@/game/world/series";

export const CompoundSchema = z.enum([
  "SOFT",
  "MEDIUM",
  "HARD",
  "PRIMARY",
  "ALTERNATE",
  "SLICK",
  "INTERMEDIATE",
  "WET",
  "GRAVEL",
  "SNOW",
]);
export type Compound = z.infer<typeof CompoundSchema>;
export const ModeSchema = z.enum(["ATTACK", "BALANCED", "CONSERVE", "DEFEND"]);
export const SetupSchema = z
  .object({
    downforce: z.number().int().min(0).max(100),
    suspension: z.number().int().min(0).max(100),
    cooling: z.number().int().min(0).max(100),
  })
  .strict();
export type Setup = z.infer<typeof SetupSchema>;
const Positive = z.number().finite().min(0);
export const PlanSchema = z
  .object({
    startCompound: CompoundSchema,
    pitLap: z.number().int().min(1),
    nextCompound: CompoundSchema,
    fuelTarget: z.number().min(0.05).max(1),
    automatic: z.boolean(),
    repair: z.boolean(),
    changeDriver: z.boolean(),
  })
  .strict();
export type RacePlan = z.infer<typeof PlanSchema>;
export const CrewSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    skill: z.number().min(0).max(100),
    rating: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]).optional(),
    consistency: z.number().min(0).max(100),
    drivingSeconds: Positive,
    fatigue: z.number().min(0).max(100),
  })
  .strict();
export const RaceCarSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    team: z.string(),
    classId: z.enum(["MAIN", "TRAFFIC", "HYPERCAR", "LMGT3"]),
    entryId: z.string().optional(),
    ours: z.boolean(),
    crew: z.array(CrewSchema).min(1),
    activeDriver: z.number().int().min(0),
    coDriverSkill: z.number().min(0).max(100),
    pace: z.number().min(0).max(100),
    reliability: z.number().min(0).max(100),
    skill: z.number().min(0).max(100),
    consistency: z.number().min(0).max(100),
    wetSkill: z.number().min(0).max(100),
    aggression: z.number().min(0).max(100),
    discipline: z.number().min(0).max(100),
    trust: z.number().min(0).max(100),
    crewSkill: z.number().min(0).max(100),
    setup: SetupSchema,
    setupFit: z.number().min(0).max(100),
    mode: ModeSchema,
    plan: PlanSchema,
    compound: CompoundSchema,
    tyreAge: z.number().int().min(0),
    wear: z.number().min(0).max(100),
    fuel: Positive,
    damage: z.number().min(0).max(100),
    confidence: z.number().min(0).max(100),
    totalSeconds: Positive,
    nextLapAt: Positive,
    lapStartedAt: Positive,
    pitRelease: Positive,
    stintSeconds: Positive,
    pitRequested: z.boolean(),
    finished: z.boolean(),
    warnings: z.number().int().min(0),
    lastLap: Positive,
    bestLap: Positive,
    completedLaps: z.number().int().min(0),
    grid: z.number().int().min(1),
    position: z.number().int().min(1),
    stops: z.number().int().min(0),
    mandatoryStops: z.number().int().min(0),
    tyreSets: z.array(
      z
        .object({
          compound: CompoundSchema,
          laps: z.number().int().min(0),
          greenLaps: z.number().int().min(0),
        })
        .strict(),
    ),
    wetUsed: z.boolean(),
    retired: z.boolean(),
    dsq: z.boolean(),
    retirementReason: z.string().nullable(),
    penaltySeconds: Positive,
    lapsLed: z.number().int().min(0),
    pitLoss: Positive,
    battleLoss: Positive,
    mistakeLoss: Positive,
    serviceLoss: Positive,
    sundaySeconds: Positive,
    powerStageSeconds: Positive,
    finishPoints: Positive,
    bonusPoints: Positive,
    raceWins: z.number().int().min(0),
    racePodiums: z.number().int().min(0),
  })
  .strict();
export type RaceCar = z.infer<typeof RaceCarSchema>;
export const RaceEventSchema = z
  .object({
    lap: z.number().int().min(0),
    kind: z.enum([
      "START",
      "WEATHER",
      "PIT",
      "PASS",
      "INCIDENT",
      "PENALTY",
      "CONTROL",
      "RADIO",
      "SERVICE",
      "FINISH",
    ]),
    carId: z.string().nullable(),
    text: z.string(),
    seconds: z.number().finite().optional(),
  })
  .strict();
export type RaceEvent = z.infer<typeof RaceEventSchema>;
export const QualifyingSchema = z
  .object({
    id: z.string(),
    time: Positive,
    secondTime: Positive,
    position: z.number().int().min(1),
    segments: z.array(Positive),
  })
  .strict();
export const SnapshotSchema = z
  .object({
    lap: z.number().int().min(0),
    wetness: z.number().min(0).max(100),
    flag: z.enum(["GREEN", "SC", "VSC", "FCY", "RED"]),
    rows: z.array(
      z
        .object({
          id: z.string(),
          position: z.number().int().min(1),
          gap: Positive,
          wear: z.number().min(0).max(100),
          fuel: Positive,
        })
        .strict(),
    ),
  })
  .strict();
export const WeekendSchema = z
  .object({
    round: z.number().int().min(1),
    season: z.number().int().min(1),
    eventIndex: z.number().int().min(0),
    meeting: z.number().int().min(0),
    seriesId: SeriesIdSchema,
    venue: z.string(),
    ruleId: z.string(),
    seed: z.number().int().min(1).max(4294967295),
    phase: z.enum(["PRACTICE", "QUALIFYING", "GRID", "RACING", "COMPLETE"]),
    session: z.enum(["SPRINT", "RACE", "RALLY"]),
    sprintPending: z.boolean(),
    sprintFinished: z.boolean(),
    lap: z.number().int().min(0),
    totalLaps: z.number().int().min(1).max(2000),
    durationSeconds: Positive,
    baseLap: z.number().positive(),
    lengthKm: z.number().positive(),
    overtaking: z.number().min(0).max(100),
    abrasion: z.number().min(0).max(100),
    idealSetup: SetupSchema,
    clockSeconds: Positive,
    wetness: z.number().min(0).max(100),
    rain: z.number().min(0).max(100),
    forecast: z.array(
      z
        .object({
          lap: z.number().int().min(0),
          chance: z.number().min(0).max(100),
        })
        .strict(),
    ),
    weatherSeed: z.number().int().min(1).max(4294967295),
    weatherChanges: z.array(
      z
        .object({
          lap: z.number().int().min(1),
          rain: z.number().min(0).max(100),
        })
        .strict(),
    ),
    flag: z.enum(["GREEN", "SC", "VSC", "FCY", "RED"]),
    flagRemaining: z.number().int().min(0),
    redFlags: z.number().int().min(0),
    pitClosed: z.boolean(),
    pitWindowOpened: z.boolean(),
    pitWindowDelay: Positive,
    pitWindowEnd: Positive,
    practiceRuns: z.number().int().min(0).max(3),
    knowledge: z.number().min(0).max(100),
    practiceNotes: z.array(z.string()),
    qualifying: z.array(QualifyingSchema),
    cars: z.array(RaceCarSchema),
    events: z.array(RaceEventSchema),
    snapshots: z.array(SnapshotSchema),
    decision: z.string().nullable(),
    teamOrders: z.array(
      z
        .object({
          giver: z.string(),
          receiver: z.string(),
          obeyed: z.boolean(),
        })
        .strict(),
    ),
    committed: z.boolean(),
  })
  .strict();
export type RaceWeekend = z.infer<typeof WeekendSchema>;
export const RaceSummarySchema = z
  .object({
    ruleId: z.string(),
    venue: z.string(),
    laps: z.number().int().min(1),
    wetRace: z.boolean(),
    qualifying: z.array(QualifyingSchema),
    events: z.array(RaceEventSchema),
    snapshots: z.array(SnapshotSchema),
    teamOrders: WeekendSchema.shape.teamOrders,
    teamPoints: z.array(
      z.object({ team: z.string(), points: Positive }).strict(),
    ),
    entries: z.array(
      z
        .object({
          id: z.string(),
          entryId: z.string().optional(),
          classId: z.enum(["HYPERCAR", "LMGT3"]).optional(),
          classPosition: z.number().int().min(1).optional(),
          time: Positive,
          laps: z.number().int().min(0),
          grid: z.number().int().min(1),
          stops: z.number().int().min(0),
          compound: CompoundSchema,
          penalty: Positive,
          dsq: z.boolean(),
          reason: z.string().nullable(),
          crew: z.array(
            z
              .object({
                id: z.string(),
                name: z.string(),
                seconds: Positive,
                eligible: z.boolean(),
              })
              .strict(),
          ),
          explanation: z.string(),
          repairCost: Positive,
          finishPoints: Positive,
          bonusPoints: Positive,
          wins: z.number().int().min(0),
          podiums: z.number().int().min(0),
        })
        .strict(),
    ),
  })
  .strict();
export type RaceSummary = z.infer<typeof RaceSummarySchema>;

