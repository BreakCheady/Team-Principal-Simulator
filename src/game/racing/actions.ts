import type { RoundFlowState } from "@/game/season/round-flow";
import { finishCareerWeekend } from "@/game/career/career";
import { careerCopy } from "@/game/career/market";
import {
  bookFinanceTransaction,
  getCashBalance,
  requireContractBudget,
  roundMoney,
} from "@/game/finance/finances";
import {
  transferWorldPerson,
  playerTeam,
  syncWorldCandidates,
} from "@/game/world/world";
import { crewSizeForSeries } from "./rules";
import { ModeSchema, type RacePlan, type Setup } from "./schema";
import {
  practice,
  qualify,
  setSetup,
  setPlan,
  startRace,
  stepRace,
  runWeekend,
  raceRules,
  logRace,
  raceRandom,
  liveOrder,
  gapToLeader,
} from "./engine";

function raceCopy(source: RoundFlowState) {
  if (
    !source.career?.weekend ||
    source.career.weekend.committed ||
    source.career.status !== "RUNNING"
  )
    throw new Error("No active race weekend.");
  return structuredClone(source);
}
export function runPractice(source: RoundFlowState) {
  const next = raceCopy(source);
  practice(next.career!.weekend!);
  return next;
}
export function runQualifying(source: RoundFlowState) {
  const next = raceCopy(source);
  qualify(next.career!.weekend!);
  return next;
}
export function updateRaceSetup(
  source: RoundFlowState,
  id: string,
  setup: Setup,
) {
  const next = raceCopy(source);
  setSetup(next.career!.weekend!, id, setup);
  return next;
}
export function updateRacePlan(
  source: RoundFlowState,
  id: string,
  plan: RacePlan,
) {
  const next = raceCopy(source);
  setPlan(next.career!.weekend!, id, plan);
  return next;
}
export function advanceRace(
  source: RoundFlowState,
  mode: "LAP" | "DECISION" | "FINISH",
) {
  const next = raceCopy(source),
    w = next.career!.weekend!;
  if (mode === "FINISH" || mode === "DECISION")
    runWeekend(w, mode === "DECISION");
  else {
    if (w.phase === "GRID") startRace(w);
    if (w.phase !== "RACING")
      throw new Error("Finish practice / qualifying before stepping the race.");
    stepRace(w);
  }
  return w.phase === "COMPLETE" ? finishCareerWeekend(next) : next;
}
export function commandDriver(
  source: RoundFlowState,
  id: string,
  mode: string,
) {
  const next = raceCopy(source),
    w = next.career!.weekend!,
    car = w.cars.find((c) => c.id === id && c.ours);
  if (!car || car.retired || w.phase !== "RACING")
    throw new Error("This car cannot receive race instructions.");
  car.mode = ModeSchema.parse(mode);
  logRace(
    w,
    "RADIO",
    `${car.name}: ${mode.toLowerCase()} instruction received.`,
    id,
  );
  return next;
}
export function callPit(
  source: RoundFlowState,
  id: string,
  compound: RacePlan["nextCompound"],
  repair: boolean,
  changeDriver: boolean,
) {
  const next = raceCopy(source),
    w = next.career!.weekend!,
    car = w.cars.find((c) => c.id === id && c.ours);
  if (!car || car.retired || w.phase !== "RACING")
    throw new Error("This car cannot pit.");
  if (w.seriesId === "RALLY")
    throw new Error("Rally crews use scheduled service parks.");
  if (w.pitClosed)
    throw new Error("Pit lane is temporarily closed under IndyCar caution.");
  if (!raceRules(w).compounds.includes(compound))
    throw new Error("Illegal tyre compound.");
  car.plan.nextCompound = compound;
  car.plan.repair = repair;
  car.plan.changeDriver = changeDriver;
  car.pitRequested = true;
  logRace(
    w,
    "RADIO",
    `${car.name}: box at the next opportunity on ${compound}.`,
    id,
  );
  return next;
}
export function retireRaceCar(source: RoundFlowState, id: string) {
  const next = raceCopy(source),
    w = next.career!.weekend!,
    car = w.cars.find((c) => c.id === id && c.ours);
  if (!car || car.retired || w.phase !== "RACING")
    throw new Error("This car cannot be retired.");
  car.retired = true;
  car.retirementReason = "Team withdraws damaged car";
  logRace(w, "RADIO", `${car.name} returns to the garage and retires.`, id);
  return next;
}
export function issueTeamOrder(
  source: RoundFlowState,
  giverId: string,
  receiverId: string,
) {
  const next = raceCopy(source),
    w = next.career!.weekend!,
    giver = w.cars.find((c) => c.id === giverId && c.ours),
    receiver = w.cars.find((c) => c.id === receiverId && c.ours);
  if (
    !giver ||
    !receiver ||
    giver.id === receiver.id ||
    giver.retired ||
    receiver.retired ||
    w.phase !== "RACING" ||
    w.seriesId === "RALLY" ||
    w.flag !== "GREEN"
  )
    throw new Error("No legal team-order opportunity.");
  const order = liveOrder(w);
  if (
    order.indexOf(receiver) !== order.indexOf(giver) + 1 ||
    giver.completedLaps !== receiver.completedLaps ||
    Math.abs(gapToLeader(w, giver) - gapToLeader(w, receiver)) > 5
  )
    throw new Error(
      "Cars must be adjacent on the same lap and within five seconds.",
    );
  const obeyed =
    raceRandom(w) * 100 <
    Math.max(
      15,
      Math.min(
        95,
        giver.trust + giver.discipline * 0.3 - giver.aggression * 0.2,
      ),
    );
  if (obeyed) {
    const ahead = giver.nextLapAt;
    giver.nextLapAt = receiver.nextLapAt + 0.5;
    receiver.nextLapAt = Math.max(receiver.lapStartedAt + 1, ahead);
  }
  w.teamOrders.push({ giver: giverId, receiver: receiverId, obeyed });
  logRace(
    w,
    "RADIO",
    `${giver.name} ${obeyed ? "lets" : "refuses to let"} ${receiver.name} through; sporting equality will need a discussion.`,
    giverId,
  );
  return next;
}

export function recruitRaceCrew(
  source: RoundFlowState,
  candidateId: string,
  leadId: string,
) {
  const next = careerCopy(source),
    w = next.career.world;
  if (!w) throw new Error("Crew recruitment needs a world career.");
  const team = playerTeam(w),
    crew = team.raceCrews?.find((c) => c.leadId === leadId),
    candidate = next.career.candidates.find((c) => c.id === candidateId);
  if (
    !crew ||
    !candidate ||
    candidate.status !== "AVAILABLE" ||
    !candidate.seat.startsWith("DRIVER")
  )
    throw new Error("No eligible crew candidate.");
  if (!team.drivers.includes(leadId))
    throw new Error(
      "Fill the car entry driver seat before recruiting its crew.",
    );
  const rally = w.playerSeriesId === "RALLY",
    capacity = crewSizeForSeries(w.playerSeriesId) - 1;
  if (rally ? !!crew.coDriverId : crew.members.length >= capacity)
    throw new Error("Release a crew member before filling this slot.");
  const salary = roundMoney(candidate.salary * 1.2),
    fee = candidate.buyout + candidate.signingFee,
    start = Math.max(1, next.currentRound + 1),
    duration = next.political.finance.roundsPerSeason;
  if (getCashBalance(next.political) < fee)
    throw new Error("Cash cannot cover the crew signing and buyout.");
  const id = candidate.character.id,
    contractId = `crew_${id}_r${start}_${next.political.contracts.length}`;
  const contract = {
    id: contractId,
    characterId: id,
    employer: team.name,
    status: "ACTIVE" as const,
    signedRound: Math.max(1, next.currentRound),
    startRound: start,
    endRound: start + duration - 1,
    salaryMillionsPerSeason: salary,
    guaranteedSalaryMillions: salary,
    salaryPaidMillions: 0,
    options: [],
    releaseClauses: [],
    performanceTriggers: [],
    earnedBonusesMillions: 0,
  };
  next.political.contracts.push(contract);
  requireContractBudget(
    next.political,
    contractId,
    contract,
    next.currentRound,
  );
  let actor = next.political.characters.find((c) => c.id === id);
  if (!actor) {
    actor = structuredClone(candidate.character);
    next.political.characters.push(actor);
  }
  actor.active = true;
  const goal = `goal_${id}_crew`;
  actor.goalIds = [goal];
  let g = next.political.goals.find((g) => g.id === goal);
  if (g) g.active = true;
  else {
    g = {
      id: goal,
      characterId: id,
      type: "PROTECT_TEAM_AUTHORITY",
      priority: 65,
      urgency: 40,
      progress: 0,
      visibility: "KNOWN",
      active: true,
    };
    next.political.goals.push(g);
  }
  next.career.activeActorIds.push(id);
  for (const other of next.political.characters.filter(
    (c) => c.id !== id && c.active !== false,
  ))
    for (const [from, to] of [
      [id, other.id],
      [other.id, id],
    ])
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
          loyalty: 45,
          respect: 65,
          dependency: 45,
          resentment: 0,
          personalLeverage: 0,
        });
  transferWorldPerson(w, id, team.id, leadId);
  w.people.find((p) => p.id === id)!.salary = salary;
  next.political = bookFinanceTransaction(next.political, {
    id: `signing_${contractId}`,
    round: Math.max(1, next.currentRound),
    category: "SIGNING_FEE",
    amountMillions: fee,
    description: `Crew signing: ${actor.name}`,
  });
  syncWorldCandidates(next);
  return next;
}
