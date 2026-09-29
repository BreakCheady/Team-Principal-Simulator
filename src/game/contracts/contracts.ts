import type { Contract, PoliticalCoreState } from "@/game/political/types";
import { validatePoliticalCoreState } from "@/game/political/validation";

export type ContractPerformanceSnapshot = {
  driverChampionshipPosition?: number;
  teamChampionshipPosition?: number;
  points?: number;
  wins?: number;
  podiums?: number;
};

export type ContractEvaluationResult = {
  nextState: PoliticalCoreState;
  triggeredPerformanceTriggerIds: string[];
};

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

function requireContract(state: PoliticalCoreState, contractId: string) {
  const contract = state.contracts.find((item) => item.id === contractId);
  if (!contract) throw new Error(`Contract "${contractId}" was not found.`);
  return contract;
}

function requireCharacter(state: PoliticalCoreState, characterId: string) {
  const character = state.characters.find((item) => item.id === characterId);
  if (!character) throw new Error(`Character "${characterId}" was not found.`);
  return character;
}

function metricValue(
  metric: Contract["performanceTriggers"][number]["metric"],
  snapshot: ContractPerformanceSnapshot,
): number | undefined {
  switch (metric) {
    case "DRIVER_CHAMPIONSHIP_POSITION":
      return snapshot.driverChampionshipPosition;
    case "TEAM_CHAMPIONSHIP_POSITION":
      return snapshot.teamChampionshipPosition;
    case "POINTS":
      return snapshot.points;
    case "WINS":
      return snapshot.wins;
    case "PODIUMS":
      return snapshot.podiums;
  }
}

function triggerMatches(
  trigger: Contract["performanceTriggers"][number],
  snapshot: ContractPerformanceSnapshot,
): boolean {
  const value = metricValue(trigger.metric, snapshot);
  if (value === undefined) return false;

  return trigger.comparator === "AT_LEAST"
    ? value >= trigger.threshold
    : value <= trigger.threshold;
}

export function syncContractCareerState(
  sourceState: PoliticalCoreState,
  contractId: string,
  currentRound: number,
): PoliticalCoreState {
  const nextState = structuredClone(sourceState);
  const contract = requireContract(nextState, contractId);
  const character = requireCharacter(nextState, contract.characterId);

  if (contract.status !== "ACTIVE") {
    character.career.contractSecurity = 0;
    character.career.transferInterest = clamp(
      0,
      100,
      character.career.transferInterest + 15,
    );
    return nextState;
  }

  const remainingRounds = Math.max(0, contract.endRound - currentRound);
  const availableExtensionRounds = contract.options
    .filter((option) => option.available && !option.exercised)
    .reduce((sum, option) => sum + option.extensionRounds, 0);
  const activeReleaseClause = contract.releaseClauses.some(
    (clause) =>
      clause.active &&
      currentRound >= clause.activeFromRound &&
      currentRound <= clause.expiresAfterRound,
  );

  character.career.contractSecurity = clamp(
    0,
    100,
    35 + remainingRounds * 3 + Math.min(25, availableExtensionRounds * 2),
  );

  const releasePressure = activeReleaseClause ? 12 : 0;
  character.career.transferInterest = clamp(
    0,
    100,
    character.career.transferInterest + releasePressure,
  );

  return nextState;
}

export function evaluateContractPerformance(
  sourceState: PoliticalCoreState,
  contractId: string,
  snapshot: ContractPerformanceSnapshot,
  currentRound: number,
): ContractEvaluationResult {
  let nextState = structuredClone(sourceState);
  const contract = requireContract(nextState, contractId);
  const triggeredPerformanceTriggerIds: string[] = [];

  for (const trigger of contract.performanceTriggers) {
    if (trigger.triggered || !triggerMatches(trigger, snapshot)) continue;

    trigger.triggered = true;
    triggeredPerformanceTriggerIds.push(trigger.id);

    switch (trigger.consequence) {
      case "SALARY_BONUS":
        contract.earnedBonusesMillions += trigger.amountMillions ?? 0;
        break;
      case "OPTION_ACTIVATION": {
        const option = contract.options.find(
          (item) => item.id === trigger.targetOptionId,
        );
        if (!option) {
          throw new Error(
            `Contract option "${trigger.targetOptionId}" was not found.`,
          );
        }
        option.available = true;
        break;
      }
      case "RELEASE_CLAUSE_ACTIVATION": {
        const clause = contract.releaseClauses.find(
          (item) => item.id === trigger.targetReleaseClauseId,
        );
        if (!clause) {
          throw new Error(
            `Release clause "${trigger.targetReleaseClauseId}" was not found.`,
          );
        }
        clause.active = true;
        break;
      }
    }
  }

  nextState = syncContractCareerState(nextState, contractId, currentRound);

  const validation = validatePoliticalCoreState(nextState);
  if (!validation.success) {
    throw new Error("Contract performance evaluation produced an invalid state.");
  }

  return {
    nextState: validation.data,
    triggeredPerformanceTriggerIds,
  };
}

export function exerciseContractOption(
  sourceState: PoliticalCoreState,
  contractId: string,
  optionId: string,
  currentRound: number,
): PoliticalCoreState {
  let nextState = structuredClone(sourceState);
  const contract = requireContract(nextState, contractId);

  if (contract.status !== "ACTIVE") {
    throw new Error("Only active contracts can exercise options.");
  }

  const option = contract.options.find((item) => item.id === optionId);
  if (!option) throw new Error(`Contract option "${optionId}" was not found.`);
  if (!option.available) throw new Error("Contract option is not available.");
  if (option.exercised) throw new Error("Contract option was already exercised.");
  if (
    currentRound < option.exerciseFromRound ||
    currentRound > option.exerciseUntilRound
  ) {
    throw new Error("Contract option is outside its exercise window.");
  }

  option.exercised = true;
  contract.endRound += option.extensionRounds;
  contract.salaryMillionsPerSeason = Number(
    (contract.salaryMillionsPerSeason * option.salaryMultiplier).toFixed(2),
  );

  nextState = syncContractCareerState(nextState, contractId, currentRound);

  const validation = validatePoliticalCoreState(nextState);
  if (!validation.success) {
    throw new Error("Contract option produced an invalid state.");
  }

  return validation.data;
}

export function advanceContractsForRound(
  sourceState: PoliticalCoreState,
  round: number,
): PoliticalCoreState {
  let nextState = structuredClone(sourceState);

  for (const contract of nextState.contracts) {
    if (contract.status === "ACTIVE" && round > contract.endRound) {
      contract.status = "EXPIRED";
    }
  }

  for (const contract of nextState.contracts) {
    nextState = syncContractCareerState(nextState, contract.id, round);
  }

  const validation = validatePoliticalCoreState(nextState);
  if (!validation.success) {
    throw new Error("Contract round advancement produced an invalid state.");
  }

  return validation.data;
}
