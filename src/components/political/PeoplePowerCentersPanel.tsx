"use client";

import type { RoundFlowState } from "@/game/season/round-flow";

type Props = {
  flow: RoundFlowState;
  view: "PEOPLE" | "CENTERS";
};

function label(value: string) {
  const labels: Record<string, string> = {
    TEAM_PRINCIPAL: "Teamchef",
    SPORTING_DIRECTOR: "Sportdirektor",
    TECHNICAL_DIRECTOR: "Technischer Direktor",
    RACE_ENGINEER: "Renningenieur",
    OWNER_REPRESENTATIVE: "Eigentümervertreter",
    SPONSOR_REPRESENTATIVE: "Sponsorvertreter",
    CEO: "Geschäftsführung",
    INTERNAL_INFLUENCE: "Interner Einfluss",
    OWNER_ACCESS: "Zugang zum Eigentümer",
    COMMERCIAL_BACKING: "Kommerzielle Unterstützung",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

export function PeoplePowerCentersPanel({ flow, view }: Props) {
  if (view === "PEOPLE") {
    return (
          <div className="grid gap-4 md:grid-cols-2">
            {flow.political.characters.map((character) => (
              <article
                key={character.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  {label(character.role)}
                  {character.active === false ? " · TEAM VERLASSEN" : ""}
                </p>
                <h3 className="mt-2 text-xl font-semibold">{character.name}</h3>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-zinc-500">Dynamik</dt>
                    <dd className="mt-1">{character.dynamic.momentum}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Politische Ermüdung</dt>
                    <dd className="mt-1">
                      {character.dynamic.politicalFatigue}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Instabilität</dt>
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

    );
  }

  return (
          <div className="grid gap-4 md:grid-cols-2">
            {flow.political.characters
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
                const activeLeverage = flow.political.leverages.filter(
                  (leverage) =>
                    leverage.ownerCharacterId === character.id &&
                    leverage.active,
                );
                const liveIssues = flow.issues.filter(
                  (issue) =>
                    issue.initiatorCharacterId === character.id &&
                    issue.status !== "RESOLVED",
                );

                return (
                  <article
                    key={character.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.14em] text-violet-400">
                      {label(character.role)}
                      {character.active === false ? " · TEAM VERLASSEN" : ""}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">
                      {character.name}
                    </h3>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-zinc-500">Interner Einfluss</p>
                        <p className="mt-1">
                          {character.power.internalEinfluss}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Zugang zum Eigentümer</p>
                        <p className="mt-1">{character.power.ownerAccess}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Kommerzielle Unterstützung</p>
                        <p className="mt-1">
                          {character.power.commercialBacking}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Aktive Themen</p>
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
  );
}
