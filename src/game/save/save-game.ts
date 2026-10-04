import { createTeamFinance } from "@/game/finance/defaults";
import { roundMoney } from "@/game/finance/finances";
import { validatePoliticalCoreState } from "@/game/political/validation";

export const SAVE_VERSION = 7;

export type SaveEnvelope<T> = {
  version: typeof SAVE_VERSION;
  kind: string;
  savedAt: string;
  state: T;
};

export function encodeSave<T>(kind: string, state: T): string {
  const envelope: SaveEnvelope<T> = {
    version: SAVE_VERSION,
    kind,
    savedAt: new Date().toISOString(),
    state,
  };

  return JSON.stringify(envelope);
}

export function decodeSave<T>(raw: string, expectedKind: string): SaveEnvelope<T> {
  const input: unknown = JSON.parse(raw);
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid save envelope.");
  const parsed = input as Partial<SaveEnvelope<T>>;

  if (parsed.version !== SAVE_VERSION && Number(parsed.version) !== 6) {
    throw new Error("Unsupported save version.");
  }
  if (parsed.kind !== expectedKind) {
    throw new Error("Save belongs to a different game stage.");
  }
  if (!parsed.state) {
    throw new Error("Save does not contain game state.");
  }

  if (parsed.kind === "ROUND_FLOW") {
    const state = parsed.state as Record<string, unknown>;
    const currentRound = state.currentRound;
    if (!Number.isInteger(currentRound) || Number(currentRound) < 1) {
      throw new Error("Save has an invalid current round.");
    }
    const political = state.political as Record<string, unknown> | undefined;
    if (!political || (parsed.version === SAVE_VERSION && !political.finance)) {
      throw new Error("Save does not contain valid team finances.");
    }
    if (parsed.version === SAVE_VERSION && Array.isArray(political.contracts) &&
      political.contracts.some((contract) => typeof contract?.salaryPaidMillions !== "number")) {
      throw new Error("Save does not contain paid-salary balances.");
    }
    const validation = validatePoliticalCoreState(political);
    if (!validation.success) throw new Error("Save contains an invalid game state.");
    const restored = validation.data;
    if (Number(parsed.version) === 6) {
      restored.finance = createTeamFinance(Number(currentRound));
      // The old game had no cash ledger. Start accounting at the loaded round,
      // estimating earlier salary accrual without charging the new account again.
      for (const contract of restored.contracts) {
        const elapsed = Math.max(0, Math.min(Number(currentRound), contract.endRound) - contract.startRound + 1);
        const estimate = roundMoney(elapsed * contract.salaryMillionsPerSeason / restored.finance.roundsPerSeason);
        contract.salaryPaidMillions = contract.status === "ACTIVE"
          ? estimate : Math.max(estimate, contract.guaranteedSalaryMillions);
      }
    }
    if (restored.finance.settledThroughRound > Number(currentRound)) {
      throw new Error("Save finances are ahead of the current round.");
    }
    state.political = restored;
  }

  parsed.version = SAVE_VERSION;

  return parsed as SaveEnvelope<T>;
}
