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
import { startWeiterSaison } from "@/game/career/career";
import { isReleaseClauseInForce } from "@/game/contracts/contracts";

type Props = {
  flow: RoundFlowState;
  view: "MARKET" | "RACING" | "DEVELOPMENT" | "CAREER";
  onAction: (action: (state: RoundFlowState) => RoundFlowState) => void;
};
const card = "rounded-lg border border-slate-700 bg-[#111720] p-4";
const button = "mm-button disabled:opacity-40";
const money = (n: number) => `€${n.toFixed(2)} Mio.`;
const label = (s: string) => {
  const labels: Record<string, string> = {
    DRIVER_ONE: "Fahrer 1",
    DRIVER_TWO: "Fahrer 2",
    TECHNICAL: "Technik",
    SPORTING: "Sport",
    ENGINEERING: "Ingenieur",
    AERO: "Aerodynamik",
    RELIABILITY: "Zuverlässigkeit",
    FACILITIES: "Infrastruktur",
  };
  return labels[s] ?? s.replaceAll("_", " ");
};
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
        {label(candidate.seat)} · Stärke {candidate.skill} · {candidate.employer === "Free agent" ? "Ohne Vertrag" : candidate.employer}
      </p>
      <p className="mt-2 text-sm">
        Gehaltsforderung {money(candidate.salary)} / season · Signing{" "}
        {money(candidate.signingFee)} · Ablöse {money(candidate.buyout)}
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        {candidate.seriesId
          ? `${candidate.seriesId} · ${candidate.age} Jahre · ${candidate.nationality} · Potenzial ${candidate.potential} · `
          : ""}
        Ambition {candidate.character.personality.ambition} · Compromise{" "}
        {candidate.character.personality.compromiseWillingness} · Verfügbar R
        {candidate.availableFrom}–R{candidate.availableUntil}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <label>
          Position{" "}
          <select
            aria-label={`Position für ${candidate.character.name}`}
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
              <option value={seat}>Keine freie Position</option>
            )}
          </select>
        </label>
        <label>
          Laufzeit{" "}
          <select
            aria-label={`Laufzeit für ${candidate.character.name}`}
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
                {n} Runden
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
          20 % Gehaltsaufschlag
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
        Angebot: {money(salary)} / season
      </button>
      <p className="mt-2 text-xs text-zinc-500">
        Angebot: includes guaranteed salary for the term and a character-held
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
  if (!c) return <p>Load an older save or reset Runden to open career mode.</p>;
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
  const currentSeite = Math.min(page, pages - 1);
  const name = (id: string | null) =>
    flow.political.characters.find((a) => a.id === id)?.name ?? "Unbesetzt";
  if (view === "MARKET")
    return (
      <div className="space-y-5">
        <h3 className="text-xl font-semibold">Fahrer- & Personalmarkt</h3>
        <p className="text-sm text-zinc-400">
          Freie Positionen können neu besetzt werden. Transfers benötigen die Zustimmung der beteiligten Person; bei Trennungen bleiben garantierte Zahlungen bestehen.
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
                      Verbleibende Garantie{" "}
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
                      Vertrag auflösen & Garantie zahlen
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
                          Ausstiegsrecht des Teams nutzen ·{" "}
                          {money(clause.amountMillions)} + Garantie
                        </button>
                      ))}
                  </>
                ) : null}
              </article>
            );
          })}
        </div>
        <h4 className="text-lg font-semibold">Vertragswarnungen</h4>
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
                Vertragswarnung
              </p>
              <p className="mt-2 font-medium">{name(contract.characterId)}</p>
              <p className="mt-1 text-sm text-zinc-400">
                Vertrag endet nach R{contract.endRound} · {Math.max(0, contract.endRound - flow.currentRound)} Runden remaining
              </p>
            </article>
          ))}
        {!flow.political.contracts.some(
          (contract) =>
            contract.status === "ACTIVE" &&
            contract.endRound - flow.currentRound <=
              (c.world ? getSeries(c.world.playerSeriesId).rounds : 24),
        ) ? (
          <p className="text-sm text-zinc-500">Keine Verträge benötigen innerhalb der nächsten Saison sofortige Aufmerksamkeit.</p>
        ) : null}
        <h4 className="text-lg font-semibold">Angebote anderer Teams</h4>
        {c.offers
          .filter((o) => o.status === "OPEN")
          .map((o) => (
            <article key={o.id} className={card}>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-300">
                Anfrage eines Rivalen
              </p>
              <p className="mt-2">
                {o.club} möchte {name(o.characterId)}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                Gehalt {money(o.salary)} · Ablöseerlös {money(o.fee)} · Antwort bis R{o.expiresRound}
              </p>
              <p className="mt-2 text-xs text-amber-300">
                {o.clauseId
                  ? "Aktives Ausstiegsrecht der Person: Bei Fristablauf kann sie den Wechsel selbst auslösen."
                  : "Kein einseitiges Ausstiegsrecht: Das Team kann den Wechsel ablehnen."}
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  className={button}
                  onClick={() =>
                    onAction((s) => respondTransferOffer(s, o.id, true))
                  }
                >
                  Transfer zustimmen
                </button>
                <button
                  className={button}
                  onClick={() =>
                    onAction((s) => respondTransferOffer(s, o.id, false))
                  }
                >
                  Ablehnen · Druck +8
                </button>
              </div>
            </article>
          ))}
        {!c.offers.some((o) => o.status === "OPEN") ? (
          <p className="text-sm text-zinc-500">
            Keine offenen Angebote anderer Teams. Ambition, Wechselinteresse und Vertragsfenster bestimmen neue Anfragen.
          </p>
        ) : null}
        <h4 className="text-lg font-semibold">
          Verfügbare Kandidaten · {available.length}
        </h4>
        <div className="flex flex-wrap gap-3 text-sm">
          <input
            aria-label="Fahrer- und Personalpool durchsuchen"
            placeholder="Name, Nationalität oder Team"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="rounded-lg bg-zinc-900 p-3"
          />
          <select
            aria-label="Herkunftsserie"
            value={sourceSeries}
            onChange={(e) => {
              setSourceSeries(e.target.value);
              setPage(0);
            }}
            className="bg-zinc-900 p-3"
          >
            <option value="ALL">Alle Rennserien</option>
            {SERIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}
              </option>
            ))}
          </select>
          <select
            aria-label="Rolle"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            className="bg-zinc-900 p-3"
          >
            <option value="ALL">Fahrer & Personal</option>
            {["DRIVER_ONE", "TECHNICAL", "SPORTING", "ENGINEERING"].map(
              (role) => (
                <option key={role} value={role}>
                  {label(role)}
                </option>
              ),
            )}
          </select>
          <select
            aria-label="Sortierung"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
            className="bg-zinc-900 p-3"
          >
            <option value="SKILL">Höchste Stärke</option>
            <option value="SALARY">Niedrigstes Gehalt</option>
            <option value="AGE">Jüngste zuerst</option>
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
            Nur ohne Vertrag
          </label>
        </div>
        {c.world ? (
          <p className="text-sm text-zinc-400">
            Gesamter Pool:{" "}
            {c.world.people.filter((p) => p.role === "DRIVER").length} Fahrer und {c.world.people.filter((p) => p.role !== "DRIVER").length} staff
            across nine series. Recruitment here shows people eligible for{" "}
            {c.world.playerSeriesId} infrage kommen; den gesamten Markt findest du in der Motorsport-Welt.
          </p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {available
            .slice(currentSeite * 24, (currentSeite + 1) * 24)
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
            disabled={currentSeite === 0}
            onClick={() => setPage(currentSeite - 1)}
          >
            Zurück
          </button>
          <span className="py-2 text-sm">
            Seite {currentSeite + 1} / {pages}
          </span>
          <button
            className={button}
            disabled={currentSeite === pages - 1}
            onClick={() => setPage(currentSeite + 1)}
          >
            Weiter
          </button>
        </div>
      </div>
    );
  if (view === "DEVELOPMENT")
    return (
      <div className="space-y-5">
        <h3 className="text-xl font-semibold">Entwicklungsprogramm</h3>
        <p className="text-sm text-zinc-400">
          Fahrzeugtempo {c.car.pace} · Zuverlässigkeit {c.car.Zuverlässigkeit}. Zwei Projekte können parallel laufen. Überlastung erhöht das Fehlerrisiko; verlässt die Projektleitung das Team, steigt das Risiko um 25 Prozentpunkte. Erfolgreiche Arbeit stärkt den verantwortlichen Bereich.
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
                  · {PROJECTS[kind].duration} Runden · base risk{" "}
                  {PROJECTS[kind].risk}%
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  +{PROJECTS[kind].gain}{" "}
                  {kind === "AERO"
                    ? "Fahrzeugtempo"
                    : kind === "RELIABILITY"
                      ? "Zuverlässigkeit"
                      : "Stärke Sportleitung"}
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
                  Projekt starten
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
              {p.risk}% · Verantwortlich: {name(p.sponsorId)}
            </p>
          </article>
        ))}
      </div>
    );
  if (view === "RACING") return <RacePanel flow={flow} onAction={onAction} />;
  return (
    <div className="space-y-5">
      <h3 className="text-xl font-semibold">Karriere & Vorstand</h3>
      <article className={card}>
        <p>
          Saison {2025 + c.season} · {c.status} · Vorstandswarnungen {c.warnings}/2
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Ziele: Teamwertung P{c.targets.teamPosition} · closing cash ≥{" "}
          {money(c.targets.cash)} · Stabilität ≥ {c.targets.stability}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Vorstandswertung: Sport 35, Finanzen 30, Stabilität 35. Unter 60 folgt eine Warnung; unter 30 oder nach zwei Warnungen in Folge die Entlassung. Ein Kassenstand unter −€
          {c.world ? (playerTeam(c.world).budget * 0.2).toFixed(2) : 25}m beendet die Amtszeit ebenfalls. Die Saisonprämie richtet sich nach dem Rang in der Teamwertung.
        </p>
        {c.status === "REVIEW" ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className={button}
              onClick={() => onAction((s) => startWeiterSeason(s, "CONSOLIDATE"))}
            >
              Weiter season · P5 / €0m / stability 55
            </button>
            <button
              className={button}
              onClick={() => onAction((s) => startWeiterSeason(s, "CHALLENGE"))}
            >
              Weiter season · P2 / €
              {c.world ? (playerTeam(c.world).budget * 0.04).toFixed(2) : 5}m /
              stability 65
            </button>
          </div>
        ) : null}
        {c.status === "DISMISSED" ? (
          <p className="mt-3 text-red-300">
            Your tenure has ended. Load an earlier save or reset Runden to start
            again.
          </p>
        ) : null}
      </article>
      {c.reviews.map((r) => (
        <article className={card} key={r.season}>
          Saison {2025 + r.season}: {r.verdict} · {r.score}/100
          <p className="mt-2 text-sm text-zinc-400">
            P{r.teamPosition} · cash {money(r.cash)} · stability{" "}
            {r.stability.toFixed(0)} · prize {money(r.prize)}
          </p>
        </article>
      ))}
      <h4 className="text-lg font-semibold">Anfragen aus dem Team</h4>
      <p className="text-sm text-zinc-400">
        Akteure verfolgen eigene Ziele, suchen Verbündete und stellen selbstständig Forderungen. Unbeantwortete Anfragen eskalieren nach Ablauf der Frist.
      </p>
      {c.requests
        .filter((r) => ["OPEN", "ESCALATED"].includes(r.status))
        .map((r) => (
          <article className={card} key={r.id}>
            <p>
              {name(r.characterId)} · {r.kind} · {r.status}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              {r.summary} Frist R{r.deadline}.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                className={button}
                onClick={() =>
                  onAction((s) => respondActorRequest(s, r.id, true))
                }
              >
                {r.kind === "RENEWAL"
                  ? "Abgeschlossene Verlängerung bestätigen"
                  : "Unterstützen / zustimmen"}
              </button>
              <button
                className={button}
                onClick={() =>
                  onAction((s) => respondActorRequest(s, r.id, false))
                }
              >
                Ablehnen
              </button>
            </div>
          </article>
        ))}
      <h4 className="text-lg font-semibold">Gemeinsame Verlängerungsoptionen</h4>
      {flow.political.contracts
        .filter((contract) => contract.status === "ACTIVE")
        .flatMap((contract) =>
          contract.options
            .filter((o) => o.holder === "MUTUAL" && !o.exercised && o.available)
            .map((o) => (
              <article className={card} key={o.id}>
                <p>
                  {name(contract.characterId)} · window R{o.exerciseFromRound}–R
                  {o.exerciseUntilRound} · +{o.extensionRounds} Runden
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
        <h4>Management-Protokoll</h4>
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
