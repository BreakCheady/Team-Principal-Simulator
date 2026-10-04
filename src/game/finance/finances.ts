import type {
  Contract,
  FinanceTransaction,
  PoliticalCoreState,
} from "@/game/political/types";
import { validatePoliticalCoreState } from "@/game/political/validation";

export const OWNER_FUNDING_MILLIONS = 20;
export const LOW_CASH_THRESHOLD_MILLIONS = 8;

// Euro precision while the game displays money in millions.
export function roundMoney(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function requireRound(round: number): void {
  if (!Number.isInteger(round) || round < 1)
    throw new RangeError("round must be a positive integer.");
}

function validated(state: PoliticalCoreState): PoliticalCoreState {
  const result = validatePoliticalCoreState(state);
  if (!result.success)
    throw new Error("Finance operation produced an invalid game state.");
  return result.data;
}

export function isFinanceIncome(transaction: FinanceTransaction): boolean {
  return [
    "SPONSOR_INCOME",
    "OWNER_INCOME",
    "OWNER_FUNDING",
    "TRANSFER_INCOME",
    "PRIZE_INCOME",
  ].includes(transaction.category);
}

export function getCashBalance(state: PoliticalCoreState): number {
  return roundMoney(
    state.finance.openingBalanceMillions +
      state.finance.transactions.reduce(
        (sum, transaction) =>
          sum +
          (isFinanceIncome(transaction) ? 1 : -1) * transaction.amountMillions,
        0,
      ),
  );
}

function appendTransaction(
  state: PoliticalCoreState,
  transaction: FinanceTransaction,
): boolean {
  if (transaction.amountMillions === 0) return false;
  const existing = state.finance.transactions.find(
    (item) => item.id === transaction.id,
  );
  if (existing) {
    if (
      existing.round !== transaction.round ||
      existing.category !== transaction.category ||
      existing.amountMillions !== transaction.amountMillions ||
      existing.contractId !== transaction.contractId
    ) {
      throw new Error(
        "A finance transaction ID was reused with different terms.",
      );
    }
    return false;
  }
  state.finance.transactions.push(transaction);
  return true;
}

export function bookFinanceTransaction(
  sourceState: PoliticalCoreState,
  transaction: FinanceTransaction,
): PoliticalCoreState {
  const nextState = structuredClone(sourceState);
  appendTransaction(nextState, transaction);
  return validated(nextState);
}

export function bookPerformanceBonus(
  sourceState: PoliticalCoreState,
  contractId: string,
  triggerId: string,
  amountMillions: number,
  round: number,
): PoliticalCoreState {
  requireRound(round);
  const nextState = structuredClone(sourceState);
  const contract = nextState.contracts.find((item) => item.id === contractId);
  if (!contract) throw new Error(`Contract "${contractId}" was not found.`);
  if (!Number.isFinite(amountMillions) || amountMillions < 0)
    throw new RangeError("Invalid bonus amount.");
  if (round <= nextState.finance.openedAfterRound) return nextState;
  appendTransaction(nextState, {
    id: `bonus_${contractId}_${triggerId}`,
    round,
    category: "PERFORMANCE_BONUS",
    amountMillions: roundMoney(amountMillions),
    contractId,
    description: `Performance bonus: ${nextState.characters.find((item) => item.id === contract.characterId)?.name}`,
  });
  return validated(nextState);
}

export function settleTeamFinancesThroughRound(
  sourceState: PoliticalCoreState,
  round: number,
): PoliticalCoreState {
  requireRound(round);
  const nextState = structuredClone(sourceState);
  const finance = nextState.finance;
  if (round < finance.settledThroughRound)
    throw new Error("Finance settlement cannot move backwards.");
  for (
    let current = finance.settledThroughRound + 1;
    current <= round;
    current++
  ) {
    for (const [category, amountMillions, description] of [
      [
        "SPONSOR_INCOME",
        finance.sponsorIncomeMillionsPerRound,
        "Sponsor instalment",
      ],
      [
        "OWNER_INCOME",
        finance.ownerIncomeMillionsPerRound,
        "Owner operating contribution",
      ],
      [
        "OPERATING_COST",
        finance.operatingCostMillionsPerRound,
        "Team operating costs",
      ],
    ] as const) {
      appendTransaction(nextState, {
        id: `${category.toLowerCase()}_r${current}`,
        round: current,
        category,
        amountMillions,
        description,
      });
    }
    for (const contract of nextState.contracts) {
      const name = nextState.characters.find(
        (item) => item.id === contract.characterId,
      )?.name;
      if (activeAt(contract, current)) {
        const amountMillions = roundMoney(
          contract.salaryMillionsPerSeason / finance.roundsPerSeason,
        );
        const booked = appendTransaction(nextState, {
          id: `salary_${contract.id}_r${current}`,
          round: current,
          category: "SALARY",
          amountMillions,
          contractId: contract.id,
          description: `Salary: ${name}`,
        });
        if (booked)
          contract.salaryPaidMillions = roundMoney(
            contract.salaryPaidMillions + amountMillions,
          );
      }
      if (
        (contract.status !== "ACTIVE" || current > contract.endRound) &&
        contract.salaryPaidMillions < contract.guaranteedSalaryMillions
      ) {
        const amountMillions = roundMoney(
          contract.guaranteedSalaryMillions - contract.salaryPaidMillions,
        );
        const booked = appendTransaction(nextState, {
          id: `guarantee_${contract.id}_r${contract.endRound}`,
          round: current,
          category: "GUARANTEE_SETTLEMENT",
          amountMillions,
          contractId: contract.id,
          description: `Remaining guaranteed pay: ${name}`,
        });
        if (booked)
          contract.salaryPaidMillions = roundMoney(
            contract.salaryPaidMillions + amountMillions,
          );
      }
    }
    finance.settledThroughRound = current;
  }
  return validated(nextState);
}

function activeAt(contract: Contract, round: number): boolean {
  return (
    contract.status === "ACTIVE" &&
    contract.startRound <= round &&
    contract.endRound >= round
  );
}

export function getAnnualPayroll(
  state: PoliticalCoreState,
  round: number,
): number {
  return roundMoney(
    state.contracts
      .filter(
        (contract) =>
          contract.status === "ACTIVE" && contract.endRound >= round,
      )
      .reduce((sum, contract) => sum + contract.salaryMillionsPerSeason, 0),
  );
}

export function getContractCommitment(
  contract: Contract,
  round: number,
  roundsPerSeason: number,
): number {
  const unpaidGuarantee = Math.max(
    0,
    contract.guaranteedSalaryMillions - contract.salaryPaidMillions,
  );
  if (contract.status !== "ACTIVE") return roundMoney(unpaidGuarantee);
  const remainingRounds = Math.max(
    0,
    contract.endRound - Math.max(round + 1, contract.startRound) + 1,
  );
  return roundMoney(
    Math.max(
      remainingRounds *
        roundMoney(contract.salaryMillionsPerSeason / roundsPerSeason),
      unpaidGuarantee,
    ),
  );
}

export function getFinanceSummary(state: PoliticalCoreState, round: number) {
  const finance = state.finance;
  const payroll = getAnnualPayroll(state, round);
  const nextSalary = roundMoney(
    state.contracts
      .filter((contract) => activeAt(contract, round + 1))
      .reduce(
        (sum, contract) =>
          sum +
          roundMoney(
            contract.salaryMillionsPerSeason / finance.roundsPerSeason,
          ),
        0,
      ),
  );
  const nextGuarantees = roundMoney(
    state.contracts
      .filter(
        (contract) =>
          contract.status !== "ACTIVE" || contract.endRound <= round,
      )
      .reduce(
        (sum, contract) =>
          sum +
          Math.max(
            0,
            contract.guaranteedSalaryMillions - contract.salaryPaidMillions,
          ),
        0,
      ),
  );
  const income = roundMoney(
    finance.sponsorIncomeMillionsPerRound + finance.ownerIncomeMillionsPerRound,
  );
  const commitments = roundMoney(
    state.contracts.reduce(
      (sum, contract) =>
        sum + getContractCommitment(contract, round, finance.roundsPerSeason),
      0,
    ),
  );
  const possibleBonuses = roundMoney(
    state.contracts
      .filter((contract) => contract.status === "ACTIVE")
      .flatMap((contract) => contract.performanceTriggers)
      .filter(
        (trigger) =>
          trigger.consequence === "SALARY_BONUS" && !trigger.triggered,
      )
      .reduce((sum, trigger) => sum + (trigger.amountMillions ?? 0), 0),
  );
  const cashBalance = getCashBalance(state);
  return {
    cashBalance,
    payroll,
    income,
    nextSalary,
    nextGuarantees,
    commitments,
    possibleBonuses,
    payrollHeadroom: roundMoney(
      finance.payrollBudgetMillionsPerSeason - payroll,
    ),
    netPerRound: roundMoney(
      income - finance.operatingCostMillionsPerRound - nextSalary,
    ),
    projectedNextRoundCash: roundMoney(
      cashBalance +
        income -
        finance.operatingCostMillionsPerRound -
        nextSalary -
        nextGuarantees,
    ),
  };
}

export type ContractBudgetTerms = Pick<
  Contract,
  "salaryMillionsPerSeason" | "guaranteedSalaryMillions" | "endRound"
> & {
  additionalBonusMillions?: number;
};

export function assessContractBudget(
  state: PoliticalCoreState,
  contractId: string,
  terms: ContractBudgetTerms,
  round: number,
) {
  if (!Number.isInteger(round) || round < 0)
    throw new RangeError("Invalid budget round.");
  if (
    ![
      terms.salaryMillionsPerSeason,
      terms.guaranteedSalaryMillions,
      terms.additionalBonusMillions ?? 0,
    ].every((value) => Number.isFinite(value) && value >= 0) ||
    !Number.isInteger(terms.endRound) ||
    terms.endRound < round
  ) {
    throw new RangeError("Invalid financial contract terms.");
  }
  const projected = structuredClone(state);
  const contract = projected.contracts.find((item) => item.id === contractId);
  if (!contract) throw new Error(`Contract "${contractId}" was not found.`);
  // A proposed renewal is an active obligation even if an old negotiation
  // survives beyond expiry; its proposed salary must still count in the budget.
  contract.status = "ACTIVE";
  contract.salaryMillionsPerSeason = terms.salaryMillionsPerSeason;
  contract.guaranteedSalaryMillions = Math.max(
    contract.guaranteedSalaryMillions,
    terms.guaranteedSalaryMillions,
  );
  contract.endRound = terms.endRound;
  const summary = getFinanceSummary(projected, round);
  let reason: string | null = null;
  if (
    summary.payroll >
    state.finance.payrollBudgetMillionsPerSeason + 0.000001
  ) {
    reason = `Annual payroll €${summary.payroll.toFixed(2)}m exceeds the €${state.finance.payrollBudgetMillionsPerSeason.toFixed(2)}m budget.`;
  } else if (
    summary.commitments +
      summary.possibleBonuses +
      (terms.additionalBonusMillions ?? 0) >
    state.finance.commitmentBudgetMillions + 0.000001
  ) {
    reason =
      "Guaranteed pay, future salaries and potential bonuses exceed the approved contract commitment budget.";
  } else if (summary.projectedNextRoundCash < 0) {
    reason =
      "This deal would leave insufficient cash for the next round. Request owner funding or reduce operating costs.";
  }
  return { affordable: reason === null, reason, ...summary };
}

export function requireContractBudget(
  state: PoliticalCoreState,
  contractId: string,
  terms: ContractBudgetTerms,
  round: number,
): void {
  const assessment = assessContractBudget(state, contractId, terms, round);
  if (!assessment.affordable) throw new Error(assessment.reason!);
}

export function getOwnerFundingAmount(state: PoliticalCoreState) {
  return roundMoney(
    (OWNER_FUNDING_MILLIONS * state.finance.payrollBudgetMillionsPerSeason) /
      70,
  );
}

export function getOwnerFundingBlockReason(
  state: PoliticalCoreState,
): string | null {
  if (state.finance.ownerFundingUsed)
    return "Emergency owner funding has already been used.";
  if (
    getCashBalance(state) >=
    (LOW_CASH_THRESHOLD_MILLIONS *
      state.finance.payrollBudgetMillionsPerSeason) /
      70
  )
    return `Owner funding becomes available below €${Number(((8 * state.finance.payrollBudgetMillionsPerSeason) / 70).toFixed(2))}m cash.`;
  if (
    !state.characters.some((item) =>
      ["CEO", "OWNER_REPRESENTATIVE"].includes(item.role),
    )
  )
    return "No owner representative is available.";
  return null;
}

export function requestOwnerFunding(
  sourceState: PoliticalCoreState,
  round: number,
): PoliticalCoreState {
  requireRound(round);
  const reason = getOwnerFundingBlockReason(sourceState);
  if (reason) throw new Error(reason);
  const nextState = structuredClone(sourceState);
  nextState.finance.ownerFundingUsed = true;
  appendTransaction(nextState, {
    id: `owner_emergency_funding_${nextState.finance.transactions.filter((t) => t.category === "OWNER_FUNDING").length + 1}_r${round}`,
    round,
    category: "OWNER_FUNDING",
    amountMillions: getOwnerFundingAmount(nextState),
    description: "Emergency owner funding",
  });
  const owner = nextState.characters.find((item) =>
    ["CEO", "OWNER_REPRESENTATIVE"].includes(item.role),
  )!;
  const principal = nextState.characters.find(
    (item) => item.role === "TEAM_PRINCIPAL",
  );
  if (principal) {
    principal.dynamic.institutionalReputation = Math.max(
      0,
      principal.dynamic.institutionalReputation - 8,
    );
    const relationship = nextState.relationships.find(
      (item) =>
        item.fromCharacterId === owner.id &&
        item.toCharacterId === principal.id,
    );
    if (relationship) relationship.trust = Math.max(0, relationship.trust - 10);
  }
  owner.power.internalInfluence = Math.min(
    100,
    owner.power.internalInfluence + 5,
  );
  return validated(nextState);
}

export function cutOperatingCosts(
  sourceState: PoliticalCoreState,
): PoliticalCoreState {
  if (sourceState.finance.costCutsApplied)
    throw new Error("Operating cost cuts have already been applied.");
  if (sourceState.finance.operatingCostMillionsPerRound === 0)
    throw new Error("There are no operating costs to cut.");
  const nextState = structuredClone(sourceState);
  nextState.finance.costCutsApplied = true;
  nextState.finance.operatingCostMillionsPerRound = roundMoney(
    nextState.finance.operatingCostMillionsPerRound * 0.8,
  );
  for (const character of nextState.characters) {
    if (["TECHNICAL_DIRECTOR", "RACE_ENGINEER"].includes(character.role)) {
      character.dynamic.instability = Math.min(
        100,
        character.dynamic.instability + 8,
      );
      character.dynamic.politicalFatigue = Math.min(
        100,
        character.dynamic.politicalFatigue + 8,
      );
    }
  }
  return validated(nextState);
}
