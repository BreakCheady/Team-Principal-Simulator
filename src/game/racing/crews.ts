import type { MotorsportWorld } from "@/game/world/schemas";
import { crewSizeForSeries } from "./rules";
import {
  characterFromPerson,
  playerTeam,
  syncWorldCandidates,
} from "@/game/world/world";
import type { RoundFlowState } from "@/game/season/round-flow";

// Existing car-entry drivers remain stable. Additional crew and co-drivers come
// from the same persistent pool, with actual employer and employment records.
export function ensureWorldCrews(world: MotorsportWorld) {
  for (const team of world.teams) {
    const count = crewSizeForSeries(team.seriesId);
    if (count === 1 && team.seriesId !== "RALLY") continue;
    if (team.raceCrews) continue;
    team.raceCrews = team.drivers.map((leadId) => ({
      leadId,
      members: [],
      coDriverId: null,
    }));
    for (const crew of team.raceCrews) {
      for (
        let n = 0;
        n < count - 1 + (team.seriesId === "RALLY" ? 1 : 0);
        n++
      ) {
        const p = world.people
          .filter(
            (p) =>
              p.role === "DRIVER" &&
              !p.teamId &&
              p.specialties.includes(team.seriesId),
          )
          .sort(
            (a, b) =>
              Number(a.seriesId !== team.seriesId) -
                Number(b.seriesId !== team.seriesId) ||
              b.skill - a.skill ||
              a.id.localeCompare(b.id),
          )[0];
        if (!p) throw new Error("The series has no crew reserve available.");
        p.teamId = team.id;
        p.seriesId = team.seriesId;
        p.contractEndSeason = world.season + 1;
        // Crew salaries reflect shared-car employment, not a separate car entry.
        p.salary = Number((p.salary * 0.4).toFixed(6));
        if (team.seriesId === "RALLY") crew.coDriverId = p.id;
        else crew.members.push(p.id);
      }
    }
  }
  for (const table of world.series) {
    for (const team of world.teams.filter((t) => t.seriesId === table.seriesId))
      for (const id of team.raceCrews?.flatMap((c) => c.members) ?? [])
        if (!table.drivers.some((d) => d.personId === id))
          table.drivers.push({ personId: id, points: 0, wins: 0, podiums: 0 });
    table.drivers = table.drivers.filter(
      (d) =>
        !world.teams.some((t) =>
          t.raceCrews?.some((c) => c.coDriverId === d.personId),
        ),
    );
  }
}
export function supportIds(world: MotorsportWorld, teamId: string) {
  return (
    world.teams
      .find((t) => t.id === teamId)
      ?.raceCrews?.flatMap((c) => [
        ...c.members,
        ...(c.coDriverId ? [c.coDriverId] : []),
      ]) ?? []
  );
}
export function registerPlayerCrews(flow: RoundFlowState) {
  const career = flow.career!,
    world = career.world;
  if (!world) return;
  ensureWorldCrews(world);
  const team = playerTeam(world),
    start = Math.max(1, flow.currentRound + 1),
    length = flow.political.finance.roundsPerSeason;
  for (const id of supportIds(world, team.id)) {
    if (flow.political.characters.some((c) => c.id === id)) continue;
    const p = world.people.find((p) => p.id === id)!,
      actor = characterFromPerson(p),
      goal = `goal_${id}_crew`;
    actor.goalIds = [goal];
    flow.political.characters.push(actor);
    career.activeActorIds.push(id);
    flow.political.goals.push({
      id: goal,
      characterId: id,
      type: "PROTECT_TEAM_AUTHORITY",
      priority: 65,
      urgency: 40,
      progress: 0,
      visibility: "KNOWN",
      active: true,
    });
    for (const other of flow.political.characters.filter(
      (c) => c.id !== id && c.active !== false,
    ))
      for (const [from, to] of [
        [id, other.id],
        [other.id, id],
      ])
        flow.political.relationships.push({
          id: `rel_${from}_${to}`,
          fromCharacterId: from,
          toCharacterId: to,
          trust: 65,
          loyalty: 55,
          respect: 65,
          dependency: 45,
          resentment: 0,
          personalLeverage: 0,
        });
    flow.political.contracts.push({
      id: `contract_${id}_crew_r${start}`,
      characterId: id,
      employer: team.name,
      status: "ACTIVE",
      signedRound: start,
      startRound: start,
      endRound: start + length - 1,
      salaryMillionsPerSeason: p.salary,
      guaranteedSalaryMillions: p.salary,
      salaryPaidMillions: 0,
      options: [],
      releaseClauses: [],
      performanceTriggers: [],
      earnedBonusesMillions: 0,
    });
  }
  if (team.raceCrews)
    flow.political.finance.payrollBudgetMillionsPerSeason = Math.max(
      flow.political.finance.payrollBudgetMillionsPerSeason,
      Number((team.budget * 0.48).toFixed(6)),
    );
  syncWorldCandidates(flow);
}
