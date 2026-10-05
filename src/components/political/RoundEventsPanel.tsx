"use client";

import { useState } from "react";
import { MotorsportWorldPanel } from "@/components/political/MotorsportWorldPanel";
import { CareerPanel } from "@/components/political/CareerPanel";
import { FinancePanel } from "@/components/political/FinancePanel";
import { ContractsPanel } from "@/components/political/ContractsPanel";
import { InboxIssuesPanel } from "@/components/political/InboxIssuesPanel";
import { PeoplePowerCentersPanel } from "@/components/political/PeoplePowerCentersPanel";
import { PoliticalConflictsPanel } from "@/components/political/PoliticalConflictsPanel";
import { HqDashboard } from "@/components/political/HqDashboard";
import { beginCareerWeekend, createCareerFlow } from "@/game/career/career";
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
    initialFlow ? structuredClone(initialFlow) : createCareerFlow(initialState, events, afterRound),
  );
  const [tab, setTab] = useState<HqTab>("HOME");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const raceActive = !!roundFlow.career?.weekend && !roundFlow.career.weekend.committed;
  const nextRound = getNextRound(roundFlow);
  const openIssues = getOpenIssues(roundFlow);

  function applyAction(action: (current: RoundFlowState) => RoundFlowState) {
    try {
      setRoundFlow(action(roundFlow));
      setSaveMessage(null);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Aktion konnte nicht ausgeführt werden.");
    }
  }

  function startNextRound() {
    applyAction((current) => beginCareerWeekend(current, events, issueDefinitions));
    setTab("RACING");
  }

  function saveGame() {
    try {
      window.localStorage.setItem(SAVE_KEY, encodeSave<RoundFlowState>("ROUND_FLOW", roundFlow));
      setSaveMessage("Spielstand lokal gespeichert.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Spielstand konnte nicht gespeichert werden.");
    }
  }

  function loadGame() {
    try {
      const raw =
        window.localStorage.getItem(SAVE_KEY) ??
        LEGACY_SAVE_KEYS.map((key) => window.localStorage.getItem(key)).find((value) => value !== null);
      if (!raw) {
        setSaveMessage("Kein lokaler Spielstand gefunden.");
        return;
      }
      const save = decodeSave<RoundFlowState>(raw, "ROUND_FLOW");
      setRoundFlow(save.state);
      setTab("HOME");
      setSaveMessage("Spielstand geladen.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Spielstand konnte nicht geladen werden.");
    }
  }

  function resetRounds() {
    setRoundFlow(initialFlow ? structuredClone(initialFlow) : createCareerFlow(initialState, events, afterRound));
    setTab("HOME");
    setSaveMessage("Karriere auf Ausgangsstand zurückgesetzt.");
  }

  const primary: Array<{ id: HqTab; title: string; mark: string }> = [
    { id: "HOME", title: "Zentrale", mark: "⌂" },
    { id: "RACING", title: "Rennen", mark: "◫" },
    { id: "INBOX", title: "Post", mark: openIssues.length ? String(openIssues.length) : "✉" },
    { id: "DEVELOPMENT", title: "Technik", mark: "⚙" },
    { id: "MARKET", title: "Personal", mark: "♟" },
    { id: "CONTRACTS", title: "Verträge", mark: "§" },
    { id: "FINANCE", title: "Finanzen", mark: "€" },
    ...(roundFlow.career?.world ? [{ id: "WORLD" as HqTab, title: "Welt", mark: "◎" }] : []),
  ];

  const secondary: Array<{ id: HqTab; title: string }> = [
    { id: "CAREER", title: "Vorstand & Karriere" },
    { id: "PEOPLE", title: "Teammitglieder" },
    { id: "CENTERS", title: "Machtzentren" },
    { id: "POWER", title: "Konflikte & Einfluss" },
    { id: "TECHNICAL", title: "Technischer Druck" },
    { id: "ISSUES", title: "Themenarchiv" },
  ];

  const workspaceDisabled =
    roundFlow.career?.status === "DISMISSED" || (raceActive && tab !== "RACING");

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2">
            <span className="text-slate-500">Saison </span>
            <b>{2025 + (roundFlow.career?.season ?? 1)}</b>
          </span>
          <span className="rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2">
            <span className="text-slate-500">Runde </span>
            <b>{roundFlow.currentRound === 0 ? "Vorsaison" : roundFlow.currentRound}</b>
          </span>
          <button onClick={() => setTab("FINANCE")} className="rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2">
            <span className="text-slate-500">Budget </span>
            <b className="text-emerald-300">€{getCashBalance(roundFlow.political).toFixed(2)}m</b>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {onChooseCareer ? <button className="mm-button" onClick={onChooseCareer}>Team wechseln</button> : null}
          <button className="mm-button" onClick={saveGame}>Speichern</button>
          <button className="mm-button" onClick={loadGame}>Laden</button>
          <details className="relative">
            <summary className="mm-button list-none">Mehr</summary>
            <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-slate-700 bg-[#101827] p-2 shadow-2xl">
              {secondary.map((item) => (
                <button key={item.id} onClick={() => setTab(item.id)} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-white/5">
                  {item.title}
                </button>
              ))}
              <div className="my-2 border-t border-slate-700" />
              <button onClick={resetRounds} className="block w-full rounded-md px-3 py-2 text-left text-sm text-amber-300 hover:bg-white/5">
                Karriere zurücksetzen
              </button>
            </div>
          </details>
          {raceActive ? (
            <button className="mm-button mm-button-primary" onClick={() => setTab("RACING")}>Rennwochenende fortsetzen</button>
          ) : !roundFlow.complete && nextRound !== null && tab !== "HOME" ? (
            <button className="mm-button mm-button-primary" disabled={openIssues.length > 0} onClick={startNextRound}>
              Runde {nextRound} starten
            </button>
          ) : null}
        </div>
      </div>

      {saveMessage ? (
        <div className="mb-4 rounded-md border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs text-slate-400">{saveMessage}</div>
      ) : null}

      <fieldset disabled={workspaceDisabled} className="min-w-0">
        {tab === "HOME" ? (
          <HqDashboard flow={roundFlow} onNavigate={(next) => setTab(next)} onStartNextRound={startNextRound} />
        ) : (
          <div className="mm-panel overflow-hidden">
            <div className="mm-panel-header flex items-center justify-between">
              <span>{[...primary, ...secondary].find((item) => item.id === tab)?.title ?? "Teamzentrale"}</span>
              {raceActive && tab !== "RACING" ? <span className="text-amber-300">Während des Rennens gesperrt</span> : null}
            </div>
            <div className="p-4 md:p-5">
              {tab === "WORLD" && roundFlow.career?.world ? <MotorsportWorldPanel world={roundFlow.career.world} /> : null}

              {["MARKET", "RACING", "DEVELOPMENT", "CAREER"].includes(tab) ? (
                <CareerPanel
                  flow={roundFlow}
                  view={tab as "MARKET" | "RACING" | "DEVELOPMENT" | "CAREER"}
                  onAction={applyAction}
                />
              ) : null}

              {tab === "FINANCE" ? (
                <FinancePanel
                  state={roundFlow.political}
                  round={roundFlow.currentRound}
                  onAction={(action) => applyAction((current) => takeRoundFinanceAction(current, action))}
                />
              ) : null}

              {tab === "INBOX" || tab === "ISSUES" ? (
                <InboxIssuesPanel
                  flow={roundFlow}
                  issueDefinitions={issueDefinitions}
                  view={tab}
                  onIssueAction={(issueId, actionId) => {
                    setRoundFlow((current) => resolveRoundIssue(current, issueId, actionId, issueDefinitions));
                    setSaveMessage(null);
                  }}
                  onOpenCareer={() => setTab("CAREER")}
                />
              ) : null}

              {tab === "PEOPLE" || tab === "CENTERS" ? <PeoplePowerCentersPanel flow={roundFlow} view={tab} /> : null}

              {tab === "POWER" ? (
                <PoliticalConflictsPanel
                  flow={roundFlow}
                  onConflictDecision={(conflictId, decisionId) => {
                    setRoundFlow((current) => resolveRoundConflict(current, conflictId, decisionId));
                    setSaveMessage(null);
                  }}
                  onOpenCareer={() => setTab("CAREER")}
                />
              ) : null}

              {tab === "TECHNICAL" ? (
                <div className="space-y-3">
                  {roundFlow.issues.filter((issue) => issue.category === "TECHNICAL").map((issue) => (
                    <article key={issue.id} className="rounded-md border border-slate-700 bg-slate-950/30 p-4">
                      <p className="font-bold">{issue.title}</p>
                      <p className="mt-1 text-xs text-slate-500">Status: {issue.status} · Eskalation: {issue.escalation}</p>
                    </article>
                  ))}
                  {!roundFlow.issues.some((issue) => issue.category === "TECHNICAL") ? (
                    <p className="text-sm text-slate-500">Aktuell gibt es keinen technischen Konflikt.</p>
                  ) : null}
                </div>
              ) : null}

              {tab === "CONTRACTS" ? (
                <ContractsPanel
                  flow={roundFlow}
                  startNegotiation={(contractId) => applyAction((current) => startRoundContractNegotiation(current, contractId))}
                  exerciseTeamOption={(contractId, optionId) => applyAction((current) => exerciseRoundContractOption(current, contractId, optionId))}
                  submitContractOffer={(negotiationId, posture) =>
                    applyAction((current) => submitRoundContractOffer(current, negotiationId, posture, issueDefinitions))
                  }
                  acceptCounterOffer={(negotiationId) =>
                    applyAction((current) => acceptRoundContractCounter(current, negotiationId, issueDefinitions))
                  }
                  walkAwayFromNegotiation={(negotiationId) => {
                    setRoundFlow((current) => rejectRoundContractNegotiation(current, negotiationId, issueDefinitions));
                    setSaveMessage(null);
                  }}
                />
              ) : null}
            </div>
          </div>
        )}
      </fieldset>

      <nav className="mm-topbar fixed inset-x-0 bottom-0 z-30 overflow-x-auto">
        <div className="mx-auto flex max-w-[1000px] min-w-max justify-center px-2">
          {primary.map((item) => (
            <button key={item.id} data-active={tab === item.id} className="mm-nav-button" onClick={() => setTab(item.id)}>
              <span className="mx-auto block text-base leading-none">{item.mark}</span>
              <span className="mt-1 block">{item.title}</span>
            </button>
          ))}
        </div>
      </nav>
    </section>
  );
}
