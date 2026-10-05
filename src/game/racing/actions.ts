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
    throw new Error("Kein aktives Rennwochenende.");
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
      throw new Error("Beende Training und Qualifying, bevor du das Rennen fortsetzt.");
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
    throw new Error("Dieses Fahrzeug kann keine Rennanweisungen erhalten.");
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
    throw new Error("Dieses Fahrzeug kann nicht an die Box kommen.");
  if (w.seriesId === "RALLY")
    throw new Error("Rallye-Besatzungen nutzen die vorgesehenen Serviceparks.");
  if (w.pitClosed)
    throw new Error("Die Boxengasse ist während der IndyCar-Caution vorübergehend geschlossen.");
  if (!raceRules(w).compounds.includes(compound))
    throw new Error("Unzulässige Reifenmischung.");
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
    throw new Error("Dieses Fahrzeug kann nicht zurückgezogen werden.");
  car.retired = true;
  car.retirementReason = "Team zieht beschädigtes Fahrzeug zurück";
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
    throw new Error("Keine zulässige Gelegenheit für eine Teamorder.");
  const order = liveOrder(w);
  if (
    order.indexOf(receiver) !== order.indexOf(giver) + 1 ||
    giver.completedLaps !== receiver.completedLaps ||
    Math.abs(gapToLeader(w, giver) - gapToLeader(w, receiver)) > 5
  )
    throw new Error(
      "Die Fahrzeuge müssen direkt hintereinander in derselben Runde und innerhalb von fünf Sekunden liegen.",
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
    `${giver.name} ${obeyed ? "lets" : "weigert sich,"} ${receiver.name} through; sporting equality will need a discussion.`,
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
  if (!w) throw new Error("Die Rekrutierung der Fahrerbesatzung benötigt eine Weltkarriere.");
  const team = playerTeam(w),
    crew = team.raceCrews?.find((c) => c.leadId === leadId),
    candidate = next.career.candidates.find((c) => c.id === candidateId);
  if (
    !crew ||
    !candidate ||
    candidate.status !== "AVAILABLE" ||
    !candidate.seat.startsWith("DRIVER")
  )
    throw new Error("Kein geeigneter Kandidat für die Fahrerbesatzung.");
  if (!team.drivers.includes(leadId))
    throw new Error(
      "Besetze zuerst den Fahrerplatz des Fahrzeugs, bevor du weitere Besatzung verpflichtest.",
    );
  const rally = w.playerSeriesId === "RALLY",
    capacity = crewSizeForSeries(w.playerSeriesId) - 1;
  if (rally ? !!crew.coDriverId : crew.members.length >= capacity)
    throw new Error("Stelle zuerst ein Mitglied der Besatzung frei, bevor du diesen Platz besetzt.");
  const salary = roundMoney(candidate.salary * 1.2),
    fee = candidate.buyout + candidate.signingFee,
    start = Math.max(1, next.currentRound + 1),
    duration = next.political.finance.roundsPerSeason;
  if (getCashBalance(next.political) < fee)
    throw new Error("Der Kassenbestand reicht nicht für Verpflichtung und Ablöse der Fahrerbesatzung.");
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
