import { createWorld } from "@/game/world/world";
import { ensureWorldCrews } from "@/game/racing/crews";
import type { RoundFlowState } from "@/game/season/round-flow";

// Only versioned legacy saves enter here. IDs, contracts, money and elapsed
// rounds remain stable; new competitors start with no invented past results.
export function migrateLegacyWec(state: unknown): unknown {
  const replace = (v: unknown): unknown => {
    if (typeof v === "string") return v === "LMP1" ? "WEC" : v.replaceAll("team_lmp1_", "team_wec_");
    if (Array.isArray(v)) return v.map(replace);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, replace(x)]));
    return v;
  };
  const flow = replace(state) as RoundFlowState;
  const world = flow?.career?.world;
  if (!world) return flow;
  const fresh = createWorld("WEC");
  const wecTeams = world.teams.filter((t) => t.seriesId === "WEC");
  if (wecTeams.length !== 8) return flow;
  for (const p of world.people.filter((p) => p.role === "DRIVER"))
    p.rating ??= p.skill < 70 ? "BRONZE" : p.skill < 80 ? "SILVER" : p.skill < 90 ? "GOLD" : "PLATINUM";
  for (const t of wecTeams) {
    t.classId = "HYPERCAR";
    for (const p of world.people.filter((p) => p.teamId === t.id))
      if (p.rating === "BRONZE") p.rating = "SILVER";
  }
  for (const original of fresh.teams.filter((t) => t.seriesId === "WEC" && !world.teams.some((x) => x.id === t.id))) {
    const t = structuredClone(original);
    const ids = [...t.drivers, ...t.staff, t.principalId];
    for (const id of ids) {
      const p = structuredClone(fresh.people.find((p) => p.id === id)!);
      p.id = `wec_new_${id}`;
      p.name = `${p.name} Endurance`;
      p.contractEndSeason += world.season - 1;
      world.people.push(p);
    }
    t.drivers = t.drivers.map((id) => `wec_new_${id}`);
    t.staff = t.staff.map((id) => `wec_new_${id}`);
    t.principalId = `wec_new_${t.principalId}`;
    world.teams.push(t);
  }
  for (const original of fresh.people.filter((p) => p.seriesId === "WEC" && p.role === "DRIVER" && !p.teamId)) {
    const p = structuredClone(original);
    p.id = `wec_reserve_${p.id}`; p.name = `${p.name} Reserve`;
    p.contractEndSeason += world.season - 1;
    world.people.push(p);
  }
  // Fill missing crews through existing persistent employment rules.
  ensureWorldCrews(world);
  const table = world.series.find((s) => s.seriesId === "WEC")!;
  for (const t of world.teams.filter((t) => t.seriesId === "WEC")) {
    let standing = table.teams.find((s) => s.teamId === t.id);
    if (!standing) { standing = { teamId: t.id, points: 0 }; table.teams.push(standing); }
    standing.classId = t.classId;
    for (const id of [...t.drivers, ...(t.raceCrews?.flatMap((c) => c.members) ?? [])]) {
      let d = table.drivers.find((d) => d.personId === id);
      if (!d) { d = { personId: id, points: 0, wins: 0, podiums: 0 }; table.drivers.push(d); }
      d.classId = t.classId;
    }
  }
  for (const r of table.lastResults) { r.classId = "HYPERCAR"; r.classPosition = r.position; }
  const career = flow.career!;
  if (world.playerSeriesId === "WEC") {
    for (const s of career.standings) s.classId = "HYPERCAR";
    for (const t of world.teams.filter((t) => t.seriesId === "WEC" && !wecTeams.includes(t)))
      for (const id of [...t.drivers, ...(t.raceCrews?.flatMap((c) => c.members) ?? [])]) {
        const p = world.people.find((p) => p.id === id)!;
        career.standings.push({ id, name: p.name, team: t.name, classId: t.classId, skill: p.skill, points: 0, wins: 0, podiums: 0 });
      }
    for (const r of career.races) for (const result of r.results) { result.classId = "HYPERCAR"; result.classPosition = result.position; }
    if (career.weekend) {
      const weekend = career.weekend;
      const traffic = new Set(weekend.cars.filter((c) => c.classId === "TRAFFIC").map((c) => c.id));
      weekend.cars = weekend.cars.filter((c) => !traffic.has(c.id));
      weekend.events = weekend.events.filter((e) => !e.carId || !traffic.has(e.carId));
      for (const c of weekend.cars) { c.classId = "HYPERCAR"; c.entryId = `${world.teams.find((t) => t.name === c.team)!.id}_car_${Math.max(1, (world.teams.find((t) => t.name === c.team)!.raceCrews?.findIndex((cr) => cr.leadId === c.id) ?? world.teams.find((t) => t.name === c.team)!.drivers.indexOf(c.id)) + 1)}`; for (const d of c.crew) d.rating = world.people.find((p) => p.id === d.id)?.rating; }
      // Finish the saved event at its original duration; new WEC calendar starts
      // with the next weekend, avoiding a mid-race clock or accounting reset.
      weekend.ruleId = "WEC_LEGACY_RESUMED";
    }
  }
  table.entries = world.teams.filter((t) => t.seriesId === "WEC").flatMap((t) => t.drivers.map((id, index) => ({ id: `${t.id}_car_${index + 1}`, teamId: t.id, classId: t.classId!, points: table.drivers.find((d) => d.personId === id)?.points ?? 0 })));
  for (const h of world.history.filter((h) => h.seriesId === "WEC")) h.classId = "HYPERCAR";
  return flow;
}
