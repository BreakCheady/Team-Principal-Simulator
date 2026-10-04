import { transferWorldPerson, syncWorldCandidates } from "@/game/world/world";
import type { RoundFlowState } from "@/game/season/round-flow";
import {
  exerciseContractOption,
  isReleaseClauseInForce,
} from "@/game/contracts/contracts";
import {
  bookFinanceTransaction,
  getCashBalance,
} from "@/game/finance/finances";
import {
  careerCopy,
  activeContract,
  leaveTeam,
  logCareer,
  agreeMutualOption,
} from "./market";
import type { CareerState } from "./state";

export function respondActorRequest(
  source: RoundFlowState,
  requestId: string,
  support: boolean,
): RoundFlowState {
  let next = careerCopy(source);
  const request = next.career.requests.find((r) => r.id === requestId);
  if (!request || !["OPEN", "ESCALATED"].includes(request.status))
    throw new Error("Request is already closed.");
  if (!next.career.activeActorIds.includes(request.characterId))
    throw new Error("Actor has left the team.");
  const actor = next.political.characters.find(
    (c) => c.id === request.characterId,
  )!;
  const economicScale = next.career.world
    ? next.political.finance.payrollBudgetMillionsPerSeason / 70
    : 1;
  const principal = next.political.characters.find(
    (c) => c.role === "TEAM_PRINCIPAL",
  )!;
  if (support && request.kind === "OPTION") {
    next = agreeMutualOption(
      next,
      request.contractId!,
      request.optionId!,
    ) as typeof next;
  } else if (support && request.kind === "RENEWAL") {
    const contract = next.political.contracts.find(
      (c) => c.id === request.contractId,
    );
    if (
      !contract ||
      contract.endRound <= (request.contractEndRound ?? request.round)
    )
      throw new Error(
        "Renew the contract in the Contract Room before promising job security.",
      );
  } else if (support) {
    if (request.kind === "STAFF") {
      if (getCashBalance(next.political) < 0.5 * economicScale)
        throw new Error(
          `Staff support needs €${(0.5 * economicScale).toFixed(3)}m cash.`,
        );
      next.political = bookFinanceTransaction(next.political, {
        id: `support_${request.id}`,
        round: Math.max(1, next.currentRound),
        category: "OPERATING_COST",
        amountMillions: Number((0.5 * economicScale).toFixed(6)),
        description: "Staff retention and recovery support",
      });
    }
    const updatedActor = next.political.characters.find(
      (c) => c.id === actor.id,
    )!;
    updatedActor.power.internalInfluence = Math.min(
      100,
      updatedActor.power.internalInfluence + 6,
    );
    next.political.characters.find(
      (c) => c.id === principal.id,
    )!.power.internalInfluence = Math.max(
      0,
      principal.power.internalInfluence - 3,
    );
    if (request.kind === "SPONSOR") {
      next.career.strategy = "ATTACK";
      updatedActor.power.commercialBacking = Math.min(
        100,
        updatedActor.power.commercialBacking + 5,
      );
    }
    if (request.kind === "OWNER")
      next.career.targets.cash = Math.max(
        0,
        next.career.targets.cash + 2 * economicScale,
      );
  }
  next.career.requests.find((r) => r.id === requestId)!.status = support
    ? "SUPPORTED"
    : "REFUSED";
  const conflict = next.political.conflicts.find(
    (c) => c.id === `conflict_${request.id}`,
  );
  if (conflict && conflict.status !== "RESOLVED") {
    conflict.status = "RESOLVED";
    conflict.roundResolved = next.currentRound;
    conflict.outcome = support ? "COMPROMISE" : "NARROW_WIN_B";
  }
  const updated = next.political.characters.find((c) => c.id === actor.id)!;
  updated.dynamic.instability = Math.max(
    0,
    Math.min(100, updated.dynamic.instability + (support ? -10 : 12)),
  );
  if (request.kind === "STAFF" && support)
    updated.dynamic.politicalFatigue = Math.max(
      0,
      updated.dynamic.politicalFatigue - 15,
    );
  const relationship = next.political.relationships.find(
    (r) => r.fromCharacterId === actor.id && r.toCharacterId === principal.id,
  );
  if (relationship) {
    relationship.trust = Math.max(
      0,
      Math.min(100, relationship.trust + (support ? 8 : -10)),
    );
    relationship.resentment = Math.max(
      0,
      Math.min(100, relationship.resentment + (support ? -6 : 10)),
    );
  }
  logCareer(
    next,
    `${actor.name}: ${support ? "request supported; authority and obligations adjusted" : "request refused; trust falls and pressure increases"}.`,
  );
  return next;
}

export function advanceActors(source: RoundFlowState): RoundFlowState {
  let next = careerCopy(source);
  const career = next.career,
    round = next.currentRound;
  const scale = career.world
    ? next.political.finance.payrollBudgetMillionsPerSeason / 70
    : 1;
  const principal = next.political.characters.find(
    (c) => c.role === "TEAM_PRINCIPAL",
  )!;
  // Urgent unfulfilled goals create pressure independently of player-selected issues.
  for (const actorId of next.political.characters
    .filter(
      (c) => career.activeActorIds.includes(c.id) && c.id !== principal.id,
    )
    .map((c) => c.id)) {
    let actor = next.political.characters.find((c) => c.id === actorId)!;
    const goals = next.political.goals.filter(
      (g) => g.characterId === actor.id && g.active,
    );
    const goal = [...goals].sort(
      (a, b) => b.priority * b.urgency - a.priority * a.urgency,
    )[0];
    if (goal && goal.progress < 60)
      goal.urgency = Math.min(100, goal.urgency + 2);
    const allies = next.political.relationships.filter(
      (r) =>
        r.fromCharacterId === actor.id &&
        career.activeActorIds.includes(r.toCharacterId) &&
        r.toCharacterId !== principal.id,
    );
    const ally = allies.sort(
      (a, b) => b.loyalty + b.respect - (a.loyalty + a.respect),
    )[0];
    if (ally && goal && goal.urgency >= 70 && round % 3 === 0) {
      ally.loyalty = Math.min(100, ally.loyalty + 2);
      ally.personalLeverage = Math.min(100, ally.personalLeverage + 2);
      actor.power.internalInfluence = Math.min(
        100,
        actor.power.internalInfluence + 1,
      );
      logCareer(
        next,
        `${actor.name} builds support with ${next.political.characters.find((c) => c.id === ally.toCharacterId)!.name}.`,
      );
    }
    const contract = activeContract(next.political, actor.id, round);
    const option = contract?.options.find(
      (o) =>
        o.available &&
        !o.exercised &&
        round >= o.exerciseFromRound &&
        round <= o.exerciseUntilRound &&
        o.holder !== "TEAM",
    );
    const trust =
      next.political.relationships.find(
        (r) =>
          r.fromCharacterId === actor.id && r.toCharacterId === principal.id,
      )?.trust ?? 50;
    if (
      option?.holder === "CHARACTER" &&
      trust +
        actor.personality.compromiseWillingness -
        actor.dynamic.instability >=
        60
    ) {
      next.political = exerciseContractOption(
        next.political,
        contract!.id,
        option.id,
        round,
      );
      actor = next.political.characters.find((c) => c.id === actorId)!;
      logCareer(
        next,
        `${actor.name} independently exercises the character-held option; the extension and salary are binding.`,
      );
    }
    const pending = career.requests.some(
      (r) =>
        r.characterId === actor.id && ["OPEN", "ESCALATED"].includes(r.status),
    );
    const recent = career.requests.some(
      (r) => r.characterId === actor.id && round - r.round < 8,
    );
    if (!pending && !recent) {
      let kind: CareerState["requests"][number]["kind"] | null = null;
      if (option?.holder === "MUTUAL") kind = "OPTION";
      else if (contract && contract.endRound - round <= 6) kind = "RENEWAL";
      else if (round % 3 === 0 && goal && goal.urgency >= 70)
        kind =
          actor.role === "CEO" || actor.role === "OWNER_REPRESENTATIVE"
            ? "OWNER"
            : actor.role === "SPONSOR_REPRESENTATIVE"
              ? "SPONSOR"
              : actor.role === "RACE_ENGINEER"
                ? "STAFF"
                : "AUTHORITY";
      if (kind)
        career.requests.push({
          id: `request_${actor.id}_r${round}`,
          characterId: actor.id,
          round,
          kind,
          contractId: contract?.id ?? null,
          contractEndRound: contract?.endRound ?? null,
          optionId: kind === "OPTION" ? option!.id : null,
          deadline: round + 2,
          status: "OPEN",
          summary:
            kind === "OPTION"
              ? `${actor.name} seeks consent to the mutual extension.`
              : kind === "RENEWAL"
                ? `${actor.name} wants a renewal before the deal expires.`
                : kind === "OWNER"
                  ? `${actor.name} demands financial accountability; support raises the cash target by €${(2 * scale).toFixed(3)}m and owner influence.`
                  : kind === "SPONSOR"
                    ? `${actor.name} seeks an aggressive race strategy for visibility; support increases risk and sponsor influence.`
                    : kind === "STAFF"
                      ? `${actor.name} requests €${(0.5 * scale).toFixed(3)}m recovery support and staff authority.`
                      : `${actor.name} demands more authority to pursue ${goal?.type.replaceAll("_", " ")}. Supporting costs principal influence.`,
        });
    }
    if (
      contract &&
      round % 6 === 0 &&
      !career.offers.some(
        (o) => o.characterId === actor.id && round - o.createdRound < 8,
      )
    ) {
      const clause = contract.releaseClauses.find(
        (c) =>
          isReleaseClauseInForce(contract, c, round) &&
          c.beneficiary !== "TEAM",
      );
      if (
        actor.career.transferInterest >= 45 ||
        actor.personality.ambition >= 80
      ) {
        const rival = career.world?.teams
          .filter(
            (t) =>
              t.seriesId === career.world!.playerSeriesId &&
              t.id !== career.world!.playerTeamId,
          )
          .sort((a, b) => b.reputation - a.reputation)[0];
        const club =
          rival?.name ?? (actor.role.includes("DRIVER") ? "Orion" : "Apex");
        career.offers.push({
          id: `offer_${actor.id}_r${round}`,
          characterId: actor.id,
          club,
          salary:
            Math.round(contract.salaryMillionsPerSeason * 1.2 * 100) / 100,
          fee:
            clause?.amountMillions ??
            Math.round(contract.salaryMillionsPerSeason * 1.5),
          clauseId: clause?.id ?? null,
          createdRound: round,
          expiresRound: round + 2,
          status: "OPEN",
        });
        actor.career.transferInterest = Math.min(
          100,
          actor.career.transferInterest + 10,
        );
        logCareer(next, `${club} makes an offer for ${actor.name}.`);
      }
    }
  }
  for (const request of career.requests.filter(
    (r) => r.status === "OPEN" && round > r.deadline,
  )) {
    request.status = "ESCALATED";
    const actor = next.political.characters.find(
      (c) => c.id === request.characterId,
    )!;
    actor.dynamic.instability = Math.min(100, actor.dynamic.instability + 15);
    actor.power.mediaInfluence = Math.min(100, actor.power.mediaInfluence + 5);
    const lever = next.political.leverages.find(
      (l) => l.ownerCharacterId === actor.id && l.active,
    );
    if (lever) lever.strength = Math.min(100, lever.strength + 8);
    const allies = next.political.relationships
      .filter(
        (r) =>
          r.fromCharacterId === actor.id &&
          r.toCharacterId !== principal.id &&
          career.activeActorIds.includes(r.toCharacterId) &&
          r.loyalty >= 65,
      )
      .map((r) => r.toCharacterId);
    next.political.conflicts.push({
      id: `conflict_${request.id}`,
      type:
        request.kind === "RENEWAL" || request.kind === "OPTION"
          ? "CONTRACT_DISPUTE"
          : "LEADERSHIP_CHALLENGE",
      status: "ESCALATED",
      initiatorCharacterId: actor.id,
      issue: request.summary.slice(0, 300),
      stakes: 70,
      publicExposure: 45,
      roundStarted: round,
      precedentIds: [],
      swingActorIds: [],
      factions: [
        {
          id: `faction_${request.id}_a`,
          leaderCharacterId: actor.id,
          memberCharacterIds: [actor.id, ...allies],
          alliancePower: actor.power.internalInfluence,
          legitimacy: 60,
          leverage: 65,
          friction: 20,
          momentum: 65,
        },
        {
          id: `faction_${request.id}_b`,
          leaderCharacterId: principal.id,
          memberCharacterIds: [principal.id],
          alliancePower: principal.power.internalInfluence,
          legitimacy: 75,
          leverage: 55,
          friction: 10,
          momentum: 50,
        },
      ],
    });
    logCareer(
      next,
      `${actor.name} escalates an unanswered ${request.kind.toLowerCase()} request to allies and media. It can still be addressed.`,
    );
  }
  for (const offer of [...career.offers].filter(
    (o) => ["OPEN", "REJECTED"].includes(o.status) && round > o.expiresRound,
  )) {
    const actor = next.political.characters.find(
      (c) => c.id === offer.characterId,
    )!;
    const contract = activeContract(next.political, actor.id, round);
    const clause = contract?.releaseClauses.find(
      (c) =>
        c.id === offer.clauseId &&
        isReleaseClauseInForce(contract!, c, round) &&
        c.beneficiary !== "TEAM",
    );
    if (
      clause &&
      actor.dynamic.instability >= 70 &&
      career.activeActorIds.includes(actor.id)
    ) {
      // A unilateral actor right is mandatory; the team cannot veto it for lack of cash.
      next = leaveTeam(
        next,
        actor.id,
        clause.amountMillions,
        0,
        `${actor.name} invokes the character release right and joins ${offer.club}`,
        true,
      ) as typeof next;
      next.career.offers.find((o) => o.id === offer.id)!.status = "DEPARTED";
      if (next.career.world) {
        const team = next.career.world.teams.find((t) => t.name === offer.club);
        if (team) transferWorldPerson(next.career.world, actor.id, team.id);
        syncWorldCandidates(next);
      }
    } else
      next.career.offers.find((o) => o.id === offer.id)!.status = "EXPIRED";
  }
  // Contract expiry removes the actor from the lineup until a new deal is agreed.
  for (const seat of [...next.career.seats])
    if (seat.characterId) {
      const contracts = next.political.contracts.filter(
        (c) => c.characterId === seat.characterId,
      );
      if (
        contracts.length &&
        !activeContract(next.political, seat.characterId, round)
      ) {
        const id = seat.characterId;
        next = leaveTeam(
          next,
          id,
          0,
          0,
          "Contract expired; the seat is vacant",
          true,
        ) as typeof next;
      }
    }
  return next;
}
