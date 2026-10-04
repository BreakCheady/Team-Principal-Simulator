import { z } from "zod";
import {
  CharacterSchema,
  ConflictSchema,
  ContractSchema,
  FinanceTransactionSchema,
  GoalSchema,
  LeverageSchema,
  PoliticalCoreStateSchema,
  PrecedentSchema,
  RelationshipSchema,
  TeamFinanceSchema,
} from "./schemas";

export type Character = z.infer<typeof CharacterSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type Leverage = z.infer<typeof LeverageSchema>;
export type Precedent = z.infer<typeof PrecedentSchema>;
export type Conflict = z.infer<typeof ConflictSchema>;
export type Contract = z.infer<typeof ContractSchema>;
export type TeamFinance = z.infer<typeof TeamFinanceSchema>;
export type FinanceTransaction = z.infer<typeof FinanceTransactionSchema>;
export type PoliticalCoreState = z.infer<typeof PoliticalCoreStateSchema>;

export type DomainValidationError = {
  path: string;
  code: string;
  message: string;
};
