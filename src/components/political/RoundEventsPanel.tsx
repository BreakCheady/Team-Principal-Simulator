"use client";

import { MotorsportWorldPanel } from "@/components/political/MotorsportWorldPanel";

import { useMemo, useState } from "react";
import { CareerPanel } from "@/components/political/CareerPanel";
import { beginCareerWeekend, createCareerFlow } from "@/game/career/career";
import { FinancePanel } from "@/components/political/FinancePanel";
import {
  createNegotiationOffer,
  type ContractNegotiationOffer,
} from "@/game/contracts/negotiations";
import { assessContractBudget, getCashBalance } from "@/game/finance/finances";
import {
  canExerciseTeamOption,
  isReleaseClauseInForce,
} from "@/game/contracts/contracts";
import type { IssueDefinition } from "@/game/issues/issues";
import { calculateConflict } from "@/game/political/conflicts";
import { getConflictDecisions } from "@/game/political/decisions";
import type { PoliticalCoreState } from "@/game/political/types";
import { decodeSave, encodeSave } from "@/game/save/save-game";
import {
  exerciseRoundContractOption,
  getNextRound,
  getOpenIssues,
  acceptRoundContractCounter,
  rejectRoundContractNegotiation,
  resolveRoundConflict,
  resolveRoundIssue,
  startRoundContractNegotiation,
  submitRoundContractOffer,
  takeRoundFinanceAction,
  type RoundFlowState,
} from "@/game/season/round-flow";
import type { RoundEventDefinition } from "@/game/season/round-events";

type Props = {
  initialState: PoliticalCoreState;
  events: RoundEventDefinition[];
  issueDefinitions: IssueDefinition[];
  afterRound: number;
  initialFlow?: RoundFlowState;
  onChooseCareer?: () => void;
};

type HqTab =
  | "WORLD"
  | "MARKET"
  | "RACING"
  | "DEVELOPMENT"
  | "CAREER"
  | "INBOX"
  | "PEOPLE"
  | "CENTERS"
  | "POWER"
  | "TECHNICAL"
  | "CONTRACTS"
  | "FINANCE"
  | "ISSUES";

const SAVE_KEY = "team-principal-simulator-v03-rounds";

function format(value: number) {
  return value.toFixed(1);
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

export function RoundEventsPanel({
  initialState,
  events,
  issueDefinitions,
  afterRound,
  initialFlow,
  onChooseCareer,
}: Props) {
  const [roundFlow, setRoundFlow] = useState(() =>
    initialFlow
      ? structuredClone(initialFlow)
      : createCareerFlow(initialState, events, afterRound),
  );
  const [tab, setTab] = useState<HqTab>("INBOX");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const raceActive =
    !!roundFlow.career?.weekend && !roundFlow.career.weekend.committed;
  const nextRound = getNextRound(roundFlow);
  const latest = roundFlow.history.at(-1) ?? null;
  const openIssues = getOpenIssues(roundFlow);

  const activeConflicts = useMemo(
    () =>
      roundFlow.political.conflicts.filter(
        (conflict) =>
          conflict.status === "ACTIVE" || conflict.status === "ESCALATED",
      ),
    [roundFlow.political.conflicts],
  );

  const inboxIssues = useMemo(
    () =>
      [...roundFlow.issues].sort((a, b) => {
        const priority = { OPEN: 0, WATCHING: 1, ESCALATED: 2, RESOLVED: 3 };
        return priority[a.status] - priority[b.status] || b.round - a.round;
      }),
    [roundFlow.issues],
  );

  function startNextRound() {
    applyContractAction((current) =>
      beginCareerWeekend(current, events, issueDefinitions),
    );
    setTab("RACING");
    setSaveMessage(null);
  }

  function takeIssueAction(issueId: string, actionId: string) {
    setRoundFlow((current) =>
      resolveRoundIssue(current, issueId, actionId, issueDefinitions),
    );
    setSaveMessage(null);
  }

  function takeConflictDecision(conflictId: string, decisionId: string) {
    setRoundFlow((current) =>
      resolveRoundConflict(current, conflictId, decisionId),
    );
    setSaveMessage(null);
  }

  function startNegotiation(contractId: string) {
    applyContractAction((current) =>
      startRoundContractNegotiation(current, contractId),
    );
  }

  function exerciseTeamOption(contractId: string, optionId: string) {
    applyContractAction((current) =>
      exerciseRoundContractOption(current, contractId, optionId),
    );
  }

  function applyContractAction(
    action: (current: RoundFlowState) => RoundFlowState,
  ) {
    try {
      setRoundFlow(action(roundFlow));
      setSaveMessage(null);
    } catch (error) {
      setSaveMessage(
        error instanceof Error
          ? error.message
          : "Could not complete the action.",
      );
    }
  }

  function financeAction(action: "OWNER_FUNDING" | "CUT_OPERATING_COSTS") {
    applyContractAction((current) => takeRoundFinanceAction(current, action));
  }

  function offerBudget(contractId: string, offer: ContractNegotiationOffer) {
    const contract = roundFlow.political.contracts.find(
      (item) => item.id === contractId,
    )!;
    return assessContractBudget(
      roundFlow.political,
      contractId,
      {
        salaryMillionsPerSeason: offer.salaryMillionsPerSeason,
        guaranteedSalaryMillions: offer.guaranteedSalaryMillions,
        endRound:
          Math.max(contract.endRound, roundFlow.currentRound) +
          offer.extensionRounds,
        additionalBonusMillions: offer.performanceBonusMillions,
      },
      roundFlow.currentRound,
    );
  }

  function submitContractOffer(
    negotiationId: string,
    posture: "FIRM" | "BALANCED" | "GENEROUS",
  ) {
    applyContractAction((current) =>
      submitRoundContractOffer(
        current,
        negotiationId,
        posture,
        issueDefinitions,
      ),
    );
  }

  function acceptCounterOffer(negotiationId: string) {
    applyContractAction((current) =>
      acceptRoundContractCounter(current, negotiationId, issueDefinitions),
    );
  }

  function walkAwayFromNegotiation(negotiationId: string) {
    setRoundFlow((current) =>
      rejectRoundContractNegotiation(current, negotiationId, issueDefinitions),
    );
    setSaveMessage(null);
  }

  function saveGame() {
    window.localStorage.setItem(
      SAVE_KEY,
      encodeSave<RoundFlowState>("ROUND_FLOW", roundFlow),
    );
    setSaveMessage("Game saved locally.");
  }

  function loadGame() {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      setSaveMessage("No local round save found.");
      return;
    }

    try {
      const save = decodeSave<RoundFlowState>(raw, "ROUND_FLOW");
      setRoundFlow(save.state);
      setSaveMessage("Local save loaded.");
      setTab("INBOX");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Could not load save.",
      );
    }
  }

  function resetRounds() {
    setRoundFlow(
      initialFlow
        ? structuredClone(initialFlow)
        : createCareerFlow(initialState, events, afterRound),
    );
    setTab("INBOX");
    setSaveMessage("Round flow reset.");
  }

  const tabs: Array<{ id: HqTab; title: string }> = [
    ...(roundFlow.career?.world
      ? [{ id: "WORLD" as HqTab, title: "Motorsport World" }]
      : []),
    {
      id: "CAREER",
      title:
        "Career" +
        (roundFlow.career?.requests.filter((r) =>
          ["OPEN", "ESCALATED"].includes(r.status),
        ).length
          ? " (!)"
          : ""),
    },
    { id: "RACING", title: "Championship" },
    { id: "MARKET", title: "Transfer Market" },
    { id: "DEVELOPMENT", title: "Development" },
    {
      id: "INBOX",
      title:
        "Inbox" + (openIssues.length ? " (" + openIssues.length + ")" : ""),
    },
    { id: "PEOPLE", title: "People" },
    { id: "CENTERS", title: "Power Centers" },
    { id: "POWER", title: "Power" },
    { id: "TECHNICAL", title: "Technical" },
    { id: "CONTRACTS", title: "Contracts" },
    { id: "FINANCE", title: "Finance" },
    { id: "ISSUES", title: "Issues" },
  ];

  return (
    <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950/50 p-4 md:p-6">
      <header className="rounded-2xl border border-sky-900/70 bg-sky-950/20 p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400">
              Team HQ · live season
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              Season {2025 + (roundFlow.career?.season ?? 1)} · Round{" "}
              {roundFlow.currentRound === 0
                ? "1 · Preseason"
                : roundFlow.currentRound}
            </h2>
            <button
              type="button"
              onClick={() => setTab("FINANCE")}
              className="mt-2 text-sm text-emerald-300"
            >
              Cash €{getCashBalance(roundFlow.political).toFixed(2)}m · View
              finances
            </button>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Events create issues. You choose what deserves attention, NPCs
              react, and unresolved pressure can become a full political
              conflict.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {onChooseCareer ? (
              <button
                type="button"
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm"
                onClick={onChooseCareer}
              >
                Choose series / team
              </button>
            ) : null}
            <button
              type="button"
              onClick={saveGame}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500"
            >
              Save
            </button>
            <button
              type="button"
              onClick={loadGame}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500"
            >
              Load
            </button>
            <button
              type="button"
              onClick={resetRounds}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500"
            >
              Reset rounds
            </button>
            {raceActive ? (
              <button
                type="button"
                onClick={() => setTab("RACING")}
                className="rounded-xl bg-sky-300 px-5 py-3 font-medium text-sky-950"
              >
                Resume race weekend
              </button>
            ) : !roundFlow.complete && nextRound !== null ? (
              <button
                type="button"
                onClick={startNextRound}
                disabled={openIssues.length > 0}
                className="rounded-xl bg-sky-300 px-5 py-3 font-medium text-sky-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                Start round {nextRound}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTab("CAREER")}
                className="rounded-full border border-emerald-800 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-300"
              >
                {roundFlow.career?.status === "DISMISSED"
                  ? "Tenure ended · View board report"
                  : "Season complete · Review & next season"}
              </button>
            )}
          </div>
        </div>

        {openIssues.length > 0 ? (
          <p className="mt-4 text-sm text-amber-300">
            Handle {openIssues.length} open inbox issue
            {openIssues.length === 1 ? "" : "s"} before starting the next round.
          </p>
        ) : null}
        {saveMessage ? (
          <p className="mt-3 text-xs text-zinc-500">{saveMessage}</p>
        ) : null}
      </header>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? "whitespace-nowrap rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950"
                : "whitespace-nowrap rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600"
            }
          >
            {item.title}
          </button>
        ))}
      </nav>

      <fieldset
        className="mt-5 min-w-0"
        disabled={
          roundFlow.career?.status === "DISMISSED" ||
          (raceActive && tab !== "RACING")
        }
      >
        {tab === "WORLD" && roundFlow.career?.world ? (
          <MotorsportWorldPanel world={roundFlow.career.world} />
        ) : null}
        {["MARKET", "RACING", "DEVELOPMENT", "CAREER"].includes(tab) ? (
          <CareerPanel
            flow={roundFlow}
            view={tab as "MARKET" | "RACING" | "DEVELOPMENT" | "CAREER"}
            onAction={applyContractAction}
          />
        ) : null}
        {tab === "FINANCE" ? (
          <FinancePanel
            state={roundFlow.political}
            round={roundFlow.currentRound}
            onAction={financeAction}
          />
        ) : null}
        {tab === "INBOX" ? (
          <div className="space-y-5">
            {roundFlow.career?.requests.some((r) =>
              ["OPEN", "ESCALATED"].includes(r.status),
            ) ? (
              <button
                type="button"
                className="rounded-xl border border-amber-800 p-4 text-left text-sm text-amber-300"
                onClick={() => setTab("CAREER")}
              >
                Actor initiatives require attention · Open Career
              </button>
            ) : null}
            {latest ? (
              <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Round {latest.round} report
                </p>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {latest.events.map((event) => (
                    <div
                      key={event.eventId}
                      className="rounded-xl border border-zinc-800 bg-black/20 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.14em] text-sky-400">
                        {label(event.type)}
                      </p>
                      <p className="mt-2 font-medium">{event.title}</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        {event.summary}
                      </p>
                      {(event.contractTriggers ?? []).map((trigger) => (
                        <p
                          key={trigger.contractId + trigger.triggerId}
                          className="mt-2 text-xs text-emerald-300"
                        >
                          {
                            roundFlow.political.characters.find(
                              (item) => item.id === trigger.characterId,
                            )?.name
                          }
                          {" · "}
                          {label(trigger.consequence)}
                          {trigger.consequence === "SALARY_BONUS"
                            ? ` · €${trigger.amountMillions}m earned`
                            : ""}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </article>
            ) : (
              <article className="rounded-2xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
                Start the next round to receive the first inbox items.
              </article>
            )}

            {inboxIssues.length === 0 ? (
              <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-500">
                Inbox clear. No management issues require attention.
              </article>
            ) : (
              inboxIssues.map((issue) => {
                const definition = issueDefinitions.find(
                  (item) => item.id === issue.definitionId,
                );
                const initiator = roundFlow.political.characters.find(
                  (character) => character.id === issue.initiatorCharacterId,
                );

                return (
                  <article
                    key={issue.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-zinc-400">
                            {issue.category}
                          </span>
                          <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-zinc-400">
                            {issue.status}
                          </span>
                        </div>
                        <h3 className="mt-3 text-xl font-semibold">
                          {issue.title}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          From {initiator?.name ?? issue.initiatorCharacterId}
                        </p>
                      </div>
                      <span
                        className={
                          issue.escalation >= 70
                            ? "text-sm font-medium text-red-300"
                            : issue.escalation >= 45
                              ? "text-sm font-medium text-amber-300"
                              : "text-sm font-medium text-emerald-300"
                        }
                      >
                        Escalation {issue.escalation}
                      </span>
                    </div>

                    <p className="mt-4 leading-7 text-zinc-300">
                      {issue.summary}
                    </p>

                    {(issue.status === "OPEN" || issue.status === "WATCHING") &&
                    definition ? (
                      <div className="mt-6 grid gap-3 lg:grid-cols-3">
                        {definition.actions.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => takeIssueAction(issue.id, action.id)}
                            className="rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-left transition hover:border-sky-700"
                          >
                            <span className="block font-medium">
                              {action.label}
                            </span>
                            <span className="mt-2 block text-xs leading-5 text-zinc-500">
                              {action.description}
                            </span>
                            {action.consequenceHints &&
                            action.consequenceHints.length > 0 ? (
                              <span className="mt-3 block border-t border-zinc-800 pt-3">
                                {action.consequenceHints.map((hint) => (
                                  <span
                                    key={hint}
                                    className="mt-1 block text-[11px] leading-4 text-zinc-400 first:mt-0"
                                  >
                                    • {hint}
                                  </span>
                                ))}
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {issue.selectedActionId ? (
                      <div className="mt-5 rounded-xl border border-zinc-800 bg-black/20 p-4 text-sm">
                        <p className="text-zinc-400">
                          Your action: {label(issue.selectedActionId)}
                        </p>
                        {issue.npcActions.at(-1) ? (
                          <p className="mt-2 text-violet-300">
                            NPC response: {issue.npcActions.at(-1)?.label}
                          </p>
                        ) : null}
                        {issue.spawnedConflictId ? (
                          <p className="mt-2 text-red-300">
                            Escalated into conflict: {issue.spawnedConflictId}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        ) : null}

        {tab === "PEOPLE" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {roundFlow.political.characters.map((character) => (
              <article
                key={character.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  {label(character.role)}
                  {character.active === false ? " · LEFT TEAM" : ""}
                </p>
                <h3 className="mt-2 text-xl font-semibold">{character.name}</h3>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-zinc-500">Momentum</dt>
                    <dd className="mt-1">{character.dynamic.momentum}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Fatigue</dt>
                    <dd className="mt-1">
                      {character.dynamic.politicalFatigue}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Instability</dt>
                    <dd className="mt-1">{character.dynamic.instability}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Ambition</dt>
                    <dd className="mt-1">{character.personality.ambition}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : null}

        {tab === "CENTERS" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {roundFlow.political.characters
              .filter(
                (character) =>
                  character.active !== false &&
                  [
                    "SPORTING_DIRECTOR",
                    "CEO",
                    "OWNER_REPRESENTATIVE",
                    "SPONSOR_REPRESENTATIVE",
                    "RACE_ENGINEER",
                  ].includes(character.role),
              )
              .map((character) => {
                const activeLeverage = roundFlow.political.leverages.filter(
                  (leverage) =>
                    leverage.ownerCharacterId === character.id &&
                    leverage.active,
                );
                const liveIssues = roundFlow.issues.filter(
                  (issue) =>
                    issue.initiatorCharacterId === character.id &&
                    issue.status !== "RESOLVED",
                );

                return (
                  <article
                    key={character.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.14em] text-violet-400">
                      {label(character.role)}
                      {character.active === false ? " · LEFT TEAM" : ""}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">
                      {character.name}
                    </h3>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-zinc-500">Internal influence</p>
                        <p className="mt-1">
                          {character.power.internalInfluence}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Owner access</p>
                        <p className="mt-1">{character.power.ownerAccess}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Commercial backing</p>
                        <p className="mt-1">
                          {character.power.commercialBacking}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Live issues</p>
                        <p className="mt-1">{liveIssues.length}</p>
                      </div>
                    </div>
                    {activeLeverage.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {activeLeverage.map((leverage) => (
                          <span
                            key={leverage.id}
                            className="rounded-full border border-violet-900 px-2.5 py-1 text-xs text-violet-300"
                          >
                            {label(leverage.type)} {leverage.strength}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
          </div>
        ) : null}

        {tab === "POWER" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeConflicts.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No active political conflicts.
              </p>
            ) : (
              activeConflicts.map((conflict) => {
                const calculation = calculateConflict(
                  roundFlow.political,
                  conflict,
                );
                const leaderA = roundFlow.political.characters.find(
                  (character) =>
                    character.id === conflict.factions[0].leaderCharacterId,
                );
                const leaderB = roundFlow.political.characters.find(
                  (character) =>
                    character.id === conflict.factions[1].leaderCharacterId,
                );

                return (
                  <article
                    key={conflict.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.14em] text-amber-400">
                      {label(conflict.type)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">
                      {conflict.issue}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-zinc-800 p-3">
                        <p>{leaderA?.name}</p>
                        <p className="mt-1 text-zinc-500">
                          Strength {format(calculation.factionA.strength)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 p-3">
                        <p>{leaderB?.name}</p>
                        <p className="mt-1 text-zinc-500">
                          Strength {format(calculation.factionB.strength)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-red-300">
                      Escalation {format(calculation.escalation)}
                    </p>
                    {conflict.id.startsWith("conflict_request_") ? (
                      <button
                        type="button"
                        onClick={() => setTab("CAREER")}
                        className="mt-3 text-sm text-sky-300"
                      >
                        Resolve actor demand in Career
                      </button>
                    ) : null}
                    {getConflictDecisions(conflict.id).length > 0 ? (
                      <div className="mt-5 grid gap-2">
                        {getConflictDecisions(conflict.id).map((decision) => (
                          <button
                            key={decision.id}
                            type="button"
                            onClick={() =>
                              takeConflictDecision(conflict.id, decision.id)
                            }
                            className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-left text-sm transition hover:border-amber-700"
                          >
                            <span className="font-medium">
                              {decision.label}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-zinc-500">
                              {decision.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        ) : null}

        {tab === "TECHNICAL" ? (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Technical pressure</h3>
            {roundFlow.issues
              .filter((issue) => issue.category === "TECHNICAL")
              .map((issue) => (
                <article
                  key={issue.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
                >
                  <p className="font-medium">{issue.title}</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {issue.status} · escalation {issue.escalation}
                  </p>
                </article>
              ))}
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-400">
              Chen momentum:{" "}
              {
                roundFlow.political.characters.find(
                  (character) => character.id === "char_chen",
                )?.dynamic.momentum
              }{" "}
              · technical authority precedent:{" "}
              {
                roundFlow.political.precedents.find(
                  (precedent) =>
                    precedent.id === "precedent_technical_authority",
                )?.strength
              }
            </article>
          </div>
        ) : null}

        {tab === "CONTRACTS" ? (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Contract room</h3>
            {roundFlow.issues
              .filter((issue) => issue.category === "CONTRACT")
              .map((issue) => (
                <article
                  key={issue.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
                >
                  <p className="font-medium">{issue.title}</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {issue.status} · escalation {issue.escalation}
                  </p>
                </article>
              ))}

            <div className="grid gap-4 lg:grid-cols-2">
              {roundFlow.political.contracts.map((contract) => {
                const character = roundFlow.political.characters.find(
                  (item) => item.id === contract.characterId,
                );
                const negotiation = [...roundFlow.negotiations]
                  .reverse()
                  .find((item) => item.contractId === contract.id);
                const activeClauses = contract.releaseClauses.filter((clause) =>
                  isReleaseClauseInForce(
                    contract,
                    clause,
                    roundFlow.currentRound,
                  ),
                );
                const openNegotiation = roundFlow.negotiations.some(
                  (session) =>
                    session.contractId === contract.id &&
                    ["OPEN", "COUNTERED"].includes(session.status),
                );
                const pendingTriggers = contract.performanceTriggers.filter(
                  (trigger) => !trigger.triggered,
                );

                return (
                  <article
                    key={contract.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
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
                        €{contract.salaryMillionsPerSeason}m / season
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-zinc-400">
                      Guaranteed €{contract.guaranteedSalaryMillions}m · bonuses
                      earned €{contract.earnedBonusesMillions}m
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Salary paid €{contract.salaryPaidMillions.toFixed(2)}m ·
                      remaining guaranteed pay €
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
                              roundFlow.currentRound,
                            );
                            const budget = eligible
                              ? assessContractBudget(
                                  roundFlow.political,
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
                                  roundFlow.currentRound,
                                )
                              : null;
                            return (
                              <div
                                key={option.id}
                                className="rounded-lg border border-zinc-800 p-3 text-xs text-zinc-400"
                              >
                                {option.holder} · +{option.extensionRounds}{" "}
                                rounds · window R{option.exerciseFromRound}–R
                                {option.exerciseUntilRound} ·
                                {option.exercised
                                  ? " exercised"
                                  : option.available
                                    ? " available"
                                    : " locked"}
                                <p className="mt-1">
                                  Salary on exercise: €
                                  {(
                                    contract.salaryMillionsPerSeason *
                                    (option.exercised
                                      ? 1
                                      : option.salaryMultiplier)
                                  ).toFixed(2)}
                                  m / season
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
                                      Exercise team option
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
                                      ? "Requires agreement from both parties."
                                      : "The character controls this option."}
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
                          Release clauses
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
                                roundFlow.currentRound,
                              )
                                ? " in force"
                                : clause.active
                                  ? " outside active term or window"
                                  : " locked"}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {contract.performanceTriggers.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                          Performance triggers
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
                              · {trigger.triggered ? "triggered" : "pending"}
                            </div>
                          ))}
                        </div>
                        {pendingTriggers.length === 0 ? (
                          <p className="mt-2 text-xs text-emerald-400">
                            All performance triggers resolved.
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {activeClauses.length > 0 ? (
                      <p className="mt-4 text-xs text-amber-300">
                        {activeClauses.length} active release clause
                        {activeClauses.length === 1 ? "" : "s"}
                      </p>
                    ) : null}

                    {contract.status === "ACTIVE" &&
                    (!roundFlow.career ||
                      roundFlow.career.activeActorIds.includes(
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

                            <div className="rounded-xl border border-zinc-800 bg-black/20 p-4 text-xs text-zinc-400">
                              <p className="font-medium text-zinc-300">
                                Character demand
                              </p>
                              <p className="mt-2">
                                €
                                {
                                  negotiation.characterDemand
                                    .salaryMillionsPerSeason
                                }
                                m / season · guaranteed €
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
                              <div className="rounded-xl border border-amber-900 bg-amber-950/10 p-4 text-xs text-amber-200">
                                <p className="font-medium">Counteroffer</p>
                                <p className="mt-2">
                                  €
                                  {
                                    negotiation.counterOffer
                                      .salaryMillionsPerSeason
                                  }
                                  m / season · guaranteed €
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
                                  Accept counteroffer
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
                                          ? "Firm offer"
                                          : posture === "BALANCED"
                                            ? "Balanced offer"
                                            : "Generous offer"}
                                      </button>
                                      <p className="mt-2 text-xs text-zinc-500">
                                        €
                                        {offer.salaryMillionsPerSeason.toFixed(
                                          2,
                                        )}
                                        m / season · payroll after offer €
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
                              Walk away from talks
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
        ) : null}

        {tab === "ISSUES" ? (
          <div className="space-y-3">
            {roundFlow.issues.length === 0 ? (
              <p className="text-sm text-zinc-500">No issues recorded yet.</p>
            ) : (
              roundFlow.issues.map((issue) => (
                <article
                  key={issue.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{issue.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Round {issue.round} · {issue.category}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {issue.status} · {issue.escalation}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}
      </fieldset>

      {roundFlow.history.length > 0 ? (
        <footer className="mt-6 border-t border-zinc-800 pt-5">
          <div className="flex flex-wrap gap-2">
            {roundFlow.history.map((entry) => (
              <span
                key={entry.round}
                className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500"
              >
                R{entry.round}: {entry.events.length} event
                {entry.events.length === 1 ? "" : "s"} ·{" "}
                {entry.createdIssueIds.length} issue
                {entry.createdIssueIds.length === 1 ? "" : "s"}
              </span>
            ))}
          </div>
        </footer>
      ) : null}
    </section>
  );
}
