"use client";

import {
  createNegotiationOffer,
  type ContractNegotiationOffer,
} from "@/game/contracts/negotiations";
import {
  canExerciseTeamOption,
  isReleaseClauseInForce,
} from "@/game/contracts/contracts";
import { assessContractBudget } from "@/game/finance/finances";
import type { RoundFlowState } from "@/game/season/round-flow";

type Props = {
  flow: RoundFlowState;
  startNegotiation: (contractId: string) => void;
  exerciseTeamOption: (contractId: string, optionId: string) => void;
  submitContractOffer: (
    negotiationId: string,
    posture: "FIRM" | "BALANCED" | "GENEROUS",
  ) => void;
  acceptCounterOffer: (negotiationId: string) => void;
  walkAwayFromNegotiation: (negotiationId: string) => void;
};

function label(value: string) {
  return value.replaceAll("_", " ");
}

export function ContractsPanel({
  flow,
  startNegotiation,
  exerciseTeamOption,
  submitContractOffer,
  acceptCounterOffer,
  walkAwayFromNegotiation,
}: Props) {
  function offerBudget(contractId: string, offer: ContractNegotiationOffer) {
    const contract = flow.political.contracts.find(
      (item) => item.id === contractId,
    )!;
    return assessContractBudget(
      flow.political,
      contractId,
      {
        salaryMillionsPerSeason: offer.salaryMillionsPerSeason,
        guaranteedSalaryMillions: offer.guaranteedSalaryMillions,
        endRound:
          Math.max(contract.endRound, flow.currentRound) +
          offer.extensionRounds,
        additionalBonusMillions: offer.performanceBonusMillions,
      },
      flow.currentRound,
    );
  }

  return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Vertragszentrale</h3>
            {flow.issues
              .filter((issue) => issue.category === "CONTRACT")
              .map((issue) => (
                <article
                  key={issue.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5"
                >
                  <p className="font-medium">{issue.title}</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {issue.status} · escalation {issue.escalation}
                  </p>
                </article>
              ))}

            <div className="grid gap-4 lg:grid-cols-2">
              {flow.political.contracts.map((contract) => {
                const character = flow.political.characters.find(
                  (item) => item.id === contract.characterId,
                );
                const negotiation = [...flow.negotiations]
                  .reverse()
                  .find((item) => item.contractId === contract.id);
                const activeClauses = contract.releaseClauses.filter((clause) =>
                  isReleaseClauseInForce(
                    contract,
                    clause,
                    flow.currentRound,
                  ),
                );
                const openNegotiation = flow.negotiations.some(
                  (session) =>
                    session.contractId === contract.id &&
                    ["OPEN", "COUNTERED"].includes(session.status),
                );
                const offenTriggers = contract.performanceTriggers.filter(
                  (trigger) => !trigger.ausgelöst,
                );

                return (
                  <article
                    key={contract.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                          {character?.name ?? contract.characterId}
                        </p>
                        <h4 className="mt-2 text-lg font-semibold">
                          {contract.status} · R{contract.startRound}–R
                          {contract.endRound}
                        </h4>
                      </div>
                      <span className="text-sm text-emerald-300">
                        €{contract.salaryMillionsPerSeason}m / Saison
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-zinc-400">
                      Garantiert €{contract.guaranteedSalaryMillions}m · bonuses
                      earned €{contract.earnedBonusesMillions}m
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Gezahltes Gehalt €{contract.salaryPaidMillions.toFixed(2)}m ·
                      verbleibende Garantie €
                      {Math.max(
                        0,
                        contract.guaranteedSalaryMillions -
                          contract.salaryPaidMillions,
                      ).toFixed(2)}
                      m
                    </p>

                    {contract.options.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                          Options
                        </p>
                        <div className="mt-2 space-y-2">
                          {contract.options.map((option) => {
                            const eligible = canExerciseTeamOption(
                              contract,
                              option,
                              flow.currentRound,
                            );
                            const budget = eligible
                              ? assessContractBudget(
                                  flow.political,
                                  contract.id,
                                  {
                                    salaryMillionsPerSeason: Number(
                                      (
                                        contract.salaryMillionsPerSeason *
                                        option.salaryMultiplier
                                      ).toFixed(2),
                                    ),
                                    guaranteedSalaryMillions:
                                      contract.guaranteedSalaryMillions,
                                    endRound:
                                      contract.endRound +
                                      option.extensionRounds,
                                  },
                                  flow.currentRound,
                                )
                              : null;
                            return (
                              <div
                                key={option.id}
                                className="rounded-lg border border-zinc-800 p-3 text-xs text-zinc-400"
                              >
                                {option.holder} · +{option.extensionRounds}{" "}
                                Runden · Frist R{option.exerciseFromRound}–R
                                {option.exerciseUntilRound} ·
                                {option.exercised
                                  ? " ausgeübt"
                                  : option.available
                                    ? " verfügbar"
                                    : " gesperrt"}
                                <p className="mt-1">
                                  Gehalt nach Ausübung: €
                                  {(
                                    contract.salaryMillionsPerSeason *
                                    (option.exercised
                                      ? 1
                                      : option.salaryMultiplier)
                                  ).toFixed(2)}
                                  m / Saison
                                </p>
                                {option.holder === "TEAM" &&
                                !option.exercised ? (
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        exerciseTeamOption(
                                          contract.id,
                                          option.id,
                                        )
                                      }
                                      disabled={
                                        !eligible ||
                                        openNegotiation ||
                                        !budget?.affordable
                                      }
                                      className="mt-2 rounded-lg border border-emerald-800 px-3 py-2 text-emerald-300 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
                                    >
                                      Teamoption ziehen
                                    </button>
                                    {budget?.reason ? (
                                      <p className="mt-2 text-xs text-amber-300">
                                        {budget.reason}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : null}
                                {option.holder !== "TEAM" &&
                                !option.exercised ? (
                                  <p className="mt-2">
                                    {option.holder === "MUTUAL"
                                      ? "Erfordert die Zustimmung beider Parteien."
                                      : "Diese Option liegt bei der Person."}
                                  </p>
                                ) : null}
                                {openNegotiation &&
                                option.holder === "TEAM" &&
                                !option.exercised ? (
                                  <p className="mt-2">
                                    Finish renewal talks before exercising this
                                    option.
                                  </p>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {contract.releaseClauses.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                          Ausstiegsklauseln
                        </p>
                        <div className="mt-2 space-y-2">
                          {contract.releaseClauses.map((clause) => (
                            <div
                              key={clause.id}
                              className="rounded-lg border border-zinc-800 p-3 text-xs text-zinc-400"
                            >
                              €{clause.amountMillions}m · {clause.beneficiary} ·
                              R{clause.activeFromRound}–R
                              {clause.expiresAfterRound} ·
                              {isReleaseClauseInForce(
                                contract,
                                clause,
                                flow.currentRound,
                              )
                                ? " gültig"
                                : clause.active
                                  ? " außerhalb der gültigen Laufzeit oder Frist"
                                  : " gesperrt"}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {contract.performanceTriggers.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                          Leistungsbedingungen
                        </p>
                        <div className="mt-2 space-y-2">
                          {contract.performanceTriggers.map((trigger) => (
                            <div
                              key={trigger.id}
                              className="rounded-lg border border-zinc-800 p-3 text-xs text-zinc-400"
                            >
                              {label(trigger.metric)}{" "}
                              {trigger.comparator === "AT_LEAST" ? "≥" : "≤"}{" "}
                              {trigger.threshold} → {label(trigger.consequence)}{" "}
                              · {trigger.ausgelöst ? "ausgelöst" : "offen"}
                            </div>
                          ))}
                        </div>
                        {offenTriggers.length === 0 ? (
                          <p className="mt-2 text-xs text-emerald-400">
                            Alle Leistungsbedingungen sind abgeschlossen.
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {activeClauses.length > 0 ? (
                      <p className="mt-4 text-xs text-amber-300">
                        {activeClauses.length} aktive Ausstiegsklausel
                        {activeClauses.length === 1 ? "" : "s"}
                      </p>
                    ) : null}

                    {contract.status === "ACTIVE" &&
                    (!flow.career ||
                      flow.career.activeActorIds.includes(
                        contract.characterId,
                      )) ? (
                      <div className="mt-5 border-t border-zinc-800 pt-4">
                        {!negotiation ||
                        ["ACCEPTED", "REJECTED", "STALLED"].includes(
                          negotiation.status,
                        ) ? (
                          <button
                            type="button"
                            onClick={() => startNegotiation(contract.id)}
                            className="rounded-lg border border-emerald-800 px-3 py-2 text-sm text-emerald-300 hover:border-emerald-600"
                          >
                            Start renewal talks
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">
                                  Renewal negotiation · {negotiation.status}
                                </p>
                                <p className="mt-1 text-xs text-zinc-500">
                                  Team power {negotiation.power.teamPower} ·{" "}
                                  {character?.name ?? contract.characterId}{" "}
                                  power {negotiation.power.characterPower} ·
                                  delta {negotiation.power.delta}
                                </p>
                              </div>
                              <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400">
                                Turn {negotiation.turn}
                              </span>
                            </div>

                            <div className="rounded-md border border-zinc-800 bg-black/20 p-4 text-xs text-zinc-400">
                              <p className="font-medium text-zinc-300">
                                Character demand
                              </p>
                              <p className="mt-2">
                                €
                                {
                                  negotiation.characterDemand
                                    .salaryMillionsPerSeason
                                }
                                m / Saison · guaranteed €
                                {
                                  negotiation.characterDemand
                                    .guaranteedSalaryMillions
                                }
                                m · +
                                {negotiation.characterDemand.extensionRounds}{" "}
                                rounds
                              </p>
                              <p className="mt-1">
                                Release clause{" "}
                                {negotiation.characterDemand
                                  .releaseClauseMillions === null
                                  ? "none"
                                  : "€" +
                                    negotiation.characterDemand
                                      .releaseClauseMillions +
                                    "m"}{" "}
                                · performance bonus €
                                {
                                  negotiation.characterDemand
                                    .performanceBonusMillions
                                }
                                m
                              </p>
                            </div>

                            {negotiation.counterOffer ? (
                              <div className="rounded-md border border-amber-900 bg-amber-950/10 p-4 text-xs text-amber-200">
                                <p className="font-medium">Gegenangebot</p>
                                <p className="mt-2">
                                  €
                                  {
                                    negotiation.counterOffer
                                      .salaryMillionsPerSeason
                                  }
                                  m / Saison · guaranteed €
                                  {
                                    negotiation.counterOffer
                                      .guaranteedSalaryMillions
                                  }
                                  m · +
                                  {negotiation.counterOffer.extensionRounds}{" "}
                                  rounds
                                </p>
                                <p className="mt-1">
                                  Release clause{" "}
                                  {negotiation.counterOffer
                                    .releaseClauseMillions === null
                                    ? "none"
                                    : "€" +
                                      negotiation.counterOffer
                                        .releaseClauseMillions +
                                      "m"}{" "}
                                  · bonus €
                                  {
                                    negotiation.counterOffer
                                      .performanceBonusMillions
                                  }
                                  m
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    acceptCounterOffer(negotiation.id)
                                  }
                                  disabled={
                                    !offerBudget(
                                      contract.id,
                                      negotiation.counterOffer,
                                    ).affordable
                                  }
                                  className="mt-3 rounded-lg bg-amber-200 px-3 py-2 font-medium text-amber-950 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                                >
                                  Gegenangebot annehmen
                                </button>
                                {offerBudget(
                                  contract.id,
                                  negotiation.counterOffer,
                                ).reason ? (
                                  <p className="mt-2 text-xs">
                                    {
                                      offerBudget(
                                        contract.id,
                                        negotiation.counterOffer,
                                      ).reason
                                    }
                                  </p>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="grid gap-2 sm:grid-cols-3">
                              {(["FIRM", "BALANCED", "GENEROUS"] as const).map(
                                (posture) => {
                                  const offer = createNegotiationOffer(
                                    negotiation,
                                    posture,
                                  );
                                  const budget = offerBudget(
                                    contract.id,
                                    offer,
                                  );
                                  return (
                                    <div key={posture}>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          submitContractOffer(
                                            negotiation.id,
                                            posture,
                                          )
                                        }
                                        disabled={!budget.affordable}
                                        className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-sky-700 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
                                      >
                                        {posture === "FIRM"
                                          ? "Hartes Angebot"
                                          : posture === "BALANCED"
                                            ? "Ausgewogenes Angebot"
                                            : "Großzügiges Angebot"}
                                      </button>
                                      <p className="mt-2 text-xs text-zinc-500">
                                        €
                                        {offer.salaryMillionsPerSeason.toFixed(
                                          2,
                                        )}
                                        m / Saison · payroll after offer €
                                        {budget.payroll.toFixed(2)}m
                                      </p>
                                      {budget.reason ? (
                                        <p className="mt-2 text-xs text-amber-300">
                                          {budget.reason}
                                        </p>
                                      ) : null}
                                    </div>
                                  );
                                },
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                walkAwayFromNegotiation(negotiation.id)
                              }
                              className="text-xs text-red-300 hover:text-red-200"
                            >
                              Verhandlung beenden from talks
                            </button>
                          </div>
                        )}

                        {negotiation &&
                        ["ACCEPTED", "REJECTED", "STALLED"].includes(
                          negotiation.status,
                        ) ? (
                          <p className="mt-3 text-xs text-zinc-500">
                            Last negotiation: {negotiation.status}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>

  );
}
