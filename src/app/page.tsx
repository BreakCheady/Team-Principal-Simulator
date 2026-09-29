import { demoConflictInput, demoState } from "@/game/data/demo-state";
import { calculateConflict } from "@/game/political/conflicts";
import { validatePoliticalCoreState } from "@/game/political/validation";

function format(value: number) {
  return value.toFixed(1);
}

export default function Home() {
  const validation = validatePoliticalCoreState(demoState);

  if (!validation.success) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-2xl font-bold">Political Core validation failed</h1>
        <pre className="mt-6 overflow-auto rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm">
          {JSON.stringify(validation.errors, null, 2)}
        </pre>
      </main>
    );
  }

  const conflict = validation.data.conflicts[0];
  const result = calculateConflict(validation.data, conflict, demoConflictInput);
  const [factionA, factionB] = conflict.factions;
  const nameById = new Map(
    validation.data.characters.map((character) => [character.id, character.name]),
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6 md:p-10">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
          Vanguard Racing · Round 14
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Team Principal Simulator
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Political Core vertical slice: people, power and paddock politics.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400">
                Active conflict
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Technical direction</h2>
            </div>
            <span className="rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-sm text-red-300">
              Escalation {format(result.escalation)}
            </span>
          </div>

          <p className="mt-5 leading-7 text-zinc-300">{conflict.issue}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[factionA, factionB].map((faction, index) => {
              const calculated = index === 0 ? result.factionA : result.factionB;

              return (
                <div
                  key={faction.id}
                  className="rounded-xl border border-zinc-800 bg-black/20 p-5"
                >
                  <p className="text-sm text-zinc-500">Faction</p>
                  <h3 className="mt-1 text-xl font-medium">
                    {nameById.get(faction.leaderCharacterId)}
                  </h3>
                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Strength</dt>
                      <dd>{format(calculated.strength)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Success chance</dt>
                      <dd>{format(calculated.successChance)}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Political cost</dt>
                      <dd>{calculated.politicalCost}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Legitimacy</dt>
                      <dd>{faction.legitimacy}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <button className="rounded-xl bg-zinc-100 px-4 py-3 font-medium text-zinc-950">
              Support Moretti
            </button>
            <button className="rounded-xl border border-zinc-700 px-4 py-3 font-medium">
              Offer compromise
            </button>
            <button className="rounded-xl bg-zinc-100 px-4 py-3 font-medium text-zinc-950">
              Support Chen
            </button>
          </div>
        </article>

        <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Political actors
          </p>
          <div className="mt-5 space-y-4">
            {validation.data.characters.map((character) => (
              <div
                key={character.id}
                className="rounded-xl border border-zinc-800 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{character.name}</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {character.role.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span className="text-sm text-zinc-400">
                    M {character.dynamic.momentum > 0 ? "+" : ""}
                    {character.dynamic.momentum}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-zinc-500">Internal</p>
                    <p className="mt-1 text-sm">{character.power.internalInfluence}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Sporting</p>
                    <p className="mt-1 text-sm">{character.power.sportingLeverage}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Owner</p>
                    <p className="mt-1 text-sm">{character.power.ownerAccess}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
