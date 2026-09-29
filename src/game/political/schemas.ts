import { z } from "zod";

export const EntityIdSchema = z.string().min(3).max(80).regex(/^[a-z][a-z0-9_]*$/);
export const Score100Schema = z.number().int().min(0).max(100);
export const MomentumScoreSchema = z.number().int().min(-25).max(25);
export const RoundNumberSchema = z.number().int().min(1);

export const CharacterRoleSchema = z.enum([
  "TEAM_PRINCIPAL", "STAR_DRIVER", "SECOND_DRIVER", "DRIVER",
  "TECHNICAL_DIRECTOR", "SPORTING_DIRECTOR", "RACE_ENGINEER",
  "CEO", "OWNER_REPRESENTATIVE", "SPONSOR_REPRESENTATIVE",
]);

export const GoalTypeSchema = z.enum([
  "WIN_CHAMPIONSHIP", "GAIN_NUMBER_ONE_STATUS", "KEEP_EQUAL_STATUS",
  "INCREASE_TECHNICAL_INFLUENCE", "PROTECT_TECHNICAL_AUTHORITY",
  "PROTECT_TEAM_AUTHORITY", "MAINTAIN_TEAM_STABILITY", "PROTECT_ALLY",
  "REMOVE_RIVAL", "SECURE_NEW_CONTRACT", "LEAVE_TEAM",
  "PROVE_TEAM_LEADER_POTENTIAL", "BUILD_FASTEST_CAR", "PROTECT_ENGINEERING_TEAM",
]);

export const GoalVisibilitySchema = z.enum(["PUBLIC", "KNOWN", "SUSPECTED", "HIDDEN"]);

export const LeverageTypeSchema = z.enum([
  "SPONSOR_PRESSURE", "OWNER_ACCESS", "MEDIA_PRESSURE", "CONTRACT_CLAUSE",
  "TRANSFER_THREAT", "TECHNICAL_DEPENDENCY", "SPORTING_DEPENDENCY",
  "PERSONAL_INFORMATION", "STAFF_SUPPORT", "COMMERCIAL_DEPENDENCY",
]);

export const PrecedentTypeSchema = z.enum([
  "DRIVER_PRIORITY", "TEAM_ORDER", "TECHNICAL_AUTHORITY", "PERSONNEL_AUTHORITY",
  "CONTRACT_POLICY", "OWNER_INTERVENTION", "MEDIA_POLICY", "SPORTING_POLICY",
]);

export const VisibilitySchema = z.enum(["PRIVATE", "INTERNAL", "PADDOCK", "PUBLIC"]);

export const ConflictTypeSchema = z.enum([
  "DRIVER_PRIORITY", "TEAM_ORDER", "TECHNICAL_DIRECTION", "PERSONNEL_DECISION",
  "CONTRACT_DISPUTE", "OWNER_INTERVENTION", "SPONSOR_PRESSURE",
  "MEDIA_CONFLICT", "LEADERSHIP_CHALLENGE",
]);

export const ConflictStatusSchema = z.enum([
  "DORMANT", "EMERGING", "ACTIVE", "ESCALATED", "RESOLVED",
]);

export const ConflictOutcomeSchema = z.enum([
  "DECISIVE_WIN_A", "DECISIVE_WIN_B", "NARROW_WIN_A", "NARROW_WIN_B",
  "COMPROMISE", "STALEMATE", "BACKFIRE_A", "BACKFIRE_B",
]);

export const PowerProfileSchema = z.object({
  formalAuthority: Score100Schema,
  internalInfluence: Score100Schema,
  ownerAccess: Score100Schema,
  sportingLeverage: Score100Schema,
  mediaInfluence: Score100Schema,
  commercialBacking: Score100Schema,
}).strict();

export const CharacterSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1).max(100),
  role: CharacterRoleSchema,
  power: PowerProfileSchema,
  dynamic: z.object({
    momentum: MomentumScoreSchema,
    institutionalReputation: Score100Schema,
    politicalFatigue: Score100Schema,
    instability: Score100Schema,
  }).strict(),
  personality: z.object({
    assertiveness: Score100Schema,
    riskTolerance: Score100Schema,
    ambition: Score100Schema,
    compromiseWillingness: Score100Schema,
    grudgeHolding: Score100Schema,
    ruleRespect: Score100Schema,
  }).strict(),
  career: z.object({
    contractSecurity: Score100Schema,
    replacementDifficulty: Score100Schema,
    transferInterest: Score100Schema,
  }).strict(),
  goalIds: z.array(EntityIdSchema).default([]),
  leverageIds: z.array(EntityIdSchema).default([]),
  precedentIds: z.array(EntityIdSchema).default([]),
}).strict();

export const RelationshipSchema = z.object({
  id: EntityIdSchema,
  fromCharacterId: EntityIdSchema,
  toCharacterId: EntityIdSchema,
  trust: Score100Schema,
  loyalty: Score100Schema,
  respect: Score100Schema,
  dependency: Score100Schema,
  resentment: Score100Schema,
  personalLeverage: Score100Schema,
}).strict().superRefine((value, ctx) => {
  if (value.fromCharacterId === value.toCharacterId) {
    ctx.addIssue({
      code: "custom",
      path: ["toCharacterId"],
      message: "A character cannot have a relationship with itself.",
    });
  }
});

export const GoalSchema = z.object({
  id: EntityIdSchema,
  characterId: EntityIdSchema,
  type: GoalTypeSchema,
  priority: Score100Schema,
  urgency: Score100Schema,
  progress: Score100Schema,
  visibility: GoalVisibilitySchema,
  targetCharacterId: EntityIdSchema.nullable().optional(),
  active: z.boolean().default(true),
}).strict();

export const LeverageSchema = z.object({
  id: EntityIdSchema,
  ownerCharacterId: EntityIdSchema,
  targetCharacterId: EntityIdSchema.nullable().optional(),
  type: LeverageTypeSchema,
  strength: Score100Schema,
  credibility: Score100Schema,
  usability: Score100Schema,
  risk: Score100Schema,
  usesRemaining: z.number().int().min(0).max(99).optional(),
  public: z.boolean(),
  active: z.boolean().default(true),
}).strict().superRefine((value, ctx) => {
  if (value.usesRemaining === 0 && value.active) {
    ctx.addIssue({
      code: "custom",
      path: ["active"],
      message: "Leverage with 0 usesRemaining must be inactive.",
    });
  }
});

export const PrecedentSchema = z.object({
  id: EntityIdSchema,
  type: PrecedentTypeSchema,
  rule: z.string().min(5).max(500),
  strength: Score100Schema,
  visibility: VisibilitySchema,
  createdAtRound: RoundNumberSchema.optional(),
  applications: z.number().int().min(0),
  violations: z.number().int().min(0),
  affectedCharacterIds: z.array(EntityIdSchema).min(1),
  active: z.boolean().default(true),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.affectedCharacterIds).size !== value.affectedCharacterIds.length) {
    ctx.addIssue({
      code: "custom",
      path: ["affectedCharacterIds"],
      message: "affectedCharacterIds must contain unique values.",
    });
  }
});

export const ConflictFactionSchema = z.object({
  id: EntityIdSchema,
  leaderCharacterId: EntityIdSchema,
  memberCharacterIds: z.array(EntityIdSchema).min(1),
  alliancePower: Score100Schema,
  legitimacy: Score100Schema,
  leverage: Score100Schema,
  friction: Score100Schema,
  momentum: Score100Schema,
}).strict().superRefine((value, ctx) => {
  if (!value.memberCharacterIds.includes(value.leaderCharacterId)) {
    ctx.addIssue({
      code: "custom",
      path: ["memberCharacterIds"],
      message: "Faction leader must also be a faction member.",
    });
  }
  if (new Set(value.memberCharacterIds).size !== value.memberCharacterIds.length) {
    ctx.addIssue({
      code: "custom",
      path: ["memberCharacterIds"],
      message: "Faction members must be unique.",
    });
  }
});

export const ConflictSchema = z.object({
  id: EntityIdSchema,
  type: ConflictTypeSchema,
  status: ConflictStatusSchema,
  initiatorCharacterId: EntityIdSchema,
  issue: z.string().min(5).max(300),
  stakes: Score100Schema,
  publicExposure: Score100Schema,
  factions: z.tuple([ConflictFactionSchema, ConflictFactionSchema]),
  swingActorIds: z.array(EntityIdSchema),
  escalation: Score100Schema,
  roundStarted: RoundNumberSchema,
  roundResolved: RoundNumberSchema.nullable().optional(),
  outcome: ConflictOutcomeSchema.nullable().optional(),
  precedentIds: z.array(EntityIdSchema).default([]),
}).strict().superRefine((value, ctx) => {
  const [a, b] = value.factions;
  const aMembers = new Set(a.memberCharacterIds);
  const bMembers = new Set(b.memberCharacterIds);

  for (const member of aMembers) {
    if (bMembers.has(member)) {
      ctx.addIssue({
        code: "custom",
        path: ["factions"],
        message: `Character "${member}" cannot belong to both factions.`,
      });
    }
  }

  for (const swingActor of value.swingActorIds) {
    if (aMembers.has(swingActor) || bMembers.has(swingActor)) {
      ctx.addIssue({
        code: "custom",
        path: ["swingActorIds"],
        message: `Swing actor "${swingActor}" cannot already belong to a faction.`,
      });
    }
  }

  if (value.status === "RESOLVED") {
    if (!value.outcome || !value.roundResolved) {
      ctx.addIssue({
        code: "custom",
        path: ["status"],
        message: "Resolved conflicts require outcome and roundResolved.",
      });
    }
  } else if (value.outcome || value.roundResolved) {
    ctx.addIssue({
      code: "custom",
      path: ["status"],
      message: "Unresolved conflicts must not have outcome or roundResolved.",
    });
  }
});

export const PoliticalCoreStateSchema = z.object({
  characters: z.array(CharacterSchema),
  relationships: z.array(RelationshipSchema),
  goals: z.array(GoalSchema),
  leverages: z.array(LeverageSchema),
  precedents: z.array(PrecedentSchema),
  conflicts: z.array(ConflictSchema),
}).strict();
