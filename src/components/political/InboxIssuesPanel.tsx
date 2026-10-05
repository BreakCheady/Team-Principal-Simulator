"use client";

import type { IssueDefinition } from "@/game/issues/issues";
import type { RoundFlowState } from "@/game/season/round-flow";

type Props = {
  flow: RoundFlowState;
  issueDefinitions: IssueDefinition[];
  view: "INBOX" | "ISSUES";
  onIssueAction: (issueId: string, actionId: string) => void;
  onOpenCareer: () => void;
};

function label(value: string) {
  return value.replaceAll("_", " ");
}

export function InboxIssuesPanel({
  flow,
  issueDefinitions,
  view,
  onIssueAction,
  onOpenCareer,
}: Props) {
  const latest = flow.history.at(-1) ?? null;
  const inboxIssues = [...flow.issues].sort((a, b) => {
    const priority = { OPEN: 0, WATCHING: 1, ESCALATED: 2, RESOLVED: 3 };
    return priority[a.status] - priority[b.status] || b.round - a.round;
  });

  if (view === "ISSUES") {
    return (
          <div className="space-y-3">
            {flow.issues.length === 0 ? (
              <p className="text-sm text-zinc-500">Noch keine Themen erfasst.</p>
            ) : (
              flow.issues.map((issue) => (
                <article
                  key={issue.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{issue.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Runde {issue.round} · {issue.category}
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
    );
  }

  return (
          <div className="space-y-5">
            {flow.career?.requests.some((r) =>
              ["OPEN", "ESCALATED"].includes(r.status),
            ) ? (
              <button
                type="button"
                className="rounded-xl border border-amber-800 p-4 text-left text-sm text-amber-300"
                onClick={() => onOpenCareer()}
              >
                Actor initiatives require attention · Open Career
              </button>
            ) : null}
            {latest ? (
              <article className="rounded-md border border-slate-700 bg-slate-950/30 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Runde {latest.round}-Bericht
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
                            flow.political.characters.find(
                              (item) => item.id === trigger.characterId,
                            )?.name
                          }
                          {" · "}
                          {label(trigger.consequence)}
                          {trigger.consequence === "SALARY_BONUS"
                            ? ` · €${trigger.amountMillions}m verdient`
                            : ""}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </article>
            ) : (
              <article className="rounded-2xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
                Starte die nächste Runde, um die ersten Nachrichten zu erhalten.
              </article>
            )}

            {inboxIssues.length === 0 ? (
              <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-500">
                Posteingang leer. Aktuell erfordert kein Managementthema deine Aufmerksamkeit.
              </article>
            ) : (
              inboxIssues.map((issue) => {
                const definition = issueDefinitions.find(
                  (item) => item.id === issue.definitionId,
                );
                const initiator = flow.political.characters.find(
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
                            onClick={() => onIssueAction(issue.id, action.id)}
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
  );
}
