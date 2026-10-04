import { createCareerFlow } from "@/game/career/career";
import { validateCareer } from "@/game/career/state";
import type { RoundFlowState } from "@/game/season/round-flow";
import { createTeamFinance } from "@/game/finance/defaults";
import { roundMoney } from "@/game/finance/finances";
import { validatePoliticalCoreState } from "@/game/political/validation";

export const SAVE_VERSION = 10;

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

export function decodeSave<T>(
  raw: string,
  expectedKind: string,
): SaveEnvelope<T> {
  const input: unknown = JSON.parse(raw);
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid save envelope.");
  const parsed = input as Partial<SaveEnvelope<T>>;

  if (
    parsed.version !== SAVE_VERSION &&
    ![6, 7, 8, 9].includes(Number(parsed.version))
  ) {
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
    if (!Number.isInteger(currentRound) || Number(currentRound) < 0) {
      throw new Error("Save has an invalid current round.");
    }
    const political = state.political as Record<string, unknown> | undefined;
    if (!political || (Number(parsed.version) >= 7 && !political.finance)) {
      throw new Error("Save does not contain valid team finances.");
    }
    if (
      Number(parsed.version) >= 7 &&
      Array.isArray(political.contracts) &&
      political.contracts.some(
        (contract) => typeof contract?.salaryPaidMillions !== "number",
      )
    ) {
      throw new Error("Save does not contain paid-salary balances.");
    }
    const validation = validatePoliticalCoreState(political);
    if (!validation.success)
      throw new Error("Save contains an invalid game state.");
    const restored = validation.data;
    if (Number(parsed.version) === 6) {
      restored.finance = createTeamFinance(Number(currentRound));
      // The old game had no cash ledger. Start accounting at the loaded round,
      // estimating earlier salary accrual without charging the new account again.
      for (const contract of restored.contracts) {
        const elapsed = Math.max(
          0,
          Math.min(Number(currentRound), contract.endRound) -
            contract.startRound +
            1,
        );
        const estimate = roundMoney(
          (elapsed * contract.salaryMillionsPerSeason) /
            restored.finance.roundsPerSeason,
        );
        contract.salaryPaidMillions =
          contract.status === "ACTIVE"
            ? estimate
            : Math.max(estimate, contract.guaranteedSalaryMillions);
      }
    }
    if (restored.finance.settledThroughRound > Number(currentRound)) {
      throw new Error("Save finances are ahead of the current round.");
    }
    if (
      Number(currentRound) === 0 &&
      !(state.career as { world?: unknown } | undefined)?.world
    )
      throw new Error("Only a new world career may be in preseason.");
    state.political = restored;
    const flow = state as unknown as RoundFlowState;
    if (
      !Array.isArray(flow.scheduledRounds) ||
      !Number.isInteger(flow.nextRoundIndex) ||
      flow.nextRoundIndex < 0 ||
      flow.nextRoundIndex > flow.scheduledRounds.length ||
      !Array.isArray(flow.history) ||
      !Array.isArray(flow.issues) ||
      !Array.isArray(flow.negotiations) ||
      typeof flow.complete !== "boolean" ||
      flow.scheduledRounds.some(
        (r, i) =>
          !Number.isInteger(r) ||
          r < 1 ||
          (i > 0 && r <= flow.scheduledRounds[i - 1]),
      )
    )
      throw new Error("Save contains an invalid round calendar.");
    if (flow.career) {
      flow.career = validateCareer(flow.career, restored, Number(currentRound));
      if (
        (flow.career.status === "RUNNING" && flow.complete) ||
        (flow.career.status !== "RUNNING" && !flow.complete) ||
        (flow.nextRoundIndex > 0 &&
          flow.scheduledRounds[flow.nextRoundIndex - 1] !==
            Number(currentRound)) ||
        (flow.career.status === "REVIEW" &&
          Number(currentRound) !== flow.career.seasonEnd)
      )
        throw new Error("Career save has an inconsistent phase.");
      if (
        flow.scheduledRounds.some(
          (r) => r < flow.career!.seasonStart || r > flow.career!.seasonEnd,
        ) ||
        (flow.scheduledRounds[flow.nextRoundIndex] !== undefined &&
          flow.scheduledRounds[flow.nextRoundIndex] <= Number(currentRound))
      )
        throw new Error("Career save has an inconsistent calendar.");
    } else if (Number(parsed.version) < 9) {
      // Preserve legacy political/financial history; begin new championship counters at the load boundary.
      const migrated = createCareerFlow(restored, [], Number(currentRound));
      flow.political = migrated.political;
      flow.career = migrated.career;
      flow.scheduledRounds = migrated.scheduledRounds;
      flow.nextRoundIndex = 0;
      flow.complete = migrated.complete;
      // A save at the old final round needs a playable next calendar without invented results or prizes.
      if (flow.complete) {
        flow.career!.season++;
        flow.career!.seasonStart = Number(currentRound) + 1;
        flow.career!.seasonEnd = Number(currentRound) + 24;
        flow.career!.status = "RUNNING";
        flow.scheduledRounds = Array.from(
          { length: 24 },
          (_, i) => Number(currentRound) + i + 1,
        );
        flow.complete = false;
      }
    }
  }

  parsed.version = SAVE_VERSION;

  return parsed as SaveEnvelope<T>;
}
