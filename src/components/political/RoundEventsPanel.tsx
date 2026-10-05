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
  const [saveMessage, setSpeichernMessage] = useState<string | null>(null);

  const raceActive =
    !!roundFlow.career?.weekend && !roundFlow.career.weekend.committed;
  const nextRound = getNextRound(roundFlow);
  const openIssues = getOpenIssues(roundFlow);

  function startNextRound() {
    applyContractAction((current) =>
      beginCareerWeekend(current, events, issueDefinitions),
    );
    setTab("RACING");
    setSpeichernMessage(null);
  }

  function takeIssueAction(issueId: string, actionId: string) {
    setRoundFlow((current) =>
      resolveRoundIssue(current, issueId, actionId, issueDefinitions),
    );
    setSpeichernMessage(null);
  }

  function takeConflictDecision(conflictId: string, decisionId: string) {
    setRoundFlow((current) =>
      resolveRoundConflict(current, conflictId, decisionId),
    );
    setSpeichernMessage(null);
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
      setSpeichernMessage(null);
    } catch (error) {
      setSpeichernMessage(
        error instanceof Error
          ? error.message
          : "Aktion konnte nicht ausgeführt werden.",
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
    setSpeichernMessage(null);
  }

  function saveGame() {
    try {
      window.localStorage.setItem(
        SAVE_KEY,
        encodeSave<RoundFlowState>("ROUND_FLOW", roundFlow),
      );
      setSpeichernMessage("Spiel lokal gespeichert.");
    } catch (error) {
      setSpeichernMessage(
        error instanceof Error ? error.message : "Spiel konnte nicht gespeichert werden.",
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
        setSpeichernMessage("Kein lokaler Spielstand gefunden.");
        return;
      }

      const save = decodeSave<RoundFlowState>(raw, "ROUND_FLOW");
      setRoundFlow(save.state);
      setSpeichernMessage("Spielstand geladen.");
      setTab("HOME");
    } catch (error) {
      setSpeichernMessage(
        error instanceof Error ? error.message : "Spielstand konnte nicht geladen werden.",
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
    setSpeichernMessage("Saisonverlauf zurückgesetzt.");
  }

  const tabs: Array<{ id: HqTab; title: string }> = [
    { id: "HOME", title: "Übersicht" },
    ...(roundFlow.career?.world
      ? [{ id: "WORLD" as HqTab, title: "Motorsport-Welt" }]
      : []),
    {
      id: "CAREER",
      title:
        "Karriere" +
        (roundFlow.career?.requests.filter((r) =>
          ["OPEN", "ESCALATED"].includes(r.status),
        ).length
          ? " (!)"
          : ""),
    },
    { id: "RACING", title: "Meisterschaft" },
    { id: "MARKET", title: "Transfermarkt" },
    { id: "DEVELOPMENT", title: "Entwicklung" },
    {
      id: "INBOX",
      title:
        "Posteingang" + (openIssues.length ? " (" + openIssues.length + ")" : ""),
    },
    { id: "PEOPLE", title: "Personal" },
    { id: "CENTERS", title: "Machtzentren" },
    { id: "POWER", title: "Politik" },
    { id: "TECHNICAL", title: "Technik" },
    { id: "CONTRACTS", title: "Verträge" },
    { id: "FINANCE", title: "Finanzen" },
    { id: "ISSUES", title: "Themen" },
  ];

  return (
    <section className="mt-3">
      <header className="tps-panel-raised overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 bg-[#0d121a] px-4 py-3">
          <div>
            <p className="tps-kicker">
              TEAMZENTRALE · LAUFENDE SAISON
            </p>
            <h2 className="mt-1 text-xl font-black">
              Season {2025 + (roundFlow.career?.season ?? 1)} · Round{" "}
              {roundFlow.currentRound === 0
                ? "1 · Vorsaison"
                : roundFlow.currentRound}
            </h2>
            <button
              type="button"
              onClick={() => setTab("FINANCE")}
              className="mt-2 text-sm text-emerald-300"
            >
              Cash €{getCashBalance(roundFlow.political).toFixed(2)}m · Finanzen öffnen
            </button>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-500">
              Ereignisse erzeugen Handlungsdruck. Du entscheidest, was Priorität hat; ungelöste Spannungen können zu politischen Konflikten eskalieren.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {onChooseCareer ? (
              <button
                type="button"
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm"
                onClick={onChooseCareer}
              >
                Serie / Team wechseln
              </button>
            ) : null}
            <button
              type="button"
              onClick={saveGame}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={loadGame}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500"
            >
              Laden
            </button>
            <button
              type="button"
              onClick={resetRounds}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500"
            >
              Saison zurücksetzen
            </button>
            {raceActive ? (
              <button
                type="button"
                onClick={() => setTab("RACING")}
                className="rounded-xl bg-sky-300 px-5 py-3 font-medium text-sky-950"
              >
                Rennwochenende fortsetzen
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
                  ? "Amtszeit beendet · Vorstandsbericht"
                  : "Saison beendet · Auswertung & nächste Saison"}
              </button>
            )}
          </div>
        </div>

        {openIssues.length > 0 ? (
          <p className="mt-4 text-sm text-amber-300">
            Bearbeite {openIssues.length} offene Entscheidung
            {openIssues.length === 1 ? "" : "s"} vor dem Start der nächsten Runde.
          </p>
        ) : null}
        {saveMessage ? (
          <p className="mt-3 text-xs text-zinc-500">{saveMessage}</p>
        ) : null}
      </header>

      <div className="mt-3 grid gap-3 lg:grid-cols-[184px_minmax(0,1fr)]">
        <nav className="tps-panel tps-scrollbar flex gap-1 overflow-x-auto p-2 lg:sticky lg:top-3 lg:block lg:h-fit lg:space-y-1 lg:overflow-visible">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={
                tab === item.id
                  ? "whitespace-nowrap rounded-md border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-left text-sm font-semibold text-cyan-200 lg:block lg:w-full"
                  : "whitespace-nowrap rounded-md border border-transparent px-4 py-3 text-left text-sm text-zinc-500 hover:border-slate-800 hover:bg-slate-900/60 hover:text-zinc-200 lg:block lg:w-full"
              }
            >
              {item.title}
            </button>
          ))}
        </nav>

      <fieldset
        className="min-w-0 tps-panel overflow-hidden p-3 md:p-4"
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
            <h3 className="text-xl font-semibold">Technischer Druck</h3>
            {roundFlow.issues
              .filter((issue) => issue.category === "TECHNICAL")
              .map((issue) => (
                <article
                  key={issue.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
                >
                  <p className="font-medium">{issue.title}</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {issue.status} · Eskalation {issue.escalation}
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
              · Präzedenz technische Autorität:{" "}
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
