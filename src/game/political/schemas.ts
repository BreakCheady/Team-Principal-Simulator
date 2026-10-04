import { z } from "zod";
import { createTeamFinance } from "@/game/finance/defaults";

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

    if (
      value.roundResolved !== null &&
      value.roundResolved !== undefined &&
      value.roundResolved < value.roundStarted
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["roundResolved"],
        message: "roundResolved must be greater than or equal to roundStarted.",
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


export const ContractOptionSchema = z.object({
  id: EntityIdSchema,
  holder: z.enum(["TEAM", "CHARACTER", "MUTUAL"]),
  exerciseFromRound: RoundNumberSchema,
  exerciseUntilRound: RoundNumberSchema,
  extensionRounds: z.number().int().min(1).max(52),
  salaryMultiplier: z.number().min(0.5).max(3).default(1),
  available: z.boolean().default(true),
  exercised: z.boolean().default(false),
}).strict().superRefine((value, ctx) => {
  if (value.exerciseUntilRound < value.exerciseFromRound) {
    ctx.addIssue({
      code: "custom",
      path: ["exerciseUntilRound"],
      message: "exerciseUntilRound must be greater than or equal to exerciseFromRound.",
    });
  }
});

export const ReleaseClauseSchema = z.object({
  id: EntityIdSchema,
  amountMillions: z.number().min(0),
  activeFromRound: RoundNumberSchema,
  expiresAfterRound: RoundNumberSchema,
  beneficiary: z.enum(["CHARACTER", "TEAM", "BOTH"]).default("CHARACTER"),
  active: z.boolean().default(true),
}).strict().superRefine((value, ctx) => {
  if (value.expiresAfterRound < value.activeFromRound) {
    ctx.addIssue({
      code: "custom",
      path: ["expiresAfterRound"],
      message: "expiresAfterRound must be greater than or equal to activeFromRound.",
    });
  }
});

export const PerformanceTriggerSchema = z.object({
  id: EntityIdSchema,
  metric: z.enum([
    "DRIVER_CHAMPIONSHIP_POSITION",
    "TEAM_CHAMPIONSHIP_POSITION",
    "POINTS",
    "WINS",
    "PODIUMS",
  ]),
  comparator: z.enum(["AT_LEAST", "AT_MOST"]),
  threshold: z.number().int().min(0),
  consequence: z.enum([
    "SALARY_BONUS",
    "OPTION_ACTIVATION",
    "RELEASE_CLAUSE_ACTIVATION",
  ]),
  amountMillions: z.number().min(0).optional(),
  targetOptionId: EntityIdSchema.optional(),
  targetReleaseClauseId: EntityIdSchema.optional(),
  triggered: z.boolean().default(false),
}).strict().superRefine((value, ctx) => {
  if (value.consequence === "SALARY_BONUS" && value.amountMillions === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["amountMillions"],
      message: "SALARY_BONUS requires amountMillions.",
    });
  }
  if (value.consequence === "OPTION_ACTIVATION" && !value.targetOptionId) {
    ctx.addIssue({
      code: "custom",
      path: ["targetOptionId"],
      message: "OPTION_ACTIVATION requires targetOptionId.",
    });
  }
  if (
    value.consequence === "RELEASE_CLAUSE_ACTIVATION" &&
    !value.targetReleaseClauseId
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["targetReleaseClauseId"],
      message: "RELEASE_CLAUSE_ACTIVATION requires targetReleaseClauseId.",
    });
  }
});

export const ContractSchema = z.object({
  id: EntityIdSchema,
  characterId: EntityIdSchema,
  employer: z.string().min(1).max(100),
  status: z.enum(["ACTIVE", "EXPIRED", "TERMINATED"]),
  signedRound: RoundNumberSchema,
  startRound: RoundNumberSchema,
  endRound: RoundNumberSchema,
  salaryMillionsPerSeason: z.number().min(0),
  guaranteedSalaryMillions: z.number().min(0),
  options: z.array(ContractOptionSchema).default([]),
  releaseClauses: z.array(ReleaseClauseSchema).default([]),
  performanceTriggers: z.array(PerformanceTriggerSchema).default([]),
  earnedBonusesMillions: z.number().min(0).default(0),
  salaryPaidMillions: z.number().min(0).default(0),
}).strict().superRefine((value, ctx) => {
  if (value.endRound < value.startRound) {
    ctx.addIssue({
      code: "custom",
      path: ["endRound"],
      message: "endRound must be greater than or equal to startRound.",
    });
  }

  const nestedIds = [
    ...value.options.map((item) => item.id),
    ...value.releaseClauses.map((item) => item.id),
    ...value.performanceTriggers.map((item) => item.id),
  ];
  if (new Set(nestedIds).size !== nestedIds.length) {
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: "Contract clause and trigger IDs must be unique within a contract.",
    });
  }

  const optionIds = new Set(value.options.map((item) => item.id));
  const releaseIds = new Set(value.releaseClauses.map((item) => item.id));
  value.performanceTriggers.forEach((trigger, index) => {
    if (trigger.targetOptionId && !optionIds.has(trigger.targetOptionId)) {
      ctx.addIssue({
        code: "custom",
        path: ["performanceTriggers", index, "targetOptionId"],
        message: `Unknown contract option "${trigger.targetOptionId}".`,
      });
    }
    if (
      trigger.targetReleaseClauseId &&
      !releaseIds.has(trigger.targetReleaseClauseId)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["performanceTriggers", index, "targetReleaseClauseId"],
        message: `Unknown release clause "${trigger.targetReleaseClauseId}".`,
      });
    }
  });
});

export const FinanceTransactionSchema = z.object({
  id: z.string().min(1).max(240),
  round: RoundNumberSchema,
  category: z.enum([
    "SPONSOR_INCOME", "OWNER_INCOME", "OWNER_FUNDING",
    "OPERATING_COST", "SALARY", "PERFORMANCE_BONUS", "GUARANTEE_SETTLEMENT",
  ]),
  amountMillions: z.number().positive(),
  description: z.string().min(1).max(300),
  contractId: EntityIdSchema.optional(),
}).strict().superRefine((value, ctx) => {
  if (["SALARY", "PERFORMANCE_BONUS", "GUARANTEE_SETTLEMENT"].includes(value.category) && !value.contractId) {
    ctx.addIssue({ code: "custom", path: ["contractId"], message: "Contract expenses require a contractId." });
  }
});

export const TeamFinanceSchema = z.object({
  openedAfterRound: z.number().int().min(0),
  settledThroughRound: z.number().int().min(0),
  openingBalanceMillions: z.number().min(0),
  sponsorIncomeMillionsPerRound: z.number().min(0),
  ownerIncomeMillionsPerRound: z.number().min(0),
  operatingCostMillionsPerRound: z.number().min(0),
  roundsPerSeason: z.number().int().min(1).max(52),
  payrollBudgetMillionsPerSeason: z.number().min(0),
  commitmentBudgetMillions: z.number().min(0),
  ownerFundingUsed: z.boolean(),
  costCutsApplied: z.boolean(),
  transactions: z.array(FinanceTransactionSchema),
}).strict().superRefine((value, ctx) => {
  if (value.settledThroughRound < value.openedAfterRound) {
    ctx.addIssue({ code: "custom", path: ["settledThroughRound"], message: "Settlement cannot precede the opening round." });
  }
  const ids = new Set<string>();
  value.transactions.forEach((transaction, index) => {
    if (ids.has(transaction.id)) {
      ctx.addIssue({ code: "custom", path: ["transactions", index, "id"], message: "Finance transaction IDs must be unique." });
    }
    ids.add(transaction.id);
    if (transaction.round < value.openedAfterRound) {
      ctx.addIssue({ code: "custom", path: ["transactions", index, "round"], message: "Transaction precedes the account opening." });
    }
  });
});

export const PoliticalCoreStateSchema = z.object({
  characters: z.array(CharacterSchema),
  relationships: z.array(RelationshipSchema),
  goals: z.array(GoalSchema),
  leverages: z.array(LeverageSchema),
  precedents: z.array(PrecedentSchema),
  conflicts: z.array(ConflictSchema),
  contracts: z.array(ContractSchema).default([]),
  finance: TeamFinanceSchema.default(() => createTeamFinance()),
}).strict();
