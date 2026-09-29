"use client";

import { useMemo, useState } from "react";
import type { IssueDefinition } from "@/game/issues/issues";
import { calculateConflict } from "@/game/political/conflicts";
import type { PoliticalCoreState } from "@/game/political/types";
import { decodeSave, encodeSave } from "@/game/save/save-game";
import {
  advanceRoundFlow,
  createRoundFlowState,
  getNextRound,
  getOpenIssues,
  resolveRoundIssue,
  type RoundFlowState,
} from "@/game/season/round-flow";
import type { RoundEventDefinition } from "@/game/season/round-events";

type Props = {
  initialState: PoliticalCoreState;
  events: RoundEventDefinition[];
  issueDefinitions: IssueDefinition[];
  afterRound: number;
};

type HqTab = "INBOX" | "PEOPLE" | "POWER" | "TECHNICAL" | "CONTRACTS" | "ISSUES";

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
}: Props) {
  const [roundFlow, setRoundFlow] = useState(() =>
    createRoundFlowState(initialState, events, afterRound),
  );
  const [tab, setTab] = useState<HqTab>("INBOX");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
    setRoundFlow((current) =>
      advanceRoundFlow(current, events, issueDefinitions),
    );
    setTab("INBOX");
    setSaveMessage(null);
  }

  function takeIssueAction(issueId: string, actionId: string) {
    setRoundFlow((current) =>
      resolveRoundIssue(current, issueId, actionId, issueDefinitions),
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
    setRoundFlow(createRoundFlowState(initialState, events, afterRound));
    setTab("INBOX");
    setSaveMessage("Round flow reset.");
  }

  const tabs: Array<{ id: HqTab; title: string }> = [
    { id: "INBOX", title: "Inbox" + (openIssues.length ? " (" + openIssues.length + ")" : "") },
    { id: "PEOPLE", title: "People" },
    { id: "POWER", title: "Power" },
    { id: "TECHNICAL", title: "Technical" },
    { id: "CONTRACTS", title: "Contracts" },
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
              Round {roundFlow.currentRound}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Events create issues. You choose what deserves attention, NPCs
              react, and unresolved pressure can become a full political
              conflict.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
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
            {!roundFlow.complete && nextRound !== null ? (
              <button
                type="button"
                onClick={startNextRound}
                disabled={openIssues.length > 0}
                className="rounded-xl bg-sky-300 px-5 py-3 font-medium text-sky-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                Start round {nextRound}
              </button>
            ) : (
              <span className="rounded-full border border-emerald-800 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-300">
                Event sequence complete
              </span>
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

      <div className="mt-5">
        {tab === "INBOX" ? (
          <div className="space-y-5">
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
                </p>
                <h3 className="mt-2 text-xl font-semibold">{character.name}</h3>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-zinc-500">Momentum</dt>
                    <dd className="mt-1">{character.dynamic.momentum}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Fatigue</dt>
                    <dd className="mt-1">{character.dynamic.politicalFatigue}</dd>
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
            {roundFlow.political.characters
              .filter((character) =>
                ["STAR_DRIVER", "SECOND_DRIVER", "DRIVER"].includes(
                  character.role,
                ),
              )
              .map((driver) => (
                <article
                  key={driver.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm"
                >
                  <div className="flex justify-between gap-4">
                    <span>{driver.name}</span>
                    <span className="text-zinc-500">
                      Security {driver.career.contractSecurity} · transfer interest{" "}
                      {driver.career.transferInterest}
                    </span>
                  </div>
                </article>
              ))}
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
      </div>

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
