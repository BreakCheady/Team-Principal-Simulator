"use client";
import { useState } from "react";
import type { MotorsportWorld } from "@/game/world/schemas";
import { WecStandings } from "./WecStandings";
import { SERIES, getSeries } from "@/game/world/series";
export function MotorsportWorldPanel({ world }: { world: MotorsportWorld }) {
  const [series, setSeries] = useState(world.playerSeriesId),
    [query, setQuery] = useState(""),
    [role, setRole] = useState("ALL"),
    [page, setPage] = useState(0);
  const cfg = getSeries(series),
    table = world.series.find((s) => s.seriesId === series)!;
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
    index = Math.min(page, pages - 1);
  const person = (id: string) =>
    world.people.find((p) => p.id === id)?.name ?? id;
  const team = (id: string | null) =>
    world.teams.find((t) => t.id === id)?.name ?? "Free agent";
  return (
    <div className="space-y-5">
      <h3 className="text-xl font-semibold">Motorsport World</h3>
      <p className="text-sm text-zinc-400">
        {world.teams.length} fictional teams ·{" "}
        {world.people.filter((p) => p.role === "DRIVER").length} drivers ·{" "}
        {world.people.filter((p) => p.role !== "DRIVER").length} staff · Nine
        championships progress alongside your career.
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
      <article className="rounded-xl border border-zinc-800 p-5">
        <h4 className="font-semibold">
          {cfg.name} · {table.completedRounds}/{cfg.rounds} races
        </h4>
        <p className="mt-2 text-sm text-zinc-400">{cfg.description}</p>
        <p className="mt-2 text-xs text-zinc-500">
          {series === "WEC" ? "WEC 2026 calendar and class structure; fictional budgets, teams and drivers." : "Fictional game calendars, budgets and rosters. Formula 4, GT and rally fields are game-defined."}
        </p>
      </article>
      {series === "WEC" ? <WecStandings world={world} /> : <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-zinc-800 p-5">
          <h4>Team championship</h4>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Team</th>
                <th>Points</th>
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
                    <td>{team(t.teamId)}</td>
                    <td>{t.points}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </article>
        <article className="rounded-xl border border-zinc-800 p-5">
          <h4>Driver championship</h4>
          <div className="max-h-80 overflow-auto">
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Driver</th>
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
                      <td>{person(p.personId)}</td>
                      <td>{p.points}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>}
      <h4 className="text-lg font-semibold">Teams & personnel</h4>
      <div className="grid gap-3 lg:grid-cols-2">
        {world.teams
          .filter((t) => t.seriesId === series)
          .map((t) => (
            <article
              key={t.id}
              className="rounded-xl border border-zinc-800 p-4"
            >
              <p className="font-semibold">
                {t.name}{t.classId ? ` · ${t.classId === "HYPERCAR" ? "Hypercar" : "LMGT3"}` : ""}
                {t.id === world.playerTeamId ? " · Your team" : ""}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                Principal: {person(t.principalId)} · Pace {t.pace} · Reliability{" "}
                {t.reliability} · Annual budget €{t.budget.toFixed(2)}m
              </p>
              <p className="mt-2 text-sm">
                Drivers: {t.drivers.map(person).join(", ") || "Vacant"}
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
          aria-label="Search world people"
          className="rounded-lg bg-zinc-900 p-3"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Name or nationality"
        />
        <select
          aria-label="World personnel role"
          className="bg-zinc-900 p-3"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(0);
          }}
        >
          <option value="ALL">All roles</option>
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
              <th>Role</th>
              <th>Age</th>
              <th>Nation</th>
              <th>Skill / potential</th>
              <th>Employer</th>
              <th>Salary / season</th>
            </tr>
          </thead>
          <tbody>
            {people.slice(index * 30, (index + 1) * 30).map((p) => (
              <tr key={p.id} className="border-t border-zinc-800">
                <td className="py-3 pr-3">{p.name}{p.rating ? <span className="block text-xs text-zinc-500">{p.rating}</span> : null}</td>
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
