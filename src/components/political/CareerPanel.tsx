"use client";

import { useState } from "react";
import type { RoundFlowState } from "@/game/season/round-flow";
import type { Candidate, Seat } from "@/game/career/state";
import {
  signCandidate,
  respondTransferOffer,
  terminateEmployment,
  agreeMutualOption,
  releaseContract,
} from "@/game/career/market";
import { respondActorRequest } from "@/game/career/actors";
import { startDevelopment, PROJECTS, teamTable } from "@/game/career/sport";
import { startNextSeason, setRaceStrategy } from "@/game/career/career";
import { isReleaseClauseInForce } from "@/game/contracts/contracts";

type Props = {
  flow: RoundFlowState;
  view: "MARKET" | "RACING" | "DEVELOPMENT" | "CAREER";
  onAction: (action: (state: RoundFlowState) => RoundFlowState) => void;
};
const card = "rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5";
const button =
  "rounded-lg border border-sky-800 px-3 py-2 text-sm text-sky-300 hover:border-sky-500 disabled:opacity-40 disabled:cursor-not-allowed";
const money = (n: number) => `€${n.toFixed(2)}m`;
const label = (s: string) => s.replaceAll("_", " ");
function CandidateCard({
  candidate,
  flow,
  onAction,
}: {
  candidate: Candidate;
  flow: RoundFlowState;
  onAction: Props["onAction"];
}) {
  const [premium, setPremium] = useState(false),
    [duration, setDuration] = useState(24);
  const slots = flow.career!.seats.filter(
    (s) =>
      !s.characterId &&
      (s.seat === candidate.seat ||
        (s.seat.startsWith("DRIVER") && candidate.seat.startsWith("DRIVER"))),
  );
  const [selected, setSelected] = useState<Seat>(candidate.seat);
  const seat = slots.some((s) => s.seat === selected)
    ? selected
    : (slots[0]?.seat ?? candidate.seat);
  const salary = Number((candidate.salary * (premium ? 1.2 : 1)).toFixed(2));
  return (
    <article className={card}>
      <h4 className="text-lg font-semibold">{candidate.character.name}</h4>
      <p className="mt-2 text-sm text-zinc-400">
        {label(candidate.seat)} · Skill {candidate.skill} · {candidate.employer}
      </p>
      <p className="mt-2 text-sm">
        Salary demand {money(candidate.salary)} / season · Signing{" "}
        {money(candidate.signingFee)} · Buyout {money(candidate.buyout)}
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        Ambition {candidate.character.personality.ambition} · Compromise{" "}
        {candidate.character.personality.compromiseWillingness} · Available R
        {candidate.availableFrom}–R{candidate.availableUntil}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <label>
          Seat{" "}
          <select
            aria-label={`Seat for ${candidate.character.name}`}
            className="bg-zinc-950 p-2"
            value={seat}
            onChange={(e) => setSelected(e.target.value as Seat)}
          >
            {slots.length ? (
              slots.map((s) => (
                <option key={s.seat} value={s.seat}>
                  {label(s.seat)}
                </option>
              ))
            ) : (
              <option value={seat}>No vacant seat</option>
            )}
          </select>
        </label>
        <label>
          Term{" "}
          <select
            aria-label={`Term for ${candidate.character.name}`}
            className="bg-zinc-950 p-2"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            {[12, 24, 36, 48].map((n) => (
              <option key={n} value={n}>
                {n} rounds
              </option>
            ))}
          </select>
        </label>
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={premium}
            onChange={(e) => setPremium(e.target.checked)}
          />
          20% salary premium
        </label>
      </div>
      <button
        className={button + " mt-4"}
        disabled={!slots.length || flow.currentRound > candidate.availableUntil}
        onClick={() =>
          onAction((s) =>
            signCandidate(s, candidate.id, seat, salary, duration),
          )
        }
      >
        Offer {money(salary)} / season
      </button>
      <p className="mt-2 text-xs text-zinc-500">
        Offer includes guaranteed salary for the term and a character-held
        renewal option. Leadership reputation affects consent; all fees and
        commitments must fit the budget.
      </p>
    </article>
  );
}
export function CareerPanel({ flow, view, onAction }: Props) {
  const c = flow.career;
  if (!c) return <p>Load an older save or reset rounds to open career mode.</p>;
  const name = (id: string | null) =>
    flow.political.characters.find((a) => a.id === id)?.name ?? "Vacant";
  if (view === "MARKET")
    return (
      <div className="space-y-5">
        <h3 className="text-xl font-semibold">Driver & staff market</h3>
        <p className="text-sm text-zinc-400">
          Vacant seats accept new signings. Transfers need actor consent;
          departures preserve all remaining guaranteed pay.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {c.seats.map((seat) => {
            const contract = flow.political.contracts.find(
              (x) =>
                x.characterId === seat.characterId && x.status === "ACTIVE",
            );
            return (
              <article className={card} key={seat.seat}>
                <p className="text-xs text-zinc-500">{label(seat.seat)}</p>
                <p className="mt-2 font-semibold">{name(seat.characterId)}</p>
                {contract ? (
                  <>
                    <p className="mt-2 text-xs text-zinc-400">
                      Remaining guarantee{" "}
                      {money(
                        Math.max(
                          0,
                          contract.guaranteedSalaryMillions -
                            contract.salaryPaidMillions,
                        ),
                      )}
                    </p>
                    <button
                      className={button + " mt-3"}
                      onClick={() =>
                        onAction((s) =>
                          terminateEmployment(s, contract.characterId),
                        )
                      }
                    >
                      Terminate & pay remaining guarantee
                    </button>
                    {contract.releaseClauses
                      .filter(
                        (clause) =>
                          clause.beneficiary !== "CHARACTER" &&
                          isReleaseClauseInForce(
                            contract,
                            clause,
                            flow.currentRound,
                          ),
                      )
                      .map((clause) => (
                        <button
                          key={clause.id}
                          className={button + " mt-3 ml-2"}
                          onClick={() =>
                            onAction((s) =>
                              releaseContract(s, contract.id, clause.id),
                            )
                          }
                        >
                          Use team release right ·{" "}
                          {money(clause.amountMillions)} + guarantee
                        </button>
                      ))}
                  </>
                ) : null}
              </article>
            );
          })}
        </div>
        <h4 className="text-lg font-semibold">Rival offers</h4>
        {c.offers
          .filter((o) => o.status === "OPEN")
          .map((o) => (
            <article key={o.id} className={card}>
              <p>
                {o.club} wants {name(o.characterId)}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                Salary {money(o.salary)} · transfer income {money(o.fee)} ·
                response by R{o.expiresRound}
              </p>
              <p className="mt-2 text-xs text-amber-300">
                {o.clauseId
                  ? "Active character release right: an unsettled actor can leave independently when the offer expires."
                  : "No unilateral release right: the team can refuse this move."}
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  className={button}
                  onClick={() =>
                    onAction((s) => respondTransferOffer(s, o.id, true))
                  }
                >
                  Agree transfer
                </button>
                <button
                  className={button}
                  onClick={() =>
                    onAction((s) => respondTransferOffer(s, o.id, false))
                  }
                >
                  Refuse · actor pressure +8
                </button>
              </div>
            </article>
          ))}
        {!c.offers.some((o) => o.status === "OPEN") ? (
          <p className="text-sm text-zinc-500">
            No open rival offers. Ambition, transfer interest and contract
            windows drive approaches.
          </p>
        ) : null}
        <h4 className="text-lg font-semibold">Available candidates</h4>
        <div className="grid gap-4 lg:grid-cols-2">
          {c.candidates
            .filter((x) => x.status === "AVAILABLE")
            .map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                flow={flow}
                onAction={onAction}
              />
            ))}
        </div>
      </div>
    );
  if (view === "DEVELOPMENT")
    return (
      <div className="space-y-5">
        <h3 className="text-xl font-semibold">Development programme</h3>
        <p className="text-sm text-zinc-400">
          Car pace {c.car.pace} · reliability {c.car.reliability}. Two parallel
          slots. Fatigue raises failure risk; a departing project leader adds 25
          percentage points. Successful work strengthens its sponsor.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(PROJECTS) as Array<keyof typeof PROJECTS>).map(
            (kind) => (
              <article key={kind} className={card}>
                <h4>{kind}</h4>
                <p className="mt-2 text-sm text-zinc-400">
                  {money(PROJECTS[kind].cost)} · {PROJECTS[kind].duration}{" "}
                  rounds · base risk {PROJECTS[kind].risk}%
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  +{PROJECTS[kind].gain}{" "}
                  {kind === "AERO"
                    ? "car pace"
                    : kind === "RELIABILITY"
                      ? "reliability"
                      : "sporting lead skill"}
                </p>
                <button
                  className={button + " mt-3"}
                  disabled={
                    c.status !== "RUNNING" ||
                    c.projects.filter((p) => p.status === "ACTIVE").length >=
                      2 ||
                    c.projects.some(
                      (p) => p.kind === kind && p.status === "ACTIVE",
                    )
                  }
                  onClick={() => onAction((s) => startDevelopment(s, kind))}
                >
                  Commission
                </button>
              </article>
            ),
          )}
        </div>
        {c.projects.map((p) => (
          <article className={card} key={p.id}>
            <p>
              {p.kind} · {p.status}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              R{p.startedRound} → R{p.dueRound} · {money(p.cost)} · risk{" "}
              {p.risk}% · Sponsor: {name(p.sponsorId)}
            </p>
          </article>
        ))}
      </div>
    );
  if (view === "RACING") {
    const standings = [...c.standings].sort(
      (a, b) =>
        b.points - a.points || b.wins - a.wins || a.id.localeCompare(b.id),
    );
    const race = c.races.at(-1);
    return (
      <div className="space-y-5">
        <h3 className="text-xl font-semibold">Championship & race strategy</h3>
        <p className="text-sm text-zinc-400">
          Season {2025 + c.season} · race {((flow.currentRound - 1) % 24) + 1}
          /24 · Car {c.car.pace} pace / {c.car.reliability} reliability. Results
          depend on driver skill, staff, momentum, stability and seeded race
          variance. The first career season starts with the remaining demo races
          and zero recorded points.
        </p>
        <div className="flex flex-wrap gap-3">
          {(["BALANCED", "ATTACK", "CONSERVE"] as const).map((strategy) => (
            <button
              key={strategy}
              className={
                button + (c.strategy === strategy ? " bg-sky-950" : "")
              }
              aria-pressed={c.strategy === strategy}
              onClick={() => onAction((s) => setRaceStrategy(s, strategy))}
            >
              {strategy}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          Attack: +5 pace, +5 percentage points failure risk. Conserve: −3 pace,
          −3 percentage points risk.
        </p>
        <div className="grid gap-5 lg:grid-cols-2">
          <article className={card}>
            <h4>Constructors</h4>
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
                  <tr key={t.team} className="border-t border-zinc-800">
                    <td className="py-2">{i + 1}</td>
                    <td>{t.team}</td>
                    <td>{t.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
          <article className={card}>
            <h4>Drivers</h4>
            <div className="max-h-96 overflow-auto">
              <table className="mt-3 w-full text-left text-sm">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Driver</th>
                    <th>Pts</th>
                    <th>Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((d, i) => (
                    <tr key={d.id} className="border-t border-zinc-800">
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
        {race ? (
          <article className={card}>
            <h4>Last Grand Prix · R{race.round}</h4>
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Driver</th>
                  <th>Team</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {race.results.map((r) => (
                  <tr key={r.characterId} className="border-t border-zinc-800">
                    <td className="py-2">{r.position}</td>
                    <td>{r.name}</td>
                    <td>{r.team}</td>
                    <td>{r.dnf ? "DNF" : `${r.points} pts`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ) : null}
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <h3 className="text-xl font-semibold">Career & board</h3>
      <article className={card}>
        <p>
          Season {2025 + c.season} · {c.status} · Board warnings {c.warnings}/2
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Targets: constructors P{c.targets.teamPosition} · closing cash ≥{" "}
          {money(c.targets.cash)} · stability ≥ {c.targets.stability}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Board score: sport 35, finances 30, stability 35. Below 60: warning;
          below 30 or two consecutive warnings: dismissal. Cash below −€25m also
          ends your tenure. Season prizes scale with constructor rank.
        </p>
        {c.status === "REVIEW" ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className={button}
              onClick={() => onAction((s) => startNextSeason(s, "CONSOLIDATE"))}
            >
              Next season · P5 / €0m / stability 55
            </button>
            <button
              className={button}
              onClick={() => onAction((s) => startNextSeason(s, "CHALLENGE"))}
            >
              Next season · P2 / €5m / stability 65
            </button>
          </div>
        ) : null}
        {c.status === "DISMISSED" ? (
          <p className="mt-3 text-red-300">
            Your tenure has ended. Load an earlier save or reset rounds to start
            again.
          </p>
        ) : null}
      </article>
      {c.reviews.map((r) => (
        <article className={card} key={r.season}>
          Season {2025 + r.season}: {r.verdict} · {r.score}/100
          <p className="mt-2 text-sm text-zinc-400">
            P{r.teamPosition} · cash {money(r.cash)} · stability{" "}
            {r.stability.toFixed(0)} · prize {money(r.prize)}
          </p>
        </article>
      ))}
      <h4 className="text-lg font-semibold">Actor initiatives</h4>
      <p className="text-sm text-zinc-400">
        Actors pursue goals, recruit allies and create demands independently.
        Unanswered requests escalate after their deadline.
      </p>
      {c.requests
        .filter((r) => ["OPEN", "ESCALATED"].includes(r.status))
        .map((r) => (
          <article className={card} key={r.id}>
            <p>
              {name(r.characterId)} · {r.kind} · {r.status}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              {r.summary} Deadline R{r.deadline}.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                className={button}
                onClick={() =>
                  onAction((s) => respondActorRequest(s, r.id, true))
                }
              >
                {r.kind === "RENEWAL"
                  ? "Confirm completed renewal"
                  : "Support / agree"}
              </button>
              <button
                className={button}
                onClick={() =>
                  onAction((s) => respondActorRequest(s, r.id, false))
                }
              >
                Refuse
              </button>
            </div>
          </article>
        ))}
      <h4 className="text-lg font-semibold">Mutual extensions</h4>
      {flow.political.contracts
        .filter((contract) => contract.status === "ACTIVE")
        .flatMap((contract) =>
          contract.options
            .filter((o) => o.holder === "MUTUAL" && !o.exercised && o.available)
            .map((o) => (
              <article className={card} key={o.id}>
                <p>
                  {name(contract.characterId)} · window R{o.exerciseFromRound}–R
                  {o.exerciseUntilRound} · +{o.extensionRounds} rounds
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Actor consent depends on trust, willingness to compromise and
                  instability. The team must have budget approval.
                </p>
                <button
                  className={button + " mt-3"}
                  disabled={
                    flow.currentRound < o.exerciseFromRound ||
                    flow.currentRound > o.exerciseUntilRound
                  }
                  onClick={() =>
                    onAction((s) => agreeMutualOption(s, contract.id, o.id))
                  }
                >
                  Seek consent & exercise
                </button>
              </article>
            )),
        )}
      <article className={card}>
        <h4>Management log</h4>
        <div className="mt-3 max-h-96 space-y-2 overflow-auto">
          {[...c.log].reverse().map((entry, i) => (
            <p key={i} className="text-sm text-zinc-400">
              R{entry.round} · {entry.text}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}
