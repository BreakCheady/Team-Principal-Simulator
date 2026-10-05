"use client";

import { RacePanel } from "./RacePanel";
import { SERIES, getSeries } from "@/game/world/series";
import { playerTeam } from "@/game/world/world";

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
import { startDevelopment, PROJECTS } from "@/game/career/sport";
import { startNextSeason } from "@/game/career/career";
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
    [duration, setDuration] = useState(
      flow.career?.world
        ? getSeries(flow.career.world.playerSeriesId).rounds
        : 24,
    );
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
        {candidate.seriesId
          ? `${candidate.seriesId} · ${candidate.age} years · ${candidate.nationality} · Potential ${candidate.potential} · `
          : ""}
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
            {(flow.career?.world
              ? [
                  getSeries(flow.career.world.playerSeriesId).rounds,
                  getSeries(flow.career.world.playerSeriesId).rounds * 2,
                ].filter((n) => n <= 52)
              : [12, 24, 36, 48]
            ).map((n) => (
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
  const [query, setQuery] = useState("");
  const [sourceSeries, setSourceSeries] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState("SKILL");
  const [page, setPage] = useState(0);
  const c = flow.career;
  if (!c) return <p>Load an older save or reset rounds to open career mode.</p>;
  const available = c.candidates
    .filter(
      (p) =>
        p.status === "AVAILABLE" &&
        `${p.character.name} ${p.employer} ${p.nationality ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (sourceSeries === "ALL" || p.seriesId === sourceSeries) &&
        (roleFilter === "ALL" || p.seat === roleFilter) &&
        (!freeOnly || p.employer === "Free agent"),
    )
    .sort((a, b) =>
      sort === "SALARY"
        ? a.salary - b.salary
        : sort === "AGE"
          ? (a.age ?? 99) - (b.age ?? 99)
          : b.skill - a.skill ||
            a.character.name.localeCompare(b.character.name),
    );
  const pages = Math.max(1, Math.ceil(available.length / 24));
  const currentPage = Math.min(page, pages - 1);
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
        <h4 className="text-lg font-semibold">Contract warnings</h4>
        {flow.political.contracts
          .filter(
            (contract) =>
              contract.status === "ACTIVE" &&
              contract.endRound - flow.currentRound <=
                (c.world ? getSeries(c.world.playerSeriesId).rounds : 24),
          )
          .sort((a, b) => a.endRound - b.endRound)
          .map((contract) => (
            <article
              key={contract.id}
              className="rounded-xl border border-amber-950 bg-amber-950/10 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                Contract warning
              </p>
              <p className="mt-2 font-medium">{name(contract.characterId)}</p>
              <p className="mt-1 text-sm text-zinc-400">
                Deal ends after R{contract.endRound} · {Math.max(0, contract.endRound - flow.currentRound)} rounds remaining
              </p>
            </article>
          ))}
        {!flow.political.contracts.some(
          (contract) =>
            contract.status === "ACTIVE" &&
            contract.endRound - flow.currentRound <=
              (c.world ? getSeries(c.world.playerSeriesId).rounds : 24),
        ) ? (
          <p className="text-sm text-zinc-500">No contracts need attention within the next season.</p>
        ) : null}
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
        <h4 className="text-lg font-semibold">
          Available candidates · {available.length}
        </h4>
        <div className="flex flex-wrap gap-3 text-sm">
          <input
            aria-label="Search driver and staff pool"
            placeholder="Name, nationality or team"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="rounded-lg bg-zinc-900 p-3"
          />
          <select
            aria-label="Source series"
            value={sourceSeries}
            onChange={(e) => {
              setSourceSeries(e.target.value);
              setPage(0);
            }}
            className="bg-zinc-900 p-3"
          >
            <option value="ALL">All source series</option>
            {SERIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}
              </option>
            ))}
          </select>
          <select
            aria-label="Candidate role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            className="bg-zinc-900 p-3"
          >
            <option value="ALL">Drivers & staff</option>
            {["DRIVER_ONE", "TECHNICAL", "SPORTING", "ENGINEERING"].map(
              (role) => (
                <option key={role} value={role}>
                  {label(role)}
                </option>
              ),
            )}
          </select>
          <select
            aria-label="Sort candidates"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
            className="bg-zinc-900 p-3"
          >
            <option value="SKILL">Best skill</option>
            <option value="SALARY">Lowest salary</option>
            <option value="AGE">Youngest</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => {
                setFreeOnly(e.target.checked);
                setPage(0);
              }}
            />
            Free agents only
          </label>
        </div>
        {c.world ? (
          <p className="text-sm text-zinc-400">
            Global pool:{" "}
            {c.world.people.filter((p) => p.role === "DRIVER").length} drivers
            and {c.world.people.filter((p) => p.role !== "DRIVER").length} staff
            across nine series. Recruitment here shows people eligible for{" "}
            {c.world.playerSeriesId}; scout the full world in Motorsport World.
          </p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {available
            .slice(currentPage * 24, (currentPage + 1) * 24)
            .map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                flow={flow}
                onAction={onAction}
              />
            ))}
        </div>
        <div className="flex gap-3">
          <button
            className={button}
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </button>
          <span className="py-2 text-sm">
            Page {currentPage + 1} / {pages}
          </span>
          <button
            className={button}
            disabled={currentPage === pages - 1}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
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
                  {money(
                    PROJECTS[kind].cost *
                      (c.world ? playerTeam(c.world).budget / 120 : 1),
                  )}{" "}
                  · {PROJECTS[kind].duration} rounds · base risk{" "}
                  {PROJECTS[kind].risk}%
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
  if (view === "RACING") return <RacePanel flow={flow} onAction={onAction} />;
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
          below 30 or two consecutive warnings: dismissal. Cash below −€
          {c.world ? (playerTeam(c.world).budget * 0.2).toFixed(2) : 25}m also
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
              Next season · P2 / €
              {c.world ? (playerTeam(c.world).budget * 0.04).toFixed(2) : 5}m /
              stability 65
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
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-300">
                  Rival approach
                </p>
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
