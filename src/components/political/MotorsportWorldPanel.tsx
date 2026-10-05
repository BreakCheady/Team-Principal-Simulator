"use client";
import { useState } from "react";
import type { MotorsportWorld } from "@/game/world/schemas";
import { WecStandings } from "./WecStandings";
import { SERIES, getSeries } from "@/game/world/series";
const rollenName = (rolle: string) => ({
  DRIVER: "Fahrer",
  TEAM_PRINCIPAL: "Teamchef",
  TECHNICAL_DIRECTOR: "Technischer Direktor",
  SPORTING_DIRECTOR: "Sportdirektor",
  RACE_ENGINEER: "Renningenieur",
  ENGINEER: "Ingenieur",
}[rolle] ?? rolle.replaceAll("_", " "));

const aktivitaetsName = (typ: string) => ({
  CONTRACT_EXPIRED: "Vertrag ausgelaufen",
  SIGNING: "Verpflichtung",
  PROMOTION: "Aufstieg",
  STAFF_MOVE: "Personalwechsel",
  TEAM_TREND: "Teamentwicklung",
  RUMOR: "Gerücht",
}[typ] ?? typ.replaceAll("_", " "));

export function MotorsportWorldPanel({ world }: { world: MotorsportWorld }) {
  const [series, setSeries] = useState(world.playerSeriesId),
    [query, setQuery] = useState(""),
    [role, setRole] = useState("ALL"),
    [page, setPage] = useState(0),
    [selectedPersonId, setSelectedPersonId] = useState<string | null>(null),
    [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const cfg = getSeries(series),
    table = world.series.find((s) => s.seriesId === series)!,
    activity = [...(world.activity ?? [])]
      .filter((item) => item.seriesId === series)
      .reverse()
      .slice(0, 12);
  const people = world.people
    .filter(
      (p) =>
        p.seriesId === series &&
        (role === "ALL" || p.role === role) &&
        `${p.name} ${p.nationality}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.skill - a.skill || a.name.localeCompare(b.name));
  const pages = Math.max(1, Math.ceil(people.length / 30)),
    index = Math.min(page, pages - 1),
    selectedPerson = world.people.find((item) => item.id === selectedPersonId),
    selectedTeam = world.teams.find((item) => item.id === selectedTeamId),
    transferRadar = world.people
      .filter(
        (item) =>
          item.role === "DRIVER" &&
          item.teamId !== world.playerTeamId &&
          item.specialties.includes(series),
      )
      .sort(
        (a, b) =>
          Number(a.contractEndSaison > world.season) -
            Number(b.contractEndSaison > world.season) ||
          b.potential - a.potential ||
          b.skill - a.skill ||
          a.name.localeCompare(b.name),
      )
      .slice(0, 6),
    contractWatch = world.people
      .filter(
        (item) =>
          item.teamId &&
          item.role === "DRIVER" &&
          world.teams.find((team) => team.id === item.teamId)?.seriesId ===
            series &&
          item.contractEndSaison <= world.season,
      )
      .sort((a, b) => b.skill - a.skill)
      .slice(0, 5);
  const person = (id: string) =>
    world.people.find((p) => p.id === id)?.name ?? id;
  const team = (id: string | null) =>
    world.teams.find((t) => t.id === id)?.name ?? "Ohne Vertrag";
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-semibold">Motorsport-Welt</h3>
      {(selectedPerson || selectedTeam) ? (
        <article className="rounded-lg border border-sky-900 bg-sky-950/20 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-sky-400">Profil</p>
              {selectedPerson ? (
                <>
                  <h3 className="mt-1 text-xl font-semibold">{selectedPerson.name}</h3>
                  <p className="mt-2 text-sm text-zinc-300">
                    {rollenName(selectedPerson.role)} · {selectedPerson.age} · {selectedPerson.nationality}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Stärke {selectedPerson.skill} · Potenzial {selectedPerson.potential} · Ambition {selectedPerson.ambition} · Vertrag bis S{selectedPerson.contractEndSeason}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Team: {team(selectedPerson.teamId)} · Gehalt €{selectedPerson.salary.toFixed(3)}m / Saison
                  </p>
                </>
              ) : null}
              {selectedTeam ? (
                <>
                  <h3 className="mt-1 text-xl font-semibold">{selectedTeam.name}</h3>
                  <p className="mt-2 text-sm text-zinc-300">
                    {selectedTeam.seriesId}{selectedTeam.classId ? ` · ${selectedTeam.classId}` : ""} · Reputation {selectedTeam.reputation}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Tempo {selectedTeam.pace} · Zuverlässigkeit {selectedTeam.reliability} · Budget €{selectedTeam.budget.toFixed(2)}m
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Fahrer: {selectedTeam.drivers.map(person).join(", ")}
                  </p>
                </>
              ) : null}
            </div>
            <button
              className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300"
              onClick={() => {
                setSelectedPersonId(null);
                setSelectedTeamId(null);
              }}
            >
              Schließen
            </button>
          </div>
        </article>
      ) : null}


      <p className="text-sm text-zinc-400">
        {world.teams.length} fictional teams ·{" "}
        {world.people.filter((p) => p.role === "DRIVER").length} drivers ·{" "}
        {world.people.filter((p) => p.role !== "DRIVER").length} Mitarbeiter · Neun Meisterschaften entwickeln sich parallel zu deiner Karriere.
      </p>
      <div className="flex flex-wrap gap-2">
        {SERIES.map((s) => (
          <button
            key={s.id}
            aria-pressed={series === s.id}
            onClick={() => {
              setSeries(s.id);
              setPage(0);
            }}
            className={`rounded-lg border px-3 py-2 text-sm ${series === s.id ? "border-sky-500 bg-sky-950 text-sky-300" : "border-zinc-700"}`}
          >
            {s.id}
          </button>
        ))}
      </div>
      <article className="rounded-md border border-zinc-800 bg-zinc-950/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold">Paddock-Nachrichten</h4>
            <p className="mt-1 text-xs text-zinc-500">
              Transfers, auslaufende Verträge, Talentaufstiege und die Entwicklung der Teams.
            </p>
          </div>
          <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400">
            Saison {world.season}
          </span>
        </div>
        {activity.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            Noch keine Meldungen für {series} yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {activity.map((item, activityIndex) => (
              <div
                key={item.id}
                className="rounded-md border border-zinc-800 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {activityIndex < 3 && item.type !== "TEAM_TREND" ? (
                    <span className="rounded-full border border-rose-900 bg-rose-950/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-300">
                      Eilmeldung
                    </span>
                  ) : null}
                  <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] uppercase tracking-wide text-sky-300">
                    {aktivitaetsName(item.type)}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Saison {item.season}
                  </span>
                </div>
                <p className="mt-2 font-medium">{item.headline}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  {item.detail}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.personId ? (
                    <button
                      className="text-xs text-sky-300 hover:text-sky-200"
                      onClick={() => {
                        setSelectedPersonId(item.personId);
                        setSelectedTeamId(null);
                      }}
                    >
                      Person ansehen
                    </button>
                  ) : null}
                  {item.toTeamId ? (
                    <button
                      className="text-xs text-sky-300 hover:text-sky-200"
                      onClick={() => {
                        setSelectedTeamId(item.toTeamId);
                        setSelectedPersonId(null);
                      }}
                    >
                      Team ansehen
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-zinc-800 p-5">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold">Transfer-Radar</h4>
            <span className="text-xs text-zinc-500">Top-Kandidaten</span>
          </div>
          <div className="mt-3 space-y-3">
            {transferRadar.map((target) => (
              <button
                key={target.id}
                className="block w-full rounded-lg border border-zinc-800 p-3 text-left hover:border-sky-900"
                onClick={() => {
                  setSelectedPersonId(target.id);
                  setSelectedTeamId(null);
                }}
              >
                <span className="font-medium">{target.name}</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  {target.seriesId} · Stärke {target.skill} · Potenzial {target.potential} · Vertrag S{target.contractEndSeason}
                </span>
              </button>
            ))}
          </div>
        </article>
        <article className="rounded-md border border-zinc-800 p-5">
          <h4 className="font-semibold">Vertragsbeobachtung</h4>
          <p className="mt-1 text-xs text-zinc-500">
            Fahrer in {series}, deren Verträge in oder nach ihrer letzten Saison sind.
          </p>
          <div className="mt-3 space-y-2">
            {contractWatch.length ? contractWatch.map((target) => (
              <button
                key={target.id}
                className="block w-full rounded-lg border border-amber-950 bg-amber-950/10 p-3 text-left"
                onClick={() => {
                  setSelectedPersonId(target.id);
                  setSelectedTeamId(null);
                }}
              >
                <span className="text-sm font-medium">{target.name}</span>
                <span className="block text-xs text-amber-300">
                  Vertragswarnung · endet S{target.contractEndSeason}
                </span>
              </button>
            )) : (
              <p className="text-sm text-zinc-500">Keine unmittelbar auslaufenden Verträge.</p>
            )}
          </div>
        </article>
      </div>

      <article className="rounded-md border border-zinc-800 p-5">
        <h4 className="font-semibold">
          {cfg.name} · {table.completedRounds}/{cfg.rounds} Rennen
        </h4>
        <p className="mt-2 text-sm text-zinc-400">{cfg.description}</p>
        <p className="mt-2 text-xs text-zinc-500">
          {series === "WEC" ? "WEC-Kalender und Klassenstruktur; Budgets, Teams und Fahrer sind fiktiv." : "Fiktive Spielkalender, Budgets und Kader. Die Felder in Formel 4, GT und Rallye sind spieldefiniert."}
        </p>
      </article>
      {series === "WEC" ? <WecStandings world={world} /> : <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-zinc-800 p-5">
          <h4>Teamwertung</h4>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Team</th>
                <th>Punkte</th>
              </tr>
            </thead>
            <tbody>
              {[...table.teams]
                .sort(
                  (a, b) =>
                    b.points - a.points ||
                    team(a.teamId).localeCompare(team(b.teamId)),
                )
                .map((t, i) => (
                  <tr key={t.teamId} className="border-t border-zinc-800">
                    <td className="py-2">{i + 1}</td>
                    <td>
                      <button
                        className="text-left hover:text-sky-300"
                        onClick={() => {
                          setSelectedTeamId(t.teamId);
                          setSelectedPersonId(null);
                        }}
                      >
                        {team(t.teamId)}
                      </button>
                    </td>
                    <td>{t.points}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </article>
        <article className="rounded-md border border-zinc-800 p-5">
          <h4>Fahrerwertung</h4>
          <div className="max-h-80 overflow-auto">
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Fahrer</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {[...table.drivers]
                  .sort(
                    (a, b) =>
                      b.points - a.points ||
                      b.wins - a.wins ||
                      person(a.personId).localeCompare(person(b.personId)),
                  )
                  .map((p, i) => (
                    <tr key={p.personId} className="border-t border-zinc-800">
                      <td className="py-2">{i + 1}</td>
                      <td>
                        <button
                          className="text-left hover:text-sky-300"
                          onClick={() => {
                            setSelectedPersonId(p.personId);
                            setSelectedTeamId(null);
                          }}
                        >
                          {person(p.personId)}
                        </button>
                      </td>
                      <td>{p.points}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>}
      <h4 className="text-lg font-semibold">Teams & Personal</h4>
      <div className="grid gap-3 lg:grid-cols-2">
        {world.teams
          .filter((t) => t.seriesId === series)
          .map((t) => (
            <article
              key={t.id}
              className="rounded-md border border-zinc-800 p-4"
            >
              <button
                className="text-left font-semibold hover:text-sky-300"
                onClick={() => {
                  setSelectedTeamId(t.id);
                  setSelectedPersonId(null);
                }}
              >
                {t.name}{t.classId ? ` · ${t.classId === "HYPERCAR" ? "Hypercar" : "LMGT3"}` : ""}
                {t.id === world.playerTeamId ? " · Dein Team" : ""}
              </button>
              <p className="mt-2 text-xs text-zinc-400">
                Principal: {person(t.principalId)} · Pace {t.pace} · Reliability{" "}
                {t.reliability} · Annual budget €{t.budget.toFixed(2)}m
              </p>
              <p className="mt-2 text-sm">
                Fahrer: {t.drivers.map(person).join(", ") || "Vacant"}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Staff: {t.staff.map(person).join(", ")}
              </p>
            </article>
          ))}
      </div>
      <h4 className="text-lg font-semibold">
        People database · {people.length}
      </h4>
      <div className="flex flex-wrap gap-3">
        <input
          aria-label="Personal durchsuchen"
          className="rounded-lg bg-zinc-900 p-3"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Name oder Nationalität"
        />
        <select
          aria-label="Personalrolle"
          className="bg-zinc-900 p-3"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(0);
          }}
        >
          <option value="ALL">Alle Rollen</option>
          {[
            "DRIVER",
            "TECHNICAL_DIRECTOR",
            "SPORTING_DIRECTOR",
            "RACE_ENGINEER",
            "TEAM_PRINCIPAL",
          ].map((r) => (
            <option key={r} value={r}>
              {r.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Rolle</th>
              <th>Alter</th>
              <th>Nation</th>
              <th>Stärke / Potenzial</th>
              <th>Team</th>
              <th>Salary / Saison</th>
            </tr>
          </thead>
          <tbody>
            {people.slice(index * 30, (index + 1) * 30).map((p) => (
              <tr key={p.id} className="border-t border-zinc-800">
                <td className="py-3 pr-3"><button className="text-left hover:text-sky-300" onClick={() => { setSelectedPersonId(p.id); setSelectedTeamId(null); }}>{p.name}</button>{p.rating ? <span className="block text-xs text-zinc-500">{p.rating}</span> : null}</td>
                <td className="pr-3 text-xs">{p.role.replaceAll("_", " ")}</td>
                <td>{p.age}</td>
                <td>{p.nationality}</td>
                <td>
                  {p.skill} / {p.potential}
                </td>
                <td className="pr-3">{team(p.teamId)}</td>
                <td>€{p.salary.toFixed(3)}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3">
        <button
          disabled={index === 0}
          onClick={() => setPage(index - 1)}
          className="rounded border border-zinc-700 px-3 py-2 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="py-2">
          {index + 1}/{pages}
        </span>
        <button
          disabled={index === pages - 1}
          onClick={() => setPage(index + 1)}
          className="rounded border border-zinc-700 px-3 py-2 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
