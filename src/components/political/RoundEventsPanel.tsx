"use client";

import { MotorsportWorldPanel } from "@/components/political/MotorsportWorldPanel";

import { useState } from "react";
import { CareerPanel } from "@/components/political/CareerPanel";
import { beginCareerWeekend, createCareerFlow } from "@/game/career/career";
import { FinancePanel } from "@/components/political/FinancePanel";
import { ContractsPanel } from "@/components/political/ContractsPanel";
import { InboxIssuesPanel } from "@/components/political/InboxIssuesPanel";
import { PeoplePowerCentersPanel } from "@/components/political/PeoplePowerCentersPanel";
import { PoliticalConflictsPanel } from "@/components/political/PoliticalConflictsPanel";
import { HqDashboard } from "@/components/political/HqDashboard";
import { getCashBalance } from "@/game/finance/finances";
import type { IssueDefinition } from "@/game/issues/issues";
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
  | "HOME"
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

const SAVE_KEY = "team-principal-simulator-v11-rounds";
const LEGACY_SAVE_KEYS = ["team-principal-simulator-v03-rounds"] as const;


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
  const [tab, setTab] = useState<HqTab>("HOME");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const raceActive =
    !!roundFlow.career?.weekend && !roundFlow.career.weekend.committed;
  const nextRound = getNextRound(roundFlow);
  const openIssues = getOpenIssues(roundFlow);

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
    try {
      window.localStorage.setItem(
        SAVE_KEY,
        encodeSave<RoundFlowState>("ROUND_FLOW", roundFlow),
      );
      setSaveMessage("Game saved locally.");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Could not save game.",
      );
    }
  }

  function loadGame() {
    try {
      const raw =
        window.localStorage.getItem(SAVE_KEY) ??
        LEGACY_SAVE_KEYS.map((key) => window.localStorage.getItem(key)).find(
          (value) => value !== null,
        );

      if (!raw) {
        setSaveMessage("No local round save found.");
        return;
      }

      const save = decodeSave<RoundFlowState>(raw, "ROUND_FLOW");
      setRoundFlow(save.state);
      setSaveMessage("Local save loaded.");
      setTab("HOME");
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
    setTab("HOME");
    setSaveMessage("Round flow reset.");
  }

  const tabs: Array<{ id: HqTab; title: string }> = [
    { id: "HOME", title: "HQ Overview" },
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
    <section className="mt-6">
      <header className="tps-panel tps-track-grid overflow-hidden p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="tps-kicker">
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

      <div className="mt-5 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="tps-scrollbar flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-4 lg:block lg:h-fit lg:space-y-1 lg:overflow-visible lg:pb-0">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={
                tab === item.id
                  ? "whitespace-nowrap rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-left text-sm font-semibold text-cyan-200 lg:block lg:w-full"
                  : "whitespace-nowrap rounded-xl border border-transparent px-4 py-3 text-left text-sm text-zinc-500 hover:border-slate-800 hover:bg-slate-900/60 hover:text-zinc-200 lg:block lg:w-full"
              }
            >
              {item.title}
            </button>
          ))}
        </nav>

      <fieldset
        className="min-w-0 tps-panel p-4 md:p-6"
        disabled={
          roundFlow.career?.status === "DISMISSED" ||
          (raceActive && tab !== "RACING")
        }
      >
        {tab === "HOME" ? (
          <HqDashboard
            flow={roundFlow}
            onNavigate={(next) => setTab(next)}
            onStartNextRound={startNextRound}
          />
        ) : null}
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
        {tab === "INBOX" || tab === "ISSUES" ? (
          <InboxIssuesPanel
            flow={roundFlow}
            issueDefinitions={issueDefinitions}
            view={tab}
            onIssueAction={takeIssueAction}
            onOpenCareer={() => setTab("CAREER")}
          />
        ) : null}

        {tab === "PEOPLE" || tab === "CENTERS" ? (
          <PeoplePowerCentersPanel flow={roundFlow} view={tab} />
        ) : null}

        {tab === "POWER" ? (
          <PoliticalConflictsPanel
            flow={roundFlow}
            onConflictDecision={takeConflictDecision}
            onOpenCareer={() => setTab("CAREER")}
          />
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
          <ContractsPanel
            flow={roundFlow}
            startNegotiation={startNegotiation}
            exerciseTeamOption={exerciseTeamOption}
            submitContractOffer={submitContractOffer}
            acceptCounterOffer={acceptCounterOffer}
            walkAwayFromNegotiation={walkAwayFromNegotiation}
          />
        ) : null}

      </fieldset>
      </div>

      {roundFlow.history.length > 0 ? (
        <footer className="mt-6 px-1">
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
