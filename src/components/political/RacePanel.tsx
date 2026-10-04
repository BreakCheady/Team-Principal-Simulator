"use client";
import { useEffect, useState } from "react";
import type { RoundFlowState } from "@/game/season/round-flow";
import type {
  RaceCar,
  RaceWeekend,
  RaceSummary,
  Compound,
} from "@/game/racing/schema";
import { getSeries } from "@/game/world/series";
import { playerTeam } from "@/game/world/world";
import { getRaceRules, crewSizeForSeries } from "@/game/racing/rules";
import { raceRules, liveOrder, gapToLeader } from "@/game/racing/engine";
import {
  runPractice,
  runQualifying,
  updateRaceSetup,
  updateRacePlan,
  advanceRace,
  commandDriver,
  callPit,
  retireRaceCar,
  issueTeamOrder,
  recruitRaceCrew,
} from "@/game/racing/actions";
import { terminateEmployment } from "@/game/career/market";
import { setRaceStrategy } from "@/game/career/career";
import { teamTable } from "@/game/career/sport";
type Props = {
  flow: RoundFlowState;
  onAction: (action: (state: RoundFlowState) => RoundFlowState) => void;
};
const card = "rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5",
  button =
    "rounded-lg border border-sky-800 px-3 py-2 text-sm text-sky-300 disabled:opacity-40 disabled:cursor-not-allowed";
const time = (s: number) =>
  `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
function CarControls({
  car,
  w,
  onAction,
}: {
  car: RaceCar;
  w: RaceWeekend;
  onAction: Props["onAction"];
}) {
  const rules = raceRules(w),
    racing = w.phase === "RACING",
    closed = w.phase === "COMPLETE";
  return (
    <article className={card}>
      <h4 className="font-semibold">
        {car.name} · {car.retired ? "Retired" : `P${car.position}`}
      </h4>
      <p className="mt-2 text-sm text-zinc-400">
        {car.crew[car.activeDriver].name} · {car.compound} · wear{" "}
        {car.wear.toFixed(0)}% · fuel {car.fuel.toFixed(1)} lap equivalents ·
        damage {car.damage.toFixed(0)}%
      </p>
      {!racing && !closed ? (
        <div className="mt-4 grid gap-3">
          {(["downforce", "suspension", "cooling"] as const).map((axis) => (
            <label className="flex items-center gap-3 text-sm" key={axis}>
              {axis} {car.setup[axis]}
              <input
                aria-label={`${car.name} ${axis}`}
                type="range"
                min="0"
                max="100"
                value={car.setup[axis]}
                disabled={!["PRACTICE", "QUALIFYING"].includes(w.phase)}
                onChange={(e) =>
                  onAction((s) =>
                    updateRaceSetup(s, car.id, {
                      ...car.setup,
                      [axis]: Number(e.target.value),
                    }),
                  )
                }
              />
            </label>
          ))}
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <label>
          Starting tyres{" "}
          <select
            aria-label={`${car.name} starting tyres`}
            className="ml-2 bg-zinc-950 p-2"
            value={car.plan.startCompound}
            disabled={racing || closed}
            onChange={(e) =>
              onAction((s) =>
                updateRacePlan(s, car.id, {
                  ...car.plan,
                  startCompound: e.target.value as Compound,
                }),
              )
            }
          >
            {rules.compounds.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Next tyres{" "}
          <select
            aria-label={`${car.name} next tyres`}
            className="ml-2 bg-zinc-950 p-2"
            value={car.plan.nextCompound}
            disabled={closed}
            onChange={(e) =>
              onAction((s) =>
                updateRacePlan(s, car.id, {
                  ...car.plan,
                  nextCompound: e.target.value as Compound,
                }),
              )
            }
          >
            {rules.compounds.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Planned pit lap{" "}
          <input
            aria-label={`${car.name} pit lap`}
            className="ml-2 w-20 bg-zinc-950 p-2"
            type="number"
            min="1"
            max={w.totalLaps}
            value={car.plan.pitLap}
            disabled={closed}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 1 && n <= w.totalLaps)
                onAction((s) =>
                  updateRacePlan(s, car.id, { ...car.plan, pitLap: n }),
                );
            }}
          />
        </label>
        <label>
          {racing && rules.refuel ? "Next fuel fill" : "Fuel load"}{" "}
          {Math.round(car.plan.fuelTarget * 100)}%{" "}
          <input
            aria-label={`${car.name} fuel load`}
            type="range"
            min="50"
            max="100"
            value={car.plan.fuelTarget * 100}
            disabled={closed || (racing && !rules.refuel)}
            onChange={(e) =>
              onAction((s) =>
                updateRacePlan(s, car.id, {
                  ...car.plan,
                  fuelTarget: Number(e.target.value) / 100,
                }),
              )
            }
          />
        </label>
        {(
          [
            ["automatic", "Automatic strategy / weather response"],
            ["repair", "Repair damage"],
            ["changeDriver", "Change driver at eligible stops"],
          ] as const
        ).map(([key, title]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={car.plan[key]}
              disabled={
                closed || (key === "changeDriver" && !rules.changeDriver)
              }
              onChange={(e) =>
                onAction((s) =>
                  updateRacePlan(s, car.id, {
                    ...car.plan,
                    [key]: e.target.checked,
                  }),
                )
              }
            />{" "}
            {title}
          </label>
        ))}
      </div>
      {racing ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {["ATTACK", "BALANCED", "CONSERVE", "DEFEND"].map((mode) => (
            <button
              className={button + (car.mode === mode ? " bg-sky-950" : "")}
              aria-pressed={car.mode === mode}
              key={mode}
              disabled={car.retired}
              onClick={() => onAction((s) => commandDriver(s, car.id, mode))}
            >
              {mode}
            </button>
          ))}
          <button
            className={button}
            disabled={car.retired || w.pitClosed || w.seriesId === "RALLY"}
            onClick={() =>
              onAction((s) =>
                callPit(
                  s,
                  car.id,
                  car.plan.nextCompound,
                  car.plan.repair,
                  car.plan.changeDriver,
                ),
              )
            }
          >
            Box this lap
          </button>
          <button
            className={button}
            disabled={car.retired}
            onClick={() => onAction((s) => retireRaceCar(s, car.id))}
          >
            Retire car
          </button>
        </div>
      ) : null}
      <p className="mt-3 text-xs text-zinc-500">
        {rules.refuel ? "Refuelling permitted." : "No race refuelling."}{" "}
        {rules.twoCompounds
          ? `Dry tyre requirement: ${rules.alternateSets ? `${rules.alternateSets} alternate sets + primary; each ≥2 laps, including green running` : "two different specifications"}.`
          : ""}{" "}
        {rules.pitWindow
          ? "Mandatory driver-change window: 25–35 minutes, subject to race-control delay."
          : ""}{" "}
        {rules.mandatoryStop && !rules.pitWindow
          ? `${rules.requiredStops} mandatory stop(s), earliest after lap ${rules.minStopLap}.`
          : ""}
      </p>
      <p className="mt-2 text-xs text-zinc-400">
        Crew:{" "}
        {car.crew
          .map(
            (d) =>
              `${d.name} (${(d.drivingSeconds / 60).toFixed(0)} min, fatigue ${d.fatigue.toFixed(0)}%)`,
          )
          .join(" · ")}
      </p>
    </article>
  );
}
function CrewManager({ flow, onAction }: Props) {
  const [selected, setSelected] = useState<Record<string, string>>({}),
    c = flow.career!,
    world = c.world;
  if (!world) return null;
  const team = playerTeam(world);
  if (!team.raceCrews) return null;
  const candidates = c.candidates
    .filter((x) => x.status === "AVAILABLE" && x.seat.startsWith("DRIVER"))
    .sort((a, b) => a.salary - b.salary)
    .slice(0, 100);
  return (
    <article className={card}>
      <h4 className="font-semibold">Driver crews & co-drivers</h4>
      <p className="mt-2 text-sm text-zinc-400">
        Shared-car crew members have employment contracts, salaries and
        championship eligibility. Release and recruit between race weekends.
      </p>
      <div className="mt-4 space-y-4">
        {team.raceCrews.map((crew) => {
          const ids = [
              ...crew.members,
              ...(crew.coDriverId ? [crew.coDriverId] : []),
            ],
            vacancy =
              world.playerSeriesId === "RALLY"
                ? !crew.coDriverId
                : crew.members.length <
                  crewSizeForSeries(world.playerSeriesId) - 1;
          const candidateId = selected[crew.leadId] ?? candidates[0]?.id;
          return (
            <div key={crew.leadId} className="border-t border-zinc-800 pt-3">
              <p>
                {!team.drivers.includes(crew.leadId)
                  ? "Vacant car entry · "
                  : ""}
                {world.people.find((p) => p.id === crew.leadId)?.name} ·{" "}
                {world.playerSeriesId === "RALLY"
                  ? "Co-driver"
                  : "Support drivers"}
              </p>
              {ids.map((id) => (
                <p className="mt-2 text-sm" key={id}>
                  {world.people.find((p) => p.id === id)?.name}{" "}
                  <button
                    className={button + " ml-3"}
                    onClick={() => onAction((s) => terminateEmployment(s, id))}
                  >
                    Release · pay guarantee
                  </button>
                </p>
              ))}
              {vacancy ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    className="max-w-full bg-zinc-950 p-2 text-sm"
                    aria-label={`Crew candidate for ${crew.leadId}`}
                    value={candidateId ?? ""}
                    onChange={(e) =>
                      setSelected({
                        ...selected,
                        [crew.leadId]: e.target.value,
                      })
                    }
                  >
                    {candidates.map((x) => (
                      <option value={x.id} key={x.id}>
                        {x.character.name} · skill {x.skill} · €
                        {(x.salary * 1.2).toFixed(2)}m/year + fees
                      </option>
                    ))}
                  </select>
                  <button
                    className={button}
                    disabled={
                      !candidateId || !team.drivers.includes(crew.leadId)
                    }
                    onClick={() =>
                      onAction((s) =>
                        recruitRaceCrew(s, candidateId, crew.leadId),
                      )
                    }
                  >
                    Recruit crew member
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}
function RaceReport({ summary }: { summary: RaceSummary }) {
  const [frame, setFrame] = useState(0),
    snap = summary.snapshots[Math.min(frame, summary.snapshots.length - 1)],
    ids = summary.snapshots[0]?.rows.map((r) => r.id) ?? [],
    maxPosition = Math.max(
      2,
      ...summary.snapshots.flatMap((s) => s.rows.map((r) => r.position)),
    ),
    maxLap = Math.max(1, summary.laps);
  return (
    <article className={card}>
      <h4 className="font-semibold">Race debrief · {summary.venue}</h4>
      <p className="mt-2 text-sm text-zinc-400">
        {summary.ruleId} · {summary.laps} laps/stages ·{" "}
        {summary.wetRace ? "Wet tyres used" : "Dry tyre race"}
      </p>
      <svg
        role="img"
        aria-label="Player positions through the race"
        viewBox="0 0 640 170"
        className="mt-4 w-full rounded-xl bg-zinc-950"
      >
        <text x="8" y="15" fill="#a1a1aa" fontSize="10">
          P1
        </text>
        <text x="8" y="155" fill="#a1a1aa" fontSize="10">
          P{maxPosition}
        </text>
        {ids.map((id, i) => (
          <polyline
            key={id}
            fill="none"
            stroke={["#38bdf8", "#34d399", "#fbbf24"][i % 3]}
            strokeWidth="2"
            points={summary.snapshots
              .flatMap((s) => {
                const r = s.rows.find((r) => r.id === id);
                return r
                  ? [
                      `${35 + (s.lap / maxLap) * 590},${20 + ((r.position - 1) / (maxPosition - 1)) * 130}`,
                    ]
                  : [];
              })
              .join(" ")}
          />
        ))}
      </svg>
      {snap ? (
        <div className="mt-4">
          <label className="text-sm">
            Replay · lap/stage {snap.lap}
            <input
              className="ml-4 w-2/3"
              aria-label="Race replay frame"
              type="range"
              min="0"
              max={Math.max(0, summary.snapshots.length - 1)}
              value={Math.min(frame, summary.snapshots.length - 1)}
              onChange={(e) => setFrame(Number(e.target.value))}
            />
          </label>
          <p className="mt-2 text-xs text-zinc-400">
            {snap.flag} · wetness {snap.wetness.toFixed(0)}% ·{" "}
            {snap.rows
              .map(
                (r) =>
                  `${summary.entries.find((e) => e.id === r.id)?.crew[0]?.name}: P${r.position}, +${r.gap.toFixed(1)}s`,
              )
              .join(" · ")}
          </p>
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {summary.entries
          .filter((e) => ids.includes(e.id))
          .map((e) => (
            <div key={e.id}>
              <p className="text-sm font-medium">
                {e.crew[0]?.name} · grid P{e.grid} · {e.stops} stops ·{" "}
                {e.finishPoints} race + {e.bonusPoints} bonus points ·{" "}
                {e.dsq ? "DSQ" : (e.reason ?? time(e.time))}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {e.explanation} Repairs / spares €{e.repairCost.toFixed(3)}m.
              </p>
              <p className="text-xs text-zinc-500">
                {e.crew
                  .map(
                    (d) =>
                      `${d.name}: ${(d.seconds / 60).toFixed(0)} min${d.eligible ? "" : " (insufficient driving time; no points)"}`,
                  )
                  .join(" · ")}
              </p>
            </div>
          ))}
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-sky-300">
          Event timeline
        </summary>
        <ol className="mt-3 max-h-80 space-y-2 overflow-auto text-xs">
          {summary.events.map((e, i) => (
            <li key={i}>
              L{e.lap} · {e.kind} · {e.text}
            </li>
          ))}
        </ol>
      </details>
    </article>
  );
}
export function RacePanel({ flow, onAction }: Props) {
  const [playing, setPlaying] = useState(false),
    [reportRound, setReportRound] = useState<number | null>(null),
    c = flow.career!,
    w = c.weekend,
    active = !!w && !w.committed;
  useEffect(() => {
    if (!playing || !active || w?.phase !== "RACING" || w.decision) return;
    const timer = setInterval(
      () => onAction((s) => advanceRace(s, "LAP")),
      650,
    );
    return () => clearInterval(timer);
  }, [playing, active, w?.phase, w?.decision, onAction]);
  const cfg = getSeries(c.world?.playerSeriesId ?? "F1"),
    rules = active
      ? raceRules(w!)
      : getRaceRules(
          cfg.id,
          Math.max(0, flow.currentRound - c.seasonStart + 1),
          cfg.calendar[
            Math.max(0, flow.currentRound - c.seasonStart + 1) % cfg.rounds
          ]?.kind ?? "FEATURE",
        ),
    report = c.races.find((r) => r.round === reportRound) ?? c.races.at(-1);
  return (
    <div className="space-y-5">
      <h3 className="text-xl font-semibold">Race weekend & strategy</h3>
      <p className="text-sm text-zinc-400">
        {cfg.name} · {rules.name} ·{" "}
        <a
          className="text-sky-300 underline"
          href={rules.reference}
          target="_blank"
          rel="noreferrer"
        >
          Sporting-rule reference
        </a>
      </p>
      {active ? (
        <>
          <article className={card}>
            <div className="flex flex-wrap justify-between gap-3">
              <h4>
                {w!.venue} · {w!.session} · {w!.phase}
              </h4>
              <p>
                {w!.seriesId === "RALLY" ? "Stage" : "Lap"} {w!.lap}/
                {w!.totalLaps} · {time(w!.clockSeconds)} · {w!.flag}
                {w!.pitClosed ? " · pits CLOSED" : ""}
              </p>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Track {w!.lengthKm.toFixed(2)}km · overtaking{" "}
              {w!.overtaking.toFixed(0)}/100 · abrasion {w!.abrasion.toFixed(0)}
              /100 · wetness {w!.wetness.toFixed(0)}% · forecast{" "}
              {w!.forecast
                .filter((f) => f.lap > w!.lap)
                .slice(0, 2)
                .map((f) => `L${f.lap}: ${f.chance.toFixed(0)}% rain`)
                .join(" · ") || "No remaining forecast update"}
            </p>
            {w!.decision ? (
              <p role="status" className="mt-3 text-amber-300">
                {w!.decision}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={button}
                disabled={w!.phase !== "PRACTICE" || w!.practiceRuns >= 3}
                onClick={() => onAction(runPractice)}
              >
                Practice run {w!.practiceRuns}/3
              </button>
              <button
                className={button}
                disabled={!["PRACTICE", "QUALIFYING"].includes(w!.phase)}
                onClick={() => onAction(runQualifying)}
              >
                Run qualifying
              </button>
              <button
                className={button}
                disabled={!["GRID", "RACING"].includes(w!.phase)}
                onClick={() => onAction((s) => advanceRace(s, "LAP"))}
              >
                {w!.phase === "GRID" ? "Start race" : "Next lap / stage"}
              </button>
              <button
                className={button}
                onClick={() => {
                  setPlaying(false);
                  onAction((s) => advanceRace(s, "DECISION"));
                }}
              >
                Run to decision
              </button>
              <button
                className={button}
                disabled={!["GRID", "RACING"].includes(w!.phase)}
                onClick={() => {
                  if (playing && !w!.decision) setPlaying(false);
                  else {
                    if (w!.phase === "GRID" || w!.decision)
                      onAction((s) => advanceRace(s, "LAP"));
                    setPlaying(true);
                  }
                }}
              >
                {playing && !w!.decision
                  ? "Pause autoplay"
                  : "Autoplay · pause on decisions"}
              </button>
              <button
                className={button}
                onClick={() => {
                  setPlaying(false);
                  onAction((s) => advanceRace(s, "FINISH"));
                }}
              >
                Simulate remaining weekend
              </button>
            </div>
            <div className="mt-4 space-y-1 text-xs text-zinc-400">
              {w!.practiceNotes.slice(-6).map((n, i) => (
                <p key={i}>{n}</p>
              ))}
            </div>
          </article>
          <div className="grid gap-4 xl:grid-cols-2">
            {w!.cars
              .filter((car) => car.ours)
              .map((car) => (
                <CarControls
                  key={car.id}
                  car={car}
                  w={w!}
                  onAction={onAction}
                />
              ))}
          </div>
          <article className={card}>
            <h4>Live timing</h4>
            <div className="mt-3 max-h-[32rem] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Entry / driver</th>
                    <th>Gap</th>
                    <th>Lap</th>
                    <th>Tyres / wear</th>
                    <th>Fuel</th>
                    <th>Stops</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {liveOrder(w!).map((car, i) => (
                    <tr
                      className={
                        "border-t border-zinc-800 " +
                        (car.ours ? "text-sky-300" : "")
                      }
                      key={car.id}
                    >
                      <td className="py-2">{i + 1}</td>
                      <td>
                        {car.crew[car.activeDriver].name}
                        <span className="block text-xs text-zinc-500">
                          {car.team} ·{" "}
                          {car.classId === "TRAFFIC"
                            ? "GT traffic class"
                            : "Main class"}
                        </span>
                      </td>
                      <td>+{gapToLeader(w!, car).toFixed(1)}s</td>
                      <td>{car.completedLaps}</td>
                      <td>
                        {car.compound} {car.wear.toFixed(0)}%
                      </td>
                      <td>{car.fuel.toFixed(1)}</td>
                      <td>{car.stops}</td>
                      <td>
                        {car.retired
                          ? "DNF"
                          : car.pitRequested
                            ? "BOX"
                            : car.penaltySeconds
                              ? `+${car.penaltySeconds}s`
                              : "Running"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {w!.cars
                .filter((c) => c.ours && !c.retired)
                .flatMap((giver) =>
                  w!.cars
                    .filter((c) => c.ours && !c.retired && c.id !== giver.id)
                    .map((receiver) => (
                      <button
                        key={giver.id + receiver.id}
                        className={button}
                        disabled={
                          w!.phase !== "RACING" ||
                          w!.flag !== "GREEN" ||
                          w!.seriesId === "RALLY"
                        }
                        onClick={() =>
                          onAction((s) =>
                            issueTeamOrder(s, giver.id, receiver.id),
                          )
                        }
                      >
                        Ask {giver.name} to let {receiver.name} through
                      </button>
                    )),
                )}
            </div>
          </article>
          <article className={card}>
            <h4>Race radio</h4>
            <ol className="mt-3 max-h-72 space-y-2 overflow-auto text-xs">
              {w!.events
                .slice(-40)
                .reverse()
                .map((e, i) => (
                  <li key={i}>
                    L{e.lap} · {e.text}
                  </li>
                ))}
            </ol>
          </article>
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-400">
            Start the next round from Team HQ to prepare its race weekend.
            Choose setup, tyre and fuel plans, then run lap by lap, until a
            decision, or simulate the complete weekend.
          </p>
          <div className="flex gap-3">
            {(["BALANCED", "ATTACK", "CONSERVE"] as const).map((mode) => (
              <button
                className={button + (c.strategy === mode ? " bg-sky-950" : "")}
                key={mode}
                onClick={() => onAction((s) => setRaceStrategy(s, mode))}
              >
                {mode}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            Attack trades tyre life and incident risk for pace; conserve saves
            tyres and fuel. Race instructions can differ by car.
          </p>
          <CrewManager flow={flow} onAction={onAction} />
        </>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <article className={card}>
          <h4>
            {cfg.id === "INDYCAR" ? "Team aggregate" : "Team championship"}
          </h4>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Team</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {teamTable(c).map((t, i) => (
                <tr className="border-t border-zinc-800" key={t.team}>
                  <td className="py-2">{i + 1}</td>
                  <td>{t.team}</td>
                  <td>{t.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
        <article className={card}>
          <h4>Driver championship</h4>
          <div className="mt-3 max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Driver</th>
                  <th>Points</th>
                  <th>Wins</th>
                </tr>
              </thead>
              <tbody>
                {[...c.standings]
                  .sort((a, b) => b.points - a.points || b.wins - a.wins)
                  .map((d, i) => (
                    <tr className="border-t border-zinc-800" key={d.id}>
                      <td className="py-2">{i + 1}</td>
                      <td>
                        {d.name}
                        <span className="block text-xs text-zinc-500">
                          {d.team}
                        </span>
                      </td>
                      <td>{d.points}</td>
                      <td>{d.wins}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
      {report?.summary ? (
        <>
          <label className="block text-sm">
            Review race{" "}
            <select
              className="ml-3 bg-zinc-950 p-2"
              value={report.round}
              onChange={(e) => setReportRound(Number(e.target.value))}
            >
              {c.races
                .filter((r) => r.summary)
                .map((r) => (
                  <option key={r.round} value={r.round}>
                    R{r.round} · {r.summary!.venue}
                  </option>
                ))}
            </select>
          </label>
          <RaceReport key={report.round} summary={report.summary} />
          <article className={card}>
            <h4>Classification · R{report.round}</h4>
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Driver / entry</th>
                  <th>Team</th>
                  <th>Points</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((r) => (
                  <tr className="border-t border-zinc-800" key={r.characterId}>
                    <td className="py-2">{r.position}</td>
                    <td>{r.name}</td>
                    <td>{r.team}</td>
                    <td>{r.points}</td>
                    <td>
                      {report.summary!.entries.find(
                        (e) => e.id === r.characterId,
                      )?.dsq
                        ? "DSQ"
                        : r.dnf
                          ? "DNF"
                          : "Finished"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </>
      ) : report ? (
        <p className="text-sm text-zinc-400">
          Legacy result · R{report.round}. Detailed telemetry begins with new
          races.
        </p>
      ) : null}
    </div>
  );
}
