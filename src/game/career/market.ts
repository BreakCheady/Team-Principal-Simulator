import {
  playerTeam,
  transferWorldPerson,
  syncWorldCandidates,
} from "@/game/world/world";
import { getSeries } from "@/game/world/series";
import type { RoundFlowState } from "@/game/season/round-flow";
import {
  isReleaseClauseInForce,
  exerciseContractOption,
  syncContractCareerState,
} from "@/game/contracts/contracts";
import {
  bookFinanceTransaction,
  getCashBalance,
  requireContractBudget,
  settleTeamFinancesThroughRound,
  roundMoney,
} from "@/game/finance/finances";
import type { Contract, PoliticalCoreState } from "@/game/political/types";
import type { Seat } from "./state";

export function careerCopy(
  source: RoundFlowState,
): RoundFlowState & { career: NonNullable<RoundFlowState["career"]> } {
  if (!source.career) throw new Error("Career mode is not enabled.");
  if (source.career.status === "DISMISSED")
    throw new Error("Your tenure has ended.");
  return structuredClone(source) as RoundFlowState & {
    career: NonNullable<RoundFlowState["career"]>;
  };
}
export function logCareer(flow: RoundFlowState, text: string) {
  flow.career!.log.push({ round: flow.currentRound, text });
}
export function activeContract(
  state: PoliticalCoreState,
  characterId: string,
  round: number,
) {
  return state.contracts.find(
    (c) =>
      c.characterId === characterId &&
      c.status === "ACTIVE" &&
      c.startRound <= Math.max(1, round) &&
      c.endRound >= Math.max(1, round),
  );
}
export function leaveTeam(
  flow: RoundFlowState,
  characterId: string,
  income: number,
  releaseCost: number,
  reason: string,
  mandatory = false,
): RoundFlowState {
  const next = careerCopy(flow);
  if (next.currentRound > 0)
    next.political = settleTeamFinancesThroughRound(
      next.political,
      next.currentRound,
    );
  const contract = activeContract(
    next.political,
    characterId,
    next.currentRound,
  );
  if (contract) {
    const guarantee = roundMoney(
      Math.max(
        0,
        contract.guaranteedSalaryMillions - contract.salaryPaidMillions,
      ),
    );
    if (
      !mandatory &&
      releaseCost + guarantee > getCashBalance(next.political) + income
    )
      throw new Error(
        "Cash cannot cover the release payment and remaining guaranteed pay.",
      );
    contract.status = "TERMINATED";
    if (guarantee > 0) {
      contract.salaryPaidMillions = roundMoney(
        contract.salaryPaidMillions + guarantee,
      );
      next.political = bookFinanceTransaction(next.political, {
        id: `exit_guarantee_${contract.id}`,
        round: Math.max(1, next.currentRound),
        category: "GUARANTEE_SETTLEMENT",
        amountMillions: guarantee,
        contractId: contract.id,
        description: "Guaranteed pay on departure",
      });
    }
    next.political = syncContractCareerState(
      next.political,
      contract.id,
      Math.max(1, next.currentRound),
    );
  }
  for (const [category, amount] of [
    ["TRANSFER_INCOME", income],
    ["RELEASE_PAYMENT", releaseCost],
  ] as const)
    if (amount > 0)
      next.political = bookFinanceTransaction(next.political, {
        id: `${category.toLowerCase()}_${characterId}_r${next.currentRound}`,
        round: Math.max(1, next.currentRound),
        category,
        amountMillions: amount,
        description: reason,
      });
  next.political.characters.find((c) => c.id === characterId)!.active = false;
  next.career.activeActorIds = next.career.activeActorIds.filter(
    (id) => id !== characterId,
  );
  next.career.seats.forEach((s) => {
    if (s.characterId === characterId) s.characterId = null;
  });
  next.negotiations.forEach((s) => {
    if (
      s.characterId === characterId &&
      ["OPEN", "COUNTERED"].includes(s.status)
    )
      s.status = "REJECTED";
  });
  next.career.requests.forEach((r) => {
    if (
      r.characterId === characterId &&
      ["OPEN", "ESCALATED"].includes(r.status)
    )
      r.status = "REFUSED";
  });
  next.issues.forEach((issue) => {
    if (
      issue.initiatorCharacterId === characterId &&
      issue.status !== "RESOLVED"
    ) {
      issue.status = "RESOLVED";
      issue.lastUpdatedRound = next.currentRound;
    }
  });
  next.career.offers.forEach((o) => {
    if (o.characterId === characterId && o.status === "OPEN")
      o.status = "EXPIRED";
  });
  next.political.goals
    .filter((g) => g.characterId === characterId)
    .forEach((g) => (g.active = false));
  next.political.leverages
    .filter((l) => l.ownerCharacterId === characterId)
    .forEach((l) => (l.active = false));
  next.political.conflicts
    .filter(
      (c) =>
        c.status !== "RESOLVED" &&
        c.factions.some((f) => f.memberCharacterIds.includes(characterId)),
    )
    .forEach((c) => {
      c.status = "RESOLVED";
      c.outcome = "COMPROMISE";
      c.roundResolved = next.currentRound;
    });
  const name = next.political.characters.find(
    (c) => c.id === characterId,
  )!.name;
  for (const c of next.political.characters.filter((c) =>
    next.career.activeActorIds.includes(c.id),
  )) {
    c.dynamic.instability = Math.min(100, c.dynamic.instability + 4);
    const relationship = next.political.relationships.find(
      (r) => r.fromCharacterId === c.id && r.toCharacterId === characterId,
    );
    if (relationship && relationship.loyalty >= 65)
      c.power.internalInfluence = Math.max(0, c.power.internalInfluence - 6);
  }
  // Historic drivers retain earned championship points but do not race for Vanguard again.
  const standing = next.career.standings.find((s) => s.id === characterId);
  if (standing) standing.team = "Departed";
  logCareer(
    next,
    `${name} leaves. ${reason} Seat vacant; historical relationships and contract obligations remain recorded.`,
  );
  if (next.career.world) {
    transferWorldPerson(next.career.world, characterId, null);
    syncWorldCandidates(next);
  }
  return next;
}

export function releaseContract(
  source: RoundFlowState,
  contractId: string,
  clauseId: string,
): RoundFlowState {
  const next = careerCopy(source);
  const contract = next.political.contracts.find((c) => c.id === contractId);
  const clause = contract?.releaseClauses.find((c) => c.id === clauseId);
  if (
    !contract ||
    !clause ||
    !isReleaseClauseInForce(contract, clause, next.currentRound) ||
    clause.beneficiary === "CHARACTER"
  )
    throw new Error("No active team release right exists.");
  return leaveTeam(
    next,
    contract.characterId,
    0,
    clause.amountMillions,
    "Team exercises the release clause",
  );
}

export function respondTransferOffer(
  source: RoundFlowState,
  offerId: string,
  accept: boolean,
): RoundFlowState {
  let next = careerCopy(source);
  const offer = next.career.offers.find((o) => o.id === offerId);
  if (
    !offer ||
    offer.status !== "OPEN" ||
    next.currentRound > offer.expiresRound
  )
    throw new Error("Transfer offer is no longer open.");
  const actor = next.political.characters.find(
    (c) => c.id === offer.characterId,
  )!;
  if (accept) {
    const principal = next.political.characters.find(
      (c) => c.role === "TEAM_PRINCIPAL",
    )!;
    const trust =
      next.political.relationships.find(
        (r) =>
          r.fromCharacterId === actor.id && r.toCharacterId === principal.id,
      )?.trust ?? 50;
    if (actor.career.transferInterest + actor.personality.ambition - trust < 70)
      throw new Error("The actor does not consent to this transfer.");
    next = leaveTeam(
      next,
      actor.id,
      offer.fee,
      0,
      `Transfer to ${offer.club}`,
    ) as typeof next;
    next.career.offers.find((o) => o.id === offerId)!.status = "ACCEPTED";
    if (next.career.world) {
      const destination = next.career.world.teams.find(
        (t) => t.name === offer.club,
      );
      if (destination)
        transferWorldPerson(next.career.world, actor.id, destination.id);
      syncWorldCandidates(next);
    }
  } else {
    offer.status = "REJECTED";
    actor.dynamic.instability = Math.min(100, actor.dynamic.instability + 8);
    logCareer(
      next,
      `${actor.name}: rival offer refused; an active character-held release right may still allow departure.`,
    );
  }
  return next;
}

export function signCandidate(
  source: RoundFlowState,
  candidateId: string,
  seat: Seat,
  salary: number,
  duration: number,
): RoundFlowState {
  const next = careerCopy(source);
  const candidate = next.career.candidates.find((c) => c.id === candidateId);
  if (
    !candidate ||
    candidate.status !== "AVAILABLE" ||
    next.currentRound < candidate.availableFrom ||
    next.currentRound > candidate.availableUntil
  )
    throw new Error("Candidate is unavailable.");
  const target = next.career.seats.find((s) => s.seat === seat);
  const driverMatch =
    candidate.seat.startsWith("DRIVER") && seat.startsWith("DRIVER");
  if (
    !target ||
    target.characterId ||
    (!driverMatch && candidate.seat !== seat)
  )
    throw new Error("An appropriate vacant seat is required.");
  if (
    !Number.isFinite(salary) ||
    salary < candidate.salary ||
    !Number.isInteger(duration) ||
    duration <
      (next.career.world
        ? getSeries(next.career.world.playerSeriesId).rounds
        : 12) ||
    duration >
      (next.career.world
        ? Math.min(52, getSeries(next.career.world.playerSeriesId).rounds * 2)
        : 48)
  )
    throw new Error(
      next.career.world
        ? "Offer must meet the salary demand and span one or two valid series seasons (maximum 52 races)."
        : "Offer must meet salary demand and run for 12–48 rounds.",
    );
  const owner = next.political.characters.find(
    (c) => c.role === "TEAM_PRINCIPAL",
  )!;
  const acceptance =
    owner.dynamic.institutionalReputation +
    candidate.character.personality.compromiseWillingness -
    candidate.character.personality.ambition;
  if (acceptance < 10 && salary < candidate.salary * 1.2)
    throw new Error("Candidate wants a 20% premium to join this leadership.");
  if (next.currentRound > 0)
    next.political = settleTeamFinancesThroughRound(
      next.political,
      next.currentRound,
    );
  const fee = candidate.signingFee + candidate.buyout;
  if (getCashBalance(next.political) < fee)
    throw new Error("Insufficient cash for signing fee and buyout.");
  const id = candidate.character.id;
  if (!next.political.characters.some((c) => c.id === id))
    next.political.characters.push(structuredClone(candidate.character));
  const baseId = `contract_${id}_r${next.currentRound}`;
  const count = next.political.contracts.filter(
    (c) => c.id === baseId || c.id.startsWith(baseId + "_n"),
  ).length;
  const contract: Contract = {
    id: count ? `${baseId}_n${count + 1}` : baseId,
    characterId: id,
    employer: next.career.world
      ? playerTeam(next.career.world).name
      : "Vanguard Racing",
    status: "ACTIVE",
    signedRound: Math.max(1, next.currentRound),
    startRound: next.currentRound + 1,
    endRound: next.currentRound + duration,
    salaryMillionsPerSeason: roundMoney(salary),
    guaranteedSalaryMillions: roundMoney(
      (salary * duration) / next.political.finance.roundsPerSeason,
    ),
    salaryPaidMillions: 0,
    options: [
      {
        id: `option_${id}_r${next.currentRound}`,
        holder: "CHARACTER",
        exerciseFromRound: next.currentRound + duration - 4,
        exerciseUntilRound: next.currentRound + duration,
        extensionRounds: next.political.finance.roundsPerSeason,
        salaryMultiplier: 1.1,
        available: true,
        exercised: false,
      },
    ],
    releaseClauses: [
      {
        id: `release_${id}_r${next.currentRound}`,
        amountMillions: roundMoney(salary * 2),
        activeFromRound: next.currentRound + 6,
        expiresAfterRound: next.currentRound + duration,
        beneficiary: "BOTH",
        active: true,
      },
    ],
    performanceTriggers: [],
    earnedBonusesMillions: 0,
  };
  next.political.contracts.push(contract);
  next.political = bookFinanceTransaction(next.political, {
    id: `signing_${contract.id}`,
    round: Math.max(1, next.currentRound),
    category: "SIGNING_FEE",
    amountMillions: fee,
    description: `Signing and buyout: ${candidate.character.name}`,
  });
  requireContractBudget(
    next.political,
    contract.id,
    contract,
    next.currentRound,
  );
  candidate.status = "SIGNED";
  target.characterId = id;
  next.career.activeActorIds.push(id);
  for (const other of next.political.characters.filter(
    (c) => next.career.activeActorIds.includes(c.id) && c.id !== id,
  ))
    for (const [from, to] of [
      [id, other.id],
      [other.id, id],
    ]) {
      if (
        !next.political.relationships.some(
          (r) => r.fromCharacterId === from && r.toCharacterId === to,
        )
      )
        next.political.relationships.push({
          id: `rel_${from}_${to}`,
          fromCharacterId: from,
          toCharacterId: to,
          trust: 55,
          loyalty: 40,
          respect: 65,
          dependency: 40,
          resentment: 0,
          personalLeverage: 0,
        });
    }
  const actor = next.political.characters.find((c) => c.id === id)!;
  const goalId = `goal_${id}_career`;
  if (!next.political.goals.some((g) => g.id === goalId))
    next.political.goals.push({
      id: goalId,
      characterId: id,
      type: driverMatch ? "WIN_CHAMPIONSHIP" : "PROTECT_TEAM_AUTHORITY",
      priority: 80,
      urgency: 60,
      progress: 0,
      visibility: "KNOWN",
      active: true,
    });
  actor.active = true;
  actor.goalIds = [goalId];
  next.political.goals.find((g) => g.id === goalId)!.active = true;
  if (driverMatch) {
    const standing = next.career.standings.find((s) => s.id === id);
    if (standing)
      standing.team = next.career.world
        ? playerTeam(next.career.world).name
        : "Vanguard";
    else
      next.career.standings.push({
        id,
        name: actor.name,
        team: next.career.world
          ? playerTeam(next.career.world).name
          : "Vanguard",
        skill: candidate.skill,
        points: 0,
        wins: 0,
        podiums: 0,
      });
  }
  if (next.career.world) {
    transferWorldPerson(next.career.world, id, next.career.world.playerTeamId);
    const p = next.career.world.people.find((p) => p.id === id)!;
    p.salary = salary;
    p.contractEndSeason =
      next.career.season +
      Math.ceil(duration / next.political.finance.roundsPerSeason) -
      1;
    syncWorldCandidates(next);
  }
  logCareer(
    next,
    `${actor.name} signs for ${duration} rounds at €${salary}m per season. Fees €${fee}m; new relationships and ambitions enter the team.`,
  );
  return next;
}

export function agreeMutualOption(
  source: RoundFlowState,
  contractId: string,
  optionId: string,
): RoundFlowState {
  const next = careerCopy(source);
  if (
    next.negotiations.some(
      (s) =>
        s.contractId === contractId && ["OPEN", "COUNTERED"].includes(s.status),
    )
  )
    throw new Error("Finish renewal talks before exercising an option.");
  const contract = next.political.contracts.find((c) => c.id === contractId)!;
  const option = contract?.options.find((o) => o.id === optionId);
  if (
    !option ||
    option.holder !== "MUTUAL" ||
    !next.career.activeActorIds.includes(contract.characterId)
  )
    throw new Error("No mutual option exists.");
  const actor = next.political.characters.find(
    (c) => c.id === contract.characterId,
  )!;
  const trust =
    next.political.relationships.find(
      (r) =>
        r.fromCharacterId === actor.id &&
        next.political.characters.some(
          (c) => c.id === r.toCharacterId && c.role === "TEAM_PRINCIPAL",
        ),
    )?.trust ?? 50;
  if (
    trust +
      actor.personality.compromiseWillingness -
      actor.dynamic.instability <
    60
  )
    throw new Error("The actor refuses consent to this mutual extension.");
  if (next.currentRound > 0)
    next.political = settleTeamFinancesThroughRound(
      next.political,
      next.currentRound,
    );
  requireContractBudget(
    next.political,
    contractId,
    {
      salaryMillionsPerSeason: roundMoney(
        contract.salaryMillionsPerSeason * option.salaryMultiplier,
      ),
      guaranteedSalaryMillions: contract.guaranteedSalaryMillions,
      endRound: contract.endRound + option.extensionRounds,
    },
    next.currentRound,
  );
  next.political = exerciseContractOption(
    next.political,
    contractId,
    optionId,
    next.currentRound,
  );
  next.career.requests
    .filter(
      (r) =>
        r.optionId === optionId && ["OPEN", "ESCALATED"].includes(r.status),
    )
    .forEach((r) => {
      r.status = "SUPPORTED";
      const conflict = next.political.conflicts.find(
        (c) => c.id === `conflict_${r.id}`,
      );
      if (conflict) {
        conflict.status = "RESOLVED";
        conflict.outcome = "COMPROMISE";
        conflict.roundResolved = next.currentRound;
      }
    });
  logCareer(
    next,
    `${actor.name} and the team agree to exercise their mutual option.`,
  );
  return next;
}

export function terminateEmployment(
  source: RoundFlowState,
  characterId: string,
): RoundFlowState {
  const contract = activeContract(
    source.political,
    characterId,
    source.currentRound,
  );
  if (!source.career?.activeActorIds.includes(characterId) || !contract)
    throw new Error("No active employment contract exists.");
  return leaveTeam(
    source,
    characterId,
    0,
    0,
    "Employment terminated; outstanding guaranteed salary paid",
  );
}
