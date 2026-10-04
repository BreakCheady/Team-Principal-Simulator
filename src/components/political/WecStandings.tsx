import type { MotorsportWorld } from "@/game/world/schemas";
import { WEC_CLASSES } from "@/game/world/series";

export function WecStandings({ world }: { world: MotorsportWorld }) {
  const table = world.series.find((s) => s.seriesId === "WEC")!;
  const teamName = (id: string) =>
    world.teams.find((t) => t.id === id)?.name ?? id;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {WEC_CLASSES.map((classId) => {
        const hypercar = classId === "HYPERCAR";
        const teams = hypercar
          ? table.teams.filter((t) => t.classId === classId).map((t) => ({
              id: t.teamId, name: teamName(t.teamId), points: t.points,
            }))
          : (table.entries ?? []).filter((e) => e.classId === classId).map((e) => ({
              id: e.id,
              name: `${teamName(e.teamId)} · #${e.id.split("_car_")[1]}`,
              points: e.points,
            }));
        teams.sort((a, b) => b.points - a.points || a.id.localeCompare(b.id));
        const drivers = table.drivers.filter((d) => d.classId === classId).sort(
          (a, b) => b.points - a.points || b.wins - a.wins ||
            a.personId.localeCompare(b.personId),
        );
        return (
          <article key={classId} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h4 className="font-semibold">
              {hypercar ? "Hypercar manufacturers championship" : "LMGT3 teams trophy · car entries"}
            </h4>
            <table className="mt-3 w-full text-left text-sm">
              <thead><tr><th>Pos</th><th>{hypercar ? "Manufacturer" : "Entry"}</th><th>Points</th></tr></thead>
              <tbody>
                {teams.map((t, i) => (
                  <tr key={t.id} className="border-t border-zinc-800">
                    <td className="py-2">{i + 1}</td><td>{t.name}</td><td>{t.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h4 className="mt-5 font-semibold">
              {hypercar ? "Hypercar driver championship" : "LMGT3 driver trophy"}
            </h4>
            <div className="mt-3 max-h-80 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead><tr><th>Pos</th><th>Driver</th><th>Points</th><th>Wins</th></tr></thead>
                <tbody>
                  {drivers.map((d, i) => (
                    <tr key={d.personId} className="border-t border-zinc-800">
                      <td className="py-2">{i + 1}</td>
                      <td>{world.people.find((p) => p.id === d.personId)?.name ?? d.personId}</td>
                      <td>{d.points}</td><td>{d.wins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        );
      })}
    </div>
  );
}
